const { createCanvas, loadImage } = require("@napi-rs/canvas");

// =====================================================
// NAVTA DIAGRAM CROP SERVICE - TIGHT VISUAL CROP
// =====================================================
// Uses @napi-rs/canvas only. No sharp dependency.
// IMPORTANT: Never falls back to questionBoundingBox.
//
// Diagram-only refinement:
// After the AI visualBoundingBox is cropped, this service removes obvious
// detached horizontal text bands at the TOP of the crop. It deliberately
// avoids trimming the bottom/left/right so diagram labels, axes, dimensions,
// masses, coordinates and option-independent annotations remain intact.

const DEFAULT_PADDING = Math.max(
  0,
  Math.min(
    0.01,
    Number(process.env.NAVTA_AI_VISUAL_CROP_PADDING || 0) || 0
  )
);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeBox = (box) => {
  if (!box) return null;

  let x;
  let y;
  let width;
  let height;

  if (Array.isArray(box) && box.length >= 4) {
    const [yMin, xMin, yMax, xMax] = box.map(Number);
    if ([yMin, xMin, yMax, xMax].every(Number.isFinite)) {
      x = xMin;
      y = yMin;
      width = xMax - xMin;
      height = yMax - yMin;
    }
  } else if (typeof box === "object") {
    const direct = [box.x, box.y, box.width, box.height].map(toFiniteNumber);
    if (direct.every((value) => value !== null)) {
      [x, y, width, height] = direct;
    } else {
      const xMin = toFiniteNumber(box.xMin ?? box.xmin ?? box.left);
      const yMin = toFiniteNumber(box.yMin ?? box.ymin ?? box.top);
      const xMax = toFiniteNumber(box.xMax ?? box.xmax ?? box.right);
      const yMax = toFiniteNumber(box.yMax ?? box.ymax ?? box.bottom);
      if ([xMin, yMin, xMax, yMax].every((value) => value !== null)) {
        x = xMin;
        y = yMin;
        width = xMax - xMin;
        height = yMax - yMin;
      }
    }
  }

  if (![x, y, width, height].every(Number.isFinite)) return null;
  if (x < 0 || y < 0 || width <= 0 || height <= 0) return null;

  const maxValue = Math.max(x, y, x + width, y + height);
  let divisor = 1;
  if (maxValue > 1 && maxValue <= 100) divisor = 100;
  else if (maxValue > 100 && maxValue <= 1000) divisor = 1000;
  else if (maxValue > 1000) return null;

  x /= divisor;
  y /= divisor;
  width /= divisor;
  height /= divisor;

  const left = clamp(x, 0, 1);
  const top = clamp(y, 0, 1);
  const right = clamp(x + width, 0, 1);
  const bottom = clamp(y + height, 0, 1);

  if (right <= left || bottom <= top) return null;

  return { x: left, y: top, width: right - left, height: bottom - top };
};

const isUsableVisualBox = (box) => {
  const normalized = normalizeBox(box);
  if (!normalized) return false;

  const area = normalized.width * normalized.height;

  return (
    normalized.width >= 0.003 &&
    normalized.height >= 0.003 &&
    area >= 0.00002 &&
    !(normalized.width >= 0.985 && normalized.height >= 0.985)
  );
};

const addVisualPadding = (box, padding = DEFAULT_PADDING) => {
  const normalized = normalizeBox(box);
  if (!normalized) return null;

  const safePadding = clamp(Number(padding) || 0, 0, 0.01);
  const padX = normalized.width * safePadding;
  const padY = normalized.height * safePadding;

  const left = clamp(normalized.x - padX, 0, 1);
  const top = clamp(normalized.y - padY, 0, 1);
  const right = clamp(normalized.x + normalized.width + padX, 0, 1);
  const bottom = clamp(normalized.y + normalized.height + padY, 0, 1);

  return { x: left, y: top, width: right - left, height: bottom - top };
};

const boundingBoxToPixels = ({
  boundingBox,
  imageWidth,
  imageHeight,
  padding = DEFAULT_PADDING,
}) => {
  const normalized = normalizeBox(boundingBox);
  if (!normalized || !isUsableVisualBox(normalized)) {
    throw new Error("A valid visualBoundingBox is required.");
  }

  const padded = addVisualPadding(normalized, padding);
  const sourceWidth = Number(imageWidth);
  const sourceHeight = Number(imageHeight);

  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    throw new Error("Invalid rendered page dimensions.");
  }

  let left = Math.floor(padded.x * sourceWidth);
  let top = Math.floor(padded.y * sourceHeight);
  let right = Math.ceil((padded.x + padded.width) * sourceWidth);
  let bottom = Math.ceil((padded.y + padded.height) * sourceHeight);

  left = clamp(left, 0, sourceWidth - 1);
  top = clamp(top, 0, sourceHeight - 1);
  right = clamp(right, left + 1, sourceWidth);
  bottom = clamp(bottom, top + 1, sourceHeight);

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    normalizedBoundingBox: padded,
    originalBoundingBox: normalized,
  };
};

// Returns true when a pixel is visibly non-white / non-background.
const isInkPixel = (data, index) => {
  const alpha = data[index + 3];
  if (alpha < 20) return false;

  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];

  // PDF pages are rendered on white. This threshold keeps anti-aliased
  // black/grey diagram strokes while ignoring near-white background noise.
  return r < 238 || g < 238 || b < 238;
};

const getRowInkStats = (imageData, width, height) => {
  const rows = new Array(height);

  for (let y = 0; y < height; y += 1) {
    let ink = 0;
    let firstX = width;
    let lastX = -1;

    const rowStart = y * width * 4;

    for (let x = 0; x < width; x += 1) {
      const index = rowStart + x * 4;
      if (!isInkPixel(imageData.data, index)) continue;

      ink += 1;
      if (x < firstX) firstX = x;
      if (x > lastX) lastX = x;
    }

    rows[y] = {
      ink,
      density: width > 0 ? ink / width : 0,
      span:
        lastX >= firstX && width > 0
          ? (lastX - firstX + 1) / width
          : 0,
    };
  }

  return rows;
};

const findTopDiagramTrim = (canvas) => {
  const width = Number(canvas.width);
  const height = Number(canvas.height);

  // Do not refine very small crops. They are already likely diagram-only.
  if (width < 120 || height < 120) return 0;

  const context = canvas.getContext("2d");
  const imageData = context.getImageData(0, 0, width, height);
  const rows = getRowInkStats(imageData, width, height);

  // Only inspect the upper portion. This prevents the heuristic from
  // accidentally trimming labels belonging to the lower diagram.
  const searchEnd = Math.max(
    1,
    Math.min(height - 1, Math.floor(height * 0.48))
  );

  const activeThreshold = Math.max(2, Math.floor(width * 0.003));
  const blankThreshold = Math.max(1, Math.floor(width * 0.0015));
  const minGap = Math.max(8, Math.floor(height * 0.025));
  const maxGap = Math.max(minGap, Math.floor(height * 0.16));

  let lastTopInk = -1;
  let gapStart = -1;

  for (let y = 0; y < searchEnd; y += 1) {
    const row = rows[y];
    const active =
      row.ink >= activeThreshold ||
      row.density >= 0.004 ||
      row.span >= 0.08;

    if (active) {
      if (gapStart >= 0 && lastTopInk >= 0) {
        const gapSize = y - gapStart;

        if (gapSize >= minGap && gapSize <= maxGap) {
          // Measure the content before the gap. A detached prose/corrupt-glyph
          // band usually has many ink pixels and a wide horizontal span.
          let topInk = 0;
          let topWideRows = 0;
          let topActiveRows = 0;

          for (let ty = 0; ty <= lastTopInk; ty += 1) {
            const topRow = rows[ty];
            topInk += topRow.ink;

            if (topRow.ink >= activeThreshold) {
              topActiveRows += 1;
            }

            if (topRow.span >= 0.28) {
              topWideRows += 1;
            }
          }

          // Measure the content after the gap. Require meaningful diagram ink
          // so an empty/accidental region is never selected as the new top.
          let lowerInk = 0;
          const lowerEnd = Math.min(
            height,
            y + Math.max(30, Math.floor(height * 0.2))
          );

          for (let ly = y; ly < lowerEnd; ly += 1) {
            lowerInk += rows[ly].ink;
          }

          const looksLikeDetachedTextBand =
            topInk >= width * 0.25 &&
            topActiveRows >= 3 &&
            (topWideRows >= 1 || topInk >= width * 0.6);

          const hasDiagramBelow = lowerInk >= width * 0.12;

          if (looksLikeDetachedTextBand && hasDiagramBelow) {
            // Keep a tiny amount of whitespace above the real diagram.
            return Math.max(
              0,
              gapStart - Math.max(2, Math.floor(height * 0.008))
            );
          }
        }
      }

      lastTopInk = y;
      gapStart = -1;
    } else if (
      lastTopInk >= 0 &&
      gapStart < 0 &&
      row.ink <= blankThreshold
    ) {
      gapStart = y;
    }
  }

  return 0;
};

const refineTopOfVisualCrop = (canvas) => {
  const trimTop = findTopDiagramTrim(canvas);
  if (!trimTop || trimTop <= 0 || trimTop >= canvas.height - 1) {
    return {
      canvas,
      trimTop: 0,
    };
  }

  const refinedHeight = canvas.height - trimTop;

  // Safety: never throw away most of the proposed visual.
  if (refinedHeight < Math.max(70, Math.floor(canvas.height * 0.5))) {
    return {
      canvas,
      trimTop: 0,
    };
  }

  const refinedCanvas = createCanvas(canvas.width, refinedHeight);
  const refinedContext = refinedCanvas.getContext("2d");
  refinedContext.fillStyle = "#ffffff";
  refinedContext.fillRect(0, 0, refinedCanvas.width, refinedCanvas.height);

  refinedContext.drawImage(
    canvas,
    0,
    trimTop,
    canvas.width,
    refinedHeight,
    0,
    0,
    canvas.width,
    refinedHeight
  );

  return {
    canvas: refinedCanvas,
    trimTop,
  };
};

const cropVisualFromPage = async ({
  pageBuffer,
  boundingBox,
  padding = DEFAULT_PADDING,
}) => {
  if (!Buffer.isBuffer(pageBuffer) || pageBuffer.length === 0) {
    throw new Error("A valid rendered PDF page buffer is required.");
  }

  const sourceImage = await loadImage(pageBuffer);
  const imageWidth = Number(sourceImage.width);
  const imageHeight = Number(sourceImage.height);

  if (!imageWidth || !imageHeight) {
    throw new Error("Unable to determine rendered page dimensions.");
  }

  const crop = boundingBoxToPixels({
    boundingBox,
    imageWidth,
    imageHeight,
    padding,
  });

  const initialCanvas = createCanvas(crop.width, crop.height);
  const initialContext = initialCanvas.getContext("2d");
  initialContext.fillStyle = "#ffffff";
  initialContext.fillRect(0, 0, crop.width, crop.height);

  initialContext.drawImage(
    sourceImage,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  // Remove only an obvious detached text/glyph band ABOVE the real diagram.
  // If the heuristic is not confident, the original AI crop is preserved.
  const refined = refineTopOfVisualCrop(initialCanvas);
  const finalCanvas = refined.canvas;

  const buffer = await finalCanvas.encode("png");

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("NAVTA could not encode the cropped visual.");
  }

  const topShiftNormalized =
    refined.trimTop > 0
      ? (refined.trimTop / imageHeight)
      : 0;

  const finalBoundingBox = {
    x: crop.normalizedBoundingBox.x,
    y: clamp(
      crop.normalizedBoundingBox.y + topShiftNormalized,
      0,
      1
    ),
    width: crop.normalizedBoundingBox.width,
    height: clamp(
      crop.normalizedBoundingBox.height - topShiftNormalized,
      0,
      1
    ),
  };

  return {
    buffer,
    mimeType: "image/png",
    width: finalCanvas.width,
    height: finalCanvas.height,
    crop: {
      ...crop,
      y: crop.y + refined.trimTop,
      height: finalCanvas.height,
      normalizedBoundingBox: finalBoundingBox,
      autoTrimTop: refined.trimTop,
    },
    boundingBox: finalBoundingBox,
    originalBoundingBox: crop.originalBoundingBox,
  };
};

const createQuestionDiagram = async ({
  question,
  pageBuffer,
  padding = DEFAULT_PADDING,
}) => {
  if (!question || typeof question !== "object") return null;
  if (!question.hasVisual || !question.visualBoundingBox) return null;

  const visualBoundingBox = normalizeBox(question.visualBoundingBox);
  if (!visualBoundingBox || !isUsableVisualBox(visualBoundingBox)) return null;

  return cropVisualFromPage({
    pageBuffer,
    boundingBox: visualBoundingBox,
    padding,
  });
};

const createOptionDiagram = async ({
  pageBuffer,
  boundingBox,
  padding = DEFAULT_PADDING,
}) => {
  const optionBox = normalizeBox(boundingBox);
  if (!optionBox || !isUsableVisualBox(optionBox)) return null;

  // Option images should remain exact. Do not run question-diagram top-band
  // refinement on answer-option artwork.
  if (!Buffer.isBuffer(pageBuffer) || pageBuffer.length === 0) {
    throw new Error("A valid rendered PDF page buffer is required.");
  }

  const sourceImage = await loadImage(pageBuffer);
  const imageWidth = Number(sourceImage.width);
  const imageHeight = Number(sourceImage.height);

  const crop = boundingBoxToPixels({
    boundingBox: optionBox,
    imageWidth,
    imageHeight,
    padding,
  });

  const canvas = createCanvas(crop.width, crop.height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, crop.width, crop.height);

  context.drawImage(
    sourceImage,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  const buffer = await canvas.encode("png");

  return {
    buffer,
    mimeType: "image/png",
    width: crop.width,
    height: crop.height,
    crop,
    boundingBox: crop.normalizedBoundingBox,
    originalBoundingBox: crop.originalBoundingBox,
  };
};

module.exports = {
  DEFAULT_PADDING,
  normalizeBox,
  isUsableVisualBox,
  addVisualPadding,
  boundingBoxToPixels,
  cropVisualFromPage,
  createQuestionDiagram,
  createOptionDiagram,
};

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

const rowIsActive = (row, width) => {
  const activeThreshold = Math.max(2, Math.floor(width * 0.003));
  return (
    row.ink >= activeThreshold ||
    row.density >= 0.004 ||
    row.span >= 0.08
  );
};

const findTopDiagramTrim = (rows, width, height) => {
  const searchEnd = Math.max(
    1,
    Math.min(height - 1, Math.floor(height * 0.48))
  );

  const blankThreshold = Math.max(1, Math.floor(width * 0.0015));
  const minGap = Math.max(8, Math.floor(height * 0.025));
  const maxGap = Math.max(minGap, Math.floor(height * 0.16));

  let lastTopInk = -1;
  let gapStart = -1;

  for (let y = 0; y < searchEnd; y += 1) {
    const row = rows[y];

    if (rowIsActive(row, width)) {
      if (gapStart >= 0 && lastTopInk >= 0) {
        const gapSize = y - gapStart;

        if (gapSize >= minGap && gapSize <= maxGap) {
          let topInk = 0;
          let topWideRows = 0;
          let topActiveRows = 0;

          for (let ty = 0; ty <= lastTopInk; ty += 1) {
            const topRow = rows[ty];
            topInk += topRow.ink;
            if (rowIsActive(topRow, width)) topActiveRows += 1;
            if (topRow.span >= 0.28) topWideRows += 1;
          }

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
            return Math.max(
              0,
              gapStart - Math.max(3, Math.floor(height * 0.012))
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

const findBottomDiagramTrim = (rows, width, height, topTrim = 0) => {
  // Look for a clear whitespace separator followed by a detached lower block.
  // This targets answer-choice rows below a diagram without cropping labels
  // that remain visually connected to the diagram itself.
  const searchStart = Math.max(
    topTrim + Math.floor((height - topTrim) * 0.42),
    Math.floor(height * 0.35)
  );
  const searchEnd = Math.min(height - 1, Math.floor(height * 0.94));

  const blankThreshold = Math.max(1, Math.floor(width * 0.0015));
  const minGap = Math.max(9, Math.floor(height * 0.025));
  const maxGap = Math.max(minGap, Math.floor(height * 0.18));
  const bottomSafety = Math.max(8, Math.floor(height * 0.025));

  let lastUpperInk = -1;
  let gapStart = -1;

  for (let y = searchStart; y < searchEnd; y += 1) {
    const row = rows[y];

    if (rowIsActive(row, width)) {
      if (gapStart >= 0 && lastUpperInk >= 0) {
        const gapSize = y - gapStart;

        if (gapSize >= minGap && gapSize <= maxGap) {
          // Ensure substantial diagram content exists above this gap.
          let upperInk = 0;
          const upperStart = Math.max(
            topTrim,
            lastUpperInk - Math.floor(height * 0.30)
          );
          for (let uy = upperStart; uy <= lastUpperInk; uy += 1) {
            upperInk += rows[uy].ink;
          }

          // Measure detached content below the gap. MCQ choices commonly form
          // several active rows / glyph clusters after a whitespace separator.
          let lowerInk = 0;
          let lowerActiveRows = 0;
          let lowerWideRows = 0;
          const lowerEnd = Math.min(
            height,
            y + Math.max(45, Math.floor(height * 0.28))
          );

          for (let ly = y; ly < lowerEnd; ly += 1) {
            const lowerRow = rows[ly];
            lowerInk += lowerRow.ink;
            if (rowIsActive(lowerRow, width)) lowerActiveRows += 1;
            if (lowerRow.span >= 0.16) lowerWideRows += 1;
          }

          const hasDiagramAbove = upperInk >= width * 0.16;
          const looksLikeDetachedLowerBlock =
            lowerInk >= width * 0.18 &&
            lowerActiveRows >= 4 &&
            (lowerWideRows >= 1 || lowerInk >= width * 0.45);

          if (hasDiagramAbove && looksLikeDetachedLowerBlock) {
            // Stop in the whitespace gap, but keep a safety margin beneath
            // genuine diagram labels/coordinates.
            return Math.min(
              height,
              Math.max(
                lastUpperInk + bottomSafety,
                gapStart + Math.floor(gapSize * 0.35)
              )
            );
          }
        }
      }

      lastUpperInk = y;
      gapStart = -1;
    } else if (
      lastUpperInk >= 0 &&
      gapStart < 0 &&
      row.ink <= blankThreshold
    ) {
      gapStart = y;
    }
  }

  return height;
};

const refineVisualCrop = (canvas) => {
  const width = Number(canvas.width);
  const height = Number(canvas.height);

  if (width < 120 || height < 120) {
    return {
      canvas,
      trimTop: 0,
      trimBottom: 0,
    };
  }

  const context = canvas.getContext("2d");
  const imageData = context.getImageData(0, 0, width, height);
  const rows = getRowInkStats(imageData, width, height);

  const trimTop = findTopDiagramTrim(rows, width, height);
  const bottomEdge = findBottomDiagramTrim(
    rows,
    width,
    height,
    trimTop
  );

  const safeBottomEdge = clamp(bottomEdge, trimTop + 1, height);
  const refinedHeight = safeBottomEdge - trimTop;

  // Never allow the heuristic to remove most of the proposed diagram.
  if (
    refinedHeight < Math.max(70, Math.floor(height * 0.48))
  ) {
    return {
      canvas,
      trimTop: 0,
      trimBottom: 0,
    };
  }

  if (trimTop === 0 && safeBottomEdge === height) {
    return {
      canvas,
      trimTop: 0,
      trimBottom: 0,
    };
  }

  const refinedCanvas = createCanvas(width, refinedHeight);
  const refinedContext = refinedCanvas.getContext("2d");
  refinedContext.fillStyle = "#ffffff";
  refinedContext.fillRect(
    0,
    0,
    refinedCanvas.width,
    refinedCanvas.height
  );

  refinedContext.drawImage(
    canvas,
    0,
    trimTop,
    width,
    refinedHeight,
    0,
    0,
    width,
    refinedHeight
  );

  return {
    canvas: refinedCanvas,
    trimTop,
    trimBottom: height - safeBottomEdge,
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

  // Remove confident detached text/glyph bands above or below the real
  // diagram. If the heuristic is not confident, the original crop is kept.
  const refined = refineVisualCrop(initialCanvas);
  const finalCanvas = refined.canvas;

  const buffer = await finalCanvas.encode("png");

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("NAVTA could not encode the cropped visual.");
  }

  const topShiftNormalized =
    refined.trimTop > 0
      ? refined.trimTop / imageHeight
      : 0;

  const bottomShiftNormalized =
    refined.trimBottom > 0
      ? refined.trimBottom / imageHeight
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
      crop.normalizedBoundingBox.height -
        topShiftNormalized -
        bottomShiftNormalized,
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
      autoTrimBottom: refined.trimBottom,
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

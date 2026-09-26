const { createCanvas, loadImage } = require("@napi-rs/canvas");

// =====================================================
// NAVTA DIAGRAM CROP SERVICE - 503 SAFE
// =====================================================
// Uses @napi-rs/canvas only. No sharp dependency.
// Never falls back to questionBoundingBox.

const DEFAULT_PADDING = Math.max(
  0,
  Math.min(
    0.08,
    Number(process.env.NAVTA_AI_VISUAL_CROP_PADDING || 0.025) || 0.025
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
  return (
    normalized.width >= 0.003 &&
    normalized.height >= 0.003 &&
    !(normalized.width >= 0.985 && normalized.height >= 0.985)
  );
};

const addVisualPadding = (box, padding = DEFAULT_PADDING) => {
  const normalized = normalizeBox(box);
  if (!normalized) return null;

  const safePadding = clamp(Number(padding) || 0, 0, 0.08);
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

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("NAVTA could not encode the cropped visual.");
  }

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

  return cropVisualFromPage({
    pageBuffer,
    boundingBox: optionBox,
    padding,
  });
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

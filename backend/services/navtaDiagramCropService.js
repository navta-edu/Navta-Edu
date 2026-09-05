const {
  createCanvas,
  loadImage,
} = require("@napi-rs/canvas");

// =====================================================
// SETTINGS
// =====================================================

const DEFAULT_PADDING = 18;
const MIN_CROP_SIZE = 20;

// =====================================================
// HELPERS
// =====================================================

const clamp = (value, minimum, maximum) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return minimum;
  }

  return Math.min(maximum, Math.max(minimum, number));
};

// =====================================================
// NORMALIZE BOUNDING BOX
// =====================================================

const normalizeBoundingBox = (boundingBox) => {
  if (!boundingBox || typeof boundingBox !== "object") {
    throw new Error("A question bounding box is required.");
  }

  let x = Number(boundingBox.x);
  let y = Number(boundingBox.y);
  let width = Number(boundingBox.width);
  let height = Number(boundingBox.height);

  if (![x, y, width, height].every(Number.isFinite)) {
    throw new Error("Question bounding box contains invalid numbers.");
  }

  // Accept either normalized 0..1 values or percentages 0..100.
  if (x > 1 || y > 1 || width > 1 || height > 1) {
    if (
      x >= 0 &&
      y >= 0 &&
      x <= 100 &&
      y <= 100 &&
      width <= 100 &&
      height <= 100
    ) {
      x /= 100;
      y /= 100;
      width /= 100;
      height /= 100;
    }
  }

  x = clamp(x, 0, 1);
  y = clamp(y, 0, 1);
  width = clamp(width, 0, 1);
  height = clamp(height, 0, 1);

  width = Math.min(width, 1 - x);
  height = Math.min(height, 1 - y);

  if (width <= 0 || height <= 0) {
    throw new Error("Invalid question bounding box.");
  }

  return {
    x,
    y,
    width,
    height,
  };
};

// =====================================================
// CONVERT NORMALIZED BOX TO PIXELS
// =====================================================

const boundingBoxToPixels = ({
  boundingBox,
  imageWidth,
  imageHeight,
  padding = DEFAULT_PADDING,
}) => {
  const safeImageWidth = Number(imageWidth);
  const safeImageHeight = Number(imageHeight);

  if (
    !Number.isFinite(safeImageWidth) ||
    !Number.isFinite(safeImageHeight) ||
    safeImageWidth <= 0 ||
    safeImageHeight <= 0
  ) {
    throw new Error("Invalid source image dimensions.");
  }

  const box = normalizeBoundingBox(boundingBox);

  const rawX = Math.round(box.x * safeImageWidth);
  const rawY = Math.round(box.y * safeImageHeight);
  const rawWidth = Math.round(box.width * safeImageWidth);
  const rawHeight = Math.round(box.height * safeImageHeight);

  const safePadding = Math.max(0, Number(padding) || 0);

  const x = Math.max(0, rawX - safePadding);
  const y = Math.max(0, rawY - safePadding);

  const right = Math.min(
    safeImageWidth,
    rawX + rawWidth + safePadding
  );

  const bottom = Math.min(
    safeImageHeight,
    rawY + rawHeight + safePadding
  );

  const width = Math.round(right - x);
  const height = Math.round(bottom - y);

  if (width < MIN_CROP_SIZE || height < MIN_CROP_SIZE) {
    throw new Error("The detected question area is too small.");
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width,
    height,
  };
};

// =====================================================
// CROP QUESTION / DIAGRAM
// =====================================================

const cropQuestionDiagram = async ({
  pageBuffer,
  boundingBox,
  padding = DEFAULT_PADDING,
}) => {
  if (!Buffer.isBuffer(pageBuffer) || pageBuffer.length === 0) {
    throw new Error("A valid rendered page buffer is required.");
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
    throw new Error("NAVTA could not encode the cropped question image.");
  }

  return {
    buffer,
    mimeType: "image/png",
    width: crop.width,
    height: crop.height,
    crop,
  };
};

// =====================================================
// PROCESS QUESTION VISUAL
// =====================================================

const createQuestionDiagram = async ({
  question,
  pageBuffer,
  padding = DEFAULT_PADDING,
}) => {
  if (!question || typeof question !== "object") {
    return null;
  }

  if (!question.hasVisual || !question.visualBoundingBox) {
    return null;
  }

  return cropQuestionDiagram({
    pageBuffer,
    boundingBox: question.visualBoundingBox,
    padding,
  });
};

module.exports = {
  normalizeBoundingBox,
  boundingBoxToPixels,
  cropQuestionDiagram,
  createQuestionDiagram,
};

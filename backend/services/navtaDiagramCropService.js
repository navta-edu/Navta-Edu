const sharp = require("sharp");

// =====================================================
// NAVTA DIAGRAM CROP SERVICE
// Exact visual-only cropping for:
// - diagrams
// - graphs
// - circuits
// - geometry
// - biology figures
// - chemistry structures/reaction schemes
// - visual MCQ options
// =====================================================

const DEFAULT_PADDING = Math.max(
  0,
  Math.min(
    0.03,
    Number(
      process.env.NAVTA_AI_VISUAL_CROP_PADDING ||
      0.008
    ) || 0.008
  )
);

// =====================================================
// HELPERS
// =====================================================

function clamp(
  value,
  min,
  max
) {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}

function toFiniteNumber(
  value
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

// =====================================================
// NORMALIZE BOUNDING BOX
// =====================================================
//
// Expected format:
//
// {
//   x: 0.10,
//   y: 0.20,
//   width: 0.50,
//   height: 0.30
// }
//
// Coordinates are normalized from 0 -> 1.
//
// Gemini may occasionally return 0 -> 100 percentages.
// We safely support that too.
// =====================================================

function normalizeBox(
  box
) {
  if (
    !box ||
    typeof box !== "object"
  ) {
    return null;
  }

  let x =
    toFiniteNumber(
      box.x
    );

  let y =
    toFiniteNumber(
      box.y
    );

  let width =
    toFiniteNumber(
      box.width
    );

  let height =
    toFiniteNumber(
      box.height
    );

  if (
    x === null ||
    y === null ||
    width === null ||
    height === null
  ) {
    return null;
  }

  // ---------------------------------------------
  // Support Gemini percentage coordinates
  // ---------------------------------------------

  if (
    x > 1 ||
    y > 1 ||
    width > 1 ||
    height > 1
  ) {
    const looksLikePercentage =
      x >= 0 &&
      y >= 0 &&
      x <= 100 &&
      y <= 100 &&
      width > 0 &&
      height > 0 &&
      width <= 100 &&
      height <= 100;

    if (
      !looksLikePercentage
    ) {
      return null;
    }

    x /= 100;
    y /= 100;
    width /= 100;
    height /= 100;
  }

  if (
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  const left =
    clamp(
      x,
      0,
      1
    );

  const top =
    clamp(
      y,
      0,
      1
    );

  const right =
    clamp(
      x + width,
      0,
      1
    );

  const bottom =
    clamp(
      y + height,
      0,
      1
    );

  if (
    right <= left ||
    bottom <= top
  ) {
    return null;
  }

  return {
    x:
      left,

    y:
      top,

    width:
      right - left,

    height:
      bottom - top,
  };
}

// =====================================================
// VALIDATE VISUAL BOX
// =====================================================

function isUsableVisualBox(
  box
) {
  const normalized =
    normalizeBox(
      box
    );

  if (
    !normalized
  ) {
    return false;
  }

  // Prevent microscopic / accidental crops.

  if (
    normalized.width <
      0.003 ||
    normalized.height <
      0.003
  ) {
    return false;
  }

  // A genuine visual should not normally occupy
  // virtually the complete page.
  //
  // This helps protect NAVTA against Gemini returning
  // the whole page as a diagram crop.

  if (
    normalized.width >
      0.98 &&
    normalized.height >
      0.98
  ) {
    return false;
  }

  return true;
}

// =====================================================
// APPLY VERY SMALL VISUAL PADDING
// =====================================================
//
// IMPORTANT:
//
// Padding is relative to the VISUAL dimensions,
// not the complete page.
//
// This prevents a small diagram from receiving
// a huge page-level margin.
// =====================================================

function addVisualPadding(
  box,
  padding =
    DEFAULT_PADDING
) {
  const normalized =
    normalizeBox(
      box
    );

  if (
    !normalized
  ) {
    return null;
  }

  const safePadding =
    clamp(
      Number(
        padding
      ) || 0,
      0,
      0.03
    );

  const padX =
    normalized.width *
    safePadding;

  const padY =
    normalized.height *
    safePadding;

  const left =
    clamp(
      normalized.x -
        padX,
      0,
      1
    );

  const top =
    clamp(
      normalized.y -
        padY,
      0,
      1
    );

  const right =
    clamp(
      normalized.x +
        normalized.width +
        padX,
      0,
      1
    );

  const bottom =
    clamp(
      normalized.y +
        normalized.height +
        padY,
      0,
      1
    );

  if (
    right <= left ||
    bottom <= top
  ) {
    return normalized;
  }

  return {
    x:
      left,

    y:
      top,

    width:
      right - left,

    height:
      bottom - top,
  };
}

// =====================================================
// CONVERT NORMALIZED BOX -> PIXELS
// =====================================================

function boxToPixels(
  box,
  pageWidth,
  pageHeight
) {
  const normalized =
    normalizeBox(
      box
    );

  if (
    !normalized
  ) {
    return null;
  }

  const width =
    Number(
      pageWidth
    );

  const height =
    Number(
      pageHeight
    );

  if (
    !Number.isFinite(
      width
    ) ||
    !Number.isFinite(
      height
    ) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  let left =
    Math.floor(
      normalized.x *
      width
    );

  let top =
    Math.floor(
      normalized.y *
      height
    );

  let right =
    Math.ceil(
      (
        normalized.x +
        normalized.width
      ) *
      width
    );

  let bottom =
    Math.ceil(
      (
        normalized.y +
        normalized.height
      ) *
      height
    );

  left =
    clamp(
      left,
      0,
      width - 1
    );

  top =
    clamp(
      top,
      0,
      height - 1
    );

  right =
    clamp(
      right,
      left + 1,
      width
    );

  bottom =
    clamp(
      bottom,
      top + 1,
      height
    );

  const cropWidth =
    right - left;

  const cropHeight =
    bottom - top;

  if (
    cropWidth <= 0 ||
    cropHeight <= 0
  ) {
    return null;
  }

  return {
    left,
    top,

    width:
      cropWidth,

    height:
      cropHeight,
  };
}

// =====================================================
// CROP EXACT VISUAL FROM PAGE
// =====================================================

async function cropVisualFromPage({
  pageBuffer,
  boundingBox,
  padding =
    DEFAULT_PADDING,
}) {
  if (
    !Buffer.isBuffer(
      pageBuffer
    ) ||
    pageBuffer.length === 0
  ) {
    throw new Error(
      "A rendered PDF page buffer is required."
    );
  }

  const originalBox =
    normalizeBox(
      boundingBox
    );

  if (
    !originalBox ||
    !isUsableVisualBox(
      originalBox
    )
  ) {
    throw new Error(
      "A valid visualBoundingBox is required."
    );
  }

  // ---------------------------------------------
  // Decode page once
  // ---------------------------------------------

  const pageImage =
    sharp(
      pageBuffer,
      {
        failOn:
          "error",
      }
    );

  const metadata =
    await pageImage.metadata();

  const pageWidth =
    Number(
      metadata.width
    );

  const pageHeight =
    Number(
      metadata.height
    );

  if (
    !Number.isFinite(
      pageWidth
    ) ||
    !Number.isFinite(
      pageHeight
    ) ||
    pageWidth <= 0 ||
    pageHeight <= 0
  ) {
    throw new Error(
      "Could not determine rendered PDF page dimensions."
    );
  }

  // ---------------------------------------------
  // Add only tiny visual-relative padding
  // ---------------------------------------------

  const paddedBox =
    addVisualPadding(
      originalBox,
      padding
    );

  if (
    !paddedBox
  ) {
    throw new Error(
      "Could not calculate visual crop area."
    );
  }

  // ---------------------------------------------
  // Convert exact coordinates to pixels
  // ---------------------------------------------

  const pixelBox =
    boxToPixels(
      paddedBox,
      pageWidth,
      pageHeight
    );

  if (
    !pixelBox
  ) {
    throw new Error(
      "Could not convert visual bounding box to pixels."
    );
  }

  // ---------------------------------------------
  // IMPORTANT:
  //
  // No auto-trim is used here.
  //
  // Sharp trim() can accidentally remove important
  // white space inside:
  // - reaction arrows
  // - circuits
  // - graphs
  // - geometry
  //
  // Gemini's exact visualBoundingBox remains the
  // source of truth.
  // ---------------------------------------------

  const buffer =
    await sharp(
      pageBuffer
    )
      .extract({
        left:
          pixelBox.left,

        top:
          pixelBox.top,

        width:
          pixelBox.width,

        height:
          pixelBox.height,
      })
      .png({
        compressionLevel:
          9,

        adaptiveFiltering:
          true,
      })
      .toBuffer();

  if (
    !Buffer.isBuffer(
      buffer
    ) ||
    buffer.length === 0
  ) {
    throw new Error(
      "Visual crop produced an empty image."
    );
  }

  return {
    buffer,

    width:
      pixelBox.width,

    height:
      pixelBox.height,

    boundingBox:
      paddedBox,

    originalBoundingBox:
      originalBox,
  };
}

// =====================================================
// CREATE QUESTION DIAGRAM
// =====================================================
//
// Used by navtaAIImportService.js.
//
// CRITICAL:
// ONLY question.visualBoundingBox is accepted.
//
// questionBoundingBox is NEVER used as a fallback.
// =====================================================

async function createQuestionDiagram({
  question,
  pageBuffer,
}) {
  if (
    !question ||
    typeof question !==
      "object"
  ) {
    throw new Error(
      "Question data is required for visual cropping."
    );
  }

  if (
    !question.hasVisual
  ) {
    throw new Error(
      "Question does not contain a genuine visual."
    );
  }

  const visualBoundingBox =
    normalizeBox(
      question.visualBoundingBox
    );

  if (
    !visualBoundingBox
  ) {
    throw new Error(
      "Question visualBoundingBox is missing or invalid. Whole-question fallback is disabled."
    );
  }

  // NEVER:
  //
  // question.visualBoundingBox ||
  // question.questionBoundingBox
  //
  // Only the actual visual box is allowed.

  return cropVisualFromPage({
    pageBuffer,

    boundingBox:
      visualBoundingBox,

    padding:
      DEFAULT_PADDING,
  });
}

// =====================================================
// CREATE OPTION DIAGRAM
// =====================================================
//
// Used for visual answer choices.
//
// The importer can pass an individual option box here.
// The cropper has no knowledge of neighbouring options,
// so it cannot accidentally fall back to another region.
// =====================================================

async function createOptionDiagram({
  pageBuffer,
  boundingBox,
}) {
  const optionBox =
    normalizeBox(
      boundingBox
    );

  if (
    !optionBox
  ) {
    throw new Error(
      "Option visual bounding box is missing or invalid."
    );
  }

  return cropVisualFromPage({
    pageBuffer,

    boundingBox:
      optionBox,

    padding:
      DEFAULT_PADDING,
  });
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createQuestionDiagram,
  createOptionDiagram,
  cropVisualFromPage,
  normalizeBox,
  isUsableVisualBox,
  addVisualPadding,
  boxToPixels,
};

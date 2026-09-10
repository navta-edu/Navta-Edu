const {
  createCanvas,
  loadImage,
} = require("@napi-rs/canvas");

// =====================================================
// NAVTA DIAGRAM CROP SERVICE - 503 SAFE
// =====================================================
//
// IMPORTANT:
// This service deliberately uses @napi-rs/canvas instead of sharp.
// NAVTA already uses the canvas stack for PDF rendering, so this avoids
// adding a new native dependency that can crash Hostinger at startup.
//
// It NEVER falls back to questionBoundingBox.
// Only the supplied visualBoundingBox is cropped.
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

const clamp = (
  value,
  min,
  max
) =>
  Math.max(
    min,
    Math.min(
      max,
      value
    )
  );

const toFiniteNumber = (
  value
) => {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
};

const normalizeBox = (
  box
) => {
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

  // Support normalized 0..1 coordinates and Gemini-style percentages.
  if (
    x > 1 ||
    y > 1 ||
    width > 1 ||
    height > 1
  ) {
    const percentage =
      x >= 0 &&
      y >= 0 &&
      x <= 100 &&
      y <= 100 &&
      width > 0 &&
      height > 0 &&
      width <= 100 &&
      height <= 100;

    if (!percentage) {
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
};

const isUsableVisualBox = (
  box
) => {
  const normalized =
    normalizeBox(
      box
    );

  if (!normalized) {
    return false;
  }

  return (
    normalized.width >=
      0.003 &&
    normalized.height >=
      0.003 &&
    !(
      normalized.width >=
        0.985 &&
      normalized.height >=
        0.985
    )
  );
};

const addVisualPadding = (
  box,
  padding =
    DEFAULT_PADDING
) => {
  const normalized =
    normalizeBox(
      box
    );

  if (!normalized) {
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

  // Padding is relative to the visual size, not the whole page.
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
};

const boundingBoxToPixels = ({
  boundingBox,
  imageWidth,
  imageHeight,
  padding =
    DEFAULT_PADDING,
}) => {
  const normalized =
    normalizeBox(
      boundingBox
    );

  if (
    !normalized ||
    !isUsableVisualBox(
      normalized
    )
  ) {
    throw new Error(
      "A valid visualBoundingBox is required."
    );
  }

  const padded =
    addVisualPadding(
      normalized,
      padding
    );

  const sourceWidth =
    Number(
      imageWidth
    );

  const sourceHeight =
    Number(
      imageHeight
    );

  if (
    !Number.isFinite(
      sourceWidth
    ) ||
    !Number.isFinite(
      sourceHeight
    ) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    throw new Error(
      "Invalid rendered page dimensions."
    );
  }

  let left =
    Math.floor(
      padded.x *
      sourceWidth
    );

  let top =
    Math.floor(
      padded.y *
      sourceHeight
    );

  let right =
    Math.ceil(
      (
        padded.x +
        padded.width
      ) *
      sourceWidth
    );

  let bottom =
    Math.ceil(
      (
        padded.y +
        padded.height
      ) *
      sourceHeight
    );

  left =
    clamp(
      left,
      0,
      sourceWidth - 1
    );

  top =
    clamp(
      top,
      0,
      sourceHeight - 1
    );

  right =
    clamp(
      right,
      left + 1,
      sourceWidth
    );

  bottom =
    clamp(
      bottom,
      top + 1,
      sourceHeight
    );

  return {
    x:
      left,

    y:
      top,

    width:
      right - left,

    height:
      bottom - top,

    normalizedBoundingBox:
      padded,

    originalBoundingBox:
      normalized,
  };
};

const cropVisualFromPage =
  async ({
    pageBuffer,
    boundingBox,
    padding =
      DEFAULT_PADDING,
  }) => {
    if (
      !Buffer.isBuffer(
        pageBuffer
      ) ||
      pageBuffer.length === 0
    ) {
      throw new Error(
        "A valid rendered PDF page buffer is required."
      );
    }

    const sourceImage =
      await loadImage(
        pageBuffer
      );

    const imageWidth =
      Number(
        sourceImage.width
      );

    const imageHeight =
      Number(
        sourceImage.height
      );

    if (
      !imageWidth ||
      !imageHeight
    ) {
      throw new Error(
        "Unable to determine rendered page dimensions."
      );
    }

    const crop =
      boundingBoxToPixels({
        boundingBox,
        imageWidth,
        imageHeight,
        padding,
      });

    const canvas =
      createCanvas(
        crop.width,
        crop.height
      );

    const context =
      canvas.getContext(
        "2d"
      );

    // White PDF-style background.
    context.fillStyle =
      "#ffffff";

    context.fillRect(
      0,
      0,
      crop.width,
      crop.height
    );

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

    const buffer =
      await canvas.encode(
        "png"
      );

    if (
      !Buffer.isBuffer(
        buffer
      ) ||
      buffer.length === 0
    ) {
      throw new Error(
        "NAVTA could not encode the cropped visual."
      );
    }

    return {
      buffer,

      mimeType:
        "image/png",

      width:
        crop.width,

      height:
        crop.height,

      crop,

      boundingBox:
        crop.normalizedBoundingBox,

      originalBoundingBox:
        crop.originalBoundingBox,
    };
  };

// =====================================================
// IMPORTER-COMPATIBLE QUESTION VISUAL API
// =====================================================

const createQuestionDiagram =
  async ({
    question,
    pageBuffer,
    padding =
      DEFAULT_PADDING,
  }) => {
    if (
      !question ||
      typeof question !==
        "object"
    ) {
      return null;
    }

    // IMPORTANT:
    // No questionBoundingBox fallback is allowed.
    if (
      !question.hasVisual ||
      !question.visualBoundingBox
    ) {
      return null;
    }

    const visualBoundingBox =
      normalizeBox(
        question.visualBoundingBox
      );

    if (
      !visualBoundingBox ||
      !isUsableVisualBox(
        visualBoundingBox
      )
    ) {
      return null;
    }

    return cropVisualFromPage({
      pageBuffer,

      boundingBox:
        visualBoundingBox,

      padding,
    });
  };

// Optional reusable API for a future option-level visual pipeline.
const createOptionDiagram =
  async ({
    pageBuffer,
    boundingBox,
    padding =
      DEFAULT_PADDING,
  }) => {
    const optionBox =
      normalizeBox(
        boundingBox
      );

    if (
      !optionBox ||
      !isUsableVisualBox(
        optionBox
      )
    ) {
      return null;
    }

    return cropVisualFromPage({
      pageBuffer,

      boundingBox:
        optionBox,

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

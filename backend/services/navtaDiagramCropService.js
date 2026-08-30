const {
  createCanvas,
  loadImage,
} = require("@napi-rs/canvas");

// =====================================================
// SETTINGS
// =====================================================

// Small padding around diagrams so lines/text at the
// edge are not accidentally cut off.
const DEFAULT_PADDING = 18;

// Prevent extremely tiny AI bounding boxes.
const MIN_CROP_SIZE = 20;

// =====================================================
// NUMBER HELPERS
// =====================================================

const clamp = (
  value,
  minimum,
  maximum
) => {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return minimum;
  }

  return Math.min(
    maximum,
    Math.max(
      minimum,
      number
    )
  );
};

// =====================================================
// VALIDATE NORMALIZED BOUNDING BOX
// =====================================================
//
// NAVTA AI returns:
//
// {
//   x: 0.20,
//   y: 0.30,
//   width: 0.50,
//   height: 0.25
// }
//
// All values represent a fraction of the page.
// =====================================================

const normalizeBoundingBox = (
  boundingBox
) => {
  if (
    !boundingBox ||
    typeof boundingBox !== "object"
  ) {
    throw new Error(
      "A diagram bounding box is required."
    );
  }

  const x =
    clamp(
      boundingBox.x,
      0,
      1
    );

  const y =
    clamp(
      boundingBox.y,
      0,
      1
    );

  const width =
    clamp(
      boundingBox.width,
      0,
      1
    );

  const height =
    clamp(
      boundingBox.height,
      0,
      1
    );

  if (
    width <= 0 ||
    height <= 0
  ) {
    throw new Error(
      "Invalid diagram bounding box."
    );
  }

  return {
    x,
    y,
    width:
      Math.min(
        width,
        1 - x
      ),

    height:
      Math.min(
        height,
        1 - y
      ),
  };
};

// =====================================================
// CONVERT NORMALIZED BOX TO PIXELS
// =====================================================

const boundingBoxToPixels = ({
  boundingBox,
  imageWidth,
  imageHeight,
  padding =
    DEFAULT_PADDING,
}) => {
  const box =
    normalizeBoundingBox(
      boundingBox
    );

  const rawX =
    Math.round(
      box.x *
        imageWidth
    );

  const rawY =
    Math.round(
      box.y *
        imageHeight
    );

  const rawWidth =
    Math.round(
      box.width *
        imageWidth
    );

  const rawHeight =
    Math.round(
      box.height *
        imageHeight
    );

  const safePadding =
    Math.max(
      0,
      Number(padding) ||
        0
    );

  const x =
    Math.max(
      0,
      rawX -
        safePadding
    );

  const y =
    Math.max(
      0,
      rawY -
        safePadding
    );

  const right =
    Math.min(
      imageWidth,
      rawX +
        rawWidth +
        safePadding
    );

  const bottom =
    Math.min(
      imageHeight,
      rawY +
        rawHeight +
        safePadding
    );

  const width =
    right - x;

  const height =
    bottom - y;

  if (
    width <
      MIN_CROP_SIZE ||
    height <
      MIN_CROP_SIZE
  ) {
    throw new Error(
      "The detected diagram area is too small."
    );
  }

  return {
    x,
    y,
    width,
    height,
  };
};

// =====================================================
// CROP DIAGRAM FROM PAGE
// =====================================================

const cropQuestionDiagram =
  async ({
    pageBuffer,
    boundingBox,
    padding =
      DEFAULT_PADDING,
  }) => {
    if (
      !Buffer.isBuffer(
        pageBuffer
      )
    ) {
      throw new Error(
        "A valid rendered page buffer is required."
      );
    }

    if (
      pageBuffer.length ===
      0
    ) {
      throw new Error(
        "Rendered page buffer is empty."
      );
    }

    const sourceImage =
      await loadImage(
        pageBuffer
      );

    const imageWidth =
      sourceImage.width;

    const imageHeight =
      sourceImage.height;

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

    // White background is useful for diagrams
    // containing transparent/empty regions.
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

    return {
      buffer,

      mimeType:
        "image/png",

      width:
        crop.width,

      height:
        crop.height,

      crop: {
        x:
          crop.x,

        y:
          crop.y,

        width:
          crop.width,

        height:
          crop.height,
      },
    };
  };

// =====================================================
// PROCESS QUESTION VISUAL
// =====================================================
//
// If the question does not have a visual, returns null.
// This makes it easy for the importer to call this
// function for every detected question.
// =====================================================

const createQuestionDiagram =
  async ({
    question,
    pageBuffer,
    padding =
      DEFAULT_PADDING,
  }) => {
    if (
      !question?.hasVisual
    ) {
      return null;
    }

    if (
      !question
        .visualBoundingBox
    ) {
      return null;
    }

    return cropQuestionDiagram({
      pageBuffer,
      boundingBox:
        question
          .visualBoundingBox,
      padding,
    });
  };

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  normalizeBoundingBox,
  boundingBoxToPixels,
  cropQuestionDiagram,
  createQuestionDiagram,
};

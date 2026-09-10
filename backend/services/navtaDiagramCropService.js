const sharp = require("sharp");

const DEFAULT_PADDING = Math.max(
  0,
  Math.min(
    0.04,
    Number(
      process.env.NAVTA_AI_VISUAL_CROP_PADDING ||
      0.012
    )
  )
);

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function normalizeBox(box) {
  if (
    !box ||
    typeof box !== "object"
  ) {
    return null;
  }

  const x = Number(box.x);
  const y = Number(box.y);
  const width = Number(box.width);
  const height = Number(box.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  const left = clamp(x, 0, 1);
  const top = clamp(y, 0, 1);

  const right = clamp(
    x + width,
    0,
    1
  );

  const bottom = clamp(
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
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

async function cropVisualFromPage({
  pageBuffer,
  boundingBox,
  padding = DEFAULT_PADDING,
}) {
  if (!Buffer.isBuffer(pageBuffer)) {
    throw new Error(
      "A rendered PDF page buffer is required."
    );
  }

  const box =
    normalizeBox(boundingBox);

  if (!box) {
    throw new Error(
      "A valid visualBoundingBox is required."
    );
  }

  const metadata =
    await sharp(pageBuffer)
      .metadata();

  const pageWidth =
    Number(metadata.width);

  const pageHeight =
    Number(metadata.height);

  if (
    !pageWidth ||
    !pageHeight
  ) {
    throw new Error(
      "Could not determine rendered page dimensions."
    );
  }

  // Padding is deliberately very small.
  // We want the actual diagram, not nearby
  // question text or another option.
  const padX =
    box.width * padding;

  const padY =
    box.height * padding;

  const leftNorm =
    clamp(
      box.x - padX,
      0,
      1
    );

  const topNorm =
    clamp(
      box.y - padY,
      0,
      1
    );

  const rightNorm =
    clamp(
      box.x +
      box.width +
      padX,
      0,
      1
    );

  const bottomNorm =
    clamp(
      box.y +
      box.height +
      padY,
      0,
      1
    );

  let left =
    Math.floor(
      leftNorm * pageWidth
    );

  let top =
    Math.floor(
      topNorm * pageHeight
    );

  let right =
    Math.ceil(
      rightNorm * pageWidth
    );

  let bottom =
    Math.ceil(
      bottomNorm * pageHeight
    );

  left = clamp(
    left,
    0,
    pageWidth - 1
  );

  top = clamp(
    top,
    0,
    pageHeight - 1
  );

  right = clamp(
    right,
    left + 1,
    pageWidth
  );

  bottom = clamp(
    bottom,
    top + 1,
    pageHeight
  );

  const width =
    right - left;

  const height =
    bottom - top;

  return sharp(pageBuffer)
    .extract({
      left,
      top,
      width,
      height,
    })
    .png({
      compressionLevel: 9,
    })
    .toBuffer();
}

module.exports = {
  cropVisualFromPage,
  normalizeBox,
};

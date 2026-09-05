const { createCanvas } = require("@napi-rs/canvas");

// =====================================================
// LOAD PDF.JS
// =====================================================

let pdfJsPromise = null;

const loadPdfJs = async () => {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist/legacy/build/pdf.mjs");
  }

  return pdfJsPromise;
};

// =====================================================
// HELPERS
// =====================================================

const validatePdfBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("A valid PDF buffer is required.");
  }

  if (buffer.length === 0) {
    throw new Error("The PDF buffer is empty.");
  }
};

const normalizeScale = (scale) => {
  const value = Number(scale);
  if (!Number.isFinite(value)) return 1.8;
  return Math.min(3, Math.max(0.8, value));
};

const normalizeMaxPages = (maxPages) => {
  const value = Number(maxPages);

  if (!Number.isFinite(value) || value <= 0) {
    return 100;
  }

  return Math.floor(value);
};

// =====================================================
// RENDER ONE PDF PAGE TO PNG
// =====================================================

const renderPdfPageToPng = async ({ page, scale = 1.8 }) => {
  if (!page || typeof page.getViewport !== "function") {
    throw new Error("A valid PDF page is required.");
  }

  const safeScale = normalizeScale(scale);
  const viewport = page.getViewport({ scale: safeScale });

  const width = Math.max(1, Math.ceil(viewport.width));
  const height = Math.max(1, Math.ceil(viewport.height));

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  const renderTask = page.render({
    canvasContext: context,
    viewport,
  });

  await renderTask.promise;

  const buffer = await canvas.encode("png");

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Rendered PDF page produced an empty PNG.");
  }

  return {
    buffer,
    mimeType: "image/png",
    width,
    height,
    scale: safeScale,
  };
};

// =====================================================
// INTERNAL PDF OPEN/CLOSE
// =====================================================

const openPdf = async (buffer) => {
  validatePdfBuffer(buffer);

  const pdfjsLib = await loadPdfJs();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: false,
    isEvalSupported: false,
  });

  return loadingTask.promise;
};

const closePdf = async (pdf) => {
  if (!pdf) return;

  try {
    if (typeof pdf.cleanup === "function") {
      pdf.cleanup();
    }
  } catch {}

  try {
    if (typeof pdf.destroy === "function") {
      await pdf.destroy();
    }
  } catch {}
};

// =====================================================
// RENDER COMPLETE / LIMITED PDF
// =====================================================

const renderPdfPages = async ({
  buffer,
  scale = 1.8,
  maxPages = 100,
}) => {
  validatePdfBuffer(buffer);

  const pdf = await openPdf(buffer);
  const pages = [];

  try {
    const totalPages = Number(pdf.numPages) || 0;
    const safeMaxPages = normalizeMaxPages(maxPages);
    const pagesToRender = Math.min(totalPages, safeMaxPages);

    for (let pageNumber = 1; pageNumber <= pagesToRender; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);

      try {
        const rendered = await renderPdfPageToPng({
          page,
          scale,
        });

        pages.push({
          pageNumber,
          ...rendered,
        });
      } finally {
        try {
          if (typeof page.cleanup === "function") {
            page.cleanup();
          }
        } catch {}
      }
    }

    return {
      totalPages,
      renderedPages: pages.length,
      pages,
      truncated: totalPages > pagesToRender,
    };
  } finally {
    await closePdf(pdf);
  }
};

// =====================================================
// RENDER SELECTED PAGES
// =====================================================

const renderSelectedPdfPages = async ({
  buffer,
  pageNumbers = [],
  scale = 1.8,
}) => {
  validatePdfBuffer(buffer);

  const uniquePages = [
    ...new Set(
      (Array.isArray(pageNumbers) ? pageNumbers : [])
        .map(Number)
        .filter((pageNumber) => Number.isInteger(pageNumber) && pageNumber > 0)
    ),
  ].sort((a, b) => a - b);

  if (uniquePages.length === 0) {
    return {
      totalPages: 0,
      renderedPages: 0,
      pages: [],
    };
  }

  const pdf = await openPdf(buffer);
  const pages = [];

  try {
    const totalPages = Number(pdf.numPages) || 0;

    for (const pageNumber of uniquePages) {
      if (pageNumber > totalPages) continue;

      const page = await pdf.getPage(pageNumber);

      try {
        const rendered = await renderPdfPageToPng({
          page,
          scale,
        });

        pages.push({
          pageNumber,
          ...rendered,
        });
      } finally {
        try {
          if (typeof page.cleanup === "function") {
            page.cleanup();
          }
        } catch {}
      }
    }

    return {
      totalPages,
      renderedPages: pages.length,
      pages,
    };
  } finally {
    await closePdf(pdf);
  }
};

module.exports = {
  renderPdfPageToPng,
  renderPdfPages,
  renderSelectedPdfPages,
};

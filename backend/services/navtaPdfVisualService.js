const { createCanvas } = require("@napi-rs/canvas");
const path = require("path");

let pdfJsPromise = null;

const loadPdfJs = async () => {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return pdfJsPromise;
};

const getPdfJsResourcePaths = () => {
  try {
    const packageJson = require.resolve("pdfjs-dist/package.json");
    const root = path.dirname(packageJson);
    const withTrailingSlash = (value) =>
      value.endsWith(path.sep) ? value : `${value}${path.sep}`;

    return {
      standardFontDataUrl: withTrailingSlash(path.join(root, "standard_fonts")),
      cMapUrl: withTrailingSlash(path.join(root, "cmaps")),
      wasmUrl: withTrailingSlash(path.join(root, "wasm")),
    };
  } catch (error) {
    console.warn(
      "NAVTA PDF renderer could not resolve pdfjs-dist resource folders:",
      error?.message || error
    );
    return {};
  }
};

const validatePdfBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer)) throw new Error("A valid PDF buffer is required.");
  if (buffer.length === 0) throw new Error("The PDF buffer is empty.");
};

const normalizeScale = (scale) => {
  const value = Number(scale);
  if (!Number.isFinite(value)) return 2.4;
  return Math.min(3.2, Math.max(1.4, value));
};

const normalizeMaxPages = (maxPages) => {
  const value = Number(maxPages);
  if (!Number.isFinite(value) || value <= 0) return 250;
  return Math.floor(value);
};

const renderPdfPageToPng = async ({ page, scale = 2.4 }) => {
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

  // Keep image smoothing enabled for diagrams/curves while rendering at a
  // higher source resolution. PDF.js still draws vector geometry directly.
  context.imageSmoothingEnabled = true;

  const renderTask = page.render({
    canvasContext: context,
    viewport,
    background: "#ffffff",
    intent: "display",
  });

  await renderTask.promise;

  const buffer = await canvas.encode("png");
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Rendered PDF page produced an empty PNG.");
  }

  return { buffer, mimeType: "image/png", width, height, scale: safeScale };
};

const openPdf = async (buffer) => {
  validatePdfBuffer(buffer);
  const pdfjsLib = await loadPdfJs();
  const resources = getPdfJsResourcePaths();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),

    // IMPORTANT FOR NAVTA DIAGRAM LABELS:
    // Some exam PDFs use non-embedded/custom fonts. With useSystemFonts=false,
    // PDF.js can render those missing glyphs as rectangular boxes. Allowing
    // system-font fallback gives PDF.js a usable replacement while embedded
    // fonts are still used whenever the PDF provides them.
    useSystemFonts: true,
    disableFontFace: false,

    cMapPacked: true,
    isEvalSupported: false,
    useWasm: true,
    stopEvent: false,
    ...resources,
  });

  return loadingTask.promise;
};

const closePdf = async (pdf) => {
  if (!pdf) return;
  try { if (typeof pdf.cleanup === "function") pdf.cleanup(); } catch {}
  try { if (typeof pdf.destroy === "function") await pdf.destroy(); } catch {}
};

const renderPdfPages = async ({
  buffer,
  scale = 2.4,
  maxPages = 250,
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
        const rendered = await renderPdfPageToPng({ page, scale });
        pages.push({ pageNumber, ...rendered });
      } finally {
        try { if (typeof page.cleanup === "function") page.cleanup(); } catch {}
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

const renderSelectedPdfPages = async ({
  buffer,
  pageNumbers = [],
  scale = 2.4,
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
    return { totalPages: 0, renderedPages: 0, pages: [] };
  }

  const pdf = await openPdf(buffer);
  const pages = [];

  try {
    const totalPages = Number(pdf.numPages) || 0;

    for (const pageNumber of uniquePages) {
      if (pageNumber > totalPages) continue;
      const page = await pdf.getPage(pageNumber);

      try {
        const rendered = await renderPdfPageToPng({ page, scale });
        pages.push({ pageNumber, ...rendered });
      } finally {
        try { if (typeof page.cleanup === "function") page.cleanup(); } catch {}
      }
    }

    return { totalPages, renderedPages: pages.length, pages };
  } finally {
    await closePdf(pdf);
  }
};

module.exports = {
  renderPdfPageToPng,
  renderPdfPages,
  renderSelectedPdfPages,
};

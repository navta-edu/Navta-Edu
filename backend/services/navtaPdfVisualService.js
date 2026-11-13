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
  return Math.max(1, Math.floor(value));
};

const invalidPageRange = (message) => Object.assign(new Error(message), { statusCode: 400 });

const readPageNumber = (value, label, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const number = typeof value === "string" && /^\d+$/.test(value.trim())
    ? Number(value)
    : value;
  if (!Number.isSafeInteger(number) || number < 1) {
    throw invalidPageRange(`${label} must be a positive whole number.`);
  }
  return number;
};

const readSupportingPageText = async (page) => {
  const limit = 3500;
  try {
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items) {
      if (typeof item.str !== "string") continue;
      text += item.str.slice(0, limit - text.length) + (item.hasEOL ? "\n" : " ");
      if (text.length >= limit) break;
    }
    return text.slice(0, limit).trim();
  } catch {
    // The page image remains the source for PDFs without usable text.
    return "";
  }
};

const renderPdfPageToPng = async ({ page, scale = 2.4 }) => {
  if (!page || typeof page.getViewport !== "function") {
    throw new Error("A valid PDF page is required.");
  }

  const source = page.getViewport({ scale: 1 });
  if (!Number.isFinite(source.width) || !Number.isFinite(source.height) ||
      source.width <= 0 || source.height <= 0) {
    throw new Error("The PDF page size is invalid.");
  }
  // Keep ordinary pages at their requested resolution and bound canvas
  // allocation for oversized originals.
  const safeScale = Math.min(
    normalizeScale(scale),
    Math.sqrt(12_000_000 / (source.width * source.height)),
    8192 / Math.max(source.width, source.height)
  );
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

    // Outline rendering needs PDF.js's bundled standard fonts. Node may
    // otherwise choose an unavailable system font and omit the glyphs.
    useSystemFonts: false,
    disableFontFace: true,
    fontExtraProperties: true,

    cMapPacked: true,
    isEvalSupported: false,
    useWasm: true,
    stopEvent: false,
    ...resources,
  });

  try {
    return await loadingTask.promise;
  } catch (error) {
    try { await loadingTask.destroy(); } catch {}
    throw error;
  }
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
  startPage,
  endPage,
  onProgress = () => {},
}) => {
  validatePdfBuffer(buffer);
  const firstPage = readPageNumber(startPage, "Start page", 1);
  const lastRequestedPage = readPageNumber(endPage, "End page", null);
  if (lastRequestedPage !== null && lastRequestedPage < firstPage) {
    throw invalidPageRange("End page must be on or after the start page.");
  }
  const pdf = await openPdf(buffer);
  const pages = [];
  const failedPages = [];

  try {
    const totalPages = Number(pdf.numPages) || 0;
    if (firstPage > totalPages) {
      throw invalidPageRange(`Start page exceeds the PDF's ${totalPages} page(s).`);
    }
    const safeMaxPages = normalizeMaxPages(maxPages);
    const requestedEnd = Math.min(totalPages, lastRequestedPage ?? totalPages);
    const lastPage = Math.min(requestedEnd, firstPage + safeMaxPages - 1);
    const pagesToRender = lastPage - firstPage + 1;
    const report = (completedPages) => onProgress({
      stage: "rendering",
      message: `Rendering PDF pages (${completedPages}/${pagesToRender}).`,
      completedPages,
      totalPages: pagesToRender,
    });
    report(0);

    for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber += 1) {
      let page;
      try {
        page = await pdf.getPage(pageNumber);
        const rendered = await renderPdfPageToPng({ page, scale });
        const text = await readSupportingPageText(page);
        pages.push({ pageNumber, ...rendered, text });
      } catch (error) {
        failedPages.push(pageNumber);
        console.warn(`NAVTA could not render PDF page ${pageNumber}:`, error?.message || error);
      } finally {
        try { page?.cleanup?.(); } catch {}
      }
      report(pageNumber - firstPage + 1);
    }

    return {
      totalPages,
      renderedPages: pages.length,
      pages,
      startPage: firstPage,
      endPage: lastPage,
      truncated: requestedEnd > lastPage,
      failedPages,
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

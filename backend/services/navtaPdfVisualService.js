const { createCanvas } =
  require("@napi-rs/canvas");

// =====================================================
// LOAD PDF.JS
// =====================================================
//
// pdfjs-dist v4 is ESM.
// We use dynamic import so it works inside your
// CommonJS backend.
// =====================================================

const loadPdfJs = async () => {
  const pdfjsLib =
    await import(
      "pdfjs-dist/legacy/build/pdf.mjs"
    );

  return pdfjsLib;
};

// =====================================================
// RENDER ONE PDF PAGE TO PNG
// =====================================================

const renderPdfPageToPng =
  async ({
    page,
    scale = 1.8,
  }) => {
    const viewport =
      page.getViewport({
        scale,
      });

    const width =
      Math.ceil(
        viewport.width
      );

    const height =
      Math.ceil(
        viewport.height
      );

    const canvas =
      createCanvas(
        width,
        height
      );

    const context =
      canvas.getContext(
        "2d"
      );

    context.fillStyle =
      "#ffffff";

    context.fillRect(
      0,
      0,
      width,
      height
    );

    await page.render({
      canvasContext:
        context,

      viewport,
    }).promise;

    const buffer =
      await canvas.encode(
        "png"
      );

    return {
      buffer,

      mimeType:
        "image/png",

      width,

      height,

      scale,
    };
  };

// =====================================================
// RENDER PDF BUFFER TO PAGE IMAGES
// =====================================================

const renderPdfPages =
  async ({
    buffer,
    scale = 1.8,
    maxPages = 100,
  }) => {
    if (
      !Buffer.isBuffer(
        buffer
      )
    ) {
      throw new Error(
        "A valid PDF buffer is required."
      );
    }

    if (
      buffer.length ===
      0
    ) {
      throw new Error(
        "The PDF buffer is empty."
      );
    }

    const pdfjsLib =
      await loadPdfJs();

    const loadingTask =
      pdfjsLib.getDocument({
        data:
          new Uint8Array(
            buffer
          ),

        useSystemFonts:
          true,

        disableFontFace:
          false,

        isEvalSupported:
          false,
      });

    const pdf =
      await loadingTask.promise;

    const totalPages =
      pdf.numPages;

    const pagesToRender =
      Math.min(
        totalPages,
        maxPages
      );

    const pages = [];

    for (
      let pageNumber = 1;
      pageNumber <=
      pagesToRender;
      pageNumber += 1
    ) {
      const page =
        await pdf.getPage(
          pageNumber
        );

      const rendered =
        await renderPdfPageToPng({
          page,
          scale,
        });

      pages.push({
        pageNumber,

        ...rendered,
      });

      if (
        typeof page.cleanup ===
        "function"
      ) {
        page.cleanup();
      }
    }

    if (
      typeof pdf.cleanup ===
      "function"
    ) {
      pdf.cleanup();
    }

    if (
      typeof pdf.destroy ===
      "function"
    ) {
      await pdf.destroy();
    }

    return {
      totalPages,

      renderedPages:
        pages.length,

      pages,

      truncated:
        totalPages >
        pagesToRender,
    };
  };

// =====================================================
// RENDER SELECTED PDF PAGES
// =====================================================
//
// Useful later when NAVTA AI says:
// "Question 15 is on page 8"
//
// Then we do not need to re-process the entire PDF.
// =====================================================

const renderSelectedPdfPages =
  async ({
    buffer,
    pageNumbers = [],
    scale = 1.8,
  }) => {
    if (
      !Buffer.isBuffer(
        buffer
      )
    ) {
      throw new Error(
        "A valid PDF buffer is required."
      );
    }

    const uniquePages =
      [
        ...new Set(
          pageNumbers
            .map(Number)
            .filter(
              (page) =>
                Number.isInteger(
                  page
                ) &&
                page > 0
            )
        ),
      ].sort(
        (a, b) =>
          a - b
      );

    if (
      uniquePages.length ===
      0
    ) {
      return {
        totalPages: 0,
        renderedPages: 0,
        pages: [],
      };
    }

    const pdfjsLib =
      await loadPdfJs();

    const loadingTask =
      pdfjsLib.getDocument({
        data:
          new Uint8Array(
            buffer
          ),

        useSystemFonts:
          true,

        disableFontFace:
          false,

        isEvalSupported:
          false,
      });

    const pdf =
      await loadingTask.promise;

    const pages = [];

    for (
      const pageNumber of
      uniquePages
    ) {
      if (
        pageNumber >
        pdf.numPages
      ) {
        continue;
      }

      const page =
        await pdf.getPage(
          pageNumber
        );

      const rendered =
        await renderPdfPageToPng({
          page,
          scale,
        });

      pages.push({
        pageNumber,

        ...rendered,
      });

      if (
        typeof page.cleanup ===
        "function"
      ) {
        page.cleanup();
      }
    }

    if (
      typeof pdf.cleanup ===
      "function"
    ) {
      pdf.cleanup();
    }

    if (
      typeof pdf.destroy ===
      "function"
    ) {
      await pdf.destroy();
    }

    return {
      totalPages:
        pdf.numPages,

      renderedPages:
        pages.length,

      pages,
    };
  };

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  renderPdfPageToPng,
  renderPdfPages,
  renderSelectedPdfPages,
};

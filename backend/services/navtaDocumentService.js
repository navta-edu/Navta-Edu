const path = require("path");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

// =====================================================
// HELPERS
// =====================================================

const getExtension = (fileName = "") => {
  return path
    .extname(fileName)
    .toLowerCase()
    .replace(".", "");
};

const cleanText = (value = "") => {
  return String(value)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const bufferToBase64DataUrl = (
  buffer,
  mimeType
) => {
  if (!Buffer.isBuffer(buffer)) {
    return "";
  }

  return `data:${mimeType};base64,${buffer.toString(
    "base64"
  )}`;
};

// =====================================================
// TXT
// =====================================================

const extractTxt = async (file) => {
  const text = cleanText(
    file.buffer.toString("utf8")
  );

  return {
    fileType: "txt",
    text,
    images: [],
    warnings: [],
  };
};

// =====================================================
// DOCX
// =====================================================
//
// Mammoth can extract text and embedded images.
//
// For now we preserve extracted images together with
// the document result.
//
// Later NAVTA AI will decide which image belongs to
// which question.
// =====================================================

const extractDocx = async (file) => {
  const extractedImages = [];

  const result =
    await mammoth.convertToHtml(
      {
        buffer: file.buffer,
      },
      {
        convertImage:
          mammoth.images.imgElement(
            async (image) => {
              const imageBuffer =
                await image.read();

              const mimeType =
                image.contentType ||
                "image/png";

              const index =
                extractedImages.length;

              extractedImages.push({
                index,

                mimeType,

                buffer:
                  imageBuffer,

                dataUrl:
                  bufferToBase64DataUrl(
                    imageBuffer,
                    mimeType
                  ),
              });

              return {
                src: `navta-image-${index}`,
              };
            }
          ),
      }
    );

  const rawText =
    await mammoth.extractRawText({
      buffer: file.buffer,
    });

  return {
    fileType: "docx",

    text:
      cleanText(
        rawText.value || ""
      ),

    html:
      result.value || "",

    images:
      extractedImages,

    warnings:
      [
        ...(result.messages || []),
        ...(rawText.messages || []),
      ],
  };
};

// =====================================================
// PDF
// =====================================================
//
// Important:
//
// pdf-parse gives reliable text extraction for many PDFs,
// but it does NOT reliably extract/crop every diagram.
//
// Therefore this function currently:
// 1. extracts document text
// 2. records basic metadata/pages
//
// PDF diagram rendering/cropping is handled separately
// in the next NAVTA PDF visual-processing layer.
//
// =====================================================

const extractPdf = async (file) => {
  const result =
    await pdfParse(
      file.buffer
    );

  return {
    fileType: "pdf",

    text:
      cleanText(
        result.text || ""
      ),

    images: [],

    pdfInfo: {
      pages:
        Number(
          result.numpages
        ) || 0,

      metadata:
        result.info || {},
    },

    warnings: [],
  };
};

// =====================================================
// MAIN DOCUMENT PROCESSOR
// =====================================================

const processNavtaDocument =
  async (file) => {
    if (!file) {
      throw new Error(
        "No uploaded file was provided."
      );
    }

    if (
      !Buffer.isBuffer(
        file.buffer
      )
    ) {
      throw new Error(
        "Uploaded file buffer is missing."
      );
    }

    if (
      file.buffer.length ===
      0
    ) {
      throw new Error(
        "Uploaded file is empty."
      );
    }

    const extension =
      getExtension(
        file.originalname
      );

    if (
      extension === "txt"
    ) {
      return extractTxt(
        file
      );
    }

    if (
      extension === "docx"
    ) {
      return extractDocx(
        file
      );
    }

    if (
      extension === "pdf"
    ) {
      return extractPdf(
        file
      );
    }

    throw new Error(
      "Unsupported document type. Only PDF, DOCX and TXT files are supported."
    );
  };

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  processNavtaDocument,
  extractTxt,
  extractDocx,
  extractPdf,
};

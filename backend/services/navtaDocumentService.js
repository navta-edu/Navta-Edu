const path = require("path");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

// =====================================================
// HELPERS
// =====================================================

const getExtension = (fileName = "") =>
  path.extname(fileName || "").toLowerCase().replace(".", "");

const cleanText = (value = "") =>
  String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const bufferToBase64DataUrl = (buffer, mimeType) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return "";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
};

const validateFile = (file) => {
  if (!file) {
    throw new Error("No uploaded file was provided.");
  }

  if (!Buffer.isBuffer(file.buffer)) {
    throw new Error("Uploaded file buffer is missing.");
  }

  if (file.buffer.length === 0) {
    throw new Error("Uploaded file is empty.");
  }
};

// =====================================================
// TXT
// =====================================================

const extractTxt = async (file) => {
  validateFile(file);

  return {
    fileType: "txt",
    text: cleanText(file.buffer.toString("utf8")),
    html: "",
    images: [],
    warnings: [],
  };
};

// =====================================================
// DOCX
// =====================================================

const extractDocx = async (file) => {
  validateFile(file);

  const extractedImages = [];
  const warnings = [];

  let html = "";
  let text = "";

  try {
    const htmlResult = await mammoth.convertToHtml(
      { buffer: file.buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const imageBuffer = await image.read();
          const mimeType = image.contentType || "image/png";
          const index = extractedImages.length;

          extractedImages.push({
            index,
            mimeType,
            buffer: imageBuffer,
            dataUrl: bufferToBase64DataUrl(imageBuffer, mimeType),
          });

          return {
            src: `navta-image-${index}`,
          };
        }),
      }
    );

    html = htmlResult.value || "";

    if (Array.isArray(htmlResult.messages)) {
      warnings.push(...htmlResult.messages);
    }
  } catch (error) {
    warnings.push({
      type: "warning",
      message: `DOCX HTML extraction warning: ${error.message}`,
    });
  }

  try {
    const rawText = await mammoth.extractRawText({
      buffer: file.buffer,
    });

    text = cleanText(rawText.value || "");

    if (Array.isArray(rawText.messages)) {
      warnings.push(...rawText.messages);
    }
  } catch (error) {
    if (!html) {
      throw new Error(`Unable to read DOCX file: ${error.message}`);
    }

    warnings.push({
      type: "warning",
      message: `DOCX raw-text extraction warning: ${error.message}`,
    });
  }

  return {
    fileType: "docx",
    text,
    html,
    images: extractedImages,
    warnings,
  };
};

// =====================================================
// PDF
// =====================================================
//
// PDF text is supporting context only.
// The main NAVTA PDF question separator uses rendered
// page images in navtaPdfVisualService.js.
// =====================================================

const extractPdf = async (file) => {
  validateFile(file);

  try {
    const result = await pdfParse(file.buffer);

    return {
      fileType: "pdf",
      text: cleanText(result?.text || ""),
      html: "",
      images: [],
      pdfInfo: {
        pages: Number(result?.numpages) || 0,
        metadata: result?.info || {},
      },
      warnings: [],
    };
  } catch (error) {
    // Do not block vision-first PDF processing merely
    // because pdf-parse cannot extract text from a scanned PDF.
    return {
      fileType: "pdf",
      text: "",
      html: "",
      images: [],
      pdfInfo: {
        pages: 0,
        metadata: {},
      },
      warnings: [
        {
          type: "warning",
          message:
            `PDF text extraction failed; NAVTA will continue with visual page analysis. ${error.message}`,
        },
      ],
    };
  }
};

// =====================================================
// MAIN DOCUMENT PROCESSOR
// =====================================================

const processNavtaDocument = async (file) => {
  validateFile(file);

  const extension = getExtension(file.originalname);

  if (extension === "txt") return extractTxt(file);
  if (extension === "docx") return extractDocx(file);
  if (extension === "pdf") return extractPdf(file);

  throw new Error(
    "Unsupported document type. Only PDF, DOCX and TXT files are supported."
  );
};

module.exports = {
  processNavtaDocument,
  extractTxt,
  extractDocx,
  extractPdf,
};

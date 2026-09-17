const path = require('path');
const mammoth = require('mammoth');

// =====================================================
// NAVTA FILE TEXT EXTRACTOR
// Supports:
// PDF
// DOCX
// TXT
// =====================================================

async function extractTextFromNavtaFile(file) {
  if (!file) {
    throw new Error('No file was uploaded.');
  }

  if (!file.buffer) {
    throw new Error('Uploaded file does not contain a readable buffer.');
  }

  const extension = path
    .extname(file.originalname || '')
    .toLowerCase();

  // ===================================================
  // TXT
  // ===================================================

  if (extension === '.txt') {
    const text = file.buffer.toString('utf8');

    if (!text.trim()) {
      throw new Error('The uploaded TXT file is empty.');
    }

    return cleanExtractedText(text);
  }

  // ===================================================
  // DOCX
  // ===================================================

  if (extension === '.docx') {
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    });

    const text = result.value || '';

    if (!text.trim()) {
      throw new Error(
        'No readable text was found in the uploaded DOCX file.'
      );
    }

    return cleanExtractedText(text);
  }

  // ===================================================
  // PDF
  // ===================================================

  if (extension === '.pdf') {
    /*
     * pdf-parse has had different export/API shapes across versions.
     * Keep the import here so we can adjust it to the exact installed
     * version when we test the backend.
     */
    const pdfParseModule = require('pdf-parse');

    let pdfParse =
      typeof pdfParseModule === 'function'
        ? pdfParseModule
        : pdfParseModule.default;

    if (typeof pdfParse !== 'function') {
      throw new Error(
        'The installed pdf-parse version uses a different API. Check the installed version before enabling PDF imports.'
      );
    }

    const result = await pdfParse(file.buffer);

    const text = result.text || '';

    if (!text.trim()) {
      throw new Error(
        'No readable text was found in the uploaded PDF. The PDF may contain scanned images instead of selectable text.'
      );
    }

    return cleanExtractedText(text);
  }

  // ===================================================
  // UNSUPPORTED FILE
  // ===================================================

  throw new Error(
    'Unsupported file type. Please upload a PDF, DOCX, or TXT file.'
  );
}

// =====================================================
// CLEAN EXTRACTED TEXT
// =====================================================

function cleanExtractedText(text) {
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  extractTextFromNavtaFile,
};

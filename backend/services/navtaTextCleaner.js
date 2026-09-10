/**
 * ==========================================
 * NAVTA AI v2
 * Text Cleaner
 * ==========================================
 */

function removeMarkdown(text) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/`/g, "");
}

function removeNavtaVisual(text) {
  return text
    .replace(/\[\[NAVTA_VISUAL\]\]/gi, "")
    .replace(/\[NAVTA_VISUAL\]/gi, "")
    .replace(/NAVTA_VISUAL/gi, "");
}

function normalizeQuotes(text) {
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

function normalizeDashes(text) {
  return text
    .replace(/[–—]/g, "-");
}

function removeExtraSpaces(text) {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function removeInvisibleCharacters(text) {
  return text
    .replace(/\u200B/g, "")
    .replace(/\u200C/g, "")
    .replace(/\u200D/g, "")
    .replace(/\uFEFF/g, "");
}

function cleanText(input = "") {
  let text = String(input);

  text = removeInvisibleCharacters(text);

  text = removeMarkdown(text);

  text = removeNavtaVisual(text);

  text = normalizeQuotes(text);

  text = normalizeDashes(text);

  text = removeExtraSpaces(text);

  return text.trim();
}

module.exports = {
  cleanText,
};

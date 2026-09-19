/**
 * NAVTA AI - Safe Equation Cleaner
 * Does NOT convert valid LaTeX to Unicode and does NOT destroy matrices,
 * fractions, roots, powers, subscripts, \left or \right.
 */
const latexCleaner = require("./navtaLatexCleaner");

class NavtaEquationCleaner {
  clean(input = "") {
    let text = latexCleaner.clean(input);
    if (!text) return "";

    // Safe plain-text operator normalisation only. Avoid touching arrows or
    // operators that are already inside valid LaTeX commands.
    text = text
      .replace(/(^|[^\\])<=/g, "$1≤")
      .replace(/(^|[^\\])>=/g, "$1≥")
      .replace(/(^|[^\\])!=/g, "$1≠")
      .replace(/\+\/-/g, "±");

    return text.trim();
  }

  hasEquation(text = "") {
    return /\\(?:frac|sqrt|sum|prod|int|lim|sin|cos|tan|log|ln|begin|det|vec)\b|[=≤≥±∞∫∑√^_]/i.test(String(text));
  }

  detectEquationType(text = "") {
    const value = String(text);
    if (/\\(?:int|iint|iiint)\b|∫|∬|∭/.test(value)) return "Integral";
    if (/\\lim\b|\blim\b/i.test(value)) return "Limit";
    if (/\\begin\{(?:matrix|pmatrix|bmatrix|Bmatrix|smallmatrix)\}/.test(value)) return "Matrix";
    if (/\\begin\{(?:vmatrix|Vmatrix)\}|\\det\b|\bdet\b/i.test(value)) return "Determinant";
    if (/\\(?:sin|cos|tan|cot|sec|csc)\b/i.test(value)) return "Trigonometry";
    if (/\\(?:log|ln)\b/i.test(value)) return "Logarithm";
    if (/\\sqrt\b|√/.test(value)) return "Root";
    if (/=/.test(value)) return "Algebra";
    return "General";
  }
}

module.exports = new NavtaEquationCleaner();

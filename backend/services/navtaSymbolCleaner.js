/**
 * ==========================================================
 * NAVTA AI
 * Complete Safe Mathematical Symbol Cleaner
 * ==========================================================
 *
 * PURPOSE
 * -------
 * 1. Preserve valid LaTeX for KaTeX rendering.
 * 2. Normalize common plain-text mathematical symbols.
 * 3. Never globally replace mathematical variables such as x.
 * 4. Never remove valid LaTeX commands.
 * 5. Support common JEE / Boards / Class 11-12 mathematics.
 */

class NavtaSymbolCleaner {
  clean(input = "") {
    let text = String(input ?? "");

    if (!text) return "";

    text = this.normalizeRelations(text);
    text = this.normalizeArithmetic(text);
    text = this.normalizeArrows(text);
    text = this.normalizeInfinity(text);
    text = this.normalizePlainGreekNames(text);
    text = this.normalizeSetWords(text);
    text = this.normalizeCalculusWords(text);
    text = this.normalizeGeometryWords(text);
    text = this.normalizeMultiplication(text);
    text = this.normalizeSpacing(text);

    return text.trim();
  }

  /**
   * ----------------------------------------------------------
   * RELATIONS
   * ----------------------------------------------------------
   */
  normalizeRelations(text) {
    return String(text)
      .replace(/(^|[^\\])<=/g, "$1≤")
      .replace(/(^|[^\\])>=/g, "$1≥")
      .replace(/(^|[^\\])!=/g, "$1≠")
      .replace(/(^|[^=])==(?!=)/g, "$1=")

      .replace(/\bnot\s+equal\s+to\b/gi, "≠")
      .replace(/\bless\s+than\s+or\s+equal\s+to\b/gi, "≤")
      .replace(/\bgreater\s+than\s+or\s+equal\s+to\b/gi, "≥")

      .replace(/\bapproximately\s+equal\s+to\b/gi, "≈")
      .replace(/\bapproximately\b/gi, "≈");
  }

  /**
   * ----------------------------------------------------------
   * BASIC ARITHMETIC
   * ----------------------------------------------------------
   */
  normalizeArithmetic(text) {
    return String(text)
      .replace(/\+\/-/g, "±")
      .replace(/-\+\//g, "∓")

      .replace(/\bplus\s+or\s+minus\b/gi, "±")
      .replace(/\bminus\s+or\s+plus\b/gi, "∓")

      .replace(/\bdegrees?\b/gi, "°");
  }

  /**
   * ----------------------------------------------------------
   * ARROWS
   * ----------------------------------------------------------
   *
   * Important:
   * Longer arrow patterns are processed first.
   */
  normalizeArrows(text) {
    return String(text)
      .replace(/<==>/g, "⇔")
      .replace(/<=>/g, "⇔")

      .replace(/==>/g, "⇒")
      .replace(/<==/g, "⇐")

      .replace(/<-->/g, "↔")
      .replace(/<->/g, "↔")

      .replace(/-->/g, "→")
      .replace(/->/g, "→")

      .replace(/<--/g, "←")
      .replace(/<-/g, "←");
  }

  /**
   * ----------------------------------------------------------
   * INFINITY
   * ----------------------------------------------------------
   */
  normalizeInfinity(text) {
    return String(text)
      .replace(/\binfinity\b/gi, "∞");
  }

  /**
   * ----------------------------------------------------------
   * GREEK LETTERS
   * ----------------------------------------------------------
   *
   * IMPORTANT:
   * Do NOT convert existing LaTeX such as:
   *
   *   \alpha
   *   \theta
   *   \pi
   *
   * These replacements only target plain English names that
   * are NOT immediately preceded by a backslash.
   */
  normalizePlainGreekNames(text) {
    const greek = {
      alpha: "α",
      beta: "β",
      gamma: "γ",
      delta: "δ",
      epsilon: "ε",
      zeta: "ζ",
      eta: "η",
      theta: "θ",
      iota: "ι",
      kappa: "κ",
      lambda: "λ",
      mu: "μ",
      nu: "ν",
      xi: "ξ",
      omicron: "ο",
      pi: "π",
      rho: "ρ",
      sigma: "σ",
      tau: "τ",
      upsilon: "υ",
      phi: "φ",
      chi: "χ",
      psi: "ψ",
      omega: "ω"
    };

    let output = String(text);

    Object.entries(greek).forEach(([name, symbol]) => {
      const regex = new RegExp(
        `(^|[^\\\\A-Za-z])${name}(?=$|[^A-Za-z])`,
        "gi"
      );

      output = output.replace(
        regex,
        (_, prefix) => `${prefix}${symbol}`
      );
    });

    return output;
  }

  /**
   * ----------------------------------------------------------
   * SET THEORY
   * ----------------------------------------------------------
   */
  normalizeSetWords(text) {
    return String(text)

      .replace(/\bempty\s+set\b/gi, "∅")

      .replace(/\belement\s+of\b/gi, "∈")
      .replace(/\bbelongs\s+to\b/gi, "∈")

      .replace(/\bnot\s+an?\s+element\s+of\b/gi, "∉")
      .replace(/\bdoes\s+not\s+belong\s+to\b/gi, "∉")

      .replace(/\bsubset\s+or\s+equal\s+to\b/gi, "⊆")
      .replace(/\bsuperset\s+or\s+equal\s+to\b/gi, "⊇")

      .replace(/\bproper\s+subset\b/gi, "⊂")
      .replace(/\bproper\s+superset\b/gi, "⊃")

      .replace(/\bunion\b/gi, "∪")
      .replace(/\bintersection\b/gi, "∩");
  }

  /**
   * ----------------------------------------------------------
   * CALCULUS
   * ----------------------------------------------------------
   *
   * Only normalize plain English descriptions.
   * Existing LaTeX commands are preserved.
   */
  normalizeCalculusWords(text) {
    return String(text)

      .replace(
        /(^|[^\\A-Za-z])double\s+integral(?=$|[^A-Za-z])/gi,
        "$1∬"
      )

      .replace(
        /(^|[^\\A-Za-z])triple\s+integral(?=$|[^A-Za-z])/gi,
        "$1∭"
      )

      .replace(
        /(^|[^\\A-Za-z])integral(?=$|[^A-Za-z])/gi,
        "$1∫"
      )

      .replace(
        /(^|[^\\A-Za-z])summation(?=$|[^A-Za-z])/gi,
        "$1∑"
      )

      .replace(
        /(^|[^\\A-Za-z])product(?=$|[^A-Za-z])/gi,
        "$1∏"
      )

      .replace(
        /(^|[^\\A-Za-z])partial\s+derivative(?=$|[^A-Za-z])/gi,
        "$1∂"
      );
  }

  /**
   * ----------------------------------------------------------
   * GEOMETRY
   * ----------------------------------------------------------
   */
  normalizeGeometryWords(text) {
    return String(text)

      .replace(/\bperpendicular\s+to\b/gi, "⊥")

      .replace(/\bparallel\s+to\b/gi, "∥")

      .replace(/\bangle\s+(?=[A-Z]{2,3}\b)/g, "∠")

      .replace(/\btriangle\s+(?=[A-Z]{3}\b)/gi, "△");
  }

  /**
   * ----------------------------------------------------------
   * MULTIPLICATION
   * ----------------------------------------------------------
   *
   * NEVER:
   *
   * x -> ×
   *
   * because x is normally a mathematical variable.
   *
   * Convert only obvious numeric multiplication:
   *
   * 2 x 3
   * 10 X 20
   */
  normalizeMultiplication(text) {
    return String(text)
      .replace(
        /(\d)\s+[xX]\s+(\d)/g,
        "$1 × $2"
      );
  }

  /**
   * ----------------------------------------------------------
   * SPACING
   * ----------------------------------------------------------
   */
  normalizeSpacing(text) {
    return String(text)

      .replace(/[ \t]{2,}/g, " ")

      .replace(/[ \t]+\n/g, "\n");
  }

  /**
   * ----------------------------------------------------------
   * DETECTION
   * ----------------------------------------------------------
   *
   * Useful if another NAVTA service needs to determine
   * whether the string contains mathematical content.
   */
  hasMathSymbols(input = "") {
    const text = String(input ?? "");

    return /[
      ≤≥≠≈±∓∞
      ∈∉⊂⊃⊆⊇∪∩
      ∫∬∭∑∏∂
      →←↔⇒⇐⇔
      ∠△⊥∥
      αβγδεζηθικλμνξοπρστυφχψω
    ]/x.test?.(text) || this.hasMathSymbolsFallback(text);
  }

  hasMathSymbolsFallback(text) {
    return /[≤≥≠≈±∓∞∈∉⊂⊃⊆⊇∪∩∫∬∭∑∏∂→←↔⇒⇐⇔∠△⊥∥αβγδεζηθικλμνξοπρστυφχψω]/.test(
      text
    );
  }
}

module.exports = new NavtaSymbolCleaner();

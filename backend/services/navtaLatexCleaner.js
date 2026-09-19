/**
 * NAVTA AI - Safe LaTeX Cleaner
 *
 * Goals:
 * - Preserve valid KaTeX/LaTeX.
 * - Repair known Gemini JSON escape corruption.
 * - Repair accidental \A, \C, \G, \K style commands.
 * - Convert Unicode sub/superscripts inside math back to LaTeX.
 * - Never globally remove valid LaTeX backslashes.
 */

class NavtaLatexCleaner {
  clean(input = "") {
    let text = String(input ?? "");

    if (!text) {
      return "";
    }

    text = this.repairJsonControlEscapes(text);
    text = this.normalizeDoubleEscapedCommands(text);
    text = this.normalizeCommonAliases(text);

    // Only repair mathematical portions.
    text = this.repairMathSegments(text);

    text = this.repairSpacing(text);

    return text.trim();
  }

  // =====================================================
  // JSON CONTROL CHARACTER REPAIR
  // =====================================================

  repairJsonControlEscapes(text) {
    return String(text)

      // \right became carriage-return + "ight"
      .replace(/\x0D(?=ight\b)/g, "\\right")

      // \frac became form-feed + "rac"
      .replace(/\x0C(?=rac\b)/g, "\\frac")

      // \begin became backspace + "egin"
      .replace(/\x08(?=egin\b)/g, "\\begin")

      // \theta / \times / \text became TAB + remainder
      .replace(/\x09(?=heta\b)/g, "\\theta")
      .replace(/\x09(?=imes\b)/g, "\\times")
      .replace(/\x09(?=ext\b)/g, "\\text")

      // \nabla / \neq / \nu became newline + remainder.
      // These are intentionally narrow.
      .replace(/\x0A(?=abla\b)/g, "\\nabla")
      .replace(/\x0A(?=eq\b)/g, "\\neq")
      .replace(/\x0A(?=u\b)/g, "\\nu");
  }

  // =====================================================
  // DOUBLE ESCAPED COMMANDS
  // =====================================================

  normalizeDoubleEscapedCommands(text) {
    const commands = [
      "begin",
      "end",

      "frac",
      "dfrac",
      "tfrac",
      "sqrt",
      "binom",

      "left",
      "right",

      "sum",
      "prod",
      "coprod",

      "int",
      "iint",
      "iiint",
      "oint",

      "lim",

      "sin",
      "cos",
      "tan",
      "cot",
      "sec",
      "csc",

      "sinh",
      "cosh",
      "tanh",

      "log",
      "ln",
      "exp",
      "det",

      "min",
      "max",
      "sup",
      "inf",

      "cdot",
      "cdotp",
      "times",
      "div",

      "pm",
      "mp",

      "alpha",
      "beta",
      "gamma",
      "delta",
      "epsilon",
      "varepsilon",
      "zeta",
      "eta",
      "theta",
      "vartheta",
      "iota",
      "kappa",
      "lambda",
      "mu",
      "nu",
      "xi",
      "omicron",
      "pi",
      "varpi",
      "rho",
      "varrho",
      "sigma",
      "varsigma",
      "tau",
      "upsilon",
      "phi",
      "varphi",
      "chi",
      "psi",
      "omega",

      "Gamma",
      "Delta",
      "Theta",
      "Lambda",
      "Xi",
      "Pi",
      "Sigma",
      "Upsilon",
      "Phi",
      "Psi",
      "Omega",

      "vec",
      "overrightarrow",
      "overleftarrow",
      "hat",
      "widehat",
      "bar",
      "overline",
      "underline",
      "dot",
      "ddot",

      "partial",
      "nabla",

      "rightarrow",
      "leftarrow",
      "leftrightarrow",

      "Rightarrow",
      "Leftarrow",
      "Leftrightarrow",

      "longrightarrow",
      "longleftarrow",
      "longleftrightarrow",

      "Longrightarrow",
      "Longleftarrow",
      "Longleftrightarrow",

      "uparrow",
      "downarrow",
      "updownarrow",

      "Uparrow",
      "Downarrow",
      "Updownarrow",

      "mapsto",

      "le",
      "leq",
      "ge",
      "geq",

      "ne",
      "neq",

      "approx",
      "equiv",
      "sim",
      "simeq",
      "cong",
      "propto",

      "ll",
      "gg",

      "in",
      "notin",

      "subset",
      "subseteq",
      "supset",
      "supseteq",

      "cup",
      "cap",

      "emptyset",
      "varnothing",

      "forall",
      "exists",

      "infty",

      "therefore",
      "because",

      "perp",
      "parallel",

      "angle",
      "triangle",

      "circ",
      "degree",

      "oplus",
      "ominus",
      "otimes",
      "oslash",
      "odot",

      "wedge",
      "vee",

      "land",
      "lor",

      "text",
      "textrm",
      "textbf",

      "mathrm",
      "mathbf",
      "mathit",
      "mathbb",
      "mathcal",
      "mathfrak",

      "operatorname",

      "ce",
      "pu",
    ].join("|");

    /*
     * Convert:
     *
     * \\frac -> \frac
     *
     * but only for known commands.
     *
     * This deliberately does NOT globally replace "\\"
     * because \\ is required for matrix row separators.
     */

    return String(text).replace(
      new RegExp(
        `\\\\\\\\(?=(?:${commands})\\b)`,
        "g"
      ),
      "\\"
    );
  }

  // =====================================================
  // COMMON ALIASES
  // =====================================================

  normalizeCommonAliases(text) {
    return String(text)
      .replace(
        /\\operatorname\s*\{\s*sin\s*\}/gi,
        "\\sin"
      )
      .replace(
        /\\operatorname\s*\{\s*cos\s*\}/gi,
        "\\cos"
      )
      .replace(
        /\\operatorname\s*\{\s*tan\s*\}/gi,
        "\\tan"
      )
      .replace(
        /\\operatorname\s*\{\s*cot\s*\}/gi,
        "\\cot"
      )
      .replace(
        /\\cdotp\b/g,
        "\\cdot"
      );
  }

  // =====================================================
  // REPAIR ONLY $...$ / $$...$$
  // =====================================================

  repairMathSegments(text) {
    return String(text).replace(
      /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g,
      (segment) => {
        if (
          segment.startsWith("$$") &&
          segment.endsWith("$$")
        ) {
          const content =
            segment.slice(2, -2);

          return `$$${this.repairMath(
            content
          )}$$`;
        }

        const content =
          segment.slice(1, -1);

        return `$${this.repairMath(
          content
        )}$`;
      }
    );
  }

  // =====================================================
  // MATH REPAIR
  // =====================================================

  repairMath(math) {
    let value = String(math ?? "");

    if (!value) {
      return "";
    }

    value =
      this.repairUnicodeScripts(value);

    value =
      this.repairAccidentalLetterCommands(
        value
      );

    return value;
  }

  // =====================================================
  // UNICODE SUBSCRIPT / SUPERSCRIPT -> LATEX
  // =====================================================

  repairUnicodeScripts(text) {
    const subscriptMap = {
      "₀": "0",
      "₁": "1",
      "₂": "2",
      "₃": "3",
      "₄": "4",
      "₅": "5",
      "₆": "6",
      "₇": "7",
      "₈": "8",
      "₉": "9",

      "₊": "+",
      "₋": "-",
      "₌": "=",
      "₍": "(",
      "₎": ")",
    };

    const superscriptMap = {
      "⁰": "0",
      "¹": "1",
      "²": "2",
      "³": "3",
      "⁴": "4",
      "⁵": "5",
      "⁶": "6",
      "⁷": "7",
      "⁸": "8",
      "⁹": "9",

      "⁺": "+",
      "⁻": "-",
      "⁼": "=",
      "⁽": "(",
      "⁾": ")",
    };

    let value = String(text);

    // ---------------------------------------------
    // SUBSCRIPTS
    //
    // K₍₅₎ -> K_{(5)}
    // A₅₊₅ -> A_{5+5}
    // G₁   -> G_{1}
    // ---------------------------------------------

    value = value.replace(
      /[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎]+/g,
      (match) => {
        const converted = [...match]
          .map(
            (character) =>
              subscriptMap[character] ||
              character
          )
          .join("");

        return `_{${converted}}`;
      }
    );

    // ---------------------------------------------
    // SUPERSCRIPTS
    //
    // x²   -> x^{2}
    // xⁿ is left alone because this map intentionally
    // only handles the known numeric/operator set.
    // ---------------------------------------------

    value = value.replace(
      /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾]+/g,
      (match) => {
        const converted = [...match]
          .map(
            (character) =>
              superscriptMap[character] ||
              character
          )
          .join("");

        return `^{${converted}}`;
      }
    );

    return value;
  }

  // =====================================================
  // ACCIDENTAL \A, \C, \G, \K...
  // =====================================================

  repairAccidentalLetterCommands(text) {
    /*
     * Gemini/OCR occasionally produces:
     *
     * \K_{(5)}
     * \C_{(5)}
     * \A_{5+5}
     * \G_1
     *
     * KaTeX interprets these as commands and throws:
     *
     * Undefined control sequence: \K
     *
     * An isolated backslash followed by ONE Latin letter is
     * not a standard NAVTA LaTeX command, so remove only that
     * accidental slash.
     *
     * This DOES NOT touch:
     *
     * \Gamma
     * \Delta
     * \alpha
     * \frac
     * \sqrt
     * \oplus
     * \uparrow
     * etc.
     */

    return String(text).replace(
      /\\([A-Za-z])(?=(?:[_^]|\s|[+\-=(),.;:[\]{}]|$))/g,
      "$1"
    );
  }

  // =====================================================
  // SPACING
  // =====================================================

  repairSpacing(text) {
    return String(text)
      .replace(
        /\\\s+(?=[A-Za-z])/g,
        "\\"
      )
      .replace(
        /[ \t]+\n/g,
        "\n"
      );
  }
}

module.exports =
  new NavtaLatexCleaner();

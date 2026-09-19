/**
 * NAVTA AI - Safe LaTeX Cleaner
 * Preserves valid LaTeX. Only repairs conservative, known formatting issues.
 */
class NavtaLatexCleaner {
  clean(input = "") {
    let text = String(input ?? "");
    if (!text) return "";

    text = this.repairJsonControlEscapes(text);
    text = this.normalizeDoubleEscapedCommands(text);
    text = this.normalizeCommonAliases(text);
    text = this.repairSpacing(text);

    return text.trim();
  }

  repairJsonControlEscapes(text) {
    return String(text)
      .replace(/\r(?=ight\b)/g, "\\right")
      .replace(/\f(?=rac\b)/g, "\\frac")
      .replace(/\b(?=egin\b)/g, "\\begin")
      .replace(/\t(?=heta\b)/g, "\\theta")
      .replace(/\t(?=imes\b)/g, "\\times")
      .replace(/\n(?=abla\b)/g, "\\nabla")
      .replace(/\n(?=eq\b)/g, "\\neq")
      .replace(/\n(?=u\b)/g, "\\nu");
  }

  normalizeDoubleEscapedCommands(text) {
    const commands = "begin|end|frac|dfrac|tfrac|sqrt|left|right|sum|prod|int|iint|iiint|oint|lim|sin|cos|tan|cot|sec|csc|log|ln|exp|det|binom|cdot|times|div|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|psi|omega|vec|hat|bar|dot|partial|nabla|rightarrow|leftarrow|leftrightarrow|leq|geq|neq|approx|infty|text|mathrm|mathbf|mathbb|mathcal|ce|pu";
    return String(text).replace(
      new RegExp(`\\\\\\\\(?=(?:${commands})\\b)`, "g"),
      "\\"
    );
  }

  normalizeCommonAliases(text) {
    return String(text)
      .replace(/\\operatorname\s*\{sin\}/gi, "\\sin")
      .replace(/\\operatorname\s*\{cos\}/gi, "\\cos")
      .replace(/\\operatorname\s*\{tan\}/gi, "\\tan")
      .replace(/\\cdotp\b/g, "\\cdot");
  }

  repairSpacing(text) {
    return String(text)
      .replace(/\\\s+(?=[A-Za-z])/g, "\\")
      .replace(/[ \t]+\n/g, "\n");
  }
}

module.exports = new NavtaLatexCleaner();

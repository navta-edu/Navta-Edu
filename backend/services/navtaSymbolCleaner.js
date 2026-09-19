/**
 * NAVTA AI - Safe Symbol Cleaner
 * Conservative by design: never changes variable x into × and never rewrites
 * words or symbols inside valid LaTeX commands.
 */
class NavtaSymbolCleaner {
  clean(input = "") {
    let text = String(input ?? "");
    if (!text) return "";

    text = text
      .replace(/(^|[^\\])<=/g, "$1≤")
      .replace(/(^|[^\\])>=/g, "$1≥")
      .replace(/(^|[^\\])!=/g, "$1≠")
      .replace(/\+\/-/g, "±")
      .replace(/\b(infinity)\b/gi, "∞")
      .replace(/(\d)\s+[xX]\s+(\d)/g, "$1 × $2");

    return text.trim();
  }
}

module.exports = new NavtaSymbolCleaner();

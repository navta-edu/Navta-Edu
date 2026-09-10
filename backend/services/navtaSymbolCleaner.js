/**
 * ==========================================================
 * NAVTA AI v2
 * Symbol Cleaner
 * ==========================================================
 */

class NavtaSymbolCleaner {

    constructor() {

        this.symbolMap = {

            "<=": "≤",
            ">=": "≥",
            "!=": "≠",
            "==": "=",
            "+-": "±",
            "+/-": "±",
            "sqrt": "√",
            "infinity": "∞",
            "degree": "°",
            "deg": "°",
            "ohm": "Ω",
            "micro": "μ",

            "alpha": "α",
            "beta": "β",
            "gamma": "γ",
            "delta": "δ",
            "theta": "θ",
            "lambda": "λ",
            "sigma": "σ",
            "omega": "ω",
            "phi": "φ",
            "psi": "ψ",
            "pi": "π",

            "->": "→",
            "<-": "←",
            "<->": "↔",

            "x": "×"
        };

    }

    clean(input = "") {

        let text = String(input);

        text = this.replaceBasicSymbols(text);

        text = this.replaceGreekLetters(text);

        text = this.replaceMathSymbols(text);

        text = this.normalizeMultiplication(text);

        return text.trim();

    }

    replaceBasicSymbols(text) {

        Object.entries(this.symbolMap).forEach(([key, value]) => {

            const regex = new RegExp(`\\b${this.escapeRegex(key)}\\b`, "gi");

            text = text.replace(regex, value);

        });

        return text;

    }

    replaceGreekLetters(text) {

        return text
            .replace(/\balpha\b/gi, "α")
            .replace(/\bbeta\b/gi, "β")
            .replace(/\bgamma\b/gi, "γ")
            .replace(/\bdelta\b/gi, "δ")
            .replace(/\btheta\b/gi, "θ")
            .replace(/\blambda\b/gi, "λ")
            .replace(/\bsigma\b/gi, "σ")
            .replace(/\bomega\b/gi, "ω")
            .replace(/\bphi\b/gi, "φ")
            .replace(/\bpsi\b/gi, "ψ")
            .replace(/\bpi\b/gi, "π");

    }

    replaceMathSymbols(text) {

        return text
            .replace(/<=/g, "≤")
            .replace(/>=/g, "≥")
            .replace(/!=/g, "≠")
            .replace(/\+\/-/g, "±")
            .replace(/\+-/g, "±")
            .replace(/\bsqrt\b/gi, "√")
            .replace(/\binfinity\b/gi, "∞");

    }

    normalizeMultiplication(text) {

        return text.replace(/(\d)\s*x\s*(\d)/gi, "$1 × $2");

    }

    escapeRegex(string) {

        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    }

}

module.exports = new NavtaSymbolCleaner();

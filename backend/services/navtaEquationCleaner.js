/**
 * ==========================================================
 * NAVTA AI v2
 * Equation Cleaner
 * ==========================================================
 */

class NavtaEquationCleaner {

    clean(input = "") {

        let text = String(input);

        text = this.normalizeFractions(text);
        text = this.normalizeRoots(text);
        text = this.normalizePowers(text);
        text = this.normalizeSubscripts(text);
        text = this.normalizeOperators(text);
        text = this.normalizeMatrices(text);
        text = this.normalizeVectors(text);
        text = this.normalizeDeterminants(text);
        text = this.normalizeLimits(text);
        text = this.normalizeIntegrals(text);
        text = this.normalizeSummations(text);
        text = this.normalizeChemicalEquations(text);

        return text.trim();

    }

    normalizeFractions(text) {

        return text

            .replace(/(\d+)\s*\/\s*(\d+)/g, "$1/$2")
            .replace(/\\frac\s*\{([^}]*)\}\{([^}]*)\}/g, "\\frac{$1}{$2}");

    }

    normalizeRoots(text) {

        return text

            .replace(/\bsqrt\b/gi, "√")
            .replace(/\\sqrt/g, "√");

    }

    normalizePowers(text) {

        return text

            .replace(/\^2/g, "²")
            .replace(/\^3/g, "³")
            .replace(/\^-1/g, "⁻¹")
            .replace(/\^-2/g, "⁻²")
            .replace(/\^-3/g, "⁻³");

    }

    normalizeSubscripts(text) {

        return text

            .replace(/_1/g, "₁")
            .replace(/_2/g, "₂")
            .replace(/_3/g, "₃")
            .replace(/_4/g, "₄");

    }

    normalizeOperators(text) {

        return text

            .replace(/<=/g, "≤")
            .replace(/>=/g, "≥")
            .replace(/!=/g, "≠")
            .replace(/\+-/g, "±")
            .replace(/\+\/-/g, "±")
            .replace(/->/g, "→")
            .replace(/<-/g, "←")
            .replace(/<=>/g, "⇌")
            .replace(/<->/g, "↔");

    }

    normalizeMatrices(text) {

        return text

            .replace(/\bmatrix\b/gi, "[Matrix]")
            .replace(/\bbmatrix\b/gi, "[Matrix]");

    }

    normalizeVectors(text) {

        return text

            .replace(/\bvec\s*\(([A-Za-z])\)/g, "⃗$1")
            .replace(/\bvector\s+([A-Za-z])/gi, "⃗$1");

    }

    normalizeDeterminants(text) {

        return text

            .replace(/\bdet\b/gi, "det");

    }

    normalizeLimits(text) {

        return text

            .replace(/\blim\b/gi, "lim");

    }

    normalizeIntegrals(text) {

        return text

            .replace(/\bintegral\b/gi, "∫")
            .replace(/\bdouble integral\b/gi, "∬")
            .replace(/\btriple integral\b/gi, "∭");

    }

    normalizeSummations(text) {

        return text

            .replace(/\bsummation\b/gi, "∑")
            .replace(/\bproduct\b/gi, "∏");

    }

    normalizeChemicalEquations(text) {

        return text

            .replace(/-->/g, "→")
            .replace(/<=>/g, "⇌")
            .replace(/<->/g, "⇌");

    }

    /**
     * Detect whether the text contains
     * mathematical content.
     */
    hasEquation(text = "") {

        const patterns = [

            /√/,
            /∫/,
            /∑/,
            /lim/,
            /\^/,
            /=/,
            /≤/,
            /≥/,
            /±/,
            /sin/i,
            /cos/i,
            /tan/i,
            /log/i,
            /ln/i,
            /matrix/i,
            /det/i

        ];

        return patterns.some(pattern => pattern.test(text));

    }

    /**
     * Detect equation category
     */
    detectEquationType(text = "") {

        if (/integral|∫/i.test(text))
            return "Integral";

        if (/lim/i.test(text))
            return "Limit";

        if (/matrix/i.test(text))
            return "Matrix";

        if (/det/i.test(text))
            return "Determinant";

        if (/sin|cos|tan/i.test(text))
            return "Trigonometry";

        if (/log|ln/i.test(text))
            return "Logarithm";

        if (/√/.test(text))
            return "Root";

        if (/=/.test(text))
            return "Algebra";

        return "General";

    }

}

module.exports = new NavtaEquationCleaner();

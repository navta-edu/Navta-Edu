/**
 * ==========================================================
 * NAVTA AI v2
 * LaTeX Cleaner
 * ==========================================================
 */

class NavtaLatexCleaner {

    clean(input = "") {

        let text = String(input);

        text = this.normalizeFractions(text);

        text = this.normalizeSquareRoots(text);

        text = this.normalizePowers(text);

        text = this.normalizeSubscripts(text);

        text = this.normalizeGreekLetters(text);

        text = this.normalizeIntegrals(text);

        text = this.normalizeSummations(text);

        text = this.normalizeLimits(text);

        text = this.normalizeMatrices(text);

        text = this.normalizeVectors(text);

        text = this.removeBrokenLatex(text);

        return text.trim();

    }

    normalizeFractions(text) {

        return text

            .replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, "\\frac{$1}{$2}")

            .replace(/frac\s*\(([^)]*)\)\s*\(([^)]*)\)/gi, "\\frac{$1}{$2}");

    }

    normalizeSquareRoots(text) {

        return text

            .replace(/\\sqrt\s*\{([^}]*)\}/g, "\\sqrt{$1}")

            .replace(/\bsqrt\s*\(([^)]*)\)/gi, "\\sqrt{$1}");

    }

    normalizePowers(text) {

        return text

            .replace(/\^2/g, "^{2}")

            .replace(/\^3/g, "^{3}")

            .replace(/\^n/g, "^{n}")

            .replace(/\^-1/g, "^{-1}")

            .replace(/\^-2/g, "^{-2}");

    }

    normalizeSubscripts(text) {

        return text

            .replace(/_1/g, "_{1}")

            .replace(/_2/g, "_{2}")

            .replace(/_3/g, "_{3}")

            .replace(/_n/g, "_{n}");

    }

    normalizeGreekLetters(text) {

        return text

            .replace(/\balpha\b/gi, "\\alpha")

            .replace(/\bbeta\b/gi, "\\beta")

            .replace(/\bgamma\b/gi, "\\gamma")

            .replace(/\bdelta\b/gi, "\\delta")

            .replace(/\btheta\b/gi, "\\theta")

            .replace(/\blambda\b/gi, "\\lambda")

            .replace(/\bmu\b/gi, "\\mu")

            .replace(/\bphi\b/gi, "\\phi")

            .replace(/\bpi\b/gi, "\\pi")

            .replace(/\bomega\b/gi, "\\omega");

    }

    normalizeIntegrals(text) {

        return text

            .replace(/\bintegral\b/gi, "\\int")

            .replace(/\bdouble integral\b/gi, "\\iint")

            .replace(/\btriple integral\b/gi, "\\iiint");

    }

    normalizeSummations(text) {

        return text

            .replace(/\bsummation\b/gi, "\\sum")

            .replace(/\bproduct\b/gi, "\\prod");

    }

    normalizeLimits(text) {

        return text

            .replace(/\blim\b/gi, "\\lim");

    }

    normalizeMatrices(text) {

        return text

            .replace(/\bmatrix\b/gi, "\\begin{bmatrix}")

            .replace(/\bendmatrix\b/gi, "\\end{bmatrix}");

    }

    normalizeVectors(text) {

        return text

            .replace(/\bvec\s*\(([A-Za-z])\)/g, "\\vec{$1}")

            .replace(/\bvector\s+([A-Za-z])/gi, "\\vec{$1}");

    }

    removeBrokenLatex(text) {

        return text

            .replace(/\\left\s*/g, "")

            .replace(/\\right\s*/g, "")

            .replace(/\\displaystyle/g, "")

            .replace(/\\textstyle/g, "")

            .replace(/\\,/g, " ")

            .replace(/\\!/g, "");

    }

}

module.exports = new NavtaLatexCleaner();

/**
 * ==========================================================
 * NAVTA AI v2
 * Mathematics Cleaner
 * ==========================================================
 */

const chapters = require("../data/maths/chapters.json");
const formulas = require("../data/maths/formulas.json");
const identities = require("../data/maths/identities.json");
const symbols = require("../data/maths/symbols.json");

class NavtaMathCleaner {

    constructor() {

        this.chapters = chapters;
        this.formulas = formulas;
        this.identities = identities;
        this.symbols = symbols;

    }

    clean(input = "") {

        let text = String(input);

        text = this.normalizeSuperscripts(text);

        text = this.normalizeRoots(text);

        text = this.normalizeFractions(text);

        text = this.normalizeTrig(text);

        text = this.normalizeLogs(text);

        text = this.normalizeSets(text);

        text = this.normalizeLimits(text);

        text = this.normalizeIntegrals(text);

        text = this.normalizeSummation(text);

        text = this.normalizeOCR(text);

        return text.trim();

    }

    normalizeSuperscripts(text) {

        return text

            .replace(/\^2/g, "²")
            .replace(/\^3/g, "³")
            .replace(/\^-1/g, "⁻¹")
            .replace(/\^-2/g, "⁻²")
            .replace(/\^-3/g, "⁻³")
            .replace(/\^n/g, "ⁿ");

    }

    normalizeRoots(text) {

        return text

            .replace(/\bsqrt\s*\(/gi, "√(")
            .replace(/\bsqrt\b/gi, "√");

    }

    normalizeFractions(text) {

        return text

            .replace(/1\/2/g, "½")
            .replace(/1\/3/g, "⅓")
            .replace(/2\/3/g, "⅔")
            .replace(/1\/4/g, "¼")
            .replace(/3\/4/g, "¾");

    }

    normalizeTrig(text) {

        return text

            .replace(/\bsin\b/gi, "sin")
            .replace(/\bcos\b/gi, "cos")
            .replace(/\btan\b/gi, "tan")
            .replace(/\bcosec\b/gi, "cosec")
            .replace(/\bsec\b/gi, "sec")
            .replace(/\bcot\b/gi, "cot");

    }

    normalizeLogs(text) {

        return text

            .replace(/\bloge\b/gi, "ln")
            .replace(/\blog\b/gi, "log");

    }

    normalizeSets(text) {

        return text

            .replace(/\bunion\b/gi, "∪")
            .replace(/\bintersection\b/gi, "∩")
            .replace(/\bsubset\b/gi, "⊂")
            .replace(/\bsuperset\b/gi, "⊃")
            .replace(/\binfinity\b/gi, "∞");

    }

    normalizeLimits(text) {

        return text

            .replace(/\blim\b/gi, "lim")
            .replace(/->/g, "→");

    }

    normalizeIntegrals(text) {

        return text

            .replace(/\bintegral\b/gi, "∫")
            .replace(/\bdouble integral\b/gi, "∬")
            .replace(/\btriple integral\b/gi, "∭");

    }

    normalizeSummation(text) {

        return text

            .replace(/\bsummation\b/gi, "∑")
            .replace(/\bproduct\b/gi, "∏");

    }

    normalizeOCR(text) {

        return text

            .replace(/\bln0\b/gi, "ln")
            .replace(/\bco5\b/gi, "cos")
            .replace(/\b5in\b/gi, "sin")
            .replace(/\bt0\b/gi, "to")
            .replace(/\b1og\b/gi, "log")
            .replace(/\bl0g\b/gi, "log");

    }

    detectChapter(text = "") {

        const lower = text.toLowerCase();

        for (const chapter of this.chapters) {

            if (!chapter.aliases) continue;

            for (const alias of chapter.aliases) {

                if (lower.includes(alias.toLowerCase())) {

                    return chapter.name;

                }

            }

        }

        return null;

    }

}

module.exports = new NavtaMathCleaner();

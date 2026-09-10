/**
 * ==========================================================
 * NAVTA AI v2
 * Chemistry Cleaner
 * ==========================================================
 */

const chapters = require("../data/chemistry/chapters.json");
const compounds = require("../data/chemistry/compounds.json");
const reactions = require("../data/chemistry/reactions.json");
const elements = require("../data/chemistry/elements.json");
const symbols = require("../data/chemistry/symbols.json");

class NavtaChemistryCleaner {

    constructor() {

        this.chapters = chapters;
        this.compounds = compounds;
        this.reactions = reactions;
        this.elements = elements;
        this.symbols = symbols;

    }

    clean(input = "") {

        let text = String(input);

        text = this.normalizeChemicalFormula(text);

        text = this.normalizeReactionArrows(text);

        text = this.normalizeCharges(text);

        text = this.normalizeOrganicNotation(text);

        text = this.normalizeStates(text);

        text = this.normalizeGreek(text);

        text = this.normalizeOCR(text);

        return text.trim();

    }

    normalizeChemicalFormula(text) {

        return text

            .replace(/\bH2O\b/g, "H₂O")
            .replace(/\bCO2\b/g, "CO₂")
            .replace(/\bO2\b/g, "O₂")
            .replace(/\bN2\b/g, "N₂")
            .replace(/\bCl2\b/g, "Cl₂")
            .replace(/\bBr2\b/g, "Br₂")
            .replace(/\bI2\b/g, "I₂")
            .replace(/\bH2\b/g, "H₂")
            .replace(/\bNH3\b/g, "NH₃")
            .replace(/\bCH4\b/g, "CH₄")
            .replace(/\bHCl\b/g, "HCl")
            .replace(/\bNaOH\b/g, "NaOH")
            .replace(/\bKOH\b/g, "KOH")
            .replace(/\bHNO3\b/g, "HNO₃")
            .replace(/\bH2SO4\b/g, "H₂SO₄")
            .replace(/\bH3PO4\b/g, "H₃PO₄")
            .replace(/\bNa2CO3\b/g, "Na₂CO₃")
            .replace(/\bCaCO3\b/g, "CaCO₃")
            .replace(/\bKMnO4\b/g, "KMnO₄")
            .replace(/\bK2Cr2O7\b/g, "K₂Cr₂O₇");

    }

    normalizeReactionArrows(text) {

        return text

            .replace(/-->/g, "→")
            .replace(/->/g, "→")
            .replace(/<->/g, "⇌")
            .replace(/<=>/g, "⇌");

    }

    normalizeCharges(text) {

        return text

            .replace(/\^2-/g, "²⁻")
            .replace(/\^3-/g, "³⁻")
            .replace(/\^-/g, "⁻")
            .replace(/\^2\+/g, "²⁺")
            .replace(/\^3\+/g, "³⁺")
            .replace(/\^\+/g, "⁺");

    }

    normalizeOrganicNotation(text) {

        return text

            .replace(/\bCH3\b/g, "CH₃")
            .replace(/\bCH2\b/g, "CH₂")
            .replace(/\bC2H5\b/g, "C₂H₅")
            .replace(/\bC6H6\b/g, "C₆H₆")
            .replace(/\bC2H4\b/g, "C₂H₄")
            .replace(/\bC2H2\b/g, "C₂H₂")
            .replace(/\bC6H12O6\b/g, "C₆H₁₂O₆");

    }

    normalizeStates(text) {

        return text

            .replace(/\(aq\)/gi, "(aq)")
            .replace(/\(g\)/gi, "(g)")
            .replace(/\(l\)/gi, "(l)")
            .replace(/\(s\)/gi, "(s)");

    }

    normalizeGreek(text) {

        return text

            .replace(/\balpha\b/gi, "α")
            .replace(/\bbeta\b/gi, "β")
            .replace(/\bgamma\b/gi, "γ")
            .replace(/\bdelta\b/gi, "δ");

    }

    normalizeOCR(text) {

        return text

            .replace(/\bNaCI\b/g, "NaCl")
            .replace(/\bCI\b/g, "Cl")
            .replace(/\bco2\b/g, "CO₂")
            .replace(/\bo2\b/g, "O₂")
            .replace(/\bnh3\b/g, "NH₃")
            .replace(/\bh2so4\b/g, "H₂SO₄");

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

module.exports = new NavtaChemistryCleaner();

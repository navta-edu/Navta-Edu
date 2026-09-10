/**
 * ==========================================================
 * NAVTA AI v2
 * Physics Cleaner
 * ==========================================================
 */

const chapters = require("../data/physics/chapters.json");
const formulas = require("../data/physics/formulas.json");
const units = require("../data/physics/units.json");
const constants = require("../data/physics/constants.json");
const symbols = require("../data/physics/symbols.json");

class NavtaPhysicsCleaner {

    constructor() {
        this.chapters = chapters;
        this.formulas = formulas;
        this.units = units;
        this.constants = constants;
        this.symbols = symbols;
    }

    clean(input = "") {

        let text = String(input);

        text = this.normalizeUnits(text);

        text = this.normalizeConstants(text);

        text = this.normalizeVectors(text);

        text = this.normalizePhysicsSymbols(text);

        text = this.normalizeSuperscripts(text);

        text = this.normalizeCommonOCR(text);

        return text.trim();
    }

    normalizeUnits(text) {

        return text

            .replace(/\bm\/s2\b/gi, "m/s²")
            .replace(/\bm\/sec2\b/gi, "m/s²")
            .replace(/\bcm2\b/gi, "cm²")
            .replace(/\bcm3\b/gi, "cm³")
            .replace(/\bmm2\b/gi, "mm²")
            .replace(/\bmm3\b/gi, "mm³")
            .replace(/\bm2\b/gi, "m²")
            .replace(/\bm3\b/gi, "m³")
            .replace(/\bkg\/m3\b/gi, "kg/m³")
            .replace(/\bN\/m2\b/gi, "N/m²")
            .replace(/\bJ\/mol K\b/gi, "J/mol·K")
            .replace(/\bkg m\/s\b/gi, "kg·m/s");

    }

    normalizeConstants(text) {

        return text

            .replace(/\b3\s*x\s*10\^8\b/gi, "3 × 10⁸")
            .replace(/\b6\.67\s*x\s*10\^-11\b/gi, "6.67 × 10⁻¹¹")
            .replace(/\b6\.626\s*x\s*10\^-34\b/gi, "6.626 × 10⁻³⁴")
            .replace(/\b1\.602\s*x\s*10\^-19\b/gi, "1.602 × 10⁻¹⁹")
            .replace(/\b6\.022\s*x\s*10\^23\b/gi, "6.022 × 10²³");

    }

    normalizeVectors(text) {

        return text

            .replace(/\bvec\s*\(\s*([A-Za-z])\s*\)/g, "⃗$1")
            .replace(/\bvector\s+([A-Za-z])/gi, "⃗$1");

    }

    normalizePhysicsSymbols(text) {

        return text

            .replace(/\bdelta t\b/gi, "Δt")
            .replace(/\bdelta x\b/gi, "Δx")
            .replace(/\bdelta y\b/gi, "Δy")
            .replace(/\btheta\b/gi, "θ")
            .replace(/\balpha\b/gi, "α")
            .replace(/\bbeta\b/gi, "β")
            .replace(/\bgamma\b/gi, "γ")
            .replace(/\blambda\b/gi, "λ")
            .replace(/\bomega\b/gi, "ω");

    }

    normalizeSuperscripts(text) {

        return text

            .replace(/\^2/g, "²")
            .replace(/\^3/g, "³")
            .replace(/\^-1/g, "⁻¹")
            .replace(/\^-2/g, "⁻²")
            .replace(/\^-3/g, "⁻³");

    }

    normalizeCommonOCR(text) {

        return text

            .replace(/\bms-1\b/gi, "m/s")
            .replace(/\bm s-1\b/gi, "m/s")
            .replace(/\bm sec-1\b/gi, "m/s")
            .replace(/\bmsec-1\b/gi, "m/s")
            .replace(/\bkgm\/s\b/gi, "kg·m/s")
            .replace(/\bN m\b/gi, "N·m")
            .replace(/\bW h\b/gi, "Wh")
            .replace(/\bK Wh\b/gi, "kWh");

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

module.exports = new NavtaPhysicsCleaner();

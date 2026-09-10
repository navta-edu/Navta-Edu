/**
 * ==========================================================
 * NAVTA AI v2
 * Biology Cleaner
 * ==========================================================
 */

const chapters = require("../data/biology/chapters.json");
const keywords = require("../data/biology/keywords.json");
const taxonomy = require("../data/biology/taxonomy.json");
const terms = require("../data/biology/terms.json");
const processes = require("../data/biology/processes.json");

class NavtaBiologyCleaner {

    constructor() {

        this.chapters = chapters;
        this.keywords = keywords;
        this.taxonomy = taxonomy;
        this.terms = terms;
        this.processes = processes;

    }

    clean(input = "") {

        let text = String(input);

        text = this.normalizeBiologicalTerms(text);

        text = this.normalizeScientificNames(text);

        text = this.normalizeGenetics(text);

        text = this.normalizeProcesses(text);

        text = this.normalizeOCR(text);

        return text.trim();

    }

    normalizeBiologicalTerms(text) {

        return text

            .replace(/\bDNA\b/g, "DNA")
            .replace(/\bRNA\b/g, "RNA")
            .replace(/\bATP\b/g, "ATP")
            .replace(/\bADP\b/g, "ADP")
            .replace(/\bNADH\b/g, "NADH")
            .replace(/\bFADH2\b/g, "FADH₂")
            .replace(/\bNADPH\b/g, "NADPH")
            .replace(/\bCO2\b/g, "CO₂")
            .replace(/\bO2\b/g, "O₂")
            .replace(/\bH2O\b/g, "H₂O");

    }

    normalizeScientificNames(text) {

        return text

            .replace(/\bHomo sapiens\b/gi, "Homo sapiens")
            .replace(/\bEscherichia coli\b/gi, "Escherichia coli")
            .replace(/\bPisum sativum\b/gi, "Pisum sativum")
            .replace(/\bMangifera indica\b/gi, "Mangifera indica");

    }

    normalizeGenetics(text) {

        return text

            .replace(/\bmrna\b/gi, "mRNA")
            .replace(/\btrna\b/gi, "tRNA")
            .replace(/\brrna\b/gi, "rRNA")
            .replace(/\bDNA polymerase\b/gi, "DNA polymerase")
            .replace(/\bRNA polymerase\b/gi, "RNA polymerase")
            .replace(/\bchromosome\b/gi, "chromosome")
            .replace(/\bgene\b/gi, "gene")
            .replace(/\bgenome\b/gi, "genome");

    }

    normalizeProcesses(text) {

        return text

            .replace(/\bphotosynthesis\b/gi, "Photosynthesis")
            .replace(/\brespiration\b/gi, "Respiration")
            .replace(/\btranspiration\b/gi, "Transpiration")
            .replace(/\btranslation\b/gi, "Translation")
            .replace(/\btranscription\b/gi, "Transcription")
            .replace(/\breplication\b/gi, "Replication")
            .replace(/\bmitosis\b/gi, "Mitosis")
            .replace(/\bmeiosis\b/gi, "Meiosis");

    }

    normalizeOCR(text) {

        return text

            .replace(/\bdna\b/gi, "DNA")
            .replace(/\brna\b/gi, "RNA")
            .replace(/\batp\b/gi, "ATP")
            .replace(/\bnadh\b/gi, "NADH")
            .replace(/\bco2\b/gi, "CO₂")
            .replace(/\bo2\b/gi, "O₂")
            .replace(/\bh2o\b/gi, "H₂O")
            .replace(/\bprotien\b/gi, "protein")
            .replace(/\benzymee\b/gi, "enzyme")
            .replace(/\bchlorophyII\b/gi, "chlorophyll");

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

module.exports = new NavtaBiologyCleaner();

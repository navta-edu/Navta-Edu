/**
 * ==========================================================
 * NAVTA AI v2
 * OCR Cleaner (Master Pipeline)
 * ==========================================================
 */

const textCleaner = require("./navtaTextCleaner");
const symbolCleaner = require("./navtaSymbolCleaner");
const physicsCleaner = require("./navtaPhysicsCleaner");
const chemistryCleaner = require("./navtaChemistryCleaner");
const mathCleaner = require("./navtaMathCleaner");
const biologyCleaner = require("./navtaBiologyCleaner");
const latexCleaner = require("./navtaLatexCleaner");
const equationCleaner = require("./navtaEquationCleaner");

class NavtaOCRCleaner {

    clean(input = "", subject = "") {

        let text = String(input);

        // Step 1
        text = textCleaner.clean(text);

        // Step 2
        text = symbolCleaner.clean(text);

        // Step 3
        switch ((subject || "").toLowerCase()) {

            case "physics":
                text = physicsCleaner.clean(text);
                break;

            case "chemistry":
                text = chemistryCleaner.clean(text);
                break;

            case "math":
            case "maths":
            case "mathematics":
                text = mathCleaner.clean(text);
                break;

            case "biology":
                text = biologyCleaner.clean(text);
                break;

            default:
                text = physicsCleaner.clean(text);
                text = chemistryCleaner.clean(text);
                text = mathCleaner.clean(text);
                text = biologyCleaner.clean(text);
        }

        // Step 4
        text = latexCleaner.clean(text);

        // Step 5
        text = equationCleaner.clean(text);

        return text.trim();

    }

    detectChapter(text = "", subject = "") {

        switch ((subject || "").toLowerCase()) {

            case "physics":
                return physicsCleaner.detectChapter(text);

            case "chemistry":
                return chemistryCleaner.detectChapter(text);

            case "math":
            case "maths":
            case "mathematics":
                return mathCleaner.detectChapter(text);

            case "biology":
                return biologyCleaner.detectChapter(text);

            default:
                return null;
        }

    }

    hasEquation(text = "") {
        return equationCleaner.hasEquation(text);
    }

    detectEquationType(text = "") {
        return equationCleaner.detectEquationType(text);
    }

}

module.exports = new NavtaOCRCleaner();

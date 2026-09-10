/**
 * ==========================================================
 * NAVTA AI v2
 * Text Cleaner
 * ==========================================================
 */

class NavtaTextCleaner {

    clean(input = "") {

        let text = String(input);

        text = this.removeInvisibleCharacters(text);

        text = this.removeMarkdown(text);

        text = this.removeNavtaVisual(text);

        text = this.normalizeQuotes(text);

        text = this.normalizeDashes(text);

        text = this.normalizeWhitespace(text);

        text = this.normalizeLineBreaks(text);

        text = this.removeDuplicateBlankLines(text);

        text = this.normalizeBullets(text);

        text = this.removeExtraTabs(text);

        return text.trim();

    }

    removeMarkdown(text) {

        return text
            .replace(/```json/gi, "")
            .replace(/```javascript/gi, "")
            .replace(/```js/gi, "")
            .replace(/```/g, "")
            .replace(/`/g, "");

    }

    removeNavtaVisual(text) {

        return text
            .replace(/\[\[NAVTA_VISUAL\]\]/gi, "")
            .replace(/\[NAVTA_VISUAL\]/gi, "")
            .replace(/NAVTA_VISUAL/gi, "");

    }

    removeInvisibleCharacters(text) {

        return text
            .replace(/\u200B/g, "")
            .replace(/\u200C/g, "")
            .replace(/\u200D/g, "")
            .replace(/\uFEFF/g, "")
            .replace(/\u2060/g, "");

    }

    normalizeQuotes(text) {

        return text
            .replace(/[“”]/g, "\"")
            .replace(/[‘’]/g, "'");

    }

    normalizeDashes(text) {

        return text
            .replace(/[–—]/g, "-");

    }

    normalizeWhitespace(text) {

        return text
            .replace(/[ \t]+/g, " ")
            .replace(/\u00A0/g, " ");

    }

    normalizeLineBreaks(text) {

        return text
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");

    }

    removeDuplicateBlankLines(text) {

        return text
            .replace(/\n{3,}/g, "\n\n");

    }

    normalizeBullets(text) {

        return text
            .replace(/[•▪◦●]/g, "-");

    }

    removeExtraTabs(text) {

        return text
            .replace(/\t+/g, " ");

    }

}

module.exports = new NavtaTextCleaner();

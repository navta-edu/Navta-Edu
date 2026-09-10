/**
 * ==========================================================
 * NAVTA AI v2
 * Question Separator
 * ==========================================================
 */

class NavtaQuestionSeparator {

    constructor() {

        this.questionPatterns = [

            /^\d+\./gm,
            /^\d+\)/gm,
            /^\(\d+\)/gm,
            /^Q\.?\s*\d+/gim,
            /^Question\s+\d+/gim

        ];

    }

    separate(text = "") {

        text = String(text)
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");

        const lines = text.split("\n");

        const questions = [];

        let current = null;

        let section = "";

        for (const rawLine of lines) {

            const line = rawLine.trim();

            if (!line)
                continue;

            if (/^SECTION\s+[A-Z]/i.test(line)) {

                section = line;

                continue;

            }

            if (/^PART\s+[A-Z]/i.test(line)) {

                section = line;

                continue;

            }

            if (this.isQuestionStart(line)) {

                if (current) {

                    current.question = current.question.trim();

                    questions.push(current);

                }

                current = {

                    questionNumber: this.extractQuestionNumber(line),

                    section,

                    questionType: "UNKNOWN",

                    question: line,

                    options: [],

                    images: [],

                    equations: [],

                    rawText: line

                };

                continue;

            }

            if (!current)
                continue;

            if (this.isOption(line)) {

                current.options.push(line);

                current.rawText += "\n" + line;

                continue;

            }

            current.question += "\n" + line;

            current.rawText += "\n" + line;

        }

        if (current) {

            current.question = current.question.trim();

            questions.push(current);

        }

        return questions;

    }

    isQuestionStart(line) {

        return this.questionPatterns.some(pattern => pattern.test(line));

    }

    isOption(line) {

        return /^[A-D][.)]/i.test(line)
            || /^\([A-D]\)/i.test(line);

    }

    extractQuestionNumber(line) {

        const match = line.match(/\d+/);

        if (!match)
            return null;

        return Number(match[0]);

    }

}

module.exports = new NavtaQuestionSeparator();

/**
 * ==========================================================
 * NAVTA AI v2
 * AI Router
 * ==========================================================
 */

const ocrCleaner = require("./navtaOCRCleaner");
const separator = require("./navtaQuestionSeparator");
const duplicateDetector = require("./navtaDuplicateDetector");

class NavtaAIRouter {

    constructor() {

        this.confidenceThreshold = 85;

    }

    /**
     * Main router
     */
    process(rawText = "", subject = "") {

        // STEP 1
        const cleanedText = ocrCleaner.clean(rawText, subject);

        // STEP 2
        let questions = separator.separate(cleanedText);

        // STEP 3
        questions = duplicateDetector.removeDuplicates(questions);

        // STEP 4
        questions = questions.map(question => {

            const confidence = this.calculateConfidence(question);

            return {

                ...question,

                confidence,

                needsAI: confidence < this.confidenceThreshold

            };

        });

        return {

            success: true,

            totalQuestions: questions.length,

            cleanedText,

            questions

        };

    }

    /**
     * Confidence Calculator
     */
    calculateConfidence(question) {

        let score = 100;

        if (!question.question || question.question.length < 20)
            score -= 25;

        if (!question.options || question.options.length === 0)
            score -= 15;

        if (question.question.includes("???"))
            score -= 20;

        if (question.question.includes("_____"))
            score -= 15;

        if (question.question.includes("�"))
            score -= 20;

        if (question.question.match(/\bOCR\b/i))
            score -= 15;

        return Math.max(0, Math.min(score, 100));

    }

    /**
     * Should Gemini be called?
     */
    shouldUseAI(question) {

        return question.confidence < this.confidenceThreshold;

    }

    /**
     * Statistics
     */
    getStatistics(result) {

        const aiQuestions = result.questions.filter(q => q.needsAI);

        const localQuestions = result.questions.filter(q => !q.needsAI);

        return {

            total: result.questions.length,

            local: localQuestions.length,

            ai: aiQuestions.length,

            aiPercentage:

                result.questions.length === 0

                    ? 0

                    : Number(

                        (

                            aiQuestions.length /

                            result.questions.length *

                            100

                        ).toFixed(2)

                    )

        };

    }

}

module.exports = new NavtaAIRouter();

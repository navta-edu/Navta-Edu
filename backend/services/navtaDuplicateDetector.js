/**
 * ==========================================================
 * NAVTA AI v2
 * Duplicate Detector
 * ==========================================================
 */

const crypto = require("crypto");

class NavtaDuplicateDetector {

    /**
     * Create SHA256 hash
     */
    createHash(text = "") {

        return crypto
            .createHash("sha256")
            .update(this.normalize(text))
            .digest("hex");

    }

    /**
     * Normalize text before comparison
     */
    normalize(text = "") {

        return String(text)
            .toLowerCase()
            .replace(/\s+/g, " ")
            .replace(/[^\w\s]/g, "")
            .trim();

    }

    /**
     * Exact duplicate
     */
    isExactDuplicate(questionA = "", questionB = "") {

        return this.createHash(questionA) === this.createHash(questionB);

    }

    /**
     * Simple similarity score
     */
    similarity(questionA = "", questionB = "") {

        const a = this.normalize(questionA);
        const b = this.normalize(questionB);

        if (!a.length || !b.length)
            return 0;

        const wordsA = new Set(a.split(" "));
        const wordsB = new Set(b.split(" "));

        let intersection = 0;

        wordsA.forEach(word => {

            if (wordsB.has(word))
                intersection++;

        });

        const union = new Set([...wordsA, ...wordsB]).size;

        return union === 0
            ? 0
            : Number(((intersection / union) * 100).toFixed(2));

    }

    /**
     * Check duplicate
     */
    isDuplicate(questionA = "", questionB = "", threshold = 90) {

        if (this.isExactDuplicate(questionA, questionB))
            return true;

        return this.similarity(questionA, questionB) >= threshold;

    }

    /**
     * Remove duplicates from array
     */
    removeDuplicates(questions = []) {

        const unique = [];

        const hashes = new Set();

        for (const question of questions) {

            const text = question.question || "";

            const hash = this.createHash(text);

            if (hashes.has(hash))
                continue;

            hashes.add(hash);

            unique.push(question);

        }

        return unique;

    }

}

module.exports = new NavtaDuplicateDetector();

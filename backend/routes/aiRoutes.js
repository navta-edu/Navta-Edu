const express = require("express");

const router = express.Router();

// ============================================
// NAVTA AI SYSTEM PROMPT
// ============================================

const NAVTA_SYSTEM_PROMPT = `
You are NAVTA AI Tutor.

You are an academic assistant for Class 11 and Class 12 students.

You mainly help students preparing for:

- JEE
- NEET
- CBSE / School Boards

Subjects:

- Physics
- Chemistry
- Mathematics
- Biology

Your behaviour:

1. Explain concepts clearly and simply.
2. Give step-by-step solutions when needed.
3. For Physics and Maths:
   - show formulas
   - show calculations
   - explain each step
4. For Chemistry:
   - explain reactions
   - explain concepts
   - explain mechanisms when appropriate
5. For Biology:
   - use clear NCERT-style terminology
   - keep explanations exam-oriented
6. If the student asks for a hint:
   - give only a hint
   - do not reveal the full answer immediately
7. If the student asks for a practice question:
   - generate a relevant question
   - do not give the answer unless asked
8. If the student gives a wrong answer:
   - explain why it is wrong
   - explain the correct concept
9. Keep answers concise unless the student asks for detail.
10. Never pretend to know something you are unsure about.
11. If a question is unclear, ask for clarification.
12. Do not claim to be a human teacher.

You are part of the NAVTA learning platform.
`;

// ============================================
// HELPER
// ============================================

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item) => {
      return (
        item &&
        typeof item.content === "string" &&
        ["user", "assistant"].includes(
          item.role
        )
      );
    })
    .slice(-10)
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }));
}

// ============================================
// NAVTA AI CHAT
// ============================================

router.post(
  "/chat",
  async (req, res) => {
    try {
      const {
        message,
        history = [],
      } = req.body;

      // ========================================
      // VALIDATION
      // ========================================

      if (
        !message ||
        typeof message !== "string" ||
        !message.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a message.",
        });
      }

      if (
        message.length > 3000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Message is too long.",
        });
      }

      // ========================================
      // ENVIRONMENT VARIABLES
      // ========================================

      const apiKey =
        process.env.AI_API_KEY;

      const apiUrl =
        process.env.AI_API_URL;

      const model =
        process.env.AI_MODEL;

      if (
        !apiKey ||
        !apiUrl ||
        !model
      ) {
        console.error(
          "NAVTA AI environment variables are missing."
        );

        return res.status(503).json({
          success: false,
          message:
            "NAVTA AI is not configured yet.",
        });
      }

      // ========================================
      // CHAT HISTORY
      // ========================================

      const safeHistory =
        normalizeHistory(
          history
        );

      const messages = [
        {
          role: "system",
          content:
            NAVTA_SYSTEM_PROMPT,
        },

        ...safeHistory,

        {
          role: "user",
          content:
            message.trim(),
        },
      ];

      // ========================================
      // CALL AI PROVIDER
      // ========================================

      const aiResponse =
        await fetch(
          apiUrl,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${apiKey}`,
            },

            body:
              JSON.stringify({
                model,

                messages,

                temperature:
                  0.4,

                max_tokens:
                  1200,
              }),
          }
        );

      // ========================================
      // PROVIDER ERROR
      // ========================================

      if (
        !aiResponse.ok
      ) {
        const errorText =
          await aiResponse.text();

        console.error(
          "NAVTA AI Provider Error:"
        );

        console.error(
          errorText
        );

        return res.status(502).json({
          success: false,

          message:
            "NAVTA AI provider is temporarily unavailable.",
        });
      }

      // ========================================
      // PROVIDER RESPONSE
      // ========================================

      const data =
        await aiResponse.json();

      const reply =
        data?.choices?.[0]
          ?.message
          ?.content
          ?.trim();

      if (!reply) {
        console.error(
          "NAVTA AI returned no usable reply:",
          data
        );

        return res.status(502).json({
          success: false,

          message:
            "NAVTA AI returned an empty response.",
        });
      }

      // ========================================
      // SUCCESS
      // ========================================

      return res.status(200).json({
        success: true,
        reply,
      });
    } catch (error) {
      console.error("");
      console.error(
        "================================"
      );
      console.error(
        "NAVTA AI ERROR"
      );
      console.error(
        "================================"
      );
      console.error(error);
      console.error("");

      return res.status(500).json({
        success: false,

        message:
          "NAVTA AI could not process your request.",
      });
    }
  }
);

module.exports = router;

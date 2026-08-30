const express = require("express");

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const response = await fetch(
      process.env.AI_API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
        },

        body: JSON.stringify({
          model: process.env.AI_MODEL,

          messages: [
            {
              role: "system",
              content: `
You are NAVTA AI Tutor.

You help Class 11 and Class 12 students preparing for:

- JEE
- NEET
- Boards

Subjects:
- Physics
- Chemistry
- Mathematics
- Biology

Rules:

1. Explain concepts clearly.
2. Use simple student-friendly language.
3. Show formulas when needed.
4. Solve numerical questions step by step.
5. For Maths and Physics, show calculations clearly.
6. For Biology, explain using NCERT-style terminology where appropriate.
7. For Chemistry, explain reactions and concepts clearly.
8. If a student asks for a hint, do not reveal the full answer immediately.
9. Encourage understanding instead of memorisation.
10. If you are unsure about an answer, say so instead of inventing information.

You are part of the NAVTA learning platform.
              `,
            },

            {
              role: "user",
              content: message,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "AI Provider Error:",
        errorText
      );

      return res.status(502).json({
        success: false,
        message:
          "NAVTA AI provider is currently unavailable.",
      });
    }

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        success: false,
        message:
          "NAVTA AI returned an invalid response.",
      });
    }

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error(
      "NAVTA AI Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "NAVTA AI could not process your request.",
    });
  }
});

module.exports = router;

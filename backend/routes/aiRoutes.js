const express = require("express");

const router = express.Router();

// ============================================
// NAVTA AI CHAT
// ============================================

router.post("/chat", async (req, res) => {
  try {
    const {
      message
    } = req.body;

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // ========================================
    // TEMPORARY TEST RESPONSE
    // ========================================
    //
    // We are testing the frontend/backend
    // connection first.
    //
    // After this works, we will connect
    // Gemini / Groq / Hugging Face.
    //

    const reply = `
Hello 👋

NAVTA AI received your message:

"${message}"

The chatbot backend connection is working correctly.

Next, we will connect the actual AI model.
    `.trim();

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error(
      "NAVTA AI Chat Error:",
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

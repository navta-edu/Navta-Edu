const express = require("express");

const app = express();

const PORT =
  Number(process.env.NAVTA_AI_GATEWAY_PORT) || 5050;

const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://127.0.0.1:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL ||
  "qwen2.5vl:3b";

const NAVTA_AI_SECRET =
  process.env.9fe19ffe79e856af9450d1aa03099f88ec3581230583b8465bdf6a43c7ca1c7b;

// Increase Qwen context window.
// The previous 4096-token context was too small
// for NAVTA PDF page analysis.
const OLLAMA_NUM_CTX =
  Number(process.env.OLLAMA_NUM_CTX) || 16384;

app.use(
  express.json({
    limit: "30mb",
  })
);

// ============================================
// HEALTH CHECK
// ============================================

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "NAVTA AI Gateway",
    model: OLLAMA_MODEL,
    contextSize: OLLAMA_NUM_CTX,
  });
});

// ============================================
// AUTHENTICATION
// ============================================

function authenticate(req, res, next) {
  if (!NAVTA_AI_SECRET) {
    return res.status(500).json({
      success: false,
      message: "NAVTA_AI_SECRET is not configured.",
    });
  }

  const providedSecret =
    req.headers["x-navta-ai-key"];

  if (
    !providedSecret ||
    providedSecret !== NAVTA_AI_SECRET
  ) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized.",
    });
  }

  next();
}

// ============================================
// NAVTA QUESTION ANALYSIS
// ============================================

app.post(
  "/api/navta/analyse",
  authenticate,
  async (req, res) => {
    try {
      const { prompt, image } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          message: "Prompt is required.",
        });
      }

      const message = {
        role: "user",
        content: String(prompt),
      };

      if (image) {
        message.images = [
          String(image),
        ];
      }

      console.log(
        "NAVTA AI request received."
      );

      console.log(
        `Model: ${OLLAMA_MODEL}`
      );

      console.log(
        `Context size: ${OLLAMA_NUM_CTX}`
      );

      const response = await fetch(
        `${OLLAMA_URL}/api/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            model:
              OLLAMA_MODEL,

            stream:
              false,

            format:
              "json",

            messages: [
              message,
            ],

            options: {
              temperature:
                0.1,

              num_ctx:
                OLLAMA_NUM_CTX,
            },
          }),
        }
      );

      const responseText =
        await response.text();

      let ollamaData;

      try {
        ollamaData =
          JSON.parse(
            responseText
          );
      } catch {
        console.error(
          "OLLAMA INVALID RESPONSE:",
          responseText
        );

        return res.status(502).json({
          success: false,

          message:
            "Ollama returned an invalid response.",
        });
      }

      if (!response.ok) {
        console.error(
          "OLLAMA REQUEST ERROR:",
          ollamaData
        );

        return res
          .status(
            response.status
          )
          .json({
            success:
              false,

            message:
              ollamaData?.error ||
              "Ollama request failed.",
          });
      }

      const content =
        ollamaData?.message?.content;

      if (!content) {
        return res.status(502).json({
          success: false,

          message:
            "Ollama returned no content.",
        });
      }

      console.log(
        "NAVTA AI analysis completed successfully."
      );

      return res.json({
        success: true,

        model:
          OLLAMA_MODEL,

        content,
      });
    } catch (error) {
      console.error(
        "NAVTA AI GATEWAY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "NAVTA AI Gateway request failed.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// START
// ============================================

app.listen(
  PORT,
  "127.0.0.1",
  () => {
    console.log(
      `NAVTA AI Gateway running on http://127.0.0.1:${PORT}`
    );

    console.log(
      `Ollama model: ${OLLAMA_MODEL}`
    );

    console.log(
      `Ollama context size: ${OLLAMA_NUM_CTX}`
    );
  }
);

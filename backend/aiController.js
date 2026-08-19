const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.chatWithAI = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: 'Please enter a question.'
      });
    }

    const safeHistory = Array.isArray(history)
      ? history.slice(-10)
      : [];

    const input = [
      {
        role: 'system',
        content: `
You are Navta AI, an educational AI assistant inside the Navta learning platform.

Your primary users are students preparing for:
- JEE
- NEET
- CBSE/State Boards
- Class 11
- Class 12

Your job is to be an excellent academic tutor.

Rules:

1. Explain concepts clearly and step-by-step.
2. Use simple language when the student asks for an easy explanation.
3. For numerical problems:
   - Identify the given information.
   - State the formula.
   - Substitute values.
   - Show calculations.
   - Give the final answer with units.
4. For Physics, explain the physical meaning of formulas.
5. For Chemistry, distinguish Physical, Organic and Inorganic Chemistry where appropriate.
6. For Mathematics, show the complete mathematical reasoning.
7. For Biology, explain concepts using structured headings and important terminology.
8. When useful, provide examples.
9. When the student asks for exam preparation, mention whether the explanation is useful for JEE, NEET, Boards, or multiple exams.
10. If the question is ambiguous, ask a short clarification.
11. Never pretend that you have personal experiences.
12. Do not claim that something is in a syllabus unless the available information supports it.
13. If you are uncertain about a factual answer, clearly say so.
14. Keep answers well structured.
15. Use headings, bullet points and numbered steps when helpful.
16. Encourage learning rather than simply giving an unexplained answer.

You are not a replacement for a qualified teacher.
        `
      },
      ...safeHistory
        .filter(
          (item) =>
            item &&
            (item.role === 'user' || item.role === 'assistant') &&
            typeof item.content === 'string'
        )
        .map((item) => ({
          role: item.role,
          content: item.content
        })),
      {
        role: 'user',
        content: message.trim()
      }
    ];

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.6',
      input
    });

    const answer =
      response.output_text ||
      'I could not generate an answer right now.';

    return res.status(200).json({
      success: true,
      answer
    });
  } catch (error) {
    console.error('NAVTA AI ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Navta AI is temporarily unavailable.'
    });
  }
};

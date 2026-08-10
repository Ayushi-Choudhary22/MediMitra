const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function requestGemini({ apiKey, systemInstruction, contents, temperature }) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: { temperature, responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API error (${response.status}): ${errText || response.statusText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini API returned an empty response');

  return text.replace(/```json|```/g, '').trim();
}

/**
 * Calls the Gemini API and returns the parsed JSON object from its response.
 * Expects the model to be instructed (via systemInstruction) to return raw JSON only.
 *
 * Even with JSON mode enabled, Gemini occasionally returns a response with
 * a stray unescaped character that breaks strict JSON.parse. That's a rare,
 * transient generation issue — not something worth showing the user raw
 * parser error text for — so we retry once automatically before giving up
 * with a clean, user-safe error message.
 */
async function callGemini({ apiKey, systemInstruction, contents, temperature = 0.4 }) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const cleaned = await requestGemini({ apiKey, systemInstruction, contents, temperature });
    try {
      return JSON.parse(cleaned);
    } catch (parseErr) {
      if (attempt === 2) {
        throw new Error('The AI assistant had trouble generating a response just now. Please try again.');
      }
      // fall through and retry
    }
  }
}

module.exports = { callGemini };
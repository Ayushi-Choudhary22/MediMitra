const { callGemini } = require('../utils/geminiClient');

const DISCLAIMER = 'This information is AI generated and should not replace professional medical advice.';

// Gives the assistant accurate, current knowledge of what each role can
// actually do in the app, so its navigation help matches the real UI
// instead of guessing.
const APP_GUIDE = `
MediMitra app structure, by role:

PATIENT (after logging in, on the Patient Dashboard, top tabs):
- "My Status" — see your current token/queue position if you have an active appointment
- "Book Appointment" — pick a department, then a specific doctor, then pay via Razorpay to confirm the booking
- "Bed Availability" — check hospital bed availability by ward
- "Visit History" — see past visits; if a doctor left prescription notes, an "Explain Prescription" button appears to get a plain-English AI explanation
- "AI Assistant" — describe symptoms to get safe home-care tips and a department recommendation, with real doctors shown
- "Previous Chats" — reopen any past AI Assistant conversation

DOCTOR (on the Doctor Dashboard):
- "Patients" — see the current patient queue; "Call" to bring in a waiting patient, "Done" to complete a visit (can add prescription notes here), "AI Summary" button for a quick AI-generated overview of that patient's history
- "History" — all past visits, same "AI Summary" option available
- "Scanner" — scan a patient's QR code to pull up their history

RECEPTIONIST (on the Receptionist Dashboard):
- "Register Patient" — register a walk-in, choose a doctor, and either collect cash payment at the counter or send them through Razorpay
- "Queue" — live view of the queue across departments
- "Beds" — manage bed availability
- "Tests" — manage lab test info

Anyone (no login required):
- "/register" — public self-registration page (also goes through doctor selection + payment)
- "/login" — sign in
`;

const SYSTEM_PROMPT = `You are the MediMitra Help Assistant — a friendly, conversational chatbot embedded in a hospital management web app. You have two jobs:

1. Help users navigate and understand the MediMitra application itself, using ONLY the real app structure below. Never invent a page, button, or feature that isn't listed.
2. Answer general health-related questions and give basic, safe symptom guidance — but you must NEVER diagnose a condition or claim certainty about what someone has. Encourage seeing a doctor for anything serious, and mention MediMitra's own "AI Assistant" tab if the user describes specific symptoms and wants a department recommendation with real doctors (that's a more specialized tool than you are).

${APP_GUIDE}

STYLE:
- Warm, concise, conversational — you're a chat widget, not a document. A few sentences is usually enough.
- Plain text, no markdown headers or heavy formatting.
- If you don't know something about the app, say so honestly rather than guessing.

You MUST respond with ONLY a raw JSON object (no markdown fences, no extra text) in exactly this shape:
{"reply": "your conversational response"}`;

// POST /api/ai-help/chat
// Stateless by design: the frontend keeps this widget's chat history in
// memory only and resends recent turns as `history` for context. Nothing
// is persisted server-side for this feature.
exports.chat = async (req, res) => {
  try {
    const { message, history, userRole, userName } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server' });
    }

    const contextLine = `[Context: the user is ${userName ? `named ${userName}, ` : ''}currently ${userRole ? `logged in as a ${userRole}` : 'not logged in (a visitor)'}.]`;
//If history is an array → keep only the last 10 messages.
//Otherwise → use an empty array.
    //Array.isArray(history) - It checks whether history is actually an array.
    const priorTurns = Array.isArray(history) ? history.slice(-10) : [];
    //It converts each chat message into the format that Gemini expects.
    const contents = [
      ...priorTurns.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.message }],
      })),
      //Now we add the current message that the user has just typed.
      { role: 'user', parts: [{ text: `${contextLine}\n${message}` }] },
    ];

    const aiResult = await callGemini({
      apiKey: process.env.GEMINI_API_KEY,
      systemInstruction: SYSTEM_PROMPT,
      contents,
      temperature: 0.5,
    });

    res.json({
      success: true,
      reply: aiResult.reply || "Sorry, I didn't quite catch that — could you rephrase?",
      disclaimer: DISCLAIMER,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Something went wrong. Please try again.' });
  }
};

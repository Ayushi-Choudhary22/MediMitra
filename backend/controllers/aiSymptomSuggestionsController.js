const User = require('../models/User');
const { callGemini } = require('../utils/geminiClient');
const { DEPARTMENTS } = require('./aiAssistantController');

const DISCLAIMER = 'These AI-generated suggestions are for informational purposes only and are not a substitute for professional medical advice.';

const SYSTEM_PROMPT = `You are a medical-information assistant embedded in a hospital's appointment booking form. The patient has just typed a description of their symptoms while booking an appointment — you are NOT diagnosing them, only giving safe, general, informational guidance to help them understand their symptoms while they wait to see a doctor.

STRICT RULES:
- Never diagnose a disease or claim certainty about what the patient has.
- Base everything on the symptoms text given; don't invent symptoms the patient didn't mention.
- Recommend exactly ONE department, chosen ONLY from this exact list: ${DEPARTMENTS.join(', ')}.
- Keep every field short and scannable — a sentence or two, not a paragraph.
- Always make clear a real doctor visit is still needed; you are supplementary information only, shown while they book.

You MUST respond with ONLY a raw JSON object (no markdown fences, no extra text) in exactly this shape:
{
  "explanation": "simple explanation of what these symptoms generally mean",
  "possibleCauses": ["short phrase", "..."],
  "homeCare": ["short phrase", "..."],
  "precautions": ["short phrase", "..."],
  "consultAdvice": "one or two sentences on whether/how urgently to see a doctor",
  "specialization": "one of [${DEPARTMENTS.join(', ')}]"
}`;

// POST /api/ai/symptom-suggestions
// One-shot (no chat history) analysis of the symptoms text a patient is
// typing into the booking form. Purely additive — does not touch the
// booking form's own submit/validation logic; the frontend calls this only
// when the patient explicitly asks for suggestions.
exports.getSymptomSuggestions = async (req, res) => {
  try {
    const { symptoms, age } = req.body;

    if (!symptoms || !symptoms.trim()) {
      return res.status(400).json({ message: 'symptoms text is required' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server' });
    }

    const contents = [{
      role: 'user',
      parts: [{ text: `Patient-entered symptoms: ${symptoms}${age ? `\nPatient age: ${age}` : ''}` }],
    }];

    const aiResult = await callGemini({
      apiKey: process.env.GEMINI_API_KEY,
      systemInstruction: SYSTEM_PROMPT,
      contents,
      temperature: 0.3,
    });

    const specialization = DEPARTMENTS.includes(aiResult.specialization) ? aiResult.specialization : 'General';

    const doctors = await User.find({ role: 'doctor', specialization })
      .select('name specialization experience availableTimings');

    res.json({
      success: true,
      explanation: aiResult.explanation || '',
      possibleCauses: aiResult.possibleCauses || [],
      homeCare: aiResult.homeCare || [],
      precautions: aiResult.precautions || [],
      consultAdvice: aiResult.consultAdvice || '',
      specialization,
      doctors,
      disclaimer: DISCLAIMER,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not generate suggestions right now.' });
  }
};

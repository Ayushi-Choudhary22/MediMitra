const History = require('../models/History');
const { callGemini } = require('../utils/geminiClient');

const SYSTEM_PROMPT = `You are a friendly pharmacist-style assistant inside a hospital patient app, helping a patient understand a prescription written by their doctor.

You will be given the doctor's raw prescription/consultation notes for one visit (this text may mention medicine names, dosages, frequency, and instructions in free form, e.g. "Paracetamol 500mg twice daily after food for 5 days").

STRICT RULES:
- Identify each distinct medicine mentioned in the notes. Do NOT invent medicines that aren't mentioned.
- For each medicine, explain in SIMPLE, EVERYDAY English (avoid jargon): what it's generally used for, how to take it (matching whatever dosage/frequency was stated), whether it's typically taken before or after food (use general public knowledge for that medicine if the notes don't specify), common side effects, and general precautions.
- This is educational only — never tell the patient to stop, change, or adjust their prescribed dose. Always encourage following the doctor's instructions and contacting the doctor/pharmacist with any concerns.
- If the notes don't clearly mention any medicines (e.g. it's just general advice with no drug names), return an empty medicines array and explain that in generalNotes.
- Keep language short, warm, and easy to understand for someone with no medical background.

You MUST respond with ONLY a raw JSON object (no markdown fences, no extra text) in exactly this shape:
{
  "medicines": [
    {
      "name": "medicine name as written in the notes",
      "dosageAndFrequency": "e.g. 500mg, twice a day",
      "purpose": "what it's generally used for, in simple terms",
      "howToTake": "simple instructions on how to take it",
      "foodTiming": "Before food / After food / With food / Not specified",
      "sideEffects": "common side effects, in simple terms",
      "precautions": "general precautions, in simple terms"
    }
  ],
  "generalNotes": "any other advice from the notes that isn't about a specific medicine (e.g. rest, follow-up), or an explanation if no medicines were found"
}`;

// GET /api/ai/prescription/:historyId
// Read-only: fetches an existing History record's notes and asks Gemini to
// explain them in plain English. Never edits or overwrites the record.
exports.explainPrescription = async (req, res) => {
  try {
    const { historyId } = req.params;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server' });
    }

    const visit = await History.findById(historyId);
    if (!visit) return res.status(404).json({ message: 'Visit record not found' });
    if (!visit.notes || !visit.notes.trim()) {
      return res.status(400).json({ message: 'No prescription notes were recorded for this visit' });
    }

    const contents = [{
      role: 'user',
      parts: [{
        text: `Visit details — Problem: ${visit.problem || 'N/A'} | Department: ${visit.specialization || 'N/A'} | Date: ${new Date(visit.visitDate).toISOString().split('T')[0]}\n\nDoctor's prescription/consultation notes:\n${visit.notes}`,
      }],
    }];

    const aiResult = await callGemini({
      apiKey: process.env.GEMINI_API_KEY,
      systemInstruction: SYSTEM_PROMPT,
      contents,
      temperature: 0.3,
    });

    res.json({
      success: true,
      originalNotes: visit.notes, // shown alongside for transparency; never modified
      medicines: aiResult.medicines || [],
      generalNotes: aiResult.generalNotes || '',
      disclaimer: 'This explanation is AI generated to help you understand your prescription and should not replace advice from your doctor or pharmacist. Always follow your doctor\'s original instructions.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const Patient = require("../models/Patient");
const History = require("../models/History");
const { callGemini } = require("../utils/geminiClient");

const SYSTEM_PROMPT = `You are a clinical documentation assistant inside a hospital management system, helping a doctor quickly understand a patient's record before a consultation.

You will be given a list of the patient's past and current visit records, including problem described, department, visit date, and — for completed visits — the doctor's own diagnosis, prescription, known allergies, and follow-up notes from that consultation.

STRICT RULES:
- Base your summary ONLY on the information provided. Do NOT invent illnesses, medications, or allergies that are not mentioned in the records.
- If something (e.g. allergies, medications) is not mentioned anywhere in the records, say so explicitly (e.g. "None documented in available records") instead of guessing.
- Do not provide a new diagnosis or treatment plan — this is a summary of existing documented information only, to save the doctor reading time.
- Keep every field concise and scannable — short phrases or short sentences, not paragraphs.

You MUST respond with ONLY a raw JSON object (no markdown fences, no extra text) in exactly this shape:
{
  "summary": "2-4 sentence overview of the patient's overall history and current context",
  "majorIllnesses": ["short phrase", "..."],
  "recentMedications": ["short phrase", "..."],
  "allergies": ["short phrase", "..."],
  "importantObservations": ["short phrase", "..."],
  "suggestedFocusAreas": ["short phrase", "..."]
}
Use an empty array (not a placeholder string) for any field with nothing to report, except when a field is truly unknown from the records — in that case include one array item such as "None documented in available records".`;

// GET /api/ai/summary/:patientName
// Read-only: aggregates existing Patient + History records and asks Gemini
// to summarize them. Never creates, modifies, or deletes any patient record.
exports.generateSummary = async (req, res) => {
  try {
    const { patientName } = req.params;
    if (!patientName || !patientName.trim()) {
      return res.status(400).json({ message: "patientName is required" });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ message: "GEMINI_API_KEY is not configured on the server" });
    }

    // Pull everything documented for this patient — current/waiting records
    // and their full completed-visit history. Read-only queries only.
    const [currentRecords, pastVisits] = await Promise.all([
      Patient.find({ name: patientName }).sort({ createdAt: -1 }),
      History.find({ name: patientName }).sort({ visitDate: -1 }),
    ]);

    if (currentRecords.length === 0 && pastVisits.length === 0) {
      return res
        .status(404)
        .json({ message: "No records found for this patient" });
    }

    const recordLines = [];

    currentRecords.forEach((p) => {
      recordLines.push(
        `[Current/Active] Date: ${p.createdAt.toISOString().split("T")[0]} | Department: ${p.specialization} | Problem: ${p.problem} | Status: ${p.status} | Mode: ${p.mode}`,
      );
    });

    pastVisits.forEach((h) => {
      recordLines.push(
        `[Past Visit] Date: ${new Date(h.visitDate).toISOString().split("T")[0]} | Department: ${h.specialization || "N/A"} | Problem: ${h.problem || "N/A"} | Diagnosis: ${h.diagnosis || "None recorded"} | Prescription: ${h.prescription || h.notes || "None recorded"} | Allergy: ${h.allergy || "None recorded"} | Follow-up: ${h.followUpNotes || "None recorded"}`,
      );
    });

    const recordsText = recordLines.join("\n");
    const patientAge =
      currentRecords[0]?.age ?? pastVisits[0]?.age ?? "Unknown";

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `Patient name: ${patientName}\nAge: ${patientAge}\nTotal records found: ${recordLines.length}\n\nRecords:\n${recordsText}`,
          },
        ],
      },
    ];

    const aiResult = await callGemini({
      apiKey: process.env.GEMINI_API_KEY,
      systemInstruction: SYSTEM_PROMPT,
      contents,
      temperature: 0.3,
    });

    res.json({
      success: true,
      patientName,
      recordsAnalyzed: recordLines.length,
      summary: aiResult.summary || "",
      majorIllnesses: aiResult.majorIllnesses || [],
      recentMedications: aiResult.recentMedications || [],
      allergies: aiResult.allergies || [],
      importantObservations: aiResult.importantObservations || [],
      suggestedFocusAreas: aiResult.suggestedFocusAreas || [],
      disclaimer:
        "This AI-generated summary is for quick reference only and does not replace reviewing the full patient record.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
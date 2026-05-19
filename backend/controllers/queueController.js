const Patient = require('../models/Patient');

exports.getQueue = async (req, res) => {
  try {
    const { specialization, search } = req.query;
    const filter = { status: { $in: ['waiting', 'current'] } };
    if (specialization) filter.specialization = specialization;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const allPatients = await Patient.find(filter).sort({ tokenNumber: 1 });

    /*
      CORRECT QUEUE ORDER:
        Position 1 → the ONE patient with status "current"  (being seen RIGHT NOW)
        Position 2 → first "waiting" patient  (next up, lowest tokenNumber)
        Position 3 → second "waiting" patient
        ...and so on

      patientsAhead = how many people are IN FRONT of you:
        current patient  → 0  (nobody is ahead of them)
        first waiting    → 1  (only the current patient is ahead)
        second waiting   → 2
        third waiting    → 3
        ...

      Special case — NO current patient exists yet:
        first waiting    → 0  (they are effectively next, nobody ahead)
        second waiting   → 1
        ...
    */

    // Separate current and waiting
    const currentPatient = allPatients.find(p => p.status === 'current');
    const waitingPatients = allPatients.filter(p => p.status === 'waiting');
    // waiting is already sorted by tokenNumber from the DB query above

    // Build the correctly ordered queue array
    const orderedQueue = [
      ...(currentPatient ? [currentPatient] : []),
      ...waitingPatients,
    ];

    // Attach queuePosition (1-based) and patientsAhead to every entry
    const withPosition = orderedQueue.map((p, index) => ({
      ...p.toObject(),
      queuePosition: index + 1,  // 1 = current, 2 = next, 3 = after that, ...
      patientsAhead: index,       // 0 = no one ahead, 1 = one ahead, ...
    }));

    res.json(withPosition);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setCurrentPatient = async (req, res) => {
  try {
    const { specialization } = req.body;
    // Push existing "current" back to "waiting" for this specialization
    await Patient.updateMany(
      { status: 'current', specialization },
      { status: 'waiting' }
    );
    // Set the chosen patient as "current"
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { status: 'current' },
      { new: true }
    );
    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const express = require("express");
const router = express.Router();
const Assignment = require("../Models/Assignment");
const authMiddleware = require("../Middleware/authMiddleware");

function calcTotalMarks(doc) {
  doc.totalMarks = (doc.mcqQuestions || []).reduce((s, q) => s + (q.marks || 1), 0);
}

// POST /api/assignments — create
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, courseId, mcqQuestions,
      timeLimitMinutes, availableFrom, availableUntil, maxAttempts, status } = req.body;

    const assignment = new Assignment({
      title,
      description: description || null,
      courseId: courseId || null,
      mcqQuestions: mcqQuestions || [],
      textUploadQuestions: [],
      timeLimitMinutes,
      availableFrom,
      availableUntil,
      maxAttempts: maxAttempts || 1,
      status: status || "draft",
      createdBy: req.user,
    });
    calcTotalMarks(assignment);
    await assignment.save();
    res.status(201).json({ assignment });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/assignments/my — all by logged-in teacher
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const assignments = await Assignment.find({ createdBy: req.user })
      .sort({ createdAt: -1 }).lean();
    res.status(200).json({ assignments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Sub-path routes BEFORE plain /:id — critical for Express routing
// ─────────────────────────────────────────────────────────────

// PATCH /api/assignments/:id/status
router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["draft", "published", "closed"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user },
      { status },
      { new: true }
    );
    if (!assignment) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ assignment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/assignments/:id/submit — student submits answers, saved to DB
router.post("/:id/submit", authMiddleware, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Not found" });

    // Check max attempts
    const previousAttempts = assignment.submissions.filter(
      (s) => s.student.toString() === req.user.toString()
    );
    if (previousAttempts.length >= assignment.maxAttempts) {
      return res.status(400).json({
        message: `Max attempts (${assignment.maxAttempts}) reached`,
      });
    }

    const { answers = [] } = req.body; // [{ questionId, selectedOptionIdx }]

    // Score each question
    let earned = 0;
    const total = assignment.mcqQuestions.reduce((s, q) => s + (q.marks || 1), 0);

    const scoredAnswers = assignment.mcqQuestions.map((q) => {
      const submitted = answers.find(
        (a) => a.questionId === q._id.toString()
      );
      const selectedIdx = submitted?.selectedOptionIdx ?? null;
      const correctIdx  = q.options.findIndex((o) => o.isCorrect);
      const isCorrect   = selectedIdx !== null && selectedIdx === correctIdx;
      const marksAwarded = isCorrect ? q.marks || 1 : 0;
      earned += marksAwarded;

      return {
        questionId:        q._id,
        questionText:      q.questionText,
        selectedOptionIdx: selectedIdx,
        correctOptionIdx:  correctIdx,
        isCorrect,
        marksAwarded,
      };
    });

    const pct = total > 0 ? Math.round((earned / total) * 100) : 0;

    // Push submission into the assignment document
    assignment.submissions.push({
      student:       req.user,
      attemptNumber: previousAttempts.length + 1,
      answers:       scoredAnswers,
      earned,
      total,
      pct,
      submittedAt:   new Date(),
    });

    await assignment.save();

    res.status(200).json({ earned, total, pct, breakdown: scoredAnswers });
  } catch (err) {
    console.error("POST /assignments/:id/submit error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/assignments/:id/my-result — student fetches their own result(s)
router.get("/:id/my-result", authMiddleware, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) return res.status(404).json({ message: "Not found" });

    const mySubmissions = assignment.submissions.filter(
      (s) => s.student.toString() === req.user.toString()
    );

    res.status(200).json({ submissions: mySubmissions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/assignments/:id/results — teacher views all student results
router.get("/:id/results", authMiddleware, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("submissions.student", "name email")
      .lean();
    if (!assignment) return res.status(404).json({ message: "Not found" });

    // Only the creator can see all results
    if (assignment.createdBy.toString() !== req.user.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json({ submissions: assignment.submissions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Plain /:id routes LAST
// ─────────────────────────────────────────────────────────────

// GET /api/assignments/:id — single assignment
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ assignment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/assignments/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete({
      _id: req.params.id, createdBy: req.user,
    });
    if (!assignment) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
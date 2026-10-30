const mongoose = require("mongoose");
const { Schema } = mongoose;

// ─── MCQ Question ─────────────────────────────────────────────
const MCQSchema = new Schema({
  questionText: { type: String, required: true, trim: true },
  options: {
    type: [{ optionText: String, isCorrect: { type: Boolean, default: false } }],
    validate: [(opts) => opts.length >= 2, "At least 2 options required"],
  },
  marks: { type: Number, default: 1 },
});

// ─── Text / File Upload Question ──────────────────────────────
const TextUploadSchema = new Schema({
  questionText: { type: String, required: true, trim: true },
  marks: { type: Number, default: 5 },
  allowedFileTypes: {
    type: [String],
    enum: ["pdf", "docx", "txt", "png", "jpg"],
    default: ["pdf", "docx", "txt"],
  },
  maxFileSizeMB: { type: Number, default: 10 },
});

// ─── Per-question answer inside a submission ──────────────────
const AnswerSchema = new Schema({
  questionId:        { type: Schema.Types.ObjectId },
  questionText:      { type: String },
  selectedOptionIdx: { type: Number, default: null }, // null = skipped
  correctOptionIdx:  { type: Number },
  isCorrect:         { type: Boolean, default: false },
  marksAwarded:      { type: Number, default: 0 },
});

// ─── One student submission ────────────────────────────────────
const SubmissionSchema = new Schema(
  {
    student:     { type: Schema.Types.ObjectId, ref: "User", required: true },
    attemptNumber: { type: Number, default: 1 },
    answers:     { type: [AnswerSchema], default: [] },
    earned:      { type: Number, default: 0 },  // marks scored
    total:       { type: Number, default: 0 },  // max possible marks
    pct:         { type: Number, default: 0 },  // percentage
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ─── Assignment ────────────────────────────────────────────────
const AssignmentSchema = new Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: null },
    createdBy:   { type: Schema.Types.ObjectId, ref: "User" },
    courseId:    { type: Schema.Types.ObjectId, ref: "Course", default: null },

    mcqQuestions:        { type: [MCQSchema], default: [] },
    textUploadQuestions: { type: [TextUploadSchema], default: [] },

    timeLimitMinutes: { type: Number, required: true, min: 1 },
    availableFrom:    { type: Date, required: true },
    availableUntil:   { type: Date, required: true },
    maxAttempts:      { type: Number, default: 1 },

    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },

    totalMarks:  { type: Number, default: 0 }, // auto-calculated on save

    // ── All student submissions ──────────────────────────────
    submissions: { type: [SubmissionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", AssignmentSchema);
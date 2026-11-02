const mongoose = require("mongoose");
module.exports = mongoose.model("TestAttempt", new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
  answers: [{ questionId: mongoose.Schema.Types.ObjectId, selectedIndex: Number, correct: Boolean }],
  score: Number, total: Number, percentage: Number, submittedAt: { type: Date, default: Date.now }
}, { timestamps: true }));

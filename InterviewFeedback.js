const mongoose = require("mongoose");
module.exports = mongoose.model("InterviewFeedback", new mongoose.Schema({
  interview: { type: mongoose.Schema.Types.ObjectId, ref: "MockInterview" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  score: Number, strengths: String, improvements: String, answers: [{ question: String, answer: String }]
}, { timestamps: true }));

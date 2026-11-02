const mongoose = require("mongoose");
const question = new mongoose.Schema({
  prompt: { type: String, required: true }, options: [String], answerIndex: Number,
  explanation: String, topic: String, points: { type: Number, default: 1 }
});
module.exports = mongoose.model("Assessment", new mongoose.Schema({
  title: { type: String, required: true }, category: { type: String, enum: ["aptitude","technical","company"], required: true },
  topic: String, company: String, difficulty: { type: String, default: "Mixed" },
  durationMinutes: { type: Number, default: 20 }, questions: [question],
  published: { type: Boolean, default: true }, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true }));

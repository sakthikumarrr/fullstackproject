const mongoose = require("mongoose");
module.exports = mongoose.model("PerformanceReport", new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  totalAttempts: Number, averageScore: Number, codingSolved: Number, interviewAverage: Number,
  generatedAt: { type: Date, default: Date.now }
}));

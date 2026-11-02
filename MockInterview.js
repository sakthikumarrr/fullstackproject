const mongoose = require("mongoose");
module.exports = mongoose.model("MockInterview", new mongoose.Schema({
  title: String, type: { type: String, enum: ["HR","Technical","Coding","Company"], default: "HR" },
  company: String, questions: [{ prompt: String, category: String }],
  scheduledAt: Date, durationMinutes: Number, student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, status: { type: String, default: "Scheduled" }
}, { timestamps: true }));

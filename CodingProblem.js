const mongoose = require("mongoose");
module.exports = mongoose.model("CodingProblem", new mongoose.Schema({
  title: String, slug: { type: String, unique: true }, statement: String, inputFormat: String,
  outputFormat: String, examples: [{ input: String, output: String, explanation: String }],
  difficulty: { type: String, enum: ["Easy","Medium","Hard"], default: "Easy" },
  topics: [String], points: { type: Number, default: 10 }, active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true }));

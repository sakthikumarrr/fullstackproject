const mongoose = require("mongoose");
module.exports = mongoose.model("CodingSubmission", new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: "CodingProblem", required: true, index: true },
  language: String,
  sourceCode: String,
  status: { type: String, default: "Queued", index: true },
  score: { type: Number, default: 0 },
  judgeToken: String,
  result: String,
  stdout: String,
  stderr: String,
  compileOutput: String,
  executionTime: String,
  memory: Number
}, { timestamps: true }));

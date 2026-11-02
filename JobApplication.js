const mongoose = require("mongoose");
module.exports = mongoose.model("JobApplication", new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "JobPosting" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["Applied","Shortlisted","Interview","Rejected","Selected"], default: "Applied" }
}, { timestamps: true }));

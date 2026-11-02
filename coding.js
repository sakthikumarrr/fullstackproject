const router = require("express").Router();
const CodingProblem = require("../models/CodingProblem");
const CodingSubmission = require("../models/CodingSubmission");
const { protect, allow } = require("../middleware/auth");

const languageIds = new Set([71, 62, 54, 50, 63, python=71, java=62, cpp=54, c=50]);

router.get("/problems", protect, async (req,res) => res.json(await CodingProblem.find({ active: true }).select("-__v").sort({ createdAt: -1 })));
router.post("/problems", protect, allow("admin"), async (req,res) => {
  const payload = { ...req.body, createdBy: req.user._id };
  if (!payload.title || !payload.statement) return res.status(400).json({ message: "Problem title and statement are required" });
  res.status(201).json(await CodingProblem.create(payload));
});
router.delete("/problems/:id", protect, allow("admin"), async (req,res) => {
  const deleted = await CodingProblem.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Coding problem not found" });
  res.json({ message: "Coding problem deleted" });
});

// Admin-only submission reporting. Source code is intentionally available only to admins.
router.get("/submissions", protect, allow("admin"), async (req,res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.problemId) filter.problem = req.query.problemId;
  if (req.query.studentId) filter.student = req.query.studentId;
  const rows = await CodingSubmission.find(filter)
    .populate("student", "name email")
    .populate("problem", "title difficulty points")
    .sort({ createdAt: -1 }).limit(500).lean();
  const [total, accepted, queued] = await Promise.all([
    CodingSubmission.countDocuments(), CodingSubmission.countDocuments({ status: "Accepted" }),
    CodingSubmission.countDocuments({ status: { $in: ["Queued", "Submitted to Judge0", "Running"] } })
  ]);
  res.json({ rows, stats: { total, accepted, queued, acceptanceRate: total ? Math.round(accepted / total * 100) : 0 } });
});

router.get("/submissions/mine", protect, allow("student"), async (req,res) =>
  res.json(await CodingSubmission.find({ student: req.user._id }).populate("problem","title difficulty points").sort({ createdAt:-1 }))
);

router.get("/submissions/:id/result", protect, async (req,res) => {
  const sub = await CodingSubmission.findById(req.params.id);
  if (!sub) return res.status(404).json({ message: "Submission not found" });
  if (req.user.role !== "admin" && String(sub.student) !== String(req.user._id)) return res.status(403).json({ message: "Not allowed" });
  if (sub.judgeToken && process.env.JUDGE0_URL) {
    try {
      const headers = {};
      if (process.env.JUDGE0_API_KEY) headers["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY;
      const response = await fetch(`${process.env.JUDGE0_URL.replace(/\/$/, "")}/submissions/${encodeURIComponent(sub.judgeToken)}?base64_encoded=false`, { headers });
      if (!response.ok) throw new Error(`Judge0 returned ${response.status}`);
      const result = await response.json();
      if (result.status?.description) sub.status = result.status.description;
      sub.stdout = result.stdout || "";
      sub.stderr = result.stderr || "";
      sub.compileOutput = result.compile_output || "";
      sub.executionTime = result.time || "";
      sub.memory = result.memory || 0;
      sub.result = [sub.stderr, sub.compileOutput].filter(Boolean).join("\n").slice(0, 12000);
      if (sub.status === "Accepted") sub.score = 100;
      else if (["Wrong Answer", "Compilation Error", "Runtime Error", "Time Limit Exceeded"].includes(sub.status)) sub.score = 0;
      await sub.save();
    } catch (error) {
      return res.json({ submission: sub, judgeMessage: error.message });
    }
  }
  res.json({ submission: sub, judgeConfigured: !!process.env.JUDGE0_URL });
});

router.post("/submit", protect, allow("student"), async (req,res) => {
  const { problemId, language, sourceCode } = req.body;
  if (!problemId || !language || !String(sourceCode || "").trim()) return res.status(400).json({ message: "Problem, language and source code are required" });
  const problem = await CodingProblem.findById(problemId);
  if (!problem || !problem.active) return res.status(404).json({ message: "Coding problem not found" });
  const sub = await CodingSubmission.create({ student: req.user._id, problem: problemId, language: String(language), sourceCode, status: "Awaiting judge configuration" });

  // Submitted code is sent only to a separately configured sandbox service. It is never executed by Express.
  if (process.env.JUDGE0_URL) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (process.env.JUDGE0_API_KEY) headers["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY;
      const response = await fetch(`${process.env.JUDGE0_URL.replace(/\/$/, "")}/submissions?base64_encoded=false&wait=false`, {
        method: "POST", headers,
        body: JSON.stringify({ source_code: sourceCode, language_id: Number(language), stdin: "" })
      });
      const result = await response.json();
      if (!response.ok || !result.token) throw new Error(result.message || `Judge0 returned ${response.status}`);
      sub.judgeToken = result.token;
      sub.status = "Submitted to Judge0";
      await sub.save();
    } catch (error) {
      sub.status = "Judge service unavailable";
      sub.result = error.message;
      await sub.save();
    }
  }
  res.status(201).json({
    submission: { _id: sub._id, status: sub.status, score: sub.score, createdAt: sub.createdAt },
    message: sub.judgeToken ? "Code submitted to Judge0. Refresh the result shortly." : "Submission saved. Configure JUDGE0_URL to run code in a secure sandbox."
  });
});
module.exports = router;

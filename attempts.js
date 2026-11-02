const router = require("express").Router();
const Assessment = require("../models/Assessment");
const TestAttempt = require("../models/TestAttempt");
const { protect, allow } = require("../middleware/auth");
router.post("/", protect, allow("student"), async (req,res) => {
  const test = await Assessment.findById(req.body.assessmentId);
  if (!test || !test.published) return res.status(404).json({ message: "Test not found" });
  const submitted = Array.isArray(req.body.answers) ? req.body.answers : [];
  let score = 0, total = 0;
  const answers = test.questions.map(q => {
    total += q.points || 1;
    const item = submitted.find(a => String(a.questionId) === String(q._id));
    const correct = !!item && Number(item.selectedIndex) === q.answerIndex;
    if (correct) score += q.points || 1;
    return { questionId: q._id, selectedIndex: item ? Number(item.selectedIndex) : -1, correct };
  });
  const attempt = await TestAttempt.create({ student: req.user._id, assessment: test._id, answers, score, total, percentage: total ? Math.round(score / total * 100) : 0 });
  res.status(201).json({ attempt, review: test.questions.map((q,i) => ({ prompt: q.prompt, options: q.options, correctIndex: q.answerIndex, explanation: q.explanation, selectedIndex: answers[i].selectedIndex, correct: answers[i].correct })) });
});
router.get("/mine", protect, async (req,res) => res.json(await TestAttempt.find({ student: req.user._id }).populate("assessment","title category topic").sort({ createdAt: -1 })));
router.get("/analytics", protect, async (req,res) => {
  const attempts = await TestAttempt.find({ student: req.user._id }).populate("assessment","category topic");
  const avg = attempts.length ? Math.round(attempts.reduce((s,a)=>s+a.percentage,0)/attempts.length) : 0;
  res.json({ totalAttempts: attempts.length, averageScore: avg, attempts });
});
module.exports = router;

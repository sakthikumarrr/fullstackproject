const router = require("express").Router();
const Assessment = require("../models/Assessment");
const { protect, allow } = require("../middleware/auth");
router.get("/", protect, async (req,res) => {
  const filter = req.user.role === "admin" ? {} : { published: true };
  const tests = await Assessment.find(filter).select("-questions.answerIndex -questions.explanation");
  res.json(tests);
});
router.get("/:id", protect, async (req,res) => {
  const test = await Assessment.findById(req.params.id);
  if (!test || (!test.published && req.user.role !== "admin")) return res.status(404).json({ message: "Assessment not found" });
  const data = test.toObject();
  if (req.user.role !== "admin") data.questions = data.questions.map(q => ({ ...q, answerIndex: undefined, explanation: undefined }));
  res.json(data);
});
router.post("/", protect, allow("admin"), async (req,res) => {
  const test = await Assessment.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(test);
});
router.put("/:id", protect, allow("admin"), async (req,res) => res.json(await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })));
router.delete("/:id", protect, allow("admin"), async (req,res) => { await Assessment.findByIdAndDelete(req.params.id); res.json({ message: "Assessment deleted" }); });
module.exports = router;

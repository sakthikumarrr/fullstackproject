const router = require("express").Router();
const JobPosting = require("../models/JobPosting");
const JobApplication = require("../models/JobApplication");
const Company = require("../models/Company");
const StudentProfile = require("../models/StudentProfile");
const { protect, allow } = require("../middleware/auth");
router.get("/", protect, async (req,res) => res.json(await JobPosting.find({ active:true }).populate("company","name logo industry").sort({createdAt:-1})));
router.post("/", protect, allow("recruiter","admin"), async (req,res) => {
  let company = req.body.companyId ? await Company.findById(req.body.companyId) : null;
  if (!company && req.body.companyName) company = await Company.create({ name:req.body.companyName, createdBy:req.user._id });
  if (!company) return res.status(400).json({message:"Create or select a company"});
  res.status(201).json(await JobPosting.create({ ...req.body, company:company._id, recruiter:req.user._id }));
});
router.post("/:id/apply", protect, allow("student"), async (req,res) => {
  const exists = await JobApplication.findOne({ job:req.params.id, student:req.user._id });
  if (exists) return res.status(409).json({message:"Already applied"});
  res.status(201).json(await JobApplication.create({ job:req.params.id, student:req.user._id }));
});
router.get("/applications/mine", protect, allow("student"), async (req,res) => res.json(await JobApplication.find({student:req.user._id}).populate({path:"job",populate:{path:"company",select:"name"}})));
router.get("/candidates", protect, allow("recruiter","admin"), async (req,res) => {
  const filter = {};
  if (req.query.minCgpa) filter.cgpa = { $gte:Number(req.query.minCgpa) };
  if (req.query.skill) filter.skills = { $in:[new RegExp(req.query.skill,"i")] };
  const profiles = await StudentProfile.find(filter).populate("user","name email photo").lean();
  res.json(profiles.map(profile => ({ ...profile, resume: !!profile.resume })));
});
router.get("/:id/applications", protect, allow("recruiter","admin"), async (req,res) => {
  const job = await JobPosting.findById(req.params.id);
  if (!job || (req.user.role === "recruiter" && String(job.recruiter)!==String(req.user._id))) return res.status(404).json({message:"Job not found"});
  res.json(await JobApplication.find({job:job._id}).populate("student","name email"));
});
router.patch("/applications/:id/status", protect, allow("recruiter","admin"), async (req,res) => res.json(await JobApplication.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true})));
module.exports = router;

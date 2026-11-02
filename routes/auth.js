const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const Recruiter = require("../models/Recruiter");
const { protect } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadDir = path.join(__dirname, "..", "uploads");
const privateResumeDir = path.join(__dirname, "..", "private_uploads", "resumes");
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(privateResumeDir, { recursive: true });
const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = ({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" })[file.mimetype];
      cb(null, `profile-${req.user._id}-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(allowed.includes(file.mimetype) ? null : new Error("Please upload a JPG, PNG or WEBP image"), allowed.includes(file.mimetype));
  }
});

const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, privateResumeDir),
    filename: (req, file, cb) => cb(null, `resume-${req.user._id}-${Date.now()}.pdf`)
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const valid = file.mimetype === "application/pdf" && path.extname(file.originalname).toLowerCase() === ".pdf";
    cb(valid ? null : new Error("Please upload a PDF resume only"), valid);
  }
});

const sign = id => jwt.sign({ id }, process.env.JWT_SECRET || "development_secret_change_me", { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

router.post("/register", [body("name").trim().notEmpty(), body("email").isEmail(), body("password").isLength({ min: 8 })], async (req,res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ message: "Check the form fields", errors: errors.array() });
  try {
    const role = req.body.role === "recruiter" ? "recruiter" : "student";
    const user = await User.create({ name: req.body.name, email: req.body.email, password: await bcrypt.hash(req.body.password, 12), role });
    if (role === "student") await StudentProfile.create({ user: user._id });
    if (role === "recruiter") await Recruiter.create({ user: user._id });
    res.status(201).json({ token: sign(user._id), user: { id: user._id, name: user.name, email: user.email, role } });
  } catch (e) { res.status(400).json({ message: e.code === 11000 ? "Email already registered" : e.message }); }
});
router.post("/login", async (req,res) => {
  const user = await User.findOne({ email: String(req.body.email || "").toLowerCase() }).select("+password");
  if (!user || !await bcrypt.compare(req.body.password || "", user.password)) return res.status(401).json({ message: "Invalid email or password" });
  if (req.body.role && req.body.role !== user.role) return res.status(403).json({ message: "Choose the correct login role" });
  res.json({ token: sign(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});
router.get("/me", protect, async (req,res) => {
  const user = req.user.toObject();
  if (user.role === "student") { const profile = await StudentProfile.findOne({ user: user._id }).select("resume"); user.resume = !!profile?.resume; }
  res.json({ user });
});
router.post("/profile-photo", protect, (req, res, next) => {
  photoUpload.single("photo")(req, res, err => {
    if (err) return res.status(400).json({ message: err.code === "LIMIT_FILE_SIZE" ? "Photo must be 2 MB or smaller" : err.message });
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose a photo first" });
  const oldPhoto = req.user.photo;
  req.user.photo = `/uploads/${req.file.filename}`;
  await req.user.save();
  if (oldPhoto && oldPhoto.startsWith("/uploads/profile-")) {
    fs.unlink(path.join(uploadDir, path.basename(oldPhoto)), () => {});
  }
  res.json({ message: "Profile photo updated", photo: req.user.photo });
});

router.post("/resume", protect, allowStudent, (req, res, next) => {
  resumeUpload.single("resume")(req, res, err => {
    if (err) return res.status(400).json({ message: err.code === "LIMIT_FILE_SIZE" ? "Resume must be 5 MB or smaller" : err.message });
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose a PDF resume first" });
  const signature = fs.readFileSync(req.file.path).subarray(0, 5).toString();
  if (signature !== "%PDF-") { fs.unlink(req.file.path, () => {}); return res.status(400).json({ message: "The uploaded file is not a valid PDF" }); }
  const previous = await StudentProfile.findOne({ user: req.user._id }).select("resume");
  await StudentProfile.findOneAndUpdate(
    { user: req.user._id }, { resume: req.file.filename }, { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  if (previous?.resume) fs.unlink(path.join(privateResumeDir, path.basename(previous.resume)), () => {});
  res.json({ message: "Resume uploaded successfully", resume: true, fileName: req.file.originalname });
});

// Private resume access: only the owner, admins and recruiters can view a student's resume.
router.get("/resume/:studentId", protect, async (req, res) => {
  const isOwner = String(req.user._id) === String(req.params.studentId);
  if (!isOwner && !["admin", "recruiter"].includes(req.user.role)) return res.status(403).json({ message: "You are not allowed to view this resume" });
  const profile = await StudentProfile.findOne({ user: req.params.studentId }).select("resume");
  if (!profile?.resume) return res.status(404).json({ message: "No resume uploaded by this student" });
  const filePath = path.join(privateResumeDir, path.basename(profile.resume));
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Resume file is unavailable" });
  res.type("application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${path.basename(filePath)}"`);
  res.sendFile(filePath);
});

function allowStudent(req, res, next) {
  if (req.user.role !== "student") return res.status(403).json({ message: "Only students can upload resumes" });
  next();
}

module.exports = router;

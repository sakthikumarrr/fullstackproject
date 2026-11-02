# Launchly — Placement Preparation & Mock Interview Portal

A responsive full-stack starter application built with HTML, CSS, Bootstrap 5, JavaScript, jQuery, Node.js, Express and MongoDB.

## Requirements
- Node.js 18+ (20+ recommended)
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## Setup in VS Code
1. Extract `placement-portal.zip`.
2. Open the extracted `placement-portal` folder in VS Code.
3. Open Terminal → New Terminal.
4. Run `npm install`.
5. Copy `.env.example` to `.env` and set `MONGODB_URI` and a strong `JWT_SECRET`.
6. Start MongoDB.
7. If this is a brand-new empty database, run `npm run seed` once to insert demo users, assessments, coding problems, companies and jobs. **Do not run the seed command on a database containing data you want to keep**; it clears the demo collections.
8. Run `npm run dev` (or `npm start`).
9. Open http://localhost:5001.

## Demo accounts
All seeded accounts use password `Pathway@123`.
- Admin: `admin@pathway.dev`
- Student: `student1@pathway.dev` (also student2…student10)
- Recruiter account: register a new account and choose Recruiter.

## Included functionality
- Student, admin and recruiter registration/login with JWT and bcrypt.
- Role-protected APIs.
- Aptitude, technical and company assessment listing.
- Admin assessment creation using one JSON question per line; edit/delete endpoints are available.
- Timed-assessment-ready interface, automatic scoring, answer review and attempt history.
- Coding problem library and submission records.
- Safe code-execution boundary: submitted code is never run on this Express server. Configure a sandboxed Judge0 service before enabling real execution.
- Mock interview question sets and feedback API.
- Job posting, student applications, recruiter candidate filters.
- Database-driven admin overview and assessment reports.
- Responsive dark SaaS interface, theme toggle, animated 3D-inspired hero.

## Create an assessment
Login as admin → Question management → enter a title and category. Add one JSON object per line, for example:
```json
{"prompt":"What is 2 + 2?","options":["2","3","4","5"],"answerIndex":2,"explanation":"Basic addition"}
```
Then publish. The test becomes visible to students.

## API overview
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/tests`, `GET/PUT/DELETE /api/tests/:id`
- `POST /api/attempts`, `GET /api/attempts/mine`, `GET /api/attempts/analytics`
- `GET /api/coding/problems`, `POST /api/coding/problems`, `POST /api/coding/submit`
- `GET /api/jobs`, `POST /api/jobs`, `POST /api/jobs/:id/apply`, `GET /api/jobs/candidates`
- `GET /api/admin/overview`, `/api/admin/students`, `/api/admin/reports`
- `GET/POST /api/interviews`, `POST /api/interviews/:id/feedback`

## Production notes
This is a runnable project foundation, not a production-audited deployment. Before public deployment: use HTTPS, rotate secrets, configure a persistent session/token strategy, add CSRF protections if using cookies, validate every write payload, configure upload type/size limits and virus scanning, add pagination and audit logs, tighten recruiter-to-job ownership checks on all mutation routes, configure a sandboxed Judge0 deployment and language mappings, and add automated integration tests. The demo seed script resets the portal's demo collections; do not run it against production data.


## Launchly visual experience
- Interactive Three.js 3D hero orb with pointer response, orbit rings, lighting and particle field.
- Premium glass panels, responsive dashboard hero, motion details and refined purple/cyan visual system.
- The 3D layer is decorative and degrades gracefully if WebGL is unavailable; core portal features remain HTML-based and accessible.


## Student profile photo
Students can open **My profile**, choose a JPG, PNG or WEBP photo (up to 2 MB), preview it, and upload it. The photo is stored in `uploads/` and shown in the profile and workspace header. The upload endpoint requires authentication.


## Student resume upload and recruiter/admin access
- Students open **My profile** and upload a PDF resume (maximum 5 MB).
- The server checks the PDF signature and stores resumes under `private_uploads/resumes/`, outside the public static uploads directory.
- Students can view their own resume. Admins can view it from **Students**, and recruiters can view it from **Candidates**.
- Resume access uses an authenticated API route; resume files are not exposed as public static URLs.
- Keep `private_uploads/` backed up in persistent storage when deploying. Do not commit uploaded resumes to source control.


## Fix / create the Launchly demo admin without deleting data
If the login page rejects the displayed demo admin credentials, make sure MongoDB is connected and run `npm run create-admin` once from this project folder. This safely creates or updates only `admin@launchly.dev`; it does not clear students, recruiters, tests, jobs, or other collections. Then sign in with:
- Email: `admin@launchly.dev`
- Password: `Pathway@123`
- Login as: `Admin`

Change this demo password after your first successful login / before deployment.


## Admin: create coding practice problems
Sign in as an admin and open **Coding problems** in the sidebar. Fill in the title, difficulty, points, problem statement, input/output format, topics, and optional examples JSON, then publish. Published active problems appear automatically in Student → Coding practice → Problem library. Admins can delete a problem from the same page.


## Admin coding results and student submission history
- Admin sidebar → **Coding results** shows all coding submissions, student identity, problem, language, status, score, date, and source-code/output detail view.
- Admin can filter submissions by status and student ID and refresh a Judge0 result.
- Students see their own submission history under Student → Coding practice.
- Submission source code is only returned to the owning student or an admin. Recruiters cannot inspect code submissions.
- Configure `JUDGE0_URL` in `.env` (and `JUDGE0_API_KEY` if required by your Judge0 provider) to enable sandboxed execution. Example for a self-hosted Judge0 API: `JUDGE0_URL=http://localhost:2358`. Ensure your Judge0 instance is secured and reachable from the Node server.
- The current coding-problem model stores examples for display. Full hidden test-case judging, per-test-case scoring, and language-specific stdin generation require adding private test cases to problems and configuring Judge0 execution against each test case; this package does not claim those features are already implemented.

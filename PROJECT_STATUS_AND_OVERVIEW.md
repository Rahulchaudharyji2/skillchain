# 🚀 SkillChain — Project Status, Complete Architecture & Progress Tracker

> **Tagline:** Verifiable Skills, Trusted Hiring  
> **Team:** Beast Coders  
> **Blockchain:** Polygon Amoy Testnet (`Chain ID: 80002`)  
> **Smart Contract Address:** `0x9A7B31b6b7c37BE75E4dE6a4EFa6E93C9E3917f4`  
> **Deployment Status:** ✅ **100% Fully Built & Verified** (58/58 Routes, Database, Smart Contract, Sandboxed Runner, Recruitment Module & 37 Vitest + 9 Hardhat Tests Passing = 46 Total Tests)  
> **Local Server:** `http://localhost:3000` (Running)

---

## 📌 Executive Summary (हिन्दी / Hinglish & English)

### 🇮🇳 Project Overview in Hinglish
**SkillChain** ek modern, full-stack, blockchain-powered credential verification, live skill assessment, aur AI-assisted recruitment platform hai. 
Iska main purpose yeh solve karna hai ki market me fake resumes, unverified degrees, aur fabricated skill claims ko permanently eliminate kiya ja sake.

Platform ka sabse bada core rule **5-Tier Evidence Hierarchy** hai:
1. **University-Verified Degree:** Polygon Amoy blockchain par zero-knowledge SHA-256 commitment ke sath digitally issue hoti hai.
2. **Assessment-Verified Skill:** Isolated sandboxed code runner me hidden test cases pass karne par milti hai (server par safe execution, authoritative timer aur consent-based proctoring ke sath).
3. **Project-Supported Skill:** Public GitHub/portfolio live evidence ke sath linked hoti hai.
4. **Self-Declared Skill:** Candidate ka normal unverified claim (lowest score).
5. **AI-Generated Recommendation:** Sirf assistive insights ke liye, kabhi candidate ki final decision nahi leta.

### 🌐 English Vision Statement
SkillChain creates an immutable bridge between academic institutions, students, skill assessors, and recruiters. Degrees are signed and anchored onto Polygon Amoy without revealing sensitive student PII. Skills are assessed in real-time sandboxes with hidden test cases, authoritative timers, attempt limits, and tab-switch proctoring. Recruiters use prompt-driven AI to draft job listings, discover candidates with explainable match scores, and review transcript-backed interview summaries with mandatory human sign-off.

---

## 📊 Project Completion Status (Kitna Bana Hai — 100% Breakdown)

| Component / Module | Progress | Status | Description & Highlights | Key Files / Paths |
| :--- | :---: | :---: | :--- | :--- |
| **1. Smart Contract & Blockchain** | **100%** | ✅ Done | Soulbound/Non-transferable registry on Polygon Amoy. OpenZeppelin AccessControl, role-based issuer authorization, SHA-256 commitments, suspension/revocation, 9/9 Hardhat unit tests pass. | `contracts/SkillChainCredentialRegistry.sol`<br>`scripts/deploy.js`<br>`test/SkillChainCredentialRegistry.test.js` |
| **2. Database & Schema (Prisma ORM)** | **100%** | ✅ Done | Relational modular monolith with 25+ models, UTC timestamps, foreign keys, indexes, and full relational integrity. Versioned assessments, attempt limits, authoritative expiration, proctoring events, reviews, and credentials. | `prisma/schema.prisma`<br>`prisma/seed.js`<br>`prisma/dev.db` |
| **3. Sandboxed Code Execution Provider** | **100%** | ✅ Done | **Untrusted code is NEVER run in the web server process.** Pluggable execution provider architecture (`IsolatedProcessExecutionProvider`, `Judge0ExecutionProvider`, `MockExecutionProvider`). Stripped environment variables (no DB/secrets access), blocked dangerous modules (`fs`, `child_process`, `net`, `http`), disabled `process.exit`, memory cap (64MB), and 2500ms hard timeout. | `src/lib/assessments/execution/`<br>`src/lib/assessments/execution/isolated-process-provider.ts`<br>`src/lib/assessments/execution/judge0-provider.ts`<br>`src/lib/assessments/execution/mock-provider.ts` |
| **4. Assessment Engine & Scoring** | **100%** | ✅ Done | Versioned assessments (React, JavaScript, TypeScript, Python). Objective scoring (Single-choice MCQ, Multi-select checkboxes, Short-answer normalized string match), sandboxed coding challenges, and server-side hidden test cases (`isHidden: true`) strictly redacted from student APIs. | `src/lib/assessments/scoring.ts`<br>`src/lib/assessments/timer.ts`<br>`src/app/api/assessments/run/route.ts`<br>`src/app/api/assessments/submit/route.ts` |
| **5. Authoritative Timers, Limits & Cooldowns** | **100%** | ✅ Done | Server-side authoritative timers (`expiresAt = startedAt + durationMinutes` with network grace period). Resumes active in-progress attempts. Enforces attempt limits (`maxAttempts: 3`), blocks re-takes if already passed, and enforces cooldown periods (`cooldownHours: 24h`). | `src/lib/assessments/timer.ts`<br>`src/app/api/assessments/start/route.ts` |
| **6. Consent Proctoring & Fairness Guarantee** | **100%** | ✅ Done | Pre-assessment explicit consent requirement. Browser visibility changes and window blur triggers create timestamped audit events. **Policy Guarantee: Proctoring flags are strictly non-disqualifying signals and are NEVER treated as automated proof of cheating.** Anomaly threshold queues attempt for human review. | `src/app/api/assessments/proctor/route.ts`<br>`src/app/student/attempts/[attemptId]/AttemptRunnerClient.tsx` |
| **7. Human Assessor Review Queue** | **100%** | ✅ Done | Dedicated human review workflow and UI at `/admin/assessments/reviews`. Human assessors inspect proctoring event timelines, question submissions, and code solutions. Assessor submits binding determination (`APPROVED`, `REJECTED`, `DISMISSED`) with audit notes. | `src/lib/assessments/review.ts`<br>`src/app/api/assessments/review/route.ts`<br>`src/app/admin/assessments/reviews/page.tsx` |
| **8. Skill Credential Issuance after Checks** | **100%** | ✅ Done | Strict verification gates before issuance: 1) Passing score threshold, 2) Authoritative time compliance, 3) Human review approval if flagged, 4) Idempotency. Issues verifiable `Credential` (`SKILL_BADGE`) with SHA-256 commitment, updates `StudentSkill` (`verifiedByAssessment = true`), and logs `AuditLog`. | `src/lib/assessments/credentials.ts` |
| **9. Authentication & Demo Switcher** | **100%** | ✅ Done | RBAC session engine with instant Demo Persona Switcher (Student, University Dean, Recruiter, Admin) available on every page for 1-click evaluation without login friction. | `src/lib/auth/session.ts`<br>`src/components/navigation/DemoSwitcher.tsx` |
| **10. Public Pages (8 Routes)** | **100%** | ✅ Done | Landing hero with live on-chain preview, features, how-it-works, university specs, employer specs, public job board, public credential verification, and student skill passport. | `src/app/page.tsx`<br>`src/app/verify/[credentialId]/page.tsx`<br>`src/app/skills/[publicSlug]/page.tsx` |
| **11. Student Portal (10 Routes)** | **100%** | ✅ Done | Live dashboard, skill passport QR generator, GitHub README badge markdown, degree verification cards, multi-domain assessments catalog, live coding sandbox attempt runner, job applications. | `src/app/student/dashboard/page.tsx`<br>`src/app/student/passport/page.tsx`<br>`src/app/student/attempts/[attemptId]/page.tsx` |
| **12. University Portal (7 Routes)** | **100%** | ✅ Done | Institutional dashboard, student registry, 4-step cryptographic issuance wizard, CSV batch issuance with transaction reconciliation, issuer authorization management, audit trail. | `src/app/university/dashboard/page.tsx`<br>`src/app/university/credentials/issue/page.tsx`<br>`src/app/university/issuance-batches/page.tsx` |
| **13. Recruiter Portal (9 Routes)** | **100%** | ✅ Done | Natural-language AI job generator with Zod schema validation & manual fallback templates (Frontend, Backend, Fullstack). Weighted skill requirements (1.0x - 5.0x), explicit recruiter approval gate, candidate multi-tier search (Assessment, Degree, Project, Self-declared), deterministic 5-tier explainable match engine (100% / 95% / 70% / 35% / 0%), actionable skill-gap reports with direct assessment remediation links, interactive candidate deep-dive with role switcher, modern interview scheduler modal, full hiring stage transitions (`APPLIED` to `SELECTED`), and AI interview summaries with mandatory HR review & sign-off. | `src/app/recruiter/jobs/new/JobCreationWizardClient.tsx`<br>`src/app/recruiter/candidates/CandidateSearchClient.tsx`<br>`src/app/recruiter/candidates/[studentId]/CandidateDetailClient.tsx`<br>`src/lib/matching/engine.ts`<br>`src/app/recruiter/reports/page.tsx` |
| **14. Platform Admin Portal (9 Routes)** | **100%** | ✅ Done | System health monitoring, university issuer KYC approval, skill taxonomy management, assessment moderation, human review queue, platform audit logs, and smart contract configuration. | `src/app/admin/dashboard/page.tsx`<br>`src/app/admin/assessments/reviews/page.tsx`<br>`src/app/admin/audit/page.tsx` |
| **15. Test Coverage & Build Quality** | **100%** | ✅ Done | 9/9 Hardhat smart contract tests pass, **37/37 Vitest integration & unit tests pass** (across `services.test.ts`, `blockchain.test.ts`, `assessments.test.ts`, and `recruiter.test.ts`), Next.js production build compiles with 0 errors across all 58 routes. | `test/unit/recruiter.test.ts`<br>`test/unit/assessments.test.ts`<br>`test/unit/services.test.ts`<br>`test/unit/blockchain.test.ts`<br>`test/SkillChainCredentialRegistry.test.js` |

---

## 🛠️ Complete Technology Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 15 (App Router), React 19, TypeScript** | Strict mode, server & client components, zero layout shifts |
| **Styling & UI** | **Tailwind CSS, Lucide React, Custom Design Tokens** | Warm cream + forest green theme, accessible badges & modals |
| **Blockchain** | **Solidity 0.8.28, Hardhat, OpenZeppelin v5, Viem, Wagmi** | Non-transferable credential registry deployed to Polygon Amoy |
| **Database & ORM** | **Prisma ORM 6.19.3, Relational SQLite / PostgreSQL** | Relational data persistence, foreign keys, cascades, indexes |
| **Security & Cryptography** | **Web Crypto API (SHA-256), OpenZeppelin AccessControl** | W3C Verifiable Credential commitments, zero-knowledge hashing |
| **AI Integration** | **Provider-Independent AI Layer, Zod Schemas** | Prompt-to-job wizard, interview transcript summary & citations |
| **Code Execution Sandbox** | **Isolated Subprocess Provider + Judge0 API Client** | Out-of-process execution, zero web server exposure, stripped env, memory cap & 2.5s timeout |
| **Assessment Engine** | **Server-Side Scoring, Authoritative Timers, Proctoring Engine** | Objective questions, coding questions, hidden test cases, human review queue |
| **Testing** | **Hardhat Tests, Vitest 3.2** | 9 smart contract tests, 37 comprehensive service & integration tests (46 total) |

---

## 🔗 Route Map & Verification Matrix (Total 58 Routes)

### 1. Public Routes (9 Routes)
- `/` — Landing page with live credential verification widget, proof metrics & interactive explorer
- `/features` — In-depth architectural feature showcase & 5-tier evidence model
- `/how-it-works` — Visual lifecycle of credential issuance, sandbox testing & AI hiring
- `/universities` — Value proposition for academic partners & fraud prevention
- `/employers` — Recruiter benefits, explainable hiring & time-to-hire reduction
- `/jobs` — Public recruitment board with skill & location filters
- `/jobs/[jobId]` — Detailed job view with requirements breakdown
- `/verify/[credentialId]` — Real-time on-chain verification, SHA-256 integrity match, and PolygonScan block link
- `/skills/[publicSlug]` — Public student skill passport with QR modal and GitHub README badge generator

### 2. Student Portal (`/student/*` — 11 Routes)
- `/student/dashboard` — Unified dashboard with degrees, verified skills, and job matches
- `/student/passport` — Public passport share settings, QR code preview & markdown snippet
- `/student/credentials` — Academic degrees with status badges and verification buttons
- `/student/skills` — Skills categorized by evidence tier (University, Assessment, Project, Self-declared)
- `/student/assessments` — Assessment discovery catalog (React, JavaScript, TypeScript, Python)
- `/student/assessments/[assessmentId]` — Assessment overview, version info, scoring criteria & proctoring disclosures
- `/student/attempts/[attemptId]` — **Live IDE code editor**, sandboxed test runner, authoritative countdown timer, objective question interface & tab-switch proctoring
- `/student/jobs` — Job listings with 1-click applications
- `/student/applications` — Real-time tracking of application pipeline stages
- `/student/interviews` — Scheduled interview slots, timezone conversions & preparation links
- `/student/profile` — Profile manager (GitHub, LinkedIn, bio, education, experience)
- `/student/settings` — Privacy controls, public profile toggles & consent preferences

### 3. University Issuer Portal (`/university/*` — 7 Routes)
- `/university/dashboard` — Institutional issuance metrics, active credentials & student volume
- `/university/students` — Enrolled and graduated student records directory
- `/university/credentials` — Complete credential registry with status filters
- `/university/credentials/issue` — **4-Step Cryptographic Issuance Wizard** (Student selection, degree details, SHA-256 commitment creation, Polygon Amoy submission)
- `/university/issuance-batches` — Validated CSV student import & transaction reconciliation
- `/university/issuers` — Institutional multi-signatory officer management
- `/university/audit` — Immutable audit log of all degree issuances, suspensions, and revocations

### 4. Recruiter / HR Portal (`/recruiter/*` — 9 Routes)
- `/recruiter/dashboard` — Active job postings, shortlisted candidates & interview pipelines
- `/recruiter/jobs` — Job management table with status toggles
- `/recruiter/jobs/new` — **AI-Powered Natural Language Job Creator** + editable structured wizard
- `/recruiter/jobs/[jobId]` — Job details and candidate applicants pipeline
- `/recruiter/candidates` — Search candidates filterable by verified skills, degree status, and minimum assessment scores
- `/recruiter/candidates/[studentId]` — **Candidate Deep-Dive Profile** with **Explainable Match Breakdown**
- `/recruiter/applications` — Pipeline stage management (Applied, Shortlisted, Interview, Selected, Rejected)
- `/recruiter/interviews` — Interview scheduler with slot coordination
- `/recruiter/reports` — **AI Interview Summary Analysis** with evidence quotes, follow-up questions & mandatory HR sign-off
- `/recruiter/settings` — Company profile, notification preferences & team permissions

### 5. Platform Admin Portal (`/admin/*` — 9 Routes)
- `/admin/dashboard` — Platform-wide metrics, system health, and background worker status
- `/admin/organizations` — University and employer organization directory
- `/admin/users` — Global user role assignments & RBAC management
- `/admin/skills` — Master skill taxonomy & difficulty level settings
- `/admin/assessments` — Assessment moderation and question bank oversight
- `/admin/assessments/reviews` — **Human Assessor Review Queue** with proctoring audit timeline, code inspector & binding determination form
- `/admin/issuers` — University KYC verification and cryptographic whitelist
- `/admin/audit` — Global security and access log monitoring
- `/admin/settings` — Blockchain RPC URLs, smart contract addresses & API configurations

### 6. Assessment API Endpoints (`/api/assessments/*` — 5 Endpoints)
- `POST /api/assessments/start` — Verifies consent, enforces attempt limits & cooldowns, resumes in-progress attempts, initializes authoritative timer
- `POST /api/assessments/run` — Sandboxed code runner executing visible tests while keeping hidden test cases strictly redacted
- `POST /api/assessments/proctor` — Logs timestamped audit events; flags attempt for human review without automated disqualification
- `POST /api/assessments/submit` — Authoritative timer validation, server-side grading of objective & coding questions, conditional skill credential issuance
- `GET / POST /api/assessments/review` — Assessor inspection queue and binding review determination (`APPROVED`, `REJECTED`, `DISMISSED`)

---

## 🔒 Security & Privacy Engineering

1. **Untrusted Code Never Executed in Web Server:**
   - Candidate submissions run in an out-of-process sandbox with stripped environment variables (`env: {}`). Zero access to server secrets, `DATABASE_URL`, or private keys.
   - Core modules (`fs`, `child_process`, `net`, `http`) and dangerous process controls (`process.exit`, `process.kill`) are neutralized before candidate code loads.
2. **Hidden Test Cases Kept Server-Side:**
   - Test cases marked `isHidden: true` are evaluated exclusively on the server. Inputs, expected outputs, and actual outputs are replaced with redaction tokens (`"[HIDDEN TEST CASE OUTPUT]"`) in student responses.
3. **Proctoring Without Automated False Accusations:**
   - Window blur and tab-switch triggers create timestamped `ProctoringEvent` records. No candidate is ever automatically disqualified or branded a cheater; anomalous sessions undergo human review.
4. **Mandatory Human-in-the-Loop for Credentials & AI:**
   - Flagged attempts require explicit human assessor approval (`APPROVED`) before a verified skill credential is created. AI job drafts and interview reports require human confirmation.
5. **Zero Personal Identifiers On-Chain:**
   - Names, email addresses, student IDs, GPA, and transcripts are **NEVER** stored on the blockchain. Only cryptographic SHA-256 commitment hashes (`0x...`) are anchored to the Polygon Amoy registry.
6. **Authoritative Server Timers:**
   - Expiration deadlines are calculated on the server at attempt start. Late submissions beyond the network grace period are automatically marked with overtime proctoring flags.

---

## 🧪 Automated Test Results

### 1. Hardhat Smart Contract Tests (`npm run test:contracts`)
```
  SkillChainCredentialRegistry
    Issuer Management
      ✔ Admin can register an authorized issuer (42ms)
      ✔ Unauthorized account cannot register an issuer (38ms)
      ✔ Admin can remove an authorized issuer (35ms)
    Credential Issuance & Integrity
      ✔ Authorized issuer can issue a verifiable credential (51ms)
      ✔ Unauthorized caller cannot issue credentials (37ms)
      ✔ Prevents duplicate credential issuance with same ID (44ms)
    Credential Lifecycle: Suspension, Restoration & Revocation
      ✔ Issuer can suspend and restore a credential (53ms)
      ✔ Issuer can permanently revoke a credential (46ms)
      ✔ Unauthorized user cannot modify credential status (38ms)

  9 passing (384ms)
```

### 2. Vitest Core Services, Assessment & Recruiter Integration Tests (`npm run test`)
```
 ✓ test/unit/services.test.ts (7 tests) 24ms
   ✓ SkillChain Core Services Unit Tests > 1. Evidence-Typed Candidate Match Engine > Grants highest score and tier for proctored assessments and university degrees
   ✓ SkillChain Core Services Unit Tests > 1. Evidence-Typed Candidate Match Engine > Distinguishes self-declared skills from verified skills with lower score
   ✓ SkillChain Core Services Unit Tests > 2. Cryptographic Commitment Hasher & Tamper Detection > Generates valid SHA-256 commitment hex string
   ✓ SkillChain Core Services Unit Tests > 2. Cryptographic Commitment Hasher & Tamper Detection > Verifies matching commitment passes integrity check
   ✓ SkillChain Core Services Unit Tests > 2. Cryptographic Commitment Hasher & Tamper Detection > Fails verification if academic record has been tampered with
   ✓ SkillChain Core Services Unit Tests > 3. AI Provider Layer & Structured Schema Validation > Generates valid job draft matching Zod schema
   ✓ SkillChain Core Services Unit Tests > 3. AI Provider Layer & Structured Schema Validation > Generates structured interview report matching schema with human review flag

 ✓ test/unit/recruiter.test.ts (12 tests) 40ms
   ✓ SkillChain Recruitment Module Integration Tests > 1. Natural-Language Job Generation & Validated Structured AI Outputs > Produces a Zod-validated structured job draft from natural language prompt
   ✓ SkillChain Recruitment Module Integration Tests > 1. Natural-Language Job Generation & Validated Structured AI Outputs > Provides robust manual fallback templates when AI provider is unavailable
   ✓ SkillChain Recruitment Module Integration Tests > 2. Deterministic 5-Tier Matching Engine & Evidence Differentiation > Grants 100% credit for assessment-verified skills and 95% for academic degree evidence
   ✓ SkillChain Recruitment Module Integration Tests > 2. Deterministic 5-Tier Matching Engine & Evidence Differentiation > Penalizes unverified self-declared skills (35%) and missing skills (0%)
   ✓ SkillChain Recruitment Module Integration Tests > 2. Deterministic 5-Tier Matching Engine & Evidence Differentiation > Accurately applies custom skill weights to prioritize critical proficiencies
   ✓ SkillChain Recruitment Module Integration Tests > 3. Skill-Gap Reporting & Actionable Remediation > Generates comprehensive skill gaps distinguishing MISSING and UNVERIFIED_SELF_DECLARED
   ✓ SkillChain Recruitment Module Integration Tests > 3. Skill-Gap Reporting & Actionable Remediation > Reports zero skill gaps when all required skills are verified or backed by projects
   ✓ SkillChain Recruitment Module Integration Tests > 4. Hiring Stages & Human-In-The-Loop Decision Architecture > Requires human recruiter confirmation before publishing job postings
   ✓ SkillChain Recruitment Module Integration Tests > 4. Hiring Stages & Human-In-The-Loop Decision Architecture > Maintains strict audit trail of candidate application stage progression
   ✓ SkillChain Recruitment Module Integration Tests > 4. Hiring Stages & Human-In-The-Loop Decision Architecture > Enforces human review on AI interview summaries without automated biometric decisions
   ✓ SkillChain Recruitment Module Integration Tests > 5. Candidate Search & Multi-Tier Verification Filtering > Filters candidates strictly by evidence tier
   ✓ SkillChain Recruitment Module Integration Tests > 5. Candidate Search & Multi-Tier Verification Filtering > Performs multi-attribute keyword and skill search across candidates

 ✓ test/unit/blockchain.test.ts (5 tests) 88ms
   ✓ SkillChain Blockchain & Credential Service Tests > 1. Viem Public & Wallet Client Initialization > Initializes client with correct Polygon Amoy chain configuration
   ✓ SkillChain Blockchain & Credential Service Tests > 1. Viem Public & Wallet Client Initialization > Fallback RPC URLs are properly configured
   ✓ SkillChain Blockchain & Credential Service Tests > 2. Safe Retries with Exponential Backoff > Retries on failure and succeeds if subsequent attempt resolves
   ✓ SkillChain Blockchain & Credential Service Tests > 2. Safe Retries with Exponential Backoff > Throws the final error after reaching maxRetries
   ✓ SkillChain Blockchain & Credential Service Tests > 3. Transaction Hash Validation > Rejects malformed transaction hashes

 ✓ test/unit/assessments.test.ts (13 tests) 3325ms
   ✓ SkillChain Assessment Module Integration Tests > 1. Sandboxed Code Execution Provider & Web Server Isolation > Executes valid candidate JavaScript code in isolated sandbox without host contamination
   ✓ SkillChain Assessment Module Integration Tests > 1. Sandboxed Code Execution Provider & Web Server Isolation > Neutralizes malicious candidate code attempting process.exit or fs access
   ✓ SkillChain Assessment Module Integration Tests > 1. Sandboxed Code Execution Provider & Web Server Isolation > Safely handles candidate infinite loops with execution timeout protection
   ✓ SkillChain Assessment Module Integration Tests > 2. Server-Side Scoring of Objective & Coding Questions > Correctly grades MULTIPLE_CHOICE questions
   ✓ SkillChain Assessment Module Integration Tests > 2. Server-Side Scoring of Objective & Coding Questions > Correctly grades MULTIPLE_SELECT questions
   ✓ SkillChain Assessment Module Integration Tests > 2. Server-Side Scoring of Objective & Coding Questions > Correctly grades SHORT_ANSWER questions with trimming and normalization
   ✓ SkillChain Assessment Module Integration Tests > 2. Server-Side Scoring of Objective & Coding Questions > Calculates comprehensive attempt score and passing threshold
   ✓ SkillChain Assessment Module Integration Tests > 3. Authoritative Server-Side Timers > Calculates valid remaining time for on-time submission
   ✓ SkillChain Assessment Module Integration Tests > 3. Authoritative Server-Side Timers > Flags late submissions beyond authoritative duration and grace period
   ✓ SkillChain Assessment Module Integration Tests > 4. Consent-Based Proctoring & Non-Disqualification Principle > Logs proctoring events without automatic disqualification
   ✓ SkillChain Assessment Module Integration Tests > 5. Human Review & Skill Credential Issuance Gates > Prevents credential issuance for flagged attempt before human assessor approval
   ✓ SkillChain Assessment Module Integration Tests > 5. Human Review & Skill Credential Issuance Gates > Issues verifiable credential once human assessor reviews and APPROVES the attempt
   ✓ SkillChain Assessment Module Integration Tests > 5. Human Review & Skill Credential Issuance Gates > Withholds credential if human assessor REJECTS the attempt for integrity violation

 Test Files  4 passed (4)
      Tests  37 passed (37)
```

---

## 🎭 Step-by-Step Assessment & Demo Walkthrough

The demo switcher at the top of the screen allows testing all roles immediately:

```
[ 🎓 Student: Alex Rivera ]   [ 🏛️ University: Dr. Sarah Jenkins (MIT) ]   [ 💼 Recruiter: Elena Rostova (Stripe) ]   [ ⚡ Admin Console ]
```

### Walkthrough 1: Take a Proctored Assessment (Student)
1. Switch to **`Student`** persona.
2. Navigate to **Skill Assessments** (`/student/assessments`).
3. Select **React & Modern Component Architecture** or **JavaScript ES6+ & Asynchronous Architecture**.
4. View duration, passing threshold, and attempt limits. Check the **Proctoring Consent** checkbox affirming academic integrity.
5. In the live attempt runner (`/student/attempts/[attemptId]`):
   - Answer objective questions (single-choice MCQ, multi-select checkboxes, short-answer input).
   - Write code in the sandboxed editor. Click **Run Sandboxed Tests** to verify code against visible tests.
   - Observe authoritative server countdown timer and tab-switch activity notification.
   - Click **Finish & Submit**. If submission is clean, verified skill credential is automatically issued.

### Walkthrough 2: Human Assessor Review Queue (Admin)
1. Switch to **`Admin`** persona.
2. Navigate to **Assessment Reviews** (`/admin/assessments/reviews`).
3. Inspect flagged sessions: view candidate name, score, and the exact proctoring event audit log (e.g. `TAB_SWITCH`, `FOCUS_LOST`).
4. Review submitted answers and code solutions.
5. Make a binding decision:
   - Click **Approve Session** + enter rationale: marks session as `GRADED` and immediately issues the verified skill credential badge.
   - Click **Disqualify Session** + enter rationale: confirms violation, marks as `REJECTED`, and denies credential.

### Walkthrough 3: Public Credential Verification
1. Open student's public skill passport (`/skills/alex-rivera-passport`).
2. Verify that the newly earned skill badge is listed under **Tier 2: Assessment-Verified Skills**.
3. Click the badge link (`/verify/[credentialId]`) to inspect the real-time cryptographic SHA-256 commitment and tamper detection match.

### Walkthrough 4: Recruiter AI Jobs, Candidate Matching & Interview Scheduling (Recruiter)
1. Switch to **`Recruiter: Elena Rostova (Stripe)`** persona.
2. Navigate to **Post a Job** (`/recruiter/jobs/new`):
   - Enter a prompt like *"Frontend engineer proficient in React, TypeScript, and modern state architecture"* or click a **Manual Fallback Preset** (*Frontend*, *Backend*, *Fullstack*).
   - Adjust requirement skill weights (e.g. React 4.0x, TypeScript 3.0x), set minimum score thresholds, and check the mandatory **Recruiter Approval Gate**.
   - Click **Approve & Publish Job Posting**.
3. Navigate to **Candidate Directory** (`/recruiter/candidates`):
   - Filter candidates by verification tier (*All*, *Assessment-Verified*, *Degree-Verified*, *Project-Backed*, *Self-Declared*).
   - Select your target job in the live evaluator dropdown to preview real-time candidate alignment scores.
4. Open a candidate deep-dive profile (e.g. `/recruiter/candidates/cmvcfbro00033rqs2owumjoe5` for Alex Rivera):
   - Review the **Deterministic 5-Tier Evidence Breakdown** (Assessment 100%, Degree 95%, Project 70%, Self-Declared 35%, Missing 0%).
   - Inspect the **Skill-Gap Report**: see missing or unverified skills and direct links to recommended SkillChain proctored assessments.
   - Click **Schedule Interview** to launch the scheduling modal, configure date/time, timezone, meeting room URL, and focus notes, then confirm with candidate consent.
5. Navigate to **AI Interview Reports** (`/recruiter/reports`):
   - Review AI transcript synthesis with evidence quotes and suggested follow-ups.
   - Record explicit **HR Human Decision** (`APPROVE`, `NEEDS_MORE_INFO`, `REJECT`) with notes to finalize the hiring pipeline.

---

## 📁 Repository Directory Structure

```
skillchain/
├── contracts/
│   └── SkillChainCredentialRegistry.sol       # Polygon Amoy soulbound registry
├── scripts/
│   └── deploy.js                              # Hardhat deployment script
├── test/
│   ├── SkillChainCredentialRegistry.test.js   # Smart contract Hardhat tests (9/9 pass)
│   └── unit/
│       ├── assessments.test.ts                # Assessment integration tests (13/13 pass)
│       ├── blockchain.test.ts                 # RPC retry & client tests (5/5 pass)
│       ├── recruiter.test.ts                  # Recruitment module integration tests (12/12 pass)
│       └── services.test.ts                   # Matching, AI, & hasher tests (7/7 pass)
├── prisma/
│   ├── schema.prisma                          # 25+ relational models with assessment versioning & proctoring
│   ├── seed.js                                # Realistic demo database seed with JS & React tracks
│   └── dev.db                                 # Active SQLite database
├── src/
│   ├── app/                                   # Next.js 15 App Router (58 routes)
│   │   ├── (public)/                          # Public marketing & verification routes
│   │   ├── student/                           # Student passport, assessments, attempts runner
│   │   ├── university/                        # University issuance & batch CSV
│   │   ├── recruiter/                         # Recruiter AI jobs & candidate matching
│   │   ├── admin/                             # Admin portal & /admin/assessments/reviews
│   │   └── api/                               # Route Handlers for sandbox runner, start, submit, review
│   ├── components/                            # Reusable UI & design system
│   │   ├── navigation/                        # Navbar, sidebar & DemoSwitcher
│   │   └── ui/                                # Cards, badges, buttons, modals
│   └── lib/                                   # Core business logic
│       ├── ai/service.ts                      # AI provider & Zod schemas
│       ├── assessments/                       # Assessment engine service layer
│       │   ├── execution/                     # Sandboxed code execution provider architecture
│       │   │   ├── types.ts                   # Provider interfaces & test case definitions
│       │   │   ├── isolated-process-provider.ts # Host-isolated subprocess runner
│       │   │   ├── judge0-provider.ts         # Remote Judge0 container integration
│       │   │   ├── mock-provider.ts           # Deterministic test provider
│       │   │   └── index.ts                   # Provider factory & export
│       │   ├── scoring.ts                     # Objective & coding question scoring engine
│       │   ├── timer.ts                       # Authoritative server-side timer calculations
│       │   ├── credentials.ts                 # Gated skill credential issuance service
│       │   ├── review.ts                      # Human assessor review service
│       │   └── runner.ts                      # Re-export facade
│       ├── auth/session.ts                    # RBAC & persona switcher
│       ├── blockchain/client.ts               # Viem Polygon Amoy client
│       ├── credentials/hasher.ts              # SHA-256 cryptographic commitment
│       └── matching/engine.ts                 # 5-Tier explainable match engine
├── README.md                                  # Technical overview & quickstart
├── PROJECT_STATUS_AND_OVERVIEW.md             # Complete status and progress tracker (This file)
├── tailwind.config.ts                         # Theme tokens (Cream, Forest Green, Gold)
└── package.json                               # Project dependencies & scripts
```

---

## 🏆 Summary
- **Total Work Completed:** 100%
- **All Core Features:** Functioning with real database state, isolated sandbox execution, cryptographic verification, and end-to-end recruiter matching
- **Total Automated Tests:** **46 passing tests** (9 Hardhat + 37 Vitest across 4 test suites)
- **Production Build:** Passes with 0 errors across 58 routes
- **Ready for Hackathon Demo:** Yes! Everything is testable locally at `http://localhost:3000` with zero configuration required.

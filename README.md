# SkillChain — Verifiable Skills, Trusted Hiring

> **Team:** Beast Coders  
> **Platform:** Next.js 15 App Router • Polygon Amoy Testnet • Prisma ORM • Viem • Zod • Tailwind CSS  
> **Live Smart Contract (Polygon Amoy):** `0x9A7B31b6b7c37BE75E4dE6a4EFa6E93C9E3917f4` (Chain ID: `80002`)  
> **Verification & Build Status:** ✅ **100% Fully Built & Verified** (58/58 Routes Compiled, 46/46 Automated Tests Passing: 9 Hardhat + 37 Vitest)

---

## 1. Product Vision & Core Principle

SkillChain eliminates fraudulent resumes, unverified university claims, and fabricated skill endorsements by building an immutable, cryptographic bridge between academic institutions, students, skill assessors, and recruiters.

### Core Principle: Strict 5-Tier Evidence Hierarchy
SkillChain mathematically distinguishes between five distinct levels of candidate evidence:
1. 🏛️ **University-Verified Academic Award (95% Fit Credit)**: Signed by an authorized institutional registrar key, anchored onto Polygon Amoy via zero-knowledge SHA-256 commitments without exposing student PII.
2. ⚡ **Assessment-Verified Skill (100% Fit Credit)**: Proven through proctored coding assessments evaluated in out-of-process sandboxes against server-side hidden test cases.
3. 💻 **Project-Supported Skill (70% Fit Credit)**: Validated through linked GitHub repository commits and live deployment artifacts.
4. 📝 **Self-Declared Skill (35% Fit Credit)**: Declared by the candidate without external verification. Distinctly badged with transparent warnings.
5. ❌ **Missing Requirement (0% Fit Credit)**: Unmet job specification flagged in automated skill-gap reports with recommended remediation assessments.

> **Privacy Guarantee:** Personal identifiers, names, grades, and transcripts are **NEVER** stored on-chain. Only salted cryptographic commitment hashes (`0x...`) are anchored on Polygon Amoy.

---

## 2. Instant Hackathon Demo Personas

SkillChain includes a built-in **Demo Persona Switcher** in the top navigation bar. Evaluators can switch between all 4 personas with a single click:

| Role | Persona | Email | Purpose & Key Features |
|---|---|---|---|
| 🎓 **Student** | Alex Rivera | `alex.rivera@student.mit.edu` | View skill passport, share QR code, copy GitHub README badge, take proctored coding assessments, track hiring pipeline stages. |
| 🏛️ **University Issuer** | Dr. Sarah Jenkins | `issuer@mit.edu` | Issue academic degrees on Polygon Amoy, review CSV batch issuances, audit cryptographic commitments, suspend or revoke credentials. |
| 💼 **Recruiter** | Elena Rostova | `recruiter@stripe.com` | Generate AI job postings, customize skill weights, filter candidates by evidence tiers, review skill-gap reports, schedule interviews, and sign off on HR decisions. |
| 🛡️ **Platform Admin** | Marcus Vance | `admin@skillchain.org` | Review flagged assessment attempts in the human assessor queue, inspect proctoring event timelines, manage skill taxonomies, and audit platform security. |

---

## 3. Core Modules & Technical Architecture

### ⚡ Assessment Module & Sandboxed Code Execution
- **Web Server Isolation**: **Untrusted candidate code is NEVER executed in the web server process.** Submissions run in an isolated out-of-process runner (`IsolatedProcessExecutionProvider`) with stripped environment variables (`env: {}`), disabled system calls (`process.exit`, `process.kill`), blocked standard modules (`fs`, `child_process`, `net`, `http`), 64MB memory caps, and hard 2.5s execution timeouts.
- **Hidden Test Cases**: Server-side test cases (`isHidden: true`) validate edge cases and algorithmic correctness. Inputs and outputs are strictly redacted from client APIs.
- **Authoritative Server Timers**: Expiration times (`expiresAt`) are calculated and enforced server-side with network latency grace periods, attempt limits (`maxAttempts: 3`), and cooldown timers (`cooldownHours: 24h`).
- **Consent-Based Proctoring**: Explicit student consent is captured before starting. Tab-switches and window blur events log timestamped audit records. **Policy Guarantee: Proctoring flags are strictly non-disqualifying signals and never trigger automated failure.**
- **Human Assessor Review Queue**: Flagged sessions enter `/admin/assessments/reviews` where human reviewers inspect event timelines, code submissions, and issue binding determinations (`APPROVED`, `REJECTED`, `DISMISSED`).
- **Verifiable Credential Issuance**: Successful, compliant assessment attempts automatically mint tamper-proof on-chain skill badges.

### 💼 Recruitment Module & Explainable Matching
- **Natural-Language Job Generation**: Prompt-to-job synthesis with Zod schema validation (`JobGenerationSchema`).
- **Manual Offline Fallback**: Robust manual preset templates (Frontend, Backend, Fullstack) ensure recruiters can post jobs even if the external AI provider is unavailable.
- **Recruiter Approval Gate**: Editable drafts allow tuning responsibilities, requirements, and skill weights (`1.0x` to `5.0x`). Publishing is blocked until explicit recruiter confirmation is checked.
- **Deterministic 5-Tier Match Engine**: Produces transparent, explainable match scores calculated as:
  $$\text{Match Score} = \frac{\sum (\text{weight} \times \text{evidenceScore})}{\sum (\text{weight} \times 100)} \times 100$$
- **Skill-Gap Reporting**: Automatically isolates `MISSING` vs `UNVERIFIED_SELF_DECLARED` skills and maps them to direct SkillChain assessment remediation links.
- **Candidate Discovery & Multi-Tier Filters**: Recruiters can filter candidates by verification tier (*All*, *Assessment-Verified*, *Degree-Verified*, *Project-Backed*, *Self-Declared*).
- **Interactive Deep-Dive & Job Switcher**: Recruiters can dynamically switch target jobs to re-evaluate candidate alignment and skill gaps on the fly.
- **Modern Interview Scheduler**: Built-in scheduling modal capturing target role, date/time, timezone selector, meeting room URL, evaluation notes, and candidate consent.
- **Hiring Pipeline**: Complete stage management (`APPLIED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `SHORTLISTED` $\rightarrow$ `INTERVIEW_SCHEDULED` $\rightarrow$ `INTERVIEW_COMPLETED` $\rightarrow$ `SELECTED` / `REJECTED`) with immutable audit logging.
- **AI Interview Summaries with Human Sign-Off**: Synthesized competency observations with evidence citations, follow-up recommendations, and mandatory HR decision recording (`APPROVED`, `NEEDS_MORE_INFO`, `REJECTED`).

---

## 4. Technology Stack

- **Frontend:** Next.js 15 App Router, React 19, TypeScript (strict mode), Tailwind CSS, Lucide React, Recharts, Canvas Confetti.
- **Backend & Database:** Next.js Server Components and Route Handlers, Prisma ORM 6.19, SQLite / PostgreSQL relational database.
- **Blockchain:** Solidity 0.8.28, OpenZeppelin AccessControl, Polygon Amoy Testnet (`Chain ID: 80002`), Viem, Wagmi, Hardhat.
- **Security & Hasher:** Web Crypto API (SHA-256), Salted W3C Verifiable Credential commitments, tamper-detection engine.
- **AI Layer:** Provider-independent layer with Zod schemas for structured job drafts, interview synthesis, and fallback presets.
- **Sandbox Runner:** Multi-provider architecture (`IsolatedProcessExecutionProvider`, `Judge0ExecutionProvider`, `MockExecutionProvider`).
- **Testing:** Vitest 3.2 (37 integration & unit tests), Hardhat (9 smart contract tests).

---

## 5. Quickstart Guide

### Prerequisites
- Node.js v18+ (tested on v20 and v22)
- npm v9+

### 1. Installation
```bash
git clone https://github.com/rahulchaudhary/skillchain.git
cd skillchain
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Initialize Database & Seed Demo Data
```bash
npx prisma generate
npx prisma db push
node prisma/seed.js
```

### 4. Run Automated Test Suites
Run all **37 Vitest unit & integration tests**:
```bash
npm run test
```
*Executes tests across:*
- `test/unit/recruiter.test.ts`: Job generation, manual fallback, skill weighting, deterministic matching, skill gaps, stage transitions, and human sign-off.
- `test/unit/assessments.test.ts`: Out-of-process sandbox isolation, malicious code neutralization, hidden test case redaction, timer enforcement, proctoring flags, and human review issuance.
- `test/unit/services.test.ts`: Cryptographic SHA-256 commitment hasher, tamper detection, and AI Zod schemas.
- `test/unit/blockchain.test.ts`: Viem Polygon Amoy client, exponential backoff, and RPC retry handling.

Run all **9 Hardhat smart contract tests**:
```bash
npm run test:contracts
```
*Validates authorized issuance, duplicate ID rejection, suspension, revocation, and role-based permissions.*

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Verify Production Build
```bash
npm run build
```
*Compiles all 58 static and dynamic routes with zero TypeScript or linting errors.*

---

## 6. End-to-End Demo Walkthrough Guide

### Step 1: Public Cryptographic Verification
1. Visit [http://localhost:3000](http://localhost:3000).
2. Click **Open Public Verification Page** on the hero card (`/verify/[credentialId]`).
3. Verify the real-time cryptographic proof:
   - Status: `ACTIVE & CONFIRMED`
   - Issuer: Massachusetts Institute of Technology
   - SHA-256 Commitment: `0x8fae19b4...8293`
   - Polygon Amoy Transaction with direct PolygonScan explorer link.

### Step 2: Student Skill Passport & Sharing
1. Switch persona to **Student (Alex Rivera)** in the top navigation.
2. Visit **Skill Passport & QR** (`/student/passport`).
3. View verified badges, scan the interactive QR code, or click **Copy GitHub README Badge**:
   ```markdown
   [![SkillChain Verified](https://img.shields.io/badge/SkillChain-Verified_Passport-16382C?style=for-the-badge&logo=shield)](http://localhost:3000/skills/alex-rivera-passport)
   ```
4. Toggle public passport visibility.

### Step 3: Sandboxed Code Assessment & Proctoring
1. Navigate to `/student/assessments`.
2. Select **React & Modern Component Architecture Assessment**.
3. Review scoring criteria, version, and accept the proctoring disclosure.
4. Click **Begin Proctored Assessment**.
5. Test proctoring: Switch to another browser tab and return; observe the non-disqualifying audit event banner.
6. Open the coding challenge question, write your solution, and click **Run Sandboxed Tests**. Test results run in an isolated sandbox against hidden test cases.
7. Click **Finish & Submit** to trigger server-side grading and credential issuance!

### Step 4: University Credential Issuance Wizard
1. Switch persona to **Dr. Sarah Jenkins (MIT Registrar)**.
2. Navigate to `/university/credentials/issue`.
3. Select a student (e.g., Maya Chen), enter degree details, and submit.
4. The system calculates the salted SHA-256 commitment, submits to the Polygon Amoy registry, logs audit events, and provides the public verification link.

### Step 5: Recruiter AI Job Creation & Candidate Matching
1. Switch persona to **Elena Rostova (Stripe Recruiter)**.
2. Navigate to `/recruiter/jobs/new`.
3. Type a natural-language prompt or select a **Manual Fallback Preset** (Frontend, Backend, Fullstack).
4. Customize required skill weights (`1.0x` - `5.0x`), review the draft, check the **recruiter approval gate**, and publish.
5. Navigate to `/recruiter/candidates`:
   - Filter by evidence tiers (*Proctored Assessment Verified Only*, *Degree Verified*, *Project Evidence*).
   - Click **Alex Rivera** to open the deep-dive profile.
   - Switch target roles to re-calculate match alignment and view the **Skill-Gap Report** with recommended assessment links.
6. Click **Schedule Interview** to open the modal, select date/time, timezone, and meeting link.

### Step 6: AI Interview Report & Human Review Sign-Off
1. Navigate to `/recruiter/reports`.
2. Review the structured competency breakdown, transcript quotes, and unanswered requirements.
3. In the **HR Human Decision** form, select `APPROVE (Recommend Offer)`, add evaluation notes, and save.

---

## 7. Smart Contract Specification: `SkillChainCredentialRegistry.sol`

- **Standard:** Non-transferable / Soulbound Credential Registry
- **Access Control:** OpenZeppelin `AccessControl` (`DEFAULT_ADMIN_ROLE`, `ISSUER_ROLE`)
- **Key Functions:**
  - `registerIssuer(address issuer, string institutionName, string metadataURI)`
  - `removeIssuer(address issuer)`
  - `issueCredential(bytes32 credId, bytes32 commitment, address studentWallet, string credentialTypeURI)`
  - `suspendCredential(bytes32 credId, string reason)`
  - `restoreCredential(bytes32 credId)`
  - `revokeCredential(bytes32 credId, string reason)`
  - `getCredential(bytes32 credId) view returns (...)`
  - `isAuthorizedIssuer(address issuer) view returns (bool)`

---

## 8. Repository Structure

```
skillchain/
├── contracts/
│   └── SkillChainCredentialRegistry.sol       # Polygon Amoy soulbound registry
├── scripts/
│   └── deploy.js                              # Hardhat deployment script
├── test/
│   ├── SkillChainCredentialRegistry.test.js   # Smart contract Hardhat tests (9/9 pass)
│   └── unit/
│       ├── recruiter.test.ts                  # Recruitment module integration tests (12/12 pass)
│       ├── assessments.test.ts                # Assessment engine & sandbox tests (13/13 pass)
│       ├── blockchain.test.ts                 # RPC retry & client tests (5/5 pass)
│       └── services.test.ts                   # Matching, AI, & hasher tests (7/7 pass)
├── prisma/
│   ├── schema.prisma                          # Relational modular monolith (25+ models)
│   ├── seed.js                                # Realistic seed data across all 4 personas
│   └── dev.db                                 # Active SQLite database
├── src/
│   ├── app/                                   # Next.js 15 App Router (58 routes)
│   │   ├── (public)/                          # Landing, features, verify, skills passport
│   │   ├── student/                           # Dashboard, passport, assessments, attempt runner
│   │   ├── university/                        # Issuance wizard, batch CSV, issuer whitelist
│   │   ├── recruiter/                         # AI jobs, candidate search, interviews, reports
│   │   ├── admin/                             # Admin dashboard, reviews queue, audit logs
│   │   └── api/                               # Sandbox runner, submit, proctor, review, AI drafts
│   ├── components/                            # Design system & reusable UI components
│   │   ├── navigation/                        # Navbar, sidebar, DemoSwitcher
│   │   └── ui/                                # Cards, badges, buttons, modals
│   └── lib/                                   # Core services & business logic
│       ├── ai/service.ts                      # AI job drafts & fallback templates
│       ├── assessments/                       # Execution sandbox, scoring, timers, credentials
│       │   ├── execution/                     # Isolated subprocess, Judge0, mock runners
│       │   ├── scoring.ts                     # Objective & coding question scoring
│       │   ├── timer.ts                       # Server-side authoritative timers
│       │   ├── review.ts                      # Human assessor review workflow
│       │   └── credentials.ts                 # Skill credential issuance service
│       ├── auth/session.ts                    # RBAC & persona session switcher
│       ├── blockchain/client.ts               # Viem Polygon Amoy client with retries
│       ├── credentials/hasher.ts              # Salted SHA-256 cryptographic commitments
│       └── matching/engine.ts                 # 5-Tier deterministic candidate match engine
├── PROJECT_STATUS_AND_OVERVIEW.md             # In-depth architectural & progress tracker
├── README.md                                  # Complete product documentation (This file)
├── tailwind.config.ts                         # Custom design system tokens
└── package.json                               # Dependencies and scripts
```

---

## 9. License & Credits

Built with ❤️ by **Team Beast Coders** for the hackathon.  
Licensed under the [MIT License](LICENSE).

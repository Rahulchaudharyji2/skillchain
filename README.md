# SkillChain — Verifiable Skills, Trusted Hiring

**Team:** Beast Coders  
**Platform:** Next.js App Router • Polygon Amoy Testnet • Prisma ORM • Viem • Zod • Tailwind CSS  
**Live Smart Contract (Polygon Amoy):** `0x9A7B31b6B7C37bE75E4De6A4eFa6E93c9E3917F4` (Chain ID: `80002`)

---

## 1. Product Vision & Core Principle

SkillChain bridges universities, students, assessment providers, and employers through a tamper-proof verifiable skill passport.

### Core Principle: Strict Evidence Distinction
SkillChain mathematically distinguishes between:
1. 🏛️ **University-Verified Academic Award**: Signed by authorized institutional registrar key, anchored on Polygon Amoy via privacy-preserving SHA-256 commitments.
2. ⚡ **Assessment-Verified Skill**: Proven through proctored coding assessments evaluated in isolated sandboxes against server-side hidden test cases.
3. 💻 **Project-Supported Skill**: Validated through GitHub repository commits and live deployment artifacts.
4. 📝 **Self-Declared Skill**: Declared by candidate without external proof. Clearly labelled to recruiters.
5. 🤖 **AI Candidate Match Rationale**: Transparent, deterministic matching calculation with skill gap breakdowns.

> **Privacy Rule:** Personal identifiers, student names, grades, and transcripts are never stored on-chain. Only salted cryptographic commitment hashes are anchored on Polygon Amoy.

---

## 2. Instant Hackathon Demo Personas

SkillChain includes a built-in **Demo Persona Switcher** in the top navigation bar. Evaluators can switch between all 4 personas with a single click:

| Role | Persona | Email | Purpose |
|---|---|---|---|
| 🎓 **Student** | Alex Rivera | `alex.rivera@student.mit.edu` | View skill passport, share QR code, copy GitHub README badge, take proctored tests, track applications. |
| 🏛️ **University Issuer** | Dr. Sarah Jenkins | `issuer@mit.edu` | Issue academic degrees on Polygon Amoy, review issuance batches, suspend or revoke credentials. |
| 💼 **Recruiter** | Elena Rostova | `recruiter@stripe.com` | Create jobs from natural-language prompts with AI, review evidence-ranked candidates, schedule interviews, and sign off on AI reports. |
| 🛡️ **Platform Admin** | Marcus Vance | `admin@skillchain.org` | Platform health monitoring, skill ontology management, issuer verification, and immutable audit logs. |

---

## 3. Technology Stack

- **Frontend:** Next.js 15 App Router, TypeScript (strict mode), Tailwind CSS, Lucide icons, Recharts, QR Code generator, Canvas Confetti.
- **Backend & Database:** Next.js Server Components and Route Handlers, Prisma ORM, transactional relational persistence (PostgreSQL / SQLite dev).
- **Blockchain:** Solidity 0.8.20, OpenZeppelin AccessControl, Polygon Amoy Testnet (Chain ID 80002), Hardhat, Viem.
- **AI Service Layer:** Provider-independent layer with Zod schema validation for job generation, skill weights, and interview synthesis.
- **Assessment Engine:** Sandboxed isolated code execution with memory/process limits and undisclosed hidden test cases.
- **Testing:** Hardhat smart contract test suite, Vitest services unit test suite.

---

## 4. Quickstart Guide

### Prerequisites
- Node.js v18+ (tested on v26)
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

### 4. Run Smart Contract Tests
```bash
npm run test:contracts
```
*Executes all 9 unit tests for authorized issuance, duplicate IDs, revocation, suspension, and access control.*

### 5. Run Core Services Unit Tests
```bash
npm run test
```
*Executes Vitest unit tests for the deterministic candidate match engine, cryptographic commitment hasher, and Zod AI schemas.*

### 6. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. End-to-End Demo Walkthrough Guide

### Step 1: Public Verification Demo
1. Visit [http://localhost:3000](http://localhost:3000).
2. Click **Open Public Verification Page** on the hero card.
3. Observe the live cryptographic check:
   - Status: `ACTIVE & CONFIRMED`
   - Issuer: Massachusetts Institute of Technology Registrar
   - SHA-256 Commitment: `0x8fae19b4...8293`
   - Polygon Amoy Transaction: `0x82a94719...4619` with direct PolygonScan link.

### Step 2: Student Skill Passport & Sharing
1. Switch persona to **Student (Alex Rivera)** in the top navigation.
2. Visit **Skill Passport & QR** (`/student/passport`).
3. Scan the interactive QR code with a phone or click **Live Preview**.
4. Test the **Copy GitHub README Badge** button:
   ```markdown
   [![SkillChain Verified](https://img.shields.io/badge/SkillChain-Verified_Passport-16382C?style=for-the-badge&logo=shield)](http://localhost:3000/skills/alex-rivera-passport)
   ```
5. Toggle the **Public Passport Visibility** switch.

### Step 3: Sandboxed Code Assessment & Proctoring
1. Navigate to `/student/assessments`.
2. Select **React & Modern Component Architecture Assessment**.
3. Accept the technical integrity disclosure and click **Begin Proctored Assessment**.
4. Test the proctoring monitor: Switch to another browser tab and return; observe the audit event banner: `Proctoring Flag: TAB SWITCH recorded`.
5. Solve question 3 (Coding Challenge) and click **Run Sandboxed Tests**. Test results run against hidden test cases in an isolated VM and report pass/fail outputs.
6. Click **Finish & Submit** to trigger server-side grading and confetti celebration!

### Step 4: University Credential Issuance Wizard
1. Switch persona to **Dr. Sarah Jenkins (MIT Registrar)**.
2. Navigate to `/university/credentials/issue`.
3. Select a graduating student (e.g. Maya Chen), enter degree details, and click **Issue Credential & Commit On-Chain**.
4. The system calculates the salted SHA-256 commitment, submits to the Polygon Amoy registry, records transaction audit events, and displays the direct verification link.

### Step 5: Recruiter AI Job Creation & Candidate Matching
1. Switch persona to **Elena Rostova (Stripe Recruiter)**.
2. Navigate to `/recruiter/jobs/new`.
3. Click **Generate Job Draft** to synthesize a job posting from the prompt.
4. Review the editable draft, tweak required skills, and click **Approve & Publish Job Posting**.
5. Navigate to `/recruiter/candidates/cmvcfbro00033rqs2owumjoe5` (Alex Rivera):
   - Observe the **94.5% Deterministic Match Score**.
   - Review the evidence breakdown (assessment score: 95%, university degree: verified, projects: attached).
6. Click **Shortlist Candidate** and **Schedule Interview**.

### Step 6: AI Interview Report & Human Review
1. Navigate to `/recruiter/reports`.
2. Inspect the synthesized interview report for Alex Rivera.
3. Review competencies, quoted evidence, and limitations.
4. Test the **HR Human Decision** form: Select `APPROVE (Recommend Offer)`, add notes, and save.

---

## 6. Smart Contract Specification: `SkillChainCredentialRegistry.sol`

- **Role-Based Access Control:** `DEFAULT_ADMIN_ROLE` and `ISSUER_ROLE`.
- **Functions:**
  - `registerIssuer(address issuer, string institutionName, string metadataURI)`
  - `removeIssuer(address issuer)`
  - `issueCredential(bytes32 credId, bytes32 commitment, address studentWallet, string credentialTypeURI)`
  - `suspendCredential(bytes32 credId, string reason)`
  - `restoreCredential(bytes32 credId)`
  - `revokeCredential(bytes32 credId, string reason)`
  - `getCredential(bytes32 credId) view returns (...)`
  - `isAuthorizedIssuer(address issuer) view returns (bool)`

---

## 7. License & Credits

Built by **Team Beast Coders** for the hackathon.  
Licensed under the [MIT License](LICENSE).

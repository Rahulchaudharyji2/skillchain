const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function generateCommitment(payload, salt = "SKILLCHAIN_DEMO_SALT_2026") {
  return "0x" + crypto.createHash("sha256").update(JSON.stringify(payload) + salt).digest("hex");
}

function generateHexId(prefix) {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

async function main() {
  console.log("🌱 Starting SkillChain database seeding...");

  // 1. Clean existing demo data if any
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.interviewEvidence.deleteMany({});
  await prisma.interviewFeedback.deleteMany({});
  await prisma.interviewReport.deleteMany({});
  await prisma.interviewTranscript.deleteMany({});
  await prisma.interviewConsent.deleteMany({});
  await prisma.interviewParticipant.deleteMany({});
  await prisma.interview.deleteMany({});
  await prisma.candidateMatchExplanation.deleteMany({});
  await prisma.applicationStageEvent.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.savedJob.deleteMany({});
  await prisma.candidateShortlist.deleteMany({});
  await prisma.jobSkillRequirement.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.proctoringEvent.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.testCase.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.assessmentResult.deleteMany({});
  await prisma.assessmentAttempt.deleteMany({});
  await prisma.assessmentSkill.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.skillEvidence.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.studentSkill.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.skillCategory.deleteMany({});
  await prisma.verificationEvent.deleteMany({});
  await prisma.credentialShare.deleteMany({});
  await prisma.credentialStatusEvent.deleteMany({});
  await prisma.credential.deleteMany({});
  await prisma.issuer.deleteMany({});
  await prisma.universityProfile.deleteMany({});
  await prisma.employerProfile.deleteMany({});
  await prisma.organizationMember.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Users
  console.log("Creating core users...");

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@skillchain.org",
      name: "Marcus Vance",
      role: "ADMIN",
      walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  // University Issuer (MIT Dean of Academic Records)
  const uniAdminUser = await prisma.user.create({
    data: {
      email: "issuer@mit.edu",
      name: "Dr. Sarah Jenkins",
      role: "ISSUER",
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Recruiter (Stripe Talent Lead)
  const recruiterUser = await prisma.user.create({
    data: {
      email: "recruiter@stripe.com",
      name: "Elena Rostova",
      role: "RECRUITER",
      walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Student 1: Alex Rivera (High performer with verified degree & skills)
  const alexUser = await prisma.user.create({
    data: {
      email: "alex.rivera@student.mit.edu",
      name: "Alex Rivera",
      role: "STUDENT",
      walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Student 2: Maya Chen (Strong backend & Python developer)
  const mayaUser = await prisma.user.create({
    data: {
      email: "maya.chen@berkeley.edu",
      name: "Maya Chen",
      role: "STUDENT",
      walletAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Student 3: Jordan Taylor (Self-taught frontend developer, demonstrating self-declared distinction)
  const jordanUser = await prisma.user.create({
    data: {
      email: "jordan.taylor@dev.io",
      name: "Jordan Taylor",
      role: "STUDENT",
      walletAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 3. Create Organizations
  console.log("Creating organizations...");

  // University Org
  const mitOrg = await prisma.organization.create({
    data: {
      name: "Massachusetts Institute of Technology",
      slug: "mit",
      type: "UNIVERSITY",
      verified: true,
      website: "https://mit.edu",
      logoUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=120&auto=format&fit=crop&q=80",
      universityProfile: {
        create: {
          domain: "mit.edu",
          accreditationDetails: "NECHE Accredited Academic Institution",
          country: "United States",
          issuerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          verifiedAt: new Date("2024-01-15"),
        },
      },
      members: {
        create: [
          {
            userId: uniAdminUser.id,
            role: "ADMIN",
          },
        ],
      },
    },
  });

  // Authorized Issuer
  const mitIssuer = await prisma.issuer.create({
    data: {
      organizationId: mitOrg.id,
      userId: uniAdminUser.id,
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      department: "School of Engineering - Office of the Registrar",
      isAuthorized: true,
      registeredTx: "0x4b7891c3de145879a952d7681fcae1273891461fbfb14e073c1d92634d0b1351",
    },
  });

  // Employer Org
  const stripeOrg = await prisma.organization.create({
    data: {
      name: "Stripe",
      slug: "stripe",
      type: "EMPLOYER",
      verified: true,
      website: "https://stripe.com",
      logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80",
      employerProfile: {
        create: {
          industry: "Financial Technology & Infrastructure",
          companySize: "1000+",
          description: "Global financial infrastructure platform powering internet commerce.",
          headquarters: "San Francisco, CA & Dublin, Ireland",
        },
      },
      billingConfiguration: {
        create: {
          planTier: "ENTERPRISE",
          maxJobPostings: 50,
          verifiedBadgeEnabled: true,
        },
      },
      members: {
        create: [
          {
            userId: recruiterUser.id,
            role: "RECRUITER",
          },
        ],
      },
    },
  });

  // 4. Create Student Profiles
  console.log("Creating student profiles...");

  const alexProfile = await prisma.studentProfile.create({
    data: {
      userId: alexUser.id,
      headline: "Full-Stack Engineer & Smart Contract Researcher",
      bio: "Computer Science graduate with deep interest in verifiable computing, decentralized identity, and high-performance React applications. Winner of 2 national hackathons.",
      universityName: "Massachusetts Institute of Technology",
      degree: "Bachelor of Science in Computer Science",
      graduationYear: 2025,
      gpa: 3.92,
      githubUrl: "https://github.com/alexrivera-demo",
      linkedinUrl: "https://linkedin.com/in/alexrivera-demo",
      portfolioUrl: "https://alexrivera.dev",
      publicPassportSlug: "alex-rivera-passport",
      isPassportPublic: true,
      allowRecruiterContact: true,
    },
  });

  const mayaProfile = await prisma.studentProfile.create({
    data: {
      userId: mayaUser.id,
      headline: "Distributed Systems & Cloud Infrastructure Engineer",
      bio: "Passionate about building scalable backend microservices, high-throughput data pipelines in Python and Go, and optimizing PostgreSQL indexing.",
      universityName: "UC Berkeley",
      degree: "B.S. in Electrical Engineering & Computer Sciences",
      graduationYear: 2024,
      gpa: 3.85,
      githubUrl: "https://github.com/mayachen-demo",
      linkedinUrl: "https://linkedin.com/in/mayachen-demo",
      portfolioUrl: "https://mayachen.cloud",
      publicPassportSlug: "maya-chen-passport",
      isPassportPublic: true,
      allowRecruiterContact: true,
    },
  });

  const jordanProfile = await prisma.studentProfile.create({
    data: {
      userId: jordanUser.id,
      headline: "Frontend Web Developer & UI Designer",
      bio: "Self-taught developer with 2 years of freelancing experience building client websites. Passionate about CSS animations, modern UI frameworks, and accessibility.",
      universityName: null,
      degree: null,
      graduationYear: null,
      gpa: null,
      githubUrl: "https://github.com/jordantaylor-dev",
      linkedinUrl: "https://linkedin.com/in/jordantaylor-dev",
      portfolioUrl: "https://jordantaylor.design",
      publicPassportSlug: "jordan-taylor-passport",
      isPassportPublic: true,
      allowRecruiterContact: true,
    },
  });

  // 5. Create Skill Categories & Skills
  console.log("Creating skill ontology...");

  const catFrontend = await prisma.skillCategory.create({
    data: {
      name: "Frontend Engineering",
      slug: "frontend",
      icon: "Layout",
      description: "Modern web user interface development, state management, and web standards.",
    },
  });

  const catBackend = await prisma.skillCategory.create({
    data: {
      name: "Backend & Systems",
      slug: "backend",
      icon: "Server",
      description: "Server-side architectures, APIs, databases, and distributed runtime environments.",
    },
  });

  const catCore = await prisma.skillCategory.create({
    data: {
      name: "Core Computer Science",
      slug: "core-cs",
      icon: "Binary",
      description: "Data structures, algorithms, complexity analysis, and mathematical logic.",
    },
  });

  const catDevops = await prisma.skillCategory.create({
    data: {
      name: "Cloud & DevOps",
      slug: "devops",
      icon: "Cloud",
      description: "Containerization, CI/CD pipelines, cloud platforms, and infrastructure.",
    },
  });

  // Skills
  const skillJS = await prisma.skill.create({
    data: { name: "JavaScript", slug: "javascript", categoryId: catFrontend.id, description: "ES6+, async programming, closures, event loop, and functional patterns." },
  });
  const skillReact = await prisma.skill.create({
    data: { name: "React", slug: "react", categoryId: catFrontend.id, description: "Component architecture, hooks, suspense, and virtual DOM optimization." },
  });
  const skillTS = await prisma.skill.create({
    data: { name: "TypeScript", slug: "typescript", categoryId: catFrontend.id, description: "Static typing, generics, utility types, and compiler configuration." },
  });
  const skillNext = await prisma.skill.create({
    data: { name: "Next.js", slug: "nextjs", categoryId: catFrontend.id, description: "App router, server components, streaming SSR, and edge deployment." },
  });
  const skillDSA = await prisma.skill.create({
    data: { name: "Data Structures & Algorithms", slug: "dsa", categoryId: catCore.id, description: "Trees, graphs, dynamic programming, sorting, and asymptotic complexity." },
  });
  const skillNode = await prisma.skill.create({
    data: { name: "Node.js", slug: "nodejs", categoryId: catBackend.id, description: "Event loop, streams, async I/O, and HTTP microservice architecture." },
  });
  const skillPython = await prisma.skill.create({
    data: { name: "Python", slug: "python", categoryId: catBackend.id, description: "Object-oriented, generators, typing, FastAPI, and data manipulation." },
  });
  const skillSQL = await prisma.skill.create({
    data: { name: "PostgreSQL & SQL", slug: "sql", categoryId: catBackend.id, description: "Schema normalization, indexing strategies, transactions, and query plans." },
  });
  const skillDocker = await prisma.skill.create({
    data: { name: "Docker", slug: "docker", categoryId: catDevops.id, description: "Multi-stage builds, container isolation, networking, and compose orchestration." },
  });

  // 6. University Issued Credentials (On-chain verified degrees)
  console.log("Issuing academic verifiable credentials on Polygon Amoy...");

  const degreePayload = {
    issuer: "Massachusetts Institute of Technology",
    recipient: "Alex Rivera",
    recipientWallet: alexUser.walletAddress,
    degree: "Bachelor of Science in Computer Science",
    graduationDate: "2025-06-05",
    honors: "Summa Cum Laude (GPA 3.92)",
    standard: "W3C-VerifiableCredentials-v2.0",
  };

  const cred1Commitment = generateCommitment(degreePayload, "MIT_SALT_918237");
  const cred1Id = "0x8fae19b489a24dcbe89123849182a47291847192849182938491829384918293";

  const alexDegreeCred = await prisma.credential.create({
    data: {
      credId: cred1Id,
      studentProfileId: alexProfile.id,
      issuerId: mitIssuer.id,
      organizationId: mitOrg.id,
      title: "Bachelor of Science in Computer Science",
      credentialType: "DEGREE",
      degreeName: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      grade: "3.92 GPA",
      issuanceDate: new Date("2025-06-05"),
      commitment: cred1Commitment,
      signature: "0x39a8f273615481729bcae8192837461928374619283746192837461928374619283746192837461928374619283746192837461928374619283746192837461b",
      txHash: "0x82a9471928374619283746192837461928374619283746192837461928374619",
      blockNumber: 12948192,
      status: "ACTIVE",
      metadataUri: "https://skillchain.org/credentials/mit-cs-alex-rivera.json",
      statusEvents: {
        create: [
          {
            previousStatus: "PENDING",
            newStatus: "ACTIVE",
            actorId: uniAdminUser.id,
            reason: "Initial graduation conferral and Polygon Amoy on-chain commitment confirmation",
            txHash: "0x82a9471928374619283746192837461928374619283746192837461928374619",
          },
        ],
      },
    },
  });

  // Offered Degree waiting for student MetaMask claim & soulbound locking
  const credOfferedCommitment = generateCommitment(
    { student: "Alex Rivera", degree: "Master of Science in Distributed Systems", gpa: "3.98" },
    "MIT_SALT_MASTER_847291"
  );
  const credOfferedId = "0x91ae284759283746192847192847192847192847192847192847192847192847";

  await prisma.credential.create({
    data: {
      credId: credOfferedId,
      studentProfileId: alexProfile.id,
      issuerId: mitIssuer.id,
      organizationId: mitOrg.id,
      title: "Master of Science in Distributed Systems & Web3",
      credentialType: "DEGREE",
      degreeName: "Master of Science",
      fieldOfStudy: "Distributed Systems & Applied Cryptography",
      grade: "Summa Cum Laude (GPA 3.98)",
      issuanceDate: new Date("2026-05-20"),
      commitment: credOfferedCommitment,
      signature: "0x48b9f123615481729bcae819283746192837461928374619283746192837461928374619283746192837461928374619283746192837461c",
      txHash: null,
      status: "OFFERED",
      metadataUri: "https://skillchain.org/credentials/mit-ms-alex-rivera.json",
      statusEvents: {
        create: [
          {
            previousStatus: "PENDING",
            newStatus: "OFFERED",
            actorId: uniAdminUser.id,
            reason: "Master of Science degree conferred by MIT. Awaiting student acceptance via MetaMask to soulbound-lock.",
          },
        ],
      },
    },
  });

  // 7. Student Projects
  console.log("Creating student projects...");

  const alexProject1 = await prisma.project.create({
    data: {
      studentProfileId: alexProfile.id,
      title: "VeriAuth - Decentralized Identity Hub",
      description: "A zero-knowledge proof authentication framework allowing users to prove age and accreditation without disclosing personal details.",
      repoUrl: "https://github.com/alexrivera-demo/veriauth",
      liveUrl: "https://veriauth-demo.org",
      techStack: "React, TypeScript, Next.js, Solidity, Viem",
      highlights: "Handles 10,000+ verification requests in stress tests. Winner of HackMIT 2024.",
    },
  });

  const mayaProject1 = await prisma.project.create({
    data: {
      studentProfileId: mayaProfile.id,
      title: "StreamPipe - High Throughput Event Broker",
      description: "Distributed log streaming system written in Python & Rust with custom consensus algorithm and WAL disk persistence.",
      repoUrl: "https://github.com/mayachen-demo/streampipe",
      liveUrl: "https://streampipe.cloud",
      techStack: "Python, Docker, PostgreSQL, Redis",
      highlights: "Sub-millisecond latency on standard commodity hardware nodes.",
    },
  });

  const jordanProject1 = await prisma.project.create({
    data: {
      studentProfileId: jordanProfile.id,
      title: "PaletteCraft - Color System Generator",
      description: "Modern CSS design tool for generating accessible WCAG AAA color systems with live preview components.",
      repoUrl: "https://github.com/jordantaylor-dev/palettecraft",
      liveUrl: "https://palettecraft.dev",
      techStack: "React, Tailwind CSS, JavaScript",
      highlights: "1,200 GitHub stars and 5,000 monthly active web designers.",
    },
  });

  // 8. Assessments & Questions
  console.log("Creating skill assessments and coding questions...");

  // React Assessment (Versioned)
  const reactAssessment = await prisma.assessment.create({
    data: {
      title: "React & Modern Component Architecture",
      slug: "react-assessment",
      categoryId: catFrontend.id,
      domain: "Frontend Web Development",
      difficulty: "INTERMEDIATE",
      durationMinutes: 45,
      passingThreshold: 75.0,
      version: 1,
      maxAttempts: 3,
      cooldownHours: 24,
      instructions: "This assessment evaluates your practical understanding of React 19 / 18, hook lifecycle, state management, render optimization, and asynchronous UI handling. The assessment includes single-choice checks, multi-select criteria, short answer, and a sandboxed live coding challenge with hidden test cases.",
      skills: {
        create: [
          { skillId: skillReact.id, weight: 1.0 },
          { skillId: skillTS.id, weight: 0.5 },
        ],
      },
      questions: {
        create: [
          {
            type: "MULTIPLE_CHOICE",
            questionText: "Which React hook should be used to memoize an expensive calculation between re-renders when inputs remain unchanged?",
            optionsJson: JSON.stringify([
              "useCallback",
              "useMemo",
              "useRef",
              "useEffect"
            ]),
            correctAnswersJson: JSON.stringify(["useMemo"]),
            points: 15,
            explanation: "useMemo caches the result of an expensive calculation between renders based on dependencies.",
          },
          {
            type: "MULTIPLE_SELECT",
            questionText: "Select all valid React Rules of Hooks that must be strictly observed:",
            optionsJson: JSON.stringify([
              "Only call hooks at the top level of component",
              "Only call hooks from React function components or custom hooks",
              "Hooks can be called inside conditional if-blocks if the condition is constant",
              "Hooks must be called inside event listeners"
            ]),
            correctAnswersJson: JSON.stringify([
              "Only call hooks at the top level of component",
              "Only call hooks from React function components or custom hooks"
            ]),
            points: 15,
            explanation: "Hooks must only be called at top level and only from React functions or custom hooks to preserve hook call order.",
          },
          {
            type: "SHORT_ANSWER",
            questionText: "What React hook returns a mutable ref object whose .current property persists across re-renders without triggering a new render when mutated?",
            correctAnswersJson: JSON.stringify(["useRef", "ref"]),
            points: 15,
            explanation: "useRef stores mutable values that persist across renders without causing re-renders.",
          },
          {
            type: "CODING",
            questionText: "Implement a function `filterActiveSkills(skills, minScore)` that filters a list of candidate skill objects where `status === 'active'` and `score >= minScore`, sorted descending by score.",
            starterCode: `function filterActiveSkills(skills, minScore) {
  // Your solution here
  return skills
    .filter(s => s.status === 'active' && s.score >= minScore)
    .sort((a, b) => b.score - a.score);
}`,
            correctAnswersJson: JSON.stringify(["// reference implementation"]),
            language: "javascript",
            points: 55,
            explanation: "Requires array filtering and numeric descending sort.",
            testCases: {
              create: [
                {
                  input: JSON.stringify({
                    skills: [
                      { name: "React", status: "active", score: 85 },
                      { name: "Docker", status: "inactive", score: 95 },
                      { name: "TypeScript", status: "active", score: 92 },
                    ],
                    minScore: 80,
                  }),
                  expectedOutput: JSON.stringify([
                    { name: "TypeScript", status: "active", score: 92 },
                    { name: "React", status: "active", score: 85 },
                  ]),
                  isHidden: false,
                  weight: 1.0,
                },
                {
                  input: JSON.stringify({
                    skills: [
                      { name: "CSS", status: "active", score: 60 },
                      { name: "HTML", status: "active", score: 70 },
                    ],
                    minScore: 75,
                  }),
                  expectedOutput: JSON.stringify([]),
                  isHidden: true,
                  weight: 1.0,
                },
                {
                  input: JSON.stringify({
                    skills: [
                      { name: "GraphQL", status: "active", score: 90 },
                      { name: "Next.js", status: "active", score: 90 },
                    ],
                    minScore: 85,
                  }),
                  expectedOutput: JSON.stringify([
                    { name: "GraphQL", status: "active", score: 90 },
                    { name: "Next.js", status: "active", score: 90 },
                  ]),
                  isHidden: true,
                  weight: 1.0,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // JavaScript ES6+ & Asynchronous Architecture Assessment (Versioned)
  const jsAssessment = await prisma.assessment.create({
    data: {
      title: "JavaScript ES6+ & Asynchronous Architecture",
      slug: "javascript-assessment",
      categoryId: catFrontend.id,
      domain: "Core Software Engineering",
      difficulty: "INTERMEDIATE",
      durationMinutes: 40,
      passingThreshold: 75.0,
      version: 1,
      maxAttempts: 3,
      cooldownHours: 24,
      instructions: "Evaluates core JavaScript engineering: closures, promises, microtask queue execution, immutability, and asynchronous data transformation. Features objective questions and a sandboxed coding problem evaluated against hidden test cases.",
      skills: {
        create: [
          { skillId: skillJS.id, weight: 1.0 },
        ],
      },
      questions: {
        create: [
          {
            type: "MULTIPLE_CHOICE",
            questionText: "In the JavaScript Event Loop, which queue takes priority for execution immediately after the current synchronous execution stack is empty?",
            optionsJson: JSON.stringify([
              "Macrotask Queue (setTimeout, setInterval)",
              "Microtask Queue (Promise.then, queueMicrotask)",
              "I/O Poll Queue",
              "Idle/Check Phase"
            ]),
            correctAnswersJson: JSON.stringify(["Microtask Queue (Promise.then, queueMicrotask)"]),
            points: 15,
            explanation: "All microtasks in the microtask queue are drained before the next macrotask is dequeued.",
          },
          {
            type: "MULTIPLE_SELECT",
            questionText: "Select all JavaScript Array methods that mutate the original array in-place:",
            optionsJson: JSON.stringify([
              "splice()",
              "sort()",
              "slice()",
              "concat()",
              "push()"
            ]),
            correctAnswersJson: JSON.stringify(["splice()", "sort()", "push()"]),
            points: 15,
            explanation: "splice, sort, and push mutate the array in-place, whereas slice and concat return shallow copies.",
          },
          {
            type: "SHORT_ANSWER",
            questionText: "Which ES6 syntax operator (...) is used to expand iterables like arrays into individual elements or function arguments?",
            correctAnswersJson: JSON.stringify(["spread", "spread operator", "..."]),
            points: 15,
            explanation: "The spread operator (...) expands an iterable into elements.",
          },
          {
            type: "CODING",
            questionText: "Implement a function `aggregateSkillMetrics(attempts)` that takes an array of attempt objects `{ skill: string, score: number, passed: boolean }` and returns an object `{ totalAttempts: number, averageScore: number, passedCount: number, passRate: number }`, where averageScore and passRate (0 to 100 percentage) are rounded to 1 decimal place. Return 0 for averages if attempts is empty.",
            starterCode: `function aggregateSkillMetrics(attempts) {
  if (!attempts || attempts.length === 0) {
    return { totalAttempts: 0, averageScore: 0, passedCount: 0, passRate: 0 };
  }
  const total = attempts.length;
  const passed = attempts.filter(a => a.passed).length;
  const sumScore = attempts.reduce((acc, a) => acc + a.score, 0);
  return {
    totalAttempts: total,
    averageScore: Math.round((sumScore / total) * 10) / 10,
    passedCount: passed,
    passRate: Math.round((passed / total) * 1000) / 10
  };
}`,
            correctAnswersJson: JSON.stringify(["// reference implementation"]),
            language: "javascript",
            points: 55,
            explanation: "Requires array aggregation, rounding to 1 decimal place, and empty array handling.",
            testCases: {
              create: [
                {
                  input: JSON.stringify({
                    attempts: [
                      { skill: "JavaScript", score: 80, passed: true },
                      { skill: "JavaScript", score: 90, passed: true },
                      { skill: "JavaScript", score: 40, passed: false },
                    ],
                  }),
                  expectedOutput: JSON.stringify({
                    totalAttempts: 3,
                    averageScore: 70,
                    passedCount: 2,
                    passRate: 66.7,
                  }),
                  isHidden: false,
                  weight: 1.0,
                },
                {
                  input: JSON.stringify({ attempts: [] }),
                  expectedOutput: JSON.stringify({
                    totalAttempts: 0,
                    averageScore: 0,
                    passedCount: 0,
                    passRate: 0,
                  }),
                  isHidden: true,
                  weight: 1.0,
                },
                {
                  input: JSON.stringify({
                    attempts: [
                      { skill: "React", score: 95, passed: true },
                      { skill: "React", score: 85, passed: true },
                    ],
                  }),
                  expectedOutput: JSON.stringify({
                    totalAttempts: 2,
                    averageScore: 90,
                    passedCount: 2,
                    passRate: 100,
                  }),
                  isHidden: true,
                  weight: 1.0,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // TypeScript Assessment
  const tsAssessment = await prisma.assessment.create({
    data: {
      title: "TypeScript Advanced Type Systems",
      slug: "typescript-assessment",
      categoryId: catFrontend.id,
      domain: "Type Systems & Safe Engineering",
      difficulty: "ADVANCED",
      durationMinutes: 40,
      passingThreshold: 75.0,
      version: 1,
      instructions: "Tests advanced TypeScript patterns including conditional types, mapped types, template literal types, and narrowing techniques.",
      skills: {
        create: [
          { skillId: skillTS.id, weight: 1.0 },
        ],
      },
      questions: {
        create: [
          {
            type: "MULTIPLE_CHOICE",
            questionText: "Which utility type constructs a type with all properties of Type set to optional?",
            optionsJson: JSON.stringify(["Required<T>", "Partial<T>", "Readonly<T>", "Record<K, T>"]),
            correctAnswersJson: JSON.stringify(["Partial<T>"]),
            points: 20,
            explanation: "Partial<T> makes all properties in T optional.",
          },
        ],
      },
    },
  });

  // Python & Data Systems Assessment
  const pythonAssessment = await prisma.assessment.create({
    data: {
      title: "Python Systems & Concurrency",
      slug: "python-assessment",
      categoryId: catBackend.id,
      domain: "Backend Systems",
      difficulty: "INTERMEDIATE",
      durationMinutes: 45,
      passingThreshold: 75.0,
      version: 1,
      instructions: "Evaluates async I/O, generator performance, GIL trade-offs, and data structure manipulation in Python 3.12.",
      skills: {
        create: [
          { skillId: skillPython.id, weight: 1.0 },
          { skillId: skillSQL.id, weight: 0.5 },
        ],
      },
      questions: {
        create: [
          {
            type: "MULTIPLE_CHOICE",
            questionText: "In Python, which keyword turns a regular function into an asynchronous coroutine generator when using yield?",
            optionsJson: JSON.stringify(["async def", "yield from", "await generator", "def async_gen"]),
            correctAnswersJson: JSON.stringify(["async def"]),
            points: 25,
            explanation: "An async def function containing a yield statement defines an asynchronous generator.",
          },
        ],
      },
    },
  });

  // 9. Assessment Attempts & Results
  console.log("Creating verified assessment attempts & results...");

  // Alex completed React assessment with 95% score
  const alexReactAttempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: reactAssessment.id,
      studentProfileId: alexProfile.id,
      status: "GRADED",
      score: 95.0,
      passed: true,
      startedAt: new Date("2025-08-10T14:00:00Z"),
      submittedAt: new Date("2025-08-10T14:38:00Z"),
      completedAt: new Date("2025-08-10T14:38:05Z"),
      version: 1,
      proctoringEvents: {
        create: [
          {
            eventType: "FOCUS_LOST",
            metadata: JSON.stringify({ reason: "System notification pop-up", durationMs: 400 }),
            timestamp: new Date("2025-08-10T14:15:10Z"),
          },
        ],
      },
      assessmentResult: {
        create: {
          totalScore: 66.5,
          maxScore: 70.0,
          percentageScore: 95.0,
          verifiedSkillIssued: true,
          feedback: "Outstanding proficiency in React component architecture and state caching.",
        },
      },
    },
  });

  // Alex completed TypeScript assessment with 92% score
  const alexTSAttempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: tsAssessment.id,
      studentProfileId: alexProfile.id,
      status: "GRADED",
      score: 92.0,
      passed: true,
      startedAt: new Date("2025-08-12T10:00:00Z"),
      submittedAt: new Date("2025-08-12T10:32:00Z"),
      completedAt: new Date("2025-08-12T10:32:05Z"),
      version: 1,
      assessmentResult: {
        create: {
          totalScore: 18.4,
          maxScore: 20.0,
          percentageScore: 92.0,
          verifiedSkillIssued: true,
          feedback: "Strong mastery of generic constraints and conditional types.",
        },
      },
    },
  });

  // Maya completed Python assessment with 96% score
  const mayaPythonAttempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: pythonAssessment.id,
      studentProfileId: mayaProfile.id,
      status: "GRADED",
      score: 96.0,
      passed: true,
      startedAt: new Date("2025-07-20T11:00:00Z"),
      submittedAt: new Date("2025-07-20T11:35:00Z"),
      completedAt: new Date("2025-07-20T11:35:04Z"),
      version: 1,
      assessmentResult: {
        create: {
          totalScore: 24.0,
          maxScore: 25.0,
          percentageScore: 96.0,
          verifiedSkillIssued: true,
          feedback: "Exceptional knowledge of asynchronous runtimes and memory management.",
        },
      },
    },
  });

  // 10. Student Skills with Strict Evidence Type Distinction
  console.log("Attaching evidence-typed skills to student profiles...");

  // Alex Rivera's Skills:
  // - React: Assessment-Verified (95%) & Project Evidence
  // - TypeScript: Assessment-Verified (92%) & Project Evidence
  // - Data Structures: Degree-Verified (MIT CS 3.92 GPA)
  // - Docker: Self-Declared
  const alexSkillReact = await prisma.studentSkill.create({
    data: {
      studentProfileId: alexProfile.id,
      skillId: skillReact.id,
      proficiencyLevel: "ADVANCED",
      verifiedByAssessment: true,
      verifiedByDegree: false,
      isSelfDeclared: false,
      evidences: {
        create: [
          {
            evidenceType: "ASSESSMENT",
            title: "React & Component Architecture Assessment",
            description: "Scored 95.0% in proctored multi-tier coding and architecture assessment.",
            score: 95.0,
            proofUrl: "/student/attempts/" + alexReactAttempt.id,
          },
          {
            evidenceType: "PROJECT",
            title: "Production Project: VeriAuth Hub",
            description: "Built high-performance React UI components with responsive state transitions.",
            proofUrl: "https://github.com/alexrivera-demo/veriauth",
            projectId: alexProject1.id,
          },
        ],
      },
    },
  });

  const alexSkillTS = await prisma.studentSkill.create({
    data: {
      studentProfileId: alexProfile.id,
      skillId: skillTS.id,
      proficiencyLevel: "ADVANCED",
      verifiedByAssessment: true,
      verifiedByDegree: false,
      isSelfDeclared: false,
      evidences: {
        create: [
          {
            evidenceType: "ASSESSMENT",
            title: "TypeScript Advanced Type Systems",
            description: "Scored 92.0% in proctored type verification test.",
            score: 92.0,
            proofUrl: "/student/attempts/" + alexTSAttempt.id,
          },
        ],
      },
    },
  });

  const alexSkillDSA = await prisma.studentSkill.create({
    data: {
      studentProfileId: alexProfile.id,
      skillId: skillDSA.id,
      proficiencyLevel: "EXPERT",
      verifiedByAssessment: false,
      verifiedByDegree: true,
      isSelfDeclared: false,
      evidences: {
        create: [
          {
            evidenceType: "UNIVERSITY_DEGREE",
            title: "MIT BS Computer Science Curriculum",
            description: "Completed Advanced Algorithms (6.046J) and Design & Analysis of Algorithms with Grade A.",
            credentialId: alexDegreeCred.id,
          },
        ],
      },
    },
  });

  const alexSkillDocker = await prisma.studentSkill.create({
    data: {
      studentProfileId: alexProfile.id,
      skillId: skillDocker.id,
      proficiencyLevel: "INTERMEDIATE",
      verifiedByAssessment: false,
      verifiedByDegree: false,
      isSelfDeclared: true,
      evidences: {
        create: [
          {
            evidenceType: "SELF_DECLARED",
            title: "Self-Reported Experience",
            description: "Used Docker and docker-compose for local testing environments.",
          },
        ],
      },
    },
  });

  // Jordan Taylor's Skills:
  // - React: Self-declared only with project evidence (no university degree, no assessment yet)
  const jordanSkillReact = await prisma.studentSkill.create({
    data: {
      studentProfileId: jordanProfile.id,
      skillId: skillReact.id,
      proficiencyLevel: "INTERMEDIATE",
      verifiedByAssessment: false,
      verifiedByDegree: false,
      isSelfDeclared: true,
      evidences: {
        create: [
          {
            evidenceType: "PROJECT",
            title: "PaletteCraft Open-Source Project",
            description: "Created design system generator with 1,200 GitHub stars.",
            projectId: jordanProject1.id,
            proofUrl: "https://github.com/jordantaylor-dev/palettecraft",
          },
          {
            evidenceType: "SELF_DECLARED",
            title: "Self-Reported Frontend Proficiency",
            description: "2 years self-taught experience building React components.",
          },
        ],
      },
    },
  });

  // 11. Recruiter Jobs
  console.log("Creating recruiter job postings with skill requirements...");

  const reactJob = await prisma.job.create({
    data: {
      organizationId: stripeOrg.id,
      createdById: recruiterUser.id,
      title: "Senior Frontend Engineer — Verifiable Identity & Web3",
      slug: "senior-frontend-engineer-stripe",
      overview: "Join Stripe's identity and global credential team building high-performance, accessible, and cryptographically verified checkout experiences. You will design next-generation verifiable credential interfaces.",
      responsibilitiesJson: JSON.stringify([
        "Architect clean, responsive React interfaces with strict TypeScript adherence",
        "Integrate web3 wallets, cryptographic commitments, and zero-knowledge verification hooks",
        "Collaborate with security engineers to ensure tamper-proof verifiable UI rendering",
        "Optimize bundle size, core web vitals, and accessibility (WCAG AAA)",
      ]),
      requiredSkillsJson: JSON.stringify(["React", "TypeScript", "Data Structures & Algorithms"]),
      preferredSkillsJson: JSON.stringify(["Docker", "Next.js", "Node.js"]),
      seniorityLevel: "MID",
      location: "San Francisco, CA / Remote",
      workArrangement: "HYBRID",
      compensationRange: "$145,000 - $185,000 + Equity",
      status: "PUBLISHED",
      aiPromptUsed: "Create a job for a frontend developer with strong React, TypeScript, data structures, and web3/security interest. Require degree or equivalent verified assessment proof.",
      aiGenerated: true,
      requirements: {
        create: [
          { skillId: skillReact.id, requiredLevel: "ADVANCED", weight: 3.0, minScoreThreshold: 80.0, mustBeVerified: true },
          { skillId: skillTS.id, requiredLevel: "ADVANCED", weight: 2.5, minScoreThreshold: 75.0, mustBeVerified: true },
          { skillId: skillDSA.id, requiredLevel: "INTERMEDIATE", weight: 2.0, minScoreThreshold: 70.0, mustBeVerified: false },
        ],
      },
    },
  });

  // 12. Applications & Deterministic Candidate Match Explanations
  console.log("Creating job applications and transparent match explanations...");

  // Alex Rivera applies to the Stripe Frontend Engineer position
  const alexApplication = await prisma.application.create({
    data: {
      jobId: reactJob.id,
      studentProfileId: alexProfile.id,
      currentStage: "INTERVIEW_SCHEDULED",
      appliedAt: new Date("2025-09-01T09:30:00Z"),
      matchScore: 94.5,
      candidateNotes: "Alex exceeds required skill thresholds with verified academic degree from MIT and proctored assessment proofs in both React and TypeScript.",
      matchExplanationJson: JSON.stringify({
        overallMatch: 94.5,
        status: "HIGH_MATCH",
        summary: "Alex holds verified evidence for all 3 mandatory requirements, including top-decile assessment scores in React (95%) and TypeScript (92%), plus university-verified algorithmic foundation.",
      }),
      stageEvents: {
        create: [
          { fromStage: "APPLIED", toStage: "UNDER_REVIEW", actorId: recruiterUser.id, notes: "Automated match engine flagged candidate as 94.5% evidence-verified match." },
          { fromStage: "UNDER_REVIEW", toStage: "SHORTLISTED", actorId: recruiterUser.id, notes: "Recruiter reviewed verified credentials and portfolio." },
          { fromStage: "SHORTLISTED", toStage: "INTERVIEW_SCHEDULED", actorId: recruiterUser.id, notes: "Technical deep-dive interview scheduled." },
        ],
      },
    },
  });

  // Detailed Match Explanation Record
  await prisma.candidateMatchExplanation.create({
    data: {
      applicationId: alexApplication.id,
      deterministicScore: 94.5,
      matchingSkillsJson: JSON.stringify([
        {
          skill: "React",
          evidenceType: "ASSESSMENT",
          score: 95.0,
          weight: 3.0,
          details: "Verified via SkillChain Proctored Assessment #react-assessment",
        },
        {
          skill: "TypeScript",
          evidenceType: "ASSESSMENT",
          score: 92.0,
          weight: 2.5,
          details: "Verified via SkillChain Proctored Assessment #typescript-assessment",
        },
        {
          skill: "Data Structures & Algorithms",
          evidenceType: "UNIVERSITY_DEGREE",
          score: 98.0,
          weight: 2.0,
          details: "Verified via Massachusetts Institute of Technology BS Degree (GPA 3.92)",
        },
      ]),
      missingSkillsJson: JSON.stringify([]),
      selfDeclaredOnlyJson: JSON.stringify([
        { skill: "Docker", level: "INTERMEDIATE", note: "Optional preferred skill with no verified assessment yet" },
      ]),
      evidenceBreakdownJson: JSON.stringify({
        universityVerifiedCount: 1,
        assessmentVerifiedCount: 2,
        projectEvidenceCount: 1,
        selfDeclaredOnlyCount: 1,
      }),
      rationale: "Strongest candidate in pipeline. High alignment on React architecture and rigorous type engineering. All required skills backed by cryptographically verifiable or proctored proof.",
    },
  });

  // Jordan Taylor applies to the same job (demonstrating the difference in evidence ranking)
  const jordanApplication = await prisma.application.create({
    data: {
      jobId: reactJob.id,
      studentProfileId: jordanProfile.id,
      currentStage: "UNDER_REVIEW",
      appliedAt: new Date("2025-09-05T14:20:00Z"),
      matchScore: 52.0,
      candidateNotes: "Candidate has relevant project work, but mandatory skills lack proctored assessment or academic verification.",
      matchExplanationJson: JSON.stringify({
        overallMatch: 52.0,
        status: "PARTIAL_MATCH",
        summary: "Candidate declares React proficiency backed by a GitHub project, but has not completed the required proctored React or TypeScript assessment. Missing evidence for Data Structures.",
      }),
      stageEvents: {
        create: [
          { fromStage: "APPLIED", toStage: "UNDER_REVIEW", actorId: recruiterUser.id, notes: "Awaiting candidate completion of skill assessment." },
        ],
      },
    },
  });

  // 13. Interviews & AI-Generated Validated Report
  console.log("Scheduling interview and generating validated AI report...");

  const alexInterview = await prisma.interview.create({
    data: {
      applicationId: alexApplication.id,
      scheduledAt: new Date(Date.now() + 86400000 * 2), // 2 days from now
      durationMinutes: 45,
      timeZone: "America/New_York",
      status: "COMPLETED",
      meetingUrl: "https://meet.skillchain.org/room/str-alex-91823",
      recordingConsentGiven: true,
      notes: "Technical deep-dive on React state architecture, async data loading, and web3 verification security.",
      participants: {
        create: [
          { userId: recruiterUser.id, role: "INTERVIEWER" },
          { userId: alexUser.id, role: "CANDIDATE" },
        ],
      },
      consents: {
        create: [
          { userId: alexUser.id, consentGiven: true, policyVersion: "v1.0" },
          { userId: recruiterUser.id, consentGiven: true, policyVersion: "v1.0" },
        ],
      },
      transcript: {
        create: {
          rawTranscriptText: `Interviewer: Hello Alex, great to connect today. Can you walk me through how you optimize complex state in React and prevent unnecessary re-renders in high-frequency trading or real-time dashboards?
Alex Rivera: Absolutely. In high-frequency components, I avoid placing volatile state at the top-level tree. I isolate transient state inside leaf components or use localized signal/subscription stores like Zustand or lightweight React Context split into state and dispatch pairs. Furthermore, I leverage useMemo for expensive derived calculations and React 19's compiler directives or useCallback for callback stability.
Interviewer: How do you handle error boundaries and loading fallbacks when fetching credentials from asynchronous APIs or blockchain nodes?
Alex Rivera: I use React Suspense boundaries coupled with custom ErrorBoundary classes or react-error-boundary. For blockchain RPC calls where latency is variable, I implement optimistic UI states with an explicit rollback mechanism and exponential backoff retry policies.
Interviewer: Have you implemented end-to-end unit and integration testing for these components?
Alex Rivera: Yes, I use Vitest and React Testing Library for component testing, ensuring user interactions rather than implementation details are tested, along with Playwright for cross-browser visual regression testing.`,
          turnsJson: JSON.stringify([
            { speaker: "Interviewer", text: "Hello Alex, great to connect today. Can you walk me through how you optimize complex state in React and prevent unnecessary re-renders?" },
            { speaker: "Alex Rivera", text: "In high-frequency components, I avoid placing volatile state at the top-level tree. I isolate transient state inside leaf components or use localized stores... useMemo for expensive derived calculations." },
            { speaker: "Interviewer", text: "How do you handle error boundaries and loading fallbacks when fetching credentials from asynchronous APIs or blockchain nodes?" },
            { speaker: "Alex Rivera", text: "I use React Suspense boundaries coupled with custom ErrorBoundary... optimistic UI with explicit rollback and exponential backoff." },
            { speaker: "Interviewer", text: "Have you implemented end-to-end unit and integration testing?" },
            { speaker: "Alex Rivera", text: "Yes, I use Vitest, React Testing Library, and Playwright for cross-browser testing." },
          ]),
          isSimulated: true,
        },
      },
      report: {
        create: {
          summary: "Candidate demonstrated advanced command of React state architecture, render optimization, and asynchronous error boundaries during the 45-minute technical discussion.",
          competenciesJson: JSON.stringify([
            {
              skill: "React",
              evidence: [
                "Candidate articulated component isolation strategies to avoid top-level re-render thrashing.",
                "Candidate accurately detailed React Suspense boundaries and error boundary recovery.",
                "Candidate explained useMemo and useCallback trade-offs.",
              ],
              assessment: "Evidence Observed",
              limitations: [
                "Live pair programming on algorithmic complexity was not covered in this session.",
              ],
              followUpQuestions: [
                "How would you approach server component streaming in Next.js 15 with partial hydration?",
              ],
            },
            {
              skill: "Asynchronous Systems & Blockchain Interaction",
              evidence: [
                "Candidate detailed optimistic UI updates with deterministic rollback for pending blockchain transactions.",
              ],
              assessment: "Evidence Observed",
              limitations: [],
              followUpQuestions: [
                "What is your strategy for handling RPC node rate limits on public testnets?",
              ],
            },
          ]),
          unansweredRequirementsJson: JSON.stringify([
            "Docker containerization workflow was not discussed due to time constraints.",
          ]),
          limitationsJson: JSON.stringify([
            "Report synthesized from permitted interview transcript text only. No biometric or voice inference performed.",
          ]),
          suggestedFollowUpsJson: JSON.stringify([
            "Review candidate's open-source VeriAuth repository for production code style.",
            "Verify Docker deployment pipeline during the system design round.",
          ]),
          humanReviewRequired: true,
          hrDecision: "APPROVED",
          hrNotes: "Candidate Alex Rivera recommended for final offer review pending team executive round.",
        },
      },
    },
  });

  // 14. Audit Log
  console.log("Recording immutable audit logs...");
  await prisma.auditLog.create({
    data: {
      userId: uniAdminUser.id,
      organizationId: mitOrg.id,
      action: "CREDENTIAL_ISSUED_ONCHAIN",
      entityType: "Credential",
      entityId: alexDegreeCred.id,
      detailsJson: JSON.stringify({
        student: "Alex Rivera",
        degree: "BS Computer Science",
        txHash: alexDegreeCred.txHash,
        commitment: cred1Commitment,
      }),
      ipAddress: "18.18.0.1",
      userAgent: "SkillChain-Institutional-Portal/1.0",
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

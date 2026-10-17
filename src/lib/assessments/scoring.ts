import { executeCandidateCode, TestCaseInput } from "./execution";

export interface QuestionData {
  id: string;
  type: string; // MULTIPLE_CHOICE | MULTIPLE_SELECT | SHORT_ANSWER | CODING
  points: number;
  correctAnswersJson: string;
  language?: string | null;
  starterCode?: string | null;
  testCases?: {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    weight: number;
  }[];
}

export interface QuestionGradingResult {
  questionId: string;
  type: string;
  pointsEarned: number;
  maxPoints: number;
  isCorrect: boolean;
  studentAnswer?: string;
  codeSolution?: string;
  language?: string;
  executionOutput?: string;
  passedTestCases: number;
  totalTestCases: number;
}

export interface AttemptGradingResult {
  totalPointsEarned: number;
  totalPointsPossible: number;
  percentageScore: number;
  passed: boolean;
  questionResults: QuestionGradingResult[];
}

export async function scoreObjectiveQuestion(
  question: QuestionData,
  studentAnswer: string | string[] | undefined
): Promise<QuestionGradingResult> {
  const maxPoints = question.points;
  let pointsEarned = 0;
  let isCorrect = false;

  let correctList: string[] = [];
  try {
    const parsed = JSON.parse(question.correctAnswersJson);
    correctList = Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    correctList = [question.correctAnswersJson];
  }

  if (question.type === "MULTIPLE_CHOICE") {
    const rawAnswer = String(studentAnswer ?? "").trim();
    isCorrect = correctList.some(
      (c) => c.trim().toLowerCase() === rawAnswer.toLowerCase()
    );
    pointsEarned = isCorrect ? maxPoints : 0;
  } else if (question.type === "MULTIPLE_SELECT") {
    // Array of selected option strings
    let studentList: string[] = [];
    if (Array.isArray(studentAnswer)) {
      studentList = studentAnswer;
    } else if (typeof studentAnswer === "string") {
      try {
        const parsed = JSON.parse(studentAnswer);
        studentList = Array.isArray(parsed) ? parsed : [studentAnswer];
      } catch {
        studentList = studentAnswer.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    const normStudent = studentList.map((s) => s.trim().toLowerCase()).sort();
    const normCorrect = correctList.map((c) => c.trim().toLowerCase()).sort();

    isCorrect =
      normStudent.length === normCorrect.length &&
      normStudent.every((val, idx) => val === normCorrect[idx]);

    pointsEarned = isCorrect ? maxPoints : 0;
  } else if (question.type === "SHORT_ANSWER") {
    const rawAnswer = String(studentAnswer ?? "").trim().toLowerCase();
    isCorrect = correctList.some(
      (c) => c.trim().toLowerCase() === rawAnswer
    );
    pointsEarned = isCorrect ? maxPoints : 0;
  }

  return {
    questionId: question.id,
    type: question.type,
    pointsEarned,
    maxPoints,
    isCorrect,
    studentAnswer: typeof studentAnswer === "object" ? JSON.stringify(studentAnswer) : String(studentAnswer ?? ""),
    passedTestCases: isCorrect ? 1 : 0,
    totalTestCases: 1,
  };
}

export async function scoreCodingQuestion(
  question: QuestionData,
  codeSolution: string | undefined
): Promise<QuestionGradingResult> {
  const code = String(codeSolution || question.starterCode || "");
  const maxPoints = question.points;
  const testCases: TestCaseInput[] = (question.testCases || []).map((tc) => ({
    id: tc.id,
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    isHidden: tc.isHidden,
    weight: tc.weight,
  }));

  const execResult = await executeCandidateCode(
    code,
    question.language || "javascript",
    testCases,
    maxPoints
  );

  const passedCount = execResult.testCaseResults.filter((r) => r.passed).length;
  const totalCount = execResult.testCaseResults.length;
  const isCorrect = execResult.passed;

  return {
    questionId: question.id,
    type: "CODING",
    pointsEarned: execResult.score,
    maxPoints,
    isCorrect,
    codeSolution: code,
    language: question.language || "javascript",
    executionOutput: execResult.executionLog,
    passedTestCases: passedCount,
    totalTestCases: totalCount,
  };
}

export async function gradeAssessmentAttempt(
  questions: QuestionData[],
  answers: Record<string, any>,
  passingThreshold: number
): Promise<AttemptGradingResult> {
  const questionResults: QuestionGradingResult[] = [];
  let totalPointsEarned = 0;
  let totalPointsPossible = 0;

  for (const q of questions) {
    totalPointsPossible += q.points;
    const studentAns = answers[q.id];

    let result: QuestionGradingResult;
    if (q.type === "CODING") {
      result = await scoreCodingQuestion(q, studentAns);
    } else {
      result = await scoreObjectiveQuestion(q, studentAns);
    }

    totalPointsEarned += result.pointsEarned;
    questionResults.push(result);
  }

  const percentageScore =
    totalPointsPossible > 0
      ? Math.round((totalPointsEarned / totalPointsPossible) * 1000) / 10
      : 0;

  const passed = percentageScore >= passingThreshold;

  return {
    totalPointsEarned,
    totalPointsPossible,
    percentageScore,
    passed,
    questionResults,
  };
}

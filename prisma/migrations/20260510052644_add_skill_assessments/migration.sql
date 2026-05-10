-- CreateTable
CREATE TABLE "SkillAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobPostId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questions" TEXT NOT NULL DEFAULT '[]',
    "passScore" INTEGER,
    "timeLimit" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SkillAssessment_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '[]',
    "score" INTEGER,
    "passed" BOOLEAN,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "SkillAssessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssessmentAttempt_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SkillAssessment_jobPostId_idx" ON "SkillAssessment"("jobPostId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttempt_applicationId_key" ON "AssessmentAttempt"("applicationId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_assessmentId_idx" ON "AssessmentAttempt"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_applicantId_idx" ON "AssessmentAttempt"("applicantId");

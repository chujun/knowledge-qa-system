-- CreateTable
CREATE TABLE "answer_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "question_version_id" TEXT NOT NULL,
    "answer_version_id" TEXT NOT NULL,
    "scoring_rubric_version_id" TEXT NOT NULL,
    "user_answer" TEXT NOT NULL,
    "ai_score" INTEGER NOT NULL,
    "ai_feedback" TEXT NOT NULL,
    "user_confirmed_score" INTEGER,
    "score_diff_reason" TEXT,
    "final_score" INTEGER NOT NULL,
    "reason_tags_json" TEXT NOT NULL,
    "affects_mastery" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ai_scored',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "answer_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "answer_attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "answer_attempts_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "answer_attempts_answer_version_id_fkey" FOREIGN KEY ("answer_version_id") REFERENCES "answer_versions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "answer_attempts_scoring_rubric_version_id_fkey" FOREIGN KEY ("scoring_rubric_version_id") REFERENCES "scoring_rubric_versions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mastery_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "dimension_scores_json" TEXT NOT NULL,
    "overall_score" REAL NOT NULL,
    "evidence_count" INTEGER NOT NULL DEFAULT 0,
    "weak_dimensions_json" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "mastery_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "error_sets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "knowledge_point_id" TEXT NOT NULL,
    "attempt_ids_json" TEXT NOT NULL,
    "dominant_tags_json" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "error_sets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "answer_attempts_user_id_status_idx" ON "answer_attempts"("user_id", "status");

-- CreateIndex
CREATE INDEX "answer_attempts_question_id_created_at_idx" ON "answer_attempts"("question_id", "created_at");

-- CreateIndex
CREATE INDEX "answer_attempts_affects_mastery_idx" ON "answer_attempts"("affects_mastery");

-- CreateIndex
CREATE UNIQUE INDEX "mastery_profiles_user_id_target_type_target_id_key" ON "mastery_profiles"("user_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "mastery_profiles_user_id_target_type_idx" ON "mastery_profiles"("user_id", "target_type");

-- CreateIndex
CREATE INDEX "mastery_profiles_overall_score_idx" ON "mastery_profiles"("overall_score");

-- CreateIndex
CREATE UNIQUE INDEX "error_sets_user_id_knowledge_point_id_key" ON "error_sets"("user_id", "knowledge_point_id");

-- CreateIndex
CREATE INDEX "error_sets_user_id_status_idx" ON "error_sets"("user_id", "status");

-- CreateIndex
CREATE INDEX "error_sets_knowledge_point_id_status_idx" ON "error_sets"("knowledge_point_id", "status");

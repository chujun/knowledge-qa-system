-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "knowledge_point_id" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "cognitive_dimension" TEXT NOT NULL,
    "difficulty_level" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'pending_confirmation',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "questions_knowledge_point_id_fkey" FOREIGN KEY ("knowledge_point_id") REFERENCES "knowledge_points" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "question_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question_id" TEXT NOT NULL,
    "version_no" INTEGER NOT NULL,
    "stem" TEXT NOT NULL,
    "content_json" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'ai_generated',
    "model_name" TEXT,
    "ai_agent" TEXT,
    "prompt_version" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "question_versions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "answer_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question_id" TEXT NOT NULL,
    "version_no" INTEGER NOT NULL,
    "answer_text" TEXT NOT NULL,
    "explanation_text" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'ai_generated',
    "model_name" TEXT,
    "ai_agent" TEXT,
    "prompt_version" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "answer_versions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scoring_rubric_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question_id" TEXT NOT NULL,
    "version_no" INTEGER NOT NULL,
    "rubric_json" TEXT NOT NULL,
    "source_type" TEXT NOT NULL DEFAULT 'ai_generated',
    "model_name" TEXT,
    "ai_agent" TEXT,
    "prompt_version" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "scoring_rubric_versions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "core_explanations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "knowledge_point_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_confirmation',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "core_explanations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "core_explanations_knowledge_point_id_fkey" FOREIGN KEY ("knowledge_point_id") REFERENCES "knowledge_points" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "core_explanation_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "core_explanation_id" TEXT NOT NULL,
    "version_no" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "explanation_text" TEXT NOT NULL,
    "template_code" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'ai_generated',
    "model_name" TEXT,
    "ai_agent" TEXT,
    "prompt_version" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "core_explanation_versions_core_explanation_id_fkey" FOREIGN KEY ("core_explanation_id") REFERENCES "core_explanations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generation_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "call_type" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "model_version" TEXT,
    "ai_agent" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "latency_ms" INTEGER,
    "cost" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "prompt_hash" TEXT,
    "response_hash" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "generation_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quality_check_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "checker_type" TEXT NOT NULL,
    "model_name" TEXT,
    "ai_agent" TEXT,
    "rule_result_json" TEXT,
    "ai_result_json" TEXT,
    "auto_fix_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "passed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "quality_check_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quality_check_records_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "questions_user_id_status_idx" ON "questions"("user_id", "status");

-- CreateIndex
CREATE INDEX "questions_knowledge_point_id_status_idx" ON "questions"("knowledge_point_id", "status");

-- CreateIndex
CREATE INDEX "questions_knowledge_point_id_cognitive_dimension_idx" ON "questions"("knowledge_point_id", "cognitive_dimension");

-- CreateIndex
CREATE UNIQUE INDEX "question_versions_question_id_version_no_key" ON "question_versions"("question_id", "version_no");

-- CreateIndex
CREATE INDEX "question_versions_question_id_status_idx" ON "question_versions"("question_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "answer_versions_question_id_version_no_key" ON "answer_versions"("question_id", "version_no");

-- CreateIndex
CREATE INDEX "answer_versions_question_id_status_idx" ON "answer_versions"("question_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_rubric_versions_question_id_version_no_key" ON "scoring_rubric_versions"("question_id", "version_no");

-- CreateIndex
CREATE INDEX "scoring_rubric_versions_question_id_status_idx" ON "scoring_rubric_versions"("question_id", "status");

-- CreateIndex
CREATE INDEX "core_explanations_user_id_status_idx" ON "core_explanations"("user_id", "status");

-- CreateIndex
CREATE INDEX "core_explanations_knowledge_point_id_status_idx" ON "core_explanations"("knowledge_point_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "core_explanation_versions_core_explanation_id_version_no_key" ON "core_explanation_versions"("core_explanation_id", "version_no");

-- CreateIndex
CREATE INDEX "core_explanation_versions_core_explanation_id_status_idx" ON "core_explanation_versions"("core_explanation_id", "status");

-- CreateIndex
CREATE INDEX "generation_records_user_id_target_type_target_id_idx" ON "generation_records"("user_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "generation_records_model_name_ai_agent_idx" ON "generation_records"("model_name", "ai_agent");

-- CreateIndex
CREATE INDEX "generation_records_created_at_idx" ON "generation_records"("created_at");

-- CreateIndex
CREATE INDEX "quality_check_records_user_id_status_idx" ON "quality_check_records"("user_id", "status");

-- CreateIndex
CREATE INDEX "quality_check_records_question_id_status_idx" ON "quality_check_records"("question_id", "status");

-- CreateIndex
CREATE INDEX "quality_check_records_target_type_target_id_idx" ON "quality_check_records"("target_type", "target_id");

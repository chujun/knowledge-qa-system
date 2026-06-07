-- CreateTable
CREATE TABLE "practice_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "session_type" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "strategy_json" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "practice_session_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practice_session_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "order_no" INTEGER NOT NULL,
    "selection_reason" TEXT NOT NULL,
    "source_type" TEXT NOT NULL DEFAULT 'confirmed_question',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "practice_session_items_practice_session_id_fkey" FOREIGN KEY ("practice_session_id") REFERENCES "practice_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "practice_session_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "practice_sessions_user_id_status_idx" ON "practice_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "practice_sessions_user_id_target_type_target_id_idx" ON "practice_sessions"("user_id", "target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "practice_session_items_practice_session_id_question_id_key" ON "practice_session_items"("practice_session_id", "question_id");

-- CreateIndex
CREATE INDEX "practice_session_items_practice_session_id_order_no_idx" ON "practice_session_items"("practice_session_id", "order_no");

-- CreateIndex
CREATE INDEX "practice_session_items_question_id_status_idx" ON "practice_session_items"("question_id", "status");

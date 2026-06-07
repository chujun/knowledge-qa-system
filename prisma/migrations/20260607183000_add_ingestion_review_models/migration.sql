-- CreateTable
CREATE TABLE "source_references" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_system" TEXT,
    "source_title" TEXT,
    "source_content" TEXT,
    "source_summary" TEXT,
    "source_url_or_file_id" TEXT,
    "conversation_id" TEXT,
    "source_timestamp" DATETIME,
    "trust_level" TEXT NOT NULL DEFAULT 'medium',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "source_references_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ingestion_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "ingestion_type" TEXT NOT NULL,
    "source_reference_id" TEXT,
    "requested_by" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "idempotency_key" TEXT,
    "result_preview_json" TEXT,
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ingestion_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ingestion_tasks_source_reference_id_fkey" FOREIGN KEY ("source_reference_id") REFERENCES "source_references" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "review_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "ingestion_task_id" TEXT,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "preview_json" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confirmed_at" DATETIME,
    "rejected_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "review_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "review_items_ingestion_task_id_fkey" FOREIGN KEY ("ingestion_task_id") REFERENCES "ingestion_tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "source_references_user_id_source_type_idx" ON "source_references"("user_id", "source_type");

-- CreateIndex
CREATE INDEX "source_references_source_system_conversation_id_idx" ON "source_references"("source_system", "conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingestion_tasks_user_id_idempotency_key_key" ON "ingestion_tasks"("user_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "ingestion_tasks_user_id_status_idx" ON "ingestion_tasks"("user_id", "status");

-- CreateIndex
CREATE INDEX "ingestion_tasks_user_id_ingestion_type_idx" ON "ingestion_tasks"("user_id", "ingestion_type");

-- CreateIndex
CREATE INDEX "review_items_user_id_status_idx" ON "review_items"("user_id", "status");

-- CreateIndex
CREATE INDEX "review_items_ingestion_task_id_idx" ON "review_items"("ingestion_task_id");

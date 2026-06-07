-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "knowledge_domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trust_policy_json" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "knowledge_domains_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "knowledge_topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "outline_json" TEXT,
    "suggested_level" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "knowledge_topics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "knowledge_topics_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "knowledge_domains" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "knowledge_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "explanation_template_json" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "knowledge_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "knowledge_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "complexity_level" TEXT NOT NULL DEFAULT 'medium',
    "suggested_difficulty" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "knowledge_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "knowledge_points_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "knowledge_domains" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "knowledge_points_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "knowledge_topics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "knowledge_points_knowledge_type_id_fkey" FOREIGN KEY ("knowledge_type_id") REFERENCES "knowledge_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_domains_user_id_name_key" ON "knowledge_domains"("user_id", "name");

-- CreateIndex
CREATE INDEX "knowledge_domains_user_id_status_idx" ON "knowledge_domains"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_topics_domain_id_name_key" ON "knowledge_topics"("domain_id", "name");

-- CreateIndex
CREATE INDEX "knowledge_topics_user_id_status_idx" ON "knowledge_topics"("user_id", "status");

-- CreateIndex
CREATE INDEX "knowledge_topics_domain_id_status_idx" ON "knowledge_topics"("domain_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_types_code_key" ON "knowledge_types"("code");

-- CreateIndex
CREATE INDEX "knowledge_types_status_idx" ON "knowledge_types"("status");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_points_topic_id_name_key" ON "knowledge_points"("topic_id", "name");

-- CreateIndex
CREATE INDEX "knowledge_points_user_id_status_idx" ON "knowledge_points"("user_id", "status");

-- CreateIndex
CREATE INDEX "knowledge_points_domain_id_status_idx" ON "knowledge_points"("domain_id", "status");

-- CreateIndex
CREATE INDEX "knowledge_points_topic_id_status_idx" ON "knowledge_points"("topic_id", "status");

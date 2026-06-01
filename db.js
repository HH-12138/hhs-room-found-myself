const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "site.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS module_entries (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS research_topics (
    id TEXT PRIMARY KEY,
    tag TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS research_entries (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS module_images (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_module_entries_module_id
    ON module_entries(module_id);
  CREATE INDEX IF NOT EXISTS idx_research_entries_topic_id
    ON research_entries(topic_id);
`);

function listModuleEntries(moduleId) {
  return db
    .prepare(
      `SELECT id, text, created_at AS createdAt
       FROM module_entries
       WHERE module_id = ?
       ORDER BY created_at DESC`,
    )
    .all(moduleId);
}

function createModuleEntry(moduleId, text) {
  const id = `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO module_entries (id, module_id, text, created_at)
     VALUES (?, ?, ?, ?)`,
  ).run(id, moduleId, text, createdAt);

  return { id, text, createdAt };
}

function deleteModuleEntry(moduleId, entryId) {
  return db
    .prepare(`DELETE FROM module_entries WHERE module_id = ? AND id = ?`)
    .run(moduleId, entryId).changes;
}

function listResearchTopics() {
  return db
    .prepare(
      `SELECT id, tag, title, description, created_at AS createdAt
       FROM research_topics
       ORDER BY created_at DESC`,
    )
    .all();
}

function createResearchTopic({ id, tag, title, description, createdAt }) {
  db.prepare(
    `INSERT INTO research_topics (id, tag, title, description, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, tag, title, description, createdAt);

  return { id, tag, title, description, createdAt };
}

function listResearchEntries(topicId) {
  return db
    .prepare(
      `SELECT id, text, created_at AS createdAt
       FROM research_entries
       WHERE topic_id = ?
       ORDER BY created_at DESC`,
    )
    .all(topicId);
}

function createResearchEntry(topicId, text) {
  const id = `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO research_entries (id, topic_id, text, created_at)
     VALUES (?, ?, ?, ?)`,
  ).run(id, topicId, text, createdAt);

  return { id, text, createdAt };
}

function deleteResearchEntry(topicId, entryId) {
  return db
    .prepare(`DELETE FROM research_entries WHERE topic_id = ? AND id = ?`)
    .run(topicId, entryId).changes;
}

function getEntryCounts() {
  const counts = {};

  for (const row of db
    .prepare(`SELECT module_id AS id, COUNT(*) AS count FROM module_entries GROUP BY module_id`)
    .all()) {
    counts[row.id] = row.count;
  }

  for (const row of db
    .prepare(`SELECT topic_id AS id, COUNT(*) AS count FROM research_entries GROUP BY topic_id`)
    .all()) {
    counts[row.id] = row.count;
  }

  return counts;
}

function listModuleImages(moduleId) {
  return db
    .prepare(
      `SELECT id, filename, original_name AS originalName, created_at AS createdAt
       FROM module_images
       WHERE module_id = ?
       ORDER BY created_at DESC`,
    )
    .all(moduleId);
}

function createModuleImage(moduleId, filename, originalName) {
  const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO module_images (id, module_id, filename, original_name, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, moduleId, filename, originalName, createdAt);

  return { id, filename, originalName, createdAt };
}

function getModuleImage(moduleId, imageId) {
  return db
    .prepare(
      `SELECT id, filename, original_name AS originalName, created_at AS createdAt
       FROM module_images
       WHERE module_id = ? AND id = ?`,
    )
    .get(moduleId, imageId);
}

function deleteModuleImage(moduleId, imageId) {
  return db
    .prepare(`DELETE FROM module_images WHERE module_id = ? AND id = ?`)
    .run(moduleId, imageId).changes;
}

module.exports = {
  listModuleEntries,
  createModuleEntry,
  deleteModuleEntry,
  listResearchTopics,
  createResearchTopic,
  listResearchEntries,
  createResearchEntry,
  deleteResearchEntry,
  getEntryCounts,
  listModuleImages,
  createModuleImage,
  getModuleImage,
  deleteModuleImage,
};

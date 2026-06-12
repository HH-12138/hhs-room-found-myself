const fs = require("fs");
const path = require("path");
const db = require("../db");

const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_UPLOADS_DIR = path.join(ROOT, "data", "uploads");
const PUBLIC_UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const STATIC_DATA_PATH = path.join(PUBLIC_DIR, "site-data-static.json");

const MODULE_IDS = ["01", "02", "03", "04", "05"];
const DEFAULT_RESEARCH_ID = "research-default";

const defaultResearchTopics = [
  {
    id: DEFAULT_RESEARCH_ID,
    tag: "Vibe Coding",
    title: "Cursor 如何帮助普通人做产品",
    description:
      "观察一个非传统开发者如何借助 AI 工具，把模糊的想法推进成可点击、可迭代、可分享的产品原型。",
    builtIn: true,
  },
];

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyImage(filename) {
  const source = path.join(DATA_UPLOADS_DIR, filename);
  const target = path.join(PUBLIC_UPLOADS_DIR, filename);

  if (fs.existsSync(source)) {
    fs.copyFileSync(source, target);
  }
}

ensureCleanDir(PUBLIC_UPLOADS_DIR);
fs.writeFileSync(path.join(PUBLIC_UPLOADS_DIR, ".gitkeep"), "");

const moduleEntries = {};
const moduleImages = {};

for (const moduleId of MODULE_IDS) {
  moduleEntries[moduleId] = db.listModuleEntries(moduleId);
  moduleImages[moduleId] = db.listModuleImages(moduleId).map((image) => {
    copyImage(image.filename);
    return {
      ...image,
      url: `./uploads/${image.filename}`,
    };
  });
}

const customResearchTopics = db.listResearchTopics();
const researchEntries = {};

for (const topic of [...defaultResearchTopics, ...customResearchTopics]) {
  researchEntries[topic.id] = db.listResearchEntries(topic.id);
}

const staticData = {
  generatedAt: new Date().toISOString(),
  entryCounts: db.getEntryCounts(),
  customResearchTopics,
  moduleEntries,
  moduleImages,
  researchEntries,
};

fs.writeFileSync(STATIC_DATA_PATH, `${JSON.stringify(staticData, null, 2)}\n`);

console.log(`Exported static site data to ${path.relative(ROOT, STATIC_DATA_PATH)}`);
console.log(`Copied images to ${path.relative(ROOT, PUBLIC_UPLOADS_DIR)}`);

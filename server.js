require("dotenv").config();

const fs = require("fs");
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

const uploadsDir = path.join(__dirname, "data", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("只能上传图片文件。"));
      return;
    }
    cb(null, true);
  },
});

const IMAGE_MODULES = new Set(["01", "03", "04", "05"]);

app.set("trust proxy", 1);
app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

function requireAuth(req, res, next) {
  if (req.session.authenticated) {
    next();
    return;
  }

  res.status(401).json({ error: "请先登录后再编辑内容。" });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/auth/status", (req, res) => {
  res.json({ authenticated: Boolean(req.session.authenticated) });
});

app.post("/api/auth/login", (req, res) => {
  const { password } = req.body || {};

  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "密码不正确。" });
    return;
  }

  req.session.authenticated = true;
  res.json({ authenticated: true });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ authenticated: false });
  });
});

app.get("/api/site-data", (_req, res) => {
  res.json({
    entryCounts: db.getEntryCounts(),
    customResearchTopics: db.listResearchTopics(),
  });
});

app.get("/api/modules/:moduleId/entries", (req, res) => {
  res.json(db.listModuleEntries(req.params.moduleId));
});

app.post("/api/modules/:moduleId/entries", requireAuth, (req, res) => {
  const text = String(req.body?.text || "").trim();

  if (!text) {
    res.status(400).json({ error: "内容不能为空。" });
    return;
  }

  const entry = db.createModuleEntry(req.params.moduleId, text);
  res.status(201).json(entry);
});

app.put("/api/modules/:moduleId/entries/:entryId", requireAuth, (req, res) => {
  const text = String(req.body?.text || "").trim();

  if (!text) {
    res.status(400).json({ error: "内容不能为空。" });
    return;
  }

  const entry = db.updateModuleEntry(
    req.params.moduleId,
    req.params.entryId,
    text,
  );

  if (!entry) {
    res.status(404).json({ error: "记录不存在。" });
    return;
  }

  res.json(entry);
});

app.delete("/api/modules/:moduleId/entries/:entryId", requireAuth, (req, res) => {
  const changes = db.deleteModuleEntry(req.params.moduleId, req.params.entryId);

  if (!changes) {
    res.status(404).json({ error: "记录不存在。" });
    return;
  }

  res.status(204).send();
});

app.get("/api/modules/:moduleId/images", (req, res) => {
  const { moduleId } = req.params;

  if (!IMAGE_MODULES.has(moduleId)) {
    res.status(400).json({ error: "该模块不支持图片。" });
    return;
  }

  res.json(
    db.listModuleImages(moduleId).map((image) => ({
      ...image,
      url: `/uploads/${image.filename}`,
    })),
  );
});

app.post(
  "/api/modules/:moduleId/images",
  requireAuth,
  (req, res, next) => {
    if (!IMAGE_MODULES.has(req.params.moduleId)) {
      res.status(400).json({ error: "该模块不支持图片。" });
      return;
    }
    next();
  },
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "请选择一张图片。" });
      return;
    }

    const image = db.createModuleImage(
      req.params.moduleId,
      req.file.filename,
      req.file.originalname,
    );

    res.status(201).json({
      ...image,
      url: `/uploads/${image.filename}`,
    });
  },
);

app.delete("/api/modules/:moduleId/images/:imageId", requireAuth, (req, res) => {
  const image = db.getModuleImage(req.params.moduleId, req.params.imageId);

  if (!image) {
    res.status(404).json({ error: "图片不存在。" });
    return;
  }

  const filePath = path.join(uploadsDir, image.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  db.deleteModuleImage(req.params.moduleId, req.params.imageId);
  res.status(204).send();
});

app.get("/api/research/:topicId/entries", (req, res) => {
  res.json(db.listResearchEntries(req.params.topicId));
});

app.post("/api/research/topics", requireAuth, (req, res) => {
  const tag = String(req.body?.tag || "Research").trim() || "Research";
  const title = String(req.body?.title || "").trim();
  const description = String(req.body?.description || "").trim();

  if (!title || !description) {
    res.status(400).json({ error: "请填写研究主题和简介。" });
    return;
  }

  const topic = db.createResearchTopic({
    id: `research-${Date.now()}`,
    tag,
    title,
    description,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(topic);
});

app.delete("/api/research/topics/:topicId", requireAuth, (req, res) => {
  const changes = db.deleteResearchTopic(req.params.topicId);

  if (!changes) {
    res.status(404).json({ error: "研究主题不存在。" });
    return;
  }

  res.status(204).send();
});

app.post("/api/research/:topicId/entries", requireAuth, (req, res) => {
  const text = String(req.body?.text || "").trim();

  if (!text) {
    res.status(400).json({ error: "内容不能为空。" });
    return;
  }

  const entry = db.createResearchEntry(req.params.topicId, text);
  res.status(201).json(entry);
});

app.put("/api/research/:topicId/entries/:entryId", requireAuth, (req, res) => {
  const text = String(req.body?.text || "").trim();

  if (!text) {
    res.status(400).json({ error: "内容不能为空。" });
    return;
  }

  const entry = db.updateResearchEntry(
    req.params.topicId,
    req.params.entryId,
    text,
  );

  if (!entry) {
    res.status(404).json({ error: "记录不存在。" });
    return;
  }

  res.json(entry);
});

app.delete("/api/research/:topicId/entries/:entryId", requireAuth, (req, res) => {
  const changes = db.deleteResearchEntry(req.params.topicId, req.params.entryId);

  if (!changes) {
    res.status(404).json({ error: "记录不存在。" });
    return;
  }

  res.status(204).send();
});

app.use("/uploads", express.static(uploadsDir));
app.use(express.static(path.join(__dirname, "public")));

app.use((error, _req, res, _next) => {
  res.status(400).json({ error: error.message || "请求失败。" });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`HH's ROOM running at http://localhost:${PORT}`);
});

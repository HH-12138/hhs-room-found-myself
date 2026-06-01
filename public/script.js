const DEFAULT_RESEARCH_ID = "research-default";
const IMAGE_MODULES = new Set(["01", "03", "04", "05"]);

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

const modules = [
  {
    number: "01",
    title: "身体观察室",
    note: "the body always knows",
    placeholder: "今天身体有什么反馈？睡眠、恢复、水肿、经期……",
    allowsImages: true,
  },
  {
    number: "02",
    title: "人与人的连接",
    note: "between you and me",
    placeholder: "写下一段关系观察，记得匿名化处理细节……",
    allowsImages: false,
  },
  {
    number: "03",
    title: "生活采样",
    note: "collected moments",
    placeholder: "一个短句、一种气味、一个让你舒服的瞬间……",
    allowsImages: true,
  },
  {
    number: "04",
    title: "Vibe Coding 日志",
    note: "idea → prototype → repeat",
    placeholder: "今天做了什么产品练习？遇到了什么卡点？",
    allowsImages: true,
  },
  {
    number: "05",
    title: "成长轨迹",
    note: "still becoming",
    placeholder: "这一阶段，我在成为什么样的人？",
    allowsImages: true,
  },
];

const indexList = document.querySelector("#indexList");
const moduleGrid = document.querySelector("#moduleGrid");
const nowStudyingList = document.querySelector("#nowStudyingList");
const addResearchBtn = document.querySelector("#addResearchBtn");
const authButton = document.querySelector("#authButton");

const moduleEditor = document.querySelector("#moduleEditor");
const editorBackdrop = document.querySelector("#editorBackdrop");
const editorClose = document.querySelector("#editorClose");
const editorNumber = document.querySelector("#editorNumber");
const editorTitle = document.querySelector("#editorTitle");
const editorNote = document.querySelector("#editorNote");
const editorNotesMode = document.querySelector("#editorNotesMode");
const editorResearchMode = document.querySelector("#editorResearchMode");
const editorInput = document.querySelector("#editorInput");
const editorSave = document.querySelector("#editorSave");
const editorEntries = document.querySelector("#editorEntries");
const editorImageSection = document.querySelector("#editorImageSection");
const editorImageInput = document.querySelector("#editorImageInput");
const editorImages = document.querySelector("#editorImages");
const editorResearchTag = document.querySelector("#editorResearchTag");
const editorResearchTitle = document.querySelector("#editorResearchTitle");
const editorResearchDesc = document.querySelector("#editorResearchDesc");
const editorResearchSave = document.querySelector("#editorResearchSave");

const loginModal = document.querySelector("#loginModal");
const loginBackdrop = document.querySelector("#loginBackdrop");
const loginClose = document.querySelector("#loginClose");
const loginPassword = document.querySelector("#loginPassword");
const loginError = document.querySelector("#loginError");
const loginSubmit = document.querySelector("#loginSubmit");

let activeModule = null;
let isAuthenticated = false;
let entryCounts = {};
let customResearchTopics = [];
let latestEntries = {};
let moduleImages = {};

function getAllResearchTopics() {
  return [...defaultResearchTopics, ...customResearchTopics];
}

function getResearchTopic(id) {
  return getAllResearchTopics().find((topic) => topic.id === id);
}

function getEditorTarget(id) {
  return modules.find((item) => item.number === id);
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function entryCount(id) {
  return entryCounts[id] || 0;
}

async function refreshSiteData() {
  const data = await API.getSiteData();
  entryCounts = data.entryCounts || {};
  customResearchTopics = data.customResearchTopics || [];
}

function updateAuthButton() {
  authButton.textContent = isAuthenticated ? "退出" : "登录";
}

function openLogin() {
  loginError.hidden = true;
  loginPassword.value = "";
  loginModal.hidden = false;
  loginModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("editor-open");
  loginPassword.focus();
}

function closeLogin() {
  loginModal.hidden = true;
  loginModal.setAttribute("aria-hidden", "true");
  if (moduleEditor.hidden) {
    document.body.classList.remove("editor-open");
  }
}

async function checkAuth() {
  const status = await API.authStatus();
  isAuthenticated = Boolean(status.authenticated);
  updateAuthButton();
}

async function handleAuthClick() {
  if (isAuthenticated) {
    await API.logout();
    isAuthenticated = false;
    updateAuthButton();
    return;
  }

  openLogin();
}

async function handleLoginSubmit() {
  try {
    loginError.hidden = true;
    await API.login(loginPassword.value);
    isAuthenticated = true;
    updateAuthButton();
    closeLogin();
  } catch (error) {
    loginError.textContent = error.message;
    loginError.hidden = false;
  }
}

function requireAuthOrLogin() {
  if (isAuthenticated) {
    return true;
  }

  openLogin();
  return false;
}

async function loadEntriesForActiveModule() {
  if (!activeModule || activeModule.mode !== "notes") {
    return [];
  }

  if (activeModule.scope === "research") {
    return API.getResearchEntries(activeModule.number);
  }

  return API.getModuleEntries(activeModule.number);
}

function renderEntriesList(entries) {
  if (entries.length === 0) {
    editorEntries.innerHTML =
      '<p class="editor-empty">还没有记录。写下第一条观察吧。</p>';
    return;
  }

  editorEntries.innerHTML = entries
    .map((entry) => {
      const article = document.createElement("article");
      article.className = "editor-entry";

      const meta = document.createElement("div");
      meta.className = "editor-entry-meta";

      const time = document.createElement("time");
      time.textContent = formatDate(entry.createdAt);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "editor-delete";
      deleteButton.dataset.id = entry.id;
      deleteButton.textContent = "删除";

      const text = document.createElement("p");
      text.textContent = entry.text;

      meta.append(time, deleteButton);
      article.append(meta, text);
      return article.outerHTML;
    })
    .join("");
}

function renderImageGallery(images) {
  if (images.length === 0) {
    editorImages.innerHTML = '<p class="editor-empty">还没有图片。</p>';
    return;
  }

  editorImages.innerHTML = images
    .map(
      (image) => `
        <figure class="editor-image-item">
          <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.originalName || "uploaded image")}" />
          <button type="button" class="editor-delete" data-image-id="${image.id}">删除</button>
        </figure>
      `,
    )
    .join("");
}

async function loadModuleImages(moduleId) {
  if (!IMAGE_MODULES.has(moduleId)) {
    return [];
  }

  const images = await API.getModuleImages(moduleId);
  moduleImages[moduleId] = images;
  return images;
}

async function renderEntries() {
  const entries = await loadEntriesForActiveModule();
  latestEntries[activeModule.number] = entries;
  renderEntriesList(entries);

  if (activeModule.scope === "module" && activeModule.allowsImages) {
    const images = await loadModuleImages(activeModule.number);
    renderImageGallery(images);
  }
}

function renderModuleCardImages(moduleId) {
  const images = moduleImages[moduleId] || [];
  if (images.length === 0) {
    return "";
  }

  return `
    <div class="module-images">
      ${images
        .slice(0, 3)
        .map(
          (image) =>
            `<img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.originalName || "image")}" />`,
        )
        .join("")}
    </div>
  `;
}

function updateModuleBadges() {
  document.querySelectorAll(".module-card").forEach((card) => {
    const number = card.dataset.module;
    const count = entryCount(number);
    const badge = card.querySelector(".module-entry-count");

    if (count > 0) {
      badge.textContent = `${count} 条记录`;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }

    const imagesWrap = card.querySelector(".module-images-wrap");
    if (imagesWrap) {
      imagesWrap.innerHTML = renderModuleCardImages(number);
    }
  });
}

function renderNowSection() {
  nowStudyingList.innerHTML = getAllResearchTopics()
    .map((topic) => {
      const count = entryCount(topic.id);
      const latest = latestEntries[topic.id]?.[0];
      const latestPreview = latest
        ? `<p class="research-latest">${escapeHtml(latest.text)}</p>`
        : "";

      return `
        <article
          class="research-card is-clickable"
          data-research-id="${topic.id}"
          role="button"
          tabindex="0"
          aria-label="打开 ${escapeHtml(topic.title)} 的记录"
        >
          <span class="tag">${escapeHtml(topic.tag || "Research")}</span>
          <h3>${escapeHtml(topic.title)}</h3>
          <p class="research-description">${escapeHtml(topic.description)}</p>
          ${latestPreview}
          <p class="research-hint">点击记录观察</p>
          ${count > 0 ? `<span class="research-entry-count">${count} 条记录</span>` : ""}
        </article>
      `;
    })
    .join("");

  bindResearchCards();
}

async function preloadResearchPreviews() {
  await Promise.all(
    getAllResearchTopics().map(async (topic) => {
      if (entryCount(topic.id) > 0) {
        latestEntries[topic.id] = await API.getResearchEntries(topic.id);
      }
    }),
  );
}

async function preloadModuleImages() {
  await Promise.all(
    modules
      .filter((item) => item.allowsImages)
      .map(async (item) => {
        moduleImages[item.number] = await API.getModuleImages(item.number);
      }),
  );
}

function bindResearchCards() {
  document.querySelectorAll("[data-research-id]").forEach((element) => {
    element.addEventListener("click", () => {
      openResearchNotes(element.dataset.researchId);
    });

    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openResearchNotes(element.dataset.researchId);
      }
    });
  });
}

function setEditorMode(mode) {
  const isNewResearch = mode === "new-research";
  editorNotesMode.hidden = isNewResearch;
  editorResearchMode.hidden = !isNewResearch;
}

async function openResearchNotes(researchId) {
  const topic = getResearchTopic(researchId);
  if (!topic) return;

  activeModule = {
    number: topic.id,
    title: topic.title,
    placeholder: `记录关于「${topic.title}」的观察、问题或灵感……`,
    mode: "notes",
    scope: "research",
    allowsImages: false,
  };

  setEditorMode("notes");
  editorNumber.textContent = "Now studying";
  editorTitle.textContent = topic.title;
  editorNote.hidden = true;
  editorImageSection.hidden = true;
  editorInput.value = "";
  editorInput.placeholder = activeModule.placeholder;

  showEditor();
  await renderEntries();
  editorInput.focus();
}

function openNewResearchForm() {
  if (!requireAuthOrLogin()) return;

  activeModule = { mode: "new-research" };

  setEditorMode("new-research");
  editorNumber.textContent = "Now studying";
  editorTitle.textContent = "添加一条研究";
  editorNote.textContent = "currently obsessed with...";
  editorNote.hidden = false;
  editorResearchTag.value = "";
  editorResearchTitle.value = "";
  editorResearchDesc.value = "";

  showEditor();
  editorResearchTitle.focus();
}

function showEditor() {
  moduleEditor.hidden = false;
  moduleEditor.setAttribute("aria-hidden", "false");
  document.body.classList.add("editor-open");
}

async function openEditor(number) {
  const target = getEditorTarget(number);
  if (!target) return;

  activeModule = { ...target, mode: "notes", scope: "module" };

  setEditorMode("notes");
  editorNumber.textContent = `Room ${target.number}`;
  editorTitle.textContent = target.title;
  editorNote.textContent = target.note || "";
  editorNote.hidden = !target.note;
  editorImageSection.hidden = !target.allowsImages;
  editorImageInput.value = "";
  editorInput.value = "";
  editorInput.placeholder = target.placeholder;

  showEditor();
  await renderEntries();
  editorInput.focus();
}

function closeEditor() {
  activeModule = null;
  moduleEditor.hidden = true;
  moduleEditor.setAttribute("aria-hidden", "true");
  document.body.classList.remove("editor-open");
  setEditorMode("notes");
  updateModuleBadges();
  renderNowSection();
}

async function handleSave() {
  if (!activeModule || activeModule.mode !== "notes") return;
  if (!requireAuthOrLogin()) return;

  const text = editorInput.value.trim();
  if (!text) return;

  try {
    if (activeModule.scope === "research") {
      await API.createResearchEntry(activeModule.number, text);
    } else {
      await API.createModuleEntry(activeModule.number, text);
    }

    editorInput.value = "";
    await refreshSiteData();
    await renderEntries();
    updateModuleBadges();
    renderNowSection();
  } catch (error) {
    if (error.status === 401) {
      openLogin();
      return;
    }

    alert(error.message);
  }
}

async function handleAddResearch() {
  if (!requireAuthOrLogin()) return;

  const tag = editorResearchTag.value.trim() || "Research";
  const title = editorResearchTitle.value.trim();
  const description = editorResearchDesc.value.trim();

  if (!title || !description) return;

  try {
    await API.createResearchTopic({ tag, title, description });
    await refreshSiteData();
    closeEditor();
    renderNowSection();
  } catch (error) {
    if (error.status === 401) {
      openLogin();
      return;
    }

    alert(error.message);
  }
}

async function handleDelete(entryId) {
  if (!activeModule || activeModule.mode !== "notes") return;
  if (!requireAuthOrLogin()) return;

  try {
    if (activeModule.scope === "research") {
      await API.deleteResearchEntry(activeModule.number, entryId);
    } else {
      await API.deleteModuleEntry(activeModule.number, entryId);
    }

    await refreshSiteData();
    await renderEntries();
    updateModuleBadges();
    renderNowSection();
  } catch (error) {
    if (error.status === 401) {
      openLogin();
      return;
    }

    alert(error.message);
  }
}

async function handleImageUpload(event) {
  if (!activeModule || activeModule.scope !== "module" || !activeModule.allowsImages) {
    return;
  }

  if (!requireAuthOrLogin()) {
    event.target.value = "";
    return;
  }

  const file = event.target.files?.[0];
  if (!file) return;

  try {
    await API.uploadModuleImage(activeModule.number, file);
    event.target.value = "";
    await loadModuleImages(activeModule.number);
    await renderEntries();
    updateModuleBadges();
  } catch (error) {
    if (error.status === 401) {
      openLogin();
      return;
    }

    alert(error.message);
  }
}

async function handleImageDelete(imageId) {
  if (!activeModule || activeModule.scope !== "module" || !activeModule.allowsImages) {
    return;
  }

  if (!requireAuthOrLogin()) return;

  try {
    await API.deleteModuleImage(activeModule.number, imageId);
    await loadModuleImages(activeModule.number);
    await renderEntries();
    updateModuleBadges();
  } catch (error) {
    if (error.status === 401) {
      openLogin();
      return;
    }

    alert(error.message);
  }
}

indexList.innerHTML = modules
  .map(
    (item) => `
      <button type="button" class="index-item" data-module="${item.number}">
        <span>${item.number}</span>
        <div class="index-item-text">
          <strong>${item.title}</strong>
          <span class="handwritten-note">${item.note}</span>
        </div>
      </button>
    `,
  )
  .join("");

moduleGrid.innerHTML = modules
  .map(
    (item) => `
      <article
        class="module-card is-clickable"
        id="module-${item.number}"
        data-module="${item.number}"
        role="button"
        tabindex="0"
        aria-label="打开 ${item.title} 记录"
      >
        <div class="module-topline">
          <span>${item.number}</span>
        </div>
        <div class="module-title-row">
          <h3>${item.title}</h3>
          ${item.note ? `<span class="handwritten-note">${item.note}</span>` : ""}
        </div>
        <div class="module-images-wrap">${renderModuleCardImages(item.number)}</div>
        <p class="module-hint">点击开始记录</p>
        <span class="module-entry-count" hidden></span>
      </article>
    `,
  )
  .join("");

document.querySelectorAll("[data-module]").forEach((element) => {
  element.addEventListener("click", () => {
    openEditor(element.dataset.module);
  });

  if (element.classList.contains("module-card")) {
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openEditor(element.dataset.module);
      }
    });
  }
});

authButton.addEventListener("click", handleAuthClick);
addResearchBtn.addEventListener("click", openNewResearchForm);
editorSave.addEventListener("click", handleSave);
editorResearchSave.addEventListener("click", handleAddResearch);
editorClose.addEventListener("click", closeEditor);
editorBackdrop.addEventListener("click", closeEditor);
loginClose.addEventListener("click", closeLogin);
loginBackdrop.addEventListener("click", closeLogin);
loginSubmit.addEventListener("click", handleLoginSubmit);
editorImageInput.addEventListener("change", handleImageUpload);

loginPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleLoginSubmit();
  }
});

editorEntries.addEventListener("click", (event) => {
  const button = event.target.closest(".editor-delete");
  if (button) {
    handleDelete(button.dataset.id);
  }
});

editorImages.addEventListener("click", (event) => {
  const button = event.target.closest("[data-image-id]");
  if (button) {
    handleImageDelete(button.dataset.imageId);
  }
});

editorInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    handleSave();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!loginModal.hidden) {
      closeLogin();
      return;
    }

    if (!moduleEditor.hidden) {
      closeEditor();
    }
  }
});

async function initApp() {
  await checkAuth();
  await refreshSiteData();
  await preloadResearchPreviews();
  await preloadModuleImages();
  updateModuleBadges();
  renderNowSection();
}

initApp();

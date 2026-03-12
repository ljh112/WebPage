const STORAGE_KEY = "personal-portal-config-v1";
const ALL_CATEGORY = "全部";
const DEFAULT_SEARCH_ENGINE = "google";
const CLOCK_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});
const SEARCH_ENGINES = {
  google: {
    label: "Google",
    icon: "./assets/icons/search-engines/google.png",
    buildUrl: (keyword) => `https://www.google.com/search?q=${encodeURIComponent(keyword)}`
  },
  bing: {
    label: "Bing",
    icon: "./assets/icons/search-engines/bing.png",
    buildUrl: (keyword) => `https://www.bing.com/search?q=${encodeURIComponent(keyword)}`
  },
  baidu: {
    label: "百度",
    icon: "./assets/icons/search-engines/baidu.png",
    buildUrl: (keyword) => `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}`
  },
  duckduckgo: {
    label: "DuckDuckGo",
    icon: "./assets/icons/search-engines/duckduckgo.png",
    buildUrl: (keyword) => `https://duckduckgo.com/?q=${encodeURIComponent(keyword)}`
  }
};

const defaultConfig = {
  siteTitle: "ljhiokc 的主页",
  heroTitle: "常用入口，一页速达",
  heroDesc: "把日常网站与工具收进一个面板，搜索、分类、拖拽排序都更顺手。",
  searchEngine: DEFAULT_SEARCH_ENGINE,
  links: [
    {
      id: "1",
      name: "Gmail",
      url: "https://mail.google.com",
      category: "邮件",
      icon: "./assets/icons/links/gmail.png"
    },
    {
      id: "2",
      name: "USTC Mail",
      url: "https://mail.ustc.edu.cn/",
      category: "邮件",
      icon: "./assets/icons/links/ustc-mail.png"
    },
    {
      id: "3",
      name: "Notion",
      url: "https://www.notion.so",
      category: "笔记",
      icon: "./assets/icons/links/notion.png"
    },
    {
      id: "4",
      name: "谷歌学术",
      url: "https://scholar.google.com",
      category: "学术",
      icon: "./assets/icons/links/google-scholar.png"
    },
    {
      id: "5",
      name: "USTC LaTeX",
      url: "https://latex.ustc.edu.cn/",
      category: "学术",
      icon: "./assets/icons/links/latex.svg"
    },
    {
      id: "6",
      name: "GitHub",
      url: "https://github.com",
      category: "开发",
      icon: "./assets/icons/links/github.png"
    },
    {
      id: "7",
      name: "掘金",
      url: "https://juejin.cn",
      category: "开发",
      icon: "./assets/icons/links/juejin.png"
    },
    {
      id: "8",
      name: "ChatGPT",
      url: "https://chatgpt.com",
      category: "AI",
      icon: "./assets/icons/links/chatgpt.png"
    },
    {
      id: "9",
      name: "飞书",
      url: "https://www.feishu.cn",
      category: "协作",
      icon: "./assets/icons/links/feishu.png"
    },
    {
      id: "10",
      name: "知乎",
      url: "https://www.zhihu.com",
      category: "社区",
      icon: "./assets/icons/links/zhihu.png"
    },
    {
      id: "11",
      name: "V2EX",
      url: "https://www.v2ex.com",
      category: "社区",
      icon: "./assets/icons/links/v2ex.png"
    },
    {
      id: "12",
      name: "YouTube",
      url: "https://www.youtube.com",
      category: "学习",
      icon: "./assets/icons/links/youtube.png"
    },
    {
      id: "13",
      name: "Bilibili",
      url: "https://www.bilibili.com",
      category: "学习",
      icon: "./assets/icons/links/bilibili.png"
    }
  ]
};

const refs = {
  siteTitle: document.getElementById("site-title"),
  liveClock: document.getElementById("live-clock"),
  heroTitle: document.getElementById("hero-title"),
  heroDesc: document.getElementById("hero-desc"),
  heroStatus: document.getElementById("hero-status"),
  linkCount: document.getElementById("link-count"),
  chips: document.getElementById("category-chips"),
  grid: document.getElementById("links-grid"),
  template: document.getElementById("link-card-template"),
  webSearchEngine: document.getElementById("web-search-engine"),
  webSearchEngineIcon: document.getElementById("web-search-engine-icon"),
  webSearchInput: document.getElementById("web-search-input"),
  webSearchBtn: document.getElementById("web-search-btn"),
  searchInput: document.getElementById("search-input"),
  addLinkBtn: document.getElementById("add-link-btn"),
  exportBtn: document.getElementById("export-btn"),
  importBtn: document.getElementById("import-btn"),
  resetBtn: document.getElementById("reset-btn"),
  importFileInput: document.getElementById("import-file-input"),
  dialog: document.getElementById("link-dialog"),
  dialogTitle: document.getElementById("dialog-title"),
  form: document.getElementById("link-form"),
  formId: document.getElementById("link-id"),
  formName: document.getElementById("link-name"),
  formUrl: document.getElementById("link-url"),
  formCategory: document.getElementById("link-category"),
  formIcon: document.getElementById("link-icon"),
  cancelDialogBtn: document.getElementById("cancel-dialog-btn")
};

const faviconCache = new Map();

const state = {
  config: loadConfig(),
  selectedCategory: ALL_CATEGORY,
  query: "",
  visibleLinks: [],
  draggingLinkId: ""
};

applyConfigText();
render();
bindEvents();
startLiveClock();
bindAmbientPointer();

function bindEvents() {
  refs.webSearchBtn.addEventListener("click", submitWebSearch);
  refs.webSearchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    submitWebSearch();
  });
  refs.webSearchEngine.addEventListener("change", () => {
    state.config.searchEngine = getSearchEngineId(refs.webSearchEngine.value);
    saveConfig();
    syncWebSearchEngineUI();
  });

  refs.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });

  refs.addLinkBtn.addEventListener("click", () => openDialog());

  refs.exportBtn.addEventListener("click", exportConfig);

  refs.importBtn.addEventListener("click", () => refs.importFileInput.click());
  refs.importFileInput.addEventListener("change", importConfig);

  refs.resetBtn.addEventListener("click", resetConfig);

  refs.cancelDialogBtn.addEventListener("click", () => refs.dialog.close());

  refs.form.addEventListener("submit", saveFromDialog);

  refs.grid.addEventListener("dragover", handleGridDragOver);
  refs.grid.addEventListener("drop", handleGridDrop);

  document.addEventListener("keydown", (event) => {
    const isTyping =
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      event.target?.isContentEditable;

    if (event.key === "/" && !isTyping) {
      event.preventDefault();
      refs.searchInput.focus();
      refs.searchInput.select();
      return;
    }

    if (!isTyping && /^[1-9]$/.test(event.key)) {
      const index = Number(event.key) - 1;
      const target = state.visibleLinks[index];
      if (target) {
        window.open(target.url, "_blank", "noopener,noreferrer");
      }
    }
  });
}

function cloneDefaultConfig() {
  return JSON.parse(JSON.stringify(defaultConfig));
}

function loadConfig() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return cloneDefaultConfig();
  }

  try {
    const parsed = JSON.parse(raw);
    const configCandidate = extractConfigFromAnyPayload(parsed);
    return sanitizeConfig(configCandidate);
  } catch {
    return cloneDefaultConfig();
  }
}

function extractConfigFromAnyPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (!payload.workspaces || typeof payload.workspaces !== "object") {
    return payload;
  }

  const activeId = String(payload.activeWorkspaceId || "study").trim().toLowerCase();
  const selectedWorkspace = payload.workspaces[activeId];
  if (selectedWorkspace && typeof selectedWorkspace === "object") {
    return selectedWorkspace;
  }

  const fallbackWorkspace = payload.workspaces.study;
  if (fallbackWorkspace && typeof fallbackWorkspace === "object") {
    return fallbackWorkspace;
  }

  const firstWorkspace = Object.values(payload.workspaces).find((item) => item && typeof item === "object");
  return firstWorkspace || payload;
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.config));
}

function sanitizeConfig(raw) {
  const fallback = cloneDefaultConfig();
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const config = {
    siteTitle: stringOrFallback(raw.siteTitle, fallback.siteTitle),
    heroTitle: stringOrFallback(raw.heroTitle, fallback.heroTitle),
    heroDesc: stringOrFallback(raw.heroDesc, fallback.heroDesc),
    searchEngine: getSearchEngineId(raw.searchEngine),
    links: Array.isArray(raw.links) ? raw.links : fallback.links
  };

  config.links = config.links
    .map((item, index) => sanitizeLink(item, String(Date.now() + index)))
    .filter(Boolean);

  return config;
}

function sanitizeLink(item, fallbackId) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const name = String(item.name || "").trim();
  const category = String(item.category || "").trim();
  const icon = String(item.icon || "").trim();
  const url = normalizeUrl(String(item.url || "").trim());

  if (!name || !category || !url) {
    return null;
  }

  return {
    id: String(item.id || fallbackId),
    name,
    category,
    url,
    icon
  };
}

function stringOrFallback(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeUrl(url) {
  if (!url) {
    return "";
  }
  const hasScheme = /^https?:\/\//i.test(url);
  const normalized = hasScheme ? url : `https://${url}`;
  try {
    const parsed = new URL(normalized);
    return parsed.toString();
  } catch {
    return "";
  }
}

function getSearchEngineId(rawEngineId) {
  const engineId = String(rawEngineId || "").trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(SEARCH_ENGINES, engineId)) {
    return engineId;
  }
  return DEFAULT_SEARCH_ENGINE;
}

function submitWebSearch() {
  const keyword = refs.webSearchInput.value.trim();
  if (!keyword) {
    refs.webSearchInput.focus();
    return;
  }

  const engineId = getSearchEngineId(refs.webSearchEngine.value);
  state.config.searchEngine = engineId;
  saveConfig();

  const url = SEARCH_ENGINES[engineId].buildUrl(keyword);
  window.open(url, "_blank", "noopener,noreferrer");
}

function applyConfigText() {
  refs.siteTitle.textContent = state.config.siteTitle;
  document.title = state.config.siteTitle;
  refs.heroTitle.textContent = state.config.heroTitle;
  refs.heroDesc.textContent = state.config.heroDesc;
  syncWebSearchEngineUI();
}

function syncWebSearchEngineUI() {
  const engineId = getSearchEngineId(state.config.searchEngine);
  const engine = SEARCH_ENGINES[engineId];
  state.config.searchEngine = engineId;
  refs.webSearchEngine.value = engineId;
  refs.webSearchInput.placeholder = `使用 ${engine.label} 搜索`;
  refs.webSearchEngineIcon.src = engine.icon;
  refs.webSearchEngineIcon.alt = "";
}

function render() {
  renderCategoryChips();
  renderLinks();
}

function renderCategoryChips() {
  const categories = [ALL_CATEGORY, ...new Set(state.config.links.map((link) => link.category))];
  refs.chips.innerHTML = "";

  categories.forEach((category) => {
    const chip = document.createElement("button");
    chip.className = `chip${state.selectedCategory === category ? " is-active" : ""}`;
    chip.type = "button";
    chip.textContent = category;
    chip.addEventListener("click", () => {
      state.selectedCategory = category;
      render();
    });
    refs.chips.appendChild(chip);
  });
}

function renderLinks() {
  const links = state.config.links.filter((link) => {
    const categoryMatch = state.selectedCategory === ALL_CATEGORY || link.category === state.selectedCategory;
    const keyword = `${link.name} ${link.category} ${link.url}`.toLowerCase();
    const queryMatch = !state.query || keyword.includes(state.query);
    return categoryMatch && queryMatch;
  });

  state.visibleLinks = links;
  updateHeroStatus(links.length);
  refs.grid.innerHTML = "";
  refs.linkCount.textContent = `共 ${links.length} 条`;

  if (links.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "没有匹配结果，试试清空搜索词或切换分类。";
    refs.grid.appendChild(empty);
    return;
  }

  links.forEach((link, index) => {
    const card = refs.template.content.firstElementChild.cloneNode(true);
    const anchor = card.querySelector(".link-main");
    const icon = card.querySelector(".link-icon");
    const name = card.querySelector(".link-name");
    const category = card.querySelector(".link-category");
    const indexText = card.querySelector(".link-index");
    const editBtn = card.querySelector(".edit-btn");
    const deleteBtn = card.querySelector(".delete-btn");

    anchor.href = link.url;
    card.style.setProperty("--delay", `${Math.min(index, 12) * 42}ms`);
    name.textContent = link.name;
    category.textContent = link.category;
    renderLinkIcon(icon, link.icon, link.name);
    indexText.textContent = index < 9 ? `[${index + 1}]` : "";

    bindCardDragEvents(card, link.id);

    editBtn.addEventListener("click", () => openDialog(link));
    deleteBtn.addEventListener("click", () => deleteLink(link.id));

    refs.grid.appendChild(card);
  });
}

function updateHeroStatus(visibleCount) {
  if (!refs.heroStatus) {
    return;
  }

  const totalCount = state.config.links.length;
  const currentCategory = state.selectedCategory === ALL_CATEGORY ? "全部分类" : state.selectedCategory;
  refs.heroStatus.textContent = `${currentCategory} · 显示 ${visibleCount}/${totalCount} 个链接`;
}

function bindCardDragEvents(card, linkId) {
  card.draggable = true;

  card.addEventListener("dragstart", (event) => {
    state.draggingLinkId = linkId;
    card.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", linkId);
    }
  });

  card.addEventListener("dragend", () => {
    state.draggingLinkId = "";
    clearDragClasses();
  });

  card.addEventListener("dragover", (event) => {
    if (!state.draggingLinkId || state.draggingLinkId === linkId) {
      return;
    }
    event.preventDefault();
    card.classList.add("is-drop-target");
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  });

  card.addEventListener("dragleave", () => {
    card.classList.remove("is-drop-target");
  });

  card.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const draggingId = state.draggingLinkId;
    if (!draggingId || draggingId === linkId) {
      return;
    }

    moveLinkInVisibleOrder(draggingId, linkId);
    clearDragClasses();
  });
}

function handleGridDragOver(event) {
  if (!state.draggingLinkId) {
    return;
  }
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function handleGridDrop(event) {
  if (!state.draggingLinkId) {
    return;
  }
  const onCard = event.target instanceof Element && event.target.closest(".link-card");
  if (onCard) {
    return;
  }

  event.preventDefault();
  moveLinkToVisibleTail(state.draggingLinkId);
  clearDragClasses();
}

function clearDragClasses() {
  refs.grid.querySelectorAll(".link-card.is-dragging, .link-card.is-drop-target").forEach((card) => {
    card.classList.remove("is-dragging");
    card.classList.remove("is-drop-target");
  });
}

function moveLinkInVisibleOrder(draggingId, targetId) {
  const visibleIds = state.visibleLinks.map((link) => link.id);
  const fromIndex = visibleIds.indexOf(draggingId);
  const toIndex = visibleIds.indexOf(targetId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return;
  }

  const [movedId] = visibleIds.splice(fromIndex, 1);
  visibleIds.splice(toIndex, 0, movedId);
  applyVisibleOrder(visibleIds);
  saveConfig();
  render();
}

function moveLinkToVisibleTail(draggingId) {
  const visibleIds = state.visibleLinks.map((link) => link.id);
  const fromIndex = visibleIds.indexOf(draggingId);
  if (fromIndex < 0 || fromIndex === visibleIds.length - 1) {
    return;
  }

  const [movedId] = visibleIds.splice(fromIndex, 1);
  visibleIds.push(movedId);
  applyVisibleOrder(visibleIds);
  saveConfig();
  render();
}

function applyVisibleOrder(nextVisibleIds) {
  const visibleSet = new Set(nextVisibleIds);
  const linkById = new Map(state.config.links.map((link) => [link.id, link]));
  let cursor = 0;

  state.config.links = state.config.links.map((link) => {
    if (!visibleSet.has(link.id)) {
      return link;
    }
    const nextId = nextVisibleIds[cursor++];
    return linkById.get(nextId) || link;
  });
}

function startLiveClock() {
  if (!refs.liveClock) {
    return;
  }

  const updateClockText = () => {
    const now = new Date();
    const text = CLOCK_FORMATTER.format(now).replace(/\//g, ".");
    refs.liveClock.textContent = text;
  };

  updateClockText();
  window.setInterval(updateClockText, 1000);
}

function bindAmbientPointer() {
  const root = document.documentElement;
  if (!root) {
    return;
  }

  let rafId = 0;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  const applyPosition = () => {
    root.style.setProperty("--mx", `${mouseX}px`);
    root.style.setProperty("--my", `${mouseY}px`);
    rafId = 0;
  };

  window.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    if (rafId) {
      return;
    }
    rafId = window.requestAnimationFrame(applyPosition);
  });
}

function isImageIcon(iconValue) {
  if (!iconValue) {
    return false;
  }
  const text = String(iconValue).trim();
  if (!text) {
    return false;
  }
  return /^(https?:\/\/|\.{1,2}\/|\/)/i.test(text) || /\.(png|svg|jpe?g|webp|gif|ico)(\?.*)?$/i.test(text);
}

function renderLinkIcon(container, iconValue, name) {
  container.textContent = "";
  if (!iconValue) {
    container.textContent = "🔗";
    return;
  }

  if (!isImageIcon(iconValue) && !String(iconValue).startsWith("data:image/")) {
    container.textContent = iconValue;
    return;
  }

  const img = document.createElement("img");
  img.src = iconValue;
  img.alt = `${name} 图标`;
  img.loading = "lazy";
  img.addEventListener("error", () => {
    container.textContent = "🔗";
  });
  container.appendChild(img);
}

function openDialog(link) {
  const isEdit = Boolean(link);
  refs.dialogTitle.textContent = isEdit ? "编辑链接" : "新增链接";
  refs.formId.value = isEdit ? link.id : "";
  refs.formName.value = isEdit ? link.name : "";
  refs.formUrl.value = isEdit ? link.url : "";
  refs.formCategory.value = isEdit ? link.category : "";
  refs.formIcon.value = isEdit ? link.icon : "";
  refs.dialog.showModal();
  refs.formName.focus();
}

async function saveFromDialog(event) {
  event.preventDefault();

  const id = refs.formId.value.trim();
  const name = refs.formName.value.trim();
  const category = refs.formCategory.value.trim();
  const typedIcon = refs.formIcon.value.trim();
  const url = normalizeUrl(refs.formUrl.value.trim());

  if (!name || !category || !url) {
    alert("请完整填写名称、分类和可用 URL。");
    return;
  }

  const submitBtn = refs.form.querySelector('button[type="submit"]');
  const submitBtnText = submitBtn ? submitBtn.textContent : "";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "保存中...";
  }

  try {
    let icon = typedIcon;

    if (!icon && id) {
      const existing = state.config.links.find((link) => link.id === id);
      icon = existing?.icon || "";
    }

    if (!icon) {
      icon = await fetchFaviconDataUrl(url);
    }

    if (id) {
      const target = state.config.links.find((link) => link.id === id);
      if (target) {
        target.name = name;
        target.category = category;
        target.url = url;
        target.icon = icon;
      }
    } else {
      state.config.links.unshift({
        id: createId(),
        name,
        category,
        url,
        icon
      });
    }

    saveConfig();
    refs.dialog.close();
    render();
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtnText;
    }
  }
}

async function fetchFaviconDataUrl(pageUrl) {
  try {
    const hostname = new URL(pageUrl).hostname;
    if (!hostname) {
      return "";
    }

    if (faviconCache.has(hostname)) {
      return faviconCache.get(hostname);
    }

    const endpoint = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
    const response = await fetch(endpoint, { cache: "force-cache" });
    if (!response.ok) {
      return "";
    }

    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) {
      return "";
    }

    if (blob.size < 150) {
      return "";
    }

    const dataUrl = await blobToDataUrl(blob);
    if (!dataUrl) {
      return "";
    }

    faviconCache.set(hostname, dataUrl);
    return dataUrl;
  } catch {
    return "";
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(blob);
  });
}

function deleteLink(id) {
  const target = state.config.links.find((link) => link.id === id);
  if (!target) {
    return;
  }

  const ok = confirm(`确认删除链接：${target.name} ？`);
  if (!ok) {
    return;
  }

  state.config.links = state.config.links.filter((link) => link.id !== id);
  saveConfig();
  render();
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return String(Date.now());
}

function exportConfig() {
  const text = JSON.stringify(state.config, null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `personal-links-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function importConfig(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const configCandidate = extractConfigFromAnyPayload(parsed);
    const importedConfig = sanitizeConfig(configCandidate);

    if (!Array.isArray(importedConfig.links) || importedConfig.links.length === 0) {
      alert("导入失败：配置中没有可用链接。");
      return;
    }

    state.config = importedConfig;
    state.selectedCategory = ALL_CATEGORY;
    state.query = "";
    refs.searchInput.value = "";
    applyConfigText();
    saveConfig();
    render();
  } catch {
    alert("导入失败：JSON 文件格式不正确。");
  }
}

function resetConfig() {
  const ok = confirm("确认恢复默认配置吗？当前自定义内容会被覆盖。");
  if (!ok) {
    return;
  }

  state.config = cloneDefaultConfig();
  state.selectedCategory = ALL_CATEGORY;
  state.query = "";
  refs.searchInput.value = "";
  applyConfigText();
  saveConfig();
  render();
}

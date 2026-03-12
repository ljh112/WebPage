const STORAGE_KEY = "personal-portal-config-v1";
const ALL_CATEGORY = "全部";
const DEFAULT_SEARCH_ENGINE = "google";
const SEARCH_ENGINES = {
  google: {
    label: "Google",
    buildUrl: (keyword) => `https://www.google.com/search?q=${encodeURIComponent(keyword)}`
  },
  bing: {
    label: "Bing",
    buildUrl: (keyword) => `https://www.bing.com/search?q=${encodeURIComponent(keyword)}`
  },
  baidu: {
    label: "百度",
    buildUrl: (keyword) => `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}`
  },
  duckduckgo: {
    label: "DuckDuckGo",
    buildUrl: (keyword) => `https://duckduckgo.com/?q=${encodeURIComponent(keyword)}`
  }
};

const defaultConfig = {
  siteTitle: "我的链接主页",
  heroTitle: "高频链接，一页直达",
  heroDesc: "将常用工具聚合到一个页面，支持分类、搜索、快捷键和自定义管理。",
  searchEngine: DEFAULT_SEARCH_ENGINE,
  links: [
    { id: "1", name: "Gmail", url: "https://mail.google.com", category: "邮件", icon: "✉️" },
    { id: "2", name: "GitHub", url: "https://github.com", category: "开发", icon: "🐙" },
    { id: "3", name: "Notion", url: "https://www.notion.so", category: "笔记", icon: "📝" },
    { id: "4", name: "Google Drive", url: "https://drive.google.com", category: "云盘", icon: "☁️" },
    { id: "5", name: "YouTube", url: "https://www.youtube.com", category: "学习", icon: "▶️" },
    { id: "6", name: "ChatGPT", url: "https://chatgpt.com", category: "AI", icon: "🤖" },
    { id: "7", name: "飞书", url: "https://www.feishu.cn", category: "协作", icon: "💬" },
    { id: "8", name: "Bilibili", url: "https://www.bilibili.com", category: "学习", icon: "📺" },
    { id: "9", name: "掘金", url: "https://juejin.cn", category: "开发", icon: "💡" },
    { id: "10", name: "V2EX", url: "https://www.v2ex.com", category: "社区", icon: "🧭" }
  ]
};

const refs = {
  siteTitle: document.getElementById("site-title"),
  heroTitle: document.getElementById("hero-title"),
  heroDesc: document.getElementById("hero-desc"),
  linkCount: document.getElementById("link-count"),
  chips: document.getElementById("category-chips"),
  grid: document.getElementById("links-grid"),
  template: document.getElementById("link-card-template"),
  webSearchEngine: document.getElementById("web-search-engine"),
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

const state = {
  config: loadConfig(),
  selectedCategory: ALL_CATEGORY,
  query: "",
  visibleLinks: []
};

applyConfigText();
render();
bindEvents();

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

function loadConfig() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return cloneDefaultConfig();
  }

  try {
    const parsed = JSON.parse(raw);
    return sanitizeConfig(parsed);
  } catch {
    return cloneDefaultConfig();
  }
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.config));
}

function cloneDefaultConfig() {
  return JSON.parse(JSON.stringify(defaultConfig));
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
  refs.heroTitle.textContent = state.config.heroTitle;
  refs.heroDesc.textContent = state.config.heroDesc;
  syncWebSearchEngineUI();
}

function syncWebSearchEngineUI() {
  const engineId = getSearchEngineId(state.config.searchEngine);
  state.config.searchEngine = engineId;
  refs.webSearchEngine.value = engineId;
  refs.webSearchInput.placeholder = `使用 ${SEARCH_ENGINES[engineId].label} 搜索`;
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
    name.textContent = link.name;
    category.textContent = link.category;
    icon.textContent = link.icon || "🔗";
    indexText.textContent = index < 9 ? `[${index + 1}]` : "";

    editBtn.addEventListener("click", () => openDialog(link));
    deleteBtn.addEventListener("click", () => deleteLink(link.id));

    refs.grid.appendChild(card);
  });
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

function saveFromDialog(event) {
  event.preventDefault();

  const id = refs.formId.value.trim();
  const name = refs.formName.value.trim();
  const category = refs.formCategory.value.trim();
  const icon = refs.formIcon.value.trim();
  const url = normalizeUrl(refs.formUrl.value.trim());

  if (!name || !category || !url) {
    alert("请完整填写名称、分类和可用 URL。");
    return;
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
    const nextConfig = sanitizeConfig(parsed);
    if (!Array.isArray(nextConfig.links) || nextConfig.links.length === 0) {
      alert("导入失败：配置中没有可用链接。");
      return;
    }

    state.config = nextConfig;
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

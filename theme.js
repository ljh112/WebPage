const THEME_STORAGE_KEY = "personal-portal-theme-v1";
const THEMES = [
  { id: "aurora", label: "极光" },
  { id: "graphite", label: "石墨" },
  { id: "paper", label: "晨曦" }
];

function resolveThemeId(rawThemeId) {
  const text = String(rawThemeId || "").trim().toLowerCase();
  return THEMES.some((theme) => theme.id === text) ? text : THEMES[0].id;
}

function readThemeId() {
  try {
    return resolveThemeId(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return THEMES[0].id;
  }
}

function writeThemeId(themeId) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch {}
}

function applyTheme(themeId) {
  const nextThemeId = resolveThemeId(themeId);
  document.documentElement.dataset.theme = nextThemeId;
  return nextThemeId;
}

function getThemeLabel(themeId) {
  const theme = THEMES.find((item) => item.id === themeId);
  return theme ? theme.label : THEMES[0].label;
}

function getNextThemeId(currentThemeId) {
  const index = THEMES.findIndex((theme) => theme.id === currentThemeId);
  const nextIndex = index >= 0 ? (index + 1) % THEMES.length : 0;
  return THEMES[nextIndex].id;
}

function updateThemeButton(button, currentThemeId) {
  const currentLabel = getThemeLabel(currentThemeId);
  const nextLabel = getThemeLabel(getNextThemeId(currentThemeId));
  button.textContent = `主题 ${currentLabel}`;
  button.title = `点击切换到 ${nextLabel}`;
}

function initThemeSwitcher() {
  let currentThemeId = applyTheme(readThemeId());
  const button = document.getElementById("theme-toggle-btn");
  if (!button) {
    return;
  }

  updateThemeButton(button, currentThemeId);
  button.addEventListener("click", () => {
    currentThemeId = applyTheme(getNextThemeId(currentThemeId));
    writeThemeId(currentThemeId);
    updateThemeButton(button, currentThemeId);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeSwitcher);
} else {
  initThemeSwitcher();
}

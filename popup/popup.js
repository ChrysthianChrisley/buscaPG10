const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxE0YtRPXkKbmkajPk0qa22V6ObxIfLaYisWbJ35S-Rs263Opv6BdzImffiq1yk6G2K/exec";
const STORAGE_KEY_URL = "pg10_script_url";
const STORAGE_KEY_HISTORY = "pg10_search_history";

// DOM Elements
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const btnClearInput = document.getElementById("btn-clear-input");
const btnSearch = document.getElementById("btn-search");
const searchSpinner = btnSearch.querySelector(".spinner");
const searchBtnText = btnSearch.querySelector(".btn-text");

const resultCard = document.getElementById("result-card");
const resultBadge = document.getElementById("result-badge");
const queryPreview = document.getElementById("query-preview");
const resultText = document.getElementById("result-text");
const btnCopyResult = document.getElementById("btn-copy-result");

const historyList = document.getElementById("history-list");
const btnClearHistory = document.getElementById("btn-clear-history");

const btnToggleSettings = document.getElementById("btn-toggle-settings");
const btnCloseSettings = document.getElementById("btn-close-settings");
const settingsPanel = document.getElementById("settings-panel");
const scriptUrlInput = document.getElementById("script-url-input");
const btnSaveSettings = document.getElementById("btn-save-settings");
const btnResetUrl = document.getElementById("btn-reset-url");
const btnTestConn = document.getElementById("btn-test-conn");
const settingsStatus = document.getElementById("settings-status");

// Storage Helper
async function getScriptUrl() {
  try {
    const data = await chrome.storage.sync.get(STORAGE_KEY_URL);
    return data[STORAGE_KEY_URL] || DEFAULT_SCRIPT_URL;
  } catch {
    const data = await chrome.storage.local.get(STORAGE_KEY_URL);
    return data[STORAGE_KEY_URL] || DEFAULT_SCRIPT_URL;
  }
}

async function setScriptUrl(url) {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY_URL]: url });
  } catch {
    await chrome.storage.local.set({ [STORAGE_KEY_URL]: url });
  }
}

async function getHistory() {
  const data = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
  return data[STORAGE_KEY_HISTORY] || [];
}

async function saveHistoryItem(query, result) {
  let history = await getHistory();
  // Filter out existing occurrence of this query
  history = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());
  // Add to top
  history.unshift({
    query,
    result,
    timestamp: Date.now()
  });
  // Keep last 10
  if (history.length > 10) {
    history = history.slice(0, 10);
  }
  await chrome.storage.local.set({ [STORAGE_KEY_HISTORY]: history });
  renderHistory(history);
}

// Render History
function renderHistory(history) {
  historyList.innerHTML = "";
  if (!history || history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">Nenhuma busca recente.</div>';
    return;
  }

  history.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";

    const content = document.createElement("div");
    content.className = "history-item-content";

    const querySpan = document.createElement("span");
    querySpan.className = "history-query";
    querySpan.textContent = item.query;

    const resultSpan = document.createElement("span");
    resultSpan.className = "history-result";
    resultSpan.textContent = item.result;

    content.appendChild(querySpan);
    content.appendChild(resultSpan);

    const copyBtn = document.createElement("button");
    copyBtn.className = "history-copy-btn";
    copyBtn.title = "Copiar resultado";
    copyBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;

    copyBtn.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(item.result);
      copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        `;
      }, 1500);
    };

    div.onclick = () => {
      searchInput.value = item.query;
      showResult(item.query, item.result);
      updateClearButton();
    };

    div.appendChild(content);
    div.appendChild(copyBtn);
    historyList.appendChild(div);
  });
}

// Show Result in Card
function showResult(query, result) {
  resultCard.classList.remove("hidden");
  queryPreview.textContent = `Busca: "${query}"`;
  resultText.value = result;

  const isNotFound = result.toLowerCase().includes("nenhum resultado") || result.toLowerCase().includes("erro");
  if (isNotFound) {
    resultBadge.textContent = "Aviso";
    resultBadge.classList.add("not-found");
  } else {
    resultBadge.textContent = "Resultado Encontrado";
    resultBadge.classList.remove("not-found");
  }

  // Auto-scroll to result
  resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Perform Search
async function performSearch(query) {
  if (!query || !query.trim()) return;
  const trimmed = query.trim();

  // Set loading state
  btnSearch.disabled = true;
  searchSpinner.classList.remove("hidden");
  searchBtnText.textContent = "Buscando...";

  try {
    const scriptUrl = await getScriptUrl();
    const url = `${scriptUrl}?q=${encodeURIComponent(trimmed)}`;

    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Erro na conexão HTTP: ${response.status}`);
    }

    const resultado = await response.text();
    showResult(trimmed, resultado);
    await saveHistoryItem(trimmed, resultado);
  } catch (error) {
    const erroMsg = `Erro ao buscar na planilha: ${error.message}. Verifique sua conexão ou a URL do script.`;
    showResult(trimmed, erroMsg);
  } finally {
    btnSearch.disabled = false;
    searchSpinner.classList.add("hidden");
    searchBtnText.textContent = "Pesquisar";
  }
}

// Clear input button visibility
function updateClearButton() {
  if (searchInput.value.trim().length > 0) {
    btnClearInput.classList.remove("hidden");
  } else {
    btnClearInput.classList.add("hidden");
  }
}

// Show Settings Status Message
function showSettingsStatus(message, isSuccess = true) {
  settingsStatus.textContent = message;
  settingsStatus.className = `status-msg ${isSuccess ? "success" : "error"}`;
  settingsStatus.classList.remove("hidden");

  setTimeout(() => {
    settingsStatus.classList.add("hidden");
  }, 3500);
}

// Event Listeners
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  performSearch(searchInput.value);
});

searchInput.addEventListener("input", updateClearButton);

btnClearInput.addEventListener("click", () => {
  searchInput.value = "";
  updateClearButton();
  searchInput.focus();
});

btnCopyResult.addEventListener("click", () => {
  const text = resultText.value;
  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    btnCopyResult.classList.add("copied");
    const copyText = btnCopyResult.querySelector(".copy-text");
    const originalText = copyText.textContent;
    copyText.textContent = "Copiado!";

    setTimeout(() => {
      btnCopyResult.classList.remove("copied");
      copyText.textContent = originalText;
    }, 2000);
  });
});

btnClearHistory.addEventListener("click", async () => {
  await chrome.storage.local.remove(STORAGE_KEY_HISTORY);
  renderHistory([]);
});

// Settings Panel Events
btnToggleSettings.addEventListener("click", async () => {
  const isHidden = settingsPanel.classList.contains("hidden");
  if (isHidden) {
    const currentUrl = await getScriptUrl();
    scriptUrlInput.value = currentUrl;
    settingsPanel.classList.remove("hidden");
  } else {
    settingsPanel.classList.add("hidden");
  }
});

btnCloseSettings.addEventListener("click", () => {
  settingsPanel.classList.add("hidden");
});

btnSaveSettings.addEventListener("click", async () => {
  const newUrl = scriptUrlInput.value.trim();
  if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
    showSettingsStatus("Por favor, insira uma URL válida iniciando com https://", false);
    return;
  }
  await setScriptUrl(newUrl);
  showSettingsStatus("URL do Apps Script salva com sucesso!");
});

btnResetUrl.addEventListener("click", async () => {
  scriptUrlInput.value = DEFAULT_SCRIPT_URL;
  await setScriptUrl(DEFAULT_SCRIPT_URL);
  showSettingsStatus("URL padrão restaurada.");
});

btnTestConn.addEventListener("click", async () => {
  const urlToTest = scriptUrlInput.value.trim() || DEFAULT_SCRIPT_URL;
  btnTestConn.disabled = true;
  btnTestConn.textContent = "Testando...";

  try {
    const testUrl = `${urlToTest}?q=ping_teste`;
    const resp = await fetch(testUrl, { method: "GET" });
    if (resp.ok) {
      showSettingsStatus("Conexão bem sucedida com a planilha!");
    } else {
      showSettingsStatus(`Falha de conexão: Código HTTP ${resp.status}`, false);
    }
  } catch (err) {
    showSettingsStatus(`Erro de rede: ${err.message}`, false);
  } finally {
    btnTestConn.disabled = false;
    btnTestConn.textContent = "Testar Conexão";
  }
});

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  const history = await getHistory();
  renderHistory(history);
  searchInput.focus();
});

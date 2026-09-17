const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxE0YtRPXkKbmkajPk0qa22V6ObxIfLaYisWbJ35S-Rs263Opv6BdzImffiq1yk6G2K/exec";
const STORAGE_KEY_URL = "pg10_script_url";
const STORAGE_KEY_HISTORY = "pg10_search_history";
const CONTEXT_MENU_ID = "pesquisar-pg10-menu";

// Helper to get configured script URL
async function getScriptUrl() {
  try {
    const syncData = await chrome.storage.sync.get(STORAGE_KEY_URL);
    if (syncData && syncData[STORAGE_KEY_URL]) {
      return syncData[STORAGE_KEY_URL];
    }
  } catch (err) {
    console.warn("Storage sync indisponível, usando storage local:", err);
  }

  const localData = await chrome.storage.local.get(STORAGE_KEY_URL);
  return (localData && localData[STORAGE_KEY_URL]) || DEFAULT_SCRIPT_URL;
}

// Helper to save to history
async function saveSearchToHistory(query, result) {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
    let history = data[STORAGE_KEY_HISTORY] || [];
    history = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());
    history.unshift({
      query,
      result,
      timestamp: Date.now()
    });
    if (history.length > 10) history = history.slice(0, 10);
    await chrome.storage.local.set({ [STORAGE_KEY_HISTORY]: history });
  } catch (e) {
    console.warn("Não foi possível salvar no histórico:", e);
  }
}

// Função para registrar/re-registrar o menu de contexto garantindo atualização de ícone
function registrarMenuDeContexto() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: "Pesquisar PG-10",
      contexts: ["selection"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.log("Aviso menu contexto:", chrome.runtime.lastError.message);
      }
    });
  });
}

// Registra na instalação, inicialização e no carregamento do service worker
chrome.runtime.onInstalled.addListener(registrarMenuDeContexto);
chrome.runtime.onStartup.addListener(registrarMenuDeContexto);
registrarMenuDeContexto();

// Context Menu Click Handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID && info.menuItemId !== "pesquisar-processo") return;
  if (!tab || !tab.id) return;

  const query = (info.selectionText || "").trim();
  if (!query) return;

  try {
    // 1. Injeta imediatamente um feedback de carregamento na página
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: exibirModalCarregamento,
      args: [query]
    });

    // 2. Obtém a URL do script e faz a requisição de busca
    const scriptUrl = await getScriptUrl();
    const urlBusca = `${scriptUrl}?q=${encodeURIComponent(query)}`;

    const response = await fetch(urlBusca);
    if (!response.ok) {
      throw new Error(`Servidor respondeu com código ${response.status}`);
    }

    const resultado = await response.text();

    // 3. Salva no histórico para consulta futura no popup
    await saveSearchToHistory(query, resultado);

    // 4. Injeta o resultado com interface moderna
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: atualizarModalResultado,
      args: [query, resultado, false]
    });
  } catch (error) {
    console.error("Erro na busca PG-10:", error);
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: atualizarModalResultado,
        args: [
          query,
          `Erro ao consultar planilha: ${error.message}. Verifique a conexão ou a URL nas configurações da extensão.`,
          true
        ]
      });
    } catch (e) {
      console.error("Falha ao injetar erro no tab:", e);
    }
  }
});

// Função injetada na página: Exibe feedback imediato de carregamento
function exibirModalCarregamento(termo) {
  const antigo = document.getElementById("pg10-floating-modal");
  if (antigo) antigo.remove();

  const modal = document.createElement("div");
  modal.id = "pg10-floating-modal";
  modal.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    width: 320px;
    background: #0f172a;
    color: #f8fafc;
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
    padding: 16px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    animation: pg10FadeIn 0.2s ease-out;
  `;

  modal.innerHTML = `
    <style>
      @keyframes pg10FadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pg10Spin { to { transform: rotate(360deg); } }
      .pg10-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; border-top-color: #38bdf8; animation: pg10Spin 0.8s linear infinite; }
    </style>
    <div style="display: flex; align-items: center; gap: 10px;">
      <span class="pg10-spinner"></span>
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="font-weight: 600; color: #38bdf8; font-size: 13px;">Buscando no PG-10...</span>
        <span style="color: #94a3b8; font-size: 11px; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">"${termo}"</span>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// Função injetada na página: Renderiza o modal moderno com o resultado
function atualizarModalResultado(termo, resultado, isErro) {
  let modal = document.getElementById("pg10-floating-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "pg10-floating-modal";
    document.body.appendChild(modal);
  }

  modal.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    width: 360px;
    background: #0f172a;
    color: #f8fafc;
    border: 1px solid ${isErro ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)'};
    border-radius: 12px;
    box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
    padding: 16px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    box-sizing: border-box;
    transition: all 0.2s ease;
  `;

  const badgeText = isErro ? 'Erro' : 'Resultado PG-10';
  const badgeBg = isErro ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)';
  const badgeColor = isErro ? '#fca5a5' : '#38bdf8';

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="background: ${badgeBg}; color: ${badgeColor}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
          ${badgeText}
        </span>
        <span style="font-size: 11px; color: #94a3b8; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${termo}">
          "${termo}"
        </span>
      </div>
      <button id="pg10-btn-close-x" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; line-height: 1; padding: 2px 6px;">&times;</button>
    </div>

    <div style="margin-bottom: 12px;">
      <textarea id="pg10-result-area" readonly style="
        width: 100%;
        height: 90px;
        background: #1e293b;
        color: #f1f5f9;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 6px;
        padding: 8px 10px;
        font-family: inherit;
        font-size: 12px;
        line-height: 1.4;
        box-sizing: border-box;
        resize: vertical;
        outline: none;
      ">${resultado}</textarea>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 8px;">
      <button id="pg10-btn-close" style="
        background: transparent;
        color: #94a3b8;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
      ">Fechar</button>

      <button id="pg10-btn-copy" style="
        background: #0284c7;
        color: #ffffff;
        border: none;
        border-radius: 6px;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: background 0.2s;
      ">Copiar</button>
    </div>
  `;

  // Focus & Select
  const area = modal.querySelector("#pg10-result-area");
  if (area) {
    area.focus();
    area.select();
  }

  // Close handlers
  const fecharModal = () => {
    modal.remove();
    document.removeEventListener("keydown", onKeyDown);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") fecharModal();
  };
  document.addEventListener("keydown", onKeyDown);

  modal.querySelector("#pg10-btn-close-x").onclick = fecharModal;
  modal.querySelector("#pg10-btn-close").onclick = fecharModal;

  // Copy handler
  const btnCopy = modal.querySelector("#pg10-btn-copy");
  btnCopy.onclick = () => {
    area.select();
    navigator.clipboard.writeText(resultado).then(() => {
      btnCopy.innerText = "✓ Copiado!";
      btnCopy.style.backgroundColor = "#10b981";
      setTimeout(() => {
        btnCopy.innerText = "Copiar";
        btnCopy.style.backgroundColor = "#0284c7";
      }, 2000);
    });
  };
}
// Cria o menu de botão direito quando a extensão for instalada
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "pesquisar-processo",
    title: "Pesquisar PG-10",
    contexts: ["selection"]
  });
});

// O que acontece quando o botão é clicado
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "pesquisar-processo") {
    const query = info.selectionText; 
    
    // ATENÇÃO: Cole a URL do seu Web App aqui
    const scriptUrl = "https://script.google.com/macros/s/AKfycbxE0YtRPXkKbmkajPk0qa22V6ObxIfLaYisWbJ35S-Rs263Opv6BdzImffiq1yk6G2K/exec"
    
    const urlBusca = `${scriptUrl}?q=${encodeURIComponent(query)}`;

    // Faz a requisição na sua planilha de forma silenciosa
    fetch(urlBusca)
      .then(response => response.text())
      .then(resultado => {
        // Injeta a função que cria o modal na página atual
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: criarModalResultado,
          args: [resultado]
        });
      })
      .catch(error => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: criarModalResultado,
          args: ["Erro ao conectar com a planilha. Verifique a URL do script."]
        });
      });
  }
});

// Função que roda na tela do usuário para criar a janelinha com o botão Copiar
function criarModalResultado(texto) {
  // Se já existir um modal aberto, remove para não acumular
  const modalAntigo = document.getElementById("meu-modal-processos");
  if (modalAntigo) {
    modalAntigo.remove();
  }

  // Cria o container principal (a caixinha)
  const modal = document.createElement("div");
  modal.id = "meu-modal-processos";
  modal.style.position = "fixed";
  modal.style.top = "20px";
  modal.style.right = "20px";
  modal.style.width = "350px";
  modal.style.backgroundColor = "#ffffff";
  modal.style.border = "1px solid #ccc";
  modal.style.borderRadius = "8px";
  modal.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  modal.style.padding = "16px";
  modal.style.zIndex = "9999999";
  modal.style.fontFamily = "Arial, sans-serif";

  // Cria o título
  const titulo = document.createElement("h3");
  titulo.innerText = "Resultado da Busca";
  titulo.style.marginTop = "0";
  titulo.style.fontSize = "16px";
  titulo.style.color = "#333";
  modal.appendChild(titulo);

  // Cria a área de texto (onde o resultado aparece e pode ser selecionado)
  const areaTexto = document.createElement("textarea");
  areaTexto.value = texto;
  areaTexto.readOnly = true;
  areaTexto.style.width = "100%";
  areaTexto.style.height = "80px";
  areaTexto.style.boxSizing = "border-box";
  areaTexto.style.marginBottom = "12px";
  areaTexto.style.padding = "8px";
  areaTexto.style.borderRadius = "4px";
  areaTexto.style.border = "1px solid #ccc";
  areaTexto.style.resize = "none";
  modal.appendChild(areaTexto);

  // Cria o container para os botões
  const divBotoes = document.createElement("div");
  divBotoes.style.display = "flex";
  divBotoes.style.justifyContent = "flex-end";
  divBotoes.style.gap = "8px";

  // Botão Copiar
  const btnCopiar = document.createElement("button");
  btnCopiar.innerText = "Copiar";
  btnCopiar.style.padding = "6px 12px";
  btnCopiar.style.cursor = "pointer";
  btnCopiar.style.backgroundColor = "#0b57d0";
  btnCopiar.style.color = "white";
  btnCopiar.style.border = "none";
  btnCopiar.style.borderRadius = "4px";
  btnCopiar.onclick = () => {
    areaTexto.select();
    navigator.clipboard.writeText(texto).then(() => {
      btnCopiar.innerText = "Copiado!";
      btnCopiar.style.backgroundColor = "#188038"; // Fica verde
      setTimeout(() => {
        btnCopiar.innerText = "Copiar";
        btnCopiar.style.backgroundColor = "#0b57d0"; // Volta ao azul
      }, 2000);
    });
  };
  divBotoes.appendChild(btnCopiar);

  // Botão Fechar
  const btnFechar = document.createElement("button");
  btnFechar.innerText = "Fechar";
  btnFechar.style.padding = "6px 12px";
  btnFechar.style.cursor = "pointer";
  btnFechar.style.backgroundColor = "#f1f3f4";
  btnFechar.style.color = "#3c4043";
  btnFechar.style.border = "1px solid #dadce0";
  btnFechar.style.borderRadius = "4px";
  btnFechar.onclick = () => {
    modal.remove();
  };
  divBotoes.appendChild(btnFechar);

  modal.appendChild(divBotoes);
  document.body.appendChild(modal);
}
# 🔍 Pesquisar Processos (PG-10) — Extensão Microsoft Edge / Chrome

Extensão de alta produtividade para busca rápida de processos e relatos na planilha Google (PG-10) diretamente pelo navegador, via menu de contexto ou pela barra de ferramentas.

---

## ✨ Principais Recursos

- **🎨 Ícones em Alta Resolução**: Ícones dedicados e nítidos (16x16, 48x48 e 128x128 px) com gradiente e identificação visual instantânea na barra de extensões.
- **🖱️ Busca pelo Menu de Contexto**: Selecione qualquer número de processo ou origem em qualquer site/sistema (SEI, intranet, portal), clique com o botão direito e selecione **"Pesquisar PG-10"**.
- **⚡ Feedback Instantâneo de Carregamento**: Ao acionar a busca, uma notificação flutuante informa o processamento imediatamente, eliminando a sensação de espera.
- **📋 Modal Flutuante com Cópia em 1 Clique**: Exibe o resultado de forma limpa, com botão "Copiar" que confirma com feedback visual verde e atalho <kbd>ESC</kbd> para fechar.
- **🧩 Popup Moderno na Barra de Ferramentas**:
  - Busca manual digitando ou colando qualquer processo ou origem.
  - Histórico das últimas buscas realizadas para reuso e cópia imediata.
  - Painel de configurações para testar ou atualizar a URL do Google Apps Script com persistência no `chrome.storage`.

---

## 🚀 Como Instalar no Microsoft Edge

1. Abra o **Microsoft Edge** e acesse:
   ```text
   edge://extensions
   ```
2. No menu lateral esquerdo, ative a chave **"Modo de desenvolvedor"**.
3. Clique no botão **"Carregar descompactada"** no topo da página.
4. Selecione a pasta do projeto:
   ```text
   C:\Users\chrysthian.silva\Documents\buscaPG10-main
   ```
5. Pronto! A extensão estará instalada e o ícone do PG-10 aparecerá na sua barra de extensões.

> **Dica:** Para manter o ícone sempre visível na barra de ferramentas, clique no botão de extensões (peça de quebra-cabeça) e marque o botão de "olho" ao lado de **Pesquisar Processos (PG-10)**.

---

## 🧪 Como Testar

1. Abra o arquivo [test_page.html](test_page.html) no navegador dando dois cliques nele ou arrastando para o Edge.
2. Selecione qualquer texto de exemplo, clique com o botão direito e escolha **"Pesquisar PG-10"**.
3. Ou clique no ícone da extensão na barra de ferramentas e digite o termo desejado.

---

## 📁 Estrutura de Arquivos

```
buscaPG10-main/
├── manifest.json              # Manifesto Manifest V3 com permissões e declaração de ícones
├── background.js             # Service worker para menu de contexto e injeção do modal moderno
├── generate_icons.py          # Script gerador de ícones procedurais PNG
├── test_page.html             # Página interativa de testes locais
├── appsScript.js              # Código do Google Apps Script para implementação na planilha
├── icons/                     # Pasta com os ícones da extensão
│   ├── icon-16.png            # Ícone 16x16
│   ├── icon-48.png            # Ícone 48x48
│   └── icon-128.png           # Ícone 128x128
├── popup/                     # Interface da barra de ferramentas
│   ├── popup.html             # Estrutura do popup
│   ├── popup.css              # Estilo Fluent / Glassmorphism
│   └── popup.js               # Lógica de busca rápida, histórico e configurações
└── README.md                  # Documentação do projeto
```

---

## ⚙️ Configuração do Google Apps Script

Caso precise trocar o script publicado da planilha:
1. Clique no ícone da extensão na barra de ferramentas.
2. Clique no ícone de engrenagem ⚙️ no topo do popup.
3. Cole a nova URL gerada no Google Apps Script (`.../exec`).
4. Clique em **"Testar Conexão"** e depois em **"Salvar"**.

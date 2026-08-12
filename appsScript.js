/**
 * ID da Planilha.
 * É uma boa prática definir isso como uma constante global
 * para não ter que repetir em várias funções.
 */
const SPREADSHEET_ID = "1uKWP1jG0qa_r4BOi7iWLFUhu4bvcDCRBTqwWxKBrFps";

/**
 * Função principal do Web App.
 * Mescla a funcionalidade de buscar um processo específico (Extensão Chrome)
 * com o fornecimento de todos os dados da aba (Integração JSON/JSONP).
 */
function doGet(e) {
  var responseData;
  var sheetName;

  try {
    // 1. Determina qual aba carregar (Se não for passado, usa "PG-10")
    if (e.parameter.sheet) {
      sheetName = e.parameter.sheet;
    } else {
      sheetName = "PG-10"; // Aba padrão
    }

    // 2. Abre a planilha e a aba específica
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);

    if (!sheet) {
      // Se a aba não existir, prepara erro e verifica se era a extensão chamando
      if (e.parameter.q) {
        return ContentService.createTextOutput("Erro: A aba '" + sheetName + "' não foi encontrada.");
      }
      
      responseData = {
        status: "error",
        message: "A aba '" + sheetName + "' não foi encontrada."
      };
    } else {
      var lastRow = sheet.getLastRow();

      // =======================================================================
      // LÓGICA DA EXTENSÃO (Busca): Se existir 'e.parameter.q'
      // =======================================================================
      if (e.parameter.q) {
        var query = e.parameter.q.trim();
        var result = "Nenhum resultado encontrado para: " + query;

        if (lastRow >= 2) {
          // Pega da coluna A até a F
          var searchData = sheet.getRange("A2:F" + lastRow).getValues();

          for (var i = 0; i < searchData.length; i++) {
            var processo = String(searchData[i][0] || "").trim(); // Coluna A
            var origem = String(searchData[i][1] || "").trim();   // Coluna B
            var relato = String(searchData[i][5] || "").trim();   // Coluna F

            // Caso 1: Origem contém o texto -> Retorna Processo
            if (origem.includes(query)) {
              result = processo;
              break;
            }

            // Caso 2: Processo contém o texto -> Retorna Relato
            if (processo.includes(query)) {
              result = relato;
              break;
            }
          }
        }
        
        // Retorna APENAS o texto diretamente para o alerta da Extensão
        return ContentService.createTextOutput(result);
      }

      // =======================================================================
      // LÓGICA ORIGINAL: Retorna todos os dados em JSON
      // =======================================================================
      var data;
      if (lastRow < 2) {
        data = []; // Aba vazia ou só com cabeçalho
      } else {
        // Pega da coluna A até a G conforme código original
        data = sheet.getRange("A2:G" + lastRow).getValues();
      }
      
      // Prepara a resposta de sucesso
      responseData = {
        status: "success",
        sheet: sheetName,
        data: data
      };
    }

  } catch (err) {
    // 5. Captura de erro geral
    if (e.parameter.q) {
      return ContentService.createTextOutput("Erro ao buscar: " + err.toString());
    }

    responseData = {
      status: "error",
      message: "Erro ao acessar planilha",
      details: err.toString()
    };
  }

  // 6. Retorna os dados como JSONP (para o callback) ou JSON normal
  if (e.parameter.callback) {
    return ContentService
      .createTextOutput(e.parameter.callback + "(" + JSON.stringify(responseData) + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}
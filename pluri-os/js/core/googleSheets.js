
const GoogleSheets = (() => 
  console.log('googleSheets.js carregado com sucesso!');{
  const API_URL = 'https://script.google.com/macros/s/AKfycbz0S62FCz4DZc_olJSpXMo6TtmChJv3ygzcZUqu-0a-eWVwb8iApI_OOlgs-Bwx29MGiA/exec; // cole sua nova URL aqui

  async function readSheet(sheetName) {
    try {
      const url = `${API_URL}?sheet=${encodeURIComponent(sheetName)}&action=read`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[GoogleSheets] Erro ao ler:', error);
      return null;
    }
  }

  async function appendRow(sheetName, rowArray) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ sheet: sheetName, action: 'append', row: rowArray }),
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('[GoogleSheets] Erro ao adicionar:', error);
      return false;
    }
  }

  async function deleteRow(sheetName, id) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ sheet: sheetName, action: 'delete', id: id }),
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('[GoogleSheets] Erro ao deletar:', error);
      return false;
    }
  }

  return { readSheet, appendRow, deleteRow };
})();

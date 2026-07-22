/**
 * PLURI OS — Integração Google Sheets via Apps Script
 */
const GoogleSheets = (() => {
  const API_URL = 'https://script.google.com/macros/s/AKfycbyJgkqfD8nedj1-htnpFgZbsYHq7yoD_YH9-U3Srs4eZYnPuJH-ybT8DvkhLmbPM4NkHA/exec';

  async function readSheet(sheetName) {
    try {
      const url = `${API_URL}?sheet=${encodeURIComponent(sheetName)}&action=read`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      const data = await response.json();
      return data;
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
      if (result.error) throw new Error(result.error);
      return true;
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
      if (result.error) throw new Error(result.error);
      return true;
    } catch (error) {
      console.error('[GoogleSheets] Erro ao deletar:', error);
      return false;
    }
  }

  // Disponibiliza globalmente (redundante, mas seguro)
  window.GoogleSheets = { readSheet, appendRow, deleteRow };
  return { readSheet, appendRow, deleteRow };
})();

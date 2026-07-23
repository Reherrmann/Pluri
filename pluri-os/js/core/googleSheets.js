/**
 * PLURI OS — Integração Google Sheets via Apps Script
 */
const GoogleSheets = (() => {
  const API_URL = 'https://script.google.com/macros/s/AKfycbx2yrU7h1B-iOxaTHWjVdc9QFznc5QcFxj9g9qGUhpiCO7tsEzbLmDJ1x8h9XiK2jC3Jw/exec'; // ← sua URL de produção

  async function readSheet(sheetName) {
    try {
      const params = new URLSearchParams({ sheet: sheetName, action: 'read' });
      const response = await fetch(`${API_URL}?${params.toString()}`);
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[GoogleSheets] Erro ao ler:', error);
      return null;
    }
  }

  async function appendRow(sheetName, rowArray) {
    try {
      const params = new URLSearchParams({
        sheet: sheetName,
        action: 'append',
        row: JSON.stringify(rowArray)
      });
      const response = await fetch(`${API_URL}?${params.toString()}`);
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
      const params = new URLSearchParams({
        sheet: sheetName,
        action: 'delete',
        id: id
      });
      const response = await fetch(`${API_URL}?${params.toString()}`);
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      return true;
    } catch (error) {
      console.error('[GoogleSheets] Erro ao deletar:', error);
      return false;
    }
  }

  async function updateCell(sheetName, keyOrId, value) {
  try {
    const params = new URLSearchParams({
      sheet: sheetName,
      action: 'update',
      key: keyOrId,
      value: value
    });
    const response = await fetch(`${API_URL}?${params.toString()}`);
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    return true;
  } catch (error) {
    console.error('[GoogleSheets] Erro ao atualizar:', error);
    return false;
  }
}

  window.GoogleSheets = { readSheet, appendRow, deleteRow, updateCell };
  return { readSheet, appendRow, deleteRow, updateCell };
})();

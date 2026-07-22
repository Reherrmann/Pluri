/**
 * PLURI OS — Integração Google Sheets via Apps Script
 */
const GoogleSheets = (() => {
  const API_URL = 'https://script.google.com/macros/s/AKfycbx8rXK-0iDBSmBqP6wmOfpKhq1Kd_GvCdulDpLFhTDmAjPpbpVv_7zsUnkNFVuktDspBQ/exec';

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

  // (opcional) funções update, append, etc. podem ser adicionadas depois

  return { readSheet };
})();

// js/core/googleSheets.js
const GoogleSheets = (() => {
  const API_URL = 'https://script.google.com/macros/s/AKfycbxSG4mIx7IUVQOhz0Tr-2CuNdf-JDG7VhJKDMhNtElBU3APsBA6nn1UTW4CcAeJvq4K/exec';

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

  // ... (demais funções, se precisar de update/append)
  return { readSheet };
})();

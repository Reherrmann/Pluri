// Ajustes finos da visualização da ficha — somente Mentalita.
(function () {
  function formatBrazilianDate(value) {
    const text = String(value || '').trim();
    if (!text) return text;
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
    const slash = text.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/);
    if (slash) return `${slash[1]}-${slash[2]}-${slash[3]}`;
    return text;
  }

  function formatPatientProfileDates(root) {
    const scope = root || document;
    scope.querySelectorAll('.patient-info-item').forEach((item) => {
      const label = item.querySelector('.patient-info-label');
      const value = item.querySelector('.patient-info-value');
      if (!label || !value) return;
      const normalized = label.textContent.trim().toUpperCase();
      if (normalized !== 'DATA DE CADASTRO' && normalized !== 'DATA DE NASCIMENTO') return;

      const formatted = formatBrazilianDate(value.textContent);
      // Evita escrever o mesmo valor novamente: isso impede que o MutationObserver
      // dispare a si próprio em ciclo infinito.
      if (value.textContent.trim() !== formatted) value.textContent = formatted;
    });
  }

  function apply() {
    const container = document.getElementById('pageContainer');
    if (container) formatPatientProfileDates(container);
  }

  window.formatPatientProfileDates = formatPatientProfileDates;

  const start = () => {
    apply();
    const container = document.getElementById('pageContainer');
    if (!container || window.__MENTALITA_PROFILE_DATE_OBSERVER__) return;

    const observer = new MutationObserver(apply);
    observer.observe(container, { childList: true, subtree: true });
    window.__MENTALITA_PROFILE_DATE_OBSERVER__ = observer;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

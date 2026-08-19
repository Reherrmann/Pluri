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
      if (normalized === 'DATA DE CADASTRO' || normalized === 'DATA DE NASCIMENTO') {
        value.textContent = formatBrazilianDate(value.textContent);
      }
    });
  }

  function apply() {
    const container = document.getElementById('pageContainer');
    if (container) formatPatientProfileDates(container);
  }

  window.formatPatientProfileDates = formatPatientProfileDates;
  document.addEventListener('DOMContentLoaded', apply);
  const observer = new MutationObserver(apply);
  const start = () => {
    const container = document.getElementById('pageContainer');
    if (container) observer.observe(container, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

// js/config.js
const PLURI_CONFIG = {
    appsScript: {
        baseUrl: 'https://script.google.com/macros/s/AKfycbwK_grR-wvhEfpuK7Ytas2aFWKHGNzxlj39BdGc4WxbCMP3oM8Af9DjG0R4-Gx2tGZdDQ/exec',

        pacientes: 'https://script.google.com/macros/s/AKfycbwK_grR-wvhEfpuK7Ytas2aFWKHGNzxlj39BdGc4WxbCMP3oM8Af9DjG0R4-Gx2tGZdDQ/exec?action=read&sheet=Pacientes',

        agendamentos: 'https://script.google.com/macros/s/AKfycbwK_grR-wvhEfpuK7Ytas2aFWKHGNzxlj39BdGc4WxbCMP3oM8Af9DjG0R4-Gx2tGZdDQ/exec?action=read&sheet=Agendamentos',

        equipe: 'https://script.google.com/macros/s/AKfycbwK_grR-wvhEfpuK7Ytas2aFWKHGNzxlj39BdGc4WxbCMP3oM8Af9DjG0R4-Gx2tGZdDQ/exec?action=read&sheet=Equipe',

        conversas: 'https://script.google.com/macros/s/AKfycbwK_grR-wvhEfpuK7Ytas2aFWKHGNzxlj39BdGc4WxbCMP3oM8Af9DjG0R4-Gx2tGZdDQ/exec?action=read&sheet=Contatos_e_Agendamentos',

        prontuarios: 'https://script.google.com/macros/s/AKfycbwK_grR-wvhEfpuK7Ytas2aFWKHGNzxlj39BdGc4WxbCMP3oM8Af9DjG0R4-Gx2tGZdDQ/exec?action=read&sheet=Prontuarios',

        salvarAgendamento: 'https://script.google.com/macros/s/AKfycbwK_grR-wvhEfpuK7Ytas2aFWKHGNzxlj39BdGc4WxbCMP3oM8Af9DjG0R4-Gx2tGZdDQ/exec',

        calendarEvents: 'https://script.google.com/macros/s/AKfycbwK_grR-wvhEfpuK7Ytas2aFWKHGNzxlj39BdGc4WxbCMP3oM8Af9DjG0R4-Gx2tGZdDQ/exec?action=calendar',

        calendarEventsDate: 'https://script.google.com/macros/s/AKfycbwK_grR-wvhEfpuK7Ytas2aFWKHGNzxlj39BdGc4WxbCMP3oM8Af9DjG0R4-Gx2tGZdDQ/exec?action=calendar&date=',
    },
};

// Carrega o módulo de documentos sem alterar a ordem dos módulos existentes.
// O módulo só precisa estar disponível quando o usuário abrir a ficha do paciente.
(function loadPatientDocumentsModule() {
    function load() {
        if (window.renderPatientDocuments) return;
        const script = document.createElement('script');
        script.src = 'js/documentos.js';
        script.async = true;
        script.dataset.pluriDocuments = 'true';
        script.onerror = () => console.error('PLURI OS: não foi possível carregar js/documentos.js');
        document.head.appendChild(script);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load, { once: true });
    } else {
        load();
    }
})();
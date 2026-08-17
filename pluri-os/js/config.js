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
(function loadPatientDocumentsModule() {
    function connectRenderer() {
        if (window.__pluriDocumentsRendererConnected) return true;
        if (typeof window.renderPatientDocuments !== 'function') return false;
        if (typeof window.renderPatientSectionContent !== 'function') return false;

        const originalRenderer = window.renderPatientSectionContent;

        window.renderPatientSectionContent = function (section) {
            if (
                section === 'documentos' &&
                window.state &&
                state.selectedPatient
            ) {
                return window.renderPatientDocuments(state.selectedPatient);
            }

            return originalRenderer.apply(this, arguments);
        };

        window.__pluriDocumentsRendererConnected = true;
        return true;
    }

    function load() {
        if (!window.renderPatientDocuments) {
            const script = document.createElement('script');
            script.src = 'js/documentos.js';
            script.async = true;
            script.dataset.pluriDocuments = 'true';
            script.onload = function () {
                if (!connectRenderer()) {
                    const retry = setInterval(function () {
                        if (connectRenderer()) clearInterval(retry);
                    }, 50);
                    setTimeout(function () {
                        clearInterval(retry);
                    }, 10000);
                }
            };
            script.onerror = () => console.error('PLURI OS: não foi possível carregar js/documentos.js');
            document.head.appendChild(script);
        } else {
            connectRenderer();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load, { once: true });
    } else {
        load();
    }
})();
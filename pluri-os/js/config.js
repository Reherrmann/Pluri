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

// =====================================================
// PLURI OS — carregamento do módulo Convênios
// O módulo é carregado sem alterar a ordem dos demais scripts.
// =====================================================
(function loadConveniosModule() {
    const script = document.createElement('script');
    script.src = 'js/convenios.js?v=1';
    script.onload = installConveniosModule;
    script.onerror = () => console.error('❌ Não foi possível carregar convenios.js');
    document.head.appendChild(script);
})();

function installConveniosModule() {
    const install = () => {
        if (typeof buildConvenios !== 'function') return false;
        if (window.__pluriConveniosInstalled) return true;
        window.__pluriConveniosInstalled = true;

        // Adiciona a aba no menu, logo após Pacientes.
        const nav = document.querySelector('.sidebar-nav');
        if (nav && !nav.querySelector('[data-page="convenios"]')) {
            const patientsLink = nav.querySelector('[data-page="pacientes"]');
            const link = document.createElement('a');
            link.dataset.page = 'convenios';
            link.innerHTML = '<i data-lucide="shield-check"></i><span>Convênios</span>';
            if (patientsLink?.nextSibling) nav.insertBefore(link, patientsLink.nextSibling);
            else nav.appendChild(link);
            link.addEventListener('click', e => {
                e.preventDefault();
                if (typeof navigateTo === 'function') navigateTo('convenios');
            });
            if (window.lucide?.createIcons) window.lucide.createIcons();
        }

        // Estende o roteador atual sem substituir nenhuma página existente.
        const originalRenderPage = window.renderPage;
        if (typeof originalRenderPage === 'function' && !window.__pluriConveniosRenderWrapped) {
            window.__pluriConveniosRenderWrapped = true;
            window.renderPage = function () {
                if (window.state?.currentPage !== 'convenios') {
                    return originalRenderPage.apply(this, arguments);
                }

                const container = document.getElementById('pageContainer');
                if (!container) return;
                container.innerHTML = buildConvenios();

                const title = document.getElementById('pageTitle');
                const subtitle = document.getElementById('pageSubtitle');
                if (title) title.textContent = 'Convênios';
                if (subtitle) subtitle.textContent = 'Gerencie operadoras, planos, procedimentos e regras de atendimento.';

                if (typeof refreshIcons === 'function') refreshIcons();
                if (typeof loadConvenios === 'function') loadConvenios();
            };
        }

        return true;
    };

    if (!install()) {
        const timer = setInterval(() => {
            if (install()) clearInterval(timer);
        }, 100);
        setTimeout(() => clearInterval(timer), 10000);
    }
}

// =====================================================
// Integração Convênios → Ficha do Paciente
// O módulo aguarda o carregamento de slidepanel.js e
// substitui os campos de convênio/plano por seletores.
// =====================================================
(function loadConveniosPacienteModule() {
    const script = document.createElement('script');
    script.src = 'js/convenios-paciente.js?v=1';
    script.onerror = () => console.error('❌ Não foi possível carregar convenios-paciente.js');
    document.head.appendChild(script);
})();

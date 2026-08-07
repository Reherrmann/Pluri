// js/app.js

function renderPage() {
    const container = getEl('pageContainer');
    if (!container) return;
    const title = getEl('pageTitle');
    const subtitle = getEl('pageSubtitle');

    let html = '';
    try {
        switch (state.currentPage) {
            case 'dashboard': html = buildDashboard(); break;
            case 'agenda': html = buildAgenda(); break;
            case 'atendimentos': html = buildAtendimentos(); break;
            case 'pacientes': html = buildPacientes(); break;
            case 'automacoes': html = buildAutomacoes(); break;
            case 'indicadores': html = buildIndicadores(); break;
            case 'configuracoes': html = buildConfiguracoes(); break;   // ✅ síncrono, função original
            default: html = buildDashboard();
        }
    } catch (e) {
        console.error('Erro ao renderizar página:', e);
        html = '<div style="padding:40px;text-align:center;color:#B91C1C;">Erro ao carregar a página.</div>';
    }

    container.innerHTML = html;
    attachPageEvents();
    refreshIcons();
    updateTitleAndSubtitle(title, subtitle);

    if (window._calendarNotConnected) {
        const connectBtn = document.getElementById('btnConnectCalendar');
        if (connectBtn) connectBtn.style.display = 'inline-block';
    }

    if (state.currentPage === 'configuracoes') {
        updateGoogleCalendarStatus();
    }
}

// ... (o restante do app.js permanece igual ao que você tinha antes, com updateTitleAndSubtitle, attachPageEvents, init, etc.)
// Apenas certifique-se de que a função updateGoogleCalendarStatus está definida (ela já estava no configuracoes.js, mas pode ficar no app.js também se antes estava lá).
// Se antes ela estava no configuracoes.js, mantenha-a lá. Se estava no app.js, coloque-a aqui.
// Vou supor que estava no configuracoes.js, então não precisa duplicar.

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
            case 'configuracoes': html = buildConfiguracoes(); break;
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

// As demais funções (updateTitleAndSubtitle, attachPageEvents, getSessionToken, init, deleteAppointmentById, confirmAppointmentById) permanecem exatamente como estavam antes das mudanças de Clínica/Equipe.
// Utilize o conteúdo original que você tinha antes de eu sugerir alterações. Se não tiver, posso fornecer um init() genérico.

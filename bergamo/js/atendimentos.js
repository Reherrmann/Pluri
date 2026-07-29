// js/atendimentos.js
function buildAtendimentos() {
    return `
        <div class="card"><div class="card-body no-padding">
            ${state.conversations.map(c => `
            <div class="agenda-item" style="cursor:pointer;" data-conversation-id="${c.id}">
                <div class="agenda-avatar">${getInitials(c.patient)}</div>
                <div class="agenda-info">
                    <div class="agenda-name">${c.patient} <span style="font-weight:400;font-size:11px;color:var(--text-secondary);"><i data-lucide="message-circle" style="width:12px;height:12px;vertical-align:middle;"></i> ${c.channel}</span></div>
                    <div class="agenda-detail">${c.lastMsg}</div>
                </div>
                ${statusBadge(c.status)}
            </div>`).join('')}
        </div></div>`;
}

function openConversation(id) {
    const conv = state.conversations.find(c => c.id === id);
    if (!conv) return;
    const content = getEl('slideContent');
    if (!content) return;
    content.innerHTML = `
        <h3 style="margin-bottom:12px;">${conv.patient}</h3>
        <p style="font-size:13px;color:var(--text-secondary);">Canal: ${conv.channel}</p>
        <p style="font-size:13px;color:var(--text-secondary);">Última mensagem: ${conv.lastMsg}</p>
        <p style="font-size:13px;color:var(--text-secondary);">Horário: ${conv.time}</p>
        <div style="margin-top:16px;display:flex;gap:8px;">
            <button class="btn btn-sm btn-outline js-nav" data-page="pacientes">Ver paciente</button>
            <button class="btn btn-sm btn-outline" id="scheduleFromConversation">Agendar</button>
            <button class="btn btn-sm btn-primary" id="resolveConversationBtn">Marcar como resolvido</button>
        </div>`;
    getEl('resolveConversationBtn')?.addEventListener('click', () => {
        conv.status = 'Resolvido';
        closeSlidePanel();
        showToast('Atendimento marcado como resolvido.');
        renderPage();
    });
    getEl('scheduleFromConversation')?.addEventListener('click', () => {
        closeSlidePanel();
        navigateTo('agenda');
        setTimeout(() => {
            openModal(null, conv.patient, conv.phone || '');
        }, 100);
    });
    openSlidePanel();
}

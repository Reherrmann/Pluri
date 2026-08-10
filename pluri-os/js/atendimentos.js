// js/atendimentos.js
function buildAtendimentos() {
    return `
        <div class="card"><div class="card-body no-padding">
            ${state.conversations.map(c => `
            <div class="agenda-item" style="cursor:pointer;" data-conversation-id="${c.id}">
                <div class="agenda-avatar">${getInitials(c.patient)}</div>
                <div class="agenda-info">
                    <div class="agenda-name">${c.patient} <span style="font-weight:400;font-size:11px;color:var(--text-secondary);"><i data-lucide="message-circle" style="width:12px;height:12px;vertical-align:middle;"></i> ${c.channel}</span></div>
                    <div class="agenda-detail">${c.summary || c.lastMsg}</div>
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
        <p>
Resumo:
<br><br>
${conv.summary || conv.lastMsg}
</p>
        <p style="font-size:13px;color:var(--text-secondary);">Horário: ${conv.time}</p>
        <div style="margin-top:16px;">

    <div class="form-group">
        <label>Status da conversa</label>

        <select id="conversationStatus">
            <option value="Aguardando"
                ${conv.status === 'Aguardando' ? 'selected' : ''}>
                Aguardando
            </option>

            <option value="Resolvido"
                ${conv.status === 'Resolvido' ? 'selected' : ''}>
                Resolvido
            </option>

            <option value="Cancelado"
                ${conv.status === 'Cancelado' ? 'selected' : ''}>
                Cancelado
            </option>
        </select>
    </div>

    <div style="display:flex;gap:8px;margin-top:16px;">

        <button
            class="btn btn-sm btn-outline js-nav"
            data-page="pacientes">
            Ver paciente
        </button>

        <button
            class="btn btn-sm btn-outline"
            id="scheduleFromConversation">
            Agendar
        </button>

        <button
            class="btn btn-sm btn-primary"
            id="saveConversationStatus">
            Salvar
        </button>

    </div>

</div>`;
    getEl('saveConversationStatus')?.addEventListener('click', async () => {

    const status =
        getEl('conversationStatus')?.value || 'Aguardando';

    const saveBtn = getEl('saveConversationStatus');

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Salvando...';
    }

    if (!conv._row) {
        showToast('Não foi possível identificar a conversa na planilha.');

        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Salvar';
        }

        return;
    }

    const result =
        await window.pluriAPI.updateConversation(
            conv._row,
            status
        );

    if (!result?.success) {

        showToast('Não foi possível salvar o status.');

        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Salvar';
        }

        return;
    }

    conv.status = status;

    closeSlidePanel();

    showToast('Status da conversa atualizado.');

    state.conversations =
        await window.pluriAPI.getConversations();

    renderPage();
});
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

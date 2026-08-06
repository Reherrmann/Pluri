// js/configuracoes.js

/**
 * Retorna o HTML da página de Configurações.
 * (função síncrona – sem await – para não retornar Promise)
 */
function buildConfiguracoes() {
    return `
        <div class="card">
            <div class="card-header">
                <h3>Clínica</h3>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome</label>
                        <input id="clinicName" type="text" value="${state.clinic?.name || ''}">
                    </div>
                    <div class="form-group">
                        <label>Telefone</label>
                        <input id="clinicPhone" type="text" value="${state.clinic?.phone || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>E-mail</label>
                        <input id="clinicEmail" type="email" value="${state.clinic?.email || ''}">
                    </div>
                    <div class="form-group">
                        <label>Horário de funcionamento</label>
                        <input id="clinicSchedule" type="text" value="${state.clinic?.schedule || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Endereço</label>
                    <input id="clinicAddress" type="text" value="${state.clinic?.address || ''}">
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <h3>Equipe</h3>
                <button class="btn btn-primary btn-sm" id="newStaffBtn"><i data-lucide="plus" style="width:14px;height:14px;"></i> Novo membro</button>
            </div>
            <div class="card-body no-padding">
                <table class="data-table">
                    <thead><tr><th>Nome</th><th>Função</th><th>Status</th></tr></thead>
                    <tbody>${state.staff.map(s => `
                        <tr style="cursor:pointer;" data-staff-row="${s._row}">
                            <td style="font-weight:500;">${s.name}</td><td>${s.role}</td>
                            <td>${statusBadge(s.status)}</td>
                        </tr>`).join('')}</tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Integrações</h3></div>
            <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>WhatsApp</span>
                        ${statusBadge('Conectado')}
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;" id="googleCalendarIntegrationStatus">
                        <span>Google Calendar</span>
                        <!-- Placeholder inicial, será substituído pelo status real -->
                        <span style="color: #f59e0b;">Verificando…</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>E-mail</span>
                        ${statusBadge('Não conectado')}
                    </div>
                </div>
            </div>
        </div>`;
}

/**
 * Atualiza o status da integração com Google Calendar no DOM.
 * Deve ser chamada após a renderização da página de Configurações.
 */
async function updateGoogleCalendarStatus() {
    const statusDiv = document.getElementById('googleCalendarIntegrationStatus');
    if (!statusDiv) return;

    // Se não houver token, mostra como não configurado
    if (!window.pluriAPI || !window.pluriAPI.token) {
        statusDiv.innerHTML = '<span style="color: #f59e0b;">Não configurado</span>';
        return;
    }

    try {
        const connected = await window.pluriAPI.isCalendarConnected();
        if (connected) {
            statusDiv.innerHTML = '<span style="color:#10b981;font-weight:500;">Conectado</span>';
        } else {
            statusDiv.innerHTML = `<span style="color:#f59e0b;">Não conectado</span>
                <button class="btn btn-sm btn-outline" id="btnConnectCalendarConfig">Conectar</button>`;
            // Adiciona o evento de clique ao botão recém-criado
            document.getElementById('btnConnectCalendarConfig')?.addEventListener('click', async () => {
                try {
                    const url = await window.pluriAPI.getCalendarAuthUrl();
                    const popup = window.open(url, 'googleAuth', 'width=600,height=600');
                    const timer = setInterval(() => {
                        if (popup.closed) {
                            clearInterval(timer);
                            location.reload();
                        }
                    }, 500);
                } catch (e) {
                    alert('Erro ao conectar: ' + e.message);
                }
            });
        }
    } catch (e) {
        statusDiv.innerHTML = '<span style="color:#f59e0b;">Erro ao verificar</span>';
    }
}

// =========================================================
// Funções originais (mantenha-as exatamente como já estavam)
// =========================================================
function openNewStaff() { /* ... seu código original ... */ }
function openStaff(row) { /* ... seu código original ... */ }

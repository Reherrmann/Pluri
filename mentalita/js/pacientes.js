// js/pacientes.js — Pacientes + ficha em abas no padrão PLURI OS.

function ensurePatientProfileStyles() {
    if (document.getElementById('patientProfileStyles')) return;
    const link = document.createElement('link');
    link.id = 'patientProfileStyles';
    link.rel = 'stylesheet';
    link.href = 'css/patient-profile.css';
    document.head.appendChild(link);
}

function patientEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function patientInitials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function buildPacientes() {
    ensurePatientProfileStyles();
    return `
        <div class="search-bar" style="display:flex;gap:8px;">
            <input type="text" id="patientSearch" placeholder="Buscar por nome ou telefone..." style="flex:1;">
            <button class="btn btn-primary" id="newPatientBtn" type="button">
                <i data-lucide="plus" style="width:16px;height:16px;"></i>
                Novo paciente
            </button>
        </div>
        <div class="card">
            <div class="card-body no-padding" style="overflow-x:auto;">
                <table class="data-table">
                    <thead><tr>
                        <th>Paciente</th><th>Telefone</th><th>Último atendimento</th><th>Próxima consulta</th><th>Status</th><th></th>
                    </tr></thead>
                    <tbody id="patientTableBody">
                        ${state.patients.map(p => `
                            <tr style="cursor:pointer;" data-patient-row="${patientEscape(p._row)}" title="Abrir ficha do paciente">
                                <td><div class="patient-list-name"><span class="patient-avatar-list">${patientInitials(p.name)}</span><span style="font-weight:600;">${patientEscape(p.name)}</span></div></td>
                                <td>${patientEscape(p.phone || '—')}</td>
                                <td>${patientEscape(p.lastVisit || '—')}</td>
                                <td>${patientEscape(p.nextAppt || '—')}</td>
                                <td>${statusBadge(p.status || 'Ativo')}</td>
                                <td><i data-lucide="chevron-right" style="width:16px;height:16px;color:var(--text-secondary);"></i></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openPatient(row) {
    ensurePatientProfileStyles();
    const p = state.patients.find(pt => String(pt._row) === String(row));
    if (!p) return;
    state.currentPage = 'pacientes';
    state.selectedPatient = p;
    state.patientSection = 'dados-pessoais';
    try { localStorage.setItem('mentalita_navigation', JSON.stringify({ page:'pacientes', patientRow:String(row), patientSection:'dados-pessoais' })); } catch (_) {}
    renderPatientProfile();
}

async function renderPatientProfile() {
    ensurePatientProfileStyles();
    const container = getEl('pageContainer');
    const p = state.selectedPatient;
    if (!container || !p) { renderPage(); return; }

    const section = state.patientSection || 'dados-pessoais';
    container.innerHTML = `
        <div class="patient-profile">
            <button class="back-link" type="button" onclick="voltarParaLista()">
                <i data-lucide="arrow-left" style="width:16px;height:16px;"></i> Voltar para pacientes
            </button>
            <div class="patient-profile-header">
                <div class="patient-profile-avatar">${patientInitials(p.name)}</div>
                <div class="patient-profile-info">
                    <h2>${patientEscape(p.name)}</h2>
                    <p class="patient-profile-bio">${patientEscape(p.age ? `${p.age} anos` : (p.gender || 'Paciente'))}</p>
                    <p class="patient-profile-contact">Telefone: ${patientEscape(p.phone || '—')} · Status: ${patientEscape(p.status || 'Ativo')}</p>
                    <p class="patient-profile-id">ID: ${patientEscape(p._row || '—')}</p>
                </div>
                <div class="patient-profile-actions">
                    <button class="btn btn-outline" type="button" onclick="editPatient(${JSON.stringify(String(p._row))})">
                        <i data-lucide="pencil" style="width:15px;height:15px;"></i> Editar dados
                    </button>
                </div>
            </div>
            <div class="patient-profile-main">
                <aside class="patient-profile-sidebar">
                    <nav class="patient-profile-nav"><ul>
                        ${patientSectionNav('prontuario', 'Prontuário eletrônico', 'file-text', section)}
                        ${patientSectionNav('dados-pessoais', 'Dados pessoais', 'user', section)}
                        ${patientSectionNav('documentos', 'Documentos', 'folder', section)}
                        ${patientSectionNav('convenios', 'Convênios', 'badge-check', section)}
                        ${patientSectionNav('agendamentos', 'Agendamentos', 'calendar', section)}
                        ${patientSectionNav('financeiro', 'Financeiro', 'wallet', section)}
                        ${patientSectionNav('guias-tiss', 'Guias TISS', 'file-check-2', section)}
                    </ul></nav>
                </aside>
                <section class="patient-profile-content">${renderPatientSectionContent(section)}</section>
            </div>
        </div>
    `;
    refreshIcons();
}

function patientSectionNav(key, label, icon, active) {
    return `<li class="${active === key ? 'active' : ''}" onclick="openPatientSection('${key}')"><i data-lucide="${icon}" style="width:15px;height:15px;vertical-align:-3px;margin-right:6px;"></i>${label}</li>`;
}

function openPatientSection(section) {
    state.patientSection = section;
    try {
        const saved = JSON.parse(localStorage.getItem('mentalita_navigation') || '{}');
        localStorage.setItem('mentalita_navigation', JSON.stringify({ page:'pacientes', patientRow: state.selectedPatient?._row || saved.patientRow || null, patientSection:section }));
    } catch (_) {}
    renderPatientProfile();
}

function renderPatientSectionContent(section) {
    const p = state.selectedPatient;
    if (!p) return '';
    switch (section) {
        case 'dados-pessoais': return renderDadosPessoais(p);
        case 'prontuario': return renderProntuarioPaciente(p);
        case 'documentos': return renderPatientEmpty('Documentos', 'Os documentos deste paciente aparecerão aqui.', 'Adicionar documento');
        case 'convenios': return renderPatientEmpty('Convênios', 'A área está preparada para receber o vínculo de convênio e plano da ficha do PLURI OS.', 'Adicionar convênio');
        case 'agendamentos': return renderPatientAppointments(p);
        case 'financeiro': return renderPatientEmpty('Financeiro', 'A área financeira do paciente está preparada para a próxima integração com o Supabase.', null);
        case 'guias-tiss': return renderPatientEmpty('Guias TISS', 'As guias TISS do paciente aparecerão aqui.', 'Nova guia');
        default: return renderDadosPessoais(p);
    }
}

function infoItem(label, value, full = false) {
    return `<div class="patient-info-item${full ? ' full-width' : ''}"><span class="patient-info-label">${patientEscape(label)}</span><span class="patient-info-value">${patientEscape(value || '—')}</span></div>`;
}

function renderDadosPessoais(p) {
    return `<div class="patient-section">
        <h2>Dados pessoais</h2>
        <div class="patient-info-card"><h3>Identificação</h3><div class="patient-info-grid">
            ${infoItem('ID', p._row)}
            ${infoItem('Data de cadastro', p.created)}
            ${infoItem('Nome completo', p.name, true)}
            ${infoItem('Data de nascimento', p.birthDate)}
            ${infoItem('Idade', p.age)}
            ${infoItem('Sexo', p.gender)}
            ${infoItem('Estado civil', p.maritalStatus)}
        </div></div>
        <div class="patient-info-card"><h3>Contato</h3><div class="patient-info-grid">
            ${infoItem('E-mail', p.email)}
            ${infoItem('Telefone', p.phone)}
            ${infoItem('Celular', p.mobile)}
            ${infoItem('Enviar lembretes', p.sendReminders || 'Não')}
        </div></div>
        <div class="patient-info-card"><h3>Endereço</h3><div class="patient-info-grid">
            ${infoItem('CEP', p.zipCode)}
            ${infoItem('Endereço', [p.address, p.number].filter(Boolean).join(', '), true)}
            ${infoItem('Complemento', p.complement)}
            ${infoItem('Bairro', p.neighborhood)}
            ${infoItem('Cidade', p.city)}
            ${infoItem('Estado', p.state)}
        </div></div>
        <div class="patient-info-card"><h3>Documentação</h3><div class="patient-info-grid">
            ${infoItem('CPF', p.cpf)}
            ${infoItem('RG', p.rg)}
            ${infoItem('Profissão', p.profession)}
        </div></div>
        <div class="patient-info-card"><h3>Observações</h3><p class="patient-tab-note">${patientEscape(p.notes || 'Nenhuma observação cadastrada.')}</p></div>
    </div>`;
}

function renderProntuarioPaciente(p) {
    return `<div class="patient-section">
        <h2>Prontuário eletrônico</h2>
        <p class="section-subtitle">Histórico clínico e registros do paciente.</p>
        <div class="patient-info-card"><h3>Observações atuais</h3><p class="patient-tab-note">${patientEscape(p.notes || 'Nenhum registro clínico cadastrado.')}</p></div>
        <div class="patient-empty-state"><h3>Registros clínicos</h3><p>O layout da ficha já está preparado para os registros eletrônicos. A persistência clínica será conectada ao Supabase quando a tabela de prontuário estiver disponível.</p><button class="btn btn-outline btn-sm" type="button" disabled>Novo registro</button></div>
    </div>`;
}

function renderPatientAppointments(p) {
    const name = String(p.name || '').trim().toLowerCase();
    const items = (state.appointments || []).filter(a => String(a.patient || '').trim().toLowerCase() === name);
    if (!items.length) return renderPatientEmpty('Agendamentos', 'Nenhum agendamento encontrado para este paciente.', 'Novo agendamento');
    return `<div class="patient-section"><h2>Agendamentos</h2><p class="section-subtitle">Histórico e próximos horários deste paciente.</p><div class="patient-mini-list">${items.map(a => `
        <div class="patient-mini-item">
            <div class="patient-mini-time">${patientEscape(a.date || '—')}<br>${patientEscape(a.time || '—')}</div>
            <div class="patient-mini-main"><div class="patient-mini-title">${patientEscape(a.service || 'Consulta')}</div><div class="patient-mini-meta">${patientEscape(a.professional || 'Profissional não informado')}</div></div>
            ${statusBadge(a.status || 'Aguardando')}
        </div>`).join('')}</div></div>`;
}

function renderPatientEmpty(title, subtitle, buttonText) {
    return `<div class="patient-section"><h2>${patientEscape(title)}</h2><div class="patient-empty-state"><h3>${patientEscape(title)}</h3><p>${patientEscape(subtitle)}</p>${buttonText ? `<button class="btn btn-outline" type="button" disabled>${patientEscape(buttonText)}</button>` : ''}</div></div>`;
}

function voltarParaLista() {
    state.selectedPatient = null;
    state.patientSection = 'dados-pessoais';
    try { localStorage.setItem('mentalita_navigation', JSON.stringify({ page:'pacientes', patientRow:null, patientSection:null })); } catch (_) {}
    renderPage();
}

function openNewPatient() {
    const content = getEl('slideContent');
    if (!content) return;
    content.innerHTML = `<h3 style="margin-bottom:16px;">Novo paciente</h3>
        <div class="form-group"><label>Nome</label><input type="text" id="newPatientName"></div>
        <div class="form-group"><label>Telefone</label><input type="text" id="newPatientPhone"></div>
        <div class="form-group"><label>E-mail</label><input type="email" id="newPatientEmail"></div>
        <div class="form-group"><label>Observações</label><textarea id="newPatientNotes" rows="3"></textarea></div>
        <div style="margin-top:16px;display:flex;gap:8px;"><button class="btn btn-outline btn-sm" id="cancelNewPatient">Cancelar</button><button class="btn btn-primary btn-sm" id="saveNewPatient">Criar paciente</button></div>`;
    getEl('cancelNewPatient')?.addEventListener('click', closeSlidePanel);
    getEl('saveNewPatient')?.addEventListener('click', saveNewPatient);
    openSlidePanel();
}

async function saveNewPatient() {
    const name = getEl('newPatientName')?.value?.trim() || '';
    const phone = getEl('newPatientPhone')?.value?.trim() || '';
    const email = getEl('newPatientEmail')?.value?.trim() || '';
    const notes = getEl('newPatientNotes')?.value?.trim() || '';
    if (!name || !phone) { showToast('Preencha ao menos nome e telefone.'); return; }
    const button = getEl('saveNewPatient');
    if (button) { button.disabled = true; button.textContent = 'Salvando...'; }
    try {
        const result = await window.pluriAPI.createPatient({name, phone, email, notes, created:new Date().toISOString(), lastVisit:null, nextAppt:null, status:'Novo'});
        if (!result?.success) throw new Error(result?.error || 'Não foi possível salvar o paciente.');
        state.patients = await window.pluriAPI.getPatients();
        closeSlidePanel();
        showToast('Paciente criado com sucesso!');
        renderPage();
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Erro ao criar paciente.');
        if (button) { button.disabled = false; button.textContent = 'Criar paciente'; }
    }
}

// js/pacientes.js

// ============ FUNÇÃO PRINCIPAL ============
// Chamada pelo app.js para renderizar a página "Pacientes"
function buildPacientes() {
    return `
        <div class="search-bar" style="display:flex;gap:8px;">
            <input
                type="text"
                id="patientSearch"
                placeholder="Buscar por nome ou telefone..."
                style="flex:1;"
            >
            <button
                class="btn btn-primary"
                id="newPatientBtn"
                type="button">
                <i data-lucide="plus" style="width:16px;height:16px;"></i>
                Novo paciente
            </button>
        </div>

        <div class="card">
            <div class="card-body no-padding" style="overflow-x:auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Paciente</th>
                            <th>Telefone</th>
                            <th>Próxima consulta</th>
                            <th>Profissional</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="patientTableBody">
                        ${state.patients.map(p => `
                            <tr
                                style="cursor:pointer;"
                                data-patient-row="${p._row}"
                                title="Abrir ficha do paciente">
                                <td style="font-weight:500; display:flex; align-items:center; gap:8px;">
                                    <div class="patient-avatar-list">
                                        ${getInitials(p.name)}
                                    </div>
                                    ${escapeHtml(p.name)}
                                </td>
                                <td>${escapeHtml(p.phone || '—')}</td>
                                <td>${escapeHtml(p.nextAppt || '—')}</td>
                                <td>${escapeHtml(p.professional || '—')}</td>
                                <td>${statusBadge(p.status)}</td>
                                <td><i data-lucide="chevron-right" style="width:16px;height:16px;color:var(--text-secondary);"></i></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ============ FUNÇÃO AUXILIAR: INICIAIS ============
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ============ FICHA DO PACIENTE ============

// Agora openPatient(row) abre a ficha completa, não o painel lateral
function openPatient(row) {
    const p = state.patients.find(pt => pt._row === row);
    if (!p) return;

    state.selectedPatient = p;
    state.patientSection = 'dados-pessoais';

    renderPatientProfile();
}

// Função que renderiza a ficha no conteúdo principal
function renderPatientProfile() {
    const container = getMainContainer();
    if (!container) return;

    const p = state.selectedPatient;
    if (!p) {
        // Se não houver paciente selecionado, volta para a lista
        renderPage();
        return;
    }

    const initials = getInitials(p.name);
    const section = state.patientSection;
    const sectionContent = renderPatientSectionContent(section);

    const html = `
        <div class="patient-profile">
            <button class="back-link" onclick="voltarParaLista()">
                <i data-lucide="arrow-left" style="width:16px;height:16px;"></i>
                Voltar para pacientes
            </button>
            <div class="patient-profile-header">
                <div class="patient-profile-avatar">${initials}</div>
                <div class="patient-profile-info">
                    <h2>${escapeHtml(p.name)}</h2>
                    <p class="patient-profile-bio">
                        ${p.age ? escapeHtml(p.age) + ' anos · ' : ''}${escapeHtml(p.gender || '')}
                    </p>
                    <p class="patient-profile-contact">
                        Telefone: ${escapeHtml(p.phone || '—')} · Status: ${escapeHtml(p.status)}
                    </p>
                    <p class="patient-profile-id">ID: ${escapeHtml(p._row || '—')}</p>
                </div>
                <div class="patient-profile-actions">
                    <button class="btn btn-outline" onclick="editPatient(${p._row})">
                        Editar dados
                    </button>
                    <button class="btn btn-icon" onclick="openPatientMenu()" title="Mais ações">⋯</button>
                </div>
            </div>
            <div class="patient-profile-main">
                <aside class="patient-profile-sidebar">
                    <nav class="patient-profile-nav">
                        <ul>
                            <li class="${section === 'prontuario' ? 'active' : ''}" onclick="openPatientSection('prontuario')">Prontuário eletrônico</li>
                            <li class="${section === 'dados-pessoais' ? 'active' : ''}" onclick="openPatientSection('dados-pessoais')">Dados pessoais</li>
                            <li class="${section === 'documentos' ? 'active' : ''}" onclick="openPatientSection('documentos')">Documentos</li>
                            <li class="${section === 'convenios' ? 'active' : ''}" onclick="openPatientSection('convenios')">Convênios</li>
                            <li class="${section === 'agendamentos' ? 'active' : ''}" onclick="openPatientSection('agendamentos')">Agendamentos</li>
                            <li class="${section === 'financeiro' ? 'active' : ''}" onclick="openPatientSection('financeiro')">Financeiro</li>
                            <li class="${section === 'guias-tiss' ? 'active' : ''}" onclick="openPatientSection('guias-tiss')">Guias TISS</li>
                        </ul>
                    </nav>
                </aside>
                <section class="patient-profile-content">
                    ${sectionContent}
                </section>
            </div>
        </div>
    `;

    container.innerHTML = html;
    if (typeof refreshIcons === 'function') refreshIcons();
}

// Retorna o container principal onde o conteúdo da página é inserido
function getMainContainer() {
    // O app.js renderiza o conteúdo dentro de #pageContainer
    return (
        getEl('pageContainer') ||
        getEl('main-content') ||
        getEl('content') ||
        getEl('app') ||
        document.querySelector('main') ||
        document.body
    );
}

// Troca a seção ativa da ficha
function openPatientSection(section) {
    state.patientSection = section;
    renderPatientProfile();
}

// Renderiza o conteúdo da seção ativa
function renderPatientSectionContent(section) {
    const p = state.selectedPatient;
    if (!p) return '';

    switch (section) {
        case 'dados-pessoais':
            return renderDadosPessoais(p);
        case 'documentos':
            return renderEmptyState('Documentos do paciente', 'Os documentos deste paciente aparecerão aqui.', 'Adicionar documento');
        case 'convenios':
            return renderEmptyState('Convênios', 'Os convênios vinculados ao paciente aparecerão aqui.', 'Adicionar convênio');
        case 'agendamentos':
            return renderEmptyState('Agendamentos do paciente', 'Os próximos e anteriores agendamentos aparecerão aqui.', null);
        case 'financeiro':
            return renderEmptyState('Financeiro', 'As informações financeiras do paciente aparecerão aqui.', null);
        case 'guias-tiss':
            return renderEmptyState('Guias TISS', 'As guias TISS do paciente aparecerão aqui.', null);
        case 'prontuario':
            return renderEmptyState('Prontuário eletrônico', 'O prontuário eletrônico estará disponível em breve.', null);
        default:
            return '';
    }
}

// Renderiza a seção "Dados pessoais" com cards
function renderDadosPessoais(p) {
    const hasInsurance = p.hasInsurance && p.hasInsurance.toLowerCase() === 'sim';

    const insuranceCard = hasInsurance ? `
        <div class="patient-info-card">
            <h3>Convênio</h3>
            <div class="patient-info-grid">
                <div class="patient-info-item">
                    <span class="patient-info-label">Convênio</span>
                    <span class="patient-info-value">${escapeHtml(p.insuranceName || '—')}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Carteirinha</span>
                    <span class="patient-info-value">${escapeHtml(p.insuranceCard || '—')}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Plano</span>
                    <span class="patient-info-value">${escapeHtml(p.insurancePlan || '—')}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Validade</span>
                    <span class="patient-info-value">${escapeHtml(p.insuranceExpiration || '—')}</span>
                </div>
            </div>
        </div>
    ` : `
        <div class="patient-info-card">
            <h3>Convênio</h3>
            <p class="patient-info-value">Paciente particular</p>
        </div>
    `;

    return `
        <div class="patient-section">
            <h2>Dados pessoais</h2>
            <div class="patient-info-card">
                <h3>Identificação</h3>
                <div class="patient-info-grid">
                    <div class="patient-info-item">
                        <span class="patient-info-label">ID</span>
                        <span class="patient-info-value">${escapeHtml(p._row || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Data de cadastro</span>
                        <span class="patient-info-value">${escapeHtml(p.created || '—')}</span>
                    </div>
                    <div class="patient-info-item full-width">
                        <span class="patient-info-label">Nome completo</span>
                        <span class="patient-info-value">${escapeHtml(p.name)}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Data de nascimento</span>
                        <span class="patient-info-value">${escapeHtml(p.birthDate || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Idade</span>
                        <span class="patient-info-value">${escapeHtml(p.age || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Sexo</span>
                        <span class="patient-info-value">${escapeHtml(p.gender || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Estado civil</span>
                        <span class="patient-info-value">${escapeHtml(p.maritalStatus || '—')}</span>
                    </div>
                </div>
            </div>
            <div class="patient-info-card">
                <h3>Documentação</h3>
                <div class="patient-info-grid">
                    <div class="patient-info-item">
                        <span class="patient-info-label">CPF</span>
                        <span class="patient-info-value">${escapeHtml(p.cpf || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">RG</span>
                        <span class="patient-info-value">${escapeHtml(p.rg || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Profissão</span>
                        <span class="patient-info-value">${escapeHtml(p.profession || '—')}</span>
                    </div>
                </div>
            </div>
            <div class="patient-info-card">
                <h3>Dados de contato</h3>
                <div class="patient-info-grid">
                    <div class="patient-info-item">
                        <span class="patient-info-label">E-mail</span>
                        <span class="patient-info-value">${escapeHtml(p.email || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Telefone</span>
                        <span class="patient-info-value">${escapeHtml(p.phone || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Celular</span>
                        <span class="patient-info-value">${escapeHtml(p.mobile || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Enviar lembretes</span>
                        <span class="patient-info-value">${escapeHtml(p.sendReminders || 'Não')}</span>
                    </div>
                </div>
            </div>
            <div class="patient-info-card">
                <h3>Endereço</h3>
                <div class="patient-info-grid">
                    <div class="patient-info-item">
                        <span class="patient-info-label">CEP</span>
                        <span class="patient-info-value">${escapeHtml(p.zipCode || '—')}</span>
                    </div>
                    <div class="patient-info-item full-width">
                        <span class="patient-info-label">Endereço</span>
                        <span class="patient-info-value">${escapeHtml(p.address || '—')}, ${escapeHtml(p.number || '')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Complemento</span>
                        <span class="patient-info-value">${escapeHtml(p.complement || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Bairro</span>
                        <span class="patient-info-value">${escapeHtml(p.neighborhood || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Cidade</span>
                        <span class="patient-info-value">${escapeHtml(p.city || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Estado</span>
                        <span class="patient-info-value">${escapeHtml(p.state || '—')}</span>
                    </div>
                </div>
            </div>
            <div class="patient-info-card">
                <h3>Dados familiares</h3>
                <div class="patient-info-grid">
                    <div class="patient-info-item">
                        <span class="patient-info-label">Nome da mãe</span>
                        <span class="patient-info-value">${escapeHtml(p.motherName || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Nome do pai</span>
                        <span class="patient-info-value">${escapeHtml(p.fatherName || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Contato familiar</span>
                        <span class="patient-info-value">${escapeHtml(p.familyContactName || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Grau de parentesco</span>
                        <span class="patient-info-value">${escapeHtml(p.familyContactRelationship || '—')}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="patient-info-label">Telefone familiar</span>
                        <span class="patient-info-value">${escapeHtml(p.familyContactPhone || '—')}</span>
                    </div>
                </div>
            </div>
            ${insuranceCard}
        </div>
    `;
}

// Renderiza estados vazios
function renderEmptyState(title, subtitle, buttonText) {
    return `
        <div class="patient-empty-state">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(subtitle)}</p>
            ${buttonText ? `<button class="btn btn-outline" disabled>${escapeHtml(buttonText)}</button>` : ''}
        </div>
    `;
}

// Volta para a lista de pacientes
function voltarParaLista() {
    state.selectedPatient = null;
    state.patientSection = 'dados-pessoais';
    // Re-renderiza a página atual (assumindo que é a listagem de pacientes)
    renderPage();
}

// ============ AÇÕES DO PAINEL LATERAL ============

// Mantém a função openNewPatient para compatibilidade com listener existente
function openNewPatient() {
    newPatient();
}

// Nova função para criar paciente (será usada pelo formulário completo)
function newPatient() {
    if (typeof openPatientForm === 'function') {
        openPatientForm(null);
    } else {
        console.error('openPatientForm não definida em slidepanel.js');
    }
}

// Editar paciente: abre o painel lateral com o formulário completo
function editPatient(row) {
    const p = state.patients.find(pt => pt._row === row);
    if (!p) return;
    if (typeof openPatientForm === 'function') {
        openPatientForm(p);
    } else {
        console.error('openPatientForm não definida em slidepanel.js');
    }
}

// Placeholder para menu de ações extras
function openPatientMenu() {
    console.log('Menu de ações do paciente (futuro)');
}

// Expor funções globalmente (caso necessário)
window.buildPacientes = buildPacientes;
window.getInitials = getInitials;
window.openPatient = openPatient;
window.openPatientSection = openPatientSection;
window.renderPatientProfile = renderPatientProfile;
window.voltarParaLista = voltarParaLista;
window.editPatient = editPatient;
window.newPatient = newPatient;
window.openNewPatient = openNewPatient;
window.openPatientMenu = openPatientMenu;
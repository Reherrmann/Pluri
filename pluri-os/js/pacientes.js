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
async function renderPatientProfile() {
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
    // renderPatientSectionContent pode ser assíncrona (ex: seção "prontuario"
    // busca dados via API), então é preciso aguardar o resultado antes de
    // montar o HTML — sem o await, o template imprimia "[object Promise]".
    const sectionContent = await renderPatientSectionContent(section);

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
async function renderPatientSectionContent(section) {
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
            // renderProntuario é async (busca os registros via API antes de montar o HTML)
            return await renderProntuario(p);

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

// Prontuário
window.openNewMedicalRecord = openNewMedicalRecord;
window.openEditMedicalRecord = openEditMedicalRecord;
window.openMedicalRecordForm = openMedicalRecordForm;
window.closeProntuarioModal = closeProntuarioModal;
window.saveMedicalRecord = saveMedicalRecord;
window.deleteMedicalRecord = deleteMedicalRecord;
window.showVersionHistory = showVersionHistory;
window.viewRecordVersion = viewRecordVersion;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;


// ============================================================
// PRONTUÁRIO ELETRÔNICO – FUNÇÕES
// ============================================================

/**
 * Renderiza a aba "Prontuário eletrônico" dentro do perfil do paciente.
 */
async function renderProntuario(p) {
    // Carrega os registros sob demanda, se ainda não carregados
    if (!state.medicalRecords || state.medicalRecords.length === 0) {
        state.medicalRecords = await window.pluriAPI.getMedicalRecords();
    }
    const records = state.medicalRecords.filter(r => String(r.pacienteRow) === String(p._row));
    // Ordena por data (mais recente primeiro)
    records.sort((a, b) => (a.data > b.data ? -1 : 1));

    // Obtém as versões mais recentes de cada cadeia
    const latestVersions = getLatestVersions(records);

    // Gera HTML da lista
    let listHtml = '';
    if (latestVersions.length === 0) {
        listHtml = `<p class="empty-message">Nenhum registro de prontuário encontrado para este paciente.</p>`;
    } else {
        listHtml = latestVersions.map(r => renderRecordCard(r)).join('');
    }

    // Monta a interface com filtros
    return `
        <div class="patient-section">
            <div class="prontuario-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
                <h2 style="margin:0;">Prontuário eletrônico</h2>
                <button class="btn btn-primary" onclick="openNewMedicalRecord()">+ Novo registro</button>
            </div>
            <div class="prontuario-filters" style="display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap;">
                <input type="date" id="filterDate" style="flex:1; min-width:120px; padding:6px 12px; border:1px solid var(--border-color, #d1d5db); border-radius:6px;">
                <select id="filterProfissional" style="flex:1; min-width:120px; padding:6px 12px; border:1px solid var(--border-color, #d1d5db); border-radius:6px;">
                    <option value="">Todos os profissionais</option>
                    ${state.staff.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join('')}
                </select>
                <select id="filterTipo" style="flex:1; min-width:120px; padding:6px 12px; border:1px solid var(--border-color, #d1d5db); border-radius:6px;">
                    <option value="">Todos os tipos</option>
                    <option value="Consulta">Consulta</option>
                    <option value="Retorno">Retorno</option>
                    <option value="Procedimento">Procedimento</option>
                    <option value="Exame">Exame</option>
                    <option value="Teleconsulta">Teleconsulta</option>
                    <option value="Outro">Outro</option>
                </select>
                <button class="btn btn-outline" onclick="applyFilters()">Filtrar</button>
                <button class="btn btn-outline" onclick="clearFilters()">Limpar</button>
            </div>
            <div id="medicalRecordsList">
                ${listHtml}
            </div>
        </div>
    `;
}

/**
 * Agrupa registros por cadeia de versões e retorna apenas a última versão de cada cadeia.
 */
function getLatestVersions(records) {
    const chains = [];
    // Encontra raízes (sem versão anterior)
    records.forEach(r => {
        if (!r.versaoAnterior) {
            chains.push({ root: r, versions: [r] });
        }
    });
    // Preenche as cadeias com as versões seguintes
    chains.forEach(chain => {
        let current = chain.root;
        let next = records.find(r => r.versaoAnterior === current._row);
        while (next) {
            chain.versions.push(next);
            current = next;
            next = records.find(r => r.versaoAnterior === current._row);
        }
    });
    // Para cada cadeia, pega a última versão
    return chains.map(chain => chain.versions[chain.versions.length - 1]);
}

/**
 * Renderiza um card de registro de prontuário.
 */
function renderRecordCard(record) {
    const versionBadge = record.versaoAnterior ? '<span class="badge" style="background:#4f46e5; color:#fff; padding:2px 10px; border-radius:20px; font-size:0.75rem;">Última versão</span>' : '';

    return `
        <div class="record-card" data-row="${record._row}" style="background: var(--card-bg, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: box-shadow 0.2s;">
            <div class="record-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <strong>${record.data || 'Data não informada'} ${record.hora ? '· ' + record.hora : ''}</strong>
                    <span class="record-type" style="background: var(--primary-light, #e0e7ff); padding: 2px 10px; border-radius: 20px; font-size: 0.85em; color: var(--primary, #4f46e5);">${escapeHtml(record.tipoAtendimento)}</span>
                    ${versionBadge}
                </div>
                <div style="display:flex; gap:4px; flex-wrap:wrap;">
                    <button class="btn btn-sm btn-outline" onclick="openEditMedicalRecord(${record._row})" style="padding:4px 10px; font-size:0.85rem;">✏️ Revisar</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMedicalRecord(${record._row})" style="padding:4px 10px; font-size:0.85rem;">🗑️</button>
                    <button class="btn btn-sm btn-outline" onclick="showVersionHistory(${record._row})" style="padding:4px 10px; font-size:0.85rem;">📜 Histórico</button>
                </div>
            </div>
            <div class="record-body" style="margin-top:8px;">
                ${record.profissional ? `<p><strong>Profissional:</strong> ${escapeHtml(record.profissional)}</p>` : ''}
                ${record.anamnese ? `<p><strong>Anamnese:</strong> ${escapeHtml(record.anamnese)}</p>` : ''}
                ${record.hipoteseDiagnostica ? `<p><strong>Hipótese diagnóstica:</strong> ${escapeHtml(record.hipoteseDiagnostica)}</p>` : ''}
                ${record.diagnosticoDefinitivo ? `<p><strong>Diagnóstico definitivo:</strong> ${escapeHtml(record.diagnosticoDefinitivo)}</p>` : ''}
                ${record.conduta ? `<p><strong>Conduta:</strong> ${escapeHtml(record.conduta)}</p>` : ''}
                ${record.prescricao ? `<p><strong>Prescrição:</strong> ${escapeHtml(record.prescricao)}</p>` : ''}
                ${record.examesSolicitados ? `<p><strong>Exames solicitados:</strong> ${escapeHtml(record.examesSolicitados)}</p>` : ''}
                ${record.encaminhamentos ? `<p><strong>Encaminhamentos:</strong> ${escapeHtml(record.encaminhamentos)}</p>` : ''}
                ${record.anexos && record.anexos.length ? `<p><strong>Anexos:</strong> ${record.anexos.map(url => `<a href="${url}" target="_blank">📎</a>`).join(' ')}</p>` : ''}
            </div>
            <div class="record-footer" style="font-size:0.85em; color:var(--text-secondary); margin-top:8px; display:flex; justify-content:space-between; flex-wrap:wrap;">
                <span>Criado em ${record.dataCriacao || 'data desconhecida'} por ${escapeHtml(record.criadoPor || '—')}</span>
                ${record.motivoRevisao ? `<span>Motivo da revisão: ${escapeHtml(record.motivoRevisao)}</span>` : ''}
            </div>
        </div>
    `;
}

// ============================================================
// FORMULÁRIO DE CRIAÇÃO/EDIÇÃO (MODAL)
// ============================================================

let editingRecordRow = null;

function openNewMedicalRecord() {
    editingRecordRow = null;
    openMedicalRecordForm(null, false);
}

function openEditMedicalRecord(row) {
    console.log('🔵 openEditMedicalRecord chamado com row:', row);
    console.log('📊 state.medicalRecords:', state.medicalRecords);
    const record = state.medicalRecords.find(r => r._row === row);
    if (!record) {
        console.error('❌ Registro não encontrado!');
        showToast('Registro não encontrado.');
        return;
    }
    editingRecordRow = row;
    openMedicalRecordForm(record, true);
}

function openMedicalRecordForm(record, isRevision) {
    const modal = getEl('prontuarioModal');
    const content = getEl('prontuarioContent');
    if (!modal || !content) {
        console.error('❌ Modal do prontuário não encontrado! Verifique se os IDs existem no HTML.');
        return;
    }

    const title = isRevision ? 'Revisar registro' : 'Novo registro de prontuário';
    const buttonText = isRevision ? 'Salvar revisão' : 'Salvar registro';

    // Preenche os campos com os dados do record ou vazio
    const data = record ? record.data : new Date().toISOString().slice(0,10);
    const hora = record ? record.hora : new Date().toTimeString().slice(0,5);
    const profissional = record ? record.profissional : '';
    const especialidade = record ? record.especialidade : '';
    const tipo = record ? record.tipoAtendimento : 'Consulta';
    const anamnese = record ? record.anamnese : '';
    const exameFisico = record ? record.exameFisico : '';
    const hipotese = record ? record.hipoteseDiagnostica : '';
    const diagnostico = record ? record.diagnosticoDefinitivo : '';
    const conduta = record ? record.conduta : '';
    const prescricao = record ? record.prescricao : '';
    const exames = record ? record.examesSolicitados : '';
    const encaminhamentos = record ? record.encaminhamentos : '';
    const atestado = record ? record.atestado : 'Não';
    const observacoes = record ? record.observacoes : '';
    const anexos = record && record.anexos ? record.anexos.join(',') : '';
    const motivoRevisao = record ? record.motivoRevisao : '';

    // Monta HTML do formulário (sem os botões de footer, pois usaremos os do modal)
    content.innerHTML = `
        <form id="medicalRecordForm" style="display:flex; flex-direction:column; gap:12px; max-height:60vh; overflow-y:auto; padding-right:8px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label>Data *</label>
                    <input type="date" id="mrData" value="${data}" required>
                </div>
                <div class="form-group">
                    <label>Hora</label>
                    <input type="time" id="mrHora" value="${hora}">
                </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label>Profissional</label>
                    <input type="text" id="mrProfissional" value="${escapeHtml(profissional)}" list="staffList">
                    <datalist id="staffList">${state.staff.map(s => `<option value="${escapeHtml(s.name)}">`).join('')}</datalist>
                </div>
                <div class="form-group">
                    <label>Especialidade</label>
                    <input type="text" id="mrEspecialidade" value="${escapeHtml(especialidade)}">
                </div>
            </div>
            <div class="form-group">
                <label>Tipo de atendimento</label>
                <select id="mrTipo">
                    ${['Consulta','Retorno','Procedimento','Exame','Teleconsulta','Outro'].map(t =>
                        `<option value="${t}" ${tipo === t ? 'selected' : ''}>${t}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Anamnese</label>
                <textarea id="mrAnamnese" rows="3">${escapeHtml(anamnese)}</textarea>
            </div>
            <div class="form-group">
                <label>Exame físico</label>
                <textarea id="mrExameFisico" rows="3">${escapeHtml(exameFisico)}</textarea>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label>Hipótese diagnóstica</label>
                    <input type="text" id="mrHipotese" value="${escapeHtml(hipotese)}">
                </div>
                <div class="form-group">
                    <label>Diagnóstico definitivo</label>
                    <input type="text" id="mrDiagnostico" value="${escapeHtml(diagnostico)}">
                </div>
            </div>
            <div class="form-group">
                <label>Conduta</label>
                <textarea id="mrConduta" rows="3">${escapeHtml(conduta)}</textarea>
            </div>
            <div class="form-group">
                <label>Prescrição</label>
                <textarea id="mrPrescricao" rows="4">${escapeHtml(prescricao)}</textarea>
            </div>
            <div class="form-group">
                <label>Exames solicitados</label>
                <textarea id="mrExames" rows="2">${escapeHtml(exames)}</textarea>
            </div>
            <div class="form-group">
                <label>Encaminhamentos</label>
                <textarea id="mrEncaminhamentos" rows="2">${escapeHtml(encaminhamentos)}</textarea>
            </div>
            <div class="form-group">
                <label>Atestado</label>
                <select id="mrAtestado">
                    <option value="Não" ${atestado === 'Não' ? 'selected' : ''}>Não</option>
                    <option value="Sim" ${atestado === 'Sim' ? 'selected' : ''}>Sim</option>
                </select>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="mrObservacoes" rows="2">${escapeHtml(observacoes)}</textarea>
            </div>
            <div class="form-group">
                <label>Anexos (URLs separados por vírgula)</label>
                <input type="text" id="mrAnexos" value="${escapeHtml(anexos)}" placeholder="https://exemplo.com/doc.pdf, https://...">
            </div>
            ${isRevision ? `
                <div class="form-group">
                    <label>Motivo da revisão *</label>
                    <textarea id="mrMotivoRevisao" rows="2" required>${escapeHtml(motivoRevisao)}</textarea>
                </div>
            ` : ''}
            <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px; padding-top:12px; border-top:1px solid var(--border-color, #e5e7eb);">
                <button type="button" class="btn btn-secondary" onclick="closeProntuarioModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">${buttonText}</button>
            </div>
        </form>
    `;

    // Atualiza o título do modal
    const titleEl = getEl('prontuarioModalTitle');
    if (titleEl) titleEl.textContent = title;

    // Exibe o modal
    modal.style.display = 'flex';

    // Evento de fechar pelo X
    const closeBtn = getEl('prontuarioModalClose');
    if (closeBtn) {
        closeBtn.onclick = closeProntuarioModal;
    }

    // Evento de submit
    const form = document.getElementById('medicalRecordForm');
    if (form) {
        // Remove listeners antigos para evitar duplicação
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveMedicalRecord(isRevision);
        });
    }
}

// ============================================================
// FECHAR MODAL DO PRONTUÁRIO
// ============================================================

function closeProntuarioModal() {
    const modal = getEl('prontuarioModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function saveMedicalRecord(isRevision) {
    console.log('🔵 saveMedicalRecord chamado', { isRevision });

    // Verifica se há um paciente selecionado
    if (!state.selectedPatient || !state.selectedPatient._row) {
        showToast('Erro: paciente não selecionado.');
        return;
    }

    // Captura os dados do formulário
    const formData = {
        pacienteRow: state.selectedPatient._row,
        data: getEl('mrData').value,
        hora: getEl('mrHora').value,
        profissional: getEl('mrProfissional').value,
        especialidade: getEl('mrEspecialidade').value,
        tipoAtendimento: getEl('mrTipo').value,
        anamnese: getEl('mrAnamnese').value,
        exameFisico: getEl('mrExameFisico').value,
        hipoteseDiagnostica: getEl('mrHipotese').value,
        diagnosticoDefinitivo: getEl('mrDiagnostico').value,
        conduta: getEl('mrConduta').value,
        prescricao: getEl('mrPrescricao').value,
        examesSolicitados: getEl('mrExames').value,
        encaminhamentos: getEl('mrEncaminhamentos').value,
        atestado: getEl('mrAtestado').value,
        observacoes: getEl('mrObservacoes').value,
        anexos: getEl('mrAnexos').value.split(',').map(s => s.trim()).filter(Boolean)
    };

    let result;
    if (isRevision) {
        const motivo = getEl('mrMotivoRevisao').value.trim();
        if (!motivo) {
            showToast('Informe o motivo da revisão.');
            return;
        }
        // Chama a função de revisão
        result = await window.pluriAPI.reviseMedicalRecord(editingRecordRow, formData, motivo);
    } else {
        // Cria um novo registro
        result = await window.pluriAPI.createMedicalRecord(formData);
    }

    if (result && result.success) {
        closeProntuarioModal();
        showToast('Registro salvo com sucesso!');
        // Recarrega os registros e re-renderiza
        state.medicalRecords = await window.pluriAPI.getMedicalRecords();
        // Força a re-renderização da aba "Prontuário"
        renderPatientProfile();
        // Garante que a aba "Prontuário" continue ativa
        state.patientSection = 'prontuario';
        // Re-renderiza novamente para garantir
        renderPatientProfile();
    } else {
        showToast(result?.error || 'Erro ao salvar registro.');
    }
}

async function deleteMedicalRecord(row) {
    if (!confirm('Excluir este registro do prontuário? Esta ação é irreversível.')) return;
    const result = await window.pluriAPI.deleteMedicalRecord(row);
    if (result && result.success) {
        showToast('Registro excluído.');
        state.medicalRecords = await window.pluriAPI.getMedicalRecords();
        renderPatientProfile();
    } else {
        showToast(result?.error || 'Erro ao excluir.');
    }
}

// ============================================================
// HISTÓRICO DE VERSÕES
// ============================================================

function showVersionHistory(row) {
    console.log('🔵 showVersionHistory chamado com row:', row);
    console.log('📊 state.medicalRecords:', state.medicalRecords);
    const allVersions = [];
    let current = state.medicalRecords.find(r => r._row === row);
    if (!current) {
        console.error('❌ Registro não encontrado!');
        showToast('Registro não encontrado.');
        return;
    }
    
}

    // Vai para a raiz
    while (current.versaoAnterior) {
        const prev = state.medicalRecords.find(r => r._row === current.versaoAnterior);
        if (!prev) break;
        current = prev;
    }
    const root = current;
    allVersions.push(root);
    let next = state.medicalRecords.find(r => r.versaoAnterior === root._row);
    while (next) {
        allVersions.push(next);
        next = state.medicalRecords.find(r => r.versaoAnterior === next._row);
    }

    // Usa o modal de prontuário
    const modal = getEl('prontuarioModal');
    const content = getEl('prontuarioContent');
    if (!modal || !content) return;

    let html = `<h2>Histórico de versões</h2><div style="max-height:60vh; overflow-y:auto;">`;
    allVersions.forEach((v, index) => {
        html += `
            <div style="border-bottom:1px solid #e5e7eb; padding:12px 0;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>Versão ${index+1}</strong> 
                    <span>${v.data || ''} ${v.hora || ''}</span>
                    <span><em>${escapeHtml(v.criadoPor || '—')}</em></span>
                    <button class="btn btn-sm btn-outline" onclick="viewRecordVersion(${v._row})">Ver detalhes</button>
                </div>
                ${v.motivoRevisao ? `<div style="margin-top:4px; font-size:0.9em;"><strong>Motivo:</strong> ${escapeHtml(v.motivoRevisao)}</div>` : ''}
            </div>
        `;
    });
    html += `</div><button class="btn btn-secondary" onclick="closeProntuarioModal()" style="margin-top:12px;">Fechar</button>`;
    content.innerHTML = html;
    modal.style.display = 'flex';
}

function viewRecordVersion(row) {
    const record = state.medicalRecords.find(r => r._row === row);
    if (!record) {
        showToast('Registro não encontrado.');
        return;
    }
    const modal = getEl('prontuarioModal');
    const content = getEl('prontuarioContent');
    if (!modal || !content) return;

    const html = `
        <h2>Detalhes da versão</h2>
        <div style="max-height:60vh; overflow-y:auto;">
            <p><strong>Data:</strong> ${record.data || ''} ${record.hora ? '· ' + record.hora : ''}</p>
            <p><strong>Profissional:</strong> ${escapeHtml(record.profissional || '—')}</p>
            <p><strong>Especialidade:</strong> ${escapeHtml(record.especialidade || '—')}</p>
            <p><strong>Tipo:</strong> ${escapeHtml(record.tipoAtendimento)}</p>
            ${record.anamnese ? `<p><strong>Anamnese:</strong><br>${escapeHtml(record.anamnese)}</p>` : ''}
            ${record.exameFisico ? `<p><strong>Exame físico:</strong><br>${escapeHtml(record.exameFisico)}</p>` : ''}
            ${record.hipoteseDiagnostica ? `<p><strong>Hipótese diagnóstica:</strong> ${escapeHtml(record.hipoteseDiagnostica)}</p>` : ''}
            ${record.diagnosticoDefinitivo ? `<p><strong>Diagnóstico definitivo:</strong> ${escapeHtml(record.diagnosticoDefinitivo)}</p>` : ''}
            ${record.conduta ? `<p><strong>Conduta:</strong><br>${escapeHtml(record.conduta)}</p>` : ''}
            ${record.prescricao ? `<p><strong>Prescrição:</strong><br>${escapeHtml(record.prescricao)}</p>` : ''}
            ${record.examesSolicitados ? `<p><strong>Exames solicitados:</strong><br>${escapeHtml(record.examesSolicitados)}</p>` : ''}
            ${record.encaminhamentos ? `<p><strong>Encaminhamentos:</strong> ${escapeHtml(record.encaminhamentos)}</p>` : ''}
            ${record.observacoes ? `<p><strong>Observações:</strong><br>${escapeHtml(record.observacoes)}</p>` : ''}
            ${record.anexos && record.anexos.length ? `<p><strong>Anexos:</strong> ${record.anexos.map(url => `<a href="${url}" target="_blank">📎</a>`).join(' ')}</p>` : ''}
            ${record.motivoRevisao ? `<p><strong>Motivo da revisão:</strong> ${escapeHtml(record.motivoRevisao)}</p>` : ''}
            <p style="font-size:0.85em; color:var(--text-secondary);">Criado em ${record.dataCriacao || ''} por ${escapeHtml(record.criadoPor || '—')}</p>
        </div>
        <button class="btn btn-secondary" onclick="closeProntuarioModal()" style="margin-top:12px;">Fechar</button>
    `;
    content.innerHTML = html;
    modal.style.display = 'flex';
}

// ============================================================
// FILTROS
// ============================================================

function applyFilters() {
    const date = getEl('filterDate')?.value;
    const profissional = getEl('filterProfissional')?.value?.toLowerCase();
    const tipo = getEl('filterTipo')?.value?.toLowerCase();

    const cards = document.querySelectorAll('.record-card');
    cards.forEach(card => {
        const row = parseInt(card.dataset.row, 10);
        const record = state.medicalRecords.find(r => r._row === row);
        if (!record) {
            card.style.display = 'none';
            return;
        }
        let show = true;
        if (date && record.data !== date) show = false;
        if (profissional && !record.profissional?.toLowerCase().includes(profissional)) show = false;
        if (tipo && record.tipoAtendimento?.toLowerCase() !== tipo) show = false;
        card.style.display = show ? '' : 'none';
    });
}

function clearFilters() {
    getEl('filterDate').value = '';
    getEl('filterProfissional').value = '';
    getEl('filterTipo').value = '';
    document.querySelectorAll('.record-card').forEach(c => c.style.display = '');
}
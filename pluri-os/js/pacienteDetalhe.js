// js/pacienteDetalhe.js
//
// Página de detalhe do paciente: acessada ao clicar em uma linha da
// tabela de Pacientes. Mostra um card de perfil + menu lateral de
// abas (estrutura pronta para os próximos módulos) e, por padrão,
// a aba "Dados Pessoais" com todas as informações cadastradas.
//
// A criação e a edição continuam acontecendo no painel lateral
// deslizante (slide panel), como já funcionava — ver pacientes.js.

// -----------------------------------------------------------------
// Abas do menu lateral do paciente.
// "dados" é a única com conteúdo completo por enquanto; as demais
// só têm a estrutura (placeholder) para construirmos depois.
// -----------------------------------------------------------------
const PATIENT_DETAIL_TABS = [
    { id: 'prontuario', label: 'Prontuário eletrônico', icon: 'clipboard-list' },
    { id: 'dados', label: 'Dados Pessoais', icon: 'user' },
    { id: 'documentos', label: 'Documentos', icon: 'folder' },
    { id: 'convenios', label: 'Convênios', icon: 'id-card' },
    { id: 'agendamentos', label: 'Agendamentos', icon: 'calendar-check' },
    { id: 'financeiro', label: 'Financeiro', icon: 'file-text' },
    { id: 'guiastiss', label: 'Guias TISS', icon: 'file-check' },
];

function viewPatientDetail(row) {
    const p = state.patients.find(pt => pt._row === row || pt.id === row);
    if (!p) {
        showToast('Paciente não encontrado.');
        return;
    }
    state.selectedPatientRow = row;
    state.patientDetailTab = 'dados';
    state.currentPage = 'pacienteDetalhe';
    renderPage();
}

function buildPacienteDetalhe() {
    const row = state.selectedPatientRow;
    const p = state.patients.find(pt => pt._row === row || pt.id === row);

    if (!p) {
        return `
            <div class="card-placeholder" style="margin-top:20px;">
                Paciente não encontrado.
            </div>
        `;
    }

    const activeTab = state.patientDetailTab || 'dados';

    return `
        <div class="breadcrumb">
            <a href="#" data-back-to-patients>Lista de pacientes</a>
            <i data-lucide="chevron-right"></i>
            <span>${p.name}</span>
        </div>

        <div class="patient-detail-layout">

            <div class="patient-detail-side">

                <div class="patient-profile-card">
                    <div class="patient-profile-avatar">${getInitials(p.name)}</div>
                    <div class="patient-profile-name">${p.name}</div>

                    <div class="patient-profile-meta">
                        <div class="patient-profile-meta-row">
                            <span>Idade</span>
                            <strong>${p.age || '—'}</strong>
                        </div>
                        <div class="patient-profile-meta-row">
                            <span>Nascimento</span>
                            <strong>${p.birthdate || '—'}</strong>
                        </div>
                        <div class="patient-profile-meta-row">
                            <span>Sexo</span>
                            <strong>${p.sex || '—'}</strong>
                        </div>
                        <div class="patient-profile-meta-row">
                            <span>Telefone</span>
                            <strong>${p.phone || '—'}</strong>
                        </div>
                    </div>
                </div>

                <nav class="patient-side-nav">
                    ${PATIENT_DETAIL_TABS.map(tab => `
                        <a href="#"
                           class="${tab.id === activeTab ? 'active' : ''}"
                           data-patient-tab="${tab.id}">
                            <i data-lucide="${tab.icon}"></i>
                            ${tab.label}
                        </a>
                    `).join('')}

                    <a href="#" data-patient-photo>
                        <i data-lucide="camera"></i>
                        Alterar foto
                    </a>
                </nav>

            </div>

            <div class="patient-detail-main">
                ${buildPatientTabContent(activeTab, p)}
            </div>

        </div>
    `;
}

function buildPatientTabContent(tabId, p) {
    switch (tabId) {
        case 'dados':
            return buildPatientDadosPessoais(p);
        case 'prontuario':
            return buildPatientPlaceholder(
                'Prontuário eletrônico',
                'Aqui vão ficar as evoluções clínicas, anotações e histórico de atendimento do paciente.'
            );
        case 'documentos':
            return buildPatientPlaceholder(
                'Documentos',
                'Aqui vão ficar os documentos enviados ou gerados para o paciente (exames, atestados, contratos).'
            );
        case 'convenios':
            return buildPatientPlaceholder(
                'Convênios',
                'Aqui vão ficar os convênios vinculados ao paciente, com número da carteirinha e validade.'
            );
        case 'agendamentos':
            return buildPatientPlaceholder(
                'Agendamentos',
                'Aqui vai ficar o histórico completo de agendamentos do paciente, passados e futuros.'
            );
        case 'financeiro':
            return buildPatientPlaceholder(
                'Financeiro',
                'Aqui vão ficar os lançamentos financeiros do paciente: cobranças, pagamentos e pendências.'
            );
        case 'guiastiss':
            return buildPatientPlaceholder(
                'Guias TISS',
                'Aqui vão ficar as guias TISS emitidas para o paciente junto ao convênio.'
            );
        default:
            return buildPatientDadosPessoais(p);
    }
}

function buildPatientPlaceholder(title, description) {
    return `
        <div class="card">
            <div class="card-header">
                <h3>${title}</h3>
            </div>
            <div class="card-body">
                <div class="card-placeholder" style="flex-direction:column;gap:6px;text-align:center;padding:20px;">
                    <i data-lucide="hourglass" style="width:22px;height:22px;"></i>
                    <span>${description}</span>
                    <span style="font-size:11px;">Em breve nesta aba.</span>
                </div>
            </div>
        </div>
    `;
}

function infoRow(label, value) {
    return `
        <div class="info-item">
            <span class="info-label">${label}</span>
            <span class="info-value">${value && String(value).trim() ? value : '—'}</span>
        </div>
    `;
}

function buildPatientDadosPessoais(p) {
    return `
        <div class="card">
            <div class="card-header">
                <h3>Dados pessoais</h3>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-primary btn-sm" data-edit-patient="${p._row}">
                        <i data-lucide="pencil" style="width:14px;height:14px;"></i>
                        Editar dados
                    </button>
                    <button class="btn btn-outline btn-sm" data-print-patient="${p._row}">
                        <i data-lucide="printer" style="width:14px;height:14px;"></i>
                        Imprimir ficha
                    </button>
                </div>
            </div>
            <div class="card-body">

                <div class="info-grid">
                    ${infoRow('Nome', p.name)}
                    ${infoRow('Telefone', p.phone)}
                    ${infoRow('Celular', p.cellphone)}
                    ${infoRow('E-mail', p.email)}
                    ${infoRow('Nascimento', p.birthdate)}
                    ${infoRow('Idade', p.age)}
                    ${infoRow('Sexo', p.sex)}
                    ${infoRow('Estado civil', p.maritalStatus)}
                    ${infoRow('Nome mãe', p.motherName)}
                    ${infoRow('Nome pai', p.fatherName)}
                    ${infoRow('CPF', p.cpf)}
                    ${infoRow('RG', p.rg)}
                    ${infoRow('Profissão', p.profession)}
                </div>

                <div class="info-section-label">Convênio</div>
                <div class="info-grid">
                    ${infoRow('Convênio', p.healthPlan || 'Paciente sem convênio')}
                </div>

                <div class="info-section-label">Dados de contato</div>
                <div class="info-grid">
                    ${infoRow('Endereço', p.address)}
                    ${infoRow('Cidade', p.city)}
                    ${infoRow('Estado', p.stateUf)}
                    ${infoRow('Enviar lembretes', p.reminders)}
                </div>

                <div class="info-section-label">Dados de contato familiar</div>
                <div class="info-grid">
                    ${infoRow('Nome contato familiar', p.familyContactName)}
                    ${infoRow('Grau de parentesco', p.familyContactRelation)}
                    ${infoRow('Telefone contato familiar', p.familyContactPhone)}
                </div>

                <div class="info-section-label">Observações</div>
                <p style="font-size:13.5px;color:var(--text);">
                    ${p.notes && p.notes.trim() ? p.notes : 'Nenhuma observação registrada.'}
                </p>

            </div>
        </div>
    `;
}
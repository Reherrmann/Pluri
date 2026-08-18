// PLURI OS — Convênio na ficha do paciente
// Formulário próprio na página da ficha do paciente.
// Não usa slide-panel nem o formulário completo de edição.

(function installConvenioPatientModule() {
    function install() {
        if (window.__pluriConvenioPatientModuleInstalled) return;
        if (typeof window.renderPatientSectionContent !== 'function') {
            setTimeout(install, 100);
            return;
        }

        window.__pluriConvenioPatientModuleInstalled = true;

        const originalRender = window.renderPatientSectionContent;

        window.renderPatientSectionContent = async function (section) {
            if (section === 'convenios' && window.state?.selectedPatient) {
                return await renderPatientConvenioSection(window.state.selectedPatient);
            }

            return originalRender.apply(this, arguments);
        };

        window.renderPatientConvenioSection = renderPatientConvenioSection;
        window.openPatientConvenioForm = openPatientConvenioForm;
        window.cancelPatientConvenioForm = cancelPatientConvenioForm;
        window.savePatientConvenio = savePatientConvenio;
        window.onPatientConvenioChange = onPatientConvenioChange;
    }

    async function renderPatientConvenioSection(patient) {
        const hasInsurance = String(patient.hasInsurance || '').trim().toLowerCase() === 'sim';

        if (hasInsurance) {
            return renderLinkedConvenio(patient);
        }

        return `
            <div class="patient-section">
                <h2>Convênios</h2>
                <div class="patient-empty-state">
                    <h3>Nenhum convênio vinculado</h3>
                    <p>Cadastre o convênio, plano, carteirinha e validade deste paciente.</p>
                    <button class="btn btn-outline" type="button" onclick="openPatientConvenioForm(${Number(patient._row)})">
                        Adicionar convênio
                    </button>
                </div>
            </div>
        `;
    }

    function renderLinkedConvenio(patient) {
        return `
            <div class="patient-section">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
                    <div>
                        <h2 style="margin:0;">Convênios</h2>
                        <p style="margin:5px 0 0;color:var(--text-secondary);">Convênio atualmente vinculado ao paciente.</p>
                    </div>
                    <button class="btn btn-outline" type="button" onclick="openPatientConvenioForm(${Number(patient._row)})">
                        Editar convênio
                    </button>
                </div>

                <div class="patient-info-card">
                    <h3>Convênio do paciente</h3>
                    <div class="patient-info-grid">
                        <div class="patient-info-item">
                            <span class="patient-info-label">Convênio</span>
                            <span class="patient-info-value">${escapeHtml(patient.insuranceName || '—')}</span>
                        </div>
                        <div class="patient-info-item">
                            <span class="patient-info-label">Plano</span>
                            <span class="patient-info-value">${escapeHtml(patient.insurancePlan || '—')}</span>
                        </div>
                        <div class="patient-info-item">
                            <span class="patient-info-label">Carteirinha</span>
                            <span class="patient-info-value">${escapeHtml(patient.insuranceCard || '—')}</span>
                        </div>
                        <div class="patient-info-item">
                            <span class="patient-info-label">Validade</span>
                            <span class="patient-info-value">${escapeHtml(patient.insuranceExpiration || '—')}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async function openPatientConvenioForm(row) {
        const patients = window.state?.patients || [];
        const patient = patients.find(p => Number(p._row) === Number(row));

        if (!patient) {
            console.error('PLURI OS: paciente não encontrado para convênio.', row);
            return;
        }

        window.state.selectedPatient = patient;

        const container = typeof getMainContainer === 'function'
            ? getMainContainer()
            : document.querySelector('#pageContainer');

        if (!container) return;

        container.innerHTML = `
            <div class="patient-profile">
                <button class="back-link" type="button" onclick="cancelPatientConvenioForm()">
                    <i data-lucide="arrow-left" style="width:16px;height:16px;"></i>
                    Voltar para convênios
                </button>

                <div class="patient-profile-header">
                    <div class="patient-profile-avatar">${escapeHtml(getInitials(patient.name))}</div>
                    <div class="patient-profile-info">
                        <h2>${escapeHtml(patient.name)}</h2>
                        <p class="patient-profile-bio">${patient.age ? escapeHtml(patient.age) + ' anos · ' : ''}${escapeHtml(patient.gender || '')}</p>
                        <p class="patient-profile-contact">ID: ${escapeHtml(patient._row || '—')}</p>
                    </div>
                </div>

                <div class="patient-profile-main">
                    <aside class="patient-profile-sidebar">
                        <nav class="patient-profile-nav"><ul>
                            <li onclick="openPatientSection('prontuario')">Prontuário eletrônico</li>
                            <li onclick="openPatientSection('dados-pessoais')">Dados pessoais</li>
                            <li onclick="openPatientSection('documentos')">Documentos</li>
                            <li class="active">Convênios</li>
                            <li onclick="openPatientSection('agendamentos')">Agendamentos</li>
                            <li onclick="openPatientSection('financeiro')">Financeiro</li>
                            <li onclick="openPatientSection('guias-tiss')">Guias TISS</li>
                        </ul></nav>
                    </aside>

                    <section class="patient-profile-content">
                        <div class="patient-section">
                            <h2>${String(patient.hasInsurance || '').toLowerCase() === 'sim' ? 'Editar convênio' : 'Adicionar convênio'}</h2>
                            <p style="color:var(--text-secondary);margin-top:-8px;margin-bottom:22px;">Vincule o convênio e o plano deste paciente.</p>

                            <form id="patientConvenioForm" onsubmit="savePatientConvenio(event, ${Number(patient._row)})">
                                <div class="patient-info-card">
                                    <h3>Dados do convênio</h3>
                                    <div class="patient-info-grid">
                                        <div class="patient-info-item full-width">
                                            <label class="patient-info-label" for="patientConvenioName">Convênio</label>
                                            <select id="patientConvenioName" name="insuranceName" required onchange="onPatientConvenioChange()">
                                                <option value="">Carregando convênios...</option>
                                            </select>
                                        </div>

                                        <div class="patient-info-item full-width">
                                            <label class="patient-info-label" for="patientConvenioPlan">Plano</label>
                                            <select id="patientConvenioPlan" name="insurancePlan" disabled>
                                                <option value="">Selecione o convênio primeiro</option>
                                            </select>
                                        </div>

                                        <div class="patient-info-item">
                                            <label class="patient-info-label" for="patientConvenioCard">Carteirinha</label>
                                            <input id="patientConvenioCard" name="insuranceCard" type="text" value="${escapeHtml(patient.insuranceCard || '')}" placeholder="Número da carteirinha">
                                        </div>

                                        <div class="patient-info-item">
                                            <label class="patient-info-label" for="patientConvenioExpiration">Validade</label>
                                            <input id="patientConvenioExpiration" name="insuranceExpiration" type="text" value="${escapeHtml(patient.insuranceExpiration || '')}" placeholder="DD/MM/AAAA">
                                        </div>
                                    </div>
                                </div>

                                <div class="form-actions" style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
                                    <button type="button" class="btn btn-outline" onclick="cancelPatientConvenioForm()">Cancelar</button>
                                    <button type="submit" class="btn btn-primary" id="savePatientConvenioBtn">Salvar convênio</button>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        `;

        if (typeof refreshIcons === 'function') refreshIcons();

        await loadPatientConvenioOptions(patient);
    }

    let patientConveniosCache = [];

    async function loadPatientConvenioOptions(patient) {
        const select = document.getElementById('patientConvenioName');
        if (!select) return;

        try {
            const baseUrl = window.pluriAPI.config.appsScript.baseUrl;
            const data = await window.pluriAPI.get(baseUrl + '?action=read&sheet=Convenios');
            patientConveniosCache = Array.isArray(data) ? data.map(mapConvenio).filter(c => c.status === 'Ativo') : [];

            select.innerHTML = '<option value="">Selecione o convênio</option>' +
                patientConveniosCache.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');

            if (patient.insuranceName) {
                select.value = patient.insuranceName;
                onPatientConvenioChange(patient.insurancePlan || '');
            }
        } catch (error) {
            console.error('Erro ao carregar convênios para o paciente:', error);
            select.innerHTML = '<option value="">Não foi possível carregar os convênios</option>';
        }
    }

    function mapConvenio(row) {
        return {
            name: row['Nome'] || row['Convênio'] || '',
            status: row['Status'] || 'Ativo',
            plans: parseJsonArray(row['Planos'])
        };
    }

    function parseJsonArray(value) {
        if (Array.isArray(value)) return value;
        if (!value) return [];
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }

    function onPatientConvenioChange(selectedPlan = '') {
        const convenioSelect = document.getElementById('patientConvenioName');
        const planSelect = document.getElementById('patientConvenioPlan');
        if (!convenioSelect || !planSelect) return;

        const convenio = patientConveniosCache.find(c => String(c.name) === String(convenioSelect.value));
        const plans = (convenio?.plans || []).filter(p => String(p.status || 'Ativo') === 'Ativo');

        planSelect.disabled = !plans.length;
        planSelect.innerHTML = '<option value="">' + (plans.length ? 'Selecione o plano' : 'Nenhum plano cadastrado') + '</option>' +
            plans.map(p => {
                const name = p.name || p.Nome || '';
                return `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`;
            }).join('');

        if (selectedPlan) planSelect.value = selectedPlan;
    }

    async function savePatientConvenio(event, row) {
        event.preventDefault();

        const patient = (window.state?.patients || []).find(p => Number(p._row) === Number(row));
        if (!patient) {
            showToast('Paciente não encontrado.', 'error');
            return;
        }

        const convenio = document.getElementById('patientConvenioName')?.value || '';
        const plano = document.getElementById('patientConvenioPlan')?.value || '';
        const carteirinha = document.getElementById('patientConvenioCard')?.value?.trim() || '';
        const validade = document.getElementById('patientConvenioExpiration')?.value?.trim() || '';
        const button = document.getElementById('savePatientConvenioBtn');

        if (!convenio) {
            showToast('Selecione um convênio.', 'error');
            return;
        }

        if (button) {
            button.disabled = true;
            button.textContent = 'Salvando...';
        }

        try {
            const updatedPatient = {
                ...patient,
                hasInsurance: 'Sim',
                insuranceName: convenio,
                insurancePlan: plano,
                insuranceCard: carteirinha,
                insuranceExpiration: validade
            };

            await window.pluriAPI.updatePatient(row, updatedPatient);

            const index = (window.state.patients || []).findIndex(p => Number(p._row) === Number(row));
            if (index >= 0) window.state.patients[index] = updatedPatient;
            window.state.selectedPatient = updatedPatient;

            showToast('Convênio salvo com sucesso.', 'success');

            if (typeof window.renderPatientProfile === 'function') {
                await window.renderPatientProfile();
            }
        } catch (error) {
            console.error('Erro ao salvar convênio do paciente:', error);
            showToast(error?.message || 'Não foi possível salvar o convênio.', 'error');
            if (button) {
                button.disabled = false;
                button.textContent = 'Salvar convênio';
            }
        }
    }

    function cancelPatientConvenioForm() {
        if (typeof window.renderPatientProfile === 'function') {
            window.state.patientSection = 'convenios';
            window.renderPatientProfile();
        }
    }

    install();
})();

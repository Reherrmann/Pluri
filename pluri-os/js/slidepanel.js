// js/slidepanel.js

function openSlidePanel() {
    getEl('slidePanel')?.classList.add('show');
    getEl('slideOverlay')?.classList.add('show');
}

function closeSlidePanel() {
    getEl('slidePanel')?.classList.remove('show');
    getEl('slideOverlay')?.classList.remove('show');
}

/**
 * Injeta conteúdo HTML no corpo do painel lateral
 * @param {string} html
 */
function setSlideContent(html) {
    const content = getEl('slideContent');
    if (content) {
        content.innerHTML = html;
    } else {
        console.error('Elemento slideContent não encontrado.');
    }
}

// ============ FORMULÁRIO DE PACIENTE (CRIAÇÃO/EDIÇÃO) ============

/**
 * Abre o formulário de paciente no slide-panel
 * @param {object|null} patient - Paciente para edição, ou null para novo
 */
function openPatientForm(patient) {
    const isEdit = !!patient;
    const p = patient || {};

    const html = `
        <div class="slide-panel-content">
            <div class="slide-panel-header">
                <h3>${isEdit ? 'Editar paciente' : 'Novo paciente'}</h3>
            </div>
            <form id="patient-form" data-id="${isEdit ? escapeHtml(p._row || '') : ''}" 
                  onsubmit="handlePatientSubmit(event)">
                
                <!-- Dados principais -->
                <div class="form-section">
                    <h4>Dados principais</h4>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Nome completo *</label>
                            <input type="text" name="name" value="${escapeHtml(p.name || '')}" required>
                        </div>
                        <div class="form-field">
                            <label>Data de nascimento</label>
                            <input type="text" name="birthDate" class="mask-date" 
                                   value="${escapeHtml(p.birthDate || '')}" placeholder="DD/MM/AAAA">
                        </div>
                        <div class="form-field">
                            <label>Sexo</label>
                            <select name="gender">
                                <option value="">Selecione</option>
                                <option value="Masculino" ${p.gender === 'Masculino' ? 'selected' : ''}>Masculino</option>
                                <option value="Feminino" ${p.gender === 'Feminino' ? 'selected' : ''}>Feminino</option>
                                <option value="Outro" ${p.gender === 'Outro' ? 'selected' : ''}>Outro</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Estado civil</label>
                            <select name="maritalStatus">
                                <option value="">Selecione</option>
                                <option value="Solteiro(a)" ${p.maritalStatus === 'Solteiro(a)' ? 'selected' : ''}>Solteiro(a)</option>
                                <option value="Casado(a)" ${p.maritalStatus === 'Casado(a)' ? 'selected' : ''}>Casado(a)</option>
                                <option value="Divorciado(a)" ${p.maritalStatus === 'Divorciado(a)' ? 'selected' : ''}>Divorciado(a)</option>
                                <option value="Viúvo(a)" ${p.maritalStatus === 'Viúvo(a)' ? 'selected' : ''}>Viúvo(a)</option>
                                <option value="Separado(a)" ${p.maritalStatus === 'Separado(a)' ? 'selected' : ''}>Separado(a)</option>
                                <option value="União estável" ${p.maritalStatus === 'União estável' ? 'selected' : ''}>União estável</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Profissão</label>
                            <input type="text" name="profession" value="${escapeHtml(p.profession || '')}">
                        </div>
                    </div>
                </div>

                <!-- Documentação -->
                <div class="form-section">
                    <h4>Documentação</h4>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>CPF</label>
                            <input type="text" name="cpf" class="mask-cpf" 
                                   value="${escapeHtml(p.cpf || '')}" placeholder="000.000.000-00">
                        </div>
                        <div class="form-field">
                            <label>RG</label>
                            <input type="text" name="rg" value="${escapeHtml(p.rg || '')}">
                        </div>
                    </div>
                </div>

                <!-- Contato -->
                <div class="form-section">
                    <h4>Contato</h4>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>E-mail</label>
                            <input type="email" name="email" value="${escapeHtml(p.email || '')}">
                        </div>
                        <div class="form-field">
                            <label>Telefone</label>
                            <input type="text" name="phone" class="mask-phone" 
                                   value="${escapeHtml(p.phone || '')}" placeholder="(00) 0000-0000">
                        </div>
                        <div class="form-field">
                            <label>Celular</label>
                            <input type="text" name="mobile" class="mask-phone" 
                                   value="${escapeHtml(p.mobile || '')}" placeholder="(00) 00000-0000">
                        </div>
                        <div class="form-field checkbox-field">
                            <label class="checkbox-label">
                                <input type="checkbox" name="sendReminders" ${p.sendReminders === 'Sim' ? 'checked' : ''}> 
                                Enviar lembretes
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Endereço (colapsável) -->
                <details class="form-collapsible" ${p.address || p.zipCode || p.number || p.neighborhood || p.city || p.state ? 'open' : ''}>
                    <summary>
                        <h4>Endereço</h4>
                        <i class="collapsible-arrow" data-lucide="chevron-down"></i>
                    </summary>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>CEP</label>
                            <input type="text" name="zipCode" class="mask-cep" 
                                   value="${escapeHtml(p.zipCode || '')}" placeholder="00000-000">
                        </div>
                        <div class="form-field full-width">
                            <label>Endereço</label>
                            <input type="text" name="address" value="${escapeHtml(p.address || '')}">
                        </div>
                        <div class="form-field">
                            <label>Número</label>
                            <input type="text" name="number" value="${escapeHtml(p.number || '')}">
                        </div>
                        <div class="form-field">
                            <label>Complemento</label>
                            <input type="text" name="complement" value="${escapeHtml(p.complement || '')}">
                        </div>
                        <div class="form-field">
                            <label>Bairro</label>
                            <input type="text" name="neighborhood" value="${escapeHtml(p.neighborhood || '')}">
                        </div>
                        <div class="form-field">
                            <label>Cidade</label>
                            <input type="text" name="city" value="${escapeHtml(p.city || '')}">
                        </div>
                        <div class="form-field">
                            <label>Estado</label>
                            <input type="text" name="state" value="${escapeHtml(p.state || '')}" maxlength="2">
                        </div>
                    </div>
                </details>

                <!-- Família (colapsável) -->
                <details class="form-collapsible" ${p.motherName || p.fatherName || p.familyContactName || p.familyContactPhone ? 'open' : ''}>
                    <summary>
                        <h4>Família</h4>
                        <i class="collapsible-arrow" data-lucide="chevron-down"></i>
                    </summary>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Nome da mãe</label>
                            <input type="text" name="motherName" value="${escapeHtml(p.motherName || '')}">
                        </div>
                        <div class="form-field">
                            <label>Nome do pai</label>
                            <input type="text" name="fatherName" value="${escapeHtml(p.fatherName || '')}">
                        </div>
                        <div class="form-field">
                            <label>Contato familiar</label>
                            <input type="text" name="familyContactName" value="${escapeHtml(p.familyContactName || '')}">
                        </div>
                        <div class="form-field">
                            <label>Grau de parentesco</label>
                            <input type="text" name="familyContactRelationship" value="${escapeHtml(p.familyContactRelationship || '')}">
                        </div>
                        <div class="form-field">
                            <label>Telefone familiar</label>
                            <input type="text" name="familyContactPhone" class="mask-phone" 
                                   value="${escapeHtml(p.familyContactPhone || '')}">
                        </div>
                    </div>
                </details>

                <!-- Convênio -->
                <div class="form-section">
                    <h4>Convênio</h4>
                    <div class="form-field checkbox-field">
                        <label class="checkbox-label">
                            <input type="checkbox" name="hasInsurance" ${p.hasInsurance === 'Sim' ? 'checked' : ''} 
                                   onchange="toggleInsuranceFields(this.checked)"> 
                            Possui convênio
                        </label>
                    </div>
                    <div id="insurance-fields" style="display: ${p.hasInsurance === 'Sim' ? 'block' : 'none'};">
                        <div class="form-grid">
                            <div class="form-field">
                                <label>Convênio</label>
                                <input type="text" name="insuranceName" value="${escapeHtml(p.insuranceName || '')}">
                            </div>
                            <div class="form-field">
                                <label>Carteirinha</label>
                                <input type="text" name="insuranceCard" value="${escapeHtml(p.insuranceCard || '')}">
                            </div>
                            <div class="form-field">
                                <label>Plano</label>
                                <input type="text" name="insurancePlan" value="${escapeHtml(p.insurancePlan || '')}">
                            </div>
                            <div class="form-field">
                                <label>Validade</label>
                                <input type="text" name="insuranceExpiration" class="mask-date" 
                                       value="${escapeHtml(p.insuranceExpiration || '')}" placeholder="DD/MM/AAAA">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Observações -->
                <div class="form-section">
                    <h4>Observações</h4>
                    <div class="form-field">
                        <textarea name="notes" rows="3">${escapeHtml(p.notes || '')}</textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeSlidePanel()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar alterações</button>
                </div>
                ${isEdit ? `
                    <div class="form-actions danger-zone">
                        <button type="button" class="btn btn-danger" onclick="deletePatient('${escapeHtml(p._row || '')}')">
                            Excluir paciente
                        </button>
                    </div>
                ` : ''}
            </form>
        </div>
    `;

    setSlideContent(html);
    applyMasks();
    openSlidePanel();

    // Armazenar retorno pendente do agendamento (se existir)
    window._patientFormReturn = isEdit ? null : (window._returnToAppointment || null);
}

// Alterna visibilidade dos campos de convênio
function toggleInsuranceFields(show) {
    const container = document.getElementById('insurance-fields');
    if (container) {
        container.style.display = show ? 'block' : 'none';
    }
}

// Aplica máscaras aos inputs
function applyMasks() {
    document.querySelectorAll('.mask-cpf').forEach(input => {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
        });
    });

    document.querySelectorAll('.mask-phone').forEach(input => {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length > 10) {
                value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (value.length > 6) {
                value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
            } else {
                value = value.replace(/(\d{0,2})/, '($1');
            }
            e.target.value = value;
        });
    });

    document.querySelectorAll('.mask-cep').forEach(input => {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 8) value = value.slice(0, 8);
            if (value.length > 5) {
                value = value.replace(/(\d{5})(\d{1,3})/, '$1-$2');
            }
            e.target.value = value;
        });
    });

    document.querySelectorAll('.mask-date').forEach(input => {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 8) value = value.slice(0, 8);
            if (value.length > 4) {
                value = value.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
            } else if (value.length > 2) {
                value = value.replace(/(\d{2})(\d{0,2})/, '$1/$2');
            }
            e.target.value = value;
        });
    });
}

// Valida CPF
function isValidCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
    let rest = 11 - (sum % 11);
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.charAt(9))) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
    rest = 11 - (sum % 11);
    if (rest === 10 || rest === 11) rest = 0;
    return rest === parseInt(cpf.charAt(10));
}

// Função chamada no submit do formulário
async function handlePatientSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    // Montar objeto com todos os campos
    const data = {
        id: form.dataset.id || null,
        name: formData.get('name')?.trim() || '',
        birthDate: formData.get('birthDate') || '',
        gender: formData.get('gender') || '',
        maritalStatus: formData.get('maritalStatus') || '',
        profession: formData.get('profession') || '',
        cpf: formData.get('cpf') || '',
        rg: formData.get('rg') || '',
        phone: formData.get('phone') || '',
        mobile: formData.get('mobile') || '',
        email: formData.get('email') || '',
        sendReminders: formData.get('sendReminders') ? 'Sim' : 'Não',
        zipCode: formData.get('zipCode') || '',
        address: formData.get('address') || '',
        number: formData.get('number') || '',
        complement: formData.get('complement') || '',
        neighborhood: formData.get('neighborhood') || '',
        city: formData.get('city') || '',
        state: formData.get('state') || '',
        motherName: formData.get('motherName') || '',
        fatherName: formData.get('fatherName') || '',
        familyContactName: formData.get('familyContactName') || '',
        familyContactRelationship: formData.get('familyContactRelationship') || '',
        familyContactPhone: formData.get('familyContactPhone') || '',
        hasInsurance: formData.get('hasInsurance') ? 'Sim' : 'Não',
        insuranceName: formData.get('insuranceName') || '',
        insuranceCard: formData.get('insuranceCard') || '',
        insurancePlan: formData.get('insurancePlan') || '',
        insuranceExpiration: formData.get('insuranceExpiration') || '',
        notes: formData.get('notes') || ''
    };

    // Validações
    if (!data.name) {
        showToast('Nome é obrigatório', 'error');
        return;
    }
    if (data.cpf && !isValidCPF(data.cpf)) {
        showToast('CPF inválido', 'error');
        return;
    }

    try {
        // Salvar via API
        if (data.id) {
            await window.pluriAPI.updatePatient(data.id, data);
            showToast('Paciente atualizado com sucesso!', 'success');
        } else {
            const result = await window.pluriAPI.createPatient(data);
            if (result && result.row) {
                data.id = result.row;
            }
            showToast('Paciente criado com sucesso!', 'success');
        }

        closeSlidePanel();

        // Recarregar lista de pacientes
        if (window.pluriAPI && typeof window.pluriAPI.getPatients === 'function') {
            state.patients = await window.pluriAPI.getPatients();
        }

        // Verificar retorno pendente do agendamento
        if (window._patientFormReturn) {
            const returnFn = window._patientFormReturn;
            window._patientFormReturn = null;
            returnFn(data);
        } else {
            // Se houver retorno global (compatibilidade)
            if (window._returnToAppointment === true) {
                window._returnToAppointment = false;
                closeSlidePanel();
                setTimeout(() => {
                    openModal(null, data.name, data.phone || data.mobile);
                }, 150);
                return;
            }
            // Cadastro normal pela aba Pacientes
            renderPage();
        }
    } catch (error) {
        console.error(error);
        showToast('Erro ao salvar paciente', 'error');
    }
}

// Excluir paciente (chamada do formulário de edição)
async function deletePatient(row) {
    if (!row) return;

    const confirmed = window.confirm('Tem certeza que deseja excluir este paciente?');
    if (!confirmed) return;

    try {
        const result = await window.pluriAPI.deletePatient(row);
        if (!result?.success) {
            throw new Error(result?.error || 'Não foi possível excluir o paciente.');
        }

        state.patients = await window.pluriAPI.getPatients();
        closeSlidePanel();
        showToast('Paciente excluído com sucesso!', 'success');
        renderPage();
    } catch (e) {
        console.error('Erro ao excluir paciente:', e);
        showToast(e.message || 'Não foi possível excluir o paciente.');
    }
}

// Expor funções globalmente
window.openSlidePanel = openSlidePanel;
window.closeSlidePanel = closeSlidePanel;
window.setSlideContent = setSlideContent;
window.openPatientForm = openPatientForm;
window.toggleInsuranceFields = toggleInsuranceFields;
window.applyMasks = applyMasks;
window.isValidCPF = isValidCPF;
window.handlePatientSubmit = handlePatientSubmit;
window.deletePatient = deletePatient;
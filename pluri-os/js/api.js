// js/api.js (versão fetch – compatível com página servida pelo Apps Script)

// ============ FUNÇÕES AUXILIARES GLOBAIS ============

/**
 * Escapa caracteres especiais para evitar XSS
 */
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Calcula idade a partir da data de nascimento
 * @param {string} birthDate - Data no formato aceito pelo Date
 * @returns {number|string} Idade ou string vazia se inválido
 */
function calculateAge(birthDate) {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

class PluriAPI {
    constructor(config) {
        this.config = config;
        this.token = null;
    }

    setSessionToken(token) {
        this.token = token;
    }

    // -------------------------------------------------
    // HTTP com fetch
    // -------------------------------------------------
    async get(url) {
        try {
            showLoading('Carregando...');
            console.log('🌐 [GET]', url);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const json = await response.json();
            if (json && json.error) {
                throw new Error(json.error);
            }
            return json;
        } catch (e) {
            console.error('[GET]', e.message);
            return null;
        } finally {
            hideLoading();
        }
    }

    async post(body) {
        try {
            showLoading('Salvando...');
            const response = await fetch(
                this.config.appsScript.baseUrl,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(body)
                }
            );
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();
            if (json && json.error) throw new Error(json.error);
            return json;
        } catch (e) {
            console.error('[POST]', e.message);
            return { success: false, error: e.message };
        } finally {
            hideLoading();
        }
    }

    // -------------------------------------------------
    // FORMATADORES
    // -------------------------------------------------
    formatDate(value) {
        if (!value) return '';
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        const d = new Date(value);
        if (isNaN(d)) return '';
        return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
    }
    formatTime(value) {
        if (!value) return '';
        if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) return value;
        const d = new Date(value);
        if (isNaN(d)) return '';
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    normalizeStatus(status, def = 'Ativo') { return status || def; }
    toId(value) { return Number(value) || value; }

    // -------------------------------------------------
    // PACIENTES
    // -------------------------------------------------
    async getPatients() {
        const data = await this.get(this.config.appsScript.pacientes);
        return Array.isArray(data) ? data.map(p => this.mapPatient(p)) : [];
    }

    mapPatient(p) {
        const birthDate: this.formatDate(p['Nascimento']) 
    ? this.formatDate(p['Nascimento']).split('-').reverse().join('/') 
    : ''
        const age = birthDate ? calculateAge(birthDate) : '';

        return {
            _row: p._row,
            id: p._row,

            // Campos básicos (mantidos)
            name: p['Nome'] || '',
            phone: p['Telefone'] || '',
            email: p['E-mail'] || '',
            created: this.formatDate(p['Data de cadastro']),
            lastVisit: this.formatDate(p['Último atendimento']),
            nextAppt: this.formatDate(p['Próxima consulta']),
            status: this.normalizeStatus(p['Status']),
            notes: p['Observações'] || '',

            // ========== NOVOS CAMPOS ==========
            birthDate: birthDate,
            age: age,
            gender: p['Sexo'] || '',
            maritalStatus: p['Estado civil'] || p['Estado Civil'] || '',
            profession: p['Profissão'] || '',
            cpf: p['CPF'] || '',
            rg: p['RG'] || '',
            mobile: p['Celular'] || '',
            sendReminders: p['Enviar lembretes'] || p['Enviar Lembretes'] || 'Não',
            zipCode: p['CEP'] || '',
            address: p['Endereço'] || '',
            number: p['Número'] || '',
            complement: p['Complemento'] || '',
            neighborhood: p['Bairro'] || '',
            city: p['Cidade'] || '',
            state: p['UF'] || p['Estado'] || '',
            motherName: p['Nome da Mãe'] || p['Nome da mãe'] || '',
            fatherName: p['Nome do Pai'] || p['Nome do pai'] || '',
            familyContactName: p['Contato Familiar'] || p['Contato familiar'] || '',
            familyContactRelationship: p['Grau de Parentesco'] || p['Grau de parentesco'] || '',
            familyContactPhone: p['Telefone Familiar'] || p['Telefone familiar'] || '',
            hasInsurance: p['Possui Convênio'] || p['Possui convenio'] || 'Não',
            insuranceName: p['Convênio'] || p['Convenio'] || '',
            insuranceCard: p['Carteirinha'] || '',
            insurancePlan: p['Plano'] || '',
            insuranceExpiration: p['Validade'] || '',
            professional: p['Profissional'] || '' // caso venha de outra tabela
        };
    }

    async createPatient(patient) {
        const values = {
            Nome: patient.name || '',
            'Data de cadastro': patient.created || new Date().toISOString().slice(0, 10),
            'Último atendimento': patient.lastVisit || '',
            'Próxima consulta': patient.nextAppt || '',
            Status: patient.status || 'Ativo',
            Observações: patient.notes || '',

            // ========== NOVOS CAMPOS ==========
            'Nascimento': patient.birthDate || '',
            'Sexo': patient.gender || '',
            'Estado civil': patient.maritalStatus || '',
            'Profissão': patient.profession || '',
            'CPF': patient.cpf || '',
            'RG': patient.rg || '',
            'Telefone': patient.phone || '',
            'Celular': patient.mobile || '',
            'E-mail': patient.email || '',
            'Enviar lembretes': patient.sendReminders || 'Não',
            'CEP': patient.zipCode || '',
            'Endereço': patient.address || '',
            'Número': patient.number || '',
            'Complemento': patient.complement || '',
            'Bairro': patient.neighborhood || '',
            'Cidade': patient.city || '',
            'UF': patient.state || '',
            'Nome da Mãe': patient.motherName || '',
            'Nome do Pai': patient.fatherName || '',
            'Contato Familiar': patient.familyContactName || '',
            'Grau de Parentesco': patient.familyContactRelationship || '',
            'Telefone Familiar': patient.familyContactPhone || '',
            'Possui Convênio': patient.hasInsurance || 'Não',
            'Convênio': patient.insuranceName || '',
            'Carteirinha': patient.insuranceCard || '',
            'Plano': patient.insurancePlan || '',
            'Validade': patient.insuranceExpiration || ''
        };

        return this.post({
            action: 'create',
            sheet: 'Pacientes',
            values: values
        });
    }

    async updatePatient(row, patient) {
        const values = {
            Nome: patient.name || '',
            Telefone: patient.phone || '',
            'E-mail': patient.email || '',
            Observações: patient.notes || '',
            Status: patient.status || 'Ativo',

            // ========== NOVOS CAMPOS (editáveis) ==========
            'Nascimento': patient.birthDate || '',
            'Sexo': patient.gender || '',
            'Estado civil': patient.maritalStatus || '',
            'Profissão': patient.profession || '',
            'CPF': patient.cpf || '',
            'RG': patient.rg || '',
            'Celular': patient.mobile || '',
            'Enviar lembretes': patient.sendReminders || 'Não',
            'CEP': patient.zipCode || '',
            'Endereço': patient.address || '',
            'Número': patient.number || '',
            'Complemento': patient.complement || '',
            'Bairro': patient.neighborhood || '',
            'Cidade': patient.city || '',
            'UF': patient.state || '',
            'Nome da Mãe': patient.motherName || '',
            'Nome do Pai': patient.fatherName || '',
            'Contato Familiar': patient.familyContactName || '',
            'Grau de Parentesco': patient.familyContactRelationship || '',
            'Telefone Familiar': patient.familyContactPhone || '',
            'Possui Convênio': patient.hasInsurance || 'Não',
            'Convênio': patient.insuranceName || '',
            'Carteirinha': patient.insuranceCard || '',
            'Plano': patient.insurancePlan || '',
            'Validade': patient.insuranceExpiration || ''
        };

        return this.post({
            action: 'update',
            sheet: 'Pacientes',
            row: row,
            values: values
        });
    }

    async deletePatient(row) {
        return this.post({ action: 'delete', sheet: 'Pacientes', row });
    }

    // -------------------------------------------------
    // EQUIPE (métodos originais usando CRUD genérico)
    // -------------------------------------------------
    async getStaff() {
        const data = await this.get(this.config.appsScript.equipe);
        return Array.isArray(data) ? data.map(s => this.mapStaff(s)) : [];
    }
    mapStaff(staff) {
        return {
            _row: staff._row,
            id: staff._row,
            name: staff['Nome'] || '',
            role: staff['Função'] || '',
            email: staff['E-mail'] || '',
            phone: staff['Telefone'] || '',
            status: this.normalizeStatus(staff['Status'])
        };
    }
    async createStaff(member) {
        return this.post({
            action: 'create',
            sheet: 'Equipe',
            values: {
                Nome: member.name,
                Função: member.role || member.specialty || '',
                'E-mail': member.email || '',
                Telefone: member.phone || '',
                Status: member.status || 'Ativo'
            }
        });
    }
    async updateStaff(row, member) {
        return this.post({
            action: 'update',
            sheet: 'Equipe',
            row,
            values: {
                Nome: member.name,
                Função: member.role || member.specialty || '',
                'E-mail': member.email || '',
                Telefone: member.phone || '',
                Status: member.status || 'Ativo'
            }
        });
    }
    async deleteStaff(row) {
        return this.post({ action: 'delete', sheet: 'Equipe', row });
    }

    /* ======================================================
       CLÍNICA
    ====================================================== */
    async getClinic() {
        const data = await this.get(
            this.config.appsScript.baseUrl + '?action=clinic'
        );
        return data.clinic || {
            name: '',
            phone: '',
            email: '',
            address: '',
            hours: ''
        };
    }

    async saveClinic(clinic) {
        return this.post({
            action: 'updateClinic',
            values: {
                Nome: clinic.name,
                Telefone: clinic.phone,
                'E-mail': clinic.email,
                Endereço: clinic.address,
                Horário: clinic.hours
            }
        });
    }

    // -------------------------------------------------
    // CALENDAR
    // -------------------------------------------------
    async getCalendarAppointments(date = null) {
        if (!this.token) return [];
        let url = `${this.config.appsScript.baseUrl}?action=calendar_user&token=${encodeURIComponent(this.token)}`;
        if (date) url += `&date=${encodeURIComponent(date)}`;
        const data = await this.get(url);
        if (!data || !data.success) {
            if (data && data.error === 'NOT_CONNECTED') {
                window.dispatchEvent(new CustomEvent('calendar:not_connected'));
            }
            return [];
        }
        return Array.isArray(data.events) ? data.events.map(e => this.mapCalendarEvent(e)) : [];
    }

    async getCalendarAuthUrl() {
        if (!this.token) throw new Error('Token de sessão ausente.');
        const url = `${this.config.appsScript.baseUrl}?action=oauth_start&token=${encodeURIComponent(this.token)}`;
        const data = await this.get(url);
        if (data && data.success && data.url) return data.url;
        throw new Error(data?.error || 'Falha ao obter URL de autorização.');
    }

    async isCalendarConnected() {
        if (!this.token) return false;
        const url = `${this.config.appsScript.baseUrl}?action=calendar_user&token=${encodeURIComponent(this.token)}`;
        const data = await this.get(url);
        return data && data.success;
    }

    mapCalendarEvent(event) {
        return {
            id: event.id,
            time: this.formatTime(event.time),
            patient: event.patient || '',
            professional: event.professional || '',
            service: event.service || '',
            phone: event.phone || '',
            notes: event.notes || '',
            status: event.status || 'Aguardando',
            date: this.formatDate(event.date)
        };
    }

    async createAppointment(appointment) {
        return this.post({
            action: 'createCalendarEvent',
            patient: appointment.patient,
            professional: appointment.professional,
            service: appointment.service,
            phone: appointment.phone,
            notes: appointment.notes,
            status: appointment.status,
            date: appointment.date,
            time: appointment.time,
            clinicaID: appointment.clinicaID
        });
    }

    async updateAppointment(appointment) {
        return this.post({
            action: 'updateCalendarEvent',
            id: appointment.id,
            patient: appointment.patient,
            professional: appointment.professional,
            service: appointment.service,
            phone: appointment.phone,
            notes: appointment.notes,
            status: appointment.status,
            date: appointment.date,
            time: appointment.time,
            clinicaID: appointment.clinicaID
        });
    }

    async deleteAppointment(id, clinicaID) {
        return this.post({
            action: 'deleteCalendarEvent',
            id: id,
            clinicaID: clinicaID
        });
    }

    // -------------------------------------------------
    // CONVERSAS
    // -------------------------------------------------
    async getConversations() {
        const data = await this.get(this.config.appsScript.conversas);
        return Array.isArray(data) ? data.map(c => this.mapConversation(c)) : [];
    }
    mapConversation(c) {
        return {
            _row: c._row,
            id: c.id || c._row,

            patient:
                c.patient ||
                c.nome ||
                c['Nome'] ||
                '',

            phone:
                c.phone ||
                c.telefone ||
                c['Telefone'] ||
                '',

            email:
                c.email ||
                c['e-mail'] ||
                c['E-mail'] ||
                '',

            procedure:
                c.procedure ||
                c.procedimento ||
                c['Procedimento'] ||
                '',

            summary:
                c.summary ||
                c['Resumo_conversa'] ||
                c['Resumo conversa'] ||
                c['Resumo'] ||
                '',

            lastMsg:
                c.lastMsg ||
                c['Última mensagem'] ||
                c['Ultima mensagem'] ||
                c.summary ||
                c['Resumo_conversa'] ||
                '',

            conversationDate:
                c.conversationDate ||
                c['data da conversa'] ||
                c['Data da conversa'] ||
                c['Data'] ||
                '',

            status:
                this.normalizeStatus(
                    c.status ||
                    c['Status'],
                    'Aguardando'
                )
        };
    }
    async getConversation(id) {
        const list = await this.getConversations();
        return list.find(c => String(c.id) === String(id));
    }

    async updateConversation(row, status) {
        return this.post({
            action: 'update',
            sheet: 'Contatos_e_Agendamentos',
            row: row,
            values: {
                Status: status
            }
        });
    }
    async findConversationByPhone(phone) {
        const list = await this.getConversations();
        return list.find(c => c.phone === phone);
    }
    async findConversationByPatient(name) {
        const list = await this.getConversations();
        return list.find(c => c.patient.toLowerCase() === name.toLowerCase());
    }

    // -------------------------------------------------
    // CLÍNICA (métodos originais usando CRUD genérico)
    // -------------------------------------------------
    // (Este bloco duplicado foi mantido, mas pode ser removido se preferir)
    async getClinicLegacy() {
        const url = `${this.config.appsScript.baseUrl}?action=clinic`;
        const data = await this.get(url);
        return this.mapClinic(data?.clinic || data || {});
    }
    mapClinic(clinic) {
        return {
            name: clinic.name || '',
            phone: clinic.phone || '',
            email: clinic.email || '',
            address: clinic.address || '',
            hours: clinic.hours || ''
        };
    }
    async updateClinicLegacy(clinic) {
        return this.post({
            action: 'update',
            sheet: 'Clinica',
            row: 2,
            values: {
                Nome: clinic.name,
                Telefone: clinic.phone,
                'E-mail': clinic.email,
                Endereço: clinic.address,
                Horário: clinic.hours
            }
        });
    }
}

window.pluriAPI = null;   // será instanciado no app.js

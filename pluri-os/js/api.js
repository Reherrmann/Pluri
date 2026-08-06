// js/api.js (versão fetch – compatível com página servida pelo Apps Script)

class PluriAPI {
    constructor(config) {
        this.config = config;
        this.token = null;
    }

    setSessionToken(token) {
        this.token = token;
    }

    // -------------------------------------------------
    // HTTP com fetch (agora sem CORS, pois a origem é o próprio script)
    // -------------------------------------------------
    async get(url) {
    try {
        console.log('🌐 [GET]', url);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (json && json.error) throw new Error(json.error);
        return json;
    } catch (e) {
        console.error('[GET]', e.message);
        return null;
    }
}

    async post(body) {
        try {
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
        }
    }

    // -------------------------------------------------
    // FORMATADORES
    // -------------------------------------------------
    formatDate(value) {
        if (!value) return '';
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
        return {
            _row: p._row, id: p._row,
            name: p['Nome'] || '', phone: p['Telefone'] || '', email: p['E-mail'] || '',
            created: this.formatDate(p['Data de cadastro']),
            lastVisit: this.formatDate(p['Último atendimento']),
            nextAppt: this.formatDate(p['Próxima consulta']),
            status: this.normalizeStatus(p['Status']),
            notes: p['Observações'] || ''
        };
    }
    async createPatient(patient) {
        return this.post({
            action: 'create', sheet: 'Pacientes', values: {
                Nome: patient.name, Telefone: patient.phone, 'E-mail': patient.email,
                'Data de cadastro': patient.created, 'Último atendimento': patient.lastVisit,
                'Próxima consulta': patient.nextAppt, Status: patient.status, Observações: patient.notes
            }
        });
    }
    async updatePatient(row, patient) {
        return this.post({
            action: 'update', sheet: 'Pacientes', row,
            values: { Nome: patient.name, Telefone: patient.phone, 'E-mail': patient.email, Observações: patient.notes, Status: patient.status }
        });
    }
    async deletePatient(row) {
        return this.post({ action: 'delete', sheet: 'Pacientes', row });
    }

    // -------------------------------------------------
    // EQUIPE
    // -------------------------------------------------
    async getStaff() {
        const data = await this.get(this.config.appsScript.equipe);
        return Array.isArray(data) ? data.map(s => this.mapStaff(s)) : [];
    }
    mapStaff(staff) {
        return {
            _row: staff._row, id: staff._row,
            name: staff['Nome'] || '', role: staff['Função'] || '', email: staff['E-mail'] || '',
            phone: staff['Telefone'] || '', status: this.normalizeStatus(staff['Status'])
        };
    }
    async createStaff(member) {
        return this.post({
            action: 'create', sheet: 'Equipe', values: {
                Nome: member.name, Função: member.role, 'E-mail': member.email, Telefone: member.phone, Status: member.status
            }
        });
    }
    async updateStaff(row, member) {
        return this.post({
            action: 'update', sheet: 'Equipe', row,
            values: { Nome: member.name, Função: member.role, 'E-mail': member.email, Telefone: member.phone, Status: member.status }
        });
    }
    async deleteStaff(row) {
        return this.post({ action: 'delete', sheet: 'Equipe', row });
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
        const url = `${this.config.appsScript.baseUrl}?action=oauth_start&token=${encodeURIComponent(this.token)}`;
        const data = await this.get(url);
        return data && data.success && data.url === null;
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
            status: event.status || 'Confirmado',
            date: this.formatDate(event.date)
        };
    }

    async createAppointment(appointment) {
        return this.post({
            action: 'createCalendarEvent',
            patient: appointment.patient, professional: appointment.professional, service: appointment.service,
            phone: appointment.phone, notes: appointment.notes, status: appointment.status,
            date: appointment.date, time: appointment.time
        });
    }
    async updateAppointment(appointment) {
        return this.post({
            action: 'updateCalendarEvent',
            id: appointment.id, patient: appointment.patient, professional: appointment.professional,
            service: appointment.service, phone: appointment.phone, notes: appointment.notes,
            status: appointment.status, date: appointment.date, time: appointment.time
        });
    }
    async deleteAppointment(id) {
        return this.post({ action: 'deleteCalendarEvent', id });
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
            _row: c._row, id: c.id || c._row,
            patient: c.patient || c.nome || '', phone: c.phone || c.telefone || '',
            email: c.email || c['e-mail'] || '', procedure: c.procedure || c.procedimento || '',
            summary: c.summary || '', lastMsg: c.lastMsg || c.summary || '',
            conversationDate: this.formatDate(c.conversationDate || c['data da conversa']),
            status: this.normalizeStatus(c.status, 'Aguardando')
        };
    }
    async getConversation(id) {
        const list = await this.getConversations();
        return list.find(c => String(c.id) === String(id));
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
    // CLÍNICA
    // -------------------------------------------------
    async getClinic() {
        const url = `${this.config.appsScript.baseUrl}?action=clinic`;
        const data = await this.get(url);
        return this.mapClinic(data?.clinic || data || {});
    }
    mapClinic(clinic) {
        return {
            name: clinic.name || '', phone: clinic.phone || '', email: clinic.email || '',
            address: clinic.address || '', hours: clinic.hours || ''
        };
    }
    async updateClinic(clinic) {
        return this.post({
            action: 'updateClinic',
            values: { Nome: clinic.name, Telefone: clinic.phone, 'E-mail': clinic.email, Endereço: clinic.address, Horário: clinic.hours }
        });
    }
}

window.pluriAPI = null;

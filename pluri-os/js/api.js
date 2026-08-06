// js/api.js (versão para Google Apps Script)

class PluriAPI {
    constructor(config) {
        this.config = config;
        this.token = null;
    }

    setSessionToken(token) {
        this.token = token;
    }

    // Helper para chamar funções do servidor via google.script.run
    _callServer(methodName, ...args) {
        return new Promise((resolve, reject) => {
            if (typeof google === 'undefined' || !google.script) {
                reject(new Error('google.script.run não disponível.'));
                return;
            }
            google.script.run
                .withSuccessHandler(resolve)
                .withFailureHandler(err => reject(new Error(err.message)))
                [methodName](...args);
        });
    }

    // PACIENTES
    async getPatients() {
        const data = await this._callServer('getPatientsData');
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
    async createPatient(patient) { return this._callServer('createPatientServer', patient); }
    async updatePatient(row, patient) { return this._callServer('updatePatientServer', row, patient); }
    async deletePatient(row) { return this._callServer('deletePatientServer', row); }

    // EQUIPE
    async getStaff() {
        const data = await this._callServer('getStaffData');
        return Array.isArray(data) ? data.map(s => this.mapStaff(s)) : [];
    }
    mapStaff(staff) {
        return {
            _row: staff._row, id: staff._row,
            name: staff['Nome'] || '', role: staff['Função'] || '', email: staff['E-mail'] || '',
            phone: staff['Telefone'] || '', status: this.normalizeStatus(staff['Status'])
        };
    }
    async createStaff(member) { return this._callServer('createStaffServer', member); }
    async updateStaff(row, member) { return this._callServer('updateStaffServer', row, member); }
    async deleteStaff(row) { return this._callServer('deleteStaffServer', row); }

    // CALENDAR
    async getCalendarAppointments(date = null) {
        if (!this.token) return [];
        const data = await this._callServer('getCalendarAppointmentsServer', this.token, date);
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
        const data = await this._callServer('getAuthUrlServer', this.token);
        if (data && data.success && data.url) return data.url;
        throw new Error(data?.error || 'Falha ao obter URL de autorização.');
    }

    async isCalendarConnected() {
        if (!this.token) return false;
        const data = await this._callServer('getAuthUrlServer', this.token);
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

    async createAppointment(appointment) { return this._callServer('createAppointmentServer', appointment); }
    async updateAppointment(appointment) { return this._callServer('updateAppointmentServer', appointment); }
    async deleteAppointment(id) { return this._callServer('deleteAppointmentServer', id); }

    // CONVERSAS
    async getConversations() {
        const data = await this._callServer('getConversationsData');
        return Array.isArray(data) ? data.map(c => this.mapConversation(c)) : [];
    }
    mapConversation(c) { /* ... mesma implementação ... */ }

    // CLÍNICA
    async getClinic() {
        const data = await this._callServer('getClinicData');
        return this.mapClinic(data);
    }
    mapClinic(clinic) { /* ... */ }

    // FORMATADORES (mantidos)
    formatDate(value) { /* ... */ }
    formatTime(value) { /* ... */ }
    normalizeStatus(status, def = 'Ativo') { return status || def; }
    toId(value) { return Number(value) || value; }
}

window.pluriAPI = null;

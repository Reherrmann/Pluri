// js/api.js
class PluriAPI {
    constructor(config) {
        this.config = config;
    }

    async fetchFromAppsScript(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Erro ao buscar dados');
            const data = await res.json();
            return data;
        } catch (e) {
            console.warn('Apps Script:', e.message);
            return null;
        }
    }

    async getPatients() {
        return await this.fetchFromAppsScript(this.config.appsScript.pacientes);
    }

    async getAppointments() {
        return await this.fetchFromAppsScript(this.config.appsScript.agendamentos);
    }

    async getStaff() {
        return await this.fetchFromAppsScript(this.config.appsScript.equipe);
    }

    async saveAppointment(appointment) {
        try {
            const params = new URLSearchParams();
            params.append('action', 'append');
            params.append('sheet', 'Agendamentos');
            params.append('row', JSON.stringify([
                appointment.id.toString(),
                appointment.time,
                appointment.patient,
                appointment.professional,
                appointment.service,
                appointment.status,
                appointment.date,
            ]));

            const res = await fetch(this.config.appsScript.salvarAgendamento, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });
            const result = await res.json();
            console.log('Agendamento salvo:', result);
            return result;
        } catch (e) {
            console.warn('Erro ao salvar:', e.message);
            return null;
        }
    }
}

window.pluriAPI = null;

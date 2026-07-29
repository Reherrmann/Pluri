// js/api.js — Integração via Google Apps Script
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
            const res = await fetch(this.config.appsScript.salvarAgendamento, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointment),
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

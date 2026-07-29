// js/api.js
class PluriAPI {
    constructor(config) {
        this.config = config;
    }

    async fetchFromAppsScript(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Erro ao buscar dados');
            return await res.json();
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
            const body = {
                action: 'create',
                sheet: 'Agendamentos',
                values: {
                    ID: appointment.id.toString(),
                    Horário: appointment.time,
                    Paciente: appointment.patient,
                    Profissional: appointment.professional,
                    Serviço: appointment.service,
                    Status: appointment.status,
                    Data: appointment.date,
                }
            };

            const res = await fetch(this.config.appsScript.salvarAgendamento, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(body),
            });
            return await res.json();
        } catch (e) {
            console.warn('Erro ao salvar:', e.message);
            return null;
        }
    }

    async getCalendarAppointments(dateStr = null) {
        let url = this.config.appsScript.calendarEvents;
        if (dateStr) url = this.config.appsScript.calendarEventsDate + dateStr;
        const events = await this.fetchFromAppsScript(url);
        if (!events || !Array.isArray(events)) return [];
        return events;
    }
}

window.pluriAPI = null;

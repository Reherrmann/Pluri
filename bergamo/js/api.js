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
        const data = await this.fetchFromAppsScript(this.config.appsScript.pacientes);
        if (!data || !Array.isArray(data)) return [];
        return data.map(p => ({
            _row: p._row,
            id: p._row,
            name: p['Nome'] || '',
            phone: p['Telefone'] || '',
            email: p['E-mail'] || '',
            created: p['Data de cadastro'] || '',
            lastVisit: p['Último atendimento'] || '',
            nextAppt: p['Próxima consulta'] || '',
            status: p['Status'] || 'Ativo',
            notes: p['Observações'] || '',
        }));
    }

    async getAppointments() {
        const data = await this.fetchFromAppsScript(this.config.appsScript.agendamentos);
        if (!data || !Array.isArray(data)) return [];
        return data.map(a => ({
            id: parseInt(a['ID']) || a._row,
            time: a['Horário'] || '',
            patient: a['Paciente'] || '',
            professional: a['Profissional'] || '',
            service: a['Serviço'] || '',
            status: a['Status'] || 'Pendente',
            date: a['Data'] || '',
        }));
    }

    async getStaff() {
        const data = await this.fetchFromAppsScript(this.config.appsScript.equipe);
        if (!data || !Array.isArray(data)) return [];
        return data.map(s => ({
            _row: s._row,
            id: s._row,
            name: s['Nome'] || '',
            role: s['Função'] || '',
            status: s['Status'] || 'Ativo',
            email: s['E-mail'] || '',
            phone: s['Telefone'] || '',
        }));
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

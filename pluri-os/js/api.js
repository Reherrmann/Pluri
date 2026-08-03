// js/api.js

class PluriAPI {
    constructor(config) {
        this.config = config;
    }

    // =========================================================
    // MÉTODOS BASE
    // =========================================================

    async fetchFromAppsScript(url) {
        try {
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error(`Erro HTTP ${res.status}`);
            }

            const data = await res.json();

            // O Apps Script pode retornar erro dentro do JSON
            if (data && data.error) {
                console.error('Apps Script:', data.error);
                return null;
            }

            return data;

        } catch (e) {
            console.warn('Erro ao buscar dados do Apps Script:', e);
            return null;
        }
    }


    async postToAppsScript(body) {
        try {
            const url = this.config.appsScript.salvarAgendamento;

            if (!url) {
                throw new Error('URL do Apps Script para escrita não configurada.');
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (data && data.error) {
                console.error('Apps Script:', data.error);

                return {
                    success: false,
                    error: data.error
                };
            }

            return data;

        } catch (e) {
            console.error('Erro ao enviar dados para Apps Script:', e);

            return {
                success: false,
                error: e.message
            };
        }
    }


    // =========================================================
    // PACIENTES
    // =========================================================

    async getPatients() {
        const data = await this.fetchFromAppsScript(
            this.config.appsScript.pacientes
        );

        if (!data || !Array.isArray(data)) {
            return [];
        }

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
            notes: p['Observações'] || ''
        }));
    }


    async createPatient(patient) {
        return this.postToAppsScript({
            action: 'create',

            // IMPORTANTE:
            // precisa ser exatamente o nome da aba no Google Sheets
            sheet: 'Pacientes',

            values: {
                Nome: patient.name,
                Telefone: patient.phone,
                'E-mail': patient.email || '',
                'Data de cadastro': patient.created || '',
                'Último atendimento': patient.lastVisit || '',
                'Próxima consulta': patient.nextAppt || '',
                Status: patient.status || 'Novo',
                Observações: patient.notes || ''
            }
        });
    }


    async updatePatient(row, patient) {
        return this.postToAppsScript({
            action: 'update',
            sheet: 'Pacientes',
            row: row,

            values: {
                Nome: patient.name,
                Telefone: patient.phone,
                'E-mail': patient.email || '',
                Observações: patient.notes || ''
            }
        });
    }


    // =========================================================
    // EQUIPE
    // =========================================================

    async getStaff() {
        const data = await this.fetchFromAppsScript(
            this.config.appsScript.equipe
        );

        if (!data || !Array.isArray(data)) {
            return [];
        }

        return data.map(s => ({
            _row: s._row,
            id: s._row,

            name: s['Nome'] || '',
            role: s['Função'] || '',
            status: s['Status'] || 'Ativo',
            email: s['E-mail'] || '',
            phone: s['Telefone'] || ''
        }));
    }


    async createStaff(member) {
        return this.postToAppsScript({
            action: 'create',

            // IMPORTANTE:
            // precisa ser exatamente o nome da aba no Google Sheets
            sheet: 'Equipe',

            values: {
                Nome: member.name,
                Função: member.role,
                'E-mail': member.email || '',
                Telefone: member.phone || '',
                Status: member.status || 'Ativo'
            }
        });
    }


    async updateStaff(row, member) {
        return this.postToAppsScript({
            action: 'update',
            sheet: 'Equipe',
            row: row,

            values: {
                Nome: member.name,
                Função: member.role,
                'E-mail': member.email || '',
                Telefone: member.phone || '',
                Status: member.status || 'Ativo'
            }
        });
    }


    // =========================================================
    // AGENDAMENTOS — GOOGLE SHEETS
    // =========================================================

    async getAppointments() {
        const data = await this.fetchFromAppsScript(
            this.config.appsScript.agendamentos
        );

        if (!data || !Array.isArray(data)) {
            return [];
        }

        return data.map(a => ({
            id: parseInt(a['ID']) || a._row,

            time: a['Horário'] || '',
            patient: a['Paciente'] || '',
            professional: a['Profissional'] || '',
            service: a['Serviço'] || '',
            status: a['Status'] || 'Pendente',
            date: a['Data'] || ''
        }));
    }


    async saveAppointment(appointment) {
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
                Data: appointment.date
            }
        };

        return this.postToAppsScript(body);
    }

    // =========================================================
// CONVERSAS
// =========================================================

async getConversations() {

    const data = await this.fetchFromAppsScript(
        this.config.appsScript.conversas
    );

    if (!data || !Array.isArray(data)) {
        return [];
    }

    return data.map(c => ({

        _row: c._row,
        id: c._row,

        patient: c['nome'] || '',
        phone: c['telefone'] || '',
        email: c['e-mail'] || '',

        procedure: c['procedimento'] || '',

        summary: c['Resumo_conversa'] || '',

        lastMsg: c['Resumo_conversa'] || '',

        conversationDate: c['data da conversa'] || '',

        status: c['status'] || 'Aguardando'

    }));
}

    // =========================================================
    // GOOGLE CALENDAR
    // =========================================================

    async getCalendarAppointments(dateStr = null) {
        try {
            let url = this.config.appsScript.calendarEvents;

            if (dateStr) {
                url =
                    this.config.appsScript.calendarEventsDate +
                    encodeURIComponent(dateStr);
            }

            const events = await this.fetchFromAppsScript(url);

            if (!events || !Array.isArray(events)) {
                return [];
            }

            /*
             * O Apps Script já devolve:
             *
             * id
             * time
             * patient
             * professional
             * service
             * status
             * date
             *
             * Mesmo assim normalizamos para evitar
             * algum campo undefined quebrar a Agenda.
             */

            return events.map(event => ({
                id: event.id || '',
                time: event.time || '',
                patient: event.patient || '',
                professional: event.professional || '',
                service: event.service || '',
                status: event.status || 'Confirmado',
                date: event.date || ''
            }));

        } catch (e) {
            console.error(
                'Erro ao carregar Google Calendar:',
                e
            );

            return [];
        }
    }
}


// A instância será criada pelo app.js
window.pluriAPI = null;

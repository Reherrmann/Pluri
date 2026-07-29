// js/api.js — Integração via Google Apps Script
class PluriAPI {
    constructor(config) {
        this.config = config;
        this.baseUrl = config.appsScript.baseUrl;
        this.sheets = config.appsScript.sheets;
    }

    // ---------- leitura ----------
    async readSheet(sheetName) {
        try {
            const url = `${this.baseUrl}?action=read&sheet=${encodeURIComponent(sheetName)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            return data;
        } catch (e) {
            console.warn('Apps Script (read):', e.message);
            return null;
        }
    }

    getPatients() { return this.readSheet(this.sheets.pacientes); }
    getAppointments() { return this.readSheet(this.sheets.agendamentos); }
    getStaff() { return this.readSheet(this.sheets.equipe); }

    // ---------- escrita (create / update / delete) ----------
    // Content-Type 'text/plain' de propósito: evita o preflight CORS que
    // o Apps Script não responde. O corpo continua sendo JSON normal.
    async postAction(payload) {
        try {
            const res = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            return data;
        } catch (e) {
            console.warn(`Apps Script (${payload.action}):`, e.message);
            return null;
        }
    }

    createRow(sheetName, values) {
        return this.postAction({ action: 'create', sheet: sheetName, values });
    }

    updateRow(sheetName, row, values) {
        return this.postAction({ action: 'update', sheet: sheetName, row, values });
    }

    deleteRow(sheetName, row) {
        return this.postAction({ action: 'delete', sheet: sheetName, row });
    }

    // Atalhos específicos de paciente, usados em pacientes.js
    updatePatient(row, values) { return this.updateRow(this.sheets.pacientes, row, values); }
    deletePatient(row) { return this.deleteRow(this.sheets.pacientes, row); }
    createPatient(values) { return this.createRow(this.sheets.pacientes, values); }

    // Mantido por compatibilidade com o código de agenda existente
    async saveAppointment(appointment) {
        return this.createRow(this.sheets.agendamentos, appointment);
    }
}

window.pluriAPI = null;

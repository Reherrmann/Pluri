// js/api.js — Integração via Google Apps Script

// Mapeamento: cabeçalho real da planilha -> campo usado no front-end
const FIELD_MAPS = {
    pacientes: {
        'Nome': 'name',
        'Telefone': 'phone',
        'E-mail': 'email',
        'Data de cadastro': 'created',
        'Último atendimento': 'lastVisit',
        'Próxima consulta': 'nextAppt',
        'Status': 'status',
        'Observações': 'notes',
    },
    agendamentos: {
        'ID': 'id',
        'Horário': 'time',
        'Paciente': 'patient',
        'Profissional': 'professional',
        'Serviço': 'service',
        'Status': 'status',
        'Data': 'date',
    },
    equipe: {
        'Nome': 'name',
        'Função': 'role',
        'Status': 'status',
        'E-mail': 'email',
        'Telefone': 'phone',
    },
};

function normalizeRow(row, map) {
    const out = { _row: row._row };
    Object.entries(map).forEach(([sheetKey, appKey]) => {
        out[appKey] = row[sheetKey] !== undefined ? row[sheetKey] : '';
    });
    return out;
}

function denormalizeValues(values, map) {
    // values chega em camelCase (name, phone...) -> converte para os
    // cabeçalhos reais da planilha (Nome, Telefone...) antes de enviar
    const out = {};
    Object.entries(map).forEach(([sheetKey, appKey]) => {
        if (values[appKey] !== undefined) out[sheetKey] = values[appKey];
    });
    return out;
}

class PluriAPI {
    constructor(config) {
        this.config = config;
        this.baseUrl = config.appsScript.baseUrl;
        this.sheets = config.appsScript.sheets;
    }

    // ---------- leitura ----------
    async readSheet(sheetName, mapKey) {
        try {
            const url = `${this.baseUrl}?action=read&sheet=${encodeURIComponent(sheetName)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            const map = FIELD_MAPS[mapKey];
            return map ? data.map(row => normalizeRow(row, map)) : data;
        } catch (e) {
            console.warn('Apps Script (read):', e.message);
            return null;
        }
    }

    getPatients() { return this.readSheet(this.sheets.pacientes, 'pacientes'); }
    getAppointments() { return this.readSheet(this.sheets.agendamentos, 'agendamentos'); }
    getStaff() { return this.readSheet(this.sheets.equipe, 'equipe'); }

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

    createRow(sheetName, values, mapKey) {
        const map = FIELD_MAPS[mapKey];
        const sheetValues = map ? denormalizeValues(values, map) : values;
        return this.postAction({ action: 'create', sheet: sheetName, values: sheetValues });
    }

    updateRow(sheetName, row, values, mapKey) {
        const map = FIELD_MAPS[mapKey];
        const sheetValues = map ? denormalizeValues(values, map) : values;
        return this.postAction({ action: 'update', sheet: sheetName, row, values: sheetValues });
    }

    deleteRow(sheetName, row) {
        return this.postAction({ action: 'delete', sheet: sheetName, row });
    }

    // Atalhos usados em pacientes.js / configuracoes.js / modal.js
    createPatient(values) { return this.createRow(this.sheets.pacientes, values, 'pacientes'); }
    updatePatient(row, values) { return this.updateRow(this.sheets.pacientes, row, values, 'pacientes'); }
    deletePatient(row) { return this.deleteRow(this.sheets.pacientes, row); }

    createStaff(values) { return this.createRow(this.sheets.equipe, values, 'equipe'); }
    updateStaff(row, values) { return this.updateRow(this.sheets.equipe, row, values, 'equipe'); }
    deleteStaff(row) { return this.deleteRow(this.sheets.equipe, row); }

    async saveAppointment(appointment) {
        return this.createRow(this.sheets.agendamentos, appointment, 'agendamentos');
    }
}

window.pluriAPI = null;

/**
 * PLURI OS — Camada de Armazenamento
 * Toda persistência passa por este módulo.
 * Nunca usar localStorage diretamente em outros arquivos.
 */
const Storage = (() => {
    const PREFIX = 'pluri_';

    /**
     * Salva dado no localStorage
     */
    function saveData(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(PREFIX + key, serialized);
            return true;
        } catch (e) {
            console.error('[Storage] Erro ao salvar:', key, e);
            return false;
        }
    }

    /**
     * Carrega dado do localStorage
     */
    function loadData(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(PREFIX + key);
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            console.error('[Storage] Erro ao carregar:', key, e);
            return defaultValue;
        }
    }

    /**
     * Atualiza parcialmente um objeto armazenado
     */
    function updateData(key, partial) {
        const current = loadData(key, {});
        const updated = { ...current, ...partial };
        return saveData(key, updated);
    }

    /**
     * Remove uma chave
     */
    function deleteData(key) {
        localStorage.removeItem(PREFIX + key);
    }

    /**
     * Lista todas as chaves do sistema
     */
    function listKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(PREFIX)) {
                keys.push(key.replace(PREFIX, ''));
            }
        }
        return keys;
    }

    /**
     * Backup completo: retorna JSON com todos os dados
     */
    function backupData() {
        const backup = {};
        const keys = listKeys();
        keys.forEach(k => {
            backup[k] = loadData(k);
        });
        backup._timestamp = new Date().toISOString();
        backup._version = '1.0';
        return backup;
    }

    /**
     * Restaura backup completo
     */
    function restoreData(backup) {
        try {
            Object.keys(backup).forEach(k => {
                if (k.startsWith('_')) return; // metadados
                saveData(k, backup[k]);
            });
            return true;
        } catch (e) {
            console.error('[Storage] Erro ao restaurar:', e);
            return false;
        }
    }

    /**
     * Exporta backup como arquivo JSON
     */
    function exportBackupFile() {
        const backup = backupData();
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pluri-backup-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Inicializa dados padrão se necessário
     */
    function initDefaults() {
        const defaults = {
            crm_companies: [],
            crm_pipeline_stages: [
                { id: 'lead', name: 'Lead', order: 1 },
                { id: 'contact', name: 'Contato', order: 2 },
                { id: 'proposal', name: 'Proposta', order: 3 },
                { id: 'negotiation', name: 'Negociação', order: 4 },
                { id: 'closed', name: 'Fechado', order: 5 },
                { id: 'lost', name: 'Perdido', order: 6 },
            ],
            finance_transactions: [],
            finance_implantations: [],
            goals: [],
            planning: {
                mission: '',
                vision: '',
                values: '',
                swot: { strengths: '', weaknesses: '', opportunities: '', threats: '' },
                objectives: [],
            },
            prompts: [],
            contracts: [],
            implantations: [],
            content_items: [],
            settings: {
                theme: 'dark',
                sidebarCollapsed: false,
                companyName: 'PLURI',
                notifications: true,
            },
        };

        Object.keys(defaults).forEach(k => {
            if (loadData(k) === null) {
                saveData(k, defaults[k]);
            }
        });
    }

    // Inicializa ao carregar
    initDefaults();

    return {
        saveData,
        loadData,
        updateData,
        deleteData,
        listKeys,
        backupData,
        restoreData,
        exportBackupFile,
        initDefaults,
    };
})();

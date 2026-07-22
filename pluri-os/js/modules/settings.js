/**
 * PLURI OS — Configurações
 */
const Settings = (() => {
    function render() {
        const settings = Storage.loadData('settings', {});
        return `
            <div class="fade-in" style="max-width:600px">
                <h3 style="font-weight:600;margin-bottom:20px">Configurações</h3>
                <div class="card" style="margin-bottom:16px">
                    <div class="card-header"><span class="card-title">Aparência</span></div>
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0">
                        <span>Tema</span>
                        <button class="btn-secondary btn-sm" onclick="PLURI.toggleTheme()">
                            <i data-lucide="sun-moon" class="icon-sm"></i>
                            Alternar (atual: ${state?.theme || settings.theme || 'dark'})
                        </button>
                    </div>
                </div>
                <div class="card" style="margin-bottom:16px">
                    <div class="card-header"><span class="card-title">Dados</span></div>
                    <div style="display:flex;flex-direction:column;gap:12px;padding:8px 0">
                        <button class="btn-secondary" onclick="Storage.exportBackupFile()">
                            <i data-lucide="download" class="icon-sm"></i> Exportar Backup (JSON)
                        </button>
                        <button class="btn-secondary" onclick="Settings.importBackup()">
                            <i data-lucide="upload" class="icon-sm"></i> Restaurar Backup
                        </button>
                        <button class="btn-danger btn-sm" onclick="Settings.resetAll()" style="align-self:flex-start">
                            <i data-lucide="alert-triangle" class="icon-sm"></i> Resetar Todos os Dados
                        </button>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header"><span class="card-title">Sobre</span></div>
                    <p style="color:var(--text-secondary);font-size:0.88rem">
                        <strong>PLURI OS</strong> v1.0<br>
                        Sistema de Gestão Empresarial<br>
                        Desenvolvido para administrar toda a operação da PLURI.
                    </p>
                </div>
            </div>
        `;
    }

    function importBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const backup = JSON.parse(ev.target.result);
                    if (Storage.restoreData(backup)) {
                        Components.showToast('Backup restaurado com sucesso! Recarregando...', 'success');
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        Components.showToast('Erro ao restaurar backup', 'error');
                    }
                } catch (err) {
                    Components.showToast('Arquivo inválido', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function resetAll() {
        Components.confirmDialog({
            title: 'Resetar Todos os Dados',
            message: 'Tem certeza? Esta ação removerá TODOS os dados permanentemente e não pode ser desfeita.',
            onConfirm: () => {
                const keys = Storage.listKeys();
                keys.forEach(k => Storage.deleteData(k));
                Storage.initDefaults();
                Components.showToast('Dados resetados. Recarregando...', 'info');
                setTimeout(() => location.reload(), 1000);
            },
        });
    }

    window.Settings = { render, importBackup, resetAll };
    return { render, importBackup, resetAll };
})();

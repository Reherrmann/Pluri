const Implantations = (() => {
    function render() {
        const implantations = Storage.loadData('implantations', []);
        return `
            <div class="fade-in">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <h3>Implantações (${implantations.length})</h3>
                    <button class="btn-primary" onclick="Implantations.openForm()"><i data-lucide="plus" class="icon-sm"></i> Nova Implantação</button>
                </div>
                ${Components.createTable({
                    headers: ['Cliente', 'Status', 'Início', 'Previsão', 'Progresso'],
                    rows: implantations.map(i => [
                        i.client || '-',
                        `<span class="badge-tag ${i.status === 'concluida' ? 'success' : i.status === 'em_andamento' ? 'warning' : 'info'}">${i.status || 'pendente'}</span>`,
                        Utils.formatDate(i.startDate),
                        Utils.formatDate(i.estimatedEnd),
                        `<div class="progress-bar" style="width:100px"><div class="progress-fill" style="width:${i.progress || 0}%"></div></div> ${i.progress || 0}%`,
                    ]),
                    emptyMessage: 'Nenhuma implantação em andamento',
                })}
            </div>`;
    }
    function openForm() {
        Components.openModal({
            title: 'Nova Implantação',
            bodyHTML: `
                <div class="form-group"><label class="form-label">Cliente</label><input type="text" id="imp-client" class="form-input"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group"><label class="form-label">Início</label><input type="date" id="imp-start" class="form-input"></div>
                    <div class="form-group"><label class="form-label">Previsão de Término</label><input type="date" id="imp-end" class="form-input"></div>
                </div>
                <div class="form-group"><label class="form-label">Progresso (%)</label><input type="number" id="imp-progress" class="form-input" value="0" min="0" max="100"></div>`,
            footerHTML: `<button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
                         <button class="btn-primary" onclick="Implantations.save()">Salvar</button>`,
        });
    }
    function save() {
        const implantations = Storage.loadData('implantations', []);
        implantations.push({
            id: Utils.generateId(),
            client: document.getElementById('imp-client').value,
            startDate: document.getElementById('imp-start').value,
            estimatedEnd: document.getElementById('imp-end').value,
            progress: parseInt(document.getElementById('imp-progress').value) || 0,
            status: 'em_andamento',
            createdAt: new Date().toISOString(),
        });
        Storage.saveData('implantations', implantations);
        Components.closeModal();
        Components.showToast('Implantação salva!', 'success');
        PLURI.navigateTo('implantations');
    }
    window.Implantations = { render, openForm, save };
    return { render, openForm, save };
})();

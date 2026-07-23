const Content = (() => {
    function render() {
        const items = Storage.loadData('content_items', []);
        return `
            <div class="fade-in">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <h3>Conteúdo (${items.length})</h3>
                    <button class="btn-primary" onclick="Content.openForm()"><i data-lucide="plus" class="icon-sm"></i> Novo Conteúdo</button>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
                    ${items.length ? items.map(item => `
                        <div class="card">
                            <strong>${item.title || 'Sem título'}</strong>
                            <span class="badge-tag info" style="margin-left:8px">${item.type || 'artigo'}</span>
                            <p style="color:var(--text-secondary);font-size:0.82rem;margin-top:8px">${Utils.truncate(item.body, 120)}</p>
                            <div style="margin-top:8px;font-size:0.75rem;color:var(--text-tertiary)">${Utils.formatDate(item.createdAt)}</div>
                        </div>
                    `).join('') : '<div class="empty-state"><h3>Nenhum conteúdo</h3></div>'}
                </div>
            </div>`;
    }
    function openForm() {
        Components.openModal({
            title: 'Novo Conteúdo',
            bodyHTML: `
                <div class="form-group"><label class="form-label">Título</label><input type="text" id="ct-title" class="form-input"></div>
                <div class="form-group"><label class="form-label">Tipo</label>
                    <select id="ct-type" class="form-select"><option>artigo</option><option>post</option><option>email</option><option>script</option></select></div>
                <div class="form-group"><label class="form-label">Corpo</label><textarea id="ct-body" class="form-textarea" rows="6"></textarea></div>`,
            footerHTML: `<button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
                         <button class="btn-primary" onclick="Content.save()">Salvar</button>`,
        });
    }
    function save() {
        const items = Storage.loadData('content_items', []);
        items.push({
            id: Utils.generateId(),
            title: document.getElementById('ct-title').value,
            type: document.getElementById('ct-type').value,
            body: document.getElementById('ct-body').value,
            createdAt: new Date().toISOString(),
        });
        Storage.saveData('content_items', items);
        Components.closeModal();
        Components.showToast('Conteúdo salvo!', 'success');
        PLURI.navigateTo('content');
    }
    window.Content = { render, openForm, save };
    return { render, openForm, save };
})();

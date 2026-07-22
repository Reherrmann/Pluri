const Prompts = (() => {
    function render() {
        const prompts = Storage.loadData('prompts', []);
        const categories = [...new Set(prompts.map(p => p.category).filter(Boolean))];
        return `
            <div class="fade-in">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <h3>Biblioteca de Prompts (${prompts.length})</h3>
                    <button class="btn-primary" onclick="Prompts.openForm()"><i data-lucide="plus" class="icon-sm"></i> Novo Prompt</button>
                </div>
                <input type="text" id="prompt-search" class="form-input" placeholder="Pesquisar prompts..." style="margin-bottom:16px;max-width:400px"
                       oninput="Prompts.filterPrompts()">
                <div id="prompts-list" style="display:flex;flex-direction:column;gap:8px">
                    ${prompts.length ? prompts.map(p => `
                        <div class="card" style="cursor:pointer" onclick="Prompts.copyPrompt('${p.id}')">
                            <div style="display:flex;justify-content:space-between;align-items:center">
                                <strong>${p.title || 'Sem título'}</strong>
                                <span class="badge-tag info">${p.category || 'Geral'}</span>
                            </div>
                            <p style="color:var(--text-secondary);font-size:0.82rem;margin-top:4px">${Utils.truncate(p.content, 100)}</p>
                        </div>
                    `).join('') : '<div class="empty-state"><div class="empty-state-icon">🤖</div><h3>Nenhum prompt</h3></div>'}
                </div>
            </div>`;
    }
    function openForm() {
        Components.openModal({
            title: 'Novo Prompt',
            bodyHTML: `
                <div class="form-group"><label class="form-label">Título</label><input type="text" id="pr-title" class="form-input"></div>
                <div class="form-group"><label class="form-label">Categoria</label><input type="text" id="pr-category" class="form-input" placeholder="Ex: Vendas, Suporte..."></div>
                <div class="form-group"><label class="form-label">Conteúdo</label><textarea id="pr-content" class="form-textarea" rows="6"></textarea></div>`,
            footerHTML: `<button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
                         <button class="btn-primary" onclick="Prompts.save()">Salvar</button>`,
        });
    }
    function save() {
        const prompts = Storage.loadData('prompts', []);
        prompts.push({
            id: Utils.generateId(),
            title: document.getElementById('pr-title').value,
            category: document.getElementById('pr-category').value,
            content: document.getElementById('pr-content').value,
            createdAt: new Date().toISOString(),
        });
        Storage.saveData('prompts', prompts);
        Components.closeModal();
        Components.showToast('Prompt salvo!', 'success');
        PLURI.navigateTo('prompts');
    }
    function copyPrompt(id) {
        const prompts = Storage.loadData('prompts', []);
        const p = prompts.find(pr => pr.id === id);
        if (p) {
            navigator.clipboard.writeText(p.content).then(() => {
                Components.showToast('Prompt copiado!', 'success');
            });
        }
    }
    function filterPrompts() {
        const query = document.getElementById('prompt-search')?.value?.toLowerCase() || '';
        document.querySelectorAll('#prompts-list .card').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? '' : 'none';
        });
    }
    window.Prompts = { render, openForm, save, copyPrompt, filterPrompts };
    return { render, openForm, save, copyPrompt, filterPrompts };
})();

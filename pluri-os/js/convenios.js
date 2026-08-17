// js/convenios.js
// PLURI OS — Gestão de Convênios V1

let conveniosData = [];
let convenioEditingRow = null;

function buildConvenios() {
    setTimeout(loadConvenios, 0);

    return `
        <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
                <div>
                    <h3 style="margin:0;">Convênios</h3>
                    <p style="margin:4px 0 0;color:var(--text-secondary);font-size:13px;">Gerencie operadoras, planos, procedimentos e regras de atendimento.</p>
                </div>
                <button class="btn btn-primary" id="newConvenioBtn"><i data-lucide="plus" style="width:16px;height:16px;"></i> Novo convênio</button>
            </div>
            <div class="card-body">
                <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:20px;">
                    <div class="card" style="margin:0;border:1px solid var(--border-color,#e5e7eb);box-shadow:none;"><div class="card-body"><div style="font-size:12px;color:var(--text-secondary);">Convênios ativos</div><strong id="conveniosKpi" style="display:block;font-size:24px;margin-top:4px;">—</strong></div></div>
                    <div class="card" style="margin:0;border:1px solid var(--border-color,#e5e7eb);box-shadow:none;"><div class="card-body"><div style="font-size:12px;color:var(--text-secondary);">Planos cadastrados</div><strong id="planosKpi" style="display:block;font-size:24px;margin-top:4px;">—</strong></div></div>
                    <div class="card" style="margin:0;border:1px solid var(--border-color,#e5e7eb);box-shadow:none;"><div class="card-body"><div style="font-size:12px;color:var(--text-secondary);">Pacientes com convênio</div><strong id="pacientesConvenioKpi" style="display:block;font-size:24px;margin-top:4px;">—</strong></div></div>
                </div>

                <div style="display:flex;gap:10px;margin-bottom:14px;align-items:center;flex-wrap:wrap;">
                    <input id="convenioSearch" type="search" placeholder="Buscar convênio..." style="flex:1;min-width:220px;">
                    <select id="convenioStatusFilter" style="width:160px;">
                        <option value="">Todos os status</option>
                        <option value="Ativo">Ativos</option>
                        <option value="Inativo">Inativos</option>
                    </select>
                </div>

                <div class="table-responsive">
                    <table class="data-table">
                        <thead><tr><th>Convênio</th><th>Planos</th><th>Pacientes</th><th>Procedimentos</th><th>Status</th></tr></thead>
                        <tbody id="conveniosTableBody"><tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-secondary);">Carregando convênios...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="convenioModal" style="display:none;">
            <div class="modal" style="max-width:760px;max-height:90vh;overflow:auto;">
                <div class="modal-header">
                    <h3 id="convenioModalTitle">Novo convênio</h3>
                    <button class="modal-close" id="convenioModalClose"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group"><label>Nome do convênio</label><input id="convenioNome" type="text" placeholder="Ex.: Unimed"></div>
                        <div class="form-group"><label>Registro / ANS</label><input id="convenioANS" type="text" placeholder="Opcional"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Contato</label><input id="convenioContato" type="text" placeholder="Telefone ou e-mail"></div>
                        <div class="form-group"><label>Status</label><select id="convenioStatus"><option>Ativo</option><option>Inativo</option></select></div>
                    </div>

                    <div style="margin-top:18px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div><strong>Planos</strong><div style="font-size:12px;color:var(--text-secondary);">Cadastre as categorias de plano oferecidas pelo convênio.</div></div>
                            <button type="button" class="btn btn-outline btn-sm" id="addPlanoBtn"><i data-lucide="plus" style="width:14px;height:14px;"></i> Plano</button>
                        </div>
                        <div id="planosEditor"></div>
                    </div>

                    <div style="margin-top:20px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div><strong>Procedimentos</strong><div style="font-size:12px;color:var(--text-secondary);">Defina procedimentos, valores e necessidade de autorização.</div></div>
                            <button type="button" class="btn btn-outline btn-sm" id="addProcedimentoBtn"><i data-lucide="plus" style="width:14px;height:14px;"></i> Procedimento</button>
                        </div>
                        <div id="procedimentosEditor"></div>
                    </div>

                    <div class="form-group" style="margin-top:20px;"><label>Observações</label><textarea id="convenioObservacoes" rows="3" placeholder="Regras, contatos, particularidades de faturamento etc."></textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="convenioCancel">Cancelar</button>
                    <button class="btn btn-primary" id="convenioSave">Salvar convênio</button>
                </div>
            </div>
        </div>`;
}

async function loadConvenios() {
    try {
        const data = await window.pluriAPI.get(window.pluriAPI.config.appsScript.baseUrl + '?action=read&sheet=Convenios');
        conveniosData = Array.isArray(data) ? data.map(mapConvenio) : [];
    } catch (e) {
        console.error('Erro ao carregar convênios:', e);
        conveniosData = [];
    }
    renderConveniosTable();
    bindConveniosEvents();
}

function mapConvenio(row) {
    return {
        _row: row._row,
        name: row['Nome'] || row['Convênio'] || '',
        ans: row['Registro ANS'] || row['ANS'] || '',
        contact: row['Contato'] || '',
        status: row['Status'] || 'Ativo',
        notes: row['Observações'] || '',
        plans: parseJsonArray(row['Planos']),
        procedures: parseJsonArray(row['Procedimentos'])
    };
}

function parseJsonArray(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch (_) { return []; }
}

function convenioPatientCount(name) {
    const target = String(name || '').trim().toLowerCase();
    return (state.patients || []).filter(p => String(p.insuranceName || '').trim().toLowerCase() === target).length;
}

function renderConveniosTable() {
    const body = document.getElementById('conveniosTableBody');
    if (!body) return;

    const query = (document.getElementById('convenioSearch')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('convenioStatusFilter')?.value || '';
    const filtered = conveniosData.filter(c => (!query || c.name.toLowerCase().includes(query)) && (!statusFilter || c.status === statusFilter));

    const active = conveniosData.filter(c => c.status === 'Ativo').length;
    const plans = conveniosData.reduce((sum, c) => sum + c.plans.length, 0);
    const patients = conveniosData.reduce((sum, c) => sum + convenioPatientCount(c.name), 0);
    const kpi1 = document.getElementById('conveniosKpi');
    const kpi2 = document.getElementById('planosKpi');
    const kpi3 = document.getElementById('pacientesConvenioKpi');
    if (kpi1) kpi1.textContent = active;
    if (kpi2) kpi2.textContent = plans;
    if (kpi3) kpi3.textContent = patients;

    if (!filtered.length) {
        body.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:35px;color:var(--text-secondary);">Nenhum convênio cadastrado.</td></tr>`;
        return;
    }

    body.innerHTML = filtered.map(c => `
        <tr data-convenio-row="${c._row}" style="cursor:pointer;">
            <td><strong>${escapeHtml(c.name)}</strong>${c.ans ? `<div style="font-size:11px;color:var(--text-secondary);">ANS: ${escapeHtml(c.ans)}</div>` : ''}</td>
            <td>${c.plans.length}</td>
            <td>${convenioPatientCount(c.name)}</td>
            <td>${c.procedures.length}</td>
            <td>${statusBadge(c.status)}</td>
        </tr>
    `).join('');

    body.querySelectorAll('[data-convenio-row]').forEach(row => row.addEventListener('click', () => openConvenio(Number(row.dataset.convenioRow))));
}

function bindConveniosEvents() {
    document.getElementById('newConvenioBtn')?.addEventListener('click', () => openConvenio());
    document.getElementById('convenioSearch')?.addEventListener('input', renderConveniosTable);
    document.getElementById('convenioStatusFilter')?.addEventListener('change', renderConveniosTable);
}

function openConvenio(row = null) {
    const modal = document.getElementById('convenioModal');
    if (!modal) return;
    convenioEditingRow = row;
    const item = row ? conveniosData.find(c => Number(c._row) === Number(row)) : null;

    document.getElementById('convenioModalTitle').textContent = item ? 'Editar convênio' : 'Novo convênio';
    document.getElementById('convenioNome').value = item?.name || '';
    document.getElementById('convenioANS').value = item?.ans || '';
    document.getElementById('convenioContato').value = item?.contact || '';
    document.getElementById('convenioStatus').value = item?.status || 'Ativo';
    document.getElementById('convenioObservacoes').value = item?.notes || '';
    renderPlanosEditor(item?.plans || []);
    renderProcedimentosEditor(item?.procedures || []);

    document.getElementById('convenioModal').style.display = 'flex';
    document.getElementById('addPlanoBtn').onclick = () => addPlanoEditor();
    document.getElementById('addProcedimentoBtn').onclick = () => addProcedimentoEditor();
    document.getElementById('convenioCancel').onclick = closeConvenioModal;
    document.getElementById('convenioModalClose').onclick = closeConvenioModal;
    document.getElementById('convenioSave').onclick = saveConvenio;
    refreshIcons();
}

function closeConvenioModal() {
    const modal = document.getElementById('convenioModal');
    if (modal) modal.style.display = 'none';
}

function renderPlanosEditor(plans) {
    const el = document.getElementById('planosEditor');
    if (!el) return;
    el.innerHTML = (plans.length ? plans : []).map((p, i) => `
        <div class="form-row" data-plano-row style="margin-bottom:8px;align-items:end;">
            <div class="form-group" style="margin:0;flex:1;"><label>Nome do plano</label><input data-plano-name value="${escapeHtml(p.name || p.Nome || '')}"></div>
            <div class="form-group" style="margin:0;width:130px;"><label>Status</label><select data-plano-status><option ${((p.status || 'Ativo') === 'Ativo') ? 'selected' : ''}>Ativo</option><option ${p.status === 'Inativo' ? 'selected' : ''}>Inativo</option></select></div>
            <button type="button" class="btn btn-outline btn-sm" data-remove-plano style="margin-bottom:0;">Remover</button>
        </div>
    `).join('');
    el.querySelectorAll('[data-remove-plano]').forEach(btn => btn.addEventListener('click', e => e.currentTarget.closest('[data-plano-row]').remove()));
}

function addPlanoEditor() {
    const el = document.getElementById('planosEditor');
    if (!el) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `<div class="form-row" data-plano-row style="margin-bottom:8px;align-items:end;"><div class="form-group" style="margin:0;flex:1;"><label>Nome do plano</label><input data-plano-name></div><div class="form-group" style="margin:0;width:130px;"><label>Status</label><select data-plano-status><option selected>Ativo</option><option>Inativo</option></select></div><button type="button" class="btn btn-outline btn-sm" data-remove-plano>Remover</button></div>`;
    const row = wrapper.firstElementChild;
    el.appendChild(row);
    row.querySelector('[data-remove-plano]').addEventListener('click', () => row.remove());
}

function readPlanosEditor() {
    return [...document.querySelectorAll('#planosEditor [data-plano-row]')].map(row => ({
        name: row.querySelector('[data-plano-name]')?.value?.trim() || '',
        status: row.querySelector('[data-plano-status]')?.value || 'Ativo'
    })).filter(p => p.name);
}

function renderProcedimentosEditor(procedures) {
    const el = document.getElementById('procedimentosEditor');
    if (!el) return;
    el.innerHTML = procedures.map(p => procedimentoRowHtml(p)).join('');
    el.querySelectorAll('[data-remove-procedimento]').forEach(btn => btn.addEventListener('click', e => e.currentTarget.closest('[data-procedimento-row]').remove()));
}

function procedimentoRowHtml(p = {}) {
    return `<div data-procedimento-row style="display:grid;grid-template-columns:minmax(0,1fr) 120px 150px auto;gap:8px;align-items:end;margin-bottom:8px;"><div class="form-group" style="margin:0;"><label>Procedimento</label><input data-proc-name value="${escapeHtml(p.name || p.Nome || '')}"></div><div class="form-group" style="margin:0;"><label>Valor</label><input data-proc-value type="number" min="0" step="0.01" value="${escapeHtml(p.value ?? p.Valor ?? '')}"></div><div class="form-group" style="margin:0;"><label>Autorização</label><select data-proc-auth><option value="Não" ${((p.authorization || p.Autorizacao || 'Não') === 'Não') ? 'selected' : ''}>Não</option><option value="Sim" ${((p.authorization || p.Autorizacao) === 'Sim') ? 'selected' : ''}>Sim</option></select></div><button type="button" class="btn btn-outline btn-sm" data-remove-procedimento>Remover</button></div>`;
}

function addProcedimentoEditor() {
    const el = document.getElementById('procedimentosEditor');
    if (!el) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = procedimentoRowHtml();
    const row = wrapper.firstElementChild;
    el.appendChild(row);
    row.querySelector('[data-remove-procedimento]').addEventListener('click', () => row.remove());
}

function readProcedimentosEditor() {
    return [...document.querySelectorAll('#procedimentosEditor [data-procedimento-row]')].map(row => ({
        name: row.querySelector('[data-proc-name]')?.value?.trim() || '',
        value: row.querySelector('[data-proc-value]')?.value || '',
        authorization: row.querySelector('[data-proc-auth]')?.value || 'Não'
    })).filter(p => p.name);
}

async function saveConvenio() {
    const name = document.getElementById('convenioNome')?.value?.trim() || '';
    if (!name) { showToast('Informe o nome do convênio.'); return; }

    const values = {
        Nome: name,
        'Registro ANS': document.getElementById('convenioANS')?.value?.trim() || '',
        Contato: document.getElementById('convenioContato')?.value?.trim() || '',
        Status: document.getElementById('convenioStatus')?.value || 'Ativo',
        Planos: JSON.stringify(readPlanosEditor()),
        Procedimentos: JSON.stringify(readProcedimentosEditor()),
        Observações: document.getElementById('convenioObservacoes')?.value?.trim() || ''
    };

    const btn = document.getElementById('convenioSave');
    if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
    try {
        const result = convenioEditingRow
            ? await window.pluriAPI.post({ action: 'update', sheet: 'Convenios', row: convenioEditingRow, values })
            : await window.pluriAPI.post({ action: 'create', sheet: 'Convenios', values });
        if (!result?.success) throw new Error(result?.error || 'Não foi possível salvar.');
        closeConvenioModal();
        showToast(convenioEditingRow ? 'Convênio atualizado!' : 'Convênio cadastrado!');
        await loadConvenios();
    } catch (e) {
        console.error('Erro ao salvar convênio:', e);
        showToast('Não foi possível salvar o convênio. Verifique a aba Convenios na planilha.');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Salvar convênio'; }
    }
}

// Gestão de Convênios — Clinic / Supabase
let clinicConvenios = [];
let clinicConvenioEditingId = null;

// Catálogo inicial de grandes operadoras/marcas presentes no mercado brasileiro.
// A lista é apenas um ponto de partida: planos, cobertura e disponibilidade variam por região.
const CLINIC_CATALOGO_CONVENIOS = [
    { name: 'Unimed' },
    { name: 'Bradesco Saúde' },
    { name: 'SulAmérica Saúde' },
    { name: 'Amil' },
    { name: 'Hapvida' },
    { name: 'NotreDame Intermédica' },
    { name: 'Porto Saúde' },
    { name: 'Care Plus' },
    { name: 'Omint' }
];

function buildConvenios() {
    setTimeout(loadClinicConvenios, 0);
    return `<style>.clinic-convenios-card .card-header{padding:11px 16px}.clinic-convenios-card .card-body{padding:12px 16px}.clinic-convenios-card .data-table th{padding:8px 10px}.clinic-convenios-card .data-table td{padding:7px 10px}.clinic-convenios-card .status-badge{padding:3px 9px;font-size:11px}.clinic-convenios-divider td{padding:8px 10px!important;background:var(--hover-bg);border-top:1px solid var(--border-light);border-bottom:1px solid var(--border-light);font-size:10px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.04em}.clinic-convenio-delete{border:0;background:transparent;color:var(--text-secondary);cursor:pointer;padding:5px;border-radius:6px}.clinic-convenio-delete:hover{color:var(--red);background:var(--red-bg)}</style><div class="card clinic-convenios-card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;"><div><h3 style="margin:0;">Convênios</h3><p style="margin:4px 0 0;color:var(--text-secondary);font-size:13px;">Selecione um convênio do catálogo ou cadastre outro para a clínica.</p></div><button class="btn btn-primary" id="newClinicConvenio"><i data-lucide="plus"></i> Novo convênio</button></div><div class="card-body"><div style="display:flex;gap:10px;margin-bottom:9px;flex-wrap:wrap;"><input id="clinicConvenioSearch" type="search" placeholder="Buscar convênio..." style="flex:1;min-width:220px;"><select id="clinicConvenioStatus" style="width:160px"><option value="">Todos</option><option value="Ativo">Ativos</option><option value="Inativo">Inativos</option></select></div><div class="table-responsive"><table class="data-table"><thead><tr><th>Convênio</th><th>ANS</th><th>Planos</th><th>Status</th><th></th></tr></thead><tbody id="clinicConveniosBody"><tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-secondary);">Carregando...</td></tr></tbody></table></div><div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border-color,#e5e7eb);font-size:10.5px;line-height:1.4;color:var(--text-secondary);text-align:right;"><span>Registros ANS consultados em fontes oficiais da </span><a href="https://www.gov.br/ans/pt-br/assuntos/operadoras/regulacao-prudencial-acompanhamento-assistencial-e-economico-financeiro/regulacao-prudencial-1/classificacao-de-operadoras-aplicacao-proporcional-da-regulacao-prudencial-1" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;">Agência Nacional de Saúde Suplementar (ANS)</a><span>. Consulte também o </span><a href="https://www.gov.br/ans/pt-br/acesso-a-informacao/guia-de-planos" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;">Guia de Planos da ANS</a><span> para informações atualizadas de operadoras e produtos.</span></div></div></div><div class="modal-overlay" id="clinicConvenioModal" style="display:none"><div class="modal" style="max-width:760px;max-height:90vh;overflow:auto"><div class="modal-header"><h3 id="clinicConvenioTitle">Novo convênio</h3><button class="modal-close" id="clinicConvenioClose"><i data-lucide="x"></i></button></div><div class="modal-body"><div class="form-row"><div class="form-group"><label>Nome do convênio</label><input id="mcNome" placeholder="Ex.: Unimed"></div><div class="form-group"><label>Registro / ANS</label><input id="mcAns" placeholder="Opcional"></div></div><div class="form-row"><div class="form-group"><label>Contato</label><input id="mcContato" placeholder="Telefone ou e-mail"></div><div class="form-group"><label>Status</label><select id="mcStatus"><option>Ativo</option><option>Inativo</option></select></div></div><div style="margin-top:18px"><div style="display:flex;justify-content:space-between;align-items:center"><div><strong>Planos</strong><div style="font-size:12px;color:var(--text-secondary)">Planos oferecidos pelo convênio.</div></div><button type="button" class="btn btn-outline btn-sm" id="mcAddPlano"><i data-lucide="plus"></i> Plano</button></div><div id="mcPlanos" style="margin-top:10px"></div></div><div class="form-group" style="margin-top:18px"><label>Observações</label><textarea id="mcNotes" rows="3"></textarea></div></div><div class="modal-footer"><button class="btn btn-outline" id="mcCancel">Cancelar</button><button class="btn btn-primary" id="mcSave">Salvar convênio</button></div></div></div>`;
}

async function seedClinicConvenios() {
    const client = window.PLURI_SUPABASE;
    const clinicId = window.PLURI_CLINIC?.id;
    if (!client || !clinicId) return;
    const { data: existing, error: readError } = await client.from('clinic_convenios').select('name').eq('clinic_id', clinicId);
    if (readError) { console.error('[Clinic] catálogo de convênios:', readError); return; }
    const existingNames = new Set((existing || []).map(c => String(c.name || '').trim().toLowerCase()));
    const missing = CLINIC_CATALOGO_CONVENIOS.filter(c => !existingNames.has(c.name.toLowerCase())).map(c => ({ clinic_id: clinicId, name: c.name, status: 'Ativo', plans: [], notes: 'Catálogo inicial PLURI' }));
    if (!missing.length) return;
    const { error } = await client.from('clinic_convenios').insert(missing);
    if (error) console.error('[Clinic] não foi possível carregar o catálogo inicial:', error);
}

async function loadClinicConvenios() {
    const client = window.PLURI_SUPABASE;
    const clinicId = window.PLURI_CLINIC?.id;
    if (!client || !clinicId) return;
    await seedClinicConvenios();
    const { data, error } = await client.from('clinic_convenios').select('*').eq('clinic_id', clinicId).order('name');
    if (error) { console.error('[Clinic] convênios:', error); clinicConvenios = []; } else clinicConvenios = data || [];
    renderClinicConvenios();
    bindClinicConvenios();
}

function isCatalogoClinic(c) {
    return String(c?.notes || '').trim() === 'Catálogo inicial PLURI';
}

function renderClinicConvenios() {
    const body = document.getElementById('clinicConveniosBody'); if (!body) return;
    const q = (document.getElementById('clinicConvenioSearch')?.value || '').toLowerCase();
    const st = document.getElementById('clinicConvenioStatus')?.value || '';
    const rows = clinicConvenios.filter(c => (!q || String(c.name || '').toLowerCase().includes(q)) && (!st || c.status === st));
    const catalogo = rows.filter(isCatalogoClinic);
    const personalizados = rows.filter(c => !isCatalogoClinic(c));
    let html = '';
    if (catalogo.length) {
        html += catalogo.map(c => `<tr data-mc-id="${c.id}" style="cursor:pointer"><td><strong>${escapeHtml(c.name)}</strong>${c.contact ? `<div style="font-size:11px;color:var(--text-secondary)">${escapeHtml(c.contact)}</div>` : ''}</td><td>${escapeHtml(c.ans || '—')}</td><td>${Array.isArray(c.plans) ? c.plans.length : 0}</td><td>${statusBadge(c.status)}</td><td><i data-lucide="chevron-right"></i></td></tr>`).join('');
    }
    if (personalizados.length) {
        html += `<tr class="clinic-convenios-divider"><td colspan="5">Convênios adicionados pela clínica</td></tr>`;
        html += personalizados.map(c => `<tr data-mc-id="${c.id}" style="cursor:pointer"><td><strong>${escapeHtml(c.name)}</strong>${c.contact ? `<div style="font-size:11px;color:var(--text-secondary)">${escapeHtml(c.contact)}</div>` : ''}</td><td>${escapeHtml(c.ans || '—')}</td><td>${Array.isArray(c.plans) ? c.plans.length : 0}</td><td>${statusBadge(c.status)}</td><td><button type="button" class="clinic-convenio-delete" data-delete-mc-id="${c.id}" title="Excluir convênio"><i data-lucide="trash-2"></i></button></td></tr>`).join('');
    }
    body.innerHTML = html || `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-secondary)">Nenhum convênio cadastrado.</td></tr>`;
    body.querySelectorAll('[data-mc-id]').forEach(row => row.addEventListener('click', () => openClinicConvenio(row.dataset.mcId)));
    body.querySelectorAll('[data-delete-mc-id]').forEach(btn => btn.addEventListener('click', async e => { e.stopPropagation(); await deleteClinicConvenio(btn.dataset.deleteMcId); }));
    refreshIcons();
}

function bindClinicConvenios() {
    document.getElementById('newClinicConvenio')?.addEventListener('click', () => openClinicConvenio());
    document.getElementById('clinicConvenioSearch')?.addEventListener('input', renderClinicConvenios);
    document.getElementById('clinicConvenioStatus')?.addEventListener('change', renderClinicConvenios);
}

function openClinicConvenio(id = null) {
    clinicConvenioEditingId = id;
    const c = id ? clinicConvenios.find(x => x.id === id) : null;
    const modal = document.getElementById('clinicConvenioModal'); if (!modal) return;
    document.getElementById('clinicConvenioTitle').textContent = c ? 'Editar convênio' : 'Novo convênio';
    document.getElementById('mcNome').value = c?.name || '';
    document.getElementById('mcAns').value = c?.ans || '';
    document.getElementById('mcContato').value = c?.contact || '';
    document.getElementById('mcStatus').value = c?.status || 'Ativo';
    document.getElementById('mcNotes').value = c?.notes || '';
    renderPlanosClinic(c?.plans || []);
    modal.style.display = 'flex';
    document.getElementById('mcAddPlano').onclick = () => addPlanoClinic();
    document.getElementById('mcCancel').onclick = closeClinicConvenio;
    document.getElementById('clinicConvenioClose').onclick = closeClinicConvenio;
    document.getElementById('mcSave').onclick = saveClinicConvenio;
    refreshIcons();
}

function renderPlanosClinic(plans) {
    const el = document.getElementById('mcPlanos'); if (!el) return;
    el.innerHTML = plans.map(p => planoHtml(p)).join('');
    el.querySelectorAll('[data-remove-plano]').forEach(b => b.addEventListener('click', () => b.closest('[data-plano]').remove()));
}
function planoHtml(p={}) { return `<div data-plano style="display:grid;grid-template-columns:1fr 130px auto;gap:8px;align-items:end;margin-bottom:8px"><div class="form-group" style="margin:0"><label>Nome do plano</label><input data-plano-name value="${escapeHtml(p.name || '')}"></div><div class="form-group" style="margin:0"><label>Status</label><select data-plano-status><option ${p.status !== 'Inativo' ? 'selected' : ''}>Ativo</option><option ${p.status === 'Inativo' ? 'selected' : ''}>Inativo</option></select></div><button type="button" class="btn btn-outline btn-sm" data-remove-plano>Remover</button></div>`; }
function addPlanoClinic() { const el=document.getElementById('mcPlanos'); if(el){const w=document.createElement('div');w.innerHTML=planoHtml();const r=w.firstElementChild;el.appendChild(r);r.querySelector('[data-remove-plano]').onclick=()=>r.remove();} }
function readPlanosClinic() { return [...document.querySelectorAll('#mcPlanos [data-plano]')].map(r=>({name:r.querySelector('[data-plano-name]')?.value.trim()||'',status:r.querySelector('[data-plano-status]')?.value||'Ativo'})).filter(p=>p.name); }

async function saveClinicConvenio() {
    const name=document.getElementById('mcNome')?.value.trim(); if(!name){alert('Informe o nome do convênio.');return;}
    const payload={clinic_id:window.PLURI_CLINIC.id,name,ans:document.getElementById('mcAns')?.value.trim()||null,contact:document.getElementById('mcContato')?.value.trim()||null,status:document.getElementById('mcStatus')?.value||'Ativo',notes:document.getElementById('mcNotes')?.value.trim()||null,plans:readPlanosClinic(),updated_at:new Date().toISOString()};
    const query=clinicConvenioEditingId?window.PLURI_SUPABASE.from('clinic_convenios').update(payload).eq('id',clinicConvenioEditingId).eq('clinic_id',window.PLURI_CLINIC.id):window.PLURI_SUPABASE.from('clinic_convenios').insert(payload);
    const {error}=await query; if(error){console.error(error);alert('Não foi possível salvar o convênio.');return;}
    closeClinicConvenio(); await loadClinicConvenios();
}

async function deleteClinicConvenio(id) {
    const c = clinicConvenios.find(x => x.id === id);
    if (!c || isCatalogoClinic(c)) return;
    if (!confirm(`Excluir o convênio "${c.name}" cadastrado pela clínica? Essa ação não pode ser desfeita.`)) return;
    const { error } = await window.PLURI_SUPABASE.from('clinic_convenios').delete().eq('id', id).eq('clinic_id', window.PLURI_CLINIC.id);
    if (error) { console.error('[Clinic] excluir convênio:', error); alert('Não foi possível excluir o convênio.'); return; }
    await loadClinicConvenios();
}

function closeClinicConvenio(){document.getElementById('clinicConvenioModal').style.display='none';clinicConvenioEditingId=null;}
window.buildConvenios=buildConvenios;

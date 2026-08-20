// Mentalita — Central de Faturamento
(function () {
  'use strict';

  const S = () => window.PLURI_SUPABASE || null;
  const C = () => window.PLURI_CLINIC?.id || null;
  const U = () => window.PLURI_AUTH_SESSION?.user || null;
  let activeTab = 'visao';
  let busy = false;

  const money = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));
  const date = v => v ? new Date(String(v).slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
  const esc = v => String(v ?? '').replace(/[&<>\"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const labels = { draft:'Rascunho', ready:'Pronta para faturamento', billed:'Faturada', batched:'Em lote', sent:'Enviado', processed:'Processado', paid:'Recebido', open:'Em aberto', resolved:'Resolvida', received:'Recebido' };
  const status = s => labels[String(s || '').toLowerCase()] || String(s || '—');

  const CSS = `<style>
    #billingWorkspace{width:100%}.billing-shell{display:flex;flex-direction:column;gap:16px}.billing-tabs{display:flex;gap:8px;flex-wrap:wrap}.billing-tab{border:1px solid var(--border)!important;background:var(--surface,#fff)!important;color:var(--text,#182235)!important}.billing-tab.active{background:#063a59!important;color:#fff!important;border-color:#063a59!important}.billing-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.billing-kpi,.billing-card{background:var(--surface,#fff);border:1px solid var(--border);border-radius:14px}.billing-kpi{padding:16px}.billing-kpi small{display:block;color:var(--text-secondary);font-size:10px;text-transform:uppercase;letter-spacing:.07em;font-weight:800}.billing-kpi strong{display:block;font-size:21px;margin-top:6px}.billing-kpi span,.billing-note{display:block;color:var(--text-secondary);font-size:12px;margin-top:4px}.billing-card{padding:18px}.billing-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}.billing-head h3{margin:0;font-size:16px}.billing-head p{margin:4px 0 0;color:var(--text-secondary);font-size:12px}.billing-list{border-top:1px solid var(--border)}.billing-row{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:13px 0;border-bottom:1px solid var(--border)}.billing-row:last-child{border-bottom:0}.billing-main{display:flex;align-items:flex-start;gap:10px;min-width:0}.billing-main>div{min-width:0}.billing-actions{display:flex;align-items:center;justify-content:flex-end;gap:7px;flex-wrap:wrap;flex-shrink:0}.billing-status{display:inline-flex;padding:5px 9px;border-radius:999px;background:#eef2f6;color:#526579;font-size:11px;font-weight:700}.billing-empty{padding:24px 4px;color:var(--text-secondary);font-size:13px;text-align:center}.billing-check{width:17px;height:17px;accent-color:#063a59;margin-top:2px}.billing-primary{background:#063a59!important;color:#fff!important;border-color:#063a59!important}.billing-summary,.billing-flow{display:grid;gap:10px}.billing-summary{grid-template-columns:repeat(3,minmax(0,1fr))}.billing-flow{grid-template-columns:repeat(5,minmax(0,1fr))}.billing-summary>div,.billing-stage{padding:13px;border:1px solid var(--border);border-radius:12px}.billing-summary small,.billing-stage small{display:block;color:var(--text-secondary);font-size:10px}.billing-summary strong,.billing-stage strong{display:block;font-size:18px;margin-top:4px}.billing-stage span{display:block;color:var(--text-secondary);font-size:11px;margin-top:3px}.billing-modal{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:18px;z-index:10000}.billing-dialog{width:min(620px,100%);max-height:90vh;overflow:auto;background:var(--surface,#fff);border-radius:16px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.2)}.billing-dialog-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.billing-dialog-head h3{margin:0}.billing-form{display:flex;flex-direction:column;gap:12px}.billing-form label{font-size:12px;font-weight:700}.billing-form input,.billing-form select,.billing-form textarea{width:100%;box-sizing:border-box;margin-top:5px;padding:10px 11px;border:1px solid var(--border);border-radius:9px;background:var(--surface,#fff);color:inherit}.billing-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.billing-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.billing-detail-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.billing-detail-grid>div{padding:12px;border:1px solid var(--border);border-radius:10px}.billing-detail-grid small{display:block;color:var(--text-secondary);font-size:10px}.billing-detail-grid strong{display:block;margin-top:4px}@media(max-width:850px){.billing-kpis{grid-template-columns:1fr 1fr}.billing-flow{grid-template-columns:1fr 1fr}.billing-detail-grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.billing-kpis,.billing-summary,.billing-form-grid{grid-template-columns:1fr}.billing-row{align-items:flex-start;flex-direction:column}.billing-actions{width:100%;justify-content:flex-start}.billing-flow{grid-template-columns:1fr}.billing-dialog{padding:16px}}
  </style>`;

  async function rows(table, order = 'created_at') {
    const c = S();
    if (!c || !C()) return [];
    const r = await c.from(table).select('*').eq('clinic_id', C()).order(order, { ascending:false });
    if (r.error) { console.error('[Mentalita Faturamento]', table, r.error); return []; }
    return r.data || [];
  }
  const guides = () => rows('mentalita_patient_tiss_guides');
  const lots = () => rows('mentalita_billing_lots');
  const receipts = () => rows('mentalita_billing_receipts', 'received_at');
  const denials = () => rows('mentalita_billing_denials');

  async function lotGuideIds(lotId) {
    const c=S(); if(!c||!C()) return [];
    const r=await c.from('mentalita_billing_lot_guides').select('guide_id').eq('clinic_id',C()).eq('lot_id',lotId);
    return r.error ? [] : (r.data||[]).map(x=>x.guide_id);
  }
  async function names(ids) {
    const u=[...new Set((ids||[]).filter(Boolean))]; if(!u.length)return{};
    const r=await S().from('mentalita_patients').select('id,name').in('id',u);
    return Object.fromEntries((r.data||[]).map(x=>[x.id,x.name]));
  }
  async function audit(action, guideId=null, patientId=null, metadata={}) {
    const c=S(); if(!c||!C())return;
    const r=await c.from('mentalita_patient_tiss_audit').insert({clinic_id:C(),patient_id:patientId,guide_id:guideId,actor_user_id:U()?.id||null,action,occurred_at:new Date().toISOString(),metadata});
    if(r.error) console.warn('[Mentalita Faturamento] auditoria',r.error);
  }
  function modal(html){ document.getElementById('billingModal')?.remove(); document.body.insertAdjacentHTML('beforeend',`<div class="billing-modal" id="billingModal"><div class="billing-dialog">${html}</div></div>`); }
  function closeModal(){document.getElementById('billingModal')?.remove();}

  function tabs(){return `<div class="billing-tabs"><button class="btn billing-tab ${activeTab==='visao'?'active':''}" data-billing-action="tab" data-tab="visao">Visão geral</button><button class="btn billing-tab ${activeTab==='guias'?'active':''}" data-billing-action="tab" data-tab="guias">Guias prontas</button><button class="btn billing-tab ${activeTab==='lotes'?'active':''}" data-billing-action="tab" data-tab="lotes">Lotes</button><button class="btn billing-tab ${activeTab==='glosas'?'active':''}" data-billing-action="tab" data-tab="glosas">Glosas</button><button class="btn billing-tab ${activeTab==='recebimentos'?'active':''}" data-billing-action="tab" data-tab="recebimentos">Recebimentos</button></div>`;}
  function kpis(gs,rs,ds){const ready=gs.filter(g=>g.status==='ready'),sent=gs.filter(g=>['sent','processed'].includes(g.status)),received=rs.reduce((a,x)=>a+Number(x.amount||0),0),denied=ds.filter(x=>x.status!=='resolved').reduce((a,x)=>a+Number(x.amount||0),0),sentValue=sent.reduce((a,x)=>a+Number(x.total_amount||0),0),open=ready.reduce((a,x)=>a+Number(x.total_amount||0),0);return `<div class="billing-kpis"><div class="billing-kpi"><small>Em aberto</small><strong>${money(open)}</strong><span>${ready.length} guias prontas</span></div><div class="billing-kpi"><small>Enviado</small><strong>${money(sentValue)}</strong><span>${sent.length} guias</span></div><div class="billing-kpi"><small>Recebido</small><strong>${money(received)}</strong><span>${rs.length} recebimento${rs.length===1?'':'s'}</span></div><div class="billing-kpi"><small>Glosado</small><strong>${money(denied)}</strong><span>${ds.filter(x=>x.status!=='resolved').length} em aberto</span></div></div>`;}

  async function render() {
    const host=document.getElementById('billingWorkspace'); if(!host)return;
    host.innerHTML=CSS+'<div class="billing-card"><div class="billing-empty">Carregando faturamento…</div></div>';
    const [gs,ls,rs,ds]=await Promise.all([guides(),lots(),receipts(),denials()]);
    const nm=await names(gs.map(g=>g.patient_id));
    const ready=gs.filter(g=>g.status==='ready'),drafts=gs.filter(g=>g.status==='draft');
    let body='';
    if(activeTab==='guias') body=renderGuides(ready,drafts,nm);
    else if(activeTab==='lotes') body=await renderLots(ls,gs,nm);
    else if(activeTab==='glosas') body=await renderDenials(ds,ls,gs,nm);
    else if(activeTab==='recebimentos') body=await renderReceipts(rs,ls);
    else body=renderOverview(gs,ls,rs,ds,nm);
    host.innerHTML=CSS+`<div class="billing-shell">${kpis(gs,rs,ds)}${tabs()}${body}</div>`;
    bind();
  }

  function renderOverview(gs,ls,rs,ds,nm){const ready=gs.filter(g=>g.status==='ready'),drafts=gs.filter(g=>g.status==='draft');return `<div class="billing-card"><div class="billing-head"><div><h3>Fluxo de faturamento</h3><p>Da guia TISS ao recebimento, com glosas e auditoria.</p></div></div><div class="billing-flow"><div class="billing-stage"><small>01</small><strong>Guias prontas</strong><span>${ready.length} aguardando</span></div><div class="billing-stage"><small>02</small><strong>Lotes</strong><span>${ls.length} criados</span></div><div class="billing-stage"><small>03</small><strong>Enviado</strong><span>${gs.filter(g=>g.status==='sent').length} guias</span></div><div class="billing-stage"><small>04</small><strong>Recebido</strong><span>${rs.length} registros</span></div><div class="billing-stage"><small>05</small><strong>Glosas</strong><span>${ds.filter(d=>d.status!=='resolved').length} em aberto</span></div></div></div><div class="billing-summary"><div><small>Guias prontas</small><strong>${ready.length}</strong></div><div><small>Rascunhos</small><strong>${drafts.length}</strong></div><div><small>Lotes</small><strong>${ls.length}</strong></div></div>`;}

  function guideRow(g,nm,ready){return `<div class="billing-row"><div class="billing-main">${ready?`<input class="billing-check billing-guide-check" type="checkbox" value="${esc(g.id)}">`:''}<div><strong>${esc(nm[g.patient_id]||'Paciente')}</strong><div class="billing-note">Guia ${esc(g.guide_number||'sem número')} · ${date(g.execution_date)} · ${money(g.total_amount)}</div></div></div><div class="billing-actions"><span class="billing-status">${status(g.status)}</span>${!ready?`<button class="btn" data-billing-action="release" data-id="${esc(g.id)}">Liberar para faturamento</button>`:''}</div></div>`;}
  function renderGuides(ready,drafts,nm){return `<div class="billing-card"><div class="billing-head"><div><h3>Guias prontas para faturamento</h3><p>Selecione guias do mesmo convênio para formar um lote.</p></div><button class="btn billing-primary" data-billing-action="create-lot" ${ready.length?'':'disabled'}>Criar lote</button></div><div class="billing-list">${ready.length?ready.map(g=>guideRow(g,nm,true)).join(''):'<div class="billing-empty">Nenhuma guia pronta para faturamento.</div>'}</div><div style="margin-top:20px;padding-top:18px;border-top:1px solid var(--border)"><div class="billing-head"><div><h3>Guias em preparação</h3><p>Rascunhos criados, ainda não liberados para faturamento.</p></div></div><div class="billing-list">${drafts.length?drafts.map(g=>guideRow(g,nm,false)).join(''):'<div class="billing-empty">Nenhum rascunho pendente.</div>'}</div></div></div>`;}

  async function renderLots(ls,gs,nm){const links=await Promise.all(ls.map(async l=>({l,ids:await lotGuideIds(l.id)})));return `<div class="billing-card"><div class="billing-head"><div><h3>Lotes</h3><p>Acompanhe as guias agrupadas e o status do faturamento.</p></div></div><div class="billing-list">${ls.length?links.map(({l,ids})=>`<div class="billing-row"><div><strong>${esc(l.lot_number||'Lote')}</strong><div class="billing-note">${date(l.created_at)} · ${ids.length||l.guide_count||0} guia${(ids.length||l.guide_count||0)===1?'':'s'} · ${money(l.total_amount)}</div></div><div class="billing-actions"><span class="billing-status">${status(l.status)}</span><button class="btn" data-billing-action="open-lot" data-id="${esc(l.id)}">Abrir</button>${l.status==='draft'?`<button class="btn billing-primary" data-billing-action="send-lot" data-id="${esc(l.id)}">Enviar</button>`:''}</div></div>`).join(''):'<div class="billing-empty">Nenhum lote criado.</div>'}</div></div>`;}

  async function renderDenials(ds,ls,gs,nm){return `<div class="billing-card"><div class="billing-head"><div><h3>Glosas</h3><p>Registre recusas do convênio vinculadas ao lote e, quando possível, à guia.</p></div><button class="btn billing-primary" data-billing-action="new-denial">+ Registrar glosa</button></div><div class="billing-list">${ds.length?ds.map(d=>`<div class="billing-row"><div><strong>${money(d.amount)}</strong><div class="billing-note">${esc(d.reason||'Sem motivo')} · ${status(d.status)}</div></div><div class="billing-actions">${d.status==='open'?`<button class="btn" data-billing-action="resolve-denial" data-id="${esc(d.id)}">Resolver</button>`:''}</div></div>`).join(''):'<div class="billing-empty">Nenhuma glosa registrada.</div>'}</div></div>`;}
  async function renderReceipts(rs,ls){return `<div class="billing-card"><div class="billing-head"><div><h3>Recebimentos</h3><p>Registre os pagamentos efetivamente recebidos dos lotes.</p></div><button class="btn billing-primary" data-billing-action="new-receipt">+ Registrar recebimento</button></div><div class="billing-list">${rs.length?rs.map(r=>`<div class="billing-row"><div><strong>${money(r.amount)}</strong><div class="billing-note">${date(r.received_at)} · ${status(r.status)}${r.reference?` · ${esc(r.reference)}`:''}</div></div><div class="billing-actions"></div></div>`).join(''):'<div class="billing-empty">Nenhum recebimento registrado.</div>'}</div></div>`;}

  async function createLot() {
    if (busy) return;
    const selected=[...document.querySelectorAll('.billing-guide-check:checked')].map(x=>x.value);
    if(!selected.length){ alert('Selecione pelo menos uma guia.'); return; }
    busy=true;
    try{
      const gs=await guides(); const picked=gs.filter(g=>selected.includes(String(g.id)));
      if(picked.some(g=>g.status!=='ready')) throw new Error('Somente guias prontas podem formar um lote.');
      const convenioIds=[...new Set(picked.map(g=>g.convenio_id).filter(Boolean))];
      if(convenioIds.length>1) throw new Error('Selecione apenas guias do mesmo convênio.');
      const c=S(); if(!c||!C()) throw new Error('Sessão ou clínica não disponível.');
      const total=picked.reduce((a,g)=>a+Number(g.total_amount||0),0);
      const lotNumber=`LOT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
      const lotRes=await c.from('mentalita_billing_lots').insert({clinic_id:C(),lot_number:lotNumber,status:'draft',total_amount:total,guide_count:picked.length,created_by:U()?.id||null}).select().single();
      if(lotRes.error) throw lotRes.error;
      const links=picked.map(g=>({clinic_id:C(),lot_id:lotRes.data.id,guide_id:g.id}));
      const linkRes=await c.from('mentalita_billing_lot_guides').insert(links);
      if(linkRes.error){await c.from('mentalita_billing_lots').delete().eq('id',lotRes.data.id);throw linkRes.error;}
      for(const g of picked){
        const up=await c.from('mentalita_patient_tiss_guides').update({status:'batched',updated_at:new Date().toISOString()}).eq('id',g.id).eq('clinic_id',C());
        if(up.error) throw up.error;
        await audit('billing_lot_created',g.id,g.patient_id,{lot_id:lotRes.data.id,amount:Number(g.total_amount||0)});
      }
      await render();
    }catch(e){console.error('[Mentalita Faturamento] createLot',e);alert(e?.message||'Não foi possível criar o lote.');}
    finally{busy=false;}
  }

  async function releaseGuide(id){
    if(busy)return; busy=true;
    try{const c=S();const g=(await guides()).find(x=>x.id===id);if(!g)throw new Error('Guia não encontrada.');if(!Number(g.total_amount||0))throw new Error('A guia precisa ter valor maior que zero antes de ser liberada.');const r=await c.from('mentalita_patient_tiss_guides').update({status:'ready',finalized_at:new Date().toISOString(),finalized_by:U()?.id||null,updated_at:new Date().toISOString()}).eq('id',id).eq('clinic_id',C());if(r.error)throw r.error;await audit('billing_guide_released',id,g.patient_id,{amount:Number(g.total_amount||0)});await render();}catch(e){console.error('[Mentalita Faturamento] releaseGuide',e);alert(e?.message||'Não foi possível liberar a guia.');}finally{busy=false;}}

  async function sendLot(id){
    if(busy)return; busy=true;
    try{const c=S();const r=await c.from('mentalita_billing_lots').update({status:'sent',submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id).eq('clinic_id',C()).eq('status','draft');if(r.error)throw r.error;const ids=await lotGuideIds(id);if(ids.length){const up=await c.from('mentalita_patient_tiss_guides').update({status:'sent',updated_at:new Date().toISOString()}).in('id',ids).eq('clinic_id',C());if(up.error)throw up.error;for(const gid of ids)await audit('billing_lot_sent',gid,null,{lot_id:id});}await render();}catch(e){console.error('[Mentalita Faturamento] sendLot',e);alert(e?.message||'Não foi possível enviar o lote.');}finally{busy=false;}}

  function bind(){
    document.querySelectorAll('[data-billing-action="tab"]').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.tab||'visao';render();}));
    document.querySelectorAll('[data-billing-action="release"]').forEach(b=>b.addEventListener('click',()=>releaseGuide(b.dataset.id)));
    document.querySelector('[data-billing-action="create-lot"]')?.addEventListener('click',createLot);
    document.querySelectorAll('[data-billing-action="send-lot"]').forEach(b=>b.addEventListener('click',()=>sendLot(b.dataset.id)));
  }

  function build(){return `<div id="billingWorkspace"></div>`;}
  window.buildFaturamento=build;
  window.attachFaturamentoEvents=function(){render();};
})();

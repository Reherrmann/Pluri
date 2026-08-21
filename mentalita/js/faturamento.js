// Mentalita — Faturamento
// Fases 1 e 2: base de navegação + gestão de guias TISS.
// Este é o único módulo responsável pela Central de Faturamento.
(function () {
  'use strict';
  if (window.__mentalitaFaturamentoV1) return;
  window.__mentalitaFaturamentoV1 = true;

  const S = () => window.PLURI_SUPABASE || null;
  const C = () => window.PLURI_CLINIC?.id || null;
  const U = () => window.PLURI_AUTH_SESSION?.user?.id || null;
  let activeTab = 'visao';
  let busy = false;

  const money = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
  const date = v => v ? new Date(String(v).slice(0,10)+'T00:00:00').toLocaleDateString('pt-BR') : '—';
  const esc = v => String(v ?? '').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const labels = {draft:'Rascunho',ready:'Pronta para faturamento',batched:'Em lote',sent:'Enviada',processed:'Processada',paid:'Recebida'};
  const label = v => labels[v] || v || '—';

  const CSS = `<style>
  #billingWorkspace{width:100%}.billing-shell{display:flex;flex-direction:column;gap:16px}.billing-tabs{display:flex;gap:8px;flex-wrap:wrap}.billing-tab{border:1px solid var(--border)!important;background:var(--surface,#fff)!important;color:var(--text,#182235)!important}.billing-tab.active{background:#063a59!important;color:#fff!important;border-color:#063a59!important}.billing-card,.billing-kpi{background:var(--surface,#fff);border:1px solid var(--border);border-radius:14px}.billing-card{padding:18px}.billing-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:16px}.billing-head h3{margin:0;font-size:16px}.billing-head p{margin:4px 0 0;color:var(--text-secondary);font-size:12px}.billing-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.billing-kpi{padding:16px}.billing-kpi small{display:block;color:var(--text-secondary);font-size:10px;text-transform:uppercase;font-weight:800;letter-spacing:.06em}.billing-kpi strong{display:block;font-size:22px;margin-top:5px}.billing-kpi span,.billing-note{display:block;color:var(--text-secondary);font-size:12px;margin-top:4px}.billing-list{border-top:1px solid var(--border)}.billing-row{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid var(--border)}.billing-main{display:flex;align-items:flex-start;gap:10px;min-width:0}.billing-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}.billing-status{display:inline-flex;padding:5px 9px;border-radius:999px;background:#eef2f6;color:#526579;font-size:11px;font-weight:700}.billing-empty{padding:28px 8px;text-align:center;color:var(--text-secondary);font-size:13px}.billing-check{width:17px;height:17px;margin-top:2px}.billing-flow{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.billing-stage{padding:15px;border:1px solid var(--border);border-radius:12px}.billing-stage small{color:var(--text-secondary);font-size:10px;text-transform:uppercase;font-weight:800}.billing-stage strong{display:block;margin-top:5px;font-size:16px}.billing-stage span{display:block;margin-top:3px;color:var(--text-secondary);font-size:12px}.billing-error{border-left:4px solid #b42318}.billing-error pre{white-space:pre-wrap;color:#b42318;font-size:12px}@media(max-width:700px){.billing-kpis,.billing-flow{grid-template-columns:1fr}.billing-row{align-items:flex-start;flex-direction:column}.billing-actions{width:100%;justify-content:flex-start}}
  </style>`;

  async function rows(table, order='created_at') {
    const c=S(), clinic=C();
    if(!c||!clinic) throw new Error('Clínica não identificada.');
    const r=await c.from(table).select('*').eq('clinic_id',clinic).order(order,{ascending:false});
    if(r.error) throw r.error;
    return r.data||[];
  }

  async function guides(){ return rows('mentalita_patient_tiss_guides'); }

  async function patientNames(ids){
    const unique=[...new Set((ids||[]).filter(Boolean))];
    if(!unique.length) return {};
    const r=await S().from('mentalita_patients').select('id,name').in('id',unique);
    if(r.error) throw r.error;
    return Object.fromEntries((r.data||[]).map(p=>[p.id,p.name]));
  }

  function tabs(){
    return `<div class="billing-tabs">${[
      ['visao','Visão geral'],['guias','Guias prontas'],['lotes','Lotes'],['glosas','Glosas'],['recebimentos','Recebimentos']
    ].map(([id,text])=>`<button type="button" class="btn billing-tab ${activeTab===id?'active':''}" data-billing-tab="${id}">${text}</button>`).join('')}</div>`;
  }

  function overview(gs){
    const ready=gs.filter(g=>g.status==='ready'),drafts=gs.filter(g=>g.status==='draft');
    const value=ready.reduce((s,g)=>s+Number(g.total_amount||0),0);
    return `${CSS}<div class="billing-shell"><div class="billing-kpis"><div class="billing-kpi"><small>Guias prontas</small><strong>${ready.length}</strong><span>${money(value)} aguardando faturamento</span></div><div class="billing-kpi"><small>Rascunhos</small><strong>${drafts.length}</strong><span>Precisam ser liberados</span></div><div class="billing-kpi"><small>Total de guias</small><strong>${gs.length}</strong><span>Registros TISS da clínica</span></div></div><div class="billing-card"><div class="billing-head"><div><h3>Fluxo de faturamento</h3><p>Esta primeira versão trabalha somente com a etapa de guias. As demais serão construídas em cima dela.</p></div></div><div class="billing-flow"><div class="billing-stage"><small>01 · Agora</small><strong>Guias TISS</strong><span>Revisar e liberar</span></div><div class="billing-stage"><small>02 · Próximo</small><strong>Lotes</strong><span>Agrupar guias prontas</span></div><div class="billing-stage"><small>03 · Depois</small><strong>Recebimentos e glosas</strong><span>Controle financeiro</span></div></div></div></div>`;
  }

  function guideRow(g,names,ready){
    return `<div class="billing-row"><div class="billing-main">${ready?`<input class="billing-check" type="checkbox" data-guide-check value="${esc(g.id)}">`:''}<div><strong>${esc(names[g.patient_id]||'Paciente')}</strong><div class="billing-note">Guia ${esc(g.guide_number||'sem número')} · ${date(g.execution_date)} · ${money(g.total_amount)}</div></div></div><div class="billing-actions"><span class="billing-status">${esc(label(g.status))}</span>${!ready?`<button type="button" class="btn" data-release-guide="${esc(g.id)}">Liberar para faturamento</button>`:''}</div></div>`;
  }

  function guidesView(gs,names){
    const ready=gs.filter(g=>g.status==='ready'), drafts=gs.filter(g=>g.status==='draft');
    return `${CSS}<div class="billing-shell"><div class="billing-card"><div class="billing-head"><div><h3>Guias prontas para faturamento</h3><p>Selecione as guias prontas para formar um lote na próxima fase.</p></div><button type="button" class="btn" data-create-lot ${ready.length?'':'disabled'}>Criar lote</button></div><div class="billing-list">${ready.length?ready.map(g=>guideRow(g,names,true)).join(''):'<div class="billing-empty">Nenhuma guia pronta para faturamento.</div>'}</div></div><div class="billing-card"><div class="billing-head"><div><h3>Guias em preparação</h3><p>Rascunhos criados na ficha do paciente. Nenhuma guia é liberada automaticamente.</p></div></div><div class="billing-list">${drafts.length?drafts.map(g=>guideRow(g,names,false)).join(''):'<div class="billing-empty">Nenhum rascunho pendente.</div>'}</div></div></div>`;
  }

  function placeholder(title,text){
    return `${CSS}<div class="billing-card"><div class="billing-head"><div><h3>${title}</h3><p>${text}</p></div></div><div class="billing-empty">Esta etapa ainda não foi implementada.</div></div>`;
  }

  async function render(){
    const host=document.getElementById('billingWorkspace');
    if(!host||busy)return;
    busy=true;
    host.innerHTML=CSS+'<div class="billing-card"><div class="billing-empty">Carregando faturamento…</div></div>';
    try{
      const gs=await guides();
      const names=await patientNames(gs.map(g=>g.patient_id));
      let body=overview(gs);
      if(activeTab==='guias') body=guidesView(gs,names);
      if(activeTab==='lotes') body=placeholder('Lotes','A criação de lotes será construída depois que o fluxo de guias estiver validado.');
      if(activeTab==='glosas') body=placeholder('Glosas','O registro de glosas será construído depois do fluxo de lotes.');
      if(activeTab==='recebimentos') body=placeholder('Recebimentos','O registro de recebimentos será construído depois do fluxo de lotes.');
      host.innerHTML=`<div class="billing-shell">${tabs()}${body}</div>`;
    }catch(error){
      console.error('[Mentalita Faturamento] erro:',error);
      host.innerHTML=`${CSS}<div class="billing-card billing-error"><div class="billing-head"><div><h3>Erro ao carregar Faturamento</h3><p>O erro foi mantido visível para diagnóstico.</p></div></div><pre>${esc(error?.message||error)}</pre></div>`;
    }finally{busy=false;}
  }

  async function releaseGuide(id){
    const c=S(),clinic=C();
    if(!c||!clinic) throw new Error('Clínica não identificada.');
    const gs=await guides(), guide=gs.find(g=>g.id===id);
    if(!guide) throw new Error('Guia não encontrada.');
    if(guide.status!=='draft') throw new Error('Somente uma guia em rascunho pode ser liberada.');
    const r=await c.from('mentalita_patient_tiss_guides').update({status:'ready',finalized_at:new Date().toISOString(),finalized_by:U(),updated_at:new Date().toISOString()}).eq('id',id).eq('clinic_id',clinic).select('id,status').single();
    if(r.error) throw r.error;
    if(r.data?.status!=='ready') throw new Error('A atualização não confirmou o status ready.');
    await render();
  }

  async function createLot(){
    const c=S(),clinic=C();
    if(!c||!clinic) throw new Error('Clínica não identificada.');
    const selected=[...document.querySelectorAll('[data-guide-check]:checked')].map(x=>x.value);
    if(!selected.length) throw new Error('Selecione pelo menos uma guia pronta.');
    const gs=await guides(), chosen=gs.filter(g=>selected.includes(g.id));
    if(chosen.length!==selected.length) throw new Error('Uma ou mais guias selecionadas não foram encontradas.');
    if(chosen.some(g=>g.status!=='ready')) throw new Error('Somente guias prontas podem entrar em lote.');
    const conv=[...new Set(chosen.map(g=>g.convenio_id||'sem-convenio'))];
    if(conv.length>1) throw new Error('As guias selecionadas pertencem a convênios diferentes. Separe os lotes.');
    const total=chosen.reduce((s,g)=>s+Number(g.total_amount||0),0);
    const d=new Date(), number=`LOTE-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
    const lot=await c.from('mentalita_billing_lots').insert({clinic_id:clinic,lot_number:number,status:'draft',total_amount:total,guide_count:chosen.length,created_by:U()}).select('id').single();
    if(lot.error) throw lot.error;
    const links=await c.from('mentalita_billing_lot_guides').insert(chosen.map(g=>({clinic_id:clinic,lot_id:lot.data.id,guide_id:g.id})));
    if(links.error){await c.from('mentalita_billing_lots').delete().eq('id',lot.data.id).eq('clinic_id',clinic);throw links.error;}
    const updated=await c.from('mentalita_patient_tiss_guides').update({status:'batched',updated_at:new Date().toISOString()}).in('id',selected).eq('clinic_id',clinic);
    if(updated.error) throw updated.error;
    await render();
    alert(`Lote ${number} criado com ${chosen.length} guia(s).`);
  }

  document.addEventListener('click',async event=>{
    const tab=event.target.closest?.('[data-billing-tab]');
    if(tab){event.preventDefault();activeTab=tab.dataset.billingTab;await render();return;}
    const release=event.target.closest?.('[data-release-guide]');
    if(release){event.preventDefault();try{await releaseGuide(release.dataset.releaseGuide);}catch(e){console.error('[Mentalita Faturamento] liberar:',e);alert(e.message||'Não foi possível liberar a guia.');}return;}
    const create=event.target.closest?.('[data-create-lot]');
    if(create&&!create.disabled){event.preventDefault();try{await createLot();}catch(e){console.error('[Mentalita Faturamento] lote:',e);alert(e.message||'Não foi possível criar o lote.');}}
  });

  window.buildFaturamento=()=>'<div id="billingWorkspace"></div>';
  window.renderFaturamento=render;
})();

// Mentalita — Faturamento
// Fases 1–4: navegação, guias, lotes e recebimentos.
// Um único módulo é responsável pela Central de Faturamento.
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
  const dateTime = v => v ? new Date(v).toLocaleString('pt-BR') : '—';
  const esc = v => String(v ?? '').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const labels = {draft:'Rascunho',ready:'Pronta para faturamento',batched:'Em lote',sent:'Enviada',processed:'Processada',paid:'Recebida'};
  const receiptLabels = {received:'Recebido',pending:'Pendente',cancelled:'Cancelado'};
  const label = v => labels[v] || v || '—';
  const receiptLabel = v => receiptLabels[v] || v || '—';

  const CSS = `<style>
  #billingWorkspace{width:100%}.billing-shell{display:flex;flex-direction:column;gap:16px}.billing-tabs{display:flex;gap:8px;flex-wrap:wrap}.billing-tab{border:1px solid var(--border)!important;background:var(--surface,#fff)!important;color:var(--text,#182235)!important}.billing-tab.active{background:#063a59!important;color:#fff!important;border-color:#063a59!important}.billing-card,.billing-kpi{background:var(--surface,#fff);border:1px solid var(--border);border-radius:14px}.billing-card{padding:18px}.billing-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:16px}.billing-head h3{margin:0;font-size:16px}.billing-head p{margin:4px 0 0;color:var(--text-secondary);font-size:12px}.billing-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.billing-kpi{padding:16px}.billing-kpi small{display:block;color:var(--text-secondary);font-size:10px;text-transform:uppercase;font-weight:800;letter-spacing:.06em}.billing-kpi strong{display:block;font-size:22px;margin-top:5px}.billing-kpi span,.billing-note{display:block;color:var(--text-secondary);font-size:12px;margin-top:4px}.billing-list{border-top:1px solid var(--border)}.billing-row{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid var(--border)}.billing-main{display:flex;align-items:flex-start;gap:10px;min-width:0}.billing-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}.billing-status{display:inline-flex;padding:5px 9px;border-radius:999px;background:#eef2f6;color:#526579;font-size:11px;font-weight:700}.billing-empty{padding:28px 8px;text-align:center;color:var(--text-secondary);font-size:13px}.billing-check{width:17px;height:17px;margin-top:2px}.billing-flow{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.billing-stage{padding:15px;border:1px solid var(--border);border-radius:12px}.billing-stage small{color:var(--text-secondary);font-size:10px;text-transform:uppercase;font-weight:800}.billing-stage strong{display:block;margin-top:5px;font-size:16px}.billing-stage span{display:block;margin-top:3px;color:var(--text-secondary);font-size:12px}.billing-error{border-left:4px solid #b42318}.billing-error pre{white-space:pre-wrap;color:#b42318;font-size:12px}.billing-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.billing-field{display:flex;flex-direction:column;gap:6px}.billing-field.full{grid-column:1/-1}.billing-field label{font-size:12px;font-weight:700}.billing-field input,.billing-field select,.billing-field textarea{width:100%;box-sizing:border-box;border:1px solid var(--border);border-radius:9px;padding:10px;background:var(--surface,#fff);color:var(--text,#182235)}.billing-field textarea{min-height:76px;resize:vertical}.billing-form-actions{display:flex;justify-content:flex-end;gap:8px;grid-column:1/-1;margin-top:4px}.billing-detail{padding:12px 0 0;border-top:1px solid var(--border);margin-top:12px}.billing-muted{color:var(--text-secondary);font-size:12px}.billing-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.billing-summary div{padding:12px;border:1px solid var(--border);border-radius:10px}.billing-summary small{display:block;color:var(--text-secondary);font-size:10px;text-transform:uppercase;font-weight:800}.billing-summary strong{display:block;margin-top:4px}.billing-modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.42);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}.billing-modal{width:min(560px,100%);background:#fff;border-radius:16px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.2)}.billing-modal h3{margin:0}.billing-modal .billing-form{margin-top:16px}@media(max-width:700px){.billing-kpis,.billing-flow,.billing-summary,.billing-form{grid-template-columns:1fr}.billing-row{align-items:flex-start;flex-direction:column}.billing-actions{width:100%;justify-content:flex-start}.billing-field.full{grid-column:auto}.billing-form-actions{grid-column:auto}}
  </style>`;

  async function rows(table, order='created_at') {
    const c=S(), clinic=C();
    if(!c||!clinic) throw new Error('Clínica não identificada.');
    const r=await c.from(table).select('*').eq('clinic_id',clinic).order(order,{ascending:false});
    if(r.error) throw r.error;
    return r.data||[];
  }
  async function guides(){ return rows('mentalita_patient_tiss_guides'); }
  async function lots(){ return rows('mentalita_billing_lots'); }
  async function receipts(){ return rows('mentalita_billing_receipts'); }
  async function denials(){ return rows('mentalita_billing_denials'); }
  async function patientNames(ids){
    const unique=[...new Set((ids||[]).filter(Boolean))]; if(!unique.length) return {};
    const r=await S().from('mentalita_patients').select('id,name').in('id',unique); if(r.error) throw r.error;
    return Object.fromEntries((r.data||[]).map(p=>[p.id,p.name]));
  }
  async function lotGuideLinks(lotIds){
    const ids=[...new Set((lotIds||[]).filter(Boolean))]; if(!ids.length) return [];
    const r=await S().from('mentalita_billing_lot_guides').select('lot_id,guide_id').in('lot_id',ids); if(r.error) throw r.error; return r.data||[];
  }

  function tabs(){
    return `<div class="billing-tabs">${[['visao','Visão geral'],['guias','Guias prontas'],['lotes','Lotes'],['glosas','Glosas'],['recebimentos','Recebimentos']].map(([id,text])=>`<button type="button" class="btn billing-tab ${activeTab===id?'active':''}" data-billing-tab="${id}">${text}</button>`).join('')}</div>`;
  }
  function overview(gs,ls,rs,ds){
    const ready=gs.filter(g=>g.status==='ready'), drafts=gs.filter(g=>g.status==='draft');
    const open=ls.filter(l=>['draft','processed'].includes(l.status)).reduce((s,l)=>s+Number(l.total_amount||0),0);
    const sent=ls.filter(l=>l.status==='sent').reduce((s,l)=>s+Number(l.total_amount||0),0);
    const received=rs.filter(r=>r.status==='received').reduce((s,r)=>s+Number(r.amount||0),0);
    const denied=ds.filter(d=>d.status!=='resolved').reduce((s,d)=>s+Number(d.amount||0),0);
    return `<div class="billing-shell"><div class="billing-kpis"><div class="billing-kpi"><small>Guias prontas</small><strong>${ready.length}</strong><span>${money(ready.reduce((s,g)=>s+Number(g.total_amount||0),0))}</span></div><div class="billing-kpi"><small>Em aberto</small><strong>${money(open)}</strong><span>${ls.filter(l=>['draft','processed'].includes(l.status)).length} lotes</span></div><div class="billing-kpi"><small>Enviado</small><strong>${money(sent)}</strong><span>${ls.filter(l=>l.status==='sent').length} lotes</span></div><div class="billing-kpi"><small>Recebido</small><strong>${money(received)}</strong><span>${rs.filter(r=>r.status==='received').length} recebimentos</span></div><div class="billing-kpi"><small>Glosado em aberto</small><strong>${money(denied)}</strong><span>${ds.filter(d=>d.status!=='resolved').length} glosas</span></div></div><div class="billing-card"><div class="billing-head"><div><h3>Fluxo de faturamento</h3><p>Guia → lote → envio → recebimento. Glosas ficam vinculadas ao lote ou à guia.</p></div></div><div class="billing-flow"><div class="billing-stage"><small>01</small><strong>Guias</strong><span>${gs.length} registros</span></div><div class="billing-stage"><small>02</small><strong>Lotes</strong><span>${ls.length} lotes</span></div><div class="billing-stage"><small>03</small><strong>Financeiro</strong><span>${rs.length} recebimentos · ${ds.length} glosas</span></div></div></div></div>`;
  }
  function guideRow(g,names,ready){
    return `<div class="billing-row"><div class="billing-main">${ready?`<input class="billing-check" type="checkbox" data-guide-check value="${esc(g.id)}">`:''}<div><strong>${esc(names[g.patient_id]||'Paciente')}</strong><div class="billing-note">Guia ${esc(g.guide_number||'sem número')} · ${date(g.execution_date)} · ${money(g.total_amount)}</div></div></div><div class="billing-actions"><span class="billing-status">${esc(label(g.status))}</span>${!ready?`<button type="button" class="btn" data-release-guide="${esc(g.id)}">Liberar para faturamento</button>`:''}</div></div>`;
  }
  function guidesView(gs,names){
    const ready=gs.filter(g=>g.status==='ready'), drafts=gs.filter(g=>g.status==='draft');
    return `<div class="billing-shell"><div class="billing-card"><div class="billing-head"><div><h3>Guias prontas para faturamento</h3><p>Selecione somente guias liberadas para formar um lote.</p></div><button type="button" class="btn" data-create-lot ${ready.length?'':'disabled'}>Criar lote</button></div><div class="billing-list">${ready.length?ready.map(g=>guideRow(g,names,true)).join(''):'<div class="billing-empty">Nenhuma guia pronta para faturamento.</div>'}</div></div><div class="billing-card"><div class="billing-head"><div><h3>Guias em preparação</h3><p>Rascunhos criados na ficha do paciente. Nenhuma guia é liberada automaticamente.</p></div></div><div class="billing-list">${drafts.length?drafts.map(g=>guideRow(g,names,false)).join(''):'<div class="billing-empty">Nenhum rascunho pendente.</div>'}</div></div></div>`;
  }
  function lotStatusAction(l){
    if(l.status==='draft') return `<button type="button" class="btn" data-submit-lot="${esc(l.id)}">Enviar lote</button>`;
    return '';
  }
  function lotsView(ls,links,gs){
    const guideMap=Object.fromEntries(gs.map(g=>[g.id,g]));
    const byLot={}; links.forEach(x=>(byLot[x.lot_id]??=[]).push(x.guide_id));
    return `<div class="billing-shell"><div class="billing-card"><div class="billing-head"><div><h3>Lotes</h3><p>Lotes criados a partir de guias prontas para faturamento.</p></div></div><div class="billing-list">${ls.length?ls.map(l=>`<div class="billing-row"><div><strong>${esc(l.lot_number||'Lote sem número')}</strong><div class="billing-note">${l.guide_count||0} guia(s) · ${money(l.total_amount)} · criado em ${dateTime(l.created_at)}</div><div class="billing-note">Guias: ${(byLot[l.id]||[]).map(id=>esc(guideMap[id]?.guide_number||id)).join(', ')||'—'}</div></div><div class="billing-actions"><span class="billing-status">${esc(label(l.status))}</span>${lotStatusAction(l)}</div></div>`).join(''):'<div class="billing-empty">Nenhum lote criado.</div>'}</div></div></div>`;
  }
  function receiptsView(rs,ls){
    return `<div class="billing-shell"><div class="billing-card"><div class="billing-head"><div><h3>Recebimentos</h3><p>Registre valores recebidos e vincule-os ao lote quando houver.</p></div><button type="button" class="btn" data-new-receipt>Novo recebimento</button></div><div class="billing-list">${rs.length?rs.map(r=>`<div class="billing-row"><div><strong>${money(r.amount)}</strong><div class="billing-note">${date(r.received_at)} · ${r.reference?`Ref. ${esc(r.reference)} · `:''}${r.lot_id?`Lote ${esc((ls.find(l=>l.id===r.lot_id)?.lot_number)||r.lot_id)}`:'Sem lote'}</div>${r.notes?`<div class="billing-note">${esc(r.notes)}</div>`:''}</div><div class="billing-actions"><span class="billing-status">${esc(receiptLabel(r.status))}</span></div></div>`).join(''):'<div class="billing-empty">Nenhum recebimento registrado.</div>'}</div></div></div>`;
  }
  function receiptModal(ls){
    const options=ls.map(l=>`<option value="${esc(l.id)}">${esc(l.lot_number||'Lote sem número')} · ${money(l.total_amount)}</option>`).join('');
    return `${CSS}<div class="billing-modal-backdrop" data-billing-modal><div class="billing-modal"><div class="billing-head"><div><h3>Novo recebimento</h3><p>O registro será salvo no Supabase e aparecerá no histórico.</p></div><button type="button" class="btn" data-close-billing-modal>Cancelar</button></div><div class="billing-form"><div class="billing-field"><label for="receiptLot">Lote</label><select id="receiptLot"><option value="">Sem lote</option>${options}</select></div><div class="billing-field"><label for="receiptDate">Data do recebimento</label><input id="receiptDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="billing-field"><label for="receiptAmount">Valor recebido</label><input id="receiptAmount" type="number" min="0" step="0.01" placeholder="0,00"></div><div class="billing-field"><label for="receiptReference">Referência</label><input id="receiptReference" type="text" placeholder="Ex.: comprovante, protocolo..." maxlength="200"></div><div class="billing-field full"><label for="receiptNotes">Observações</label><textarea id="receiptNotes" placeholder="Observações do recebimento"></textarea></div><div class="billing-form-actions"><button type="button" class="btn" data-save-receipt>Salvar recebimento</button></div></div></div></div>`;
  }

  async function render(){
    const host=document.getElementById('billingWorkspace'); if(!host||busy)return;
    busy=true; host.innerHTML=CSS+'<div class="billing-card"><div class="billing-empty">Carregando faturamento…</div></div>';
    try{
      const [gs,ls,rs,ds]=await Promise.all([guides(),lots(),receipts(),denials()]);
      const names=await patientNames(gs.map(g=>g.patient_id));
      let body=overview(gs,ls,rs,ds);
      if(activeTab==='guias') body=guidesView(gs,names);
      if(activeTab==='lotes') body=lotsView(ls,await lotGuideLinks(ls.map(l=>l.id)),gs);
      if(activeTab==='recebimentos') body=receiptsView(rs,ls);
      if(activeTab==='glosas') body=`<div class="billing-card"><div class="billing-head"><div><h3>Glosas</h3><p>As glosas serão implementadas na Fase 5. Os registros existentes permanecem preservados.</p></div></div><div class="billing-empty">${ds.length} glosa(s) existente(s). Registro e resolução serão construídos na próxima fase.</div></div>`;
      host.innerHTML=`<div class="billing-shell">${tabs()}${body}</div>`;
    }catch(error){
      console.error('[Mentalita Faturamento] erro:',error);
      host.innerHTML=`${CSS}<div class="billing-card billing-error"><div class="billing-head"><div><h3>Erro ao carregar Faturamento</h3><p>O erro foi mantido visível para diagnóstico.</p></div></div><pre>${esc(error?.message||error)}</pre></div>`;
    }finally{busy=false;}
  }
  async function releaseGuide(id){
    const c=S(),clinic=C(); if(!c||!clinic) throw new Error('Clínica não identificada.');
    const guide=(await guides()).find(g=>g.id===id); if(!guide) throw new Error('Guia não encontrada.');
    if(guide.status!=='draft') throw new Error('Somente uma guia em rascunho pode ser liberada.');
    const r=await c.from('mentalita_patient_tiss_guides').update({status:'ready',finalized_at:new Date().toISOString(),finalized_by:U(),updated_at:new Date().toISOString()}).eq('id',id).eq('clinic_id',clinic).select('id,status').single();
    if(r.error) throw r.error; if(r.data?.status!=='ready') throw new Error('A atualização não confirmou o status pronto.'); await render();
  }
  async function createLot(){
    const c=S(),clinic=C(); if(!c||!clinic) throw new Error('Clínica não identificada.');
    const selected=[...document.querySelectorAll('[data-guide-check]:checked')].map(x=>x.value); if(!selected.length) throw new Error('Selecione pelo menos uma guia pronta.');
    const gs=await guides(),chosen=gs.filter(g=>selected.includes(g.id)); if(chosen.length!==selected.length) throw new Error('Uma ou mais guias selecionadas não foram encontradas.');
    if(chosen.some(g=>g.status!=='ready')) throw new Error('Somente guias prontas podem entrar em lote.');
    const conv=[...new Set(chosen.map(g=>g.convenio_id||'sem-convenio'))]; if(conv.length>1) throw new Error('As guias selecionadas pertencem a convênios diferentes. Separe os lotes.');
    const total=chosen.reduce((s,g)=>s+Number(g.total_amount||0),0); const d=new Date(); const number=`LOTE-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
    const lot=await c.from('mentalita_billing_lots').insert({clinic_id:clinic,lot_number:number,status:'draft',total_amount:total,guide_count:chosen.length,created_by:U()}).select('id').single(); if(lot.error) throw lot.error;
    const links=await c.from('mentalita_billing_lot_guides').insert(chosen.map(g=>({clinic_id:clinic,lot_id:lot.data.id,guide_id:g.id}))); if(links.error){await c.from('mentalita_billing_lots').delete().eq('id',lot.data.id).eq('clinic_id',clinic);throw links.error;}
    const updated=await c.from('mentalita_patient_tiss_guides').update({status:'batched',updated_at:new Date().toISOString()}).in('id',selected).eq('clinic_id',clinic); if(updated.error) throw updated.error;
    activeTab='lotes'; await render(); alert(`Lote ${number} criado com ${chosen.length} guia(s).`);
  }
  async function submitLot(id){
    const c=S(),clinic=C(); if(!c||!clinic) throw new Error('Clínica não identificada.');
    const lot=(await lots()).find(l=>l.id===id); if(!lot) throw new Error('Lote não encontrado.'); if(lot.status!=='draft') throw new Error('Somente lotes em rascunho podem ser enviados.');
    const links=await lotGuideLinks([id]); if(!links.length) throw new Error('O lote não possui guias vinculadas.');
    const guideIds=links.map(x=>x.guide_id); const gs=await guides(); const chosen=gs.filter(g=>guideIds.includes(g.id));
    if(chosen.length!==guideIds.length) throw new Error('O lote possui uma guia vinculada que não foi encontrada.'); if(chosen.some(g=>g.status!=='batched')) throw new Error('Todas as guias do lote precisam estar no status Em lote.');
    const now=new Date().toISOString();
    const r=await c.from('mentalita_billing_lots').update({status:'sent',submitted_at:now,updated_at:now}).eq('id',id).eq('clinic_id',clinic).select('id,status').single(); if(r.error) throw r.error; if(r.data?.status!=='sent') throw new Error('O envio não confirmou o status Enviada.');
    await c.from('mentalita_patient_tiss_guides').update({status:'sent',updated_at:now}).in('id',guideIds).eq('clinic_id',clinic);
    await render();
  }
  async function saveReceipt(){
    const c=S(),clinic=C(); if(!c||!clinic) throw new Error('Clínica não identificada.');
    const lotId=document.getElementById('receiptLot')?.value||null, receivedAt=document.getElementById('receiptDate')?.value, amount=Number(document.getElementById('receiptAmount')?.value||0), reference=document.getElementById('receiptReference')?.value.trim()||null, notes=document.getElementById('receiptNotes')?.value.trim()||null;
    if(!receivedAt) throw new Error('Informe a data do recebimento.'); if(!(amount>0)) throw new Error('Informe um valor de recebimento maior que zero.');
    if(lotId){const lot=(await lots()).find(l=>l.id===lotId); if(!lot) throw new Error('Lote selecionado não encontrado.'); if(!['sent','processed','paid'].includes(lot.status)) throw new Error('O recebimento só pode ser vinculado a um lote enviado ou processado.');}
    const r=await c.from('mentalita_billing_receipts').insert({clinic_id:clinic,lot_id:lotId,received_at:receivedAt,amount,status:'received',reference,notes,created_by:U()}).select('id').single(); if(r.error) throw r.error;
    if(lotId){
      const all=await c.from('mentalita_billing_receipts').select('amount,status').eq('clinic_id',clinic).eq('lot_id',lotId); if(all.error) throw all.error;
      const totalReceived=(all.data||[]).filter(x=>x.status==='received').reduce((s,x)=>s+Number(x.amount||0),0); const lot=(await lots()).find(l=>l.id===lotId); const now=new Date().toISOString();
      if(totalReceived>=Number(lot.total_amount||0)){const u=await c.from('mentalita_billing_lots').update({status:'paid',paid_at:now,updated_at:now}).eq('id',lotId).eq('clinic_id',clinic);if(u.error)throw u.error;}
      else if(lot.status!=='paid'){const u=await c.from('mentalita_billing_lots').update({status:'processed',processed_at:lot.processed_at||now,updated_at:now}).eq('id',lotId).eq('clinic_id',clinic);if(u.error)throw u.error;}
    }
    document.querySelector('[data-billing-modal]')?.remove(); await render();
  }
  function openReceiptModal(ls){document.body.insertAdjacentHTML('beforeend',receiptModal(ls));}

  document.addEventListener('click',async event=>{
    const tab=event.target.closest?.('[data-billing-tab]'); if(tab){event.preventDefault();activeTab=tab.dataset.billingTab;await render();return;}
    const release=event.target.closest?.('[data-release-guide]'); if(release){event.preventDefault();try{await releaseGuide(release.dataset.releaseGuide);}catch(e){console.error('[Mentalita Faturamento] liberar:',e);alert(e.message||'Não foi possível liberar a guia.');}return;}
    const create=event.target.closest?.('[data-create-lot]'); if(create&&!create.disabled){event.preventDefault();try{await createLot();}catch(e){console.error('[Mentalita Faturamento] lote:',e);alert(e.message||'Não foi possível criar o lote.');}return;}
    const submit=event.target.closest?.('[data-submit-lot]'); if(submit){event.preventDefault();try{if(confirm('Enviar este lote para faturamento?'))await submitLot(submit.dataset.submitLot);}catch(e){console.error('[Mentalita Faturamento] envio:',e);alert(e.message||'Não foi possível enviar o lote.');}return;}
    const newReceipt=event.target.closest?.('[data-new-receipt]'); if(newReceipt){event.preventDefault();try{openReceiptModal(await lots());}catch(e){console.error('[Mentalita Faturamento] formulário recebimento:',e);alert(e.message||'Não foi possível abrir o formulário.');}return;}
    const closeModal=event.target.closest?.('[data-close-billing-modal]'); if(closeModal){event.preventDefault();document.querySelector('[data-billing-modal]')?.remove();return;}
    const save=event.target.closest?.('[data-save-receipt]'); if(save){event.preventDefault();save.disabled=true;try{await saveReceipt();}catch(e){save.disabled=false;console.error('[Mentalita Faturamento] recebimento:',e);alert(e.message||'Não foi possível registrar o recebimento.');}return;}
  });
  document.addEventListener('change',event=>{
    if(event.target?.id==='receiptLot'){
      const lotId=event.target.value, lotIdEl=document.getElementById('receiptAmount'); if(!lotId||!lotIdEl)return;
      const option=event.target.selectedOptions?.[0]?.textContent||''; const match=option.match(/R\$\s*([\d.,]+)/); if(match)lotIdEl.value=match[1].replace(/\./g,'').replace(',','.');
    }
  });

  window.buildFaturamento=()=>'<div id="billingWorkspace"></div>';
  window.renderFaturamento=render;
})();
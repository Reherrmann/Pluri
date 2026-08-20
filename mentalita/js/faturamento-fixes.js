// Mentalita — UX e operações do faturamento TISS
(function(){
  'use strict';
  const S=()=>window.PLURI_SUPABASE||null;
  const C=()=>window.PLURI_CLINIC?.id||null;
  const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
  const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  let scheduled=false,lastTab='';

  const css=`<style>
    #billingWorkspace .billing-clean{display:flex;flex-direction:column;gap:14px}
    #billingWorkspace .billing-section{background:var(--surface,#fff);border:1px solid var(--border);border-radius:14px;padding:18px}
    #billingWorkspace .billing-section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
    #billingWorkspace .billing-section h3{margin:0;font-size:16px}
    #billingWorkspace .billing-section p{margin:4px 0 0;color:var(--text-secondary);font-size:12px}
    #billingWorkspace .billing-list{border-top:1px solid var(--border)}
    #billingWorkspace .billing-row-clean{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:13px 0;border-bottom:1px solid var(--border)}
    #billingWorkspace .billing-row-clean:last-child{border-bottom:0}
    #billingWorkspace .billing-main{min-width:0;display:flex;align-items:center;gap:10px}
    #billingWorkspace .billing-main strong{font-size:14px}
    #billingWorkspace .billing-note-clean{margin-top:4px;color:var(--text-secondary);font-size:12px}
    #billingWorkspace .billing-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
    #billingWorkspace .billing-status{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;background:#eef2f6;color:#526579;font-size:11px;font-weight:600}
    #billingWorkspace .billing-empty-clean{padding:18px 0;color:var(--text-secondary);font-size:13px}
    #billingWorkspace .billing-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    #billingWorkspace .billing-summary-card{padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--surface,#fff)}
    #billingWorkspace .billing-summary-card small{display:block;color:var(--text-secondary);font-size:11px}
    #billingWorkspace .billing-summary-card strong{display:block;font-size:20px;margin-top:4px}
    #billingWorkspace .billing-primary{background:#063a59!important;color:#fff!important;border-color:#063a59!important}
    #billingWorkspace .billing-check{width:17px;height:17px;accent-color:#063a59;cursor:pointer}
    #billingWorkspace .billing-batch-number{font-weight:800;font-size:14px}
    @media(max-width:650px){
      #billingWorkspace .billing-row-clean{align-items:flex-start;flex-direction:column}
      #billingWorkspace .billing-actions{width:100%;flex-wrap:wrap}
      #billingWorkspace .billing-summary{grid-template-columns:1fr}
    }
  </style>`;

  function tabs(){
    const active=document.querySelector('.billing-tab.active')?.dataset?.billingTab||'visao';
    document.querySelectorAll('.billing-tab').forEach(b=>{
      b.classList.toggle('active',b.dataset.billingTab===active);
      b.classList.toggle('btn-primary',b.dataset.billingTab===active);
    });
    return active;
  }

  async function loadGuides(){
    const c=S();
    if(!c||!C())return{drafts:[],ready:[]};
    const q=await c.from('mentalita_patient_tiss_guides')
      .select('id,patient_id,convenio_id,guide_number,execution_date,total_amount,status,created_at')
      .eq('clinic_id',C()).in('status',['draft','ready']).order('created_at',{ascending:false});
    if(q.error){console.error('[Mentalita Faturamento]',q.error);return{drafts:[],ready:[]};}
    const rows=q.data||[];
    const ids=[...new Set(rows.map(x=>x.patient_id).filter(Boolean))];
    let names={};
    if(ids.length){
      const p=await c.from('mentalita_patients').select('id,name').in('id',ids);
      names=Object.fromEntries((p.data||[]).map(x=>[x.id,x.name]));
    }
    const convenioIds=[...new Set(rows.map(x=>x.convenio_id).filter(Boolean))];
    let convenios={};
    if(convenioIds.length){
      const p=await c.from('mentalita_convenios').select('id,name').in('id',convenioIds);
      convenios=Object.fromEntries((p.data||[]).map(x=>[x.id,x.name]));
    }
    rows.forEach(x=>{x.patient_name=names[x.patient_id]||'Paciente';x.convenio_name=convenios[x.convenio_id]||'Convênio não informado';});
    return{drafts:rows.filter(x=>x.status==='draft'),ready:rows.filter(x=>x.status==='ready')};
  }

  function guideRow(g,selectable){
    return `<div class="billing-row-clean">
      <div class="billing-main">
        ${selectable?`<input class="billing-check billing-guide-check" type="checkbox" value="${esc(g.id)}" data-convenio="${esc(g.convenio_id||'')}" aria-label="Selecionar guia de ${esc(g.patient_name)}">`:''}
        <div><strong>${esc(g.patient_name)}</strong><div class="billing-note-clean">Guia ${esc(g.guide_number||'sem número')} · ${esc(g.execution_date||'—')} · ${esc(g.convenio_name)} · ${money(g.total_amount)}</div></div>
      </div>
      <div class="billing-actions"><span class="billing-status">${g.status==='draft'?'Rascunho':'Pronta'}</span>${!selectable?`<button type="button" class="btn billing-release" data-id="${esc(g.id)}">Liberar para faturamento</button>`:''}</div>
    </div>`;
  }

  async function renderGuides(host){
    const{drafts,ready}=await loadGuides();
    host.innerHTML=css+`<div class="billing-clean">
      <div class="billing-summary">
        <div class="billing-summary-card"><small>Prontas para faturamento</small><strong>${ready.length}</strong></div>
        <div class="billing-summary-card"><small>Em preparação</small><strong>${drafts.length}</strong></div>
        <div class="billing-summary-card"><small>Total de guias</small><strong>${ready.length+drafts.length}</strong></div>
      </div>

      <div class="billing-section">
        <div class="billing-section-head">
          <div><h3>Prontas para faturamento</h3><p>Selecione as guias que devem entrar no mesmo lote.</p></div>
          ${ready.length?'<button class="btn billing-primary billing-create-batch" type="button" disabled>Criar lote</button>':''}
        </div>
        <div class="billing-list">${ready.length?ready.map(g=>guideRow(g,true)).join(''):'<div class="billing-empty-clean">Nenhuma guia pronta para faturamento.</div>'}</div>
      </div>

      <div class="billing-section">
        <div class="billing-section-head"><div><h3>Em preparação</h3><p>Guias criadas, mas ainda não liberadas para faturamento.</p></div></div>
        <div class="billing-list">${drafts.length?drafts.map(g=>guideRow(g,false)).join(''):'<div class="billing-empty-clean">Nenhum rascunho pendente.</div>'}</div>
      </div>
    </div>`;

    const checks=[...host.querySelectorAll('.billing-guide-check')];
    const createBtn=host.querySelector('.billing-create-batch');
    const syncSelection=()=>{if(createBtn)createBtn.disabled=!checks.some(x=>x.checked);};
    checks.forEach(x=>x.addEventListener('change',syncSelection));

    host.querySelectorAll('.billing-release').forEach(btn=>btn.onclick=async()=>{
      btn.disabled=true;btn.textContent='Liberando…';
      const c=S();
      const r=await c.from('mentalita_patient_tiss_guides').update({status:'ready',updated_at:new Date().toISOString()}).eq('id',btn.dataset.id).eq('clinic_id',C());
      if(r.error){btn.disabled=false;btn.textContent='Liberar para faturamento';alert('Não foi possível liberar a guia.');return;}
      await renderGuides(host);
    });

    if(createBtn)createBtn.onclick=()=>createBatch(host);
  }

  async function createBatch(host){
    const c=S();
    if(!c||!C())return;
    const selected=[...host.querySelectorAll('.billing-guide-check:checked')].map(x=>x.value);
    if(!selected.length){alert('Selecione pelo menos uma guia para criar o lote.');return;}

    const{data:guides,error:gError}=await c.from('mentalita_patient_tiss_guides')
      .select('id,clinic_id,convenio_id,status,total_amount,execution_date')
      .eq('clinic_id',C()).in('id',selected);
    if(gError||!guides?.length){alert('Não foi possível carregar as guias selecionadas.');return;}
    if(guides.some(g=>g.status!=='ready')){alert('Uma ou mais guias selecionadas não estão mais prontas para faturamento. Atualize a página e tente novamente.');return;}

    const convenioIds=[...new Set(guides.map(g=>g.convenio_id).filter(Boolean))];
    if(convenioIds.length>1){alert('Um lote deve conter guias do mesmo convênio. Selecione apenas guias da mesma operadora.');return;}
    if(guides.some(g=>!g.convenio_id)){alert('Todas as guias do lote precisam estar vinculadas a um convênio.');return;}

    const now=new Date();
    const stamp=now.toISOString().slice(0,10).replace(/-/g,'');
    const batchNumber=`LOT-${stamp}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
    const total=guides.reduce((sum,g)=>sum+Number(g.total_amount||0),0);
    const competence=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;

    const button=host.querySelector('.billing-create-batch');
    if(button){button.disabled=true;button.textContent='Criando…';}

    const{data:batch,error:bError}=await c.from('mentalita_patient_tiss_batches').insert({
      clinic_id:C(),convenio_id:guides[0].convenio_id,batch_number:batchNumber,
      competence_month:competence,status:'draft',guide_count:guides.length,total_amount:total
    }).select('id').single();
    if(bError||!batch){if(button){button.disabled=false;button.textContent='Criar lote';}console.error('[Mentalita Faturamento]',bError);alert('Não foi possível criar o lote.');return;}

    const links=guides.map(g=>({batch_id:batch.id,guide_id:g.id,clinic_id:C()}));
    const{error:lError}=await c.from('mentalita_patient_tiss_batch_guides').insert(links);
    if(lError){await c.from('mentalita_patient_tiss_batches').delete().eq('id',batch.id).eq('clinic_id',C());if(button){button.disabled=false;button.textContent='Criar lote';}console.error('[Mentalita Faturamento]',lError);alert('O lote não pôde ser concluído.');return;}

    const{error:uError}=await c.from('mentalita_patient_tiss_guides').update({status:'batched',updated_at:new Date().toISOString()}).in('id',selected).eq('clinic_id',C()).eq('status','ready');
    if(uError){console.error('[Mentalita Faturamento]',uError);alert('O lote foi criado, mas não foi possível atualizar o status das guias.');}

    await c.from('mentalita_patient_tiss_audit').insert(guides.map(g=>({clinic_id:C(),patient_id:(g.patient_id||null),guide_id:g.id,action:'batch_created',metadata:{batch_id:batch.id,batch_number:batchNumber}})).filter(x=>x.patient_id));

    alert(`Lote ${batchNumber} criado com ${guides.length} guia${guides.length===1?'':'s'}.`);
    lastTab='';
    const lotesTab=document.querySelector('.billing-tab[data-billing-tab="lotes"]');
    if(lotesTab){lotesTab.click();return;}
    await renderGuides(host);
  }

  async function renderBatches(host){
    const c=S();
    if(!c||!C()){host.innerHTML=css+'<div class="billing-section">Não foi possível carregar os lotes.</div>';return;}
    const{data,error}=await c.from('mentalita_patient_tiss_batches').select('id,batch_number,convenio_id,competence_month,status,guide_count,total_amount,created_at').eq('clinic_id',C()).order('created_at',{ascending:false});
    if(error){console.error('[Mentalita Faturamento]',error);host.innerHTML=css+'<div class="billing-section"><div class="billing-empty-clean">Não foi possível carregar os lotes.</div></div>';return;}
    const rows=data||[];
    const convenioIds=[...new Set(rows.map(x=>x.convenio_id).filter(Boolean))];
    let convenios={};
    if(convenioIds.length){const r=await c.from('mentalita_convenios').select('id,name').in('id',convenioIds);convenios=Object.fromEntries((r.data||[]).map(x=>[x.id,x.name]));}
    host.innerHTML=css+`<div class="billing-clean">
      <div class="billing-section">
        <div class="billing-section-head"><div><h3>Lotes</h3><p>Guias agrupadas por convênio e competência, prontas para o próximo passo do faturamento.</p></div></div>
        <div class="billing-list">${rows.length?rows.map(b=>`<div class="billing-row-clean"><div class="billing-main"><div><div class="billing-batch-number">${esc(b.batch_number)}</div><div class="billing-note-clean">${esc(convenios[b.convenio_id]||'Convênio')} · competência ${esc(b.competence_month||'—')} · ${b.guide_count} guia${b.guide_count===1?'':'s'} · ${money(b.total_amount)}</div></div></div><div class="billing-actions"><span class="billing-status">${esc(b.status==='draft'?'Rascunho':b.status)}</span></div></div>`).join(''):'<div class="billing-empty-clean">Nenhum lote criado ainda.</div>'}</div>
      </div>
    </div>`;
  }

  function renderOverview(host){
    host.innerHTML=css+`<div class="billing-clean"><div class="billing-section"><div class="billing-section-head"><div><h3>Fluxo de faturamento</h3><p>Da guia TISS ao recebimento do convênio.</p></div></div><div class="billing-summary"><div class="billing-summary-card"><small>1 · Guia pronta</small><strong>TISS</strong></div><div class="billing-summary-card"><small>2 · Agrupamento</small><strong>Lote</strong></div><div class="billing-summary-card"><small>3 · Operadora</small><strong>Envio</strong></div></div></div><div class="billing-section"><div class="billing-section-head"><div><h3>Próximas etapas</h3><p>O fluxo financeiro será conectado aos lotes, glosas e recebimentos nas próximas etapas.</p></div></div></div></div>`;
  }

  function renderPlaceholder(host,title,description){host.innerHTML=css+`<div class="billing-clean"><div class="billing-section"><div class="billing-section-head"><div><h3>${title}</h3><p>${description}</p></div></div><div class="billing-empty-clean">Nenhum registro disponível ainda.</div></div></div>`;}

  async function render(){
    const host=document.getElementById('billingWorkspace');if(!host)return;
    const active=tabs();
    if(active===lastTab&&host.querySelector('.billing-clean'))return;
    lastTab=active;
    host.dataset.billingRendered='1';
    if(active==='guias')return renderGuides(host);
    if(active==='lotes')return renderBatches(host);
    if(active==='glosas')return renderPlaceholder(host,'Glosas','Registre e acompanhe recusas e pendências dos convênios.');
    if(active==='recebimentos')return renderPlaceholder(host,'Recebimentos','Acompanhe os pagamentos recebidos dos convênios.');
    renderOverview(host);
  }

  function run(){if(scheduled)return;scheduled=true;setTimeout(async()=>{scheduled=false;await render();},60);}
  document.addEventListener('click',e=>{if(e.target.closest?.('.billing-tab')){lastTab='';setTimeout(run,20);}});
  const obs=new MutationObserver(()=>{const host=document.getElementById('billingWorkspace');if(host&&!host.querySelector('.billing-clean')){lastTab='';run();}});
  obs.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>{lastTab='';run();},300);
  window.mentalitaFaturamentoFix=run;
})();

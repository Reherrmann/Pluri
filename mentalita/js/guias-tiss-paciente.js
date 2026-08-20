// Mentalita — Guias TISS do paciente
(function(){
  if(window.__mentalitaGuiasTissInstalled)return;

  const S=()=>window.PLURI_SUPABASE||null;
  const P=()=>window.state?.selectedPatient||(typeof state!=='undefined'?state.selectedPatient:null);
  const C=()=>window.PLURI_CLINIC?.id||null;
  const U=()=>window.PLURI_AUTH_SESSION?.user||null;
  const ID=p=>p?.id||p?.ID||null;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const date=v=>v?new Date(String(v).slice(0,10)+'T00:00:00').toLocaleDateString('pt-BR'):'—';
  const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));

  let draftItems=[];
  let draftForm={guide_number:'',appointment_id:'',execution_date:'',notes:''};

  async function procedures(){
    const c=S();
    if(!c||!C())return[];
    const {data,error}=await c.from('mentalita_tiss_procedures').select('*').eq('clinic_id',C()).eq('status','active').order('description');
    if(error){console.error('[Mentalita TISS] procedures:',error);return[];}
    return data||[];
  }

  async function appointments(){
    const c=S(),p=P();
    if(!c||!p)return[];
    const q=await c.from('mentalita_appointments').select('*').eq('patient_id',ID(p)).order('appointment_date',{ascending:false}).limit(50);
    if(q.error){console.error('[Mentalita TISS] appointments:',q.error);return[];}
    return q.data||[];
  }

  async function guides(){
    const c=S(),p=P();
    if(!c||!p||!C())return[];
    const q=await c.from('mentalita_patient_tiss_guides').select('*').eq('clinic_id',C()).eq('patient_id',ID(p)).order('created_at',{ascending:false});
    if(q.error){console.error('[Mentalita TISS] guides:',q.error);return[];}
    return q.data||[];
  }

  async function items(guideId){
    const c=S();
    if(!c)return[];
    const q=await c.from('mentalita_patient_tiss_items').select('*').eq('guide_id',guideId).order('created_at');
    if(q.error){console.error('[Mentalita TISS] items:',q.error);return[];}
    return q.data||[];
  }

  const modalCss=`<style>
    #mtModal *{box-sizing:border-box}
    #mtModal .mt-modal{width:min(820px,100%);max-height:92vh;overflow:auto;background:#fff;border:1px solid #d7dee7;border-radius:20px;box-shadow:0 28px 80px rgba(18,35,53,.22);padding:28px}
    #mtModal .mt-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding-bottom:20px;border-bottom:1px solid #e5eaf0}
    #mtModal .mt-eyebrow{font-size:10px;font-weight:800;letter-spacing:.14em;color:#5d7187}
    #mtModal h2{margin:5px 0 0;font-size:24px;line-height:1.15;color:#182235}
    #mtModal .mt-sub{margin:7px 0 0;color:#66778b;font-size:13px}
    #mtModal .mt-close{border:0;background:#eef1f4;color:#182235;border-radius:999px;padding:10px 18px;font-weight:700;cursor:pointer}
    #mtModal .mt-section{margin-top:20px;padding:18px;border:1px solid #dce3ea;border-radius:14px;background:#fbfcfd}
    #mtModal .mt-section-title{font-size:13px;font-weight:800;color:#173b57;margin-bottom:14px}
    #mtModal .mt-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    #mtModal .mt-field{display:flex;flex-direction:column;gap:6px}
    #mtModal .mt-field label{font-size:12px;font-weight:700;color:#33465a}
    #mtModal input,#mtModal select,#mtModal textarea{width:100%;border:1px solid #cbd5df;border-radius:9px;background:#fff;color:#182235;font:inherit;font-size:13px;padding:10px 12px;outline:none;transition:border .15s,box-shadow .15s}
    #mtModal textarea{min-height:82px;resize:vertical}
    #mtModal input:focus,#mtModal select:focus,#mtModal textarea:focus{border-color:#123b57;box-shadow:0 0 0 3px rgba(18,59,87,.08)}
    #mtModal input[readonly]{background:#f3f6f8;color:#66778b}
    #mtModal .mt-help{font-size:11px;color:#78889a;margin-top:2px}
    #mtModal .mt-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:22px}
    #mtModal .mt-btn{border:0;border-radius:999px;padding:11px 18px;font-weight:700;cursor:pointer;background:#eef1f4;color:#182235}
    #mtModal .mt-primary{background:#063a59;color:#fff}
    #mtModal .mt-btn:disabled{opacity:.55;cursor:not-allowed}
    #mtModal .mt-proc-empty{font-size:12px;color:#718196;padding:11px 0}
    #mtModal .mt-proc-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 12px;background:#fff;border:1px solid #dce3ea;border-radius:10px;margin-bottom:7px}
    #mtModal .mt-proc-code{font-size:12px;font-weight:800;color:#173b57}
    #mtModal .mt-proc-desc{font-size:12px;color:#526579;margin-top:3px}
    @media(max-width:650px){#mtModal .mt-modal{padding:20px;border-radius:16px}#mtModal .mt-grid{grid-template-columns:1fr}#mtModal h2{font-size:21px}}
  </style>`;

  function modal(title,body,sub=''){
    document.getElementById('mtModal')?.remove();
    document.body.insertAdjacentHTML('beforeend',`${modalCss}<div id="mtModal" style="position:fixed;inset:0;z-index:10020;background:rgba(17,29,42,.48);display:flex;align-items:center;justify-content:center;padding:18px"><div class="mt-modal"><div class="mt-head"><div><div class="mt-eyebrow">GUIA TISS</div><h2>${title}</h2>${sub?`<div class="mt-sub">${sub}</div>`:''}</div><button type="button" class="mt-close" id="mtClose">Fechar</button></div><div>${body}</div></div></div>`);
    document.getElementById('mtClose').onclick=()=>document.getElementById('mtModal')?.remove();
  }

  function statusBadge(s){
    const map={draft:'Rascunho',ready:'Pronta para faturamento',billed:'Faturada',sent:'Enviada',processed:'Processada',paid:'Paga',denied:'Glosada'};
    return `<span style="display:inline-flex;padding:6px 10px;border-radius:999px;background:#eef2f6;font-size:11px;font-weight:700">${esc(map[s]||s||'Rascunho')}</span>`;
  }

  function captureDraftForm(){
    const guideNo=document.getElementById('mtGuideNo');
    const appt=document.getElementById('mtAppt');
    const exec=document.getElementById('mtExec');
    const obs=document.getElementById('mtObs');
    if(guideNo)draftForm.guide_number=guideNo.value||'';
    if(appt)draftForm.appointment_id=appt.value||'';
    if(exec)draftForm.execution_date=exec.value||'';
    if(obs)draftForm.notes=obs.value||'';
  }

  function resetDraftState(){
    draftItems=[];
    draftForm={guide_number:'',appointment_id:'',execution_date:'',notes:''};
  }

  async function patientInsurance(){
    const p=P(),c=S();
    let conv=null;
    if(c&&p){
      const q=await c.from('mentalita_patients').select('id,insurance_name,insurance_plan,insurance_card,insurance_expiration').eq('id',ID(p)).maybeSingle();
      if(q.data)conv={convenio_name:q.data.insurance_name,plano:q.data.insurance_plan,carteirinha:q.data.insurance_card,convenio_id:null};
    }
    return conv;
  }

  async function newGuide(resetDraft=true){
    const p=P();
    if(!p)return;

    if(resetDraft)resetDraftState();
    else captureDraftForm();

    const a=await appointments();
    const conv=await patientInsurance();
    const options=a.map(x=>{
      const selected=String(x.id||'')===String(draftForm.appointment_id||'')?' selected':'';
      return `<option value="${esc(x.id)}"${selected}>${esc(x.appointment_date||'')} · ${esc(x.service||'Atendimento')} · ${esc(x.professional||'')}</option>`;
    }).join('');

    const body=`<div class="mt-section"><div class="mt-section-title">Dados do atendimento</div><div class="mt-grid">
      <div class="mt-field"><label>Convênio</label><input value="${esc(conv?.convenio_name||'Nenhum convênio cadastrado')}" readonly></div>
      <div class="mt-field"><label>Plano</label><input value="${esc(conv?.plano||'—')}" readonly></div>
      <div class="mt-field"><label>Carteirinha</label><input value="${esc(conv?.carteirinha||'—')}" readonly></div>
      <div class="mt-field"><label>Número da guia</label><input id="mtGuideNo" value="${esc(draftForm.guide_number)}" placeholder="Preencher quando disponível"><div class="mt-help">O número oficial pode ser informado posteriormente.</div></div>
      <div class="mt-field"><label>Atendimento</label><select id="mtAppt"><option value="">Selecione um atendimento</option>${options}</select>${!a.length?'<div class="mt-help">Nenhum atendimento cadastrado para este paciente.</div>':''}</div>
      <div class="mt-field"><label>Data de execução</label><input id="mtExec" type="date" value="${esc(draftForm.execution_date)}"></div>
    </div></div>
    <div class="mt-section"><div class="mt-section-title">Observações</div><div class="mt-field"><textarea id="mtObs" placeholder="Informações complementares da guia, se necessário.">${esc(draftForm.notes)}</textarea></div></div>
    <div class="mt-section"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><div class="mt-section-title" style="margin-bottom:3px">Procedimentos</div><div class="mt-help">Adicione os procedimentos realizados neste atendimento.</div></div><button type="button" class="mt-btn" id="mtAdd">+ Adicionar</button></div><div id="mtItems" style="margin-top:13px"></div></div>
    <div class="mt-actions"><button type="button" class="mt-btn" id="mtCancel">Cancelar</button><button type="button" class="mt-btn mt-primary" id="mtCreate" ${draftItems.length?'':'disabled'}>Criar rascunho</button></div>`;

    modal('Nova guia TISS',body,'Preencha a guia e salve somente quando estiver pronta para continuar.');
    renderDraftItems();

    document.getElementById('mtCancel').onclick=()=>{resetDraftState();document.getElementById('mtModal')?.remove();};
    document.getElementById('mtAppt').onchange=e=>{
      const x=a.find(v=>String(v.id)===String(e.target.value));
      draftForm.appointment_id=e.target.value||'';
      if(x){const d=String(x.appointment_date||'').slice(0,10);document.getElementById('mtExec').value=d;draftForm.execution_date=d;}
    };
    document.getElementById('mtAdd').onclick=addItem;
    document.getElementById('mtCreate').onclick=()=>createGuide(conv);
  }

  async function addItem(){
    captureDraftForm();
    const ps=await procedures();
    const body=`<div class="mt-section" style="margin-top:0"><div class="mt-section-title">Selecionar procedimento</div><div class="mt-field"><label>Procedimento</label><select id="mtProc"><option value="">Selecione um procedimento</option>${ps.map(p=>`<option value="${esc(p.id)}">${esc(p.code)} — ${esc(p.description)} · ${money(p.default_amount)}</option>`).join('')}</select>${!ps.length?'<div class="mt-help">Nenhum procedimento ativo cadastrado para esta clínica.</div>':''}</div><div class="mt-actions" style="margin-top:16px"><button class="mt-btn" id="mtPCancel">Cancelar</button><button class="mt-btn mt-primary" id="mtPAdd" ${ps.length?'':'disabled'}>Adicionar procedimento</button></div></div>`;
    modal('Adicionar procedimento',body,'O valor padrão será trazido do catálogo da clínica.');
    document.getElementById('mtPCancel').onclick=()=>{document.getElementById('mtModal')?.remove();newGuide(false);};
    document.getElementById('mtPAdd').onclick=()=>{
      const p=ps.find(x=>String(x.id)===String(document.getElementById('mtProc').value));
      if(!p)return;
      draftItems.push({procedure_id:p.id,code:p.code,description:p.description,quantity:1,unit_amount:Number(p.default_amount||0)});
      document.getElementById('mtModal')?.remove();
      newGuide(false);
    };
  }

  function renderDraftItems(){
    const b=document.getElementById('mtItems');
    const create=document.getElementById('mtCreate');
    if(!b)return;
    b.innerHTML=draftItems.length?draftItems.map((x,i)=>`<div class="mt-proc-row"><div><div class="mt-proc-code">${esc(x.code)}</div><div class="mt-proc-desc">${esc(x.description)} · ${money(x.unit_amount)} · Qtd. ${esc(x.quantity||1)}</div></div><button type="button" class="mt-btn" data-remove="${i}">Remover</button></div>`).join(''):'<div class="mt-proc-empty">Nenhum procedimento adicionado.</div>';
    if(create)create.disabled=!draftItems.length;
    b.querySelectorAll('[data-remove]').forEach(x=>x.onclick=()=>{captureDraftForm();draftItems.splice(Number(x.dataset.remove),1);renderDraftItems();});
  }

  async function createGuide(conv){
    captureDraftForm();
    const c=S(),p=P();
    if(!c||!p||!C())return;
    if(!draftItems.length){alert('Adicione pelo menos um procedimento antes de criar a guia.');return;}

    const total=draftItems.reduce((sum,x)=>sum+(Number(x.quantity||1)*Number(x.unit_amount||0)),0);
    const payload={clinic_id:C(),patient_id:ID(p),convenio_id:conv?.convenio_id||null,appointment_id:draftForm.appointment_id||null,guide_number:draftForm.guide_number.trim()||null,execution_date:draftForm.execution_date||null,notes:draftForm.notes||null,total_amount:total,status:'draft',created_by:U()?.id||null};
    const {data,error}=await c.from('mentalita_patient_tiss_guides').insert(payload).select('*').single();
    if(error){console.error('[Mentalita TISS] guide:',error);alert('Não foi possível criar a guia.');return;}

    const itemRows=draftItems.map(x=>({guide_id:data.id,procedure_id:x.procedure_id,code:x.code,description:x.description,quantity:x.quantity,unit_amount:x.unit_amount,total_amount:x.quantity*x.unit_amount}));
    const itemResult=await c.from('mentalita_patient_tiss_items').insert(itemRows);
    if(itemResult.error){
      console.error('[Mentalita TISS] items:',itemResult.error);
      await c.from('mentalita_patient_tiss_guides').delete().eq('id',data.id).eq('clinic_id',C());
      alert('A guia não pôde ser criada porque os procedimentos não foram salvos. Nenhuma guia vazia foi mantida.');
      return;
    }

    resetDraftState();
    document.getElementById('mtModal')?.remove();
    await render();
  }

  async function openGuide(g){
    const its=await items(g.id);
    const total=its.reduce((s,x)=>s+Number(x.total_amount||Number(x.quantity||1)*Number(x.unit_amount||0)),0);
    if(Number(g.total_amount||0)!==total){
      const c=S();
      if(c&&g.id){await c.from('mentalita_patient_tiss_guides').update({total_amount:total,updated_at:new Date().toISOString()}).eq('id',g.id).eq('clinic_id',C());g.total_amount=total;}
    }
    const body=`<div class="mt-section" style="margin-top:0"><div class="mt-grid"><div><div class="mt-help">Paciente</div><strong>${esc(P()?.name||P()?.Nome||'Paciente')}</strong></div><div><div class="mt-help">Status</div>${statusBadge(g.status)}</div><div><div class="mt-help">Número da guia</div><strong>${esc(g.guide_number||'Não informado')}</strong></div><div><div class="mt-help">Data de execução</div><strong>${date(g.execution_date)}</strong></div></div></div><div class="mt-section"><div class="mt-section-title">Procedimentos</div>${its.length?its.map(x=>`<div class="mt-proc-row"><div><div class="mt-proc-code">${esc(x.code||'—')} · ${esc(x.description||'Procedimento')}</div><div class="mt-proc-desc">Qtd. ${esc(x.quantity||1)} · ${money(x.unit_amount)}</div></div><strong>${money(x.total_amount)}</strong></div>`).join(''):'<div class="mt-proc-empty">Nenhum procedimento.</div>'}<div style="text-align:right;font-size:18px;font-weight:800;margin-top:14px">Total ${money(total)}</div></div><div class="mt-actions"><button class="mt-btn" id="mtPrint">Imprimir / PDF</button><button class="mt-btn mt-primary" id="mtReady">${g.status==='draft'?'Fechar guia':'Fechar'}</button></div>`;
    modal('Guia '+(g.guide_number||'sem número'),body,'Conferência da guia antes do faturamento.');
    document.getElementById('mtPrint').onclick=()=>printGuide(g,its,total);
    document.getElementById('mtReady').onclick=()=>g.status==='draft'?closeGuide(g):document.getElementById('mtModal')?.remove();
  }

  async function closeGuide(g){
    const c=S();
    if(!c)return;
    const its=await items(g.id);
    if(!its.length){alert('A guia não pode ser fechada sem pelo menos um procedimento.');return;}
    const total=its.reduce((s,x)=>s+Number(x.total_amount||Number(x.quantity||1)*Number(x.unit_amount||0)),0);
    const {error}=await c.from('mentalita_patient_tiss_guides').update({status:'ready',total_amount:total,updated_at:new Date().toISOString()}).eq('id',g.id).eq('clinic_id',C());
    if(error){console.error('[Mentalita TISS] close guide:',error);alert('Não foi possível fechar a guia.');return;}
    document.getElementById('mtModal')?.remove();
    await render();
  }

  function printGuide(g,its,total){
    const p=P(),w=window.open('','_blank');
    if(!w)return;
    w.document.write(`<html><head><title>Guia TISS ${esc(g.guide_number||'sem-numero')}</title><style>body{font-family:Arial,sans-serif;color:#182235;margin:42px}h1{font-size:24px;margin:4px 0 8px}.brand{font-size:11px;letter-spacing:.14em;font-weight:800;color:#123b57;border-bottom:2px solid #d9e2ea;padding-bottom:12px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:22px 0}.box{border:1px solid #d9e2ea;border-radius:9px;padding:12px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{text-align:left;padding:9px;border-bottom:1px solid #d9e2ea}th{font-size:11px;text-transform:uppercase}.total{text-align:right;font-size:18px;font-weight:700;margin-top:18px}@media print{body{margin:18mm}}</style></head><body><div class="brand">MENTALITA · GUIA TISS</div><h1>Guia TISS</h1><div>Paciente: <strong>${esc(p?.name||p?.Nome||'Paciente')}</strong></div><div class="meta"><div class="box"><small>Número da guia</small><br><strong>${esc(g.guide_number||'Não informado')}</strong></div><div class="box"><small>Data de execução</small><br><strong>${date(g.execution_date)}</strong></div></div><table><thead><tr><th>Código</th><th>Procedimento</th><th>Qtd.</th><th>Valor</th><th>Total</th></tr></thead><tbody>${its.map(x=>`<tr><td>${esc(x.code||'—')}</td><td>${esc(x.description||'')}</td><td>${esc(x.quantity||1)}</td><td>${money(x.unit_amount)}</td><td>${money(x.total_amount)}</td></tr>`).join('')}</tbody></table><div class="total">Total: ${money(total)}</div><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  }

  async function render(){
    const host=document.getElementById('mentalitaTissHost')||document.querySelector('[data-tiss-host]');
    if(!host)return;
    const rows=await guides(),total=rows.length;
    const counts={draft:0,ready:0,billed:0};
    rows.forEach(g=>counts[g.status]=(counts[g.status]||0)+1);
    host.innerHTML=`<div><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px"><div><div style="font-size:11px;font-weight:800;letter-spacing:.12em;color:var(--text-secondary)">GUIAS TISS</div><h2 style="margin:5px 0">Guias do paciente</h2><div style="color:var(--text-secondary);font-size:13px">Registre, confira e acompanhe o atendimento para faturamento.</div></div><button class="btn btn-primary" data-new-tiss>+ Nova guia</button></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0"><div class="patient-info-card"><small>Total</small><strong style="display:block;font-size:22px">${total}</strong></div><div class="patient-info-card"><small>Rascunhos</small><strong style="display:block;font-size:22px">${counts.draft||0}</strong></div><div class="patient-info-card"><small>Prontas para faturamento</small><strong style="display:block;font-size:22px">${counts.ready||0}</strong></div></div><div class="patient-info-card"><h3 style="margin-top:0">Guias</h3>${rows.length?rows.map(g=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)"><div><strong>Guia ${esc(g.guide_number||'sem número')}</strong><div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${date(g.execution_date)} · ${statusBadge(g.status)} · ${money(g.total_amount)}</div></div><button class="btn" data-open-tiss="${g.id}">Abrir</button></div>`).join(''):'<div style="padding:20px 0;color:var(--text-secondary)">Nenhuma guia criada.</div>'}</div></div>`;
    host.querySelectorAll('[data-open-tiss]').forEach(b=>b.onclick=()=>openGuide(rows.find(g=>g.id===b.dataset.openTiss)));
  }

  function install(){
    window.__mentalitaGuiasTissInstalled=true;
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('[data-new-tiss]');
      if(b){e.preventDefault();newGuide(true);}
    });
  }

  install();
  window.renderMentalitaTiss=render;
})();
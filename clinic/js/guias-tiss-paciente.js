// Clinic — Guias TISS do paciente
(function(){
  if(window.__clinicGuiasTissInstalled)return;

  const S=()=>window.PLURI_SUPABASE||null;
  const P=()=>window.state?.selectedPatient||(typeof state!=='undefined'?state.selectedPatient:null);
  const C=()=>window.PLURI_CLINIC?.id||null;
  const U=()=>window.PLURI_AUTH_SESSION?.user||null;
  const ID=p=>p?.id||p?.ID||null;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const date=v=>v?new Date(String(v).slice(0,10)+'T00:00:00').toLocaleDateString('pt-BR'):'—';
  const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));

  let draftItems=[];
  let draftForm={guide_number:'',appointment_id:'',execution_date:'',notes:''};

  async function procedures(){
    const c=S();
    if(!c||!C())return[];
    const {data,error}=await c.from('clinic_tiss_procedures').select('*').eq('clinic_id',C()).eq('status','active').order('description');
    if(error){console.error('[Clinic TISS] procedures:',error);return[];}
    return data||[];
  }

  async function appointments(){
    const c=S(),p=P();
    if(!c||!p)return[];
    const q=await c.from('clinic_appointments').select('*').eq('patient_id',ID(p)).order('appointment_date',{ascending:false}).limit(50);
    if(q.error){console.error('[Clinic TISS] appointments:',q.error);return[];}
    return q.data||[];
  }

  async function guides(){
    const c=S(),p=P();
    if(!c||!p||!C())return[];
    const q=await c.from('clinic_patient_tiss_guides').select('*').eq('clinic_id',C()).eq('patient_id',ID(p)).order('created_at',{ascending:false});
    if(q.error){console.error('[Clinic TISS] guides:',q.error);return[];}
    return q.data||[];
  }

  async function items(guideId){
    const c=S();
    if(!c)return[];
    const q=await c.from('clinic_patient_tiss_items').select('*').eq('guide_id',guideId).order('created_at');
    if(q.error){console.error('[Clinic TISS] items:',q.error);return[];}
    return q.data||[];
  }

  const modalCss=`<style>
    #ctModal *{box-sizing:border-box}
    #ctModal .ct-modal{width:min(820px,100%);max-height:92vh;overflow:auto;background:#fff;border:1px solid #d7dee7;border-radius:20px;box-shadow:0 28px 80px rgba(18,35,53,.22);padding:28px}
    #ctModal .ct-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding-bottom:20px;border-bottom:1px solid #e5eaf0}
    #ctModal .ct-eyebrow{font-size:10px;font-weight:800;letter-spacing:.14em;color:#5d7187}
    #ctModal h2{margin:5px 0 0;font-size:24px;line-height:1.15;color:#182235}
    #ctModal .ct-sub{margin:7px 0 0;color:#66778b;font-size:13px}
    #ctModal .ct-close{border:0;background:#eef1f4;color:#182235;border-radius:999px;padding:10px 18px;font-weight:700;cursor:pointer}
    #ctModal .ct-section{margin-top:20px;padding:18px;border:1px solid #dce3ea;border-radius:14px;background:#fbfcfd}
    #ctModal .ct-section-title{font-size:13px;font-weight:800;color:#173b57;margin-bottom:14px}
    #ctModal .ct-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    #ctModal .ct-field{display:flex;flex-direction:column;gap:6px}
    #ctModal .ct-field label{font-size:12px;font-weight:700;color:#33465a}
    #ctModal input,#ctModal select,#ctModal textarea{width:100%;border:1px solid #cbd5df;border-radius:9px;background:#fff;color:#182235;font:inherit;font-size:13px;padding:10px 12px;outline:none;transition:border .15s,box-shadow .15s}
    #ctModal textarea{min-height:82px;resize:vertical}
    #ctModal input:focus,#ctModal select:focus,#ctModal textarea:focus{border-color:#123b57;box-shadow:0 0 0 3px rgba(18,59,87,.08)}
    #ctModal input[readonly]{background:#f3f6f8;color:#66778b}
    #ctModal .ct-help{font-size:11px;color:#78889a;margin-top:2px}
    #ctModal .ct-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:22px}
    #ctModal .ct-btn{border:0;border-radius:999px;padding:11px 18px;font-weight:700;cursor:pointer;background:#eef1f4;color:#182235}
    #ctModal .ct-primary{background:#063a59;color:#fff}
    #ctModal .ct-btn:disabled{opacity:.55;cursor:not-allowed}
    #ctModal .ct-proc-empty{font-size:12px;color:#718196;padding:11px 0}
    #ctModal .ct-proc-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 12px;background:#fff;border:1px solid #dce3ea;border-radius:10px;margin-bottom:7px}
    #ctModal .ct-proc-code{font-size:12px;font-weight:800;color:#173b57}
    #ctModal .ct-proc-desc{font-size:12px;color:#526579;margin-top:3px}
    @media(max-width:650px){#ctModal .ct-modal{padding:20px;border-radius:16px}#ctModal .ct-grid{grid-template-columns:1fr}#ctModal h2{font-size:21px}}
  </style>`;

  function modal(title,body,sub=''){
    document.getElementById('ctModal')?.remove();
    document.body.insertAdjacentHTML('beforeend',`${modalCss}<div id="ctModal" style="position:fixed;inset:0;z-index:10020;background:rgba(17,29,42,.48);display:flex;align-items:center;justify-content:center;padding:18px"><div class="ct-modal"><div class="ct-head"><div><div class="ct-eyebrow">GUIA TISS</div><h2>${title}</h2>${sub?`<div class="ct-sub">${sub}</div>`:''}</div><button type="button" class="ct-close" id="ctClose">Fechar</button></div><div>${body}</div></div></div>`);
    document.getElementById('ctClose').onclick=()=>document.getElementById('ctModal')?.remove();
  }

  function statusBadge(s){
    const map={draft:'Rascunho',ready:'Pronta para faturamento',billed:'Faturada',sent:'Enviada',processed:'Processada',paid:'Paga',denied:'Glosada'};
    return `<span style="display:inline-flex;padding:6px 10px;border-radius:999px;background:#eef2f6;font-size:11px;font-weight:700">${esc(map[s]||s||'Rascunho')}</span>`;
  }

  function captureDraftForm(){
    const guideNo=document.getElementById('ctGuideNo');
    const appt=document.getElementById('ctAppt');
    const exec=document.getElementById('ctExec');
    const obs=document.getElementById('ctObs');
    if(guideNo)draftForm.guide_number=guideNo.value||'';
    if(appt)draftForm.appointment_id=appt.value||'';
    if(exec)draftForm.execution_date=exec.value||'';
    if(obs)draftForm.notes=obs.value||'';
  }

  function resetDraftState(){draftItems=[];draftForm={guide_number:'',appointment_id:'',execution_date:'',notes:''};}

  async function patientInsurance(){
    const p=P(),c=S(); let conv=null;
    if(c&&p){
      const q=await c.from('clinic_patients').select('id,insurance_name,insurance_plan,insurance_card,insurance_expiration').eq('id',ID(p)).maybeSingle();
      if(q.data)conv={convenio_name:q.data.insurance_name,plano:q.data.insurance_plan,carteirinha:q.data.insurance_card,convenio_id:null};
    }
    return conv;
  }

  async function newGuide(resetDraft=true){
    const p=P(); if(!p)return;
    if(resetDraft)resetDraftState(); else captureDraftForm();
    const a=await appointments(); const conv=await patientInsurance();
    const options=a.map(x=>{const selected=String(x.id||'')===String(draftForm.appointment_id||'')?' selected':'';return `<option value="${esc(x.id)}"${selected}>${esc(x.appointment_date||'')} · ${esc(x.service||'Atendimento')} · ${esc(x.professional||'')}</option>`;}).join('');
    const body=`<div class="ct-section"><div class="ct-section-title">Dados do atendimento</div><div class="ct-grid"><div class="ct-field"><label>Convênio</label><input value="${esc(conv?.convenio_name||'Nenhum convênio cadastrado')}" readonly></div><div class="ct-field"><label>Plano</label><input value="${esc(conv?.plano||'—')}" readonly></div><div class="ct-field"><label>Carteirinha</label><input value="${esc(conv?.carteirinha||'—')}" readonly></div><div class="ct-field"><label>Número da guia</label><input id="ctGuideNo" value="${esc(draftForm.guide_number)}" placeholder="Preencher quando disponível"></div><div class="ct-field"><label>Atendimento</label><select id="ctAppt"><option value="">Selecione um atendimento</option>${options}</select>${!a.length?'<div class="ct-help">Nenhum atendimento cadastrado para este paciente.</div>':''}</div><div class="ct-field"><label>Data de execução</label><input id="ctExec" type="date" value="${esc(draftForm.execution_date)}"></div></div></div><div class="ct-section"><div class="ct-section-title">Observações</div><div class="ct-field"><textarea id="ctObs" placeholder="Informações complementares da guia, se necessário.">${esc(draftForm.notes)}</textarea></div></div><div class="ct-section"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><div class="ct-section-title" style="margin-bottom:3px">Procedimentos</div><div class="ct-help">Adicione os procedimentos realizados neste atendimento.</div></div><button type="button" class="ct-btn" id="ctAdd">+ Adicionar</button></div><div id="ctItems" style="margin-top:13px"></div></div><div class="ct-actions"><button type="button" class="ct-btn" id="ctCancel">Cancelar</button><button type="button" class="ct-btn ct-primary" id="ctCreate" disabled>Criar rascunho</button></div>`;
    modal('Nova guia TISS',body,'Preencha a guia e salve somente quando estiver pronta para continuar.');
    renderDraftItems();
    document.getElementById('ctCancel').onclick=()=>{resetDraftState();document.getElementById('ctModal')?.remove();};
    document.getElementById('ctAppt').onchange=e=>{const x=a.find(v=>String(v.id)===String(e.target.value));draftForm.appointment_id=e.target.value||'';if(x){const d=String(x.appointment_date||'').slice(0,10);document.getElementById('ctExec').value=d;draftForm.execution_date=d;}};
    document.getElementById('ctAdd').onclick=addItem;
    document.getElementById('ctCreate').onclick=()=>createGuide(conv);
  }

  async function addItem(){
    captureDraftForm(); const ps=await procedures();
    const body=`<div class="ct-section" style="margin-top:0"><div class="ct-section-title">Selecionar procedimento</div><div class="ct-field"><label>Procedimento</label><select id="ctProc"><option value="">Selecione um procedimento</option>${ps.map(p=>`<option value="${esc(p.id)}">${esc(p.code)} — ${esc(p.description)} · ${money(p.default_amount)}</option>`).join('')}</select>${!ps.length?'<div class="ct-help">Nenhum procedimento ativo cadastrado para esta clínica.</div>':''}</div><div class="ct-actions" style="margin-top:16px"><button class="ct-btn" id="ctPCancel">Cancelar</button><button class="ct-btn ct-primary" id="ctPAdd" ${ps.length?'':'disabled'}>Adicionar procedimento</button></div></div>`;
    modal('Adicionar procedimento',body,'O valor padrão será trazido do catálogo da clínica.');
    document.getElementById('ctPCancel').onclick=()=>{document.getElementById('ctModal')?.remove();newGuide(false);};
    document.getElementById('ctPAdd').onclick=()=>{const p=ps.find(x=>String(x.id)===String(document.getElementById('ctProc').value));if(!p)return;draftItems.push({procedure_id:p.id,code:p.code,description:p.description,quantity:1,unit_amount:Number(p.default_amount||0)});document.getElementById('ctModal')?.remove();newGuide(false);};
  }

  function renderDraftItems(){
    const b=document.getElementById('ctItems'); const create=document.getElementById('ctCreate'); if(!b)return;
    b.innerHTML=draftItems.length?draftItems.map((x,i)=>`<div class="ct-proc-row"><div><div class="ct-proc-code">${esc(x.code)}</div><div class="ct-proc-desc">${esc(x.description)} · ${money(x.unit_amount)} · Qtd. ${esc(x.quantity||1)}</div></div><button type="button" class="ct-btn" data-remove="${i}">Remover</button></div>`).join(''):'<div class="ct-proc-empty">Nenhum procedimento adicionado.</div>';
    if(create)create.disabled=!draftItems.length;
    b.querySelectorAll('[data-remove]').forEach(x=>x.onclick=()=>{captureDraftForm();draftItems.splice(Number(x.dataset.remove),1);renderDraftItems();});
  }

  async function createGuide(conv){
    captureDraftForm(); const c=S(),p=P(); if(!c||!p||!C())return;
    if(!draftItems.length){alert('Adicione pelo menos um procedimento antes de criar a guia.');return;}
    const total=draftItems.reduce((sum,x)=>sum+(Number(x.quantity||1)*Number(x.unit_amount||0)),0);
    const payload={clinic_id:C(),patient_id:ID(p),convenio_id:conv?.convenio_id||null,appointment_id:draftForm.appointment_id||null,guide_number:draftForm.guide_number.trim()||null,execution_date:draftForm.execution_date||null,notes:draftForm.notes||null,total_amount:total,status:'draft',created_by:U()?.id||null};
    const {data,error}=await c.from('clinic_patient_tiss_guides').insert(payload).select('*').single();
    if(error){console.error('[Clinic TISS] guide:',error);alert('Não foi possível criar a guia.');return;}
    const itemRows=draftItems.map(x=>({guide_id:data.id,procedure_id:x.procedure_id,code:x.code,description:x.description,quantity:x.quantity,unit_amount:x.unit_amount,total_amount:Number(x.quantity||1)*Number(x.unit_amount||0)}));
    const {error:itemError}=await c.from('clinic_patient_tiss_items').insert(itemRows);
    if(itemError){console.error('[Clinic TISS] item:',itemError);await c.from('clinic_patient_tiss_guides').delete().eq('id',data.id).eq('clinic_id',C());alert('A guia não pôde ser concluída porque os procedimentos não foram salvos. Nenhuma guia incompleta foi mantida.');return;}
    resetDraftState(); document.getElementById('ctModal')?.remove(); await refreshAll();
  }

  async function openGuide(g){
    const its=await items(g.id); const total=its.reduce((s,x)=>s+(Number(x.quantity||1)*Number(x.unit_amount||0)),0);
    const body=`<div class="ct-section"><div class="ct-grid"><div class="ct-field"><label>Número da guia</label><div>${esc(g.guide_number||'—')}</div></div><div class="ct-field"><label>Status</label><div>${statusBadge(g.status)}</div></div><div class="ct-field"><label>Data de execução</label><div>${date(g.execution_date)}</div></div><div class="ct-field"><label>Total</label><div style="font-weight:800">${money(total)}</div></div></div></div><div class="ct-section"><div class="ct-section-title">Procedimentos</div>${its.length?its.map(x=>`<div class="ct-proc-row"><div><div class="ct-proc-code">${esc(x.code)}</div><div class="ct-proc-desc">${esc(x.description)} · Qtd. ${esc(x.quantity||1)}</div></div><strong>${money(x.total_amount||Number(x.quantity||1)*Number(x.unit_amount||0))}</strong></div>`).join(''):'<div class="ct-proc-empty">Nenhum procedimento.</div>'}</div><div class="ct-actions"><button class="ct-btn" id="ctPrint">Imprimir</button>${g.status==='draft'?'<button class="ct-btn ct-primary" id="ctCloseGuide">Liberar para faturamento</button>':''}</div>`;
    modal('Guia TISS',body,'Revise os dados antes de liberar a guia para faturamento.');
    document.getElementById('ctPrint').onclick=()=>printGuide(g,its,total);
    document.getElementById('ctCloseGuide')?.addEventListener('click',()=>closeGuide(g));
  }

  async function closeGuide(g){
    const c=S(); if(!c)return; const its=await items(g.id); const total=its.reduce((s,x)=>s+(Number(x.quantity||1)*Number(x.unit_amount||0)),0);
    const {error}=await c.from('clinic_patient_tiss_guides').update({status:'ready',total_amount:total,updated_at:new Date().toISOString()}).eq('id',g.id).eq('clinic_id',C());
    if(error){console.error('[Clinic TISS] close guide:',error);alert('Não foi possível liberar a guia para faturamento.');return;}
    document.getElementById('ctModal')?.remove(); await refreshAll();
  }

  function printGuide(g,its,total){
    const p=P(); const w=window.open('','_blank','width=900,height=700'); if(!w)return;
    w.document.write(`<html><head><title>Guia TISS ${esc(g.guide_number||'')}</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#182235}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f5f7}.total{text-align:right;font-size:18px;font-weight:700;margin-top:20px}</style></head><body><h1>Guia TISS</h1><p><strong>Paciente:</strong> ${esc(p?.name||'—')}</p><p><strong>Guia:</strong> ${esc(g.guide_number||'—')} &nbsp; <strong>Execução:</strong> ${date(g.execution_date)}</p><table><thead><tr><th>Código</th><th>Procedimento</th><th>Qtd.</th><th>Valor</th></tr></thead><tbody>${its.map(x=>`<tr><td>${esc(x.code)}</td><td>${esc(x.description)}</td><td>${esc(x.quantity||1)}</td><td>${money(x.total_amount||Number(x.quantity||1)*Number(x.unit_amount||0))}</td></tr>`).join('')}</tbody></table><div class="total">Total: ${money(total)}</div></body></html>`);
    w.document.close();w.focus();w.print();
  }

  function render(rows){
    const host=document.getElementById('clinicPatientTiss'); if(!host)return;
    host.innerHTML=`<div class="patient-section"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap"><div><h2>Guias TISS</h2><p class="section-subtitle">Guias de faturamento e comunicação com convênios deste paciente.</p></div><button class="btn btn-primary" id="ctNewGuide">+ Nova guia</button></div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:18px 0"><div class="patient-info-card"><div style="font-size:10px;text-transform:uppercase;color:var(--text-secondary);font-weight:800">Total</div><div style="font-size:20px;font-weight:800;margin-top:5px">${rows.length}</div></div><div class="patient-info-card"><div style="font-size:10px;text-transform:uppercase;color:var(--text-secondary);font-weight:800">Rascunhos</div><div style="font-size:20px;font-weight:800;margin-top:5px">${rows.filter(r=>r.status==='draft').length}</div></div><div class="patient-info-card"><div style="font-size:10px;text-transform:uppercase;color:var(--text-secondary);font-weight:800">Prontas para faturamento</div><div style="font-size:20px;font-weight:800;margin-top:5px">${rows.filter(r=>r.status==='ready').length}</div></div></div><div class="patient-info-card" style="padding:0;overflow:hidden"><div style="padding:14px 16px;border-bottom:1px solid var(--border);font-weight:800">Guias</div>${rows.length?rows.map(r=>`<div style="padding:15px 16px;border-bottom:1px solid var(--border)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div style="font-weight:800">${esc(r.guide_number||'Guia sem número')}</div><div style="font-size:11px;color:var(--text-secondary);margin-top:3px">${esc(r.guide_type||r.type||'consulta')} · criada em ${date(String(r.created_at||'').slice(0,10))}</div><div style="font-size:12px;margin-top:7px">${r.execution_date?'Execução: '+date(r.execution_date):'Data de execução não informada'}</div></div><div style="text-align:right">${statusBadge(r.status)}<div style="font-weight:800;margin-top:8px">${money(r.total_amount||r.total_value||0)}</div></div></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button type="button" class="btn ctOpenGuide" data-id="${esc(r.id)}">Abrir</button></div></div>`).join(''):'<div style="padding:30px;text-align:center"><div style="font-weight:800">Nenhuma guia TISS</div><p style="color:var(--text-secondary);font-size:12px">Crie uma guia quando houver um atendimento que será faturado pelo convênio.</p></div>'}</div></div>`;
    host.querySelector('#ctNewGuide').onclick=()=>newGuide(true);
    host.querySelectorAll('.ctOpenGuide').forEach(b=>b.onclick=()=>openGuide(rows.find(g=>g.id===b.dataset.id)));
  }

  async function refreshAll(){const rows=await guides();render(rows);}
  async function refresh(){const rows=await guides();render(rows);}

  function install(){
    window.__clinicGuiasTissInstalled=true;
    document.addEventListener('click',e=>{const b=e.target.closest?.('[data-new-tiss]');if(!b)return;e.preventDefault();newGuide(true);});
    window.renderClinicTiss=refresh;
  }
  install();
})();

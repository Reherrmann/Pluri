// Mentalita — prontuário eletrônico do paciente.
// Fonte oficial: Supabase. PLURI OS é apenas referência estrutural.
(function installMentalitaPatientProntuario() {
  const TEST_MODE = true;
  const getClient = () => window.PLURI_SUPABASE || null;
  const getPatient = () => window.state?.selectedPatient || (typeof state !== 'undefined' ? state.selectedPatient : null);
  const getClinicId = () => window.PLURI_CLINIC?.id || null;
  const getUser = () => window.PLURI_AUTH_SESSION?.user || null;
  const esc = (v) => typeof patientEscape === 'function' ? patientEscape(v) : String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
  const notify = (m) => typeof showToast === 'function' ? showToast(m) : console.log('[Mentalita]', m);
  const patientId = (p) => p?.id || p?.ID || p?._id || null;
  const patientName = (p) => p?.nome || p?.Nome || p?.name || 'Paciente';
  const formatDate = (v) => { if(!v) return '-'; const d=new Date(v); return Number.isNaN(d.getTime())?String(v):d.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}); };

  async function sha256(text){
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function audit(recordId, action, metadata={}){
    const client=getClient(), p=getPatient(), clinicId=getClinicId(), u=getUser(), pid=patientId(p);
    if(!client || !clinicId || !pid || !recordId) return;
    const {error}=await client.from('mentalita_patient_record_audit').insert({clinic_id:clinicId,patient_id:pid,record_id:recordId,actor_user_id:u?.id||null,action,occurred_at:new Date().toISOString(),metadata:{...metadata,source:'mentalita-web'}});
    if(error) console.warn('[Mentalita] auditoria:',error.message);
  }

  async function getStaffMap(records){
    const client=getClient();
    const ids=[...new Set(records.map(r=>r.professional_id).filter(Boolean))];
    if(!client || !ids.length) return {};
    const {data,error}=await client.from('mentalita_staff').select('id,name,role,email').in('id',ids);
    if(error){console.warn('[Mentalita] profissionais:',error.message);return {};}
    return Object.fromEntries((data||[]).map(s=>[s.id,s]));
  }

  function modalHtml({test=false,model=false}={}){
    const title = test ? 'Novo registro de teste' : 'Novo registro clínico';
    const subtitle = test ? 'Este registro será identificado como TESTE e poderá ser apagado durante a validação.' : 'Preencha o atendimento e finalize quando estiver pronto.';
    const defaultTitle = model ? 'Exemplo de evolução clínica' : '';
    const defaultText = model ? 'Registro modelo para demonstração da ferramenta. Este conteúdo é fictício e deve ser substituído pelo conteúdo clínico real em um atendimento.' : '';
    return `<div id="mentalitaProntuarioModal" style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;padding:16px"><div style="width:min(760px,100%);max-height:92vh;overflow:auto;background:var(--surface,#fff);border-radius:18px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.2)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-secondary);font-weight:800">Prontuário eletrônico</div><h2 style="margin:4px 0">${title}</h2><p style="margin:0;color:var(--text-secondary);font-size:13px">${subtitle}</p></div><button type="button" class="btn" id="mpClose">Fechar</button></div><form id="mpForm" style="margin-top:20px"><label style="display:block;font-size:12px;font-weight:700">Tipo<select id="mpType" required style="width:100%;margin:6px 0 14px;padding:11px;border:1px solid var(--border);border-radius:9px"><option value="evolucao">Evolução</option><option value="anamnese">Anamnese</option><option value="avaliacao">Avaliação</option><option value="plano_terapeutico">Plano terapêutico</option><option value="observacao">Observação</option></select></label><label style="display:block;font-size:12px;font-weight:700">Título<input id="mpTitle" required maxlength="180" value="${esc(defaultTitle)}" style="width:100%;margin:6px 0 14px;padding:11px;border:1px solid var(--border);border-radius:9px"></label><label style="display:block;font-size:12px;font-weight:700">Registro clínico<textarea id="mpContent" required rows="11" style="width:100%;margin:6px 0 14px;padding:11px;border:1px solid var(--border);border-radius:9px;resize:vertical">${esc(defaultText)}</textarea></label><div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="mpDraft">Salvar rascunho</button><button type="submit" class="btn btn-primary">${test ? 'Finalizar teste' : 'Finalizar registro'}</button></div></form></div></div>`;
  }

  async function saveRecord(status,{test=false,model=false}={}){
    const client=getClient(), p=getPatient(), clinicId=getClinicId(), u=getUser(), id=patientId(p);
    if(!client || !p || !clinicId || !id){notify('Sessão ou paciente não disponível.');return;}
    const title=document.getElementById('mpTitle')?.value.trim(), text=document.getElementById('mpContent')?.value.trim(), type=document.getElementById('mpType')?.value||'evolucao';
    if(!title||!text){notify('Preencha título e registro clínico.');return;}
    const now=new Date().toISOString();
    const content={title,text};
    if(test) content.is_test=true;
    if(model) content.is_demo_model=true;
    const record={clinic_id:clinicId,patient_id:id,professional_id:u?.id||null,created_by:u?.id||null,record_type:type,attended_at:now,created_at:now,status,content,title,finalized_at:status==='finalized'?now:null,finalized_by:status==='finalized'?(u?.id||null):null};
    if(status==='finalized') record.content_hash=await sha256(JSON.stringify(record));
    const {data,error}=await client.from('mentalita_patient_records').insert(record).select('*').single();
    if(error){console.error(error);notify('Erro ao salvar: '+error.message);return;}
    await audit(data.id,status==='finalized'?'record_finalized':'record_created',{record_type:type,title,status,is_test:test,is_demo_model:model});
    document.getElementById('mentalitaProntuarioModal')?.remove();
    notify(test?'Registro de teste criado.':status==='finalized'?'Registro finalizado com sucesso.':'Rascunho salvo.');
    await renderTimeline();
  }

  async function loadRecords(){
    const client=getClient(),p=getPatient(),clinicId=getClinicId(),id=patientId(p);
    if(!client||!clinicId||!id)return[];
    const {data,error}=await client.from('mentalita_patient_records').select('*').eq('clinic_id',clinicId).eq('patient_id',id).order('created_at',{ascending:false});
    if(error){console.error(error);notify('Não foi possível carregar o prontuário.');return[];}
    return data||[];
  }

  function isTestRecord(r){ return r?.content?.is_test===true || r?.content?.is_demo_model===true; }

  async function deleteTestRecord(id){
    if(!TEST_MODE){notify('Exclusão de registros está desativada.');return;}
    if(!confirm('Apagar este registro de TESTE? Registros clínicos reais não podem ser apagados.'))return;
    const client=getClient();
    const {data:record,error:loadError}=await client.from('mentalita_patient_records').select('id,content').eq('id',id).single();
    if(loadError || !isTestRecord(record)){notify('Apenas registros identificados como teste podem ser apagados.');return;}
    const {error}=await client.from('mentalita_patient_records').delete().eq('id',id);
    if(error){notify('Não foi possível apagar: '+error.message);return;}
    notify('Registro de teste apagado.');await renderTimeline();
  }

  function pdfPage(title,body){
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:A4;margin:14mm 15mm}*{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;color:#18232d;margin:0;line-height:1.5;font-size:10.5pt}.head{padding-bottom:12px;margin-bottom:18px;border-bottom:1.5px solid #dce5eb}.brand{font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:800;color:#183b56}.title{font-size:23px;font-weight:800;margin:4px 0}.sub{color:#647582;font-size:10px}.patient{background:#f5f8fa;border:1px solid #dce5eb;border-radius:9px;padding:10px 12px;margin:14px 0}.section{margin:18px 0}.section-title{font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:800;color:#183b56;border-bottom:1px solid #dce5eb;padding-bottom:5px;margin-bottom:10px}.entry{border-left:2px solid #183b56;padding:0 0 13px 11px;margin:0 0 15px;break-inside:avoid}.entry-head{display:flex;justify-content:space-between;gap:12px;font-weight:800}.entry-type{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#183b56;margin-top:2px}.entry-date{font-size:9px;color:#647582}.entry-prof{font-size:9.5px;color:#52636f;margin:3px 0 7px}.content{white-space:pre-wrap}.integrity{margin-top:7px;padding:6px 8px;background:#f7f9fa;border-radius:6px;font-size:7.5px;color:#71818d;word-break:break-all}.footer{margin-top:20px;padding-top:8px;border-top:1px solid #dce5eb;font-size:8px;color:#71818d}.no-print{margin-top:18px;padding:8px 12px}@media print{.no-print{display:none}}</style></head><body>${body}<button class="no-print" onclick="window.print()">Salvar em PDF</button></body></html>`;
  }

  async function exportRecord(record){
    const p=getPatient(),staff=await getStaffMap([record]),s=staff[record.professional_id],name=s?.name||'Profissional não identificado';
    const body=`<div class="head"><div class="brand">Mentalita · Prontuário eletrônico</div><div class="title">Registro clínico</div><div class="sub">Documento individual do atendimento</div></div><div class="patient"><b>Paciente</b><br>${esc(patientName(p))}</div><div class="section"><div class="section-title">${esc(record.record_type||'Registro')}</div><div class="entry"><div class="entry-head"><span>${esc(record.content?.title||record.title||'Registro clínico')}</span><span class="entry-date">${esc(formatDate(record.attended_at||record.created_at))}</span></div><div class="entry-prof">${esc(name)}${s?.role?' · '+esc(s.role):''}</div><div class="content">${esc(record.content?.text||'')}</div><div class="integrity">Status: ${esc(record.status)} · Finalizado: ${esc(formatDate(record.finalized_at))}<br>Hash: ${esc(record.content_hash||record.integrity_hash||'-')}</div></div></div><div class="footer">Gerado pela Mentalita. O registro persistido no sistema é a fonte oficial; este PDF é uma exportação.</div>`;
    const w=window.open('','_blank');if(!w){notify('Permita pop-ups para gerar o PDF.');return;}w.document.write(pdfPage('Registro clínico — '+patientName(p),body));w.document.close();await audit(record.id,'record_pdf_exported',{scope:'individual'});setTimeout(()=>w.print(),300);
  }

  async function exportFull(records){
    const p=getPatient(),staff=await getStaffMap(records),ordered=[...records].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
    const entries=ordered.map(r=>{const s=staff[r.professional_id];return `<div class="entry"><div class="entry-head"><span>${esc(r.content?.title||r.title||'Registro clínico')}</span><span class="entry-date">${esc(formatDate(r.attended_at||r.created_at))}</span></div><div class="entry-type">${esc(r.record_type||'Registro')}</div><div class="entry-prof">${esc(s?.name||'Profissional não identificado')}${s?.role?' · '+esc(s.role):''}</div><div class="content">${esc(r.content?.text||'')}</div><div class="integrity">Status: ${esc(r.status)} · Finalizado: ${esc(formatDate(r.finalized_at))}<br>Hash: ${esc(r.content_hash||r.integrity_hash||'-')}</div></div>`;}).join('');
    const body=`<div class="head"><div class="brand">Mentalita · Prontuário eletrônico</div><div class="title">Prontuário completo</div><div class="sub">Histórico completo do paciente</div></div><div class="patient"><b>Paciente</b><br>${esc(patientName(p))}<br><span class="sub">${ordered.length} registro(s) · ${esc(ordered.length?formatDate(ordered[0].created_at):'-')} a ${esc(ordered.length?formatDate(ordered[ordered.length-1].created_at):'-')}</span></div><div class="section"><div class="section-title">Histórico clínico</div>${entries}</div><div class="footer">Gerado pela Mentalita. O conjunto de registros persistidos no sistema é a fonte oficial; este documento é uma exportação.</div>`;
    const w=window.open('','_blank');if(!w){notify('Permita pop-ups para gerar o PDF.');return;}w.document.write(pdfPage('Prontuário completo — '+patientName(p),body));w.document.close();for(const r of ordered) await audit(r.id,'record_pdf_exported',{scope:'complete'});setTimeout(()=>w.print(),300);
  }

  function testBadge(){
    return TEST_MODE ? `<span style="display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:800;color:#7a5a00;background:#fff5d6;border:1px solid #f0d78a;border-radius:999px;padding:5px 8px">🧪 Modo de teste</span>` : '';
  }

  async function renderTimeline(){
    const box=document.getElementById('mentalitaPatientProntuarioTimeline');if(!box)return;
    const records=await loadRecords();
    if(!records.length){box.innerHTML='<div style="padding:24px;text-align:center;border:2px dashed var(--border);border-radius:12px"><h3 style="margin:0 0 6px">Nenhum registro clínico</h3><p style="color:var(--text-secondary);margin:0">Os atendimentos e evoluções aparecerão aqui.</p></div>';return;}
    const staff=await getStaffMap(records);await Promise.all(records.map(r=>audit(r.id,'record_viewed',{surface:'timeline'})));
    box.innerHTML=records.map(r=>{const finalized=r.status==='finalized',s=staff[r.professional_id],test=isTestRecord(r);return `<div style="border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:10px;background:var(--surface,#fff)"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><div style="font-weight:800">${esc(r.content?.title||r.title||'Registro clínico')}</div><div style="font-size:11px;color:var(--text-secondary);margin-top:3px">${esc(r.record_type||'registro')} · ${esc(formatDate(r.attended_at||r.created_at))}</div><div style="font-size:11px;color:var(--text-secondary);margin-top:3px">${esc(s?.name||'Profissional não identificado')}</div></div><span style="display:inline-flex;align-items:center;align-self:flex-start;gap:5px;font-size:10px;font-weight:800;padding:6px 9px;border-radius:999px;background:${finalized?'var(--hover-bg)':'#fff5d6'};color:${finalized?'var(--text)':'#7a5a00'}">${finalized?'🔒 Finalizado':'Rascunho'}</span></div>${test?'<div style="margin-top:8px;font-size:9.5px;font-weight:800;color:#7a5a00">REGISTRO DE TESTE</div>':''}<div style="margin-top:10px;white-space:pre-wrap;font-size:13px;line-height:1.55">${esc(r.content?.text||'')}</div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;flex-wrap:wrap"><button type="button" class="btn mpPdf" data-id="${esc(r.id)}">PDF do registro</button>${test?'<button type="button" class="btn mpDelete" data-id="'+esc(r.id)+'">Apagar teste</button>':''}</div>${finalized?'<div style="margin-top:7px;font-size:9px;color:var(--text-secondary);word-break:break-all">Integridade: '+esc(r.content_hash||r.integrity_hash||'-')+'</div>':''}</div>`;}).join('');
    box.querySelectorAll('.mpPdf').forEach(b=>b.addEventListener('click',()=>{const r=records.find(x=>String(x.id)===String(b.dataset.id));if(r)exportRecord(r);}));
    box.querySelectorAll('.mpDelete').forEach(b=>b.addEventListener('click',()=>deleteTestRecord(b.dataset.id)));
    if(typeof refreshIcons==='function')refreshIcons();
    const full=document.getElementById('mentalitaExportFullProntuarioBtn');if(full)full.onclick=()=>exportFull(records);
  }

  function sectionHtml(){
    return `<div class="patient-section"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap"><div><div style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-secondary);font-weight:800">Histórico clínico</div><h2 style="margin:4px 0">Prontuário eletrônico</h2><p style="margin:0;color:var(--text-secondary);font-size:13px">Todos os registros deste paciente, em ordem cronológica.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${testBadge()}<button class="btn" type="button" id="mentalitaExportFullProntuarioBtn">Exportar prontuário completo</button><button class="btn" type="button" id="mentalitaNewProntuarioTestBtn">+ Registro de teste</button><button class="btn btn-primary" type="button" id="mentalitaNewProntuarioEntryBtn">+ Novo registro</button></div></div><div class="patient-info-card" style="padding:12px 16px;margin-top:14px"><div style="display:flex;align-items:flex-start;gap:9px"><span style="font-size:16px">🔒</span><div><b style="color:var(--primary);font-size:12px">Registro clínico protegido</b><div style="font-size:10.5px;color:var(--text-secondary);margin-top:2px;line-height:1.45">Em produção, registros finalizados serão preservados. Correções serão novos lançamentos vinculados ao original.</div></div></div></div><div class="patient-info-card" style="padding:14px 16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:12px"><div><h3 style="margin:0 0 2px">Registros clínicos</h3><span style="font-size:11px;color:var(--text-secondary)">Histórico do paciente</span></div><span style="font-size:10px;font-weight:800;padding:5px 8px;border-radius:999px;background:var(--hover-bg)">Ordem cronológica</span></div><div id="mentalitaPatientProntuarioTimeline">Carregando...</div></div><div class="patient-info-card" style="padding:11px 16px"><div style="display:flex;align-items:flex-start;gap:8px"><span style="font-size:14px">✓</span><div><b style="font-size:11.5px">Integridade e rastreabilidade</b><div style="font-size:10.5px;color:var(--text-secondary);line-height:1.4;margin-top:2px">Finalizações recebem hash de integridade e eventos relevantes entram na auditoria.</div></div></div></div></div>`;
  }

  async function ensureDemoModel(){
    if(!TEST_MODE)return;
    const records=await loadRecords();if(records.some(r=>r.content?.is_demo_model===true))return;
    const client=getClient(),p=getPatient(),clinicId=getClinicId(),u=getUser(),id=patientId(p);if(!client||!p||!clinicId||!id)return;
    const now=new Date().toISOString();
    const content={title:'Registro modelo — teste da Mentalita',text:'Este é um registro clínico fictício criado automaticamente para demonstração. O profissional pode usar este modelo para avaliar a estrutura do prontuário, testar a linha do tempo, exportar o PDF e experimentar o fluxo de finalização. Não contém informação clínica real.',is_test:true,is_demo_model:true};
    const record={clinic_id:clinicId,patient_id:id,professional_id:u?.id||null,created_by:u?.id||null,record_type:'evolucao',attended_at:now,created_at:now,status:'finalized',content,title:content.title,finalized_at:now,finalized_by:u?.id||null};
    record.content_hash=await sha256(JSON.stringify(record));
    const {data,error}=await client.from('mentalita_patient_records').insert(record).select('*').single();
    if(error){console.warn('[Mentalita] modelo de teste:',error.message);return;}
    await audit(data.id,'record_demo_created',{is_test:true,is_demo_model:true});
  }

  function openNew({test=false,model=false}={}){document.getElementById('mentalitaProntuarioModal')?.remove();document.body.insertAdjacentHTML('beforeend',modalHtml({test,model}));document.getElementById('mpClose').addEventListener('click',()=>document.getElementById('mentalitaProntuarioModal')?.remove());document.getElementById('mpDraft').addEventListener('click',()=>saveRecord('draft',{test,model}));document.getElementById('mpForm').addEventListener('submit',e=>{e.preventDefault();saveRecord('finalized',{test,model});});}

  function bindSection(){
    const newBtn=document.getElementById('mentalitaNewProntuarioEntryBtn'),testBtn=document.getElementById('mentalitaNewProntuarioTestBtn');
    if(newBtn&&!newBtn.dataset.bound){newBtn.dataset.bound='1';newBtn.addEventListener('click',()=>openNew());}
    if(testBtn&&!testBtn.dataset.bound){testBtn.dataset.bound='1';testBtn.addEventListener('click',()=>openNew({test:true}));}
    ensureDemoModel().then(()=>renderTimeline());if(typeof refreshIcons==='function')refreshIcons();
  }

  function install(){if(window.__mentalitaPatientProntuarioInstalled)return;if(typeof window.renderPatientSectionContent!=='function'){setTimeout(install,100);return;}const original=window.renderPatientSectionContent;window.renderPatientSectionContent=function(section){const p=getPatient();if(section==='prontuario'&&p){const html=sectionHtml();setTimeout(bindSection,0);return html;}return original.apply(this,arguments);};window.renderPatientProntuario=sectionHtml;window.__mentalitaPatientProntuarioInstalled=true;}
  install();
})();
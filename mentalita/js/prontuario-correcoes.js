// Mentalita — correções de registros finalizados.
// Um registro finalizado nunca é editado: a correção cria um novo lançamento vinculado ao original.
(function installMentalitaProntuarioCorrecoes(){
  if(window.__mentalitaProntuarioCorrecoes) return;
  const client=()=>window.PLURI_SUPABASE||null;
  const patient=()=>window.state?.selectedPatient||(typeof state!=='undefined'?state.selectedPatient:null);
  const clinic=()=>window.PLURI_CLINIC?.id||null;
  const user=()=>window.PLURI_AUTH_SESSION?.user||null;
  const pid=p=>p?.id||p?.ID||p?._id||null;
  const esc=v=>typeof patientEscape==='function'?patientEscape(v):String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
  const notify=m=>typeof showToast==='function'?showToast(m):console.log('[Mentalita]',m);
  async function hash(text){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(d)).map(x=>x.toString(16).padStart(2,'0')).join('');}
  async function audit(recordId,action,metadata={}){const c=client(),p=patient(),u=user();if(!c||!clinic()||!pid(p)||!recordId)return;await c.from('mentalita_patient_record_audit').insert({clinic_id:clinic(),patient_id:pid(p),record_id:recordId,actor_user_id:u?.id||null,action,occurred_at:new Date().toISOString(),metadata:{...metadata,source:'mentalita-web'}});}
  async function getRecord(id){const c=client();if(!c)return null;const {data,error}=await c.from('mentalita_patient_records').select('*').eq('id',id).single();if(error)return null;return data;}
  function modal(record){
    document.getElementById('mentalitaCorrectionModal')?.remove();
    document.body.insertAdjacentHTML('beforeend',`<div id="mentalitaCorrectionModal" style="position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;padding:16px"><div style="width:min(700px,100%);max-height:92vh;overflow:auto;background:var(--surface,#fff);border-radius:18px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.2)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-secondary);font-weight:800">Correção de prontuário</div><h2 style="margin:4px 0">Novo lançamento de correção</h2><p style="margin:0;color:var(--text-secondary);font-size:13px">O registro original permanecerá intacto. Esta correção será vinculada ao registro selecionado.</p></div><button type="button" class="btn" id="mpCorrectionClose">Fechar</button></div><div style="margin-top:16px;padding:11px 13px;border:1px solid var(--border);border-radius:10px;background:var(--hover-bg);font-size:12px"><b>Registro original:</b> ${esc(record.title||record.content?.title||'Registro clínico')}<br><span style="color:var(--text-secondary)">Data: ${new Date(record.attended_at||record.created_at).toLocaleDateString('pt-BR')}</span></div><form id="mpCorrectionForm" style="margin-top:18px"><label style="display:block;font-size:12px;font-weight:700">Motivo / título<input id="mpCorrectionTitle" required maxlength="180" value="Correção — ${esc(record.title||record.content?.title||'Registro clínico')}" style="width:100%;margin:6px 0 14px;padding:11px;border:1px solid var(--border);border-radius:9px"></label><label style="display:block;font-size:12px;font-weight:700">Texto da correção<textarea id="mpCorrectionText" required rows="9" placeholder="Informe o que deve ser corrigido e qual é a informação correta..." style="width:100%;margin:6px 0 14px;padding:11px;border:1px solid var(--border);border-radius:9px;resize:vertical"></textarea></label><div style="display:flex;justify-content:flex-end;gap:8px"><button type="submit" class="btn btn-primary">Registrar correção</button></div></form></div></div>`);
    document.getElementById('mpCorrectionClose').onclick=()=>document.getElementById('mentalitaCorrectionModal')?.remove();
    document.getElementById('mpCorrectionForm').onsubmit=e=>{e.preventDefault();createCorrection(record);};
  }
  async function createCorrection(original){
    const c=client(),p=patient(),u=user();if(!c||!clinic()||!pid(p)){notify('Sessão ou paciente não disponível.');return;}
    if(original.status!=='finalized'){notify('Somente registros finalizados podem receber correção.');return;}
    const title=document.getElementById('mpCorrectionTitle')?.value.trim(),text=document.getElementById('mpCorrectionText')?.value.trim();if(!title||!text){notify('Preencha o motivo e o texto da correção.');return;}
    const now=new Date().toISOString();
    const content={title,text,is_correction:true,correction_of_id:original.id};
    const record={clinic_id:clinic(),patient_id:pid(p),professional_id:u?.id||null,created_by:u?.id||null,record_type:'correcao',attended_at:now,created_at:now,status:'finalized',content,title,finalized_at:now,finalized_by:u?.id||null,correction_of_id:original.id,previous_record_id:original.id};
    record.content_hash=await hash(JSON.stringify(record));
    const {data,error}=await c.from('mentalita_patient_records').insert(record).select('*').single();
    if(error){console.error(error);notify('Não foi possível registrar a correção: '+error.message);return;}
    await audit(original.id,'record_corrected',{correction_record_id:data.id});
    await audit(data.id,'record_created',{record_type:'correcao',correction_of_id:original.id});
    document.getElementById('mentalitaCorrectionModal')?.remove();
    notify('Correção registrada como novo lançamento.');
    setTimeout(()=>{const t=document.getElementById('mentalitaPatientProntuarioTimeline');if(t){const obs=new MutationObserver(()=>{obs.disconnect();});obs.observe(t,{childList:true,subtree:true});}},0);
    if(typeof window.renderPatientProfile==='function') window.renderPatientProfile();
  }
  function addButtons(){
    const root=document.getElementById('mentalitaPatientProntuarioTimeline');if(!root)return;
    root.querySelectorAll('.mpPdf').forEach(pdf=>{
      const actions=pdf.parentElement;if(!actions||actions.querySelector('.mpCorrection'))return;
      const b=document.createElement('button');b.type='button';b.className='btn mpCorrection';b.dataset.id=pdf.dataset.id;b.textContent='Registrar correção';actions.appendChild(b);
    });
  }
  function install(){
    window.__mentalitaProntuarioCorrecoes=true;
    const observer=new MutationObserver(addButtons);const start=()=>{const root=document.getElementById('mentalitaPatientProntuarioTimeline');if(root)observer.observe(root,{childList:true,subtree:true});addButtons();};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
    document.addEventListener('click',async e=>{const b=e.target.closest?.('.mpCorrection');if(!b)return;e.preventDefault();e.stopImmediatePropagation();const r=await getRecord(b.dataset.id);if(r)modal(r);},true);
  }
  install();
})();

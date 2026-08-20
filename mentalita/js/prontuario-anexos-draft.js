// Mentalita — anexos clínicos no fluxo de criação do registro.
// Os arquivos ficam em Storage privado e são vinculados ao registro após o salvamento.
(function installMentalitaProntuarioAnexosDraft(){
  if(window.__mentalitaProntuarioAnexosDraft)return;
  const client=()=>window.PLURI_SUPABASE||null;
  const patient=()=>window.state?.selectedPatient||(typeof state!=='undefined'?state.selectedPatient:null);
  const clinic=()=>window.PLURI_CLINIC?.id||null;
  const user=()=>window.PLURI_AUTH_SESSION?.user||null;
  const pid=p=>p?.id||p?.ID||p?._id||null;
  const notify=m=>typeof showToast==='function'?showToast(m):console.log('[Mentalita]',m);
  const esc=v=>typeof patientEscape==='function'?patientEscape(v):String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const MAX=10*1024*1024, TYPES=['application/pdf','image/jpeg','image/png'];
  const state={files:[],startedAt:null,busy:false};
  async function hashFile(file){const b=await file.arrayBuffer(),d=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(d)).map(x=>x.toString(16).padStart(2,'0')).join('');}
  function safeName(name){return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(0,140);}
  function inject(){
    const modal=document.getElementById('mentalitaProntuarioModal'),form=document.getElementById('mpForm');
    if(!modal||!form||document.getElementById('mpAttachmentsDraft'))return;
    const wrap=document.createElement('div');wrap.id='mpAttachmentsDraft';wrap.style.cssText='margin:4px 0 16px';
    wrap.innerHTML=`<div style="font-size:12px;font-weight:700;margin-bottom:7px">Anexos clínicos <span style="font-weight:500;color:var(--text-secondary)">(opcional)</span></div><label for="mpAttachmentInput" style="display:flex;align-items:center;justify-content:center;min-height:78px;border:1.5px dashed var(--border);border-radius:12px;background:var(--hover-bg);cursor:pointer;padding:12px;text-align:center"><div><div style="font-size:13px;font-weight:750">📎 Adicionar exames ou documentos</div><div style="font-size:10.5px;color:var(--text-secondary);margin-top:4px">PDF, JPG ou PNG · até 10 MB por arquivo</div></div></label><input id="mpAttachmentInput" type="file" accept="application/pdf,image/jpeg,image/png" multiple hidden><div id="mpAttachmentList" style="margin-top:8px"></div>`;
    const buttons=form.querySelector('div[style*="justify-content:flex-end"]');
    form.insertBefore(wrap,buttons||null);
    wrap.querySelector('#mpAttachmentInput').addEventListener('change',e=>{addFiles(Array.from(e.target.files||[]));e.target.value='';});
    render();
  }
  function addFiles(files){
    for(const file of files){
      if(!TYPES.includes(file.type)){notify('Formato não permitido: '+file.name);continue;}
      if(file.size>MAX){notify('Arquivo acima de 10 MB: '+file.name);continue;}
      if(state.files.some(x=>x.name===file.name&&x.size===file.size)){continue;}
      state.files.push(file);
    }
    render();
  }
  function render(){const box=document.getElementById('mpAttachmentList');if(!box)return;box.innerHTML=state.files.map((f,i)=>`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:1px solid var(--border);border-radius:9px;margin-top:6px;background:var(--surface,#fff)"><div style="min-width:0"><div style="font-size:11.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</div><div style="font-size:10px;color:var(--text-secondary)">${(f.size/1024/1024).toFixed(2)} MB</div></div><button type="button" class="btn mpRemoveAttachment" data-i="${i}" style="padding:5px 8px">Remover</button></div>`).join('');box.querySelectorAll('.mpRemoveAttachment').forEach(b=>b.addEventListener('click',()=>{state.files.splice(Number(b.dataset.i),1);render();}));}
  async function findCreatedRecord(startedAt){
    const c=client(),p=patient(),cl=clinic(),id=pid(p);if(!c||!id||!cl)return null;
    const {data,error}=await c.from('mentalita_patient_records').select('id,created_at').eq('clinic_id',cl).eq('patient_id',id).order('created_at',{ascending:false}).limit(5);
    if(error)return null;const start=new Date(startedAt).getTime();return (data||[]).find(r=>new Date(r.created_at).getTime()>=start-3000)||null;
  }
  async function audit(recordId,action,metadata){const c=client(),p=patient(),u=user();if(!c||!clinic()||!pid(p)||!recordId)return;await c.from('mentalita_patient_record_audit').insert({clinic_id:clinic(),patient_id:pid(p),record_id:recordId,actor_user_id:u?.id||null,action,occurred_at:new Date().toISOString(),metadata:{...metadata,source:'mentalita-web'}});}
  async function uploadPending(){
    if(state.busy||!state.files.length||!state.startedAt)return;
    state.busy=true;const c=client(),p=patient(),cl=clinic(),u=user(),id=pid(p);if(!c||!p||!cl||!id){state.busy=false;return;}
    let record=null;for(let i=0;i<8&&!record;i++){record=await findCreatedRecord(state.startedAt);if(!record)await new Promise(r=>setTimeout(r,500));}
    if(!record){notify('O registro foi salvo, mas não consegui localizar o lançamento para vincular os anexos.');state.busy=false;return;}
    for(const file of state.files){
      try{
        const hash=await hashFile(file),path=`${cl}/${id}/${record.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
        const {error:upError}=await c.storage.from('mentalita-clinical-attachments').upload(path,file,{contentType:file.type,upsert:false});
        if(upError){console.error(upError);notify('Não foi possível anexar '+file.name+': '+upError.message);continue;}
        const {data:meta,error:dbError}=await c.from('mentalita_patient_record_attachments').insert({clinic_id:cl,patient_id:id,record_id:record.id,uploaded_by:u?.id||null,storage_path:path,file_name:file.name,mime_type:file.type,file_size:file.size,file_hash:hash}).select('id').single();
        if(dbError){console.error(dbError);await c.storage.from('mentalita-clinical-attachments').remove([path]);notify('Arquivo enviado, mas não foi possível registrar o anexo.');continue;}
        await audit(record.id,'attachment_created',{attachment_id:meta?.id,file_name:file.name,mime_type:file.type,size_bytes:file.size,file_hash:hash});
      }catch(err){console.error(err);notify('Erro ao anexar '+file.name);}
    }
    state.files=[];state.startedAt=null;state.busy=false;notify('Anexos vinculados ao registro.');
  }
  function captureSave(){
    if(!document.getElementById('mentalitaProntuarioModal')||!state.files.length)return;
    state.startedAt=new Date().toISOString();
    setTimeout(uploadPending,700);
  }
  function install(){
    window.__mentalitaProntuarioAnexosDraft=true;
    const observer=new MutationObserver(()=>{if(document.getElementById('mentalitaProntuarioModal'))inject();});observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',e=>{if(e.target.closest?.('#mpDraft'))captureSave();},true);
    document.addEventListener('submit',e=>{if(e.target?.id==='mpForm')captureSave();},true);
    window.addEventListener('beforeunload',()=>{state.files=[];});
  }
  install();
})();

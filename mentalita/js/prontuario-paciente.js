// Mentalita — prontuário eletrônico do paciente.
// Fonte oficial: Supabase. O PLURI OS serve apenas como referência estrutural.
(function installMentalitaPatientProntuario(){
  function escape(value){
    if(typeof patientEscape==='function') return patientEscape(value);
    return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function getClient(){ return window.PLURI_SUPABASE || window.supabaseClient || null; }
  function getPatient(){ return window.state?.selectedPatient || (typeof state!=='undefined' ? state.selectedPatient : null); }
  function getClinicId(){ return window.PLURI_CLINIC?.id || null; }
  function getUser(){ return window.PLURI_AUTH_SESSION?.user || null; }

  function notify(message){ if(typeof showToast==='function') showToast(message); else console.log('[Mentalita] '+message); }

  function formatDate(value){
    if(!value) return '-';
    const d=new Date(value);
    if(Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
  }

  function patientId(patient){ return patient?.id || patient?.ID || patient?._id || null; }
  function patientName(patient){ return patient?.nome || patient?.Nome || patient?.name || 'Paciente'; }

  function buildEntryForm(){
    return `<div id="mentalitaProntuarioModal" style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px;">
      <div style="width:min(760px,100%);max-height:92vh;overflow:auto;background:var(--surface,#fff);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.2);padding:20px;">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:18px;">
          <div><h2 style="margin:0 0 4px;">Novo registro clínico</h2><p style="margin:0;color:var(--text-secondary);font-size:13px;">O rascunho pode ser salvo e o registro finalizado ficará protegido contra alteração.</p></div>
          <button type="button" id="mentalitaProntuarioClose" class="btn">Fechar</button>
        </div>
        <form id="mentalitaProntuarioForm">
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
            <label style="display:block;grid-column:1/-1;"><span style="font-size:12px;font-weight:700;">Tipo de registro</span><select id="mpTipo" required style="width:100%;margin-top:6px;padding:10px;border:1px solid var(--border);border-radius:9px;"><option value="evolucao">Evolução</option><option value="anamnese">Anamnese</option><option value="avaliacao">Avaliação</option><option value="plano_terapeutico">Plano terapêutico</option><option value="observacao">Observação</option></select></label>
            <label style="display:block;grid-column:1/-1;"><span style="font-size:12px;font-weight:700;">Título</span><input id="mpTitulo" required maxlength="180" placeholder="Ex.: Evolução da sessão" style="width:100%;margin-top:6px;padding:10px;border:1px solid var(--border);border-radius:9px;"></label>
            <label style="display:block;grid-column:1/-1;"><span style="font-size:12px;font-weight:700;">Registro clínico</span><textarea id="mpConteudo" required rows="10" placeholder="Descreva o atendimento, evolução, observações e condutas..." style="width:100%;margin-top:6px;padding:10px;border:1px solid var(--border);border-radius:9px;resize:vertical;"></textarea></label>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;flex-wrap:wrap;">
            <button type="button" class="btn" id="mentalitaProntuarioDraftBtn">Salvar rascunho</button>
            <button type="submit" class="btn btn-primary">Finalizar registro</button>
          </div>
        </form>
      </div>
    </div>`;
  }

  async function sha256(text){
    const bytes=new TextEncoder().encode(text);
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function saveRecord(status){
    const client=getClient(), patient=getPatient(), clinicId=getClinicId(), user=getUser();
    if(!client || !patient || !clinicId){ notify('Sessão ou paciente não disponível.'); return null; }
    const pid=patientId(patient);
    if(!pid){ notify('Este paciente não possui ID compatível com o prontuário.'); return null; }
    const titulo=document.getElementById('mpTitulo')?.value?.trim();
    const conteudo=document.getElementById('mpConteudo')?.value?.trim();
    const tipo=document.getElementById('mpTipo')?.value || 'evolucao';
    if(!titulo || !conteudo){ notify('Preencha título e registro clínico.'); return null; }
    const payload={patient_id:pid,clinic_id:clinicId,professional_id:user?.id||null,record_type:tipo,title:titulo,content:{text:conteudo},status,finalized_at:status==='finalized'?new Date().toISOString():null};
    if(status==='finalized') payload.integrity_hash=await sha256(JSON.stringify(payload));
    const {data,error}=await client.from('mentalita_patient_records').insert(payload).select('*').single();
    if(error){ console.error(error); notify('Não foi possível salvar o prontuário.'); return null; }
    notify(status==='finalized'?'Registro finalizado com sucesso.':'Rascunho salvo.');
    document.getElementById('mentalitaProntuarioModal')?.remove();
    await renderTimeline(patient);
    return data;
  }

  async function loadRecords(patient){
    const client=getClient(), clinicId=getClinicId(), pid=patientId(patient);
    if(!client || !clinicId || !pid) return [];
    const {data,error}=await client.from('mentalita_patient_records').select('*').eq('clinic_id',clinicId).eq('patient_id',pid).order('created_at',{ascending:false});
    if(error){ console.error(error); notify('Não foi possível carregar o prontuário.'); return []; }
    return data||[];
  }

  function pdfText(record,patient){
    const lines=[
      'MENTALITA — PRONTUÁRIO ELETRÔNICO',
      'Paciente: '+patientName(patient),
      'Tipo: '+(record.record_type||'-'),
      'Título: '+(record.title||'-'),
      'Data: '+formatDate(record.created_at),
      'Status: '+(record.status||'-'),
      'Profissional: '+(record.professional_id||'-'),
      '',
      String(record.content?.text||''),
      '',
      'Registro finalizado em: '+formatDate(record.finalized_at),
      'Hash de integridade: '+(record.integrity_hash||'-')
    ];
    return lines.join('\n');
  }

  function printRecord(record,patient){
    const text=pdfText(record,patient);
    const w=window.open('','_blank','noopener,noreferrer');
    if(!w){ notify('Permita pop-ups para gerar o PDF.'); return; }
    const html=escape(text).replace(/\n/g,'<br>');
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Prontuário — ${escape(patientName(patient))}</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#111;line-height:1.6}h1{font-size:20px;border-bottom:2px solid #ddd;padding-bottom:10px}pre{white-space:pre-wrap;font:14px/1.6 Arial} @media print{body{margin:22mm} .no-print{display:none}}</style></head><body><h1>MENTALITA — PRONTUÁRIO ELETRÔNICO</h1><pre>${html}</pre><button class="no-print" onclick="window.print()">Salvar em PDF</button><script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);
    w.document.close();
  }

  function renderTimelineItem(record,patient){
    const finalized=record.status==='finalized';
    return `<div style="border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;">
        <div><div style="font-weight:700;">${escape(record.title||'Registro clínico')}</div><div style="font-size:11.5px;color:var(--text-secondary);margin-top:3px;">${escape(record.record_type||'registro')} · ${escape(formatDate(record.created_at))}</div></div>
        <span style="font-size:11px;font-weight:700;padding:5px 8px;border-radius:999px;background:var(--hover-bg);">${finalized?'Finalizado':'Rascunho'}</span>
      </div>
      <div style="margin-top:12px;font-size:13px;line-height:1.6;white-space:pre-wrap;">${escape(record.content?.text||'')}</div>
      <div style="display:flex;justify-content:flex-end;margin-top:12px;gap:8px;flex-wrap:wrap;">
        ${finalized?`<button type="button" class="btn mentalitaPdfRecordBtn" data-record-id="${escape(record.id)}"><i data-lucide="file-down"></i> Salvar em PDF</button>`:''}
      </div>
      ${finalized?`<div style="margin-top:8px;font-size:10.5px;color:var(--text-secondary);word-break:break-all;">Hash: ${escape(record.integrity_hash||'-')}</div>`:''}
    </div>`;
  }

  async function renderTimeline(patient){
    const container=document.getElementById('mentalitaPatientProntuarioTimeline');
    if(!container) return;
    const records=await loadRecords(patient);
    if(!records.length){ container.innerHTML='<div style="padding:34px 20px;text-align:center;border:2px dashed var(--border);border-radius:var(--radius-lg);"><div style="width:44px;height:44px;margin:0 auto 12px;border-radius:12px;background:var(--hover-bg);display:flex;align-items:center;justify-content:center;"><i data-lucide="file-clock"></i></div><h3 style="margin:0 0 6px;">Nenhum registro clínico</h3><p style="margin:0;color:var(--text-secondary);font-size:13px;">Os atendimentos e evoluções deste paciente aparecerão aqui.</p></div>'; if(typeof refreshIcons==='function') refreshIcons(); return; }
    container.innerHTML=records.map(r=>renderTimelineItem(r,patient)).join('');
    container.querySelectorAll('.mentalitaPdfRecordBtn').forEach(btn=>btn.addEventListener('click',()=>{const record=records.find(r=>String(r.id)===String(btn.dataset.recordId));if(record) printRecord(record,patient);}));
    if(typeof refreshIcons==='function') refreshIcons();
  }

  function openNewRecord(patient){
    document.getElementById('mentalitaProntuarioModal')?.remove();
    document.body.insertAdjacentHTML('beforeend',buildEntryForm());
    document.getElementById('mentalitaProntuarioClose')?.addEventListener('click',()=>document.getElementById('mentalitaProntuarioModal')?.remove());
    document.getElementById('mentalitaProntuarioDraftBtn')?.addEventListener('click',()=>saveRecord('draft'));
    document.getElementById('mentalitaProntuarioForm')?.addEventListener('submit',e=>{e.preventDefault();saveRecord('finalized');});
  }

  function renderPatientProntuarioSection(patient){
    if(!patient) return '';
    return `<div class="patient-section">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
        <div><h2 style="margin-bottom:4px;">Prontuário eletrônico</h2><p style="margin:0;color:var(--text-secondary);font-size:13px;">Histórico clínico, evoluções e registros deste paciente.</p></div>
        <button class="btn btn-primary" type="button" id="mentalitaNewProntuarioEntryBtn"><i data-lucide="plus"></i> Novo registro</button>
      </div>
      <div class="patient-info-card" style="padding:14px 16px;"><div style="display:flex;align-items:flex-start;gap:10px;"><i data-lucide="shield-check" style="width:20px;height:20px;color:var(--primary);"></i><div><div style="font-size:12.5px;font-weight:700;color:var(--primary);">Registro clínico protegido</div><div style="font-size:11.5px;line-height:1.5;color:var(--text-secondary);">Rascunhos podem ser salvos. Registros finalizados ficam preservados e uma correção deverá gerar novo lançamento.</div></div></div></div>
      <div class="patient-info-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;"><div><h3 style="margin:0 0 3px;">Linha do tempo clínica</h3><span style="font-size:11.5px;color:var(--text-secondary);">Registros em ordem cronológica</span></div><span style="font-size:11px;font-weight:700;padding:5px 8px;border-radius:999px;background:var(--hover-bg);">Somente acréscimos</span></div><div id="mentalitaPatientProntuarioTimeline"><div style="padding:34px 20px;text-align:center;border:2px dashed var(--border);border-radius:var(--radius-lg);">Carregando prontuário...</div></div></div>
      <div class="patient-info-card"><h3 style="margin-bottom:12px;">Política de integridade</h3><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;"><div style="padding:12px;border-radius:var(--radius-sm);background:var(--hover-bg);"><b>Original</b><div style="font-size:12px;margin-top:4px;">Preservado após finalização.</div></div><div style="padding:12px;border-radius:var(--radius-sm);background:var(--hover-bg);"><b>Correção</b><div style="font-size:12px;margin-top:4px;">Novo registro vinculado ao anterior.</div></div><div style="padding:12px;border-radius:var(--radius-sm);background:var(--hover-bg);"><b>Auditoria</b><div style="font-size:12px;margin-top:4px;">Autor, data e hora registrados.</div></div></div></div>
    </div>`;
  }

  function bindProntuario(patient){
    const button=document.getElementById('mentalitaNewProntuarioEntryBtn');
    if(button && button.dataset.bound!=='true'){ button.dataset.bound='true'; button.addEventListener('click',()=>openNewRecord(patient)); }
    renderTimeline(patient);
  }

  function install(){
    if(window.__mentalitaPatientProntuarioInstalled) return;
    if(typeof window.renderPatientSectionContent!=='function'){ setTimeout(install,100); return; }
    const original=window.renderPatientSectionContent;
    window.renderPatientSectionContent=function(section){
      const patient=getPatient();
      if(section==='prontuario' && patient){
        const html=renderPatientProntuarioSection(patient);
        setTimeout(()=>{bindProntuario(patient);if(typeof refreshIcons==='function')refreshIcons();},0);
        return html;
      }
      return original.apply(this,arguments);
    };
    window.renderPatientProntuario=renderPatientProntuarioSection;
    window.__mentalitaPatientProntuarioInstalled=true;
    const patient=getPatient();
    if(patient && window.state?.patientSection==='prontuario' && typeof window.renderPatientProfile==='function') window.renderPatientProfile();
  }
  install();
})();
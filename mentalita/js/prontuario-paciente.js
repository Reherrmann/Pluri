// Mentalita — estrutura da aba Prontuário eletrônico do paciente.
// Inspirada no padrão do PLURI OS, com arquitetura preparada para registros imutáveis.
// Nesta etapa a persistência real ainda não é executada.
(function installMentalitaPatientProntuario(){
  function escape(value){
    if(typeof patientEscape==='function') return patientEscape(value);
    return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function renderPatientProntuarioSection(patient){
    if(!patient) return '';
    return `<div class="patient-section">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
        <div>
          <h2 style="margin-bottom:4px;">Prontuário eletrônico</h2>
          <p style="margin:0;color:var(--text-secondary);font-size:13px;">Histórico clínico, evoluções e registros deste paciente.</p>
        </div>
        <button class="btn btn-primary" type="button" id="mentalitaNewProntuarioEntryBtn">
          <i data-lucide="plus" style="width:16px;height:16px;"></i>
          Novo registro
        </button>
      </div>

      <div class="patient-info-card" style="padding:14px 16px;">
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <div style="width:34px;height:34px;border-radius:9px;background:var(--hover-bg);display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
            <i data-lucide="shield-check" style="width:17px;height:17px;color:var(--primary);"></i>
          </div>
          <div style="min-width:0;">
            <div style="font-size:12.5px;font-weight:700;color:var(--primary);">Registro clínico protegido</div>
            <div style="font-size:11.5px;line-height:1.5;color:var(--text-secondary);">Registros finalizados não serão editados ou apagados. Uma correção deverá gerar um novo lançamento, preservando o histórico original.</div>
          </div>
        </div>
      </div>

      <div class="patient-info-card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;">
          <div>
            <h3 style="margin:0 0 3px;">Linha do tempo clínica</h3>
            <span style="font-size:11.5px;color:var(--text-secondary);">Registros em ordem cronológica</span>
          </div>
          <span style="font-size:11px;font-weight:700;padding:5px 8px;border-radius:999px;background:var(--hover-bg);color:var(--text-secondary);">Somente acréscimos</span>
        </div>
        <div id="mentalitaPatientProntuarioTimeline">
          <div style="padding:34px 20px;text-align:center;border:2px dashed var(--border);border-radius:var(--radius-lg);">
            <div style="width:44px;height:44px;margin:0 auto 12px;border-radius:12px;background:var(--hover-bg);display:flex;align-items:center;justify-content:center;">
              <i data-lucide="file-clock" style="width:21px;height:21px;color:var(--text-secondary);"></i>
            </div>
            <h3 style="margin:0 0 6px;">Nenhum registro clínico</h3>
            <p style="margin:0;color:var(--text-secondary);font-size:13px;">Os atendimentos e evoluções deste paciente aparecerão aqui.</p>
          </div>
        </div>
      </div>

      <div class="patient-info-card">
        <h3 style="margin-bottom:12px;">Política de integridade</h3>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">
          <div style="padding:12px;border-radius:var(--radius-sm);background:var(--hover-bg);">
            <div style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;">Original</div>
            <div style="font-size:12px;margin-top:4px;color:var(--text);">Preservado após finalização.</div>
          </div>
          <div style="padding:12px;border-radius:var(--radius-sm);background:var(--hover-bg);">
            <div style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;">Correção</div>
            <div style="font-size:12px;margin-top:4px;color:var(--text);">Novo registro vinculado ao anterior.</div>
          </div>
          <div style="padding:12px;border-radius:var(--radius-sm);background:var(--hover-bg);">
            <div style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;">Auditoria</div>
            <div style="font-size:12px;margin-top:4px;color:var(--text);">Autor, data e hora serão registrados.</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function bindProntuarioStructure(patient){
    const button=document.getElementById('mentalitaNewProntuarioEntryBtn');
    if(!button || !patient || button.dataset.bound==='true') return;
    button.dataset.bound='true';
    button.addEventListener('click',function(){
      if(typeof showToast==='function') showToast('A estrutura do prontuário está pronta. A gravação imutável será ativada na próxima etapa.');
    });
  }

  function install(){
    if(window.__mentalitaPatientProntuarioInstalled) return;
    if(typeof window.renderPatientSectionContent!=='function'){
      setTimeout(install,100);
      return;
    }

    const original=window.renderPatientSectionContent;
    window.renderPatientSectionContent=function(section){
      const patient=window.state?.selectedPatient || (typeof state!=='undefined' ? state.selectedPatient : null);
      if(section==='prontuario' && patient){
        const html=renderPatientProntuarioSection(patient);
        setTimeout(()=>{
          bindProntuarioStructure(patient);
          if(typeof refreshIcons==='function') refreshIcons();
        },0);
        return html;
      }
      return original.apply(this,arguments);
    };

    window.renderPatientProntuario=renderPatientProntuarioSection;
    window.__mentalitaPatientProntuarioInstalled=true;

    const patient=window.state?.selectedPatient || (typeof state!=='undefined' ? state.selectedPatient : null);
    if(patient && window.state?.patientSection==='prontuario' && typeof window.renderPatientProfile==='function'){
      window.renderPatientProfile();
    }
  }

  install();
})();

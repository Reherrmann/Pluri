// Mentalita — estrutura da aba Documentos do paciente.
// Inspirada no PLURI OS, que usa o Google Drive da clínica para armazenar os arquivos.
// Nesta etapa a integração real ainda não é executada.
(function installMentalitaPatientDocuments(){
  function escape(value){
    if(typeof patientEscape==='function') return patientEscape(value);
    return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function renderPatientDocumentsSection(patient){
    if(!patient) return '';
    return `<div class="patient-section">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:2px;">
        <div>
          <h2 style="margin-bottom:4px;">Documentos</h2>
          <p style="margin:0;color:var(--text-secondary);font-size:13px;">Arquivos armazenados no Google Drive da clínica.</p>
        </div>
        <button class="btn btn-primary" type="button" id="mentalitaPatientAddDocumentBtn">
          <i data-lucide="upload" style="width:16px;height:16px;"></i>
          Adicionar documento
        </button>
      </div>

      <div class="patient-info-card" style="padding:14px 16px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:34px;height:34px;border-radius:9px;background:var(--hover-bg);display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
            <i data-lucide="hard-drive" style="width:17px;height:17px;color:var(--primary);"></i>
          </div>
          <div style="min-width:0;">
            <div style="font-size:12.5px;font-weight:700;color:var(--primary);">Google Drive</div>
            <div style="font-size:11.5px;color:var(--text-secondary);">A conta será a mesma utilizada na integração do Google Calendar em Configurações.</div>
          </div>
        </div>
      </div>

      <div id="mentalitaPatientDocumentsList" class="patient-info-card">
        <div style="padding:42px 24px;text-align:center;">
          <div style="width:48px;height:48px;margin:0 auto 14px;border-radius:12px;background:var(--hover-bg);display:flex;align-items:center;justify-content:center;">
            <i data-lucide="folder-open" style="width:22px;height:22px;color:var(--text-secondary);"></i>
          </div>
          <h3 style="margin:0 0 6px;">Nenhum documento</h3>
          <p style="margin:0;color:var(--text-secondary);font-size:13px;">Adicione exames, documentos e outros arquivos deste paciente.</p>
        </div>
      </div>
    </div>`;
  }

  function bindDocumentsStructure(patient){
    const button=document.getElementById('mentalitaPatientAddDocumentBtn');
    if(!button || !patient || button.dataset.bound==='true') return;
    button.dataset.bound='true';
    button.addEventListener('click',function(){
      // Estrutura preparada para a futura chamada ao Google Drive.
      // O upload real será conectado depois, usando a mesma autorização do Calendar.
      if(typeof showToast==='function') showToast('A integração com o Google Drive será ativada nesta próxima etapa.');
    });
  }

  function install(){
    if(window.__mentalitaPatientDocumentsInstalled) return;
    if(typeof window.renderPatientSectionContent!=='function'){
      setTimeout(install,100);
      return;
    }

    const original=window.renderPatientSectionContent;
    window.renderPatientSectionContent=function(section){
      const patient=window.state?.selectedPatient || (typeof state!=='undefined' ? state.selectedPatient : null);
      if(section==='documentos' && patient){
        const html=renderPatientDocumentsSection(patient);
        setTimeout(()=>{
          bindDocumentsStructure(patient);
          if(typeof refreshIcons==='function') refreshIcons();
        },0);
        return html;
      }
      return original.apply(this,arguments);
    };

    window.renderPatientDocuments=renderPatientDocumentsSection;
    window.__mentalitaPatientDocumentsInstalled=true;

    const patient=window.state?.selectedPatient || (typeof state!=='undefined' ? state.selectedPatient : null);
    if(patient && window.state?.patientSection==='documentos' && typeof window.renderPatientProfile==='function'){
      window.renderPatientProfile();
    }
  }

  install();
})();

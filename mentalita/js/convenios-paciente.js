// Mentalita — Convênio na ficha do paciente (Supabase)
(function installMentalitaConvenioModule(){
  function install(){
    if(window.__mentalitaConvenioModuleInstalled) return;
    if(typeof window.renderPatientSectionContent !== 'function') { setTimeout(install,100); return; }
    window.__mentalitaConvenioModuleInstalled=true;
    window.renderPatientConvenioSection=renderPatientConvenioSection;
    window.openPatientConvenioForm=openPatientConvenioForm;
    window.cancelPatientConvenioForm=cancelPatientConvenioForm;
    window.savePatientConvenio=savePatientConvenio;
  }

  function renderPatientConvenioSection(patient){
    const linked=String(patient.hasInsurance||'').toLowerCase()==='sim' || !!patient.insuranceName;
    if(!linked){
      return `<div class="patient-section"><h2>Convênios</h2><div class="patient-empty-state"><h3>Nenhum convênio vinculado</h3><p>Cadastre o convênio, plano, carteirinha e validade deste paciente.</p><button class="btn btn-outline" type="button" onclick="openPatientConvenioForm()">Adicionar convênio</button></div></div>`;
    }
    return `<div class="patient-section"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;"><div><h2 style="margin:0;">Convênios</h2><p style="margin:5px 0 0;color:var(--text-secondary);">Convênio atualmente vinculado ao paciente.</p></div><button class="btn btn-outline" type="button" onclick="openPatientConvenioForm()">Editar convênio</button></div><div class="patient-info-card"><h3>Convênio do paciente</h3><div class="patient-info-grid"><div class="patient-info-item"><span class="patient-info-label">Convênio</span><span class="patient-info-value">${escapeHtml(patient.insuranceName||'—')}</span></div><div class="patient-info-item"><span class="patient-info-label">Plano</span><span class="patient-info-value">${escapeHtml(patient.insurancePlan||'—')}</span></div><div class="patient-info-item"><span class="patient-info-label">Carteirinha</span><span class="patient-info-value">${escapeHtml(patient.insuranceCard||'—')}</span></div><div class="patient-info-item"><span class="patient-info-label">Validade</span><span class="patient-info-value">${escapeHtml(patient.insuranceExpiration||'—')}</span></div></div></div></div>`;
  }

  function openPatientConvenioForm(){
    const patient=state.selectedPatient;
    if(!patient) return;
    const container=getEl('pageContainer');
    if(!container) return;
    container.innerHTML=`<div class="patient-profile"><button class="back-link" type="button" onclick="cancelPatientConvenioForm()"><i data-lucide="arrow-left" style="width:16px;height:16px;"></i> Voltar para convênios</button><div class="patient-profile-header"><div class="patient-profile-avatar">${escapeHtml(getInitials(patient.name))}</div><div class="patient-profile-info"><h2>${escapeHtml(patient.name)}</h2><p class="patient-profile-bio">Dados do convênio</p></div></div><div class="patient-profile-main"><aside class="patient-profile-sidebar"><nav class="patient-profile-nav"><ul><li onclick="openPatientSection('prontuario')">Prontuário eletrônico</li><li onclick="openPatientSection('dados-pessoais')">Dados pessoais</li><li onclick="openPatientSection('documentos')">Documentos</li><li class="active">Convênios</li><li onclick="openPatientSection('agendamentos')">Agendamentos</li><li onclick="openPatientSection('financeiro')">Financeiro</li><li onclick="openPatientSection('guias-tiss')">Guias TISS</li></ul></nav></aside><section class="patient-profile-content"><div class="patient-section"><h2>${patient.insuranceName?'Editar convênio':'Adicionar convênio'}</h2><p class="section-subtitle">Vincule os dados do convênio deste paciente.</p><form id="patientConvenioForm" onsubmit="savePatientConvenio(event)"><div class="patient-info-card"><h3>Dados do convênio</h3><div class="patient-info-grid"><div class="patient-info-item full-width"><label class="patient-info-label" for="patientConvenioName">Convênio</label><input id="patientConvenioName" name="insuranceName" type="text" value="${escapeHtml(patient.insuranceName||'')}" placeholder="Nome do convênio" required></div><div class="patient-info-item full-width"><label class="patient-info-label" for="patientConvenioPlan">Plano</label><input id="patientConvenioPlan" name="insurancePlan" type="text" value="${escapeHtml(patient.insurancePlan||'')}" placeholder="Nome do plano"></div><div class="patient-info-item"><label class="patient-info-label" for="patientConvenioCard">Carteirinha</label><input id="patientConvenioCard" name="insuranceCard" type="text" value="${escapeHtml(patient.insuranceCard||'')}" placeholder="Número da carteirinha"></div><div class="patient-info-item"><label class="patient-info-label" for="patientConvenioExpiration">Validade</label><input id="patientConvenioExpiration" name="insuranceExpiration" type="text" value="${escapeHtml(patient.insuranceExpiration||'')}" placeholder="DD/MM/AAAA"></div></div></div><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;"><button type="button" class="btn btn-outline" onclick="cancelPatientConvenioForm()">Cancelar</button><button type="submit" class="btn btn-primary" id="savePatientConvenioBtn">Salvar convênio</button></div></form></div></section></div></div>`;
    refreshIcons();
  }

  async function savePatientConvenio(event){
    event.preventDefault();
    const patient=state.selectedPatient;
    if(!patient) return;
    const button=getEl('savePatientConvenioBtn');
    if(button){button.disabled=true;button.textContent='Salvando...';}
    try{
      const updated={...patient,hasInsurance:'Sim',insuranceName:getEl('patientConvenioName')?.value?.trim()||'',insurancePlan:getEl('patientConvenioPlan')?.value?.trim()||'',insuranceCard:getEl('patientConvenioCard')?.value?.trim()||'',insuranceExpiration:getEl('patientConvenioExpiration')?.value?.trim()||''};
      const result=await window.pluriAPI.updatePatient(patient._row,updated);
      if(!result?.success) throw new Error(result?.error||'Não foi possível salvar o convênio.');
      const i=state.patients.findIndex(p=>String(p._row)===String(patient._row));
      if(i>=0) state.patients[i]=updated;
      state.selectedPatient=updated;
      showToast('Convênio salvo com sucesso.');
      state.patientSection='convenios';
      await renderPatientProfile();
    }catch(e){showToast(e.message||'Erro ao salvar convênio.');if(button){button.disabled=false;button.textContent='Salvar convênio';}}
  }
  function cancelPatientConvenioForm(){state.patientSection='convenios';renderPatientProfile();}
  install();
})();

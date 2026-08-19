// Mentalita — formulário de paciente alinhado ao modelo do PLURI OS.
(function () {
  const esc = v => typeof patientEscape === 'function' ? patientEscape(v) : String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  function maskDate(input) {
    input?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g,'').slice(0,8);
      if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d{0,4})/,'$1/$2/$3');
      else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,2})/,'$1/$2');
      e.target.value = v;
    });
  }
  function maskPhone(input) {
    input?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g,'').slice(0,11);
      if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3');
      else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3');
      else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/,'($1) $2');
      else if (v.length) v = '(' + v;
      e.target.value = v;
    });
  }
  function maskCpf(input) {
    input?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g,'').slice(0,11);
      v = v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
      e.target.value = v;
    });
  }
  function maskCep(input) {
    input?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g,'').slice(0,8);
      if (v.length > 5) v = v.replace(/(\d{5})(\d{1,3})/,'$1-$2');
      e.target.value = v;
    });
  }

  window.toggleInsuranceFields = function(show) {
    const el = document.getElementById('insurance-fields');
    if (el) el.style.display = show ? 'block' : 'none';
  };

  window.openPatientForm = function(patient) {
    const p = patient || {};
    const isEdit = !!patient;
    const html = `
      <div class="slide-panel-content">
        <div class="slide-panel-header"><h3>${isEdit ? 'Editar paciente' : 'Novo paciente'}</h3></div>
        <form id="mentalita-patient-form">
          <div class="form-section"><h4>Dados principais</h4><div class="form-grid">
            <div class="form-field"><label>Nome completo *</label><input name="name" value="${esc(p.name)}" required></div>
            <div class="form-field"><label>Data de nascimento</label><input name="birthDate" class="mask-date" value="${esc(p.birthDate)}" placeholder="DD/MM/AAAA"></div>
            <div class="form-field"><label>Sexo</label><select name="gender"><option value="">Selecione</option><option ${p.gender==='Masculino'?'selected':''}>Masculino</option><option ${p.gender==='Feminino'?'selected':''}>Feminino</option><option ${p.gender==='Outro'?'selected':''}>Outro</option></select></div>
            <div class="form-field"><label>Estado civil</label><select name="maritalStatus"><option value="">Selecione</option><option ${p.maritalStatus==='Solteiro(a)'?'selected':''}>Solteiro(a)</option><option ${p.maritalStatus==='Casado(a)'?'selected':''}>Casado(a)</option><option ${p.maritalStatus==='Divorciado(a)'?'selected':''}>Divorciado(a)</option><option ${p.maritalStatus==='Viúvo(a)'?'selected':''}>Viúvo(a)</option><option ${p.maritalStatus==='Separado(a)'?'selected':''}>Separado(a)</option><option ${p.maritalStatus==='União estável'?'selected':''}>União estável</option></select></div>
            <div class="form-field"><label>Profissão</label><input name="profession" value="${esc(p.profession)}"></div>
          </div></div>
          <div class="form-section"><h4>Documentação</h4><div class="form-grid">
            <div class="form-field"><label>CPF</label><input name="cpf" class="mask-cpf" value="${esc(p.cpf)}" placeholder="000.000.000-00"></div>
            <div class="form-field"><label>RG</label><input name="rg" value="${esc(p.rg)}"></div>
          </div></div>
          <div class="form-section"><h4>Contato</h4><div class="form-grid">
            <div class="form-field"><label>E-mail</label><input type="email" name="email" value="${esc(p.email)}"></div>
            <div class="form-field"><label>Telefone</label><input name="phone" class="mask-phone" value="${esc(p.phone)}"></div>
            <div class="form-field"><label>Celular</label><input name="mobile" class="mask-phone" value="${esc(p.mobile)}"></div>
            <div class="form-field checkbox-field"><label class="checkbox-label"><input type="checkbox" name="sendReminders" ${p.sendReminders==='Sim'?'checked':''}> Enviar lembretes</label></div>
          </div></div>
          <details class="form-collapsible" ${p.address||p.zipCode||p.number||p.neighborhood||p.city||p.state?'open':''}><summary><i data-lucide="chevron-down"></i><h4>Endereço</h4></summary><div class="form-grid">
            <div class="form-field"><label>CEP</label><input name="zipCode" class="mask-cep" value="${esc(p.zipCode)}"></div><div class="form-field full-width"><label>Endereço</label><input name="address" value="${esc(p.address)}"></div><div class="form-field"><label>Número</label><input name="number" value="${esc(p.number)}"></div><div class="form-field"><label>Complemento</label><input name="complement" value="${esc(p.complement)}"></div><div class="form-field"><label>Bairro</label><input name="neighborhood" value="${esc(p.neighborhood)}"></div><div class="form-field"><label>Cidade</label><input name="city" value="${esc(p.city)}"></div><div class="form-field"><label>Estado</label><input name="state" maxlength="2" value="${esc(p.state)}"></div>
          </div></details>
          <details class="form-collapsible" ${p.motherName||p.fatherName||p.familyContactName||p.familyContactPhone?'open':''}><summary><i data-lucide="chevron-down"></i><h4>Família</h4></summary><div class="form-grid">
            <div class="form-field"><label>Nome da mãe</label><input name="motherName" value="${esc(p.motherName)}"></div><div class="form-field"><label>Nome do pai</label><input name="fatherName" value="${esc(p.fatherName)}"></div><div class="form-field"><label>Contato familiar</label><input name="familyContactName" value="${esc(p.familyContactName)}"></div><div class="form-field"><label>Grau de parentesco</label><input name="familyContactRelationship" value="${esc(p.familyContactRelationship)}"></div><div class="form-field"><label>Telefone familiar</label><input name="familyContactPhone" class="mask-phone" value="${esc(p.familyContactPhone)}"></div>
          </div></details>
          <div class="form-section"><h4>Convênio</h4><div class="form-field checkbox-field"><label class="checkbox-label"><input type="checkbox" name="hasInsurance" ${p.hasInsurance==='Sim'?'checked':''} onchange="toggleInsuranceFields(this.checked)"> Possui convênio</label></div><div id="insurance-fields" style="display:${p.hasInsurance==='Sim'?'block':'none'}"><div class="form-grid"><div class="form-field"><label>Convênio</label><input name="insuranceName" value="${esc(p.insuranceName)}"></div><div class="form-field"><label>Carteirinha</label><input name="insuranceCard" value="${esc(p.insuranceCard)}"></div><div class="form-field"><label>Plano</label><input name="insurancePlan" value="${esc(p.insurancePlan)}"></div><div class="form-field"><label>Validade</label><input name="insuranceExpiration" class="mask-date" value="${esc(p.insuranceExpiration)}" placeholder="DD/MM/AAAA"></div></div></div></div>
          <div class="form-section"><h4>Observações</h4><div class="form-field"><textarea name="notes" rows="3">${esc(p.notes)}</textarea></div></div>
          <div class="form-actions"><button type="button" class="btn btn-secondary" id="mentalita-cancel-edit">Cancelar</button><button type="submit" class="btn btn-primary">${isEdit?'Salvar alterações':'Criar paciente'}</button></div>
          ${isEdit ? '<div class="form-actions danger-zone"><button type="button" class="btn btn-danger" id="mentalita-delete-patient">Excluir paciente</button></div>' : ''}
        </form>
      </div>`;
    setSlideContent(html);
    openSlidePanel();
    refreshIcons();
    document.querySelectorAll('#mentalita-patient-form .mask-date').forEach(maskDate);
    document.querySelectorAll('#mentalita-patient-form .mask-phone').forEach(maskPhone);
    document.querySelectorAll('#mentalita-patient-form .mask-cpf').forEach(maskCpf);
    document.querySelectorAll('#mentalita-patient-form .mask-cep').forEach(maskCep);
    document.getElementById('mentalita-cancel-edit')?.addEventListener('click', closeSlidePanel);
    document.getElementById('mentalita-patient-form')?.addEventListener('submit', e => handlePatientSubmit(e, p, isEdit));
    document.getElementById('mentalita-delete-patient')?.addEventListener('click', () => deletePatient(p._row));
  };

  async function handlePatientSubmit(event, original, isEdit) {
    event.preventDefault();
    const f = event.currentTarget;
    const d = Object.fromEntries(new FormData(f).entries());
    d.sendReminders = f.elements.sendReminders?.checked ? 'Sim' : 'Não';
    d.hasInsurance = f.elements.hasInsurance?.checked ? 'Sim' : 'Não';
    const payload = { ...d, lastVisit: original.lastVisit || null, nextAppt: original.nextAppt || null, status: original.status || 'Ativo' };
    const button = f.querySelector('button[type="submit"]');
    if (button) { button.disabled = true; button.textContent = 'Salvando...'; }
    try {
      const result = isEdit ? await window.pluriAPI.updatePatient(original._row, payload) : await window.pluriAPI.createPatient(payload);
      if (!result?.success) throw new Error(result?.error || 'Não foi possível salvar o paciente.');
      state.patients = await window.pluriAPI.getPatients();
      state.selectedPatient = isEdit ? state.patients.find(x => String(x._row)===String(original._row)) || null : null;
      closeSlidePanel();
      showToast(isEdit ? 'Paciente atualizado.' : 'Paciente criado com sucesso!');
      if (state.selectedPatient) renderPatientProfile(); else renderPage();
    } catch (err) {
      console.error(err); showToast(err.message || 'Não foi possível salvar o paciente.');
      if (button) { button.disabled = false; button.textContent = isEdit ? 'Salvar alterações' : 'Criar paciente'; }
    }
  }

  async function deletePatient(id) {
    if (!confirm('Tem certeza que deseja excluir este paciente?')) return;
    const result = await window.pluriAPI.deletePatient(id);
    if (!result?.success) { showToast(result?.error || 'Não foi possível excluir o paciente.'); return; }
    state.patients = await window.pluriAPI.getPatients(); state.selectedPatient = null; closeSlidePanel(); showToast('Paciente excluído com sucesso!'); renderPage();
  }

  window.editPatient = function(row) {
    const p = state.patients.find(x => String(x._row) === String(row));
    if (p) window.openPatientForm(p);
  };
  window.openNewPatient = function() { window.openPatientForm(null); };
})();

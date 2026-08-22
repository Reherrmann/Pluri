// Clinic — prontuário eletrônico do paciente
(function () {
  'use strict';
  if (window.__clinicPatientProntuarioInstalled) return;

  const db = () => window.PLURI_SUPABASE || null;
  const currentPatient = () => window.state?.selectedPatient || (typeof state !== 'undefined' ? state.selectedPatient : null);
  const clinicId = () => window.PLURI_CLINIC?.id || null;
  const currentUser = () => window.PLURI_AUTH_SESSION?.user || null;
  const patientId = (patient) => patient?.id || patient?.ID || patient?._id || null;
  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  const notify = (message) => typeof showToast === 'function' ? showToast(message) : console.log('[Clinic]', message);

  async function loadRecords() {
    const client = db();
    const patient = currentPatient();
    const cid = clinicId();
    const pid = patientId(patient);
    if (!client || !cid || !pid) return [];
    const result = await client.from('clinic_patient_records')
      .select('*')
      .eq('clinic_id', cid)
      .eq('patient_id', pid)
      .order('created_at', { ascending: false });
    if (result.error) {
      console.error('[Clinic] prontuário:', result.error);
      return [];
    }
    return result.data || [];
  }

  async function audit(recordId, action) {
    const client = db();
    const patient = currentPatient();
    const cid = clinicId();
    const pid = patientId(patient);
    if (!client || !cid || !pid || !recordId) return;
    await client.from('clinic_patient_record_audit').insert({
      clinic_id: cid,
      patient_id: pid,
      record_id: recordId,
      actor_user_id: currentUser()?.id || null,
      action,
      occurred_at: new Date().toISOString(),
      metadata: { source: 'clinic-web' }
    });
  }

  function openModal() {
    document.getElementById('clinicProntuarioModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', `
      <div id="clinicProntuarioModal" style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;padding:16px">
        <div style="width:min(760px,100%);max-height:92vh;overflow:auto;background:var(--surface,#fff);border-radius:18px;padding:22px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
            <div><div style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-secondary);font-weight:800">Prontuário eletrônico</div><h2 style="margin:4px 0">Novo registro clínico</h2></div>
            <button class="btn" id="clinicPrClose">Fechar</button>
          </div>
          <form id="clinicPrForm" style="margin-top:18px">
            <label style="display:block;font-size:12px;font-weight:700">Tipo
              <select id="clinicPrType" style="width:100%;margin:6px 0 14px;padding:11px">
                <option value="evolucao">Evolução</option><option value="anamnese">Anamnese</option><option value="avaliacao">Avaliação</option><option value="plano_terapeutico">Plano terapêutico</option><option value="observacao">Observação</option>
              </select>
            </label>
            <label style="display:block;font-size:12px;font-weight:700">Título<input id="clinicPrTitle" required maxlength="180" style="width:100%;margin:6px 0 14px;padding:11px"></label>
            <label style="display:block;font-size:12px;font-weight:700">Registro clínico<textarea id="clinicPrContent" required rows="10" style="width:100%;margin:6px 0 14px;padding:11px;resize:vertical"></textarea></label>
            <div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn btn-primary" type="submit">Finalizar registro</button></div>
          </form>
        </div>
      </div>`);

    document.getElementById('clinicPrClose')?.addEventListener('click', () => document.getElementById('clinicProntuarioModal')?.remove());
    document.getElementById('clinicPrForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const client = db();
      const patient = currentPatient();
      const cid = clinicId();
      const user = currentUser();
      const pid = patientId(patient);
      if (!client || !cid || !pid) return notify('Sessão ou paciente não disponível.');
      const now = new Date().toISOString();
      const content = {
        title: document.getElementById('clinicPrTitle')?.value.trim() || '',
        text: document.getElementById('clinicPrContent')?.value.trim() || ''
      };
      if (!content.title || !content.text) return notify('Preencha título e registro clínico.');
      const payload = {
        clinic_id: cid,
        patient_id: pid,
        professional_id: user?.id || null,
        created_by: user?.id || null,
        record_type: document.getElementById('clinicPrType')?.value || 'evolucao',
        attended_at: now,
        created_at: now,
        status: 'finalized',
        content,
        title: content.title,
        finalized_at: now,
        finalized_by: user?.id || null
      };
      const result = await client.from('clinic_patient_records').insert(payload).select('*').single();
      if (result.error) return notify('Não foi possível salvar o registro: ' + result.error.message);
      await audit(result.data.id, 'record_finalized');
      document.getElementById('clinicProntuarioModal')?.remove();
      await render();
    });
  }

  async function render() {
    const host = document.getElementById('clinicPatientProntuario');
    if (!host) return;
    const records = await loadRecords();
    host.innerHTML = `
      <div class="patient-section">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
          <div><div style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-secondary);font-weight:800">Histórico clínico</div><h2 style="margin:4px 0">Prontuário eletrônico</h2><p style="margin:0;color:var(--text-secondary);font-size:13px">Todos os registros deste paciente.</p></div>
          <button class="btn btn-primary" id="clinicNewProntuario" type="button">+ Novo registro</button>
        </div>
        <div class="patient-info-card" style="padding:14px 16px;margin-top:14px"><div id="clinicPatientProntuarioTimeline"></div></div>
      </div>`;

    const timeline = document.getElementById('clinicPatientProntuarioTimeline');
    timeline.innerHTML = records.length ? records.map((record) => `
      <div style="border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div><div style="font-weight:800">${esc(record.content?.title || record.title || 'Registro clínico')}</div><div style="font-size:11px;color:var(--text-secondary);margin-top:3px">${esc(record.record_type || 'registro')} · ${esc(new Date(record.attended_at || record.created_at).toLocaleString('pt-BR'))}</div></div>
          <span class="status-badge confirmed">Finalizado</span>
        </div>
        <div style="margin-top:10px;white-space:pre-wrap;font-size:13px;line-height:1.55">${esc(record.content?.text || '')}</div>
      </div>`).join('') : '<div style="padding:24px;text-align:center;border:2px dashed var(--border);border-radius:12px"><h3 style="margin:0 0 6px">Nenhum registro clínico</h3><p style="color:var(--text-secondary);margin:0">Os atendimentos e evoluções aparecerão aqui.</p></div>';

    document.getElementById('clinicNewProntuario')?.addEventListener('click', openModal);
  }

  function install() {
    if (typeof window.renderPatientSectionContent !== 'function') {
      setTimeout(install, 100);
      return;
    }
    const original = window.renderPatientSectionContent;
    window.renderPatientSectionContent = function (section) {
      const patient = currentPatient();
      if (section === 'prontuario' && patient) {
        setTimeout(render, 0);
        return '<div id="clinicPatientProntuario"></div>';
      }
      return original.apply(this, arguments);
    };
    window.renderClinicProntuario = render;
    window.__clinicPatientProntuarioInstalled = true;
  }

  install();
})();

// Mentalita — prontuário eletrônico do paciente.
// Fonte oficial: Supabase. PLURI OS é apenas referência estrutural.
(function installMentalitaPatientProntuario() {
  const getClient = () => window.PLURI_SUPABASE || null;
  const getPatient = () => window.state?.selectedPatient || (typeof state !== 'undefined' ? state.selectedPatient : null);
  const getClinicId = () => window.PLURI_CLINIC?.id || null;
  const getUser = () => window.PLURI_AUTH_SESSION?.user || null;
  const esc = (v) => typeof patientEscape === 'function' ? patientEscape(v) : String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
  const notify = (m) => typeof showToast === 'function' ? showToast(m) : console.log('[Mentalita]', m);
  const patientId = (p) => p?.id || p?.ID || p?._id || null;
  const patientName = (p) => p?.nome || p?.Nome || p?.name || 'Paciente';

  function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  async function sha256(text) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function modalHtml() {
    return `
      <div id="mentalitaProntuarioModal" style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px">
        <div style="width:min(760px,100%);max-height:92vh;overflow:auto;background:var(--surface,#fff);border-radius:16px;padding:20px">
          <div style="display:flex;justify-content:space-between;gap:12px">
            <div><h2 style="margin:0 0 4px">Novo registro clínico</h2><p style="margin:0;color:var(--text-secondary);font-size:13px">Modo de teste: registros podem ser apagados durante a validação.</p></div>
            <button type="button" class="btn" id="mpClose">Fechar</button>
          </div>
          <form id="mpForm" style="margin-top:18px">
            <label>Tipo<select id="mpType" required style="width:100%;margin:6px 0 12px;padding:10px"><option value="evolucao">Evolução</option><option value="anamnese">Anamnese</option><option value="avaliacao">Avaliação</option><option value="plano_terapeutico">Plano terapêutico</option><option value="observacao">Observação</option></select></label>
            <label>Título<input id="mpTitle" required maxlength="180" style="width:100%;margin:6px 0 12px;padding:10px"></label>
            <label>Registro clínico<textarea id="mpContent" required rows="10" style="width:100%;margin:6px 0 12px;padding:10px;resize:vertical"></textarea></label>
            <div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" class="btn" id="mpDraft">Salvar rascunho</button><button type="submit" class="btn btn-primary">Finalizar registro</button></div>
          </form>
        </div>
      </div>`;
  }

  async function saveRecord(status) {
    const client = getClient();
    const p = getPatient();
    const clinicId = getClinicId();
    const u = getUser();
    const id = patientId(p);
    if (!client || !p || !clinicId || !id) { notify('Sessão ou paciente não disponível.'); return; }

    const title = document.getElementById('mpTitle')?.value.trim();
    const text = document.getElementById('mpContent')?.value.trim();
    const type = document.getElementById('mpType')?.value || 'evolucao';
    if (!title || !text) { notify('Preencha título e registro clínico.'); return; }

    const now = new Date().toISOString();
    const record = {
      clinic_id: clinicId, patient_id: id, professional_id: u?.id || null, created_by: u?.id || null,
      record_type: type, attended_at: now, created_at: now, status, content: { title, text },
      finalized_at: status === 'finalized' ? now : null, finalized_by: status === 'finalized' ? (u?.id || null) : null
    };
    if (status === 'finalized') record.content_hash = await sha256(JSON.stringify(record));

    const { error } = await client.from('mentalita_patient_records').insert(record);
    if (error) { console.error(error); notify('Erro ao salvar: ' + error.message); return; }

    document.getElementById('mentalitaProntuarioModal')?.remove();
    notify(status === 'finalized' ? 'Registro finalizado com sucesso.' : 'Rascunho salvo.');
    await renderTimeline();
  }

  async function loadRecords() {
    const client = getClient();
    const p = getPatient();
    const clinicId = getClinicId();
    const id = patientId(p);
    if (!client || !clinicId || !id) return [];

    const { data, error } = await client.from('mentalita_patient_records').select('*').eq('clinic_id', clinicId).eq('patient_id', id).order('created_at', { ascending: false });
    if (error) { console.error(error); notify('Não foi possível carregar o prontuário.'); return []; }
    return data || [];
  }

  async function deleteTestRecord(id) {
    if (!confirm('Apagar este registro de TESTE? Esta exclusão será removida na versão de produção.')) return;
    const client = getClient();
    const { error } = await client.from('mentalita_patient_records').delete().eq('id', id);
    if (error) { notify('Não foi possível apagar: ' + error.message); return; }
    notify('Registro de teste apagado.');
    await renderTimeline();
  }

  function exportPdf(record) {
    const p = getPatient();
    const text = ['MENTALITA — PRONTUÁRIO ELETRÔNICO','Paciente: ' + patientName(p),'Tipo: ' + (record.record_type || '-'),'Título: ' + (record.content?.title || '-'),'Data: ' + formatDate(record.created_at),'Status: ' + (record.status || '-'),'Profissional: ' + (record.professional_id || '-'),'','Registro clínico:',record.content?.text || '','','Finalizado em: ' + formatDate(record.finalized_at),'Hash de integridade: ' + (record.content_hash || '-')].join('\n');
    const w = window.open('', '_blank');
    if (!w) { notify('Permita pop-ups para gerar o PDF.'); return; }
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Prontuário — ${esc(patientName(p))}</title><style>body{font-family:Arial,sans-serif;margin:35px;line-height:1.6;color:#111}h1{font-size:20px}pre{white-space:pre-wrap;font:14px/1.6 Arial}.no-print{margin-top:20px}@media print{.no-print{display:none}}</style></head><body><h1>MENTALITA — PRONTUÁRIO ELETRÔNICO</h1><pre>${esc(text)}</pre><button class="no-print" onclick="window.print()">Salvar em PDF</button></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  }

  async function renderTimeline() {
    const box = document.getElementById('mentalitaPatientProntuarioTimeline');
    if (!box) return;
    const records = await loadRecords();
    if (!records.length) {
      box.innerHTML = '<div style="padding:34px;text-align:center;border:2px dashed var(--border);border-radius:12px"><h3>Nenhum registro clínico</h3><p style="color:var(--text-secondary)">Os atendimentos e evoluções aparecerão aqui.</p></div>';
      return;
    }

    box.innerHTML = records.map((r) => {
      const finalized = r.status === 'finalized';
      return `<div style="border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><b>${esc(r.content?.title || 'Registro clínico')}</b><div style="font-size:11.5px;color:var(--text-secondary)">${esc(r.record_type || 'registro')} · ${formatDate(r.created_at)}</div></div><span style="font-size:11px;padding:5px 8px;border-radius:999px;background:var(--hover-bg)">${finalized ? 'Finalizado' : 'Rascunho'}</span></div><div style="margin-top:12px;white-space:pre-wrap;font-size:13px">${esc(r.content?.text || '')}</div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;flex-wrap:wrap"><button type="button" class="btn mpPdf" data-id="${esc(r.id)}">Salvar em PDF</button><button type="button" class="btn mpDelete" data-id="${esc(r.id)}">Apagar teste</button></div>${finalized ? '<div style="margin-top:8px;font-size:10px;color:var(--text-secondary);word-break:break-all">Hash: ' + esc(r.content_hash || '-') + '</div>' : ''}</div>`;
    }).join('');

    box.querySelectorAll('.mpPdf').forEach((button) => button.addEventListener('click', () => {
      const record = records.find((r) => String(r.id) === String(button.dataset.id));
      if (record) exportPdf(record);
    }));
    box.querySelectorAll('.mpDelete').forEach((button) => button.addEventListener('click', () => deleteTestRecord(button.dataset.id)));
    if (typeof refreshIcons === 'function') refreshIcons();
  }

  function sectionHtml() {
    return `<div class="patient-section"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap"><div><h2 style="margin-bottom:4px">Prontuário eletrônico</h2><p style="margin:0;color:var(--text-secondary);font-size:13px">Histórico clínico, evoluções e registros deste paciente.</p></div><button class="btn btn-primary" type="button" id="mentalitaNewProntuarioEntryBtn">+ Novo registro</button></div><div class="patient-info-card" style="padding:14px 16px;margin-top:16px"><b style="color:var(--primary)">Registro clínico protegido</b><div style="font-size:11.5px;color:var(--text-secondary);margin-top:4px">Exclusão temporariamente habilitada apenas para testes.</div></div><div class="patient-info-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div><h3 style="margin:0 0 3px">Linha do tempo clínica</h3><span style="font-size:11.5px;color:var(--text-secondary)">Registros em ordem cronológica</span></div><span style="font-size:11px;font-weight:700;padding:5px 8px;border-radius:999px;background:var(--hover-bg)">Somente acréscimos</span></div><div id="mentalitaPatientProntuarioTimeline">Carregando...</div></div><div class="patient-info-card"><h3>Política de integridade</h3><div style="font-size:12px;color:var(--text-secondary)">A finalização gera hash de integridade. Na versão de produção, registros finalizados não terão exclusão nem edição; correções serão novos lançamentos.</div></div></div>`;
  }

  function bindSection() {
    const button = document.getElementById('mentalitaNewProntuarioEntryBtn');
    if (!button || button.dataset.bound === '1') return;
    button.dataset.bound = '1';
    button.addEventListener('click', () => {
      document.getElementById('mentalitaProntuarioModal')?.remove();
      document.body.insertAdjacentHTML('beforeend', modalHtml());
      document.getElementById('mpClose').addEventListener('click', () => document.getElementById('mentalitaProntuarioModal')?.remove());
      document.getElementById('mpDraft').addEventListener('click', () => saveRecord('draft'));
      document.getElementById('mpForm').addEventListener('submit', (event) => { event.preventDefault(); saveRecord('finalized'); });
    });
    renderTimeline();
    if (typeof refreshIcons === 'function') refreshIcons();
  }

  function install() {
    if (window.__mentalitaPatientProntuarioInstalled) return;
    if (typeof window.renderPatientSectionContent !== 'function') { setTimeout(install, 100); return; }
    const original = window.renderPatientSectionContent;
    window.renderPatientSectionContent = function(section) {
      const p = getPatient();
      if (section === 'prontuario' && p) {
        const html = sectionHtml();
        setTimeout(bindSection, 0);
        return html;
      }
      return original.apply(this, arguments);
    };
    window.renderPatientProntuario = sectionHtml;
    window.__mentalitaPatientProntuarioInstalled = true;
  }

  install();
})();
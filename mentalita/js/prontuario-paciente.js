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
  const patientName = (p) => p?.name || p?.nome || p?.Nome || p?.name || 'Paciente';

  function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }
  function formatDay(value) {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  async function sha256(text) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function modalHtml() {
    return `<div id="mentalitaProntuarioModal" style="position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.48);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="width:min(760px,100%);max-height:92vh;overflow:auto;background:var(--surface,#fff);border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.22);padding:24px">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start"><div><div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--primary)">Prontuário eletrônico</div><h2 style="margin:5px 0 5px">Novo registro clínico</h2><p style="margin:0;color:var(--text-secondary);font-size:13px">O registro finalizado será preservado e receberá um hash de integridade.</p></div><button type="button" class="btn" id="mpClose">Fechar</button></div>
        <form id="mpForm" style="margin-top:22px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <label style="display:block"><span style="font-size:12px;font-weight:700">Tipo</span><select id="mpType" required style="width:100%;margin-top:6px;padding:11px;border:1px solid var(--border);border-radius:10px"><option value="evolucao">Evolução</option><option value="anamnese">Anamnese</option><option value="avaliacao">Avaliação</option><option value="plano_terapeutico">Plano terapêutico</option><option value="observacao">Observação</option></select></label>
            <label style="display:block"><span style="font-size:12px;font-weight:700">Título</span><input id="mpTitle" required maxlength="180" placeholder="Ex.: Evolução da sessão" style="width:100%;margin-top:6px;padding:11px;border:1px solid var(--border);border-radius:10px"></label>
            <label style="display:block;grid-column:1/-1"><span style="font-size:12px;font-weight:700">Registro clínico</span><textarea id="mpContent" required rows="11" placeholder="Descreva o atendimento, evolução, observações e condutas..." style="width:100%;margin-top:6px;padding:11px;border:1px solid var(--border);border-radius:10px;resize:vertical"></textarea></label>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;flex-wrap:wrap"><button type="button" class="btn" id="mpDraft">Salvar rascunho</button><button type="submit" class="btn btn-primary">Finalizar registro</button></div>
        </form>
      </div>
    </div>`;
  }

  async function saveRecord(status) {
    const client = getClient(), p = getPatient(), clinicId = getClinicId(), u = getUser(), id = patientId(p);
    if (!client || !p || !clinicId || !id) { notify('Sessão ou paciente não disponível.'); return; }
    const title = document.getElementById('mpTitle')?.value.trim(), text = document.getElementById('mpContent')?.value.trim(), type = document.getElementById('mpType')?.value || 'evolucao';
    if (!title || !text) { notify('Preencha título e registro clínico.'); return; }
    const now = new Date().toISOString();
    const record = { clinic_id: clinicId, patient_id: id, professional_id: u?.id || null, created_by: u?.id || null, record_type: type, attended_at: now, created_at: now, status, content: { title, text }, finalized_at: status === 'finalized' ? now : null, finalized_by: status === 'finalized' ? (u?.id || null) : null };
    if (status === 'finalized') record.content_hash = await sha256(JSON.stringify(record));
    const { error } = await client.from('mentalita_patient_records').insert(record);
    if (error) { console.error(error); notify('Erro ao salvar: ' + error.message); return; }
    document.getElementById('mentalitaProntuarioModal')?.remove();
    notify(status === 'finalized' ? 'Registro finalizado com sucesso.' : 'Rascunho salvo.');
    await renderTimeline();
  }

  async function loadRecords() {
    const client = getClient(), p = getPatient(), clinicId = getClinicId(), id = patientId(p);
    if (!client || !clinicId || !id) return [];
    const { data, error } = await client.from('mentalita_patient_records').select('*').eq('clinic_id', clinicId).eq('patient_id', id).order('created_at', { ascending: true });
    if (error) { console.error(error); notify('Não foi possível carregar o prontuário.'); return []; }
    return data || [];
  }

  async function loadProfessionals(records) {
    const client = getClient(), clinicId = getClinicId();
    if (!client || !clinicId) return {};
    const ids = [...new Set(records.map(r => r.professional_id).filter(Boolean))];
    if (!ids.length) return {};
    const { data } = await client.from('mentalita_staff').select('id,name,role').eq('clinic_id', clinicId).in('id', ids);
    return Object.fromEntries((data || []).map(s => [s.id, s]));
  }

  function professionalLabel(record, professionals) {
    const s = professionals[record.professional_id];
    return s?.name || 'Profissional da clínica';
  }

  async function deleteTestRecord(id) {
    if (!confirm('Apagar este registro de TESTE? Esta exclusão será removida na versão de produção.')) return;
    const client = getClient();
    const { error } = await client.from('mentalita_patient_records').delete().eq('id', id);
    if (error) { notify('Não foi possível apagar: ' + error.message); return; }
    notify('Registro de teste apagado.');
    await renderTimeline();
  }

  function pdfDocumentHtml(title, subtitle, body) {
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;color:#18212b;margin:0;background:#fff;font-size:12px;line-height:1.55}.page{max-width:820px;margin:0 auto;padding:42px 46px}.header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:2px solid #183b56;padding-bottom:18px}.brand{font-size:20px;font-weight:800;letter-spacing:.02em}.eyebrow{font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:800;color:#557084;margin-bottom:4px}.doc-title{font-size:23px;font-weight:800;margin:4px 0}.meta{font-size:10px;color:#607080;text-align:right}.patient{margin:22px 0;padding:16px 18px;border:1px solid #dce3e8;border-radius:12px;background:#f7f9fb}.patient strong{font-size:15px}.record{padding:18px 0;border-bottom:1px solid #e3e8ec;page-break-inside:avoid}.record-head{display:flex;justify-content:space-between;gap:18px}.record-title{font-size:14px;font-weight:800}.record-type{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#557084;font-weight:800}.record-date{font-size:10px;color:#607080;white-space:nowrap}.professional{font-size:10px;color:#607080;margin:5px 0 12px}.content{white-space:pre-wrap}.integrity{margin-top:12px;padding:9px 11px;border-left:3px solid #183b56;background:#f7f9fb;font-size:9px;color:#5c6d79;word-break:break-all}.footer{margin-top:28px;padding-top:12px;border-top:1px solid #dce3e8;font-size:9px;color:#71808b;display:flex;justify-content:space-between}.no-print{margin:24px 0 0;padding:9px 14px;border:0;border-radius:8px;background:#183b56;color:#fff;font-weight:700}@media print{.page{padding:15mm 13mm}.no-print{display:none}}
    </style></head><body><div class="page">${body}<button class="no-print" onclick="window.print()">Salvar em PDF</button></div></body></html>`;
  }

  function openPdfWindow(html) {
    const w = window.open('', '_blank');
    if (!w) { notify('Permita pop-ups para gerar o PDF.'); return; }
    w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300);
  }

  async function exportSinglePdf(record, professionals) {
    const p = getPatient(), professional = professionalLabel(record, professionals);
    const body = `<div class="header"><div><div class="eyebrow">Mentalita</div><div class="brand">Prontuário eletrônico</div><div class="doc-title">Registro clínico</div></div><div class="meta">Documento individual<br>Gerado em ${esc(formatDate(new Date()))}</div></div><div class="patient"><div class="eyebrow">Paciente</div><strong>${esc(patientName(p))}</strong><div style="margin-top:4px">${p?.birth_date ? 'Nascimento: ' + esc(new Date(p.birth_date).toLocaleDateString('pt-BR')) : ''}${p?.cpf ? ' · CPF: ' + esc(p.cpf) : ''}</div></div><section class="record"><div class="record-head"><div><div class="record-type">${esc(record.record_type || 'Registro')}</div><div class="record-title">${esc(record.content?.title || 'Registro clínico')}</div></div><div class="record-date">${esc(formatDate(record.created_at))}</div></div><div class="professional">Profissional: <strong>${esc(professional)}</strong></div><div class="content">${esc(record.content?.text || '')}</div>${record.status === 'finalized' ? `<div class="integrity">Registro finalizado em ${esc(formatDate(record.finalized_at))}<br>Hash de integridade: ${esc(record.content_hash || '-')}</div>` : ''}</section><div class="footer"><span>Documento de consulta — fonte oficial: prontuário eletrônico Mentalita.</span><span>1 registro</span></div>`;
    openPdfWindow(pdfDocumentHtml('Registro clínico — ' + patientName(p), '', body));
  }

  async function exportFullPdf(records, professionals) {
    const p = getPatient();
    const finalized = records.filter(r => r.status === 'finalized');
    const first = finalized[0]?.created_at || records[0]?.created_at, last = finalized[finalized.length - 1]?.created_at || records[records.length - 1]?.created_at;
    const rows = records.map((r) => `<section class="record"><div class="record-head"><div><div class="record-type">${esc(r.record_type || 'Registro')}</div><div class="record-title">${esc(r.content?.title || 'Registro clínico')}</div></div><div class="record-date">${esc(formatDate(r.created_at))}</div></div><div class="professional">Profissional: <strong>${esc(professionalLabel(r, professionals))}</strong></div><div class="content">${esc(r.content?.text || '')}</div>${r.status === 'finalized' ? `<div class="integrity">✓ Registro finalizado · Hash: ${esc(r.content_hash || '-')}</div>` : '<div class="integrity">Rascunho — não representa registro clínico finalizado.</div>'}</section>`).join('');
    const body = `<div class="header"><div><div class="eyebrow">Mentalita</div><div class="brand">Prontuário eletrônico</div><div class="doc-title">Prontuário completo</div></div><div class="meta">Exportação do histórico<br>Gerado em ${esc(formatDate(new Date()))}</div></div><div class="patient"><div class="eyebrow">Paciente</div><strong>${esc(patientName(p))}</strong><div style="margin-top:5px">${p?.birth_date ? 'Nascimento: ' + esc(new Date(p.birth_date).toLocaleDateString('pt-BR')) + ' · ' : ''}${p?.cpf ? 'CPF: ' + esc(p.cpf) : ''}</div><div style="margin-top:6px;color:#607080">Período: ${esc(formatDay(first))} → ${esc(formatDay(last))} · ${records.length} registro(s)</div></div><div style="font-size:11px;font-weight:800;margin:22px 0 2px">HISTÓRICO CLÍNICO</div>${rows}<div class="footer"><span>Fonte oficial: prontuário eletrônico Mentalita.</span><span>Histórico completo</span></div>`;
    openPdfWindow(pdfDocumentHtml('Prontuário completo — ' + patientName(p), '', body));
  }

  async function renderTimeline() {
    const box = document.getElementById('mentalitaPatientProntuarioTimeline');
    if (!box) return;
    const records = await loadRecords();
    const professionals = await loadProfessionals(records);
    const count = document.getElementById('mentalitaProntuarioCount');
    if (count) count.textContent = `${records.length} ${records.length === 1 ? 'registro' : 'registros'}`;
    const exportBtn = document.getElementById('mentalitaExportFullProntuario');
    if (exportBtn) { exportBtn.disabled = !records.length; exportBtn.onclick = () => exportFullPdf(records, professionals); }
    if (!records.length) { box.innerHTML = '<div style="padding:42px 20px;text-align:center;border:1px dashed var(--border);border-radius:14px"><div style="font-size:28px;margin-bottom:8px">⌁</div><h3 style="margin:0 0 5px">Nenhum registro clínico</h3><p style="margin:0;color:var(--text-secondary);font-size:13px">Os atendimentos e evoluções deste paciente aparecerão aqui.</p></div>'; return; }
    box.innerHTML = records.slice().reverse().map((r) => {
      const finalized = r.status === 'finalized';
      return `<article style="position:relative;padding:0 0 20px 28px;margin-bottom:4px;border-left:2px solid var(--border)"><span style="position:absolute;left:-6px;top:2px;width:10px;height:10px;border-radius:50%;background:${finalized ? 'var(--primary)' : 'var(--border)'}"></span><div style="font-size:10px;color:var(--text-secondary);font-weight:700;text-transform:uppercase;letter-spacing:.06em">${esc(formatDay(r.created_at))}</div><div style="margin-top:5px;border:1px solid var(--border);border-radius:14px;padding:15px;background:var(--surface,#fff)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--primary)">${esc(r.record_type || 'registro')}</div><div style="font-weight:800;margin-top:3px">${esc(r.content?.title || 'Registro clínico')}</div><div style="font-size:11px;color:var(--text-secondary);margin-top:3px">${esc(professionalLabel(r, professionals))} · ${esc(formatDate(r.created_at))}</div></div><span style="font-size:10px;font-weight:800;padding:5px 8px;border-radius:999px;background:var(--hover-bg)">${finalized ? '🔒 Finalizado' : 'Rascunho'}</span></div><div style="margin-top:12px;font-size:13px;line-height:1.6;white-space:pre-wrap">${esc(r.content?.text || '')}</div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:13px;flex-wrap:wrap"><button type="button" class="btn mpPdf" data-id="${esc(r.id)}">Salvar registro em PDF</button><button type="button" class="btn mpDelete" data-id="${esc(r.id)}">Apagar teste</button></div>${finalized ? `<div style="margin-top:9px;font-size:9.5px;color:var(--text-secondary);word-break:break-all">Integridade: ${esc(r.content_hash || '-')}</div>` : ''}</div></article>`;
    }).join('');
    box.querySelectorAll('.mpPdf').forEach(btn => btn.addEventListener('click', () => { const r = records.find(x => String(x.id) === String(btn.dataset.id)); if (r) exportSinglePdf(r, professionals); }));
    box.querySelectorAll('.mpDelete').forEach(btn => btn.addEventListener('click', () => deleteTestRecord(btn.dataset.id)));
  }

  function sectionHtml() {
    return `<div class="patient-section"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap"><div><div style="font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--primary)">Histórico clínico</div><h2 style="margin:4px 0">Prontuário eletrônico</h2><p style="margin:0;color:var(--text-secondary);font-size:13px">Um histórico longitudinal, organizado por atendimento e preservado após a finalização.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="mentalitaExportFullProntuario">Exportar prontuário completo</button><button class="btn btn-primary" type="button" id="mentalitaNewProntuarioEntryBtn">+ Novo registro</button></div></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin:18px 0"><div class="patient-info-card" style="padding:12px 15px;min-width:130px"><div style="font-size:10px;color:var(--text-secondary);text-transform:uppercase;font-weight:800">Histórico</div><div id="mentalitaProntuarioCount" style="font-size:18px;font-weight:800;margin-top:3px">—</div></div><div class="patient-info-card" style="padding:12px 15px;flex:1;min-width:220px"><div style="font-size:10px;color:var(--text-secondary);text-transform:uppercase;font-weight:800">Integridade</div><div style="font-size:12px;font-weight:700;margin-top:3px">Registros finalizados recebem hash e não são editados em produção.</div></div></div><div class="patient-info-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><div><h3 style="margin:0 0 3px">Linha do tempo clínica</h3><span style="font-size:11.5px;color:var(--text-secondary)">Do registro mais antigo ao mais recente</span></div><span style="font-size:10px;font-weight:800;padding:6px 9px;border-radius:999px;background:var(--hover-bg)">Fonte oficial: Supabase</span></div><div id="mentalitaPatientProntuarioTimeline">Carregando...</div></div><div class="patient-info-card"><h3 style="margin:0 0 8px">Política de integridade</h3><p style="margin:0;font-size:12px;line-height:1.6;color:var(--text-secondary)">Na versão de produção, registros finalizados não terão edição ou exclusão. Uma correção será um novo lançamento vinculado ao registro original. Auditoria, autoria, data/hora e integridade permanecem associados ao histórico.</p></div></div>`;
  }

  function bindSection() {
    const button = document.getElementById('mentalitaNewProntuarioEntryBtn');
    if (button && button.dataset.bound !== '1') {
      button.dataset.bound = '1';
      button.addEventListener('click', () => { document.getElementById('mentalitaProntuarioModal')?.remove(); document.body.insertAdjacentHTML('beforeend', modalHtml()); document.getElementById('mpClose').addEventListener('click', () => document.getElementById('mentalitaProntuarioModal')?.remove()); document.getElementById('mpDraft').addEventListener('click', () => saveRecord('draft')); document.getElementById('mpForm').addEventListener('submit', e => { e.preventDefault(); saveRecord('finalized'); }); });
    }
    renderTimeline();
    if (typeof refreshIcons === 'function') refreshIcons();
  }

  function install() {
    if (window.__mentalitaPatientProntuarioInstalled) return;
    if (typeof window.renderPatientSectionContent !== 'function') { setTimeout(install, 100); return; }
    const original = window.renderPatientSectionContent;
    window.renderPatientSectionContent = function(section) { const p = getPatient(); if (section === 'prontuario' && p) { const html = sectionHtml(); setTimeout(bindSection, 0); return html; } return original.apply(this, arguments); };
    window.renderPatientProntuario = sectionHtml;
    window.__mentalitaPatientProntuarioInstalled = true;
  }
  install();
})();
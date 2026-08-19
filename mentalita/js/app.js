// js/app.js

function renderPage() {
    const container = getEl('pageContainer');
    if (!container) return;
    const title = getEl('pageTitle');
    const subtitle = getEl('pageSubtitle');
    let html = '';
    try {
        switch (state.currentPage) {
            case 'dashboard': html = buildDashboard(); break;
            case 'agenda': html = buildAgenda(); break;
            case 'atendimentos': html = buildAtendimentos(); break;
            case 'pacientes': html = buildPacientes(); break;
            case 'convenios': html = buildConvenios(); break;
            case 'indicadores': html = buildIndicadores(); break;
            case 'configuracoes': html = buildConfiguracoes(); break;
            default: html = buildDashboard();
        }
    } catch (e) {
        console.error('Erro ao renderizar página:', e);
        html = '<div style="padding:40px;text-align:center;color:#B91C1C;">Erro ao carregar a página.</div>';
    }
    container.innerHTML = html;
    attachPageEvents();
    refreshIcons();
    updateTitleAndSubtitle(title, subtitle);
    if (state.currentPage === 'configuracoes' && typeof updateGoogleCalendarStatus === 'function') updateGoogleCalendarStatus();
}

function updateTitleAndSubtitle(title, subtitle) {
    const titles = {
        dashboard: ['Visão Geral', 'Acompanhe a agenda, os atendimentos e a rotina da clínica.'],
        agenda: ['Agenda', 'Gerencie os horários da clínica.'],
        atendimentos: ['Conversas', 'Central de conversas com pacientes.'],
        pacientes: ['Pacientes', 'Base de pacientes da clínica.'],
        convenios: ['Convênios', 'Cadastre operadoras e planos da clínica.'],
        indicadores: ['Indicadores', 'Visão operacional da clínica.'],
        configuracoes: ['Configurações', 'Gerencie sua clínica.']
    };
    const [t, s] = titles[state.currentPage] || titles.dashboard;
    if (title) title.textContent = t;
    if (subtitle) subtitle.textContent = s;
}

function attachPageEvents() {
    getEl('openModalBtn')?.addEventListener('click', () => openModal());
    getEl('newPatientBtn')?.addEventListener('click', () => openNewPatient());
    getEl('newStaffBtn')?.addEventListener('click', () => openNewStaff());
    getEl('btnConnectCalendar')?.addEventListener('click', async () => { try { const url = await window.pluriAPI.getCalendarAuthUrl(); window.location.href = url; } catch (e) { alert('Erro ao conectar: ' + e.message); } });
    document.querySelectorAll('#agendaTabs .tab').forEach(tab => tab.addEventListener('click', () => { state.agendaTab = tab.dataset.tab; renderPage(); }));
    getEl('agendaPrevDay')?.addEventListener('click', () => { const d = new Date((state.agendaDate || new Date().toISOString().split('T')[0]) + 'T00:00:00'); d.setDate(d.getDate() - 1); state.agendaDate = toDateStr(d); renderPage(); });
    getEl('agendaNextDay')?.addEventListener('click', () => { const d = new Date((state.agendaDate || new Date().toISOString().split('T')[0]) + 'T00:00:00'); d.setDate(d.getDate() + 1); state.agendaDate = toDateStr(d); renderPage(); });
    getEl('agendaPrevMonth')?.addEventListener('click', () => { if (!state.agendaMonth) { const n = new Date(); state.agendaMonth = { year: n.getFullYear(), month: n.getMonth() }; } state.agendaMonth.month -= 1; if (state.agendaMonth.month < 0) { state.agendaMonth.month = 11; state.agendaMonth.year -= 1; } renderPage(); });
    getEl('agendaNextMonth')?.addEventListener('click', () => { if (!state.agendaMonth) { const n = new Date(); state.agendaMonth = { year: n.getFullYear(), month: n.getMonth() }; } state.agendaMonth.month += 1; if (state.agendaMonth.month > 11) { state.agendaMonth.month = 0; state.agendaMonth.year += 1; } renderPage(); });
    document.querySelectorAll('.kpi-card[data-link]').forEach(card => card.addEventListener('click', () => { const page = card.dataset.link; if (page) navigateTo(page); }));
    document.querySelectorAll('.js-nav').forEach(el => { const page = el.dataset.page; if (page) el.addEventListener('click', e => { e.preventDefault(); navigateTo(page); }); });
    document.querySelectorAll('[data-conversation-id]').forEach(el => el.addEventListener('click', () => { const id = el.dataset.conversationId; if (id) openConversation(id); }));
    document.querySelectorAll('[data-patient-row]').forEach(el => el.addEventListener('click', () => { const row = el.dataset.patientRow; if (row) openPatient(row); }));
    document.querySelectorAll('[data-staff-row]').forEach(el => el.addEventListener('click', () => { const row = el.dataset.staffRow; if (row) openStaff(row); }));
    const searchInput = getEl('patientSearch');
    if (searchInput) searchInput.addEventListener('input', e => { const q = e.target.value.toLowerCase(); document.querySelectorAll('#patientTableBody tr').forEach(row => { row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none'; }); });
}

function getSessionToken() {
    const session = window.PLURI_AUTH_SESSION;
    if (window.PLURI_SESSION_VALIDATED && session?.access_token) return session.access_token;
    try { const stored = JSON.parse(localStorage.getItem('pluri_session') || 'null'); if (stored?.token) return stored.token; } catch (_) {}
    window.location.replace('/pluri-login/');
    return null;
}

function buildAtendimentos() {
    return `<div class="card"><div class="card-body" style="padding:56px 32px;text-align:center;"><div style="width:56px;height:56px;margin:0 auto 18px;border-radius:16px;background:var(--hover-bg);display:flex;align-items:center;justify-content:center;"><i data-lucide="message-circle" style="width:28px;height:28px;color:var(--text-secondary);"></i></div><h3 style="margin:0 0 8px;">Conversas</h3><p style="margin:0;color:var(--text-secondary);font-size:14px;">Em breve</p><p style="margin:8px auto 0;max-width:480px;color:var(--text-secondary);font-size:13px;line-height:1.5;">Estamos preparando a central de conversas da Mentalita. Por enquanto, esta área permanece desativada.</p></div></div>`;
}

const MENTALITA_CATALOGO_CONVENIOS_APP = ['Unimed','Bradesco Saúde','SulAmérica Saúde','Amil','Hapvida','NotreDame Intermédica','Porto Saúde','Care Plus','Omint'];
async function seedMentalitaConveniosApp() {
    const client = window.PLURI_SUPABASE;
    const clinicId = window.PLURI_CLINIC?.id;
    if (!client || !clinicId) return;
    const { data: existing, error: readError } = await client.from('mentalita_convenios').select('name').eq('clinic_id', clinicId);
    if (readError) { console.error('[Mentalita] catálogo de convênios:', readError); return; }
    const names = new Set((existing || []).map(c => String(c.name || '').trim().toLowerCase()));
    const missing = MENTALITA_CATALOGO_CONVENIOS_APP.filter(name => !names.has(name.toLowerCase())).map(name => ({ clinic_id: clinicId, name, status: 'Ativo', plans: [], notes: 'Catálogo inicial PLURI' }));
    if (missing.length) { const { error } = await client.from('mentalita_convenios').insert(missing); if (error) console.error('[Mentalita] catálogo inicial:', error); }
}

async function init() {
    if (window.PLURI_AUTH_READY) {
        try { await window.PLURI_AUTH_READY; } catch (e) { console.error('❌ Falha na autenticação:', e); return; }
    }
    const pageTitle = getEl('pageTitle');
    if (pageTitle) pageTitle.textContent = 'Visão Geral';
    if (!window.pluriAPI) window.pluriAPI = new PluriAPI(PLURI_CONFIG);
    const token = getSessionToken();
    if (!token) return;
    window.pluriAPI.setSessionToken(token);
    try {
        const results = await Promise.all([window.pluriAPI.getPatients(), window.pluriAPI.getCalendarAppointments(), window.pluriAPI.getStaff(), window.pluriAPI.getClinic(), window.pluriAPI.getConversations()]);
        state.patients = results[0] || []; state.appointments = results[1] || []; state.staff = results[2] || []; state.clinic = results[3] || {}; state.conversations = results[4] || [];
        await seedMentalitaConveniosApp();
    } catch (e) { console.error('❌ Erro ao carregar dados:', e); state.patients=[]; state.appointments=[]; state.staff=[]; state.conversations=[]; }
    loadTheme();
    getEl('themeToggle')?.addEventListener('click', toggleTheme);
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); navigateTo(a.dataset.page); }));
    getEl('modalClose')?.addEventListener('click', closeModal); getEl('modalCancel')?.addEventListener('click', closeModal); getEl('modalSave')?.addEventListener('click', saveAppointment); getEl('modalOverlay')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); }); getEl('slideOverlay')?.addEventListener('click', closeSlidePanel); getEl('notifBtn')?.addEventListener('click', () => showToast('Nenhuma notificação nova.'));
    renderPage();
    window.pluri = { navigateTo, openConversation, openPatient, openModal, openStaff: typeof openStaff === 'function' ? openStaff : () => {}, showToast, editAppointment: typeof openEditAppointment === 'function' ? openEditAppointment : () => {}, deleteAppointment: deleteAppointmentById, confirmAppointment: confirmAppointmentById, openDayFromMonth };
}

async function deleteAppointmentById(id) { const appt = state.appointments.find(a => String(a.id) === String(id)); if (!appt) return; if (!confirm(`Excluir o agendamento de ${appt.patient}?`)) return; const result = await window.pluriAPI.deleteAppointment(id); if (!result?.success) { showToast(result?.error || 'Erro ao excluir agendamento.'); return; } state.appointments = await window.pluriAPI.getCalendarAppointments(); renderPage(); showToast('Agendamento excluído.'); }
async function confirmAppointmentById(id, phone, patient) { const appt = state.appointments.find(a => String(a.id) === String(id)); if (!appt) return; const result = await window.pluriAPI.updateAppointment({ ...appt, status: 'Confirmado' }); if (!result?.success) { showToast(result?.error || 'Erro ao confirmar agendamento.'); return; } state.appointments = await window.pluriAPI.getCalendarAppointments(); renderPage(); showToast('Agendamento confirmado.'); const cleanPhone = String(phone || '').replace(/\D/g, ''); if (cleanPhone) { const msg = encodeURIComponent(`Olá ${patient}, seu agendamento foi confirmado! ✅`); window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank'); } }

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

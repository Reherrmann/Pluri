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
        atendimentos: ['Atendimentos', 'Central de conversas com pacientes.'],
        pacientes: ['Pacientes', 'Base de pacientes da clínica.'],
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
    getEl('btnConnectCalendar')?.addEventListener('click', async () => {
        try { window.location.href = await window.pluriAPI.getCalendarAuthUrl(); }
        catch (e) { alert('Erro ao conectar: ' + e.message); }
    });
    document.querySelectorAll('#agendaTabs .tab').forEach(tab => tab.addEventListener('click', () => { state.agendaTab = tab.dataset.tab; renderPage(); }));
    getEl('agendaPrevDay')?.addEventListener('click', () => { const d = new Date((state.agendaDate || new Date().toISOString().split('T')[0]) + 'T00:00:00'); d.setDate(d.getDate()-1); state.agendaDate=toDateStr(d); renderPage(); });
    getEl('agendaNextDay')?.addEventListener('click', () => { const d = new Date((state.agendaDate || new Date().toISOString().split('T')[0]) + 'T00:00:00'); d.setDate(d.getDate()+1); state.agendaDate=toDateStr(d); renderPage(); });
    document.querySelectorAll('.kpi-card[data-link]').forEach(card => card.addEventListener('click', () => { if (card.dataset.link) navigateTo(card.dataset.link); }));
    document.querySelectorAll('.js-nav').forEach(el => { const page=el.dataset.page; if(page) el.addEventListener('click',e=>{e.preventDefault();navigateTo(page);}); });
    document.querySelectorAll('[data-conversation-id]').forEach(el => el.addEventListener('click', () => { const id=parseInt(el.dataset.conversationId,10); if(!isNaN(id)) openConversation(id); }));
    document.querySelectorAll('[data-patient-row]').forEach(el => el.addEventListener('click', () => { const row=parseInt(el.dataset.patientRow,10); if(!isNaN(row)) openPatient(row); }));
    document.querySelectorAll('[data-staff-row]').forEach(el => el.addEventListener('click', () => { const row=parseInt(el.dataset.staffRow,10); if(!isNaN(row)) openStaff(row); }));
    const searchInput=getEl('patientSearch');
    if(searchInput) searchInput.addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('#patientTableBody tr').forEach(row=>row.style.display=row.textContent.toLowerCase().includes(q)?'':'none');});
}

async function init() {
    try {
        if (window.PLURI_AUTH_READY) await window.PLURI_AUTH_READY;
        if (!window.PLURI_SESSION_VALIDATED || !window.PLURI_AUTH_SESSION) throw new Error('Sessão Supabase não validada.');
        if (!window.pluriAPI) window.pluriAPI = new PluriAPI(PLURI_CONFIG);
        window.pluriAPI.setSessionToken(window.PLURI_AUTH_SESSION.access_token);
        console.log('🔑 Supabase autenticado:', window.PLURI_AUTH_SESSION.user.email);

        console.log('🔄 Carregando pacientes...'); state.patients = await window.pluriAPI.getPatients(); console.log('✅ Pacientes:', state.patients.length);
        console.log('🔄 Carregando agenda...'); state.appointments = await window.pluriAPI.getCalendarAppointments(); console.log('✅ Agenda:', state.appointments.length);
        console.log('🔄 Carregando equipe...'); state.staff = await window.pluriAPI.getStaff(); console.log('✅ Equipe:', state.staff.length);
        console.log('🔄 Carregando clínica...'); state.clinic = await window.pluriAPI.getClinic(); console.log('✅ Clínica:', state.clinic);
        console.log('🔄 Carregando conversas...'); state.conversations = await window.pluriAPI.getConversations(); console.log('✅ Conversas:', state.conversations.length);
    } catch (e) {
        console.error('❌ Inicialização da Mentalita:', e);
        return;
    }

    loadTheme();
    getEl('themeToggle')?.addEventListener('click', toggleTheme);
    document.querySelectorAll('.sidebar-nav a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigateTo(a.dataset.page);}));
    getEl('modalClose')?.addEventListener('click', closeModal);
    getEl('modalCancel')?.addEventListener('click', closeModal);
    getEl('modalSave')?.addEventListener('click', saveAppointment);
    getEl('modalOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});
    getEl('slideOverlay')?.addEventListener('click', closeSlidePanel);
    getEl('notifBtn')?.addEventListener('click',()=>showToast('Nenhuma notificação nova.'));
    renderPage();
    window.pluri={navigateTo,openConversation,openPatient,openModal,openStaff:typeof openStaff==='function'?openStaff:()=>{},showToast,editAppointment:typeof openEditAppointment==='function'?openEditAppointment:()=>{},deleteAppointment:deleteAppointmentById,confirmAppointment:confirmAppointmentById,openDayFromMonth};
}

async function deleteAppointmentById(id) {
    const appt=state.appointments.find(a=>String(a.id)===String(id)); if(!appt)return;
    if(!confirm(`Excluir o agendamento de ${appt.patient}?`))return;
    const result=await window.pluriAPI.deleteAppointment(id);
    if(!result?.success){showToast(result?.error||'Erro ao excluir agendamento.');return;}
    state.appointments=await window.pluriAPI.getCalendarAppointments();renderPage();showToast('Agendamento excluído.');
}

async function confirmAppointmentById(id,phone,patient) {
    const appt=state.appointments.find(a=>String(a.id)===String(id));if(!appt)return;
    const result=await window.pluriAPI.updateAppointment({...appt,status:'Confirmado'});
    if(!result?.success){showToast(result?.error||'Erro ao confirmar agendamento.');return;}
    state.appointments=await window.pluriAPI.getCalendarAppointments();renderPage();showToast('Agendamento confirmado.');
    const cleanPhone=String(phone||'').replace(/\D/g,'');if(cleanPhone){const msg=encodeURIComponent(`Olá ${patient}, seu agendamento foi confirmado! ✅`);window.open(`https://wa.me/55${cleanPhone}?text=${msg}`,'_blank');}
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();

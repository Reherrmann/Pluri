// Mentalita — inicialização segura da interface
(function(){
  function loadPatientProfileLayout(){
    if(document.getElementById('patientProfileLayoutScript')) return;
    const script=document.createElement('script');
    script.id='patientProfileLayoutScript';
    script.src='js/patient-profile-layout.js?v=mentalita-profile-layout-2';
    script.defer=false;
    document.head.appendChild(script);
  }
  function initMentalitaUI(){
    loadPatientProfileLayout();
    if(window.lucide && typeof window.lucide.createIcons==='function') window.lucide.createIcons();
    const h=document.getElementById('hamburgerBtn');
    const o=document.getElementById('sidebarOverlay');
    const s=document.getElementById('sidebar');
    const toggle=()=>{if(s)s.classList.toggle('open');if(o)o.classList.toggle('show');};
    if(h) h.addEventListener('click',toggle);
    if(o) o.addEventListener('click',toggle);
    const raw=localStorage.getItem('pluri_session');
    if(raw){
      try{
        const u=JSON.parse(raw).user||{};
        const name=document.getElementById('sidebarUserName');
        const role=document.getElementById('sidebarUserRole');
        const clinic=document.getElementById('currentClinicName');
        const avatar=document.getElementById('sidebarUserAvatar');
        if(name) name.textContent=u.nome||u.email||'Usuário';
        if(role) role.textContent=u.perfil||'Usuário';
        if(clinic) clinic.textContent=u.clinica||'Mentalita';
        const parts=String(u.nome||u.email||'U').trim().split(/\s+/);
        if(avatar) avatar.textContent=((parts[0]&&parts[0][0])||'U')+(parts.length>1&&parts[parts.length-1][0]?parts[parts.length-1][0]:'');
        if(avatar) avatar.textContent=avatar.textContent.toUpperCase();
      }catch(e){console.error('[Mentalita] sessão da interface:',e);}
    }
    const logout=document.getElementById('logoutBtn');
    if(logout) logout.addEventListener('click',()=>window.PLURI_LOGOUT&&window.PLURI_LOGOUT());

    document.addEventListener('click', function(e){
      const button=e.target.closest?.('.patient-profile-actions button');
      if(!button) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const patient=window.state?.selectedPatient || (typeof state !== 'undefined' ? state.selectedPatient : null);
      if(patient && typeof window.editPatient==='function') window.editPatient(String(patient._row));
    }, true);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initMentalitaUI); else initMentalitaUI();
})();

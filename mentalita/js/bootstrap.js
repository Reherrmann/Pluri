// Mentalita — inicialização segura da interface
(function(){
  function init(){
    // Os módulos de ficha do paciente (prontuário, financeiro, convênios, guias TISS)
    // agora são carregados estaticamente pelo index.html, em ordem, para evitar a
    // condição de corrida do carregamento assíncrono anterior.
    if(window.lucide&&typeof window.lucide.createIcons==='function')window.lucide.createIcons();
    const h=document.getElementById('hamburgerBtn'),o=document.getElementById('sidebarOverlay'),s=document.getElementById('sidebar'),toggle=()=>{if(s)s.classList.toggle('open');if(o)o.classList.toggle('show');};
    if(h)h.addEventListener('click',toggle);if(o)o.addEventListener('click',toggle);
    const raw=localStorage.getItem('pluri_session');if(raw){try{const u=JSON.parse(raw).user||{},name=document.getElementById('sidebarUserName'),role=document.getElementById('sidebarUserRole'),clinic=document.getElementById('currentClinicName'),avatar=document.getElementById('sidebarUserAvatar');if(name)name.textContent=u.nome||u.email||'Usuário';if(role)role.textContent=u.perfil||'Usuário';if(clinic)clinic.textContent=u.clinica||'Mentalita';const parts=String(u.nome||u.email||'U').trim().split(/\s+/);if(avatar)avatar.textContent=(((parts[0]&&parts[0][0])||'U')+(parts.length>1&&parts[parts.length-1][0]?parts[parts.length-1][0]:'')).toUpperCase();}catch(e){console.error('[Mentalita] sessão:',e);}}
    const logout=document.getElementById('logoutBtn');if(logout)logout.addEventListener('click',()=>window.PLURI_LOGOUT&&window.PLURI_LOGOUT());
    document.addEventListener('click',e=>{const button=e.target.closest?.('.patient-profile-actions button');if(!button)return;e.preventDefault();e.stopImmediatePropagation();const patient=window.state?.selectedPatient||(typeof state!=='undefined'?state.selectedPatient:null);if(patient&&typeof window.editPatient==='function')window.editPatient(String(patient._row));},true);
    const normalize=()=>{const root=document.getElementById('mentalitaPatientProntuarioTimeline');if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(w.nextNode())nodes.push(w.currentNode);nodes.forEach(n=>n.nodeValue=n.nodeValue.replace(/\b(\d{2}\/\d{2}\/\d{4}),\s*\d{2}:\d{2}\b/g,'$1'));};
    const obs=new MutationObserver(normalize),start=()=>{const root=document.getElementById('mentalitaPatientProntuarioTimeline');if(root){obs.observe(root,{childList:true,subtree:true});normalize();return true;}return false;};if(!start()){const po=new MutationObserver(()=>{if(start())po.disconnect();});po.observe(document.body,{childList:true,subtree:true});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

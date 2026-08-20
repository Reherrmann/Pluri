// Mentalita — inicialização segura da interface
(function(){
  function load(src,id){if(document.getElementById(id))return;const s=document.createElement('script');s.id=id;s.src=src;s.defer=false;document.head.appendChild(s);}
  function init(){
    load('js/patient-profile-layout.js?v=mentalita-profile-layout-2','patientProfileLayoutScript');
    load('js/patient-convenio-bridge.js?v=mentalita-patient-convenio-1','patientConvenioBridgeScript');
    load('js/documentos-paciente.js?v=mentalita-patient-documents-1','patientDocumentsModuleScript');
    load('js/prontuario-paciente.js?v=mentalita-patient-prontuario-4','patientProntuarioModuleScript');
    load('js/prontuario-pdf-enhancer.js?v=mentalita-patient-prontuario-pdf-3','patientProntuarioPdfEnhancerScript');
    load('js/prontuario-correcoes.js?v=mentalita-patient-prontuario-correcoes-1','patientProntuarioCorrecoesScript');
    load('js/prontuario-auditoria.js?v=mentalita-patient-prontuario-auditoria-1','patientProntuarioAuditoriaScript');
    load('js/prontuario-anexos.js?v=mentalita-patient-prontuario-anexos-2','patientProntuarioAnexosScript');
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

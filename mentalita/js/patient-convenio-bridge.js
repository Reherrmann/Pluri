// Mentalita — integra o módulo de convênios do paciente ao renderizador da ficha.
(function installPatientConvenioBridge(){
  function install(){
    if(window.__mentalitaPatientConvenioBridgeInstalled) return;
    if(typeof window.renderPatientSectionContent !== 'function' || typeof window.renderPatientConvenioSection !== 'function'){
      setTimeout(install,100);
      return;
    }
    if(typeof window.getInitials !== 'function'){
      window.getInitials=function(name){
        const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
        if(!parts.length) return '?';
        if(parts.length===1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0)+parts[parts.length-1].charAt(0)).toUpperCase();
      };
    }
    const original=window.renderPatientSectionContent;
    window.renderPatientSectionContent=function(section){
      const patient=window.state?.selectedPatient || (typeof state !== 'undefined' ? state.selectedPatient : null);
      if(section==='convenios' && patient){
        return window.renderPatientConvenioSection(patient);
      }
      return original.apply(this,arguments);
    };
    window.__mentalitaPatientConvenioBridgeInstalled=true;
    const patient=window.state?.selectedPatient || (typeof state !== 'undefined' ? state.selectedPatient : null);
    if(patient && window.state?.patientSection==='convenios' && typeof window.renderPatientProfile==='function'){
      window.renderPatientProfile();
    }
  }
  install();
})();

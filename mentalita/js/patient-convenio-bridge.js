// Mentalita — integra o módulo de convênios do paciente ao renderizador da ficha.
(function installPatientConvenioBridge(){
  function install(){
    if(window.__mentalitaPatientConvenioBridgeInstalled) return;
    if(typeof window.renderPatientSectionContent !== 'function' || typeof window.renderPatientConvenioSection !== 'function'){
      setTimeout(install,100);
      return;
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
  }
  install();
})();

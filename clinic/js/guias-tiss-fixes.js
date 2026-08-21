// Mentalita — ajustes de UX das Guias TISS
(function(){
  'use strict';
  function apply(){
    const btn=document.getElementById('mtReady');
    if(btn && btn.textContent.trim()==='Fechar guia') btn.textContent='Liberar para faturamento';
  }
  const obs=new MutationObserver(apply);
  obs.observe(document.body,{childList:true,subtree:true});
  setTimeout(apply,200);
  window.mentalitaGuiasTissFix=apply;
})();

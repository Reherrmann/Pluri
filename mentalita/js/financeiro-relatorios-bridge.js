// Mentalita — entrada do módulo Relatórios no Financeiro
(function(){
  function start(){
    const tabs=document.getElementById('financeiroTabs');
    if(!tabs||tabs.dataset.relatoriosReady)return;
    tabs.dataset.relatoriosReady='1';
    if(!tabs.querySelector('[data-tab="relatorios"]')){
      const b=document.createElement('button');b.type='button';b.className='tab';b.dataset.tab='relatorios';b.textContent='Relatórios';tabs.appendChild(b);
    }
    tabs.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;tabs.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');if(typeof window.renderFinanceiroTab==='function')window.renderFinanceiroTab(b.dataset.tab)});
    if(window.state?.currentPage==='financeiro'&&typeof window.renderFinanceiroTab==='function'&&document.getElementById('financeiroContent')?.innerHTML==='')window.renderFinanceiroTab('overview');
  }
  const observer=new MutationObserver(start);function boot(){start();const c=document.getElementById('pageContainer');if(c)observer.observe(c,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

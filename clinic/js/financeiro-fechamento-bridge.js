// Mentalita — integra o Fechamento à navegação do Financeiro
(function(){
  function init(){
    if(typeof window.buildFinanceiro==='function'&&!window.buildFinanceiro.__fechamentoTab){
      const base=window.buildFinanceiro;
      const build=function(){return base().replace('<button class="tab" data-tab="repasses">Repasses</button>','<button class="tab" data-tab="repasses">Repasses</button><button class="tab" data-tab="fechamento">Fechamento</button>')};
      build.__fechamentoTab=true;window.buildFinanceiro=build;
    }
    if(typeof window.renderFinanceiroTab==='function'&&!window.renderFinanceiroTab.__fechamentoTab){
      const base=window.renderFinanceiroTab;
      const render=async function(tab){if(tab==='fechamento')return window.renderFinanceiroFechamento?.();return base(tab)};
      render.__fechamentoTab=true;window.renderFinanceiroTab=render;
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

// Mentalita — Financeiro (estrutura inicial)
(function(){
'use strict';
if(window.__mentalitaFinanceiro)return;
window.__mentalitaFinanceiro=true;
const S=()=>window.PLURI_SUPABASE||null;
const C=()=>window.PLURI_CLINIC?.id||null;
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
let activeTab='visao';
function tabs(){return `<div class="finance-tabs">${[['visao','Visão geral'],['receitas','Receitas'],['despesas','Despesas'],['contas-receber','Contas a receber'],['contas-pagar','Contas a pagar'],['repasses','Repasses']].map(([id,t])=>`<button type="button" class="finance-tab ${activeTab===id?'active':''}" data-finance-tab="${id}">${t}</button>`).join('')}</div>`;}
function shell(body){return `<div class="finance-shell">${tabs()}${body}</div>`;}
function overview(){return `<div class="finance-kpis"><div class="finance-kpi"><small>Receitas</small><strong>R$ 0,00</strong><span>Período atual</span></div><div class="finance-kpi"><small>Despesas</small><strong>R$ 0,00</strong><span>Período atual</span></div><div class="finance-kpi"><small>A receber</small><strong>R$ 0,00</strong><span>Em aberto</span></div><div class="finance-kpi"><small>A pagar</small><strong>R$ 0,00</strong><span>Em aberto</span></div><div class="finance-kpi"><small>Saldo</small><strong>R$ 0,00</strong><span>Período atual</span></div></div><div class="finance-card"><h3>Financeiro da clínica</h3><p>Esta é a Central Financeira da Mentalita. Os valores serão conectados às receitas, despesas, contas e repasses nas próximas etapas.</p></div>`;}
function placeholder(title,text){return `<div class="finance-card"><div><h3>${title}</h3><p>${text}</p></div><div class="finance-empty">Nenhum lançamento registrado ainda.</div></div>`;}
async function render(){const host=document.getElementById('financeiroWorkspace');if(!host)return;host.innerHTML='<div class="finance-card"><div class="finance-empty">Carregando financeiro…</div></div>';try{let body=overview();if(activeTab==='receitas')body=placeholder('Receitas','Registre e acompanhe as entradas financeiras da clínica.');if(activeTab==='despesas')body=placeholder('Despesas','Controle custos, despesas fixas e variáveis.');if(activeTab==='contas-receber')body=placeholder('Contas a receber','Acompanhe valores previstos e recebimentos pendentes.');if(activeTab==='contas-pagar')body=placeholder('Contas a pagar','Acompanhe compromissos financeiros e pagamentos.');if(activeTab==='repasses')body=placeholder('Repasses','Controle repasses de convênios e profissionais.');host.innerHTML=shell(body);}catch(e){console.error('[Mentalita Financeiro]',e);host.innerHTML=`<div class="finance-card finance-error"><h3>Erro ao carregar Financeiro</h3><pre>${esc(e?.message||e)}</pre></div>`;}}
function bind(){document.addEventListener('click',e=>{const b=e.target.closest?.('[data-finance-tab]');if(!b)return;activeTab=b.dataset.financeTab;render();});}
window.buildFinanceiro=function(){return `<div id="financeiroWorkspace"></div>`;};
window.renderFinanceiro=render;
bind();
})();

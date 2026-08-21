// Mentalita — Relatórios Financeiros
(function(){
  function init(){
    if(typeof window.renderFinanceiroTab!=='function'||window.__financeiroRelatoriosReady)return;
    const original=window.renderFinanceiroTab;window.__financeiroRelatoriosReady=true;
    window.renderFinanceiroTab=async function(tab){
      if(tab!=='relatorios')return original(tab);
      const c=document.getElementById('financeiroContent');if(!c)return original(tab);
      const sb=window.PLURI_SUPABASE,clinic=window.PLURI_CLINIC?.id||'';
      const n=new Date(),f=new Date(n.getFullYear(),n.getMonth(),1),l=new Date(n.getFullYear(),n.getMonth()+1,0),iso=d=>d.toISOString().slice(0,10),br=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
      c.innerHTML=`<div class="card"><div class="card-header" style="display:flex;align-items:end;gap:12px;flex-wrap:wrap"><div><h3>Relatórios financeiros</h3><p style="font-size:13px;color:var(--text-secondary);margin-top:2px">Consolide os movimentos financeiros do período.</p></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-left:auto"><div class="form-group" style="margin:0"><label for="finReportStart">De</label><input id="finReportStart" type="date" value="${iso(f)}"></div><div class="form-group" style="margin:0"><label for="finReportEnd">Até</label><input id="finReportEnd" type="date" value="${iso(l)}"></div><button class="btn btn-primary" id="finReportApply" type="button">Gerar relatório</button></div></div></div><div id="finReportBody" style="margin-top:16px"></div>`;
      async function load(){
        const s=document.getElementById('finReportStart').value,e=document.getElementById('finReportEnd').value;if(!s||!e||s>e){showToast('Informe um período válido.');return;}
        const [r,x,ar,ap,rp]=await Promise.all([sb.from('mentalita_financial_revenues').select('*').eq('clinic_id',clinic).gte('received_at',s).lte('received_at',e),sb.from('mentalita_financial_expenses').select('*').eq('clinic_id',clinic).gte('due_at',s).lte('due_at',e),sb.from('mentalita_financial_receivables').select('*').eq('clinic_id',clinic).gte('due_at',s).lte('due_at',e),sb.from('mentalita_financial_payables').select('*').eq('clinic_id',clinic).gte('due_at',s).lte('due_at',e),sb.from('mentalita_financial_repasses').select('*').eq('clinic_id',clinic).gte('period_end',s).lte('period_end',e)]);
        const bad=[r,x,ar,ap,rp].find(q=>q.error);if(bad){console.error(bad.error);showToast('Não foi possível gerar o relatório.');return;}
        const R=r.data||[],X=x.data||[],AR=ar.data||[],AP=ap.data||[],RP=rp.data||[],sum=(a,field='amount')=>a.reduce((z,v)=>z+Number(v[field]||0),0),rec=sum(R.filter(v=>v.status==='received')),des=sum(X.filter(v=>v.status==='paid')),pendingR=sum(AR.filter(v=>v.status==='pending')),pendingP=sum(AP.filter(v=>v.status==='pending')),rep=sum(RP.filter(v=>v.status!=='cancelled'));
        document.getElementById('finReportBody').innerHTML=`<div class="kpi-row"><div class="kpi-card"><div class="kpi-label">Receitas recebidas</div><div class="kpi-value">${br(rec)}</div></div><div class="kpi-card"><div class="kpi-label">Despesas pagas</div><div class="kpi-value">${br(des)}</div></div><div class="kpi-card"><div class="kpi-label">Resultado</div><div class="kpi-value">${br(rec-des)}</div></div><div class="kpi-card"><div class="kpi-label">A receber</div><div class="kpi-value">${br(pendingR)}</div></div><div class="kpi-card"><div class="kpi-label">A pagar</div><div class="kpi-value">${br(pendingP)}</div></div></div><div class="card" style="margin-top:16px"><div class="card-header"><h3>Detalhamento</h3></div><div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px"><div><div class="kpi-label">Recebimentos</div><strong>${R.filter(v=>v.status==='received').length}</strong></div><div><div class="kpi-label">Pagamentos</div><strong>${X.filter(v=>v.status==='paid').length}</strong></div><div><div class="kpi-label">Contas vencidas a receber</div><strong>${AR.filter(v=>v.status==='pending'&&v.due_at<e).length}</strong></div><div><div class="kpi-label">Contas vencidas a pagar</div><strong>${AP.filter(v=>v.status==='pending'&&v.due_at<e).length}</strong></div><div><div class="kpi-label">Repasses</div><strong>${br(rep)}</strong></div></div></div></div>`;
      }
      document.getElementById('finReportApply').addEventListener('click',load);await load();
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

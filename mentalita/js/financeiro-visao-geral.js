// Mentalita — Visão Geral Financeira
(function(){
  function init(){
    if(typeof window.renderFinanceiroTab!=='function') return;
    const original=window.renderFinanceiroTab;
    if(original.__overviewEnhanced)return;
    async function enhanced(tab){
      if(tab!=='overview')return original(tab);
      const c=document.getElementById('financeiroContent');if(!c)return original(tab);
      const sb=window.PLURI_SUPABASE,clinic=window.PLURI_CLINIC?.id||'';
      const now=new Date(),first=new Date(now.getFullYear(),now.getMonth(),1),last=new Date(now.getFullYear(),now.getMonth()+1,0);
      const iso=d=>d.toISOString().slice(0,10),br=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
      c.innerHTML=`<div class="card" style="margin-bottom:16px"><div class="card-header" style="display:flex;align-items:end;gap:12px;flex-wrap:wrap"><div><h3>Visão geral</h3><p style="font-size:13px;color:var(--text-secondary);margin-top:2px">Resumo financeiro do período selecionado.</p></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-left:auto"><div class="form-group" style="margin:0"><label for="finOverviewStart">De</label><input id="finOverviewStart" type="date" value="${iso(first)}"></div><div class="form-group" style="margin:0"><label for="finOverviewEnd">Até</label><input id="finOverviewEnd" type="date" value="${iso(last)}"></div><button class="btn btn-primary" id="finOverviewApply" type="button">Aplicar</button></div></div></div><div id="finOverviewMetrics"></div>`;
      async function load(){
        const s=document.getElementById('finOverviewStart').value,e=document.getElementById('finOverviewEnd').value;
        if(!s||!e||s>e){showToast('Informe um período válido.');return;}
        const [r,x,ar,ap,rp]=await Promise.all([
          sb.from('mentalita_financial_revenues').select('*').eq('clinic_id',clinic).gte('received_at',s).lte('received_at',e),
          sb.from('mentalita_financial_expenses').select('*').eq('clinic_id',clinic).gte('due_at',s).lte('due_at',e),
          sb.from('mentalita_financial_receivables').select('*').eq('clinic_id',clinic).gte('due_at',s).lte('due_at',e),
          sb.from('mentalita_financial_payables').select('*').eq('clinic_id',clinic).gte('due_at',s).lte('due_at',e),
          sb.from('mentalita_financial_repasses').select('*').eq('clinic_id',clinic).gte('period_end',s).lte('period_end',e)
        ]);
        const err=[r,x,ar,ap,rp].find(q=>q.error);if(err){console.error(err.error);showToast('Não foi possível carregar o resumo.');return;}
        const R=r.data||[],X=x.data||(),AR=ar.data||[],AP=ap.data||[],RP=rp.data||[];
        const received=R.filter(a=>a.status==='received').reduce((n,a)=>n+Number(a.amount||0),0),paid=X.filter(a=>a.status==='paid').reduce((n,a)=>n+Number(a.amount||0),0),toReceive=AR.filter(a=>a.status==='pending').reduce((n,a)=>n+Number(a.amount||0),0),toPay=AP.filter(a=>a.status==='pending').reduce((n,a)=>n+Number(a.amount||0),0),repasse=RP.filter(a=>a.status!=='cancelled').reduce((n,a)=>n+Number(a.amount??a.repasse_amount??0),0);
        const today=iso(new Date()),overR=AR.filter(a=>a.status==='pending'&&a.due_at<today),overP=AP.filter(a=>a.status==='pending'&&a.due_at<today);
        document.getElementById('finOverviewMetrics').innerHTML=`<div class="kpi-row"><div class="kpi-card"><div class="kpi-label">Receitas</div><div class="kpi-value">${br(received)}</div><div class="kpi-sub">${R.filter(a=>a.status==='received').length} recebimentos</div></div><div class="kpi-card"><div class="kpi-label">Despesas</div><div class="kpi-value">${br(paid)}</div><div class="kpi-sub">${X.filter(a=>a.status==='paid').length} pagamentos</div></div><div class="kpi-card"><div class="kpi-label">Saldo</div><div class="kpi-value">${br(received-paid)}</div></div><div class="kpi-card"><div class="kpi-label">A receber</div><div class="kpi-value">${br(toReceive)}</div><div class="kpi-sub">Vencido: ${br(overR.reduce((n,a)=>n+Number(a.amount||0),0))}</div></div><div class="kpi-card"><div class="kpi-label">A pagar</div><div class="kpi-value">${br(toPay)}</div><div class="kpi-sub">Vencido: ${br(overP.reduce((n,a)=>n+Number(a.amount||0),0))}</div></div></div><div class="card" style="margin-top:16px"><div class="card-header"><h3>Resumo do período</h3></div><div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px"><div><div class="kpi-label">Repasses</div><strong>${br(repasse)}</strong></div><div><div class="kpi-label">Contas vencidas a receber</div><strong>${overR.length}</strong></div><div><div class="kpi-label">Contas vencidas a pagar</div><strong>${overP.length}</strong></div><div><div class="kpi-label">Movimentações</div><strong>${R.length+X.length+AR.length+AP.length+RP.length}</strong></div></div></div></div>`;
      }
      document.getElementById('finOverviewApply').addEventListener('click',load);await load();
    }
    enhanced.__overviewEnhanced=true;window.renderFinanceiroTab=enhanced;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

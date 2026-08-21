// Mentalita — Indicadores
(function(){
  function money(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0))}
  function status(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function iso(d){return d.toISOString().slice(0,10)}
  function periodValue(v,s,e){if(!v)return false;const x=String(v).slice(0,10);return x>=s&&x<=e}
  async function build(){
    const sb=window.PLURI_SUPABASE,clinic=window.PLURI_CLINIC?.id||'';
    if(!sb||!clinic)return '<div class="card"><div class="card-body">Indicadores indisponíveis.</div></div>';
    const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),1),end=new Date(now.getFullYear(),now.getMonth()+1,0),s=iso(start),e=iso(end);
    const A=Array.isArray(window.state?.appointments)?window.state.appointments:[],P=Array.isArray(window.state?.patients)?window.state.patients:[];
    const [r,ex,ar,ap,rp]=await Promise.all([sb.from('mentalita_financial_revenues').select('*').eq('clinic_id',clinic),sb.from('mentalita_financial_expenses').select('*').eq('clinic_id',clinic),sb.from('mentalita_financial_receivables').select('*').eq('clinic_id',clinic),sb.from('mentalita_financial_payables').select('*').eq('clinic_id',clinic),sb.from('mentalita_financial_repasses').select('*').eq('clinic_id',clinic)]);
    const R=r.error?[]:r.data||[],X=ex.error?[]:ex.data||[],AR=ar.error?[]:ar.data||[],AP=ap.error?[]:ap.data||[],RP=rp.error?[]:rp.data||[];
    const monthA=A.filter(x=>periodValue(x.date||x.start_date,s,e));
    const confirmed=monthA.filter(x=>['confirmado','confirmada','confirmed'].includes(status(x.status))).length;
    const cancelled=monthA.filter(x=>['cancelado','cancelada','cancelled'].includes(status(x.status))).length;
    const received=R.filter(x=>periodValue(x.received_at,s,e)&&['received','recebido','recebida'].includes(status(x.status))).reduce((n,x)=>n+Number(x.amount||x.value||0),0);
    const paid=X.filter(x=>periodValue(x.paid_at||x.due_at,s,e)&&['paid','pago','paga'].includes(status(x.status))).reduce((n,x)=>n+Number(x.amount||x.value||0),0);
    const pendingReceive=AR.filter(x=>['pending','pendente'].includes(status(x.status))).reduce((n,x)=>n+Number(x.amount||x.value||0),0);
    const pendingPay=AP.filter(x=>['pending','pendente'].includes(status(x.status))).reduce((n,x)=>n+Number(x.amount||x.value||0),0);
    const rep=RP.filter(x=>!['cancelled','cancelado','cancelada'].includes(status(x.status))).reduce((n,x)=>n+Number(x.amount||x.repasse_amount||x.value||0),0);
    const today=iso(now);
    const overdueR=AR.filter(x=>['pending','pendente'].includes(status(x.status))&&String(x.due_at||'').slice(0,10)<today).reduce((n,x)=>n+Number(x.amount||x.value||0),0);
    const overdueP=AP.filter(x=>['pending','pendente'].includes(status(x.status))&&String(x.due_at||'').slice(0,10)<today).reduce((n,x)=>n+Number(x.amount||x.value||0),0);
    const confirmation=monthA.length?Math.round(confirmed/monthA.length*100):0;
    const cards=[['Agendamentos',monthA.length],['Pacientes cadastrados',P.length],['Taxa de confirmação',confirmation+'%'],['Receita recebida',money(received)],['Despesas pagas',money(paid)],['Resultado',money(received-paid)],['A receber',money(pendingReceive)],['A pagar',money(pendingPay)]];
    return `<div class="card" style="margin-bottom:16px"><div class="card-header"><div><h3>Indicadores</h3><p style="font-size:13px;color:var(--text-secondary);margin-top:3px">Visão consolidada da operação da clínica.</p></div><span style="font-size:13px;color:var(--text-secondary)">${start.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</span></div></div><div class="kpi-row">${cards.map(c=>`<div class="kpi-card"><div class="kpi-value">${c[1]}</div><div class="kpi-label">${c[0]}</div></div>`).join('')}</div><div class="grid-2" style="margin-top:16px"><div class="card"><div class="card-header"><h3>Agenda</h3></div><div class="card-body"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px"><div><div class="kpi-label">Confirmados</div><strong>${confirmed}</strong></div><div><div class="kpi-label">Cancelados</div><strong>${cancelled}</strong></div><div><div class="kpi-label">Total</div><strong>${monthA.length}</strong></div></div></div></div><div class="card"><div class="card-header"><h3>Financeiro</h3></div><div class="card-body"><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px"><div><div class="kpi-label">Vencido a receber</div><strong>${money(overdueR)}</strong></div><div><div class="kpi-label">Vencido a pagar</div><strong>${money(overdueP)}</strong></div><div><div class="kpi-label">Repasses</div><strong>${money(rep)}</strong></div><div><div class="kpi-label">Saldo disponível</div><strong>${money(received-paid)}</strong></div></div></div></div></div><div class="card" style="margin-top:12px"><div class="card-body" style="padding:12px 16px"><p style="margin:0;color:var(--text-secondary)">Os indicadores usam os dados já carregados pela Mentalita e os registros financeiros do banco de dados.</p></div></div>`;
  }
  window.buildIndicadores=build;
})();

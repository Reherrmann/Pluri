// Mentalita — Indicadores
(function(){
  function money(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0))}
  function date(v){return v?new Date(v+'T00:00:00'):null}
  function iso(d){return d.toISOString().slice(0,10)}
  function status(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  async function build(){
    const sb=window.PLURI_SUPABASE,clinic=window.PLURI_CLINIC?.id||''; if(!sb||!clinic)return '<div class="card"><div class="card-body">Indicadores indisponíveis.</div></div>';
    const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),1),end=new Date(now.getFullYear(),now.getMonth()+1,0),s=iso(start),e=iso(end);
    const [a,p,r,ex,ar,ap,rp]=await Promise.all([
      sb.from('appointments').select('*').eq('clinic_id',clinic),
      sb.from('patients').select('*').eq('clinic_id',clinic),
      sb.from('mentalita_financial_revenues').select('*').eq('clinic_id',clinic),
      sb.from('mentalita_financial_expenses').select('*').eq('clinic_id',clinic),
      sb.from('mentalita_financial_receivables').select('*').eq('clinic_id',clinic),
      sb.from('mentalita_financial_payables').select('*').eq('clinic_id',clinic),
      sb.from('mentalita_financial_repasses').select('*').eq('clinic_id',clinic)
    ]);
    const A=a.error?[]:a.data||[],P=p.error?[]:p.data||[],R=r.error?[]:r.data||[],X=ex.error?[]:ex.data||[],AR=ar.error?[]:ar.data||[],AP=ap.error?[]:ap.data||[],RP=rp.error?[]:rp.data||[];
    const inPeriod=v=>{const d=date(v);return d&&v>=s&&v<=e};
    const monthA=A.filter(x=>inPeriod(x.date||x.start_date)), confirmed=monthA.filter(x=>['confirmado','confirmada'].includes(status(x.status))).length,cancelled=monthA.filter(x=>['cancelado','cancelada'].includes(status(x.status))).length;
    const received=R.filter(x=>inPeriod(x.received_at)&&status(x.status)==='received').reduce((n,x)=>n+Number(x.amount||0),0),paid=X.filter(x=>inPeriod(x.paid_at||x.due_at)&&status(x.status)==='paid').reduce((n,x)=>n+Number(x.amount||0),0),pendingReceive=AR.filter(x=>status(x.status)==='pending').reduce((n,x)=>n+Number(x.amount||0),0),pendingPay=AP.filter(x=>status(x.status)==='pending').reduce((n,x)=>n+Number(x.amount||0),0),rep=RP.filter(x=>status(x.status)!=='cancelled').reduce((n,x)=>n+Number(x.amount??x.repasse_amount??0),0);
    const overdueR=AR.filter(x=>status(x.status)==='pending'&&x.due_at<iso(now)).reduce((n,x)=>n+Number(x.amount||0),0), overdueP=AP.filter(x=>status(x.status)==='pending'&&x.due_at<iso(now)).reduce((n,x)=>n+Number(x.amount||0),0),confirmation=monthA.length?Math.round(confirmed/monthA.length*100):0;
    const cards=[['Agendamentos',monthA.length],['Pacientes cadastrados',P.length],['Taxa de confirmação',confirmation+'%'],['Receita recebida',money(received)],['Despesas pagas',money(paid)],['Resultado',money(received-paid)],['A receber',money(pendingReceive)],['A pagar',money(pendingPay)]];
    return `<div class="card" style="margin-bottom:16px"><div class="card-header"><div><h3>Indicadores</h3><p style="font-size:13px;color:var(--text-secondary);margin-top:3px">Visão consolidada da operação da clínica.</p></div><span style="font-size:13px;color:var(--text-secondary)">${start.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</span></div></div><div class="kpi-row">${cards.map(c=>`<div class="kpi-card"><div class="kpi-value">${c[1]}</div><div class="kpi-label">${c[0]}</div></div>`).join('')}</div><div class="grid-2" style="margin-top:16px"><div class="card"><div class="card-header"><h3>Agenda</h3></div><div class="card-body"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px"><div><div class="kpi-label">Confirmados</div><strong>${confirmed}</strong></div><div><div class="kpi-label">Cancelados</div><strong>${cancelled}</strong></div><div><div class="kpi-label">Total</div><strong>${monthA.length}</strong></div></div></div></div><div class="card"><div class="card-header"><h3>Financeiro</h3></div><div class="card-body"><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px"><div><div class="kpi-label">Vencido a receber</div><strong>${money(overdueR)}</strong></div><div><div class="kpi-label">Vencido a pagar</div><strong>${money(overdueP)}</strong></div><div><div class="kpi-label">Repasses</div><strong>${money(rep)}</strong></div><div><div class="kpi-label">Saldo disponível</div><strong>${money(received-paid)}</strong></div></div></div></div></div><div class="card" style="margin-top:16px"><div class="card-header"><h3>Leitura rápida</h3></div><div class="card-body"><p style="margin:0;color:var(--text-secondary)">Os indicadores são calculados automaticamente a partir dos dados disponíveis na Agenda, Pacientes e Financeiro. Registros ausentes ou sem dados válidos não são inventados.</p></div></div>`;
  }
  window.buildIndicadores=build;
})();

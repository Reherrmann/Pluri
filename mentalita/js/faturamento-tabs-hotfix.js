// Mentalita — hotfix da central de faturamento
(function(){
  'use strict';
  const S=()=>window.PLURI_SUPABASE||null;
  const C=()=>window.PLURI_CLINIC?.id||null;
  const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
  const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const css=`<style>#billingWorkspace .billing-hotfix{display:flex;flex-direction:column;gap:14px}#billingWorkspace .billing-hf-card{background:var(--surface,#fff);border:1px solid var(--border);border-radius:14px;padding:18px}#billingWorkspace .billing-hf-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}#billingWorkspace .billing-hf-head h3{margin:0;font-size:16px}#billingWorkspace .billing-hf-head p{margin:4px 0 0;color:var(--text-secondary);font-size:12px}#billingWorkspace .billing-hf-list{border-top:1px solid var(--border)}#billingWorkspace .billing-hf-row{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid var(--border)}#billingWorkspace .billing-hf-row:last-child{border-bottom:0}#billingWorkspace .billing-hf-note{font-size:12px;color:var(--text-secondary);margin-top:4px}#billingWorkspace .billing-hf-status{display:inline-flex;padding:5px 9px;border-radius:999px;background:#eef2f6;color:#526579;font-size:11px;font-weight:600}#billingWorkspace .billing-hf-empty{padding:18px 0;color:var(--text-secondary);font-size:13px}@media(max-width:650px){#billingWorkspace .billing-hf-row{align-items:flex-start;flex-direction:column}#billingWorkspace .billing-hf-row .btn{width:100%}}</style>`;
  function activeTab(){return document.querySelector('.billing-tab.active')?.dataset?.billingTab||'visao';}
  function markTab(name){document.querySelectorAll('.billing-tab').forEach(b=>{const on=b.dataset.billingTab===name;b.classList.toggle('active',on);b.classList.toggle('btn-primary',on);});}
  async function glosas(host){
    const c=S();
    if(!c||!C()){host.innerHTML=css+'<div class="billing-clean billing-hotfix"><div class="billing-hf-card"><div class="billing-hf-empty">Não foi possível carregar as glosas.</div></div></div>';return;}
    const q=await c.from('mentalita_billing_denials').select('id,guide_id,lot_id,amount,reason,status,created_at').eq('clinic_id',C()).order('created_at',{ascending:false});
    if(q.error){console.error('[Mentalita Glosas]',q.error);host.innerHTML=css+'<div class="billing-clean billing-hotfix"><div class="billing-hf-card"><div class="billing-hf-empty">Não foi possível carregar as glosas.</div></div></div>';return;}
    const rows=q.data||[];
    host.innerHTML=css+`<div class="billing-clean billing-hotfix"><div class="billing-hf-card"><div class="billing-hf-head"><div><h3>Glosas</h3><p>Recusas e valores não reconhecidos pelos convênios.</p></div><button class="btn" type="button" disabled>+ Registrar glosa</button></div><div class="billing-hf-list">${rows.length?rows.map(g=>`<div class="billing-hf-row"><div><strong>${money(g.amount)}</strong><div class="billing-hf-note">${esc(g.reason||'Sem motivo informado')} · ${g.guide_id?'Guia vinculada':'Sem guia'} · ${g.lot_id?'Lote vinculado':'Sem lote'}</div></div><span class="billing-hf-status">${esc(g.status==='resolved'?'Resolvida':'Em aberto')}</span></div>`).join(''):'<div class="billing-hf-empty">Nenhuma glosa registrada.</div>'}</div></div></div>`;
  }
  async function recebimentos(host){
    const c=S();if(!c||!C()){host.innerHTML=css+'<div class="billing-clean billing-hotfix"><div class="billing-hf-card"><div class="billing-hf-empty">Não foi possível carregar os recebimentos.</div></div></div>';return;}
    const q=await c.from('mentalita_billing_receipts').select('id,lot_id,received_at,amount,status,reference,notes,created_at').eq('clinic_id',C()).order('received_at',{ascending:false});
    if(q.error){console.error('[Mentalita Recebimentos]',q.error);host.innerHTML=css+'<div class="billing-clean billing-hotfix"><div class="billing-hf-card"><div class="billing-hf-empty">Não foi possível carregar os recebimentos.</div></div></div>';return;}
    const rows=q.data||[];
    host.innerHTML=css+`<div class="billing-clean billing-hotfix"><div class="billing-hf-card"><div class="billing-hf-head"><div><h3>Recebimentos</h3><p>Pagamentos recebidos dos convênios.</p></div></div><div class="billing-hf-list">${rows.length?rows.map(r=>`<div class="billing-hf-row"><div><strong>${money(r.amount)}</strong><div class="billing-hf-note">${esc(r.received_at||'—')} · ${esc(r.reference||'Sem referência')}${r.lot_id?' · Lote vinculado':''}</div></div><span class="billing-hf-status">${esc(r.status||'Recebido')}</span></div>`).join(''):'<div class="billing-hf-empty">Nenhum recebimento registrado.</div>'}</div></div></div>`;
  }
  function renderActive(){
    const host=document.getElementById('billingWorkspace');if(!host)return;
    const tab=activeTab();
    if(tab==='glosas')return glosas(host);
    if(tab==='recebimentos')return recebimentos(host);
    if(window.mentalitaFaturamentoFix){window.mentalitaFaturamentoFix();return;}
  }
  document.addEventListener('click',function(e){
    const btn=e.target.closest?.('.billing-tab');if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();
    const name=btn.dataset.billingTab;markTab(name);
    const host=document.getElementById('billingWorkspace');
    if(name==='glosas'||name==='recebimentos'){if(host)host.innerHTML='<div class="billing-clean billing-hotfix"><div class="billing-hf-card"><div class="billing-hf-empty">Carregando…</div></div></div>';Promise.resolve(renderActive()).catch(console.error);}
    else if(window.mentalitaFaturamentoFix)window.mentalitaFaturamentoFix();
  },true);
  const boot=()=>{setTimeout(()=>{if(activeTab()==='glosas'||activeTab()==='recebimentos')renderActive();},0);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
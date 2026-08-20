// Mentalita — ajustes do faturamento TISS
(function(){
  'use strict';
  const S=()=>window.PLURI_SUPABASE||null,C=()=>window.PLURI_CLINIC?.id||null;
  const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
  const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  let scheduled=false;
  async function fixDrafts(){
    const host=document.getElementById('billingWorkspace');
    if(!host)return;
    const c=S();if(!c||!C())return;
    const {data,error}=await c.from('mentalita_patient_tiss_guides').select('id,patient_id,guide_number,execution_date,total_amount,status').eq('clinic_id',C()).eq('status','draft').order('created_at',{ascending:false});
    if(error)return;
    const drafts=data||[];
    const key=drafts.map(x=>x.id).join('|');
    const section=host.querySelector('.billing-drafts-fix');
    if(!drafts.length){section?.remove();return;}
    if(section?.dataset.key===key)return;
    const ids=drafts.map(x=>x.patient_id);
    let names={};
    if(ids.length){const r=await c.from('mentalita_patients').select('id,name').in('id',ids);names=Object.fromEntries((r.data||[]).map(x=>[x.id,x.name]));}
    const html=`<div class="billing-drafts-fix" data-key="${esc(key)}" style="margin-top:22px;padding-top:16px;border-top:1px solid var(--border)"><h3 style="margin:0">Rascunhos</h3><p class="section-subtitle">Guias criadas, mas ainda não fechadas para faturamento.</p>${drafts.slice(0,20).map(g=>`<div class="billing-row"><div><strong>${esc(names[g.patient_id]||'Paciente')}</strong><div class="billing-note">Guia ${esc(g.guide_number||'sem número')} · ${esc(g.execution_date||'—')} · ${money(g.total_amount)}</div></div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:11px;padding:6px 10px;border-radius:999px;background:#eef2f6">Rascunho</span><button type="button" class="btn billing-close-draft" data-id="${g.id}">Fechar guia</button></div></div>`).join('')}</div>`;
    if(section)section.outerHTML=html;else host.insertAdjacentHTML('beforeend',html);
    host.querySelectorAll('.billing-close-draft').forEach(btn=>btn.onclick=async()=>{
      btn.disabled=true;btn.textContent='Fechando…';
      const r=await c.from('mentalita_patient_tiss_guides').update({status:'ready',updated_at:new Date().toISOString()}).eq('id',btn.dataset.id).eq('clinic_id',C());
      if(r.error){btn.disabled=false;btn.textContent='Fechar guia';console.error('[Mentalita Faturamento]',r.error);alert('Não foi possível fechar a guia.');return;}
      const tab=document.querySelector('.billing-tab[data-billing-tab="guias"]');
      if(tab){document.querySelectorAll('.billing-tab').forEach(x=>x.classList.remove('active','btn-primary'));tab.classList.add('active');tab.click();}
      setTimeout(fixDrafts,150);
    });
  }
  function fixTabs(){
    const tabs=document.querySelectorAll('.billing-tab');
    tabs.forEach(btn=>btn.classList.remove('btn-primary'));
    const active=document.querySelector('.billing-tab.active');
    tabs.forEach(x=>{if(active&&x!==active)x.classList.remove('active','btn-primary');});
  }
  function run(){
    fixTabs();
    if(scheduled)return;
    scheduled=true;
    setTimeout(()=>{scheduled=false;fixDrafts();},80);
  }
  document.addEventListener('click',e=>{if(e.target.closest?.('.billing-tab'))setTimeout(run,30);});
  const obs=new MutationObserver(()=>{if(document.getElementById('billingWorkspace'))run();});
  obs.observe(document.body,{childList:true,subtree:true});
  setTimeout(run,300);
  window.mentalitaFaturamentoFix=run;
})();

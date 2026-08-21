// Mentalita — sincronização automática Faturamento ↔ Financeiro
(function(){
  'use strict';
  const sb=()=>window.PLURI_SUPABASE, clinic=()=>window.PLURI_CLINIC?.id||'';
  async function sync(){
    const db=sb(),cid=clinic(); if(!db||!cid)return;
    try{
      const lots=await db.from('mentalita_billing_lots').select('id,lot_number,total_amount,status,created_at').eq('clinic_id',cid);
      if(lots.error)throw lots.error;
      for(const lot of (lots.data||[])){
        if(!lot.id||!(Number(lot.total_amount)>0))continue;
        const due=(lot.created_at||new Date().toISOString()).slice(0,10);
        const existing=await db.from('mentalita_financial_receivables').select('id,status').eq('clinic_id',cid).eq('source_type','faturamento_lote').eq('source_id',lot.id).maybeSingle();
        if(existing.error)throw existing.error;
        const receipts=await db.from('mentalita_billing_receipts').select('id,amount,received_at,status').eq('clinic_id',cid).eq('lot_id',lot.id).eq('status','received').order('received_at',{ascending:false});
        if(receipts.error)throw receipts.error;
        const received=(receipts.data||[]).reduce((s,r)=>s+Number(r.amount||0),0);
        const status=received>=Number(lot.total_amount)?'received':'pending';
        const receivedAt=receipts.data?.[0]?.received_at||null;
        const payload={description:`Faturamento — ${lot.lot_number||'Lote '+lot.id}`,amount:Number(lot.total_amount),due_at:due,source:'Faturamento',source_type:'faturamento_lote',source_id:lot.id,status,received_at:receivedAt};
        if(existing.data) await db.from('mentalita_financial_receivables').update(payload).eq('id',existing.data.id).eq('clinic_id',cid);
        else await db.from('mentalita_financial_receivables').insert({...payload,clinic_id:cid});
      }
    }catch(e){console.error('[Financeiro/Faturamento sync]',e)}
  }
  window.MentalitaFinancialBillingSync={sync};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();
  setInterval(sync,60000);
})();

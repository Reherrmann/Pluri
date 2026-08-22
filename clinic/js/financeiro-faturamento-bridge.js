// Clinic — ponte Faturamento → Financeiro
(function(){
  function init(){
    if(!window.PLURI_SUPABASE)return;
    window.ClinicFinancialBridge={
      async createReceivableFromBilling({billingId,description,amount,dueAt,source='Faturamento',patientId=null}={}){
        if(!billingId||!(Number(amount)>0))throw new Error('billingId e amount são obrigatórios');
        const clinicId=window.PLURI_CLINIC?.id||'';
        const sb=window.PLURI_SUPABASE;
        const existing=await sb.from('clinic_financial_receivables').select('id').eq('clinic_id',clinicId).eq('source_type','faturamento').eq('source_id',billingId).maybeSingle();
        if(existing.data)return existing.data;
        const payload={clinic_id:clinicId,description:description||'Cobrança de faturamento',amount:Number(amount),due_at:dueAt||new Date().toISOString().slice(0,10),source,source_type:'faturamento',source_id:billingId,status:'pending'};
        if(patientId)payload.patient_id=patientId;
        const {data,error}=await sb.from('clinic_financial_receivables').insert(payload).select().single();
        if(error)throw error;return data;
      },
      async registerBillingReceipt({billingId,receivedAt=null}={}){
        if(!billingId)throw new Error('billingId é obrigatório');
        const clinicId=window.PLURI_CLINIC?.id||'';const sb=window.PLURI_SUPABASE;
        const {data,error}=await sb.from('clinic_financial_receivables').update({status:'received',received_at:receivedAt||new Date().toISOString().slice(0,10)}).eq('clinic_id',clinicId).eq('source_type','faturamento').eq('source_id',billingId).select().maybeSingle();
        if(error)throw error;return data;
      }
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

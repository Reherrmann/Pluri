// Mentalita — controle de visualização do prontuário
// Evita que cada renderização da linha do tempo gere um novo evento de visualização.
(function installMentalitaProntuarioViewAuditGuard(){
  if(window.__mentalitaProntuarioViewAuditGuard)return;
  const install=()=>{
    const client=window.PLURI_SUPABASE;
    if(!client||typeof client.from!=='function'){setTimeout(install,150);return;}
    if(client.__mentalitaAuditFromPatched)return;
    const originalFrom=client.from.bind(client);
    client.from=function(table){
      const builder=originalFrom(table);
      if(table!=='mentalita_patient_record_audit'||!builder||typeof builder.insert!=='function')return builder;
      const originalInsert=builder.insert.bind(builder);
      builder.insert=function(values,options){
        const list=Array.isArray(values)?values:[values];
        const timelineViews=list.filter(v=>v?.action==='record_viewed'&&v?.metadata?.surface==='timeline');
        if(!timelineViews.length)return originalInsert(values,options);
        const allowed=[],sessionKey='mentalita_prontuario_viewed_';
        timelineViews.forEach(v=>{
          const key=sessionKey+String(v.record_id||'');
          if(!sessionStorage.getItem(key)){sessionStorage.setItem(key,new Date().toISOString());allowed.push(v);}
        });
        const other=list.filter(v=>!(v?.action==='record_viewed'&&v?.metadata?.surface==='timeline'));
        const payload=[...other,...allowed];
        if(!payload.length)return Promise.resolve({data:null,error:null});
        return originalInsert(Array.isArray(values)?payload:payload[0],options);
      };
      return builder;
    };
    client.__mentalitaAuditFromPatched=true;
    window.__mentalitaProntuarioViewAuditGuard=true;
  };
  install();
})();

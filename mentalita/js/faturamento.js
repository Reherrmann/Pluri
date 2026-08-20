// Mentalita — Central de Faturamento
function buildFaturamento() {
    return `
    <div class="billing-page">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:22px">
            <div><h2 style="margin:0 0 5px">Faturamento</h2><p class="section-subtitle">Acompanhe cobranças, convênios, guias TISS, lotes, glosas e recebimentos.</p></div>
            <button class="btn btn-primary" type="button" disabled>+ Novo faturamento</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:20px">
            ${billingKpi('Em aberto','R$ 0,00','Aguardando faturamento')}
            ${billingKpi('Enviado','R$ 0,00','Em processamento')}
            ${billingKpi('Recebido','R$ 0,00','Pagamentos confirmados')}
            ${billingKpi('Glosado','R$ 0,00','Exige conferência')}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
            <button class="btn btn-primary billing-tab active" data-billing-tab="visao">Visão geral</button>
            <button class="btn billing-tab" data-billing-tab="guias">Guias prontas</button>
            <button class="btn billing-tab" data-billing-tab="lotes">Lotes</button>
            <button class="btn billing-tab" data-billing-tab="glosas">Glosas</button>
            <button class="btn billing-tab" data-billing-tab="recebimentos">Recebimentos</button>
        </div>
        <div id="billingWorkspace">
            <div class="patient-info-card">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px"><div><h3 style="margin:0">Fluxo de faturamento</h3><p class="section-subtitle" style="margin:4px 0 0">A estrutura está pronta para receber os dados reais.</p></div><span style="font-size:11px;padding:6px 10px;border-radius:999px;background:#eef2f6;font-weight:700">Estrutura inicial</span></div>
                <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">
                    ${billingStage('1','Prontas','Guias TISS')}${billingStage('2','Lote','Agrupamento')}${billingStage('3','Enviado','Operadora')}${billingStage('4','Processado','Retorno')}${billingStage('5','Recebido','Financeiro')}
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
                <div class="patient-info-card"><h3>Guias aguardando faturamento</h3><div class="billing-empty">Nenhuma guia pronta para faturamento.<br><small>As guias TISS fechadas aparecerão aqui.</small></div></div>
                <div class="patient-info-card"><h3>Próximos recebimentos</h3><div class="billing-empty">Nenhum recebimento registrado.<br><small>Os pagamentos dos convênios serão acompanhados nesta área.</small></div></div>
            </div>
            <div class="patient-info-card" style="margin-top:16px"><h3>Últimos lotes</h3><div class="billing-empty">Nenhum lote criado.<br><small>O agrupamento de guias por operadora e competência será feito aqui.</small></div></div>
        </div>
    </div>
    <style>
      .billing-page{max-width:1200px}.billing-tab{border:1px solid var(--border);background:var(--surface,#fff)}.billing-tab.active{background:#063a59;color:#fff;border-color:#063a59}.billing-kpi{padding:16px;border:1px solid var(--border);border-radius:14px;background:var(--surface,#fff)}.billing-empty{padding:24px 8px;color:var(--text-secondary);font-size:13px;line-height:1.7}.billing-stage{padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--surface,#fff)}
      @media(max-width:850px){.billing-page>div:nth-child(2){grid-template-columns:1fr 1fr!important}.billing-stage{font-size:12px}.billing-page .patient-info-card>div[style*="grid-template-columns:repeat(5"]{grid-template-columns:1fr 1fr!important}}
      @media(max-width:600px){.billing-page>div:nth-child(2){grid-template-columns:1fr!important}.billing-page .patient-info-card>div[style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important}}
    </style>`;
}
function billingKpi(label,value,note){return `<div class="billing-kpi"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-secondary);font-weight:800">${label}</div><div style="font-size:21px;font-weight:800;margin-top:6px">${value}</div><div style="font-size:11px;color:var(--text-secondary);margin-top:4px">${note}</div></div>`;}
function billingStage(n,title,note){return `<div class="billing-stage"><div style="font-size:10px;color:var(--text-secondary);font-weight:800">${n}</div><div style="font-weight:800;margin-top:5px">${title}</div><div style="font-size:10px;color:var(--text-secondary);margin-top:3px">${note}</div></div>`;}
function attachFaturamentoEvents(){document.querySelectorAll('.billing-tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.billing-tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');}));}

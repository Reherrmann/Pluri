// js/automacoes.js
function getAutomacoesData() {

    return [

        {
            name: 'Atendimento inicial',
            desc: 'Responde automaticamente novos contatos.',
            status: 'Ativo',
            last: 'Hoje, 10:31',
            result: '342 atendimentos realizados'
        },

        {
            name: 'Confirmação de consulta',
            desc: 'Solicita confirmação 48h antes.',
            status: 'Ativo',
            last: 'Hoje, 09:15',
            result: '128 confirmações enviadas'
        },

        {
            name: 'Lembrete de consulta',
            desc: 'Envia lembrete 24h antes.',
            status: 'Ativo',
            last: 'Ontem, 18:00',
            result: '256 lembretes enviados'
        },

        {
            name: 'Follow-up',
            desc: 'Acompanha pacientes após atendimento.',
            status: 'Pausado',
            last: '15/07/2026',
            result: '89 acompanhamentos realizados'
        }

    ];

}


function buildAutomacoes() {

    const autos = getAutomacoesData();


    return `<div class="automation-grid">${autos.map(a => `
        <div class="automation-card">
            <h4>${a.name}</h4><p>${a.desc}</p>
            <div class="automation-meta">
                ${statusBadge(a.status)}
                <span>${a.result} · Última: ${a.last}</span>
            </div>
        </div>`).join('')}</div>`;
}

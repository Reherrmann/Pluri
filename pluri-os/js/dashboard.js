// js/dashboard.js
function buildDashboard() {

    const today = new Date();

const todayStr =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const appointmentsToday =
    state.appointments.filter(a =>
        String(a.date || '').trim() === todayStr
    );

const confirmed =
    appointmentsToday.filter(a =>
        String(a.status || '').trim() === 'Confirmado'
    ).length;

const pending =
    appointmentsToday.filter(a => {

        const status =
            String(a.status || '').trim().toLowerCase();

        return (
            status === 'aguardando' ||
            status === 'pendente'
        );

    }).length;
    
console.table(
    appointmentsToday.map(a => ({
        paciente: a.patient,
        data: a.date,
        horario: a.time,
        status: a.status
    }))
);

const totalToday =
    appointmentsToday.length;

   

    const conversationsWaiting =
        state.conversations.filter(c => c.status === 'Aguardando').length;

   const cancelled =
    appointmentsToday.filter(a => {

        const status =
            String(a.status || '').trim().toLowerCase();

        return status === 'cancelado';

    }).length;

    return `

        <div class="kpi-row">

            <div class="kpi-card" data-link="agenda">
                <div class="kpi-value">${totalToday}</div>
                <div class="kpi-label">Atendimentos hoje</div>
                <div class="kpi-sub">${confirmed} confirmados</div>
            </div>

            <div class="kpi-card" data-link="atendimentos">
    <div class="kpi-value">${conversationsWaiting}</div>
    <div class="kpi-label">Conversas aguardando</div>
    <div class="kpi-sub">Precisam da equipe</div>
</div>

            <div class="kpi-card" data-link="agenda">
                <div class="kpi-value">${pending}</div>
                <div class="kpi-label">Confirmações pendentes</div>
                <div class="kpi-sub amber">
                    Precisam de atenção
                </div>
            </div>

            <div class="kpi-card" data-link="agenda">
    <div class="kpi-value">${cancelled}</div>
    <div class="kpi-label">Cancelamentos hoje</div>
    <div class="kpi-sub">
        ${cancelled > 0 ? 'Precisam de atenção' : 'Nenhum cancelamento'}
    </div>
</div>

        </div>

        <div class="grid-2">

            <div class="card">

                <div class="card-header">
                    <h3>Agenda de hoje</h3>

                    <a
                        class="btn btn-sm btn-outline js-nav"
                        data-page="agenda">

                        Ver agenda →

                    </a>

                </div>

                <div class="card-body no-padding">

                    <ul class="agenda-list">

                        ${[...appointmentsToday]

                            .sort((a, b) =>
                                String(a.time)
                                    .localeCompare(String(b.time))
                            )

                            .slice(0, 6)

                            .map(a => `

                                <li class="agenda-item">

                                    <span class="agenda-time">
                                        ${a.time}
                                    </span>

                                    <div class="agenda-avatar">
                                        ${getInitials(a.patient)}
                                    </div>

                                    <div class="agenda-info">

                                        <div class="agenda-name">
                                            ${a.patient}
                                        </div>

                                        <div class="agenda-detail">
                                            ${a.service}
                                            ·
                                            ${a.professional}
                                        </div>

                                    </div>

                                    ${statusBadge(a.status)}

                                </li>

                            `).join('')}

                    </ul>

                </div>

            </div>

            <div class="card">

                <div class="card-header">
                    <h3>Precisa da sua atenção</h3>
                </div>

                <div class="card-body">

                    <div
                        style="
                            display:flex;
                            flex-direction:column;
                            gap:14px;
                        ">

                        <div
                            style="
                                padding:12px 14px;
                                background:var(--hover-bg);
                                border-radius:8px;
                            ">

                            <strong style="font-size:13px;">
                                ${pending} confirmações pendentes
                            </strong>

                            <p
                                style="
                                    font-size:12px;
                                    color:var(--text-secondary);
                                ">

                                Pacientes ainda não confirmaram.

                            </p>

                            <a
                                class="btn btn-sm btn-outline js-nav"
                                data-page="agenda">

                                Ver agenda

                            </a>

                        </div>

                        <div
                            style="
                                padding:12px 14px;
                                background:var(--hover-bg);
                                border-radius:8px;
                            ">

                            <strong style="font-size:13px;">

                                ${conversationsWaiting}
                                conversas precisam da equipe

                            </strong>

                            <p
                                style="
                                    font-size:12px;
                                    color:var(--text-secondary);
                                ">

                                Solicitações aguardando atendimento.

                            </p>

                            <a
                                class="btn btn-sm btn-outline js-nav"
                                data-page="atendimentos">

                                Ver conversas

                            </a>

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <div class="grid-4">

            <div class="card">

                <div class="card-header">
                    <h3>Atendimentos da semana</h3>
                </div>

                <div class="card-body">

                    <div class="chart-container">
                        ${renderBarChart(
                            [18,22,26,21,28,12],
                            ['Seg','Ter','Qua','Qui','Sex','Sáb'],
                            2
                        )}
                    </div>

                </div>

            </div>

            <div class="card">

                <div class="card-header">
                    <h3>Atividade recente</h3>
                </div>

                <div class="card-body">

                    <div class="timeline">

                        ${[...state.conversations]

                            .sort((a,b)=>
                                new Date(b.conversationDate || 0) -
                                new Date(a.conversationDate || 0)
                            )

                            .slice(0,5)

                            .map(c => `

                                <div class="timeline-item">

                                    <span class="timeline-time">

                                        ${
                                            c.conversationDate
                                                ? new Date(c.conversationDate)
                                                    .toLocaleTimeString(
                                                        'pt-BR',
                                                        {
                                                            hour:'2-digit',
                                                            minute:'2-digit'
                                                        }
                                                    )
                                                : '--:--'
                                        }

                                    </span>

                                    <div class="timeline-dot"></div>

                                    <span class="timeline-text">

                                        ${
                                            c.summary ||
                                            c.lastMsg ||
                                            c['Resumo_conversa'] ||
                                            'Nova conversa'
                                        }

                                    </span>

                                </div>

                            `).join('')}

                    </div>

                </div>

            </div>

            <div class="card">

                <div class="card-header">
                    <h3>Automações ativas</h3>
                </div>

                <div class="card-body">

                    <div style="display:flex;flex-direction:column;gap:8px;">

                        ${[
                            {
                                name:'Confirmação de consultas',
                                status:'Ativo',
                                sent:'128 enviadas'
                            },
                            {
                                name:'Lembrete 24h antes',
                                status:'Ativo',
                                sent:'256 enviados'
                            },
                            {
                                name:'Atendimento inicial',
                                status:'Ativo',
                                sent:'342 realizados'
                            },
                            {
                                name:'Recuperação de faltas',
                                status:'Pausado',
                                sent:'89 acompanhamentos'
                            }

                        ].map(a => `

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    align-items:center;
                                    padding:6px 0;
                                    border-bottom:1px solid var(--border-light);
                                ">

                                <span style="font-size:13px;">

                                    ${a.name}

                                    <small
                                        style="color:var(--text-secondary);">

                                        ${a.sent}

                                    </small>

                                </span>

                                ${statusBadge(a.status)}

                            </div>

                        `).join('')}

                        <a
                            class="btn btn-sm btn-outline js-nav"
                            data-page="automacoes"
                            style="margin-top:8px;width:100%;">

                            Gerenciar

                        </a>

                    </div>

                </div>

            </div>

            <div class="card-placeholder">
                Espaço adaptável para a clínica
            </div>

        </div>

    `;

}
        

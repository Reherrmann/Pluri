// js/indicadores.js

function buildIndicadores() {

    const appointments =
        Array.isArray(state.appointments)
            ? state.appointments
            : [];


    // =====================================================
    // DATA ATUAL
    // =====================================================

    const hoje = new Date();

    const anoAtual =
        hoje.getFullYear();

    const mesAtual =
        hoje.getMonth();


    // =====================================================
    // AGENDAMENTOS DO MÊS ATUAL
    // =====================================================

    const appointmentsMes =
        appointments.filter(appt => {

            if (!appt.date) return false;

            const partes =
                String(appt.date).split('-');

            if (partes.length !== 3) {
                return false;
            }

            const ano =
                Number(partes[0]);

            const mes =
                Number(partes[1]) - 1;

            return (
                ano === anoAtual &&
                mes === mesAtual
            );
        });


    // =====================================================
    // CONFIRMADOS E CANCELADOS
    // =====================================================

    const confirmados =
        appointmentsMes.filter(appt =>
            String(appt.status || '')
                .toLowerCase() === 'confirmado'
        ).length;


    const cancelados =
        appointmentsMes.filter(appt =>
            String(appt.status || '')
                .toLowerCase() === 'cancelado'
        ).length;


    // =====================================================
    // TAXA DE CONFIRMAÇÃO
    // =====================================================

    const taxaConfirmacao =
        appointmentsMes.length > 0
            ? Math.round(
                (confirmados /
                    appointmentsMes.length) * 100
            )
            : 0;


    // =====================================================
    // AGENDAMENTOS POR DIA DA SEMANA
    // =====================================================

    const diasSemana = [
        'Seg',
        'Ter',
        'Qua',
        'Qui',
        'Sex',
        'Sáb'
    ];


    const agendamentosPorDia =
        [0, 0, 0, 0, 0, 0];


    appointmentsMes.forEach(appt => {

        if (!appt.date) return;

        const partes =
            String(appt.date).split('-');

        if (partes.length !== 3) return;

        const data =
            new Date(
                Number(partes[0]),
                Number(partes[1]) - 1,
                Number(partes[2])
            );


        const dia =
            data.getDay();


        // Domingo não entra no gráfico
        if (dia === 0) return;


        // JS:
        // Domingo = 0
        // Segunda = 1
        // ...
        // Sábado = 6

        agendamentosPorDia[dia - 1]++;
    });


    // =====================================================
    // HTML
    // =====================================================

    return `

        <div class="grid-2">

            <div class="card">

                <div class="card-header">
                    <h3>
                        Agendamentos por dia (mês)
                    </h3>
                </div>

                <div class="card-body">

                    <div class="chart-container">

                        ${renderBarChart(
                            agendamentosPorDia,
                            diasSemana,
                            2
                        )}

                    </div>

                </div>

            </div>


            <div class="card">

                <div class="card-header">
                    <h3>
                        Confirmados x Cancelados
                    </h3>
                </div>

                <div class="card-body">

                    <div class="chart-container">

                        ${renderBarChart(
                            [
                                confirmados,
                                cancelados
                            ],
                            [
                                'Confirmados',
                                'Cancelados'
                            ],
                            0
                        )}

                    </div>

                </div>

            </div>

        </div>


        <div class="grid-2">

            <div class="kpi-card">

                <div class="kpi-value">
                    ${appointmentsMes.length}
                </div>

                <div class="kpi-label">
                    Agendamentos no mês
                </div>

            </div>


            <div class="kpi-card">

                <div class="kpi-value">
                    ${taxaConfirmacao}%
                </div>

                <div class="kpi-label">
                    Taxa de confirmação
                </div>

            </div>

        </div>

    `;
}

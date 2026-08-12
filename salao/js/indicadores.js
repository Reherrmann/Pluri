// js/indicadores.js

function buildIndicadores() {

    // =====================================================
    // DADOS DA AGENDA
    // =====================================================

    const appointments =
        Array.isArray(state.appointments)
            ? state.appointments
            : [];


    // =====================================================
    // DATA ATUAL
    // =====================================================

    const hoje = new Date();

    hoje.setHours(0, 0, 0, 0);

    const anoAtual =
        hoje.getFullYear();

    const mesAtual =
        hoje.getMonth();


    // =====================================================
    // CONVERSOR DE DATA
    //
    // Aceita:
    // YYYY-MM-DD
    // DD/MM/YYYY
    // Date
    // =====================================================

    function parseAppointmentDate(value) {

        if (!value) {
            return null;
        }

        if (value instanceof Date) {

            const d =
                new Date(value);

            d.setHours(0, 0, 0, 0);

            return d;
        }


        const str =
            String(value).trim();


        // YYYY-MM-DD
        let match =
            str.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );

        if (match) {

            const d =
                new Date(
                    Number(match[1]),
                    Number(match[2]) - 1,
                    Number(match[3])
                );

            d.setHours(0, 0, 0, 0);

            return d;
        }


        // DD/MM/YYYY
        match =
            str.match(
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
            );

        if (match) {

            const d =
                new Date(
                    Number(match[3]),
                    Number(match[2]) - 1,
                    Number(match[1])
                );

            d.setHours(0, 0, 0, 0);

            return d;
        }


        // Última tentativa
        const d =
            new Date(str);

        if (isNaN(d.getTime())) {
            return null;
        }

        d.setHours(0, 0, 0, 0);

        return d;
    }


    // =====================================================
    // AGENDAMENTOS DO MÊS ATUAL
    // =====================================================

    const appointmentsMes =
        appointments.filter(appt => {

            const data =
                parseAppointmentDate(appt.date);

            if (!data) {
                return false;
            }

            return (
                data.getFullYear() === anoAtual &&
                data.getMonth() === mesAtual
            );
        });


    // =====================================================
    // STATUS
    // =====================================================

    function normalizarStatus(status) {

        return String(status || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }


    const confirmados =
        appointmentsMes.filter(appt => {

            const status =
                normalizarStatus(appt.status);

            return (
                status === 'confirmado' ||
                status === 'confirmada'
            );

        }).length;


    const cancelados =
        appointmentsMes.filter(appt => {

            const status =
                normalizarStatus(appt.status);

            return (
                status === 'cancelado' ||
                status === 'cancelada'
            );

        }).length;


    // =====================================================
    // TAXA DE CONFIRMAÇÃO
    // =====================================================

    const taxaConfirmacao =
        appointmentsMes.length > 0
            ? Math.round(
                (
                    confirmados /
                    appointmentsMes.length
                ) * 100
            )
            : 0;


    // =====================================================
    // SEMANA ATUAL
    //
    // Segunda a sábado, mantendo o mesmo layout
    // que você já tinha.
    // =====================================================

    const diasSemana = [
        'Seg',
        'Ter',
        'Qua',
        'Qui',
        'Sex',
        'Sáb'
    ];


    const agendamentosSemana =
        [0, 0, 0, 0, 0, 0];


    // Domingo = 0
    // Segunda = 1
    // ...
    // Sábado = 6

    const diaSemanaHoje =
        hoje.getDay();


    // Descobre a segunda-feira da semana atual

    const segunda =
        new Date(hoje);

    const deslocamento =
        diaSemanaHoje === 0
            ? 6
            : diaSemanaHoje - 1;

    segunda.setDate(
        hoje.getDate() - deslocamento
    );

    segunda.setHours(0, 0, 0, 0);


    appointments.forEach(appt => {

        const data =
            parseAppointmentDate(appt.date);

        if (!data) {
            return;
        }


        const diferenca =
            Math.floor(
                (
                    data.getTime() -
                    segunda.getTime()
                ) /
                (1000 * 60 * 60 * 24)
            );


        // Segunda até sábado
        if (
            diferenca >= 0 &&
            diferenca <= 5
        ) {

            agendamentosSemana[diferenca]++;
        }

    });


    // =====================================================
    // DESTACA O DIA ATUAL
    //
    // Domingo não aparece no gráfico.
    // =====================================================

    const destaqueHoje =
        diaSemanaHoje >= 1 &&
        diaSemanaHoje <= 6
            ? diaSemanaHoje - 1
            : -1;


    // =====================================================
    // HTML
    // =====================================================

    return `

        <div class="grid-2">

            <div class="card">

                <div class="card-header">

                    <h3>
                        Agendamentos por dia (semana)
                    </h3>

                </div>

                <div class="card-body">

                    <div class="chart-container">

                        ${renderBarChart(
                            agendamentosSemana,
                            diasSemana,
                            destaqueHoje
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
                            -1
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

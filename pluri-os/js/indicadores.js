// js/indicadores.js

function buildIndicadores() {

return <div class="grid-2"> <div class="card"><div class="card-header"><h3>Agendamentos por dia (semana)</h3></div><div class="card-body"><div class="chart-container">${renderBarChart([18,22,26,21,28,12],['Seg','Ter','Qua','Qui','Sex','Sáb'],2)}</div></div></div> <div class="card"><div class="card-header"><h3>Confirmados x Cancelados</h3></div><div class="card-body"><div class="chart-container">${renderBarChart([45,8],['Confirmados','Cancelados'],0)}</div></div></div> </div> <div class="grid-2"> <div class="kpi-card"><div class="kpi-value">156</div><div class="kpi-label">Agendamentos no mês</div></div> <div class="kpi-card"><div class="kpi-value">89%</div><div class="kpi-label">Taxa de confirmação</div></div> </div>;

}

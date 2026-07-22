/**
 * PLURI OS — Simulador Financeiro (versão Diretoria)
 * Projeção de receitas com reajuste anual, sem dependência de contratos reais.
 */
const Simulator = (() => {
    function render() {
        const saved = Storage.loadData('simulator_inputs', {
            implantacao: 5000,
            mensalidade: 1500,
            contrato: 12,
            comissao: 15,
            clientes: 10,
            reajuste: 0,        // novo campo: percentual de reajuste anual
        });

        const results = calculate(saved);

        return `
            <div class="fade-in">
                <h3 style="font-weight:600;margin-bottom:20px">Simulador Financeiro (Diretoria)</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
                    <!-- Inputs -->
                    <div class="card">
                        <div class="card-header"><span class="card-title">Parâmetros</span></div>
                        <div class="form-group">
                            <label class="form-label">Valor Implantação (R$)</label>
                            <input type="number" id="sim-implantacao" class="form-input" value="${saved.implantacao}" oninput="Simulator.recalc()">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mensalidade (R$)</label>
                            <input type="number" id="sim-mensalidade" class="form-input" value="${saved.mensalidade}" oninput="Simulator.recalc()">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Meses de Contrato</label>
                            <input type="number" id="sim-contrato" class="form-input" value="${saved.contrato}" oninput="Simulator.recalc()">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Reajuste Anual (%)</label>
                            <input type="number" id="sim-reajuste" class="form-input" value="${saved.reajuste}" step="0.1" oninput="Simulator.recalc()">
                            <small style="color:var(--text-tertiary)">Aplicado a cada 12 meses sobre a mensalidade</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Comissão sobre Implantação (%)</label>
                            <input type="number" id="sim-comissao" class="form-input" value="${saved.comissao}" oninput="Simulator.recalc()">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Número de Clientes</label>
                            <input type="number" id="sim-clientes" class="form-input" value="${saved.clientes}" oninput="Simulator.recalc()">
                        </div>
                    </div>

                    <!-- Resultados -->
                    <div id="sim-results">
                        ${renderResults(results)}
                    </div>
                </div>
            </div>
        `;
    }

    function calculate(inputs) {
        const implantacao = parseFloat(inputs.implantacao) || 0;
        const mensalidade = parseFloat(inputs.mensalidade) || 0;
        const contrato = parseInt(inputs.contrato) || 12;
        const comissao = parseFloat(inputs.comissao) || 0;
        const clientes = parseInt(inputs.clientes) || 0;
        const reajuste = parseFloat(inputs.reajuste) || 0;

        // Receita de implantação (única)
        const receitaImplantacao = implantacao * clientes;

        // Cálculo das mensalidades com reajuste
        const anos = Math.ceil(contrato / 12);
        let receitaMensalidades = 0;
        let receitaPrimeiroAno = 0;
        let receitaSegundoAno = 0;

        for (let ano = 0; ano < anos; ano++) {
            const mesesNoAno = (ano === anos - 1 && contrato % 12 !== 0) ? contrato % 12 : 12;
            const fatorReajuste = Math.pow(1 + reajuste / 100, ano);
            const valorMensal = mensalidade * fatorReajuste;
            const receitaAno = valorMensal * mesesNoAno * clientes;
            receitaMensalidades += receitaAno;
            if (ano === 0) receitaPrimeiroAno = receitaAno;
            if (ano === 1) receitaSegundoAno = receitaAno;
        }

        // Totais
        const receitaTotal = receitaImplantacao + receitaMensalidades;
        const totalComissao = implantacao * (comissao / 100) * clientes;
        const lucroEstimado = receitaTotal - totalComissao;

        // MRR inicial (sem reajuste)
        const mrr = mensalidade * clientes;

        // ROI (sobre o investimento em implantação)
        const investimentoImplantacao = receitaImplantacao;
        const roi = investimentoImplantacao > 0
            ? ((lucroEstimado / investimentoImplantacao) * 100).toFixed(0)
            : 0;

        // Receita 24 meses (caso o contrato seja menor, repete sem reajuste adicional)
        const receita24 = contrato >= 24
            ? receitaPrimeiroAno + receitaSegundoAno + receitaImplantacao
            : receitaTotal; // se contrato < 24, apenas mostra o total

        return {
            mrr,
            receitaImplantacao,
            receitaPrimeiroAno: receitaPrimeiroAno + receitaImplantacao, // Receita Anual (1º ano com implantação)
            receita24,
            receitaTotal,
            totalComissao,
            lucroEstimado,
            roi,
        };
    }

    function renderResults(r) {
        return `
            <div class="cards-grid" style="grid-template-columns:1fr">
                ${Components.metricCard({
                    title: 'MRR (Mensal)',
                    value: Utils.formatCurrency(r.mrr),
                    icon: 'calendar',
                    color: 'accent',
                })}
                ${Components.metricCard({
                    title: 'Receita Implantação',
                    value: Utils.formatCurrency(r.receitaImplantacao),
                    icon: 'rocket',
                    color: 'info',
                })}
                ${Components.metricCard({
                    title: 'Receita Anual (1º ano)',
                    value: Utils.formatCurrency(r.receitaPrimeiroAno),
                    icon: 'trending-up',
                    color: 'success',
                })}
                ${Components.metricCard({
                    title: 'Receita 24 Meses',
                    value: Utils.formatCurrency(r.receita24),
                    icon: 'bar-chart',
                    color: 'success',
                })}
                ${Components.metricCard({
                    title: 'Receita Total (período)',
                    value: Utils.formatCurrency(r.receitaTotal),
                    icon: 'dollar-sign',
                    color: 'success',
                })}
                ${Components.metricCard({
                    title: 'Comissão Total',
                    value: Utils.formatCurrency(r.totalComissao),
                    icon: 'users',
                    color: 'warning',
                })}
                ${Components.metricCard({
                    title: 'Lucro Estimado',
                    value: Utils.formatCurrency(r.lucroEstimado),
                    icon: 'trending-up',
                    color: 'success',
                })}
                ${Components.metricCard({
                    title: 'ROI',
                    value: r.roi + '%',
                    icon: 'percent',
                    color: 'accent',
                })}
            </div>
        `;
    }

    function recalc() {
        const inputs = {
            implantacao: document.getElementById('sim-implantacao')?.value || 0,
            mensalidade: document.getElementById('sim-mensalidade')?.value || 0,
            contrato: document.getElementById('sim-contrato')?.value || 12,
            comissao: document.getElementById('sim-comissao')?.value || 0,
            clientes: document.getElementById('sim-clientes')?.value || 0,
            reajuste: document.getElementById('sim-reajuste')?.value || 0,
        };
        Storage.saveData('simulator_inputs', inputs);
        const results = calculate(inputs);
        const resultsDiv = document.getElementById('sim-results');
        if (resultsDiv) {
            resultsDiv.innerHTML = renderResults(results);
            lucide.createIcons();
        }
    }

    window.Simulator = { render, recalc };
    return { render, recalc };
})();

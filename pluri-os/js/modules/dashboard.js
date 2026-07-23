/**
 * PLURI OS — Dashboard Executivo V2
 * Cockpit inteligente com insights, ações, health score e IA
 */
const Dashboard = (() => {
    // Cache para cálculos
    let cachedData = null;

    /**
     * Coleta todos os dados necessários e gera inteligência
     */
    function gatherData() {
        const companies = Storage.loadData('crm_companies', []);
        const transactions = Storage.loadData('finance_transactions', []);
        const implantations = Storage.loadData('finance_implantations', []);
        const goals = Storage.loadData('goals', []);
        const contracts = Storage.loadData('contracts', []);

        // Período atual vs anterior
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        // Funções auxiliares
        const isThisMonth = (dateStr) => {
            const d = new Date(dateStr);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        };
        const isLastMonth = (dateStr) => {
            const d = new Date(dateStr);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        };

        // Financeiro
        const revenueThisMonth = transactions.filter(t => t.type === 'receita' && isThisMonth(t.date || t.createdAt))
            .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const revenueLastMonth = transactions.filter(t => t.type === 'receita' && isLastMonth(t.date || t.createdAt))
            .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const expensesThisMonth = transactions.filter(t => t.type === 'despesa' || t.type === 'custo' && isThisMonth(t.date || t.createdAt))
            .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const expensesLastMonth = transactions.filter(t => t.type === 'despesa' || t.type === 'custo' && isLastMonth(t.date || t.createdAt))
            .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const profitThisMonth = revenueThisMonth - expensesThisMonth;
        const profitLastMonth = revenueLastMonth - expensesLastMonth;
        const mrr = transactions.filter(t => t.type === 'mensalidade' || t.category === 'recorrente')
            .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const arr = mrr * 12;
        const cashFlow = revenueThisMonth - expensesThisMonth; // simplificado
        const totalImplantations = implantations.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
        const roi = totalImplantations > 0 ? ((profitThisMonth / totalImplantations) * 100).toFixed(1) : 'N/A';

        // Comercial
        const leads = companies.filter(c => c.status === 'lead').length;
        const activeClients = companies.filter(c => c.status === 'closed').length;
        const conversionRate = companies.length > 0 ? ((activeClients / companies.length) * 100).toFixed(1) : '0';
        const ticketMedio = activeClients > 0 ? (revenueThisMonth / activeClients).toFixed(2) : '0';
        const inImplantation = implantations.filter(i => i.status === 'em_andamento').length;
        const activeContracts = contracts.filter(c => c.status === 'ativo').length;

        // Histórico de receita para sparkline (últimos 6 meses)
        const revenueHistory = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(thisYear, thisMonth - i, 1);
            const month = d.getMonth();
            const year = d.getFullYear();
            const total = transactions.filter(t => {
                const td = new Date(t.date || t.createdAt);
                return t.type === 'receita' && td.getMonth() === month && td.getFullYear() === year;
            }).reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
            revenueHistory.push(total);
        }

        // Variações percentuais
        const revenueVar = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100).toFixed(1) : 0;
        const profitVar = profitLastMonth !== 0 ? ((profitThisMonth - profitLastMonth) / Math.abs(profitLastMonth) * 100).toFixed(1) : 0;
        const mrrVar = 0; // idealmente comparar com mês anterior

        // Metas
        const monthlyRevenueGoal = goals.find(g => g.period === 'monthly' && g.category === 'receita');
        const monthlyProfitGoal = goals.find(g => g.period === 'monthly' && g.category === 'lucro');
        const revenueGoalProgress = monthlyRevenueGoal ? Math.min((revenueThisMonth / parseFloat(monthlyRevenueGoal.target || 1)) * 100, 100).toFixed(1) : null;
        const profitGoalProgress = monthlyProfitGoal ? Math.min((profitThisMonth / parseFloat(monthlyProfitGoal.target || 1)) * 100, 100).toFixed(1) : null;

        // Health Score (0-100)
        let healthScore = 50;
        healthScore += revenueVar > 0 ? 10 : -5;
        healthScore += conversionRate > 20 ? 10 : 0;
        healthScore += activeClients > 10 ? 10 : 0;
        healthScore += profitThisMonth > 0 ? 15 : -10;
        healthScore += cashFlow > 0 ? 15 : -5;
        healthScore = Math.max(0, Math.min(100, healthScore));

        // Insights
        const insights = [];
        if (revenueVar < 0) insights.push({ icon: '📉', text: `Receita caiu ${Math.abs(revenueVar)}% em relação ao mês passado.`, type: 'warning' });
        else if (revenueVar > 10) insights.push({ icon: '📈', text: `Receita cresceu ${revenueVar}% este mês!`, type: 'success' });
        if (conversionRate < 20 && companies.length > 5) insights.push({ icon: '⚠️', text: `Taxa de conversão baixa: ${conversionRate}%.`, type: 'warning' });
        const oldProposals = companies.filter(c => c.status === 'proposal' && (new Date() - new Date(c.updatedAt)) > 15*24*60*60*1000);
        if (oldProposals.length > 0) insights.push({ icon: '⏳', text: `${oldProposals.length} propostas paradas há mais de 15 dias.`, type: 'danger' });
        if (profitThisMonth < 0) insights.push({ icon: '🔻', text: 'Lucro negativo este mês. Revise custos.', type: 'danger' });
        if (revenueGoalProgress !== null && revenueGoalProgress < 80) insights.push({ icon: '🎯', text: `Meta de receita em ${revenueGoalProgress}% — abaixo do esperado.`, type: 'warning' });

        // Próximas ações (simuladas)
        const actions = [
            { text: 'Fazer follow-up com leads sem contato há 7 dias', priority: 'high' },
            { text: 'Finalizar implantação de clientes em andamento', priority: 'medium' },
            { text: 'Renovar contratos com vencimento próximo', priority: 'medium' },
            { text: 'Registrar despesas pendentes', priority: 'low' },
        ];

        // Pipeline resumido
        const stages = Storage.loadData('crm_pipeline_stages', []);
        const pipelineSummary = stages.map(stage => ({
            name: stage.name,
            count: companies.filter(c => c.status === stage.id).length,
            value: companies.filter(c => c.status === stage.id).reduce((s, c) => s + (parseFloat(c.value || 0)), 0),
        }));

        return {
            revenueThisMonth, revenueLastMonth, revenueVar,
            expensesThisMonth, expensesLastMonth,
            profitThisMonth, profitLastMonth, profitVar,
            mrr, arr, cashFlow, roi,
            leads, activeClients, conversionRate, ticketMedio, inImplantation, activeContracts,
            revenueHistory,
            revenueGoalProgress, profitGoalProgress,
            healthScore,
            insights,
            actions,
            pipelineSummary,
            companies, transactions, implantations, goals, contracts,
            thisMonth, thisYear, lastMonth, lastMonthYear,
        };
    }

    function render() {
        const data = gatherData();
        cachedData = data;

        return `
            <div class="fade-in">
                <!-- Header -->
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px">
                    <div>
                        <h2 style="font-weight:700;font-size:1.5rem;letter-spacing:-0.02em">Bom dia, Diretoria 👋</h2>
                        <p style="color:var(--text-tertiary);font-size:0.9rem">${Utils.formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div style="display:flex;gap:12px">
                        <button class="btn-secondary btn-sm" onclick="PLURI.navigateTo('finance')">
                            <i data-lucide="plus" class="icon-sm"></i> Ação Rápida
                        </button>
                    </div>
                </div>

                <!-- Linha 1: KPIs principais -->
                <div class="cards-grid" style="margin-bottom:24px">
                    ${kpiCard('Receita do Mês', Utils.formatCurrency(data.revenueThisMonth), 'dollar-sign', data.revenueVar + '%', data.revenueVar >= 0 ? 'positive' : 'negative', 'vs mês passado', '#22c55e', data.revenueHistory)}
                    ${kpiCard('MRR', Utils.formatCurrency(data.mrr), 'repeat', '0%', 'positive', 'Receita Recorrente', '#6366f1', data.revenueHistory)}
                    ${kpiCard('ARR', Utils.formatCurrency(data.arr), 'calendar', '0%', 'positive', 'Anualizado', '#8b5cf6', data.revenueHistory)}
                    ${kpiCard('Lucro Líquido', Utils.formatCurrency(data.profitThisMonth), 'trending-up', data.profitVar + '%', data.profitVar >= 0 ? 'positive' : 'negative', 'vs mês anterior', data.profitThisMonth >= 0 ? '#22c55e' : '#ef4444', data.revenueHistory)}
                    ${kpiCard('Fluxo de Caixa', Utils.formatCurrency(data.cashFlow), 'activity', '', 'positive', 'Saldo do mês', '#3b82f6')}
                    ${kpiCard('ROI', data.roi + '%', 'percent', '', data.roi > 0 ? 'positive' : 'negative', 'Retorno s/ Invest.', '#f59e0b')}
                </div>

                <!-- Linha 2: Comercial -->
                <div class="cards-grid" style="margin-bottom:24px">
                    ${simpleMetricCard('Leads', data.leads, 'users', '#6366f1')}
                    ${simpleMetricCard('Clientes Ativos', data.activeClients, 'user-check', '#22c55e')}
                    ${simpleMetricCard('Conversão', data.conversionRate + '%', 'percent', '#f59e0b')}
                    ${simpleMetricCard('Ticket Médio', Utils.formatCurrency(data.ticketMedio), 'receipt', '#3b82f6')}
                    ${simpleMetricCard('Implantações', data.inImplantation, 'rocket', '#8b5cf6')}
                    ${simpleMetricCard('Contratos Ativos', data.activeContracts, 'file-text', '#06b6d4')}
                </div>

                <!-- Linha 3: Insights Inteligentes -->
                <div class="card card-glass" style="margin-bottom:24px">
                    <div class="card-header" style="margin-bottom:12px">
                        <span class="card-title">🧠 Insights Inteligentes</span>
                    </div>
                    <div>
                        ${data.insights.map(i => `
                            <div class="insight-item">
                                <span class="insight-icon">${i.icon}</span>
                                <span>${i.text}</span>
                            </div>
                        `).join('')}
                        ${data.insights.length === 0 ? '<p style="color:var(--text-tertiary);text-align:center;padding:20px">Tudo sob controle! 🎉</p>' : ''}
                    </div>
                </div>

                <!-- Linha 4: Próximas Ações -->
                <div class="card card-glass" style="margin-bottom:24px">
                    <div class="card-header" style="margin-bottom:12px">
                        <span class="card-title">📋 Hoje você precisa</span>
                    </div>
                    ${data.actions.map(a => `
                        <div class="action-item">
                            <span class="priority-dot ${a.priority}"></span>
                            <span>${a.text}</span>
                            <span class="badge-tag ${a.priority === 'high' ? 'danger' : a.priority === 'medium' ? 'warning' : 'info'}" style="margin-left:auto">${a.priority === 'high' ? 'Alta' : a.priority === 'medium' ? 'Média' : 'Baixa'}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- Linha 5: Funil Comercial (Pipeline Resumido) -->
                <div class="card card-glass" style="margin-bottom:24px">
                    <div class="card-header" style="margin-bottom:12px">
                        <span class="card-title">📊 Funil Comercial</span>
                    </div>
                    <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px">
                        ${data.pipelineSummary.map(s => `
                            <div style="flex:1;min-width:120px;background:var(--bg-tertiary);border-radius:var(--radius-md);padding:12px;text-align:center">
                                <div style="font-weight:600;font-size:0.8rem;color:var(--text-secondary);margin-bottom:4px">${s.name}</div>
                                <div style="font-size:1.5rem;font-weight:700">${s.count}</div>
                                <div style="font-size:0.75rem;color:var(--text-tertiary)">${Utils.formatCurrency(s.value)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Linha 6: Financeiro (Gráficos simplificados) -->
                <div class="card card-glass" style="margin-bottom:24px">
                    <div class="card-header" style="margin-bottom:12px">
                        <span class="card-title">💰 Receita vs Despesa (este mês)</span>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:center;gap:40px;padding:20px 0">
                        ${Charts.createDonut(data.revenueThisMonth > 0 ? (data.profitThisMonth > 0 ? 70 : 30) : 0, { size: 100, color: '#22c55e', bgColor: '#ef4444' })}
                        <div>
                            <div><span style="color:var(--success)">Receita:</span> ${Utils.formatCurrency(data.revenueThisMonth)}</div>
                            <div><span style="color:var(--danger)">Despesa:</span> ${Utils.formatCurrency(data.expensesThisMonth)}</div>
                            <div><span style="color:var(--accent)">Lucro:</span> ${Utils.formatCurrency(data.profitThisMonth)}</div>
                        </div>
                    </div>
                </div>

                <!-- Linha 7: Metas -->
                <div class="card card-glass" style="margin-bottom:24px">
                    <div class="card-header" style="margin-bottom:12px">
                        <span class="card-title">🎯 Progresso de Metas</span>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:16px">
                        ${data.revenueGoalProgress !== null ? goalProgressBar('Receita Mensal', data.revenueThisMonth, parseFloat(data.goals?.find(g => g.category==='receita')?.target || 1), data.revenueGoalProgress) : ''}
                        ${data.profitGoalProgress !== null ? goalProgressBar('Lucro Mensal', data.profitThisMonth, parseFloat(data.goals?.find(g => g.category==='lucro')?.target || 1), data.profitGoalProgress) : ''}
                        ${goalProgressBar('Clientes Ativos', data.activeClients, 20, (data.activeClients/20*100).toFixed(1))}
                        ${goalProgressBar('Conversão', parseFloat(data.conversionRate), 30, (data.conversionRate/30*100).toFixed(1))}
                        ${!data.revenueGoalProgress && !data.profitGoalProgress ? '<p style="color:var(--text-tertiary);text-align:center">Defina metas para ver o progresso.</p>' : ''}
                    </div>
                </div>

                <!-- Linha 8: Timeline Rica -->
                <div class="card card-glass" style="margin-bottom:24px">
                    <div class="card-header" style="margin-bottom:12px">
                        <span class="card-title">🕒 Atividades Recentes</span>
                    </div>
                    <div class="timeline-v2">
                        ${generateRichTimeline(data)}
                    </div>
                </div>

                <!-- Linha 9: Health Score -->
                <div class="card card-glass" style="margin-bottom:24px">
                    <div class="card-header" style="margin-bottom:12px">
                        <span class="card-title">❤️ Saúde da Empresa</span>
                    </div>
                    <div style="text-align:center">
                        <div class="health-score-circle" style="background: conic-gradient(${data.healthScore >= 70 ? '#22c55e' : data.healthScore >= 40 ? '#f59e0b' : '#ef4444'} ${data.healthScore}%, var(--bg-tertiary) 0);">
                            <span style="color:var(--text-primary);font-size:2rem">${data.healthScore}</span>
                        </div>
                        <p style="margin-top:12px;font-weight:600;color:var(--text-primary)">
                            ${data.healthScore >= 70 ? '🟢 Empresa Saudável' : data.healthScore >= 40 ? '🟡 Atenção Necessária' : '🔴 Riscos Financeiros'}
                        </p>
                        <p style="color:var(--text-tertiary);font-size:0.85rem">
                            ${data.healthScore >= 70 ? 'Indicadores estão positivos. Continue assim!' : 'Revise os pontos de atenção e tome ações corretivas.'}
                        </p>
                    </div>
                </div>

                <!-- Linha 10: IA Executiva -->
                <div class="card card-glass" style="margin-bottom:24px;background:linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))">
                    <div class="card-header" style="margin-bottom:12px">
                        <span class="card-title">🤖 Copiloto PLURI IA</span>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;color:var(--text-secondary);font-size:0.9rem">
                        ${generateIASuggestions(data)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * KPI Card com sparkline e variação
     */
    function kpiCard(title, value, icon, variation, varClass, comparison, color, sparklineData = []) {
        const sparkHTML = sparklineData && sparklineData.length > 0 
            ? `<div class="sparkline-container">${Charts.createSparkline(sparklineData, { width: 200, height: 40, color: color || '#6366f1', smooth: true, fillOpacity: 0.2 })}</div>`
            : '';
        return `
            <div class="card card-glass">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <span class="card-title">${title}</span>
                    <span style="background:${color}20;color:${color};padding:4px 8px;border-radius:var(--radius-sm);font-size:0.75rem">
                        <i data-lucide="${icon}" class="icon-sm"></i>
                    </span>
                </div>
                <div class="card-value" style="font-size:1.8rem;margin:8px 0">${value}</div>
                <div style="display:flex;align-items:center">
                    ${variation ? `<span class="metric-variation ${varClass}">${variation}</span>` : ''}
                    <span class="metric-comparison">${comparison}</span>
                </div>
                ${sparkHTML}
            </div>
        `;
    }

    function simpleMetricCard(title, value, icon, color) {
        return `
            <div class="card card-glass">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span class="card-title">${title}</span>
                    <span style="background:${color}20;color:${color};padding:4px 8px;border-radius:var(--radius-sm);font-size:0.75rem">
                        <i data-lucide="${icon}" class="icon-sm"></i>
                    </span>
                </div>
                <div class="card-value" style="font-size:1.8rem">${value}</div>
            </div>
        `;
    }

    function goalProgressBar(label, current, target, percentage) {
        return `
            <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.82rem">
                    <span>${label}</span>
                    <span>${Utils.formatCurrency(current)} / ${Utils.formatCurrency(target)} (${percentage}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${percentage >= 80 ? 'success' : percentage >= 50 ? 'warning' : 'danger'}" style="width:${percentage}%"></div>
                </div>
            </div>
        `;
    }

    function generateRichTimeline(data) {
        const events = [];
        // Últimas transações
        data.transactions.slice(-3).forEach(t => {
            events.push({
                icon: 'dollar-sign',
                module: 'Financeiro',
                action: `${t.type === 'receita' ? 'Receita' : 'Despesa'} de ${Utils.formatCurrency(t.amount)} — ${t.description || ''}`,
                time: Utils.timeAgo(t.date || t.createdAt),
                user: 'Sistema',
            });
        });
        // Últimas movimentações de CRM
        data.companies.slice(-2).forEach(c => {
            events.push({
                icon: 'users',
                module: 'CRM',
                action: `Empresa ${c.company || c.name} movida para ${c.status}`,
                time: Utils.timeAgo(c.updatedAt || new Date()),
                user: 'Maria',
            });
        });
        if (events.length === 0) {
            return '<p style="color:var(--text-tertiary);text-align:center;padding:20px">Nenhuma atividade recente</p>';
        }
        return events.slice(-5).reverse().map(e => `
            <div class="timeline-v2-item">
                <div class="timeline-v2-icon"><i data-lucide="${e.icon}" class="icon-sm"></i></div>
                <div class="timeline-v2-content">
                    <strong>${e.module}</strong><br>
                    ${e.action}
                    <div class="timeline-v2-time">${e.time} • ${e.user}</div>
                </div>
            </div>
        `).join('');
    }

    function generateIASuggestions(data) {
        const suggestions = [];
        if (data.revenueVar < 0) suggestions.push(`📉 Sua receita caiu ${Math.abs(data.revenueVar)}% em relação ao mês anterior. Considere intensificar a prospecção.`);
        if (data.conversionRate < 20) suggestions.push(`⚠️ Sua taxa de conversão está em ${data.conversionRate}%. Melhore o follow-up para aumentar as vendas.`);
        if (data.profitThisMonth > 0) suggestions.push(`✅ Sua margem de lucro está positiva este mês. Ótimo trabalho!`);
        const expiringContracts = data.contracts.filter(c => {
            const daysLeft = (new Date(c.endDate) - new Date()) / (1000*60*60*24);
            return daysLeft <= 15 && daysLeft > 0 && c.status === 'ativo';
        });
        if (expiringContracts.length > 0) suggestions.push(`📅 ${expiringContracts.length} contratos vencem nos próximos 15 dias. Renove!`);
        if (data.cashFlow < 0) suggestions.push(`🔻 Seu fluxo de caixa está negativo. Reveja despesas e cobre clientes.`);
        if (suggestions.length === 0) suggestions.push('🚀 Todos os indicadores estão positivos. Continue com a estratégia atual!');
        return suggestions.map(s => `<div>${s}</div>`).join('');
    }

    return { render };
})();

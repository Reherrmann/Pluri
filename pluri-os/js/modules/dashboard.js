/**
 * PLURI OS — Dashboard Executivo V2.1
 * Cockpit inteligente com insights reais, ações editáveis e health score interativo.
 */
const Dashboard = (() => {
    // Cache para cálculos
    let cachedData = null;

    /**
     * Coleta todos os dados e gera inteligência
     */
    function gatherData() {
        const companies = Storage.loadData('crm_companies', []);
        const transactions = Storage.loadData('finance_transactions', []);
        const implantations = Storage.loadData('finance_implantations', []);
        const goals = Storage.loadData('goals', []);
        const contracts = Storage.loadData('contracts', []);
        const actions = Storage.loadData('dashboard_actions', []); // lista editável

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        // Funções auxiliares de data
        const isThisMonth = (dateStr) => {
            const d = new Date(dateStr);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        };
        const isLastMonth = (dateStr) => {
            const d = new Date(dateStr);
            const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
            const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;
            return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
        };

        // Financeiro
        const revenueThisMonth = transactions.filter(t => t.type === 'receita' && isThisMonth(t.date || t.createdAt))
            .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const revenueLastMonth = transactions.filter(t => t.type === 'receita' && isLastMonth(t.date || t.createdAt))
            .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const expensesThisMonth = transactions.filter(t => (t.type === 'despesa' || t.type === 'custo') && isThisMonth(t.date || t.createdAt))
            .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const profitThisMonth = revenueThisMonth - expensesThisMonth;
        const profitLastMonth = (revenueLastMonth || 0) - (transactions.filter(t => (t.type === 'despesa' || t.type === 'custo') && isLastMonth(t.date || t.createdAt)).reduce((s, t) => s + (parseFloat(t.amount) || 0), 0));
        const mrr = transactions.filter(t => t.type === 'mensalidade' || t.category === 'recorrente')
            .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const arr = mrr * 12;
        const cashFlow = revenueThisMonth - expensesThisMonth;
        const totalImplantations = implantations.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
        const roi = totalImplantations > 0 ? ((profitThisMonth / totalImplantations) * 100).toFixed(1) : 'N/A';

        // Comercial
        const leads = companies.filter(c => c.status === 'lead').length;
        const activeClients = companies.filter(c => c.status === 'closed').length;
        const conversionRate = companies.length > 0 ? ((activeClients / companies.length) * 100).toFixed(1) : '0';
        const ticketMedio = activeClients > 0 ? (revenueThisMonth / activeClients).toFixed(2) : '0';
        const inImplantation = implantations.filter(i => i.status === 'em_andamento').length;
        const activeContracts = contracts.filter(c => c.status === 'ativo').length;

        // Histórico para sparkline (últimos 6 meses)
        const revenueHistory = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(thisYear, thisMonth - i, 1);
            const total = transactions.filter(t => {
                const td = new Date(t.date || t.createdAt);
                return t.type === 'receita' && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
            }).reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
            revenueHistory.push(total);
        }

        // Variações percentuais
        const revenueVar = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100).toFixed(1) : 0;
        const profitVar = profitLastMonth !== 0 ? ((profitThisMonth - profitLastMonth) / Math.abs(profitLastMonth) * 100).toFixed(1) : 0;

        // Metas
        const monthlyRevenueGoal = goals.find(g => g.period === 'monthly' && g.category === 'receita');
        const revenueGoalProgress = monthlyRevenueGoal ? Math.min((revenueThisMonth / parseFloat(monthlyRevenueGoal.target || 1)) * 100, 100).toFixed(1) : null;

        // Health Score (0-100) com regras simplificadas
        let healthScore = 50;
        if (revenueVar > 0) healthScore += 10; else healthScore -= 5;
        if (conversionRate > 20) healthScore += 10;
        if (activeClients > 10) healthScore += 10;
        if (profitThisMonth > 0) healthScore += 15; else healthScore -= 10;
        if (cashFlow > 0) healthScore += 15; else healthScore -= 5;
        healthScore = Math.max(0, Math.min(100, healthScore));

        // Indicadores reais (substitui criteria)
        const healthIndicators = [
            {
                label: 'Receita',
                value: revenueVar,
                unit: '%',
                status: revenueVar >= 0 ? 'positive' : 'negative',
                detail: revenueVar >= 0 ? `+${revenueVar}% vs mês anterior` : `${revenueVar}% vs mês anterior`
            },
            {
                label: 'Conversão',
                value: conversionRate,
                unit: '%',
                status: conversionRate >= 20 ? 'positive' : 'negative',
                detail: `${conversionRate}%`
            },
            {
                label: 'Lucro',
                value: profitVar,
                unit: '%',
                status: profitVar >= 0 ? 'positive' : 'negative',
                detail: profitVar >= 0 ? `+${profitVar}% vs mês anterior` : `${profitVar}% vs mês anterior`
            },
            {
                label: 'Fluxo de Caixa',
                value: cashFlow,
                unit: 'R$',
                status: cashFlow >= 0 ? 'positive' : 'negative',
                detail: Utils.formatCurrency(cashFlow)
            },
            {
                label: 'Clientes Ativos',
                value: activeClients,
                unit: '',
                status: activeClients >= 10 ? 'positive' : 'negative',
                detail: `${activeClients} clientes`
            }
        ];

        // Insights
        const insights = [];
        if (revenueVar < 0) insights.push({ icon: '📉', text: `Receita caiu ${Math.abs(revenueVar)}% em relação ao mês passado.`, source: 'Financeiro', type: 'warning' });
        else if (revenueVar > 10) insights.push({ icon: '📈', text: `Receita cresceu ${revenueVar}% este mês!`, source: 'Financeiro', type: 'success' });
        if (conversionRate < 20 && companies.length > 5) insights.push({ icon: '⚠️', text: `Taxa de conversão baixa: ${conversionRate}%.`, source: 'CRM', type: 'warning' });
        const oldProposals = companies.filter(c => c.status === 'proposal' && (new Date() - new Date(c.updatedAt)) > 15*24*60*60*1000);
        if (oldProposals.length > 0) insights.push({ icon: '⏳', text: `${oldProposals.length} propostas paradas há mais de 15 dias.`, source: 'CRM', type: 'danger' });
        if (profitThisMonth < 0) insights.push({ icon: '🔻', text: 'Lucro negativo este mês. Revise custos.', source: 'Financeiro', type: 'danger' });
        if (revenueGoalProgress !== null && revenueGoalProgress < 80) insights.push({ icon: '🎯', text: `Meta de receita em ${revenueGoalProgress}% — abaixo do esperado.`, source: 'Metas', type: 'warning' });

        // Pipeline resumido
        const stages = Storage.loadData('crm_pipeline_stages', []);
        const pipelineSummary = stages.map(stage => ({
            name: stage.name,
            count: companies.filter(c => c.status === stage.id).length,
            value: companies.filter(c => c.status === stage.id).reduce((s, c) => s + (parseFloat(c.value || 0)), 0),
        }));

        return {
            revenueThisMonth, revenueLastMonth, revenueVar,
            expensesThisMonth, profitThisMonth, profitVar,
            mrr, arr, cashFlow, roi,
            leads, activeClients, conversionRate, ticketMedio, inImplantation, activeContracts,
            revenueHistory,
            revenueGoalProgress,
            healthScore, healthIndicators,
            insights,
            actions,
            pipelineSummary,
            companies, transactions, goals, contracts,
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
                    <button class="btn-secondary btn-sm" onclick="PLURI.navigateTo('finance')">
                        <i data-lucide="plus" class="icon-sm"></i> Ação Rápida
                    </button>
                </div>

                <!-- ===== SEÇÃO 1: KPIs Principais ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="bar-chart-3" class="icon"></i> Indicadores Principais
                </h3>
                <div class="cards-grid" style="margin-bottom:32px">
                    ${kpiCard('Receita do Mês', Utils.formatCurrency(data.revenueThisMonth), 'dollar-sign', data.revenueVar + '%', data.revenueVar >= 0 ? 'positive' : 'negative', 'vs mês passado', '#22c55e', data.revenueHistory)}
                    ${kpiCard('MRR', Utils.formatCurrency(data.mrr), 'repeat', '0%', 'positive', 'Receita Recorrente', '#6366f1', data.revenueHistory)}
                    ${kpiCard('ARR', Utils.formatCurrency(data.arr), 'calendar', '0%', 'positive', 'Anualizado', '#8b5cf6', data.revenueHistory)}
                    ${kpiCard('Lucro Líquido', Utils.formatCurrency(data.profitThisMonth), 'trending-up', data.profitVar + '%', data.profitVar >= 0 ? 'positive' : 'negative', 'vs mês anterior', data.profitThisMonth >= 0 ? '#22c55e' : '#ef4444', data.revenueHistory)}
                    ${kpiCard('Fluxo de Caixa', Utils.formatCurrency(data.cashFlow), 'activity', '', 'positive', 'Saldo do mês', '#3b82f6')}
                    ${kpiCard('ROI', data.roi + '%', 'percent', '', data.roi > 0 ? 'positive' : 'negative', 'Retorno s/ Invest.', '#f59e0b')}
                </div>

                <!-- ===== SEÇÃO 2: Comercial ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="users" class="icon"></i> Comercial
                </h3>
                <div class="cards-grid" style="margin-bottom:32px">
                    ${simpleMetricCard('Leads', data.leads, 'users', '#6366f1')}
                    ${simpleMetricCard('Clientes Ativos', data.activeClients, 'user-check', '#22c55e')}
                    ${simpleMetricCard('Conversão', data.conversionRate + '%', 'percent', '#f59e0b')}
                    ${simpleMetricCard('Ticket Médio', Utils.formatCurrency(data.ticketMedio), 'receipt', '#3b82f6')}
                    ${simpleMetricCard('Implantações', data.inImplantation, 'rocket', '#8b5cf6')}
                    ${simpleMetricCard('Contratos Ativos', data.activeContracts, 'file-text', '#06b6d4')}
                </div>

                <!-- ===== SEÇÃO 3: Insights Inteligentes ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="lightbulb" class="icon"></i> Insights Inteligentes
                </h3>
                <div class="card card-glass" style="margin-bottom:32px">
                    ${data.insights.length > 0 ? data.insights.map(i => `
                        <div class="insight-item">
                            <span class="insight-icon">${i.icon}</span>
                            <div>
                                <span>${i.text}</span>
                                <div style="font-size:0.7rem;color:var(--text-tertiary)">Origem: ${i.source}</div>
                            </div>
                        </div>
                    `).join('') : '<p style="color:var(--text-tertiary);text-align:center;padding:20px">Nenhum alerta no momento. 🎉</p>'}
                </div>

                <!-- ===== SEÇÃO 4: Hoje você precisa (editável) ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="check-square" class="icon"></i> Hoje você precisa
                    <button class="btn-icon btn-sm" onclick="Dashboard.addAction()" style="margin-left:auto"><i data-lucide="plus" class="icon-sm"></i></button>
                </h3>
                <div class="card card-glass" style="margin-bottom:32px" id="actions-container">
                    ${renderActions(data.actions)}
                </div>

                <!-- ===== SEÇÃO 5: Funil Comercial ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="funnel" class="icon"></i> Funil Comercial
                </h3>
                <div class="card card-glass" style="margin-bottom:32px">
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

                <!-- ===== SEÇÃO 6: Financeiro ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="dollar-sign" class="icon"></i> Financeiro
                </h3>
                <div class="card card-glass" style="margin-bottom:32px">
                    <div style="display:flex;align-items:center;justify-content:center;gap:40px;padding:20px 0">
                        ${Charts.createDonut(data.revenueThisMonth > 0 ? (data.profitThisMonth > 0 ? 70 : 30) : 0, { size: 100, color: '#22c55e', bgColor: '#ef4444' })}
                        <div>
                            <div><span style="color:var(--success)">Receita:</span> ${Utils.formatCurrency(data.revenueThisMonth)}</div>
                            <div><span style="color:var(--danger)">Despesa:</span> ${Utils.formatCurrency(data.expensesThisMonth)}</div>
                            <div><span style="color:var(--accent)">Lucro:</span> ${Utils.formatCurrency(data.profitThisMonth)}</div>
                        </div>
                    </div>
                </div>

                <!-- ===== SEÇÃO 7: Metas ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="flag" class="icon"></i> Metas
                    <button class="btn-secondary btn-sm" style="margin-left:auto" onclick="PLURI.navigateTo('goals')">Ver todas</button>
                </h3>
                <div class="card card-glass" style="margin-bottom:32px">
                    ${data.revenueGoalProgress !== null ? goalProgressBar('Receita Mensal', data.revenueThisMonth, parseFloat(data.goals?.find(g => g.category==='receita')?.target || 1), data.revenueGoalProgress) : '<p style="color:var(--text-tertiary);text-align:center;padding:20px">Nenhuma meta de receita definida. <a href="#" onclick="PLURI.navigateTo(\'goals\')">Criar meta</a></p>'}
                </div>

                <!-- ===== SEÇÃO 8: Saúde da Empresa (compacta e com % reais) ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="heart" class="icon"></i> Saúde da Empresa
                </h3>
                <div class="card card-glass" style="margin-bottom:32px">
                    <div style="display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start">
                        <!-- Círculo de pontuação -->
                        <div style="text-align:center">
                            <div class="health-score-circle" style="background: conic-gradient(${data.healthScore >= 70 ? '#22c55e' : data.healthScore >= 40 ? '#f59e0b' : '#ef4444'} ${data.healthScore}%, var(--bg-tertiary) 0);">
                                <span style="color:var(--text-primary);font-size:2rem">${data.healthScore}</span>
                            </div>
                            <p style="margin-top:8px;font-weight:600;color:var(--text-primary)">
                                ${data.healthScore >= 70 ? '🟢 Saudável' : data.healthScore >= 40 ? '🟡 Atenção' : '🔴 Crítico'}
                            </p>
                        </div>

                        <!-- Indicadores reais -->
                        <div>
                            <h4 style="font-weight:600;margin-bottom:8px">Indicadores avaliados</h4>
                            <div style="display:flex;flex-direction:column;gap:8px;font-size:0.85rem">
                                ${data.healthIndicators.map(ind => `
                                    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-subtle)">
                                        <span style="color:var(--text-secondary)">${ind.label}</span>
                                        <span style="font-weight:500;color:${ind.status === 'positive' ? 'var(--success)' : 'var(--danger)'}">
                                            ${ind.value}${ind.unit}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>

                            <!-- Recomendações (apenas se existirem) -->
                            ${data.insights.filter(i => i.type === 'warning' || i.type === 'danger').length > 0 ? `
                            <div style="margin-top:16px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:var(--radius-md);padding:12px">
                                <h5 style="font-weight:600;color:var(--warning);margin-bottom:6px">💡 Recomendações</h5>
                                <ul style="margin:0;padding-left:16px;font-size:0.85rem;color:var(--text-secondary)">
                                    ${generateRecommendations(data.insights)}
                                </ul>
                            </div>
                            ` : ''}

                            <p style="margin-top:12px;font-size:0.75rem;color:var(--text-tertiary)">
                                <i data-lucide="info" class="icon-sm"></i> O score é uma média ponderada dos indicadores acima.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- ===== SEÇÃO 9: Assistente Executivo PLURI ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="bot" class="icon"></i> Assistente Executivo PLURI
                </h3>
                <div class="card card-glass" style="margin-bottom:32px;background:linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))">
                    <div style="color:var(--text-secondary);font-size:0.9rem">
                        ${generateAssistenteSuggestions(data)}
                    </div>
                    <div style="font-size:0.7rem;color:var(--text-tertiary);margin-top:12px">
                        <i data-lucide="info" class="icon-sm"></i> Sugestões baseadas em dados reais do sistema.
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // COMPONENTES
    // =============================================

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
                <div style="text-align:right;margin-top:4px">
                    <a href="#" onclick="PLURI.navigateTo('goals')" style="font-size:0.75rem;color:var(--accent)">Ver metas →</a>
                </div>
            </div>
        `;
    }

    function renderActions(actions) {
        if (!actions || !actions.length) {
            return '<p style="color:var(--text-tertiary);text-align:center;padding:20px">Nenhuma ação pendente.</p>';
        }
        return actions.map((a, i) => `
            <div class="action-item" id="action-${i}">
                <span class="priority-dot ${a.priority}"></span>
                <span style="flex:1;text-decoration:${a.done ? 'line-through' : 'none'};color:${a.done ? 'var(--text-tertiary)' : 'var(--text-primary)'}">${a.text}</span>
                <button class="btn-icon btn-sm" onclick="Dashboard.toggleAction(${i})" title="${a.done ? 'Desmarcar' : 'Concluir'}">
                    <i data-lucide="${a.done ? 'rotate-ccw' : 'check'}" class="icon-sm"></i>
                </button>
                <button class="btn-icon btn-sm" onclick="Dashboard.removeAction(${i})" title="Remover">
                    <i data-lucide="trash-2" class="icon-sm"></i>
                </button>
            </div>
        `).join('');
    }

    function generateAssistenteSuggestions(data) {
        const suggestions = [];
        if (data.revenueVar < 0) suggestions.push(`📉 Sua receita caiu ${Math.abs(data.revenueVar)}% em relação ao mês anterior. Considere intensificar a prospecção.`);
        if (data.conversionRate < 20) suggestions.push(`⚠️ Sua taxa de conversão está em ${data.conversionRate}%. Melhore o follow-up.`);
        if (data.profitThisMonth > 0) suggestions.push(`✅ Sua margem de lucro está positiva este mês. Ótimo trabalho!`);
        const expiringContracts = data.contracts.filter(c => {
            const daysLeft = (new Date(c.endDate) - new Date()) / (1000*60*60*24);
            return daysLeft <= 15 && daysLeft > 0 && c.status === 'ativo';
        });
        if (expiringContracts.length > 0) suggestions.push(`📅 ${expiringContracts.length} contratos vencem nos próximos 15 dias. Renove!`);
        if (data.cashFlow < 0) suggestions.push(`🔻 Seu fluxo de caixa está negativo. Reveja despesas.`);
        if (suggestions.length === 0) suggestions.push('🚀 Todos os indicadores estão positivos. Continue com a estratégia atual!');
        return suggestions.map(s => `<div style="margin-bottom:6px">${s}</div>`).join('');
    }

    /**
     * Gera recomendações acionáveis a partir de insights
     */
    function generateRecommendations(insights) {
        const recs = [];
        insights.forEach(i => {
            if (i.text.includes('Receita caiu')) recs.push('Intensificar prospecção e follow-up.');
            if (i.text.includes('conversão')) recs.push('Revisar processo de vendas e follow-up.');
            if (i.text.includes('Lucro negativo')) recs.push('Reduzir custos ou renegociar contratos.');
            if (i.text.includes('Fluxo negativo')) recs.push('Acelerar cobranças e revisar despesas.');
        });
        // Remove duplicatas
        return [...new Set(recs)].map(r => `<li>${r}</li>`).join('');
    }

    // =============================================
    // FUNÇÕES PÚBLICAS (ações editáveis)
    // =============================================

    function addAction() {
        const actions = Storage.loadData('dashboard_actions', []);
        Components.openModal({
            title: 'Nova Ação',
            bodyHTML: `
                <div class="form-group"><label class="form-label">Descrição</label><input type="text" id="new-action-text" class="form-input"></div>
                <div class="form-group"><label class="form-label">Prioridade</label>
                    <select id="new-action-priority" class="form-select">
                        <option value="high">Alta</option>
                        <option value="medium" selected>Média</option>
                        <option value="low">Baixa</option>
                    </select>
                </div>`,
            footerHTML: `<button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button>
                         <button class="btn-primary" onclick="Dashboard.saveNewAction()">Adicionar</button>`,
        });
    }

    function saveNewAction() {
        const text = document.getElementById('new-action-text').value.trim();
        const priority = document.getElementById('new-action-priority').value;
        if (!text) return;
        const actions = Storage.loadData('dashboard_actions', []);
        actions.push({ text, priority, done: false });
        Storage.saveData('dashboard_actions', actions);
        Components.closeModal();
        PLURI.refreshCurrentModule();
    }

    function toggleAction(index) {
        const actions = Storage.loadData('dashboard_actions', []);
        if (actions[index]) actions[index].done = !actions[index].done;
        Storage.saveData('dashboard_actions', actions);
        PLURI.refreshCurrentModule();
    }

    function removeAction(index) {
        const actions = Storage.loadData('dashboard_actions', []);
        actions.splice(index, 1);
        Storage.saveData('dashboard_actions', actions);
        PLURI.refreshCurrentModule();
    }

    window.Dashboard = { render, addAction, saveNewAction, toggleAction, removeAction };
    return { render, addAction, saveNewAction, toggleAction, removeAction };
})();

/**
 * PLURI OS — Dashboard Executivo V3
 * Refinamento completo: tooltips, estados vazios, insights ricos, ações inteligentes,
 * funil clicável, filtros financeiros, metas detalhadas, saúde explicável, copiloto proativo.
 */
const Dashboard = (() => {
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
        const actions = Storage.loadData('dashboard_actions', []);

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

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
        const roi = totalImplantations > 0 ? ((profitThisMonth / totalImplantations) * 100).toFixed(1) : null;

        // Comercial
        const leads = companies.filter(c => c.status === 'lead').length;
        const activeClients = companies.filter(c => c.status === 'closed').length;
        const conversionRate = companies.length > 0 ? ((activeClients / companies.length) * 100).toFixed(1) : '0';
        const ticketMedio = activeClients > 0 ? (revenueThisMonth / activeClients).toFixed(2) : '0';
        const inImplantation = implantations.filter(i => i.status === 'em_andamento').length;
        const activeContracts = contracts.filter(c => c.status === 'ativo').length;

        // Histórico de receita (6 meses)
        const revenueHistory = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(thisYear, thisMonth - i, 1);
            const total = transactions.filter(t => {
                const td = new Date(t.date || t.createdAt);
                return t.type === 'receita' && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
            }).reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
            revenueHistory.push(total);
        }

        // Variações
        const revenueVar = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100).toFixed(1) : 0;
        const profitVar = profitLastMonth !== 0 ? ((profitThisMonth - profitLastMonth) / Math.abs(profitLastMonth) * 100).toFixed(1) : 0;

        // Metas
        const monthlyRevenueGoal = goals.find(g => g.period === 'monthly' && g.category === 'receita');
        const revenueGoalProgress = monthlyRevenueGoal ? Math.min((revenueThisMonth / parseFloat(monthlyRevenueGoal.target || 1)) * 100, 100).toFixed(1) : null;
        const revenueGoalRemaining = monthlyRevenueGoal ? Math.max(parseFloat(monthlyRevenueGoal.target) - revenueThisMonth, 0) : 0;

        // Previsão de conclusão da meta (dias restantes no mês / progresso diário necessário)
        const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
        const daysLeft = daysInMonth - now.getDate();
        const dailyNeeded = revenueGoalRemaining > 0 && daysLeft > 0 ? revenueGoalRemaining / daysLeft : 0;
        const avgDailyRevenue = revenueThisMonth / Math.max(now.getDate(), 1);
        const forecastDays = dailyNeeded > 0 && avgDailyRevenue > 0 ? Math.ceil(revenueGoalRemaining / avgDailyRevenue) : null;

        // Health Score detalhado
        let healthScore = 50;
        const healthDetails = [];
        if (revenueVar > 0) { healthScore += 10; healthDetails.push({ label: 'Receita', value: `+${revenueVar}%`, impact: '+10', status: 'positive' }); }
        else { healthScore -= 5; healthDetails.push({ label: 'Receita', value: `${revenueVar}%`, impact: '-5', status: 'negative' }); }
        if (conversionRate >= 20) { healthScore += 10; healthDetails.push({ label: 'Conversão', value: `${conversionRate}%`, impact: '+10', status: 'positive' }); }
        else healthDetails.push({ label: 'Conversão', value: `${conversionRate}%`, impact: '0', status: 'negative' });
        if (activeClients >= 10) { healthScore += 10; healthDetails.push({ label: 'Clientes', value: activeClients.toString(), impact: '+10', status: 'positive' }); }
        else healthDetails.push({ label: 'Clientes', value: activeClients.toString(), impact: '0', status: 'negative' });
        if (profitThisMonth > 0) { healthScore += 15; healthDetails.push({ label: 'Lucro', value: Utils.formatCurrency(profitThisMonth), impact: '+15', status: 'positive' }); }
        else { healthScore -= 10; healthDetails.push({ label: 'Lucro', value: Utils.formatCurrency(profitThisMonth), impact: '-10', status: 'negative' }); }
        if (cashFlow >= 0) { healthScore += 15; healthDetails.push({ label: 'Fluxo de Caixa', value: Utils.formatCurrency(cashFlow), impact: '+15', status: 'positive' }); }
        else { healthScore -= 5; healthDetails.push({ label: 'Fluxo de Caixa', value: Utils.formatCurrency(cashFlow), impact: '-5', status: 'negative' }); }
        healthScore = Math.max(0, Math.min(100, healthScore));

        // Indicadores reais
        const healthIndicators = [
            { label: 'Receita', value: revenueVar, unit: '%', status: revenueVar >= 0 ? 'positive' : 'negative' },
            { label: 'Conversão', value: conversionRate, unit: '%', status: conversionRate >= 20 ? 'positive' : 'negative' },
            { label: 'Lucro', value: profitVar, unit: '%', status: profitVar >= 0 ? 'positive' : 'negative' },
            { label: 'Fluxo de Caixa', value: cashFlow, unit: 'R$', status: cashFlow >= 0 ? 'positive' : 'negative' },
            { label: 'Clientes Ativos', value: activeClients, unit: '', status: activeClients >= 10 ? 'positive' : 'negative' },
        ];

        // Insights enriquecidos
        const insights = [];
        if (revenueVar < 0) {
            insights.push({
                icon: '📉',
                text: `Receita caiu ${Math.abs(revenueVar)}% este mês.`,
                recommendation: 'Intensifique a prospecção e o follow-up.',
                priority: 'high',
                category: 'Financeiro',
                module: 'crm'
            });
        }
        if (conversionRate < 20 && companies.length > 5) {
            insights.push({
                icon: '⚠️',
                text: `Conversão baixa: ${conversionRate}%.`,
                recommendation: 'Revise o processo de vendas e follow-up.',
                priority: 'high',
                category: 'Comercial',
                module: 'crm'
            });
        }
        const oldProposals = companies.filter(c => c.status === 'proposal' && (new Date() - new Date(c.updatedAt)) > 15*24*60*60*1000);
        if (oldProposals.length > 0) {
            insights.push({
                icon: '⏳',
                text: `${oldProposals.length} propostas paradas há +15 dias.`,
                recommendation: 'Faça follow-up urgente dessas empresas.',
                priority: 'high',
                category: 'CRM',
                module: 'crm'
            });
        }
        if (profitThisMonth < 0) {
            insights.push({
                icon: '🔻',
                text: `Lucro negativo: ${Utils.formatCurrency(profitThisMonth)}.`,
                recommendation: 'Reduza custos em 15% para voltar ao azul.',
                priority: 'high',
                category: 'Financeiro',
                module: 'finance'
            });
        }
        if (revenueGoalProgress !== null && revenueGoalProgress < 80) {
            insights.push({
                icon: '🎯',
                text: `Meta de receita em ${revenueGoalProgress}%.`,
                recommendation: `Faltam ${Utils.formatCurrency(revenueGoalRemaining)} para bater a meta.`,
                priority: 'medium',
                category: 'Metas',
                module: 'goals'
            });
        }

        // Pipeline com taxas
        const stages = Storage.loadData('crm_pipeline_stages', []);
        const pipelineSummary = stages.map((stage, index) => {
            const count = companies.filter(c => c.status === stage.id).length;
            const value = companies.filter(c => c.status === stage.id).reduce((s, c) => s + (parseFloat(c.value || 0)), 0);
            const prevCount = index > 0 ? companies.filter(c => c.status === stages[index-1].id).length : count;
            const conversionToHere = prevCount > 0 ? ((count / prevCount) * 100).toFixed(1) : '100';
            return { ...stage, count, value, conversionToHere };
        });

        // Ações inteligentes geradas automaticamente
        const smartActions = [];
        if (leads > 0) smartActions.push({ text: `Fazer follow-up com ${leads} leads`, priority: 'high', icon: 'phone', module: 'crm' });
        if (oldProposals.length > 0) smartActions.push({ text: `Dar atenção a ${oldProposals.length} propostas paradas`, priority: 'high', icon: 'file-text', module: 'crm' });
        if (inImplantation > 0) smartActions.push({ text: `Acompanhar ${inImplantation} implantações em andamento`, priority: 'medium', icon: 'rocket', module: 'implantations' });
        const expiringContracts = contracts.filter(c => {
            const daysLeft = (new Date(c.endDate) - new Date()) / (1000*60*60*24);
            return daysLeft <= 30 && daysLeft > 0 && c.status === 'ativo';
        });
        if (expiringContracts.length > 0) smartActions.push({ text: `Renovar ${expiringContracts.length} contratos próximos do vencimento`, priority: 'medium', icon: 'refresh-cw', module: 'contracts' });
        if (!monthlyRevenueGoal) smartActions.push({ text: 'Definir meta de receita mensal', priority: 'medium', icon: 'flag', module: 'goals' });

        return {
            revenueThisMonth, revenueLastMonth, revenueVar,
            expensesThisMonth, profitThisMonth, profitVar,
            mrr, arr, cashFlow, roi,
            leads, activeClients, conversionRate, ticketMedio, inImplantation, activeContracts,
            revenueHistory,
            revenueGoalProgress, revenueGoalRemaining, forecastDays, dailyNeeded, avgDailyRevenue,
            healthScore, healthIndicators, healthDetails,
            insights,
            actions, smartActions,
            pipelineSummary,
            companies, transactions, goals, contracts,
            daysLeft, now,
        };
    }

    function render() {
        const data = gatherData();
        cachedData = data;

        // Função auxiliar para tooltip
        const tooltip = (text) => `<span class="has-tooltip" data-tooltip="${text}">?</span>`;

        return `
            <div class="fade-in">
                <!-- Header -->
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px">
                    <div>
                        <h2 style="font-weight:700;font-size:1.5rem;letter-spacing:-0.02em">Bom dia, Diretoria 👋</h2>
                        <p style="color:var(--text-tertiary);font-size:0.9rem">${Utils.formatDate(data.now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
                    ${kpiCard('Receita do Mês', Utils.formatCurrency(data.revenueThisMonth), 'dollar-sign', data.revenueVar + '%', data.revenueVar >= 0 ? 'positive' : 'negative', 'vs mês passado', '#22c55e', data.revenueHistory,
                        'Soma de todas as receitas registradas neste mês.')}
                    ${kpiCard('MRR', Utils.formatCurrency(data.mrr), 'repeat', '', 'positive', 'Receita Recorrente Mensal', '#6366f1', data.revenueHistory,
                        'Receita recorrente mensal proveniente de contratos ativos.')}
                    ${kpiCard('ARR', Utils.formatCurrency(data.arr), 'calendar', '', 'positive', 'Anualizado', '#8b5cf6', data.revenueHistory,
                        'Receita recorrente anual projetada (MRR × 12).')}
                    ${kpiCard('Lucro Líquido', Utils.formatCurrency(data.profitThisMonth), 'trending-up', data.profitVar + '%', data.profitVar >= 0 ? 'positive' : 'negative', 'vs mês anterior', data.profitThisMonth >= 0 ? '#22c55e' : '#ef4444', data.revenueHistory,
                        'Receita total menos despesas do mês.')}
                    ${kpiCard('Fluxo de Caixa', Utils.formatCurrency(data.cashFlow), 'activity', '', data.cashFlow >= 0 ? 'positive' : 'negative', 'Saldo do mês', '#3b82f6', null,
                        'Saldo entre entradas e saídas no período.')}
                    ${kpiCard('ROI', data.roi !== null ? data.roi + '%' : 'Dados insuficientes', 'percent', '', data.roi > 0 ? 'positive' : 'negative', 'Retorno s/ Invest.', '#f59e0b', null,
                        'Retorno sobre o investimento em implantações.')}
                </div>

                <!-- ===== SEÇÃO 2: Comercial ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="users" class="icon"></i> Comercial
                </h3>
                <div class="cards-grid" style="margin-bottom:32px">
                    ${clickableMetricCard('Leads', data.leads, 'users', '#6366f1', 'crm', 'lead')}
                    ${clickableMetricCard('Clientes Ativos', data.activeClients, 'user-check', '#22c55e', 'crm', 'closed')}
                    ${clickableMetricCard('Conversão', data.conversionRate + '%', 'percent', '#f59e0b', 'crm')}
                    ${clickableMetricCard('Ticket Médio', data.activeClients > 0 ? Utils.formatCurrency(data.ticketMedio) : 'Sem dados', 'receipt', '#3b82f6', 'finance')}
                    ${clickableMetricCard('Implantações', data.inImplantation, 'rocket', '#8b5cf6', 'implantations')}
                    ${clickableMetricCard('Contratos Ativos', data.activeContracts, 'file-text', '#06b6d4', 'contracts')}
                </div>

                <!-- ===== SEÇÃO 3: Insights Inteligentes ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="lightbulb" class="icon"></i> Insights Inteligentes
                </h3>
                <div class="card card-glass" style="margin-bottom:32px">
                    ${data.insights.length > 0 ? data.insights.map(i => `
                        <div class="insight-card">
                            <div class="insight-priority ${i.priority}"></div>
                            <div style="flex:1">
                                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                                    <span>${i.icon}</span>
                                    <strong style="font-size:0.9rem">${i.text}</strong>
                                    <span class="badge-tag ${i.priority === 'high' ? 'danger' : i.priority === 'medium' ? 'warning' : 'info'}">${i.priority === 'high' ? 'Crítico' : i.priority === 'medium' ? 'Atenção' : 'Info'}</span>
                                </div>
                                <p style="color:var(--text-secondary);font-size:0.82rem;margin:4px 0">💡 ${i.recommendation}</p>
                                <span style="font-size:0.7rem;color:var(--text-tertiary)">${i.category}</span>
                                <button class="btn-secondary btn-sm" style="margin-left:8px" onclick="PLURI.navigateTo('${i.module}')">Ver →</button>
                            </div>
                        </div>
                    `).join('') : '<p style="color:var(--text-tertiary);text-align:center;padding:20px">Nenhum alerta no momento. 🎉</p>'}
                </div>

                <!-- ===== SEÇÃO 4: Hoje você precisa ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="check-square" class="icon"></i> Hoje você precisa
                    <button class="btn-icon btn-sm" onclick="Dashboard.addAction()" style="margin-left:auto"><i data-lucide="plus" class="icon-sm"></i></button>
                </h3>
                <div class="card card-glass" style="margin-bottom:32px">
                    ${renderSmartActions(data)}
                </div>

                <!-- ===== SEÇÃO 5: Funil Comercial ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="funnel" class="icon"></i> Funil Comercial
                </h3>
                <div class="card card-glass" style="margin-bottom:32px">
                    <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px">
                        ${data.pipelineSummary.map((s, idx) => `
                            <div style="flex:1;min-width:130px;background:var(--bg-tertiary);border-radius:var(--radius-md);padding:12px;text-align:center;cursor:pointer"
                                 onclick="PLURI.navigateTo('crm')" class="card-clickable">
                                <div style="font-weight:600;font-size:0.8rem;color:var(--text-secondary);margin-bottom:4px">${s.name}</div>
                                <div style="font-size:1.5rem;font-weight:700">${s.count}</div>
                                <div style="font-size:0.75rem;color:var(--text-tertiary)">${Utils.formatCurrency(s.value)}</div>
                                ${idx > 0 ? `<div style="font-size:0.7rem;color:var(--text-tertiary);margin-top:4px">Conv. ${s.conversionToHere}%</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- ===== SEÇÃO 6: Financeiro ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="dollar-sign" class="icon"></i> Financeiro
                </h3>
                <div class="card card-glass" style="margin-bottom:32px">
                    <div class="filter-bar">
                        <span class="filter-chip active" onclick="Dashboard.filterFinance('month', this)">Este mês</span>
                        <span class="filter-chip" onclick="Dashboard.filterFinance('quarter', this)">Trimestre</span>
                        <span class="filter-chip" onclick="Dashboard.filterFinance('year', this)">Ano</span>
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

                <!-- ===== SEÇÃO 7: Metas ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="flag" class="icon"></i> Metas
                    <button class="btn-secondary btn-sm" style="margin-left:auto" onclick="window.PLURI.navigateTo('goals')">Ver todas</button>
                </h3>
                <div class="card card-glass" style="margin-bottom:32px">
                    ${data.revenueGoalProgress !== null ? enhancedGoalProgress('Receita Mensal', data.revenueThisMonth, parseFloat(data.goals?.find(g => g.category==='receita')?.target || 1), data.revenueGoalProgress, data.revenueGoalRemaining, data.forecastDays, data.avgDailyRevenue) : `
                        <div class="empty-state-enhanced">
                            <div class="empty-icon">🎯</div>
                            <h4>Nenhuma meta de receita</h4>
                            <p>Defina uma meta mensal para acompanhar seu progresso.</p>
                            <button class="btn-primary btn-sm" onclick="window.PLURI.navigateTo('goals')">Criar Meta</button>
                        </div>
                    `}
                </div>

                <!-- ===== SEÇÃO 8: Saúde da Empresa ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="heart" class="icon"></i> Saúde da Empresa
                </h3>
                <div class="card card-glass" style="margin-bottom:32px">
                    <div style="display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start">
                        <div style="text-align:center">
                            <div class="health-score-circle" style="background: conic-gradient(${data.healthScore >= 70 ? '#22c55e' : data.healthScore >= 40 ? '#f59e0b' : '#ef4444'} ${data.healthScore}%, var(--bg-tertiary) 0);">
                                <span style="color:var(--text-primary);font-size:2rem">${data.healthScore}</span>
                            </div>
                            <p style="margin-top:8px;font-weight:600;color:var(--text-primary)">
                                ${data.healthScore >= 70 ? '🟢 Saudável' : data.healthScore >= 40 ? '🟡 Atenção' : '🔴 Crítico'}
                            </p>
                        </div>
                        <div>
                            <h4 style="font-weight:600;margin-bottom:8px">Como foi calculado</h4>
                            <div style="display:flex;flex-direction:column;gap:6px;font-size:0.85rem">
                                ${data.healthDetails.map(d => `
                                    <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border-subtle)">
                                        <span style="color:var(--text-secondary)">${d.label} (${d.value})</span>
                                        <span style="color:${d.status === 'positive' ? 'var(--success)' : 'var(--danger)'};font-weight:500">${d.impact} pts</span>
                                    </div>
                                `).join('')}
                            </div>
                            <p style="margin-top:12px;font-size:0.75rem;color:var(--text-tertiary)">
                                💡 Melhore os indicadores em vermelho para aumentar sua nota.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- ===== SEÇÃO 9: Assistente Executivo PLURI ===== -->
                <h3 style="font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                    <i data-lucide="bot" class="icon"></i> Assistente Executivo PLURI
                </h3>
                <div class="card card-glass" style="margin-bottom:32px;background:linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))">
                    <div style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6">
                        ${generateCopilotSuggestions(data)}
                    </div>
                    <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center">
                        <span style="font-size:0.7rem;color:var(--text-tertiary)">
                            <i data-lucide="info" class="icon-sm"></i> Análise baseada nos dados atuais do sistema.
                        </span>
                        <button class="btn-secondary btn-sm" onclick="PLURI.navigateTo('reports')">✨ Ver análise completa</button>
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // COMPONENTES
    // =============================================

    function kpiCard(title, value, icon, variation, varClass, comparison, color, sparklineData = [], tooltipText = '') {
        const sparkHTML = sparklineData && sparklineData.length > 0 
            ? `<div class="sparkline-container">${Charts.createSparkline(sparklineData, { width: 200, height: 40, color: color || '#6366f1', smooth: true, fillOpacity: 0.2 })}</div>`
            : '';
        const valueDisplay = value === null || value === undefined || value === 'N/A' ? 'Dados insuficientes' : value;
        const valueClass = value === null || value === undefined || value === 'N/A' ? 'card-value' : 'card-value';
        return `
            <div class="card card-glass card-clickable" onclick="PLURI.navigateTo('finance')" style="position:relative">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <span class="card-title">
                        ${title}
                        ${tooltipText ? `<span class="has-tooltip" data-tooltip="${tooltipText}" style="margin-left:4px;font-size:0.7rem;cursor:help">ⓘ</span>` : ''}
                    </span>
                    <span style="background:${color}20;color:${color};padding:4px 8px;border-radius:var(--radius-sm);font-size:0.75rem">
                        <i data-lucide="${icon}" class="icon-sm"></i>
                    </span>
                </div>
                <div class="${valueClass}" style="font-size:1.8rem;margin:8px 0">${valueDisplay}</div>
                <div style="display:flex;align-items:center">
                    ${variation ? `<span class="metric-variation ${varClass}">${variation}</span>` : ''}
                    <span class="metric-comparison">${comparison}</span>
                </div>
                ${sparkHTML}
            </div>
        `;
    }

    function clickableMetricCard(title, value, icon, color, module, filter = null) {
        const valueDisplay = value === null || value === undefined || value === 'N/A' ? 'Sem dados' : value;
        return `
            <div class="card card-glass card-clickable" onclick="PLURI.navigateTo('${module}')">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span class="card-title">${title}</span>
                    <span style="background:${color}20;color:${color};padding:4px 8px;border-radius:var(--radius-sm);font-size:0.75rem">
                        <i data-lucide="${icon}" class="icon-sm"></i>
                    </span>
                </div>
                <div class="card-value" style="font-size:1.8rem">${valueDisplay}</div>
            </div>
        `;
    }

    function enhancedGoalProgress(label, current, target, percentage, remaining, forecastDays, avgDaily) {
        const trendIcon = avgDaily > (remaining / Math.max(forecastDays || 1, 1)) ? 'trending-up' : 'trending-down';
        const trendClass = avgDaily > (remaining / Math.max(forecastDays || 1, 1)) ? 'trend-up' : 'trend-down';
        const forecastText = forecastDays ? `Previsão de conclusão em ${forecastDays} dias` : 'Ritmo atual insuficiente';
        return `
            <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.82rem">
                    <span>${label}</span>
                    <span>${Utils.formatCurrency(current)} / ${Utils.formatCurrency(target)} (${percentage}%)</span>
                </div>
                <div class="progress-bar progress-with-forecast">
                    <div class="progress-fill ${percentage >= 80 ? 'success' : percentage >= 50 ? 'warning' : 'danger'}" style="width:${percentage}%"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:0.75rem">
                    <span style="color:var(--text-tertiary)">Faltam ${Utils.formatCurrency(remaining)}</span>
                    <span class="trend-indicator ${trendClass}">
                        <i data-lucide="${trendIcon}" class="icon-sm"></i> ${forecastText}
                    </span>
                </div>
                <div style="text-align:right;margin-top:4px">
                    <a href="#" onclick="event.preventDefault(); window.PLURI.navigateTo('goals')" style="font-size:0.75rem;color:var(--accent)">Ver metas →</a>
                </div>
            </div>
        `;
    }

    function renderSmartActions(data) {
        const allActions = [...data.smartActions, ...(data.actions || []).filter(a => !a.done)];
        if (!allActions.length) {
            return '<p style="color:var(--text-tertiary);text-align:center;padding:20px">Nenhuma ação pendente. 🎉</p>';
        }
        return allActions.slice(0, 6).map((a, i) => `
            <div class="action-item" style="cursor:pointer" onclick="PLURI.navigateTo('${a.module || 'crm'}')">
                <span class="priority-dot ${a.priority}"></span>
                <i data-lucide="${a.icon || 'circle'}" class="icon-sm" style="color:var(--text-tertiary)"></i>
                <span style="flex:1">${a.text}</span>
                <span class="badge-tag ${a.priority === 'high' ? 'danger' : a.priority === 'medium' ? 'warning' : 'info'}">${a.priority === 'high' ? 'Alta' : a.priority === 'medium' ? 'Média' : 'Baixa'}</span>
            </div>
        `).join('');
    }

    function generateCopilotSuggestions(data) {
        const suggestions = [];
        // Prioridades do dia
        if (data.leads > 0 && data.conversionRate < 20) {
            suggestions.push('📌 **Hoje você deveria priorizar o comercial.** Sua taxa de conversão está abaixo do ideal.');
        }
        if (data.inImplantation > 0) {
            suggestions.push(`🚀 Existem ${data.inImplantation} implantações em andamento. Acompanhe de perto.`);
        }
        // Financeiro
        if (data.cashFlow < 0) {
            const daysUntilNegative = data.cashFlow < 0 && data.avgDailyRevenue > 0 
                ? Math.ceil(Math.abs(data.cashFlow) / data.avgDailyRevenue) 
                : null;
            suggestions.push(`⚠️ Seu fluxo de caixa está negativo. ${daysUntilNegative ? `Nesse ritmo, ficará R$ ${Utils.formatCurrency(Math.abs(data.cashFlow) + data.avgDailyRevenue * 12)} negativo em 12 dias.` : 'Reduza despesas urgentemente.'}`);
        }
        // Contratos
        const expiringContracts = data.contracts.filter(c => {
            const daysLeft = (new Date(c.endDate) - new Date()) / (1000*60*60*24);
            return daysLeft <= 30 && daysLeft > 0 && c.status === 'ativo';
        });
        if (expiringContracts.length > 0) {
            suggestions.push(`📅 ${expiringContracts.length} contratos vencem nos próximos 30 dias. Renove para não perder receita.`);
        }
        // Clientes inativos
        const inactiveClients = data.companies.filter(c => {
            if (!c.lastContact) return false;
            const daysSince = (new Date() - new Date(c.lastContact)) / (1000*60*60*24);
            return daysSince > 30 && c.status === 'closed';
        });
        if (inactiveClients.length > 0) {
            suggestions.push(`🔕 ${inactiveClients.length} clientes sem contato há mais de 30 dias. Reative o relacionamento.`);
        }
        // Metas
        if (data.revenueGoalProgress !== null && data.revenueGoalProgress >= 80) {
            suggestions.push(`🎯 Você está a ${(100 - data.revenueGoalProgress).toFixed(1)}% de bater a meta mensal! Continue assim.`);
        }
        // Oportunidades
        if (data.conversionRate > 0 && data.leads > 0) {
            const potentialRevenue = data.leads * (data.ticketMedio > 0 ? parseFloat(data.ticketMedio) : 0);
            if (potentialRevenue > 0) {
                suggestions.push(`💡 Fechando mais 2 contratos, você pode aumentar seu MRR em aproximadamente R$ ${Utils.formatCurrency(data.ticketMedio * 2)}.`);
            }
        }
        if (suggestions.length === 0) {
            suggestions.push('✅ Todos os indicadores estão estáveis. Continue monitorando.');
        }
        return suggestions.map(s => `<div style="margin-bottom:8px">${s}</div>`).join('');
    }

    // =============================================
    // FUNÇÕES PÚBLICAS
    // =============================================

    function filterFinance(period, el) {
        // Atualiza chips visuais
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        if (el) el.classList.add('active');
        // Placeholder para filtro real (pode ser expandido)
        Components.showToast(`Filtro "${period}" aplicado (versão futura)`, 'info');
    }

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
        actions.push({ text, priority, done: false, icon: 'circle', module: 'dashboard' });
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

    window.Dashboard = { render, addAction, saveNewAction, toggleAction, removeAction, filterFinance };
    return { render, addAction, saveNewAction, toggleAction, removeAction, filterFinance };
})();

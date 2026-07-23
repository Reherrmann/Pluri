/**
 * PLURI OS V2 — Dashboard Executivo V4
 * Cockpit premium com glassmorphism, paleta PLURI, insights acionáveis.
 * Mantém toda a lógica de negócio e integrações existentes.
 */
const Dashboard = (() => {
    let cachedData = null;

    /**
     * Coleta todos os dados e gera inteligência (INALTERADO)
     */
    function gatherData() {
        const companies = Storage.loadData('crm_companies', []);
        const transactions = Storage.loadData('finance_transactions', []);
        const implantations = Storage.loadData('implantations', []);
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

        const leads = companies.filter(c => c.status === 'lead').length;
        const activeClients = companies.filter(c => c.status === 'closed').length;
        const conversionRate = companies.length > 0 ? ((activeClients / companies.length) * 100).toFixed(1) : '0';
        const ticketMedio = activeClients > 0 ? (revenueThisMonth / activeClients).toFixed(2) : '0';
        const inImplantation = implantations.filter(i => i.status === 'em_andamento').length;
        const activeContracts = contracts.filter(c => c.status === 'ativo').length;

        const revenueHistory = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(thisYear, thisMonth - i, 1);
            const total = transactions.filter(t => {
                const td = new Date(t.date || t.createdAt);
                return t.type === 'receita' && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
            }).reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
            revenueHistory.push(total);
        }

        const revenueVar = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100).toFixed(1) : 0;
        const profitVar = profitLastMonth !== 0 ? ((profitThisMonth - profitLastMonth) / Math.abs(profitLastMonth) * 100).toFixed(1) : 0;

        const monthlyRevenueGoal = goals.find(g => g.period === 'monthly' && g.category === 'receita');
        const revenueGoalProgress = monthlyRevenueGoal ? Math.min((revenueThisMonth / parseFloat(monthlyRevenueGoal.target || 1)) * 100, 100).toFixed(1) : null;
        const revenueGoalRemaining = monthlyRevenueGoal ? Math.max(parseFloat(monthlyRevenueGoal.target) - revenueThisMonth, 0) : 0;

        const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
        const daysLeft = daysInMonth - now.getDate();
        const avgDailyRevenue = revenueThisMonth / Math.max(now.getDate(), 1);
        const dailyNeeded = revenueGoalRemaining > 0 && daysLeft > 0 ? revenueGoalRemaining / daysLeft : 0;
        const forecastDays = dailyNeeded > 0 && avgDailyRevenue > 0 ? Math.ceil(revenueGoalRemaining / avgDailyRevenue) : null;

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

        const insights = [];
        if (revenueVar < 0) insights.push({ icon: '📉', text: `Receita caiu ${Math.abs(revenueVar)}% este mês.`, recommendation: 'Intensifique a prospecção e o follow-up.', priority: 'high', category: 'Financeiro', module: 'crm' });
        else if (revenueVar > 10) insights.push({ icon: '📈', text: `Receita cresceu ${revenueVar}% este mês!`, recommendation: '', priority: 'low', category: 'Financeiro', module: 'finance' });
        if (conversionRate < 20 && companies.length > 5) insights.push({ icon: '⚠️', text: `Conversão baixa: ${conversionRate}%.`, recommendation: 'Revise o processo de vendas.', priority: 'high', category: 'Comercial', module: 'crm' });
        const oldProposals = companies.filter(c => c.status === 'proposal' && (new Date() - new Date(c.updatedAt)) > 15*24*60*60*1000);
        if (oldProposals.length > 0) insights.push({ icon: '⏳', text: `${oldProposals.length} propostas paradas há +15 dias.`, recommendation: 'Faça follow-up urgente.', priority: 'high', category: 'CRM', module: 'crm' });
        if (profitThisMonth < 0) insights.push({ icon: '🔻', text: `Lucro negativo: ${Utils.formatCurrency(profitThisMonth)}.`, recommendation: 'Reduza custos em 15%.', priority: 'high', category: 'Financeiro', module: 'finance' });
        if (revenueGoalProgress !== null && revenueGoalProgress < 80) insights.push({ icon: '🎯', text: `Meta de receita em ${revenueGoalProgress}%.`, recommendation: `Faltam ${Utils.formatCurrency(revenueGoalRemaining)} para bater a meta.`, priority: 'medium', category: 'Metas', module: 'goals' });

        const stages = Storage.loadData('crm_pipeline_stages', []);
        const pipelineSummary = stages.map((stage, index) => {
            const count = companies.filter(c => c.status === stage.id).length;
            const value = companies.filter(c => c.status === stage.id).reduce((s, c) => s + (parseFloat(c.value || 0)), 0);
            const prevCount = index > 0 ? companies.filter(c => c.status === stages[index-1].id).length : count;
            const conversionToHere = prevCount > 0 ? ((count / prevCount) * 100).toFixed(1) : '100';
            return { ...stage, count, value, conversionToHere };
        });

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
            healthScore, healthDetails,
            insights,
            actions, smartActions,
            pipelineSummary,
            companies, transactions, goals, contracts,
            daysLeft, now,
        };
    }

    /**
     * Renderização principal (INALTERADA a lógica, NOVA a apresentação)
     */
    function render() {
        const data = gatherData();
        cachedData = data;

        return `
            <div class="fade-in dashboard-v4">
                <!-- ========== HEADER ========== -->
                <div class="dv-header">
                    <div>
                        <h2 class="dv-greeting">Bom dia, Diretoria 👋</h2>
                        <p class="dv-date">${Utils.formatDate(data.now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <button class="btn-primary" onclick="PLURI.navigateTo('finance')" style="background:var(--dv-accent);color:#0a0e17;border:none;font-weight:600">
                        <i data-lucide="plus" class="icon-sm"></i> Ação Rápida
                    </button>
                </div>

                <!-- ========== KPIs PRINCIPAIS ========== -->
                <div class="dv-section-title">
                    <i data-lucide="bar-chart-3" class="icon-sm" style="color:var(--dv-accent)"></i> Indicadores Principais
                </div>
                <div class="dv-kpi-grid">
                    ${renderKPI('Receita do Mês', Utils.formatCurrency(data.revenueThisMonth), 'dollar-sign', data.revenueVar, 'vs mês passado', '#10b981', data.revenueHistory, 'Soma das receitas registradas este mês.')}
                    ${renderKPI('MRR', Utils.formatCurrency(data.mrr), 'repeat', 0, 'Receita Recorrente Mensal', '#3b82f6', data.revenueHistory, 'Receita recorrente mensal de contratos ativos.')}
                    ${renderKPI('ARR', Utils.formatCurrency(data.arr), 'calendar', 0, 'Anualizado', '#8b5cf6', data.revenueHistory, 'Receita recorrente anual projetada (MRR × 12).')}
                    ${renderKPI('Lucro Líquido', Utils.formatCurrency(data.profitThisMonth), 'trending-up', data.profitVar, 'vs mês anterior', data.profitThisMonth >= 0 ? '#10b981' : '#ef4444', data.revenueHistory, 'Receita total menos despesas.')}
                    ${renderKPI('Fluxo de Caixa', Utils.formatCurrency(data.cashFlow), 'activity', null, 'Saldo do mês', '#3b82f6', null, 'Saldo entre entradas e saídas no período.')}
                    ${renderKPI('ROI', data.roi !== null ? data.roi + '%' : 'Dados insuficientes', 'percent', null, 'Retorno s/ Invest.', '#f59e0b', null, 'Retorno sobre o investimento em implantações.')}
                </div>

                <!-- ========== COMERCIAL ========== -->
                <div class="dv-section-title">
                    <i data-lucide="users" class="icon-sm" style="color:var(--dv-accent)"></i> Comercial
                </div>
                <div class="dv-metric-grid">
                    ${renderMetricCard('Leads', data.leads, 'users', '#3b82f6', 'crm')}
                    ${renderMetricCard('Clientes Ativos', data.activeClients, 'user-check', '#10b981', 'crm')}
                    ${renderMetricCard('Conversão', data.conversionRate + '%', 'percent', '#f59e0b', 'crm')}
                    ${renderMetricCard('Ticket Médio', data.activeClients > 0 ? Utils.formatCurrency(data.ticketMedio) : 'Sem dados', 'receipt', '#8b5cf6', 'finance')}
                    ${renderMetricCard('Implantações', data.inImplantation, 'rocket', '#ec4899', 'implantations')}
                    ${renderMetricCard('Contratos Ativos', data.activeContracts, 'file-text', '#06b6d4', 'contracts')}
                </div>

                <!-- ========== INSIGHTS ========== -->
                <div class="dv-section-title">
                    <i data-lucide="lightbulb" class="icon-sm" style="color:var(--dv-accent)"></i> Insights Inteligentes
                </div>
                <div class="dv-card" style="margin-bottom:32px">
                    ${data.insights.length > 0 ? data.insights.map(i => `
                        <div class="dv-insight-card">
                            <div class="dv-insight-priority ${i.priority}"></div>
                            <div style="flex:1">
                                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                                    <span>${i.icon}</span>
                                    <strong style="font-size:0.9rem;color:var(--dv-text-primary)">${i.text}</strong>
                                    <span class="badge-tag ${i.priority === 'high' ? 'danger' : i.priority === 'medium' ? 'warning' : 'info'}">${i.priority === 'high' ? 'Crítico' : i.priority === 'medium' ? 'Atenção' : 'Info'}</span>
                                </div>
                                ${i.recommendation ? `<p style="color:var(--dv-text-secondary);font-size:0.82rem;margin:4px 0">💡 ${i.recommendation}</p>` : ''}
                                <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
                                    <span style="font-size:0.7rem;color:var(--dv-text-tertiary)">${i.category}</span>
                                    <button class="btn-secondary btn-sm" onclick="PLURI.navigateTo('${i.module}')" style="margin-left:auto;border-color:var(--dv-accent);color:var(--dv-accent)">Resolver →</button>
                                </div>
                            </div>
                        </div>
                    `).join('') : '<p style="color:var(--dv-text-tertiary);text-align:center;padding:20px">Nenhum alerta no momento. 🎉</p>'}
                </div>

                <!-- ========== HOJE VOCÊ PRECISA ========== -->
                <div class="dv-section-title">
                    <i data-lucide="check-square" class="icon-sm" style="color:var(--dv-accent)"></i> Hoje você precisa
                    <button class="btn-icon btn-sm" onclick="Dashboard.addAction()" style="margin-left:auto;color:var(--dv-accent)"><i data-lucide="plus" class="icon-sm"></i></button>
                </div>
                <div class="dv-card" style="margin-bottom:32px">
                    <p style="font-size:0.75rem;color:var(--dv-text-tertiary);margin-bottom:8px">💡 As tarefas automáticas levam ao módulo correspondente. Adicione suas próprias tarefas no <b>+</b>.</p>
                    ${renderActions(data)}
                </div>

                <!-- ========== FUNIL ========== -->
                <div class="dv-section-title">
                    <i data-lucide="funnel" class="icon-sm" style="color:var(--dv-accent)"></i> Funil Comercial
                </div>
                <div class="dv-card" style="margin-bottom:32px">
                    <div class="dv-funnel">
                        ${data.pipelineSummary.map((s, idx) => `
                            <div class="dv-funnel-stage" onclick="PLURI.navigateTo('crm')">
                                <div style="font-weight:600;font-size:0.8rem;color:var(--dv-text-secondary);margin-bottom:4px">${s.name}</div>
                                <div class="dv-funnel-count">${s.count}</div>
                                <div style="font-size:0.75rem;color:var(--dv-text-tertiary)">${Utils.formatCurrency(s.value)}</div>
                                ${idx > 0 ? `<div style="font-size:0.7rem;color:var(--dv-accent);margin-top:4px">Conv. ${s.conversionToHere}%</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- ========== FINANCEIRO ========== -->
                <div class="dv-section-title">
                    <i data-lucide="dollar-sign" class="icon-sm" style="color:var(--dv-accent)"></i> Financeiro
                </div>
                <div class="dv-card" style="margin-bottom:32px">
                    <div class="dv-filter-bar">
                        <span class="dv-filter-chip active" onclick="Dashboard.filterFinance('month', this)">Este mês</span>
                        <span class="dv-filter-chip" onclick="Dashboard.filterFinance('quarter', this)">Trimestre</span>
                        <span class="dv-filter-chip" onclick="Dashboard.filterFinance('year', this)">Ano</span>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:center;gap:40px;padding:20px 0">
                        ${Charts.createDonut(data.revenueThisMonth > 0 ? (data.profitThisMonth > 0 ? 70 : 30) : 0, { size: 100, color: '#10b981', bgColor: '#ef4444' })}
                        <div style="color:var(--dv-text-primary)">
                            <div><span style="color:#10b981">Receita:</span> ${Utils.formatCurrency(data.revenueThisMonth)}</div>
                            <div><span style="color:#ef4444">Despesa:</span> ${Utils.formatCurrency(data.expensesThisMonth)}</div>
                            <div><span style="color:var(--dv-accent)">Lucro:</span> ${Utils.formatCurrency(data.profitThisMonth)}</div>
                        </div>
                    </div>
                </div>

                <!-- ========== METAS ========== -->
                <div class="dv-section-title">
                    <i data-lucide="flag" class="icon-sm" style="color:var(--dv-accent)"></i> Metas
                    <button class="btn-secondary btn-sm" style="margin-left:auto;border-color:var(--dv-accent);color:var(--dv-accent)" onclick="window.PLURI.navigateTo('goals')">Ver todas</button>
                </div>
                <div class="dv-card" style="margin-bottom:32px">
                    ${data.revenueGoalProgress !== null ? renderGoalProgress('Receita Mensal', data.revenueThisMonth, parseFloat(data.goals?.find(g => g.category==='receita')?.target || 1), data.revenueGoalProgress, data.revenueGoalRemaining, data.forecastDays, data.avgDailyRevenue) : `
                        <div class="empty-state-enhanced" style="color:var(--dv-text-primary)">
                            <div class="empty-icon">🎯</div>
                            <h4 style="color:var(--dv-text-primary)">Nenhuma meta de receita</h4>
                            <p style="color:var(--dv-text-secondary)">Defina uma meta mensal para acompanhar seu progresso.</p>
                            <button class="btn-primary btn-sm" onclick="window.PLURI.navigateTo('goals')" style="background:var(--dv-accent);color:#0a0e17;border:none">Criar Meta</button>
                        </div>
                    `}
                </div>

                <!-- ========== SAÚDE DA EMPRESA ========== -->
                <div class="dv-section-title">
                    <i data-lucide="heart" class="icon-sm" style="color:var(--dv-accent)"></i> Saúde da Empresa
                </div>
                <div class="dv-card" style="margin-bottom:32px">
                    <div style="display:grid;grid-template-columns:auto 1fr;gap:32px;align-items:center">
                        <div style="text-align:center">
                            <div class="dv-health-circle" style="background: conic-gradient(${data.healthScore >= 70 ? '#10b981' : data.healthScore >= 40 ? '#f59e0b' : '#ef4444'} ${data.healthScore}%, rgba(255,255,255,0.05) 0);" title="Score: ${data.healthScore}/100">
                                <span>${data.healthScore}</span>
                            </div>
                            <p class="dv-health-label" style="color:${data.healthScore >= 70 ? '#10b981' : data.healthScore >= 40 ? '#f59e0b' : '#ef4444'}">
                                ${data.healthScore >= 70 ? '🟢 Saudável' : data.healthScore >= 40 ? '🟡 Atenção' : '🔴 Crítico'}
                            </p>
                        </div>
                        <div>
                            <h4 style="font-weight:600;color:var(--dv-text-primary);margin-bottom:12px">Como foi calculado</h4>
                            <div style="display:flex;flex-direction:column;gap:8px;font-size:0.85rem">
                                ${data.healthDetails.map(d => `
                                    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--dv-border)">
                                        <span style="color:var(--dv-text-secondary)">${d.label} (${d.value})</span>
                                        <span style="color:${d.status === 'positive' ? '#10b981' : '#ef4444'};font-weight:500">${d.impact} pts</span>
                                    </div>
                                `).join('')}
                            </div>
                            <p style="margin-top:12px;font-size:0.75rem;color:var(--dv-text-tertiary)">
                                💡 Melhore os indicadores em vermelho para aumentar sua nota.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- ========== PLURI COPILOT ========== -->
                <div class="dv-section-title">
                    <i data-lucide="bot" class="icon-sm" style="color:var(--dv-accent)"></i> PLURI Copilot
                </div>
                <div class="dv-card dv-copilot-card" style="margin-bottom:32px">
                    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px">
                        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg, #f59e0b, #d97706);display:flex;align-items:center;justify-content:center;color:#0a0e17;font-weight:700;flex-shrink:0">🤖</div>
                        <div>
                            <strong style="color:var(--dv-text-primary)">Assistente Executivo PLURI</strong>
                            <p style="font-size:0.78rem;color:var(--dv-text-tertiary)">Análise baseada nos dados atuais do sistema.</p>
                        </div>
                    </div>
                    <div style="color:var(--dv-text-secondary);font-size:0.9rem;line-height:1.7">
                        ${generateCopilot(data)}
                    </div>
                    <div style="margin-top:16px;text-align:right">
                        <button class="btn-secondary btn-sm" onclick="PLURI.navigateTo('reports')" style="border-color:var(--dv-accent);color:var(--dv-accent)">✨ Ver análise completa</button>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== COMPONENTES INTERNOS ====================

    function renderKPI(title, value, icon, variation, comparison, color, sparklineData, tooltip) {
        const sparkHTML = sparklineData && sparklineData.length > 0
            ? `<div class="dv-sparkline">${Charts.createSparkline(sparklineData, { width: 200, height: 40, color: color || '#f59e0b', smooth: true, fillOpacity: 0.15 })}</div>`
            : '';
        const varClass = variation > 0 ? 'positive' : variation < 0 ? 'negative' : '';
        return `
            <div class="dv-kpi-card" onclick="PLURI.navigateTo('finance')">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <span class="dv-kpi-label">
                        ${title}
                        ${tooltip ? `<span class="dv-tooltip" data-tooltip="${tooltip}" style="margin-left:4px">ⓘ</span>` : ''}
                    </span>
                    <span class="dv-kpi-icon" style="background:${color}20;color:${color}">
                        <i data-lucide="${icon}" class="icon-sm"></i>
                    </span>
                </div>
                <div class="dv-kpi-value">${value}</div>
                <div style="display:flex;align-items:center">
                    ${variation !== null ? `<span class="dv-kpi-variation ${varClass}">${variation > 0 ? '↑' : variation < 0 ? '↓' : ''} ${Math.abs(variation)}%</span>` : ''}
                    <span class="dv-kpi-comparison">${comparison}</span>
                </div>
                ${sparkHTML}
            </div>
        `;
    }

    function renderMetricCard(title, value, icon, color, module) {
        return `
            <div class="dv-metric-card" onclick="PLURI.navigateTo('${module}')">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <span class="dv-kpi-label">${title}</span>
                    <span style="background:${color}20;color:${color};padding:4px 8px;border-radius:6px;font-size:0.7rem">
                        <i data-lucide="${icon}" class="icon-sm"></i>
                    </span>
                </div>
                <div class="dv-metric-value">${value}</div>
            </div>
        `;
    }

    function renderActions(data) {
        const allActions = [...data.smartActions, ...(data.actions || []).filter(a => !a.done)];
        if (!allActions.length) {
            return '<p style="color:var(--dv-text-tertiary);text-align:center;padding:20px">Nenhuma ação pendente. 🎉</p>';
        }
        return allActions.slice(0, 6).map(a => `
            <div class="dv-action-item" onclick="PLURI.navigateTo('${a.module || 'crm'}')">
                <span class="dv-action-priority ${a.priority}"></span>
                <i data-lucide="${a.icon || 'circle'}" class="icon-sm" style="color:var(--dv-text-tertiary)"></i>
                <span style="flex:1;color:var(--dv-text-primary)">${a.text}</span>
                <span class="badge-tag ${a.priority === 'high' ? 'danger' : a.priority === 'medium' ? 'warning' : 'info'}">${a.priority === 'high' ? 'Alta' : a.priority === 'medium' ? 'Média' : 'Baixa'}</span>
            </div>
        `).join('');
    }

    function renderGoalProgress(label, current, target, percentage, remaining, forecastDays, avgDaily) {
        const trendIcon = avgDaily > (remaining / Math.max(forecastDays || 1, 1)) ? 'trending-up' : 'trending-down';
        const forecastText = forecastDays ? `Previsão de conclusão em ${forecastDays} dias` : 'Ritmo atual insuficiente';
        const fillClass = percentage >= 80 ? 'success' : percentage >= 50 ? 'warning' : 'danger';
        return `
            <div class="dv-goal-bar">
                <div class="dv-goal-header">
                    <span style="color:var(--dv-text-primary)">${label}</span>
                    <span style="color:var(--dv-text-secondary)">${Utils.formatCurrency(current)} / ${Utils.formatCurrency(target)} (${percentage}%)</span>
                </div>
                <div class="dv-goal-progress">
                    <div class="dv-goal-fill ${fillClass}" style="width:${percentage}%"></div>
                </div>
                <div class="dv-goal-footer">
                    <span>Faltam ${Utils.formatCurrency(remaining)}</span>
                    <span style="display:flex;align-items:center;gap:4px">
                        <i data-lucide="${trendIcon}" class="icon-sm"></i> ${forecastText}
                    </span>
                </div>
                <div style="text-align:right;margin-top:8px">
                    <a href="#" onclick="event.preventDefault(); window.PLURI.navigateTo('goals')" style="font-size:0.75rem;color:var(--dv-accent)">Ver metas →</a>
                </div>
            </div>
        `;
    }

    function generateCopilot(data) {
        const suggestions = [];
        if (data.leads > 0 && data.conversionRate < 20) suggestions.push('📌 Hoje você deveria priorizar o comercial. Sua taxa de conversão está abaixo do ideal.');
        if (data.inImplantation > 0) suggestions.push(`🚀 Existem ${data.inImplantation} implantações em andamento. Acompanhe de perto.`);
        if (data.cashFlow < 0) suggestions.push('⚠️ Seu fluxo de caixa está negativo. Reduza despesas urgentemente.');
        const expiringContracts = data.contracts.filter(c => {
            const daysLeft = (new Date(c.endDate) - new Date()) / (1000*60*60*24);
            return daysLeft <= 30 && daysLeft > 0 && c.status === 'ativo';
        });
        if (expiringContracts.length > 0) suggestions.push(`📅 ${expiringContracts.length} contratos vencem nos próximos 30 dias. Renove!`);
        if (data.revenueGoalProgress !== null && data.revenueGoalProgress >= 80) suggestions.push(`🎯 Você está a ${(100 - data.revenueGoalProgress).toFixed(1)}% de bater a meta mensal!`);
        if (suggestions.length === 0) suggestions.push('✅ Todos os indicadores estão estáveis. Continue monitorando.');
        return suggestions.map(s => `<div class="dv-copilot-suggestion">${s}</div>`).join('');
    }

    // ==================== FUNÇÕES PÚBLICAS (INALTERADAS) ====================

    function filterFinance(period, el) {
        document.querySelectorAll('.dv-filter-chip').forEach(c => c.classList.remove('active'));
        if (el) el.classList.add('active');
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
            footerHTML: `<button class="btn-secondary" onclick="Components.closeModal()">Cancelar</button><button class="btn-primary" onclick="Dashboard.saveNewAction()">Adicionar</button>`,
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

/**
 * PLURI OS — Módulo Dashboard (Cockpit Executivo)
 * Inclui ROI (Retorno sobre Investimento)
 */
const Dashboard = (() => {
    function render() {
        const companies = Storage.loadData('crm_companies', []);
        const transactions = Storage.loadData('finance_transactions', []);
        const implantations = Storage.loadData('finance_implantations', []);
        const goals = Storage.loadData('goals', []);

        // Métricas financeiras
        const totalRevenue = transactions
            .filter(t => t.type === 'receita')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        const totalCosts = transactions
            .filter(t => t.type === 'despesa' || t.type === 'custo')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        const profit = totalRevenue - totalCosts;

        // Total de implantações (para cálculo do ROI)
        const totalImplantacoes = implantations.reduce((sum, imp) => sum + (parseFloat(imp.amount) || 0), 0);

        // ROI: Lucro Bruto / Total de Implantações * 100
        let roi = 'N/A';
        if (totalImplantacoes > 0) {
            roi = ((profit / totalImplantacoes) * 100).toFixed(1) + '%';
        }

        const activeClients = companies.filter(c => c.status === 'closed').length;
        const leads = companies.filter(c => c.status === 'lead').length;
        const inImplantation = implantations.filter(i => i.status === 'em_andamento').length;
        const conversionRate = companies.length > 0
            ? ((activeClients / companies.length) * 100).toFixed(1)
            : '0';
        const mrr = transactions
            .filter(t => t.type === 'mensalidade' || t.category === 'recorrente')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        // Alertas
        const alerts = [];
        const monthlyGoal = goals.find(g => g.period === 'monthly' && g.category === 'receita');
        if (monthlyGoal && totalRevenue < parseFloat(monthlyGoal.target || 0)) {
            const pct = ((totalRevenue / parseFloat(monthlyGoal.target)) * 100).toFixed(1);
            alerts.push(`📉 Você está em ${pct}% da meta mensal de receita (${Utils.formatCurrency(monthlyGoal.target)})`);
        }
        if (conversionRate < 20 && companies.length > 5) {
            alerts.push(`⚠️ Taxa de conversão baixa: ${conversionRate}%. Aumente a prospecção.`);
        }
        if (inImplantation > 3) {
            alerts.push(`🚀 ${inImplantation} implantações em andamento — atenção ao prazo.`);
        }
        if (profit > 0 && totalRevenue > 0) {
            const margin = ((profit / totalRevenue) * 100).toFixed(1);
            if (margin > 50) alerts.push(`✅ Margem de lucro saudável: ${margin}%`);
        }

        return `
            <div class="fade-in">
                <!-- Cards principais -->
                <div class="cards-grid" style="margin-bottom:24px">
                    ${Components.metricCard({
                        title: 'Receita Mensal',
                        value: Utils.formatCurrency(totalRevenue),
                        icon: 'dollar-sign',
                        trend: 'up',
                        trendValue: 'Este mês',
                        color: 'success',
                    })}
                    ${Components.metricCard({
                        title: 'MRR',
                        value: Utils.formatCurrency(mrr),
                        icon: 'repeat',
                        subtitle: 'Receita Recorrente Mensal',
                        color: 'accent',
                    })}
                    ${Components.metricCard({
                        title: 'Lucro',
                        value: Utils.formatCurrency(profit),
                        icon: 'trending-up',
                        trend: profit >= 0 ? 'up' : 'down',
                        color: profit >= 0 ? 'success' : 'danger',
                    })}
                    ${Components.metricCard({
                        title: 'ROI',
                        value: roi,
                        icon: 'percent',
                        subtitle: 'Retorno sobre Investimento',
                        color: roi !== 'N/A' && parseFloat(roi) > 0 ? 'success' : 'warning',
                    })}
                </div>

                <div class="cards-grid" style="margin-bottom:24px">
                    ${Components.metricCard({
                        title: 'Clientes Ativos',
                        value: activeClients,
                        icon: 'users',
                        subtitle: `${leads} leads em pipeline`,
                        color: 'info',
                    })}
                    ${Components.metricCard({
                        title: 'Taxa de Conversão',
                        value: conversionRate + '%',
                        icon: 'percent',
                        color: 'warning',
                    })}
                    ${Components.metricCard({
                        title: 'Implantações Ativas',
                        value: inImplantation,
                        icon: 'rocket',
                        color: 'accent',
                    })}
                    ${Components.metricCard({
                        title: 'ARR Projetado',
                        value: Utils.formatCurrency(mrr * 12),
                        icon: 'calendar',
                        subtitle: 'Receita Anual Recorrente',
                        color: 'info',
                    })}
                </div>

                <!-- Alertas -->
                ${alerts.length ? `
                <div class="card" style="margin-bottom:24px;border-left:3px solid var(--warning)">
                    <div class="card-header"><span class="card-title">🔔 Alertas e Insights</span></div>
                    <div style="display:flex;flex-direction:column;gap:8px">
                        ${alerts.map(a => `<div style="padding:8px 0;border-bottom:1px solid var(--border-subtle);font-size:0.88rem">${a}</div>`).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Atividades Recentes -->
                <div class="card">
                    <div class="card-header"><span class="card-title">Atividades Recentes</span></div>
                    <div class="timeline">
                        ${generateTimeline(companies, transactions)}
                    </div>
                </div>
            </div>
        `;
    }

    function generateTimeline(companies, transactions) {
        const events = [];
        companies.slice(-3).forEach(c => {
            events.push({
                time: Utils.timeAgo(c.createdAt || c.updatedAt || new Date()),
                content: `Empresa <strong>${c.company || c.name || 'Nova'}</strong> ${c.status === 'closed' ? 'fechada' : 'adicionada'} no CRM`,
            });
        });
        transactions.slice(-3).forEach(t => {
            events.push({
                time: Utils.timeAgo(t.date || t.createdAt || new Date()),
                content: `${t.type === 'receita' ? 'Receita' : 'Despesa'} de <strong>${Utils.formatCurrency(t.amount)}</strong> — ${t.description || 'Sem descrição'}`,
            });
        });
        if (!events.length) {
            return '<div style="padding:20px;text-align:center;color:var(--text-tertiary)">Nenhuma atividade recente</div>';
        }
        return events.slice(-5).reverse().map(e => `
            <div class="timeline-item">
                <div class="timeline-time">${e.time}</div>
                <div class="timeline-content">${e.content}</div>
            </div>
        `).join('');
    }

    return { render };
})();

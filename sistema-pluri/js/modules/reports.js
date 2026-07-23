/**
 * PLURI OS — Relatórios
 */
const Reports = (() => {
    function render() {
        return `
            <div class="fade-in">
                <h3 style="font-weight:600;margin-bottom:20px">Relatórios</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
                    ${reportCard('Relatório Financeiro', 'Resumo de receitas, despesas e lucro', 'dollar-sign', 'finance')}
                    ${reportCard('Relatório Comercial', 'Pipeline, conversão e leads', 'users', 'commercial')}
                    ${reportCard('Relatório de Metas', 'Progresso de todas as metas', 'flag', 'goals')}
                    ${reportCard('Relatório de Clientes', 'Lista completa de clientes ativos', 'building', 'clients')}
                </div>
                <div style="margin-top:24px">
                    <button class="btn-secondary" onclick="Storage.exportBackupFile()">
                        <i data-lucide="download" class="icon-sm"></i> Backup Completo (JSON)
                    </button>
                </div>
            </div>
        `;
    }

    function reportCard(title, desc, icon, type) {
        return `
            <div class="card">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                    <span class="card-icon" style="background:var(--accent-subtle);color:var(--accent)">
                        <i data-lucide="${icon}" class="icon-sm"></i>
                    </span>
                    <strong>${title}</strong>
                </div>
                <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:16px">${desc}</p>
                <button class="btn-primary btn-sm" onclick="Reports.generate('${type}')">
                    <i data-lucide="file-text" class="icon-sm"></i> Gerar Relatório
                </button>
            </div>
        `;
    }

    function generate(type) {
        let data = [];
        let filename = 'relatorio.csv';

        switch (type) {
            case 'finance':
                data = Storage.loadData('finance_transactions', []);
                filename = 'relatorio-financeiro.csv';
                break;
            case 'commercial':
                data = Storage.loadData('crm_companies', []).map(c => ({
                    Empresa: c.company || c.name,
                    Segmento: c.segment,
                    Cidade: c.city,
                    Estado: c.state,
                    Status: c.status,
                    'Último Contato': c.lastContact ? Utils.formatDate(c.lastContact) : '',
                }));
                filename = 'relatorio-comercial.csv';
                break;
            case 'goals':
                data = Storage.loadData('goals', []).map(g => ({
                    Descrição: g.description,
                    Período: g.period,
                    Categoria: g.category,
                    Alvo: g.target,
                    Atual: g.current,
                    Progresso: g.target > 0 ? ((g.current / g.target) * 100).toFixed(1) + '%' : '0%',
                }));
                filename = 'relatorio-metas.csv';
                break;
            case 'clients':
                data = Storage.loadData('crm_companies', [])
                    .filter(c => c.status === 'closed')
                    .map(c => ({
                        Empresa: c.company || c.name,
                        Segmento: c.segment,
                        Cidade: c.city,
                        Estado: c.state,
                        Responsável: c.responsible,
                        WhatsApp: c.whatsapp,
                        Email: c.email,
                    }));
                filename = 'relatorio-clientes.csv';
                break;
            default:
                Components.showToast('Tipo de relatório não encontrado', 'error');
                return;
        }

        if (!data.length) {
            Components.showToast('Sem dados para gerar relatório', 'warning');
            return;
        }

        Utils.exportCSV(data, filename);
        Components.showToast('Relatório exportado com sucesso!', 'success');
    }

    window.Reports = { render, generate };
    return { render, generate };
})();

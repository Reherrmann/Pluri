/**
 * PLURI OS — Aplicação Principal
 * Roteamento SPA, tema, navegação, pesquisa global, inicialização
 */
const PLURI = (() => {
    // Estado da UI
    const state = {
        currentModule: 'dashboard',
        theme: 'dark',
        sidebarCollapsed: false,
        notifications: [],
    };

    // Definição dos módulos e navegação
    const navigation = [
        {
            section: 'Principal',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', module: 'Dashboard' },
                { id: 'planning', label: 'Planejamento', icon: 'target', module: 'Planning' },
                { id: 'goals', label: 'Metas', icon: 'flag', module: 'Goals' },
            ],
        },
        {
            section: 'Gestão',
            items: [
                { id: 'crm', label: 'CRM', icon: 'users', module: 'CRM' },
                { id: 'finance', label: 'Financeiro', icon: 'dollar-sign', module: 'Finance' },
                { id: 'contracts', label: 'Contratos', icon: 'file-text', module: 'Contracts' },
                { id: 'implantations', label: 'Implantações', icon: 'rocket', module: 'Implantations' },
            ],
        },
        {
            section: 'Recursos',
            items: [
                { id: 'simulator', label: 'Simulador', icon: 'calculator', module: 'Simulator' },
                { id: 'prompts', label: 'Prompts', icon: 'sparkles', module: 'Prompts' },
                { id: 'content', label: 'Conteúdo', icon: 'pen-tool', module: 'Content' },
                { id: 'manual', label: 'Manual', icon: 'book-open', module: 'Manual' },
                { id: 'reports', label: 'Relatórios', icon: 'file-bar-chart', module: 'Reports' },
            ],
        },
        {
            section: 'Sistema',
            items: [
                { id: 'settings', label: 'Configurações', icon: 'settings', module: 'Settings' },
            ],
        },
    ];

    /**
     * Inicializa o sistema
     */
    function init() {
        loadSettings();
        renderSidebar();
        applyTheme();
        setupEventListeners();
        navigateTo('dashboard');
    }

    /**
     * Carrega configurações salvas
     */
    function loadSettings() {
        const settings = Storage.loadData('settings', {});
        state.theme = settings.theme || 'dark';
        state.sidebarCollapsed = settings.sidebarCollapsed || false;
        if (state.sidebarCollapsed) {
            document.getElementById('sidebar').classList.add('collapsed');
        }
    }

    /**
     * Aplica tema
     */
    function applyTheme() {
        document.body.setAttribute('data-theme', state.theme);
    }

    /**
     * Alterna tema
     */
    function toggleTheme() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
        Storage.updateData('settings', { theme: state.theme });
        Components.showToast(`Tema ${state.theme === 'dark' ? 'escuro' : 'claro'} ativado`, 'info', 2000);
    }

    /**
     * Renderiza sidebar
     */
    function renderSidebar() {
        const nav = document.getElementById('sidebar-nav');
        let html = '';
        navigation.forEach(section => {
            html += `<div class="nav-section"><div class="nav-section-title">${section.section}</div>`;
            section.items.forEach(item => {
                html += `
                    <div class="nav-item" data-module="${item.id}" onclick="PLURI.navigateTo('${item.id}')">
                        <i data-lucide="${item.icon}" class="nav-icon"></i>
                        <span class="nav-label">${item.label}</span>
                    </div>
                `;
            });
            html += '</div>';
        });
        nav.innerHTML = html;
        lucide.createIcons();
    }

    /**
     * Navegação SPA
     */
    function navigateTo(moduleId) {
        state.currentModule = moduleId;

        // Fecha o menu mobile ao navegar
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('mobile-open');
            document.getElementById('sidebar-overlay')?.classList.remove('active');
        }

        // Atualiza sidebar
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.module === moduleId);
        });

        // Atualiza header
        const navItem = findNavItem(moduleId);
        document.getElementById('page-title').textContent = navItem?.label || moduleId;
        document.getElementById('page-breadcrumb').textContent = '';

        // Renderiza módulo
        Components.showSkeleton(4);
        setTimeout(() => {
            renderModule(moduleId);
        }, 150);
    }

    /**
     * Encontra item de navegação
     */
    function findNavItem(id) {
        for (const section of navigation) {
            const found = section.items.find(item => item.id === id);
            if (found) return found;
        }
        return null;
    }

    /**
     * Renderiza o módulo ativo
     */
    function renderModule(moduleId) {
        const moduleMap = {
            dashboard: () => Dashboard.render(),
            crm: () => CRM.render(),
            finance: () => Finance.render(),
            planning: () => Planning.render(),
            goals: () => Goals.render(),
            simulator: () => Simulator.render(),
            reports: () => Reports.render(),
            contracts: () => Contracts.render(),
            implantations: () => Implantations.render(),
            prompts: () => Prompts.render(),
            content: () => Content.render(),
            manual: () => Manual.render(),
            settings: () => Settings.render(),
        };

        const renderFn = moduleMap[moduleId];
        if (renderFn) {
            document.getElementById('content-area').innerHTML = renderFn();
        } else {
            document.getElementById('content-area').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🚧</div>
                    <h3>Módulo em desenvolvimento</h3>
                    <p>Este módulo estará disponível em breve.</p>
                </div>
            `;
        }
        lucide.createIcons();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Configura event listeners globais
     */
    function setupEventListeners() {
        // Toggle sidebar
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('collapsed');
            state.sidebarCollapsed = sidebar.classList.contains('collapsed');
            Storage.updateData('settings', { sidebarCollapsed: state.sidebarCollapsed });
        });

        // Toggle sidebar (mobile)
        const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        mobileMenuBtn?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('mobile-open');
            sidebarOverlay?.classList.add('active');
        });
        sidebarOverlay?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('mobile-open');
            sidebarOverlay?.classList.remove('active');
        });

        // Toggle tema
        document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

        // Pesquisa global (⌘K / Ctrl+K)
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('global-search').focus();
            }
        });

        // Pesquisa na sidebar
        const searchInput = document.getElementById('global-search');
        searchInput.addEventListener('input', Utils.debounce((e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.nav-item').forEach(item => {
                const label = item.querySelector('.nav-label')?.textContent.toLowerCase() || '';
                item.style.display = label.includes(query) ? '' : 'none';
            });
            document.querySelectorAll('.nav-section').forEach(section => {
                const visible = section.querySelectorAll('.nav-item[style*="display: none"]').length <
                    section.querySelectorAll('.nav-item').length;
                section.style.display = visible ? '' : 'none';
            });
        }, 200));

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                Components.closeModal();
            }
        });

        // Notificações
        document.getElementById('btn-notifications').addEventListener('click', () => {
            Components.showToast('Sistema de notificações em breve', 'info');
        });

        // Ação rápida
        document.getElementById('btn-quick-actions').addEventListener('click', () => {
            showQuickActions();
        });
    }

    /**
     * Menu de ações rápidas
     */
    function showQuickActions() {
        Components.openModal({
            title: 'Ação Rápida',
            bodyHTML: `
                <div style="display:flex;flex-direction:column;gap:8px">
                    <button class="btn-secondary" style="justify-content:flex-start;width:100%"
                            onclick="PLURI.navigateTo('crm');Components.closeModal()">
                        <i data-lucide="user-plus" class="icon-sm"></i> Novo Lead
                    </button>
                    <button class="btn-secondary" style="justify-content:flex-start;width:100%"
                            onclick="PLURI.navigateTo('finance');Components.closeModal()">
                        <i data-lucide="plus-circle" class="icon-sm"></i> Registrar Transação
                    </button>
                    <button class="btn-secondary" style="justify-content:flex-start;width:100%"
                            onclick="PLURI.navigateTo('goals');Components.closeModal()">
                        <i data-lucide="flag" class="icon-sm"></i> Nova Meta
                    </button>
                    <button class="btn-secondary" style="justify-content:flex-start;width:100%"
                            onclick="Storage.exportBackupFile();Components.closeModal()">
                        <i data-lucide="download" class="icon-sm"></i> Exportar Backup
                    </button>
                </div>
            `,
            footerHTML: '',
        });
    }

    /**
     * Recarrega o módulo atual
     */
    function refreshCurrentModule() {
        renderModule(state.currentModule);
    }

    return {
        init,
        navigateTo,
        refreshCurrentModule,
        toggleTheme,
        getState: () => state,
    };
})();

(function () {
    // ======================================================
    // STATE
    // ======================================================
    const state = {
        school: {
            id: "mock",
            name: "Escola Bem-Estar",
            phone: "(11) 3000-1234",
            email: "contato@escola.com",
            address: "Rua Educação, 100 - São Paulo/SP",
            academicYear: "2026"
        },
        currentPage: 'ocorrencias',
        classes: [],
        students: [],
        occurrences: [],
        activities: []
    };

    // ======================================================
    // UTILITIES
    // ======================================================
    const getEl = (id) => document.getElementById(id);
    const showToast = (msg) => {
        const container = getEl('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };
    const refreshIcons = () => {
        if (window.lucide && typeof lucide.createIcons === 'function') {
            lucide.createIcons();
        }
    };
    const toDateStr = (d) => {
        if (!d) return '';
        const date = new Date(d);
        return date.toLocaleDateString('pt-BR');
    };
    const getCurrentDateTime = () => {
        const now = new Date();
        return now.toLocaleString('pt-BR');
    };

    const closeSidebar = () => {
        const sidebar = getEl('sidebar');
        const overlay = getEl('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
    };
    const openSlidePanel = () => {
        getEl('slidePanel')?.classList.add('show');
        getEl('slideOverlay')?.classList.add('show');
    };
    const closeSlidePanel = () => {
        getEl('slidePanel')?.classList.remove('show');
        getEl('slideOverlay')?.classList.remove('show');
    };

    // ======================================================
    // PERSISTÊNCIA LOCAL
    // ======================================================
    const STORAGE_KEY = 'pluri-ocorrencias-demo';

    function saveState() {
        try {
            const data = {
                school: state.school,
                classes: state.classes,
                students: state.students,
                occurrences: state.occurrences,
                activities: state.activities
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
        }
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);

            if (data.school) state.school = { ...state.school, ...data.school };
            state.classes = Array.isArray(data.classes) ? data.classes : [];
            state.students = Array.isArray(data.students) ? data.students : [];
            state.occurrences = Array.isArray(data.occurrences) ? data.occurrences : [];
            state.activities = Array.isArray(data.activities) ? data.activities : [];

            return true;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return false;
        }
    }

    // ======================================================
    // STATUS HELPERS
    // ======================================================
    const statusBadge = (status) => {
        let cls = '';
        if (status === 'Resolvido' || status === 'Concluído') cls = 'confirmed';
        else if (status === 'Em andamento') cls = 'pending';
        else cls = 'cancelled';
        const dotColor = cls === 'confirmed' ? 'green' : cls === 'pending' ? 'amber' : 'red';
        return `<span class="status-badge ${cls}"><span class="status-dot ${dotColor}"></span>${status}</span>`;
    };

    // ======================================================
    // MOCK DATA INIT
    // ======================================================
    function initMockData() {
        const today = new Date();
        const todayStr = toDateStr(today);

        // ===== TURMAS =====
        state.classes = [
            { _row: 1, id: 1, name: '1º Ano A', grade: '1º Ano', shift: 'Manhã', teacher: 'Prof. Carlos' },
            { _row: 2, id: 2, name: '1º Ano B', grade: '1º Ano', shift: 'Tarde', teacher: 'Profa. Ana' },
            { _row: 3, id: 3, name: '2º Ano A', grade: '2º Ano', shift: 'Manhã', teacher: 'Prof. Roberto' },
            { _row: 4, id: 4, name: '2º Ano B', grade: '2º Ano', shift: 'Tarde', teacher: 'Profa. Mariana' },
            { _row: 5, id: 5, name: '3º Ano A', grade: '3º Ano', shift: 'Manhã', teacher: 'Prof. Carlos' }
        ];

        // ===== ALUNOS =====
        state.students = [
            { _row: 1, id: 1, name: 'Ana Silva', enrollment: '20260001', classId: 1, className: '1º Ano A', phone: '(11) 98765-4321', status: 'Ativo' },
            { _row: 2, id: 2, name: 'João Santos', enrollment: '20260002', classId: 1, className: '1º Ano A', phone: '(11) 91234-5678', status: 'Ativo' },
            { _row: 3, id: 3, name: 'Mariana Costa', enrollment: '20260003', classId: 2, className: '1º Ano B', phone: '(21) 99876-5432', status: 'Ativo' },
            { _row: 4, id: 4, name: 'Pedro Oliveira', enrollment: '20260004', classId: 3, className: '2º Ano A', phone: '(31) 98765-1234', status: 'Ativo' },
            { _row: 5, id: 5, name: 'Lucas Ferreira', enrollment: '20260005', classId: 4, className: '2º Ano B', phone: '(41) 99876-1111', status: 'Inativo' },
            { _row: 6, id: 6, name: 'Beatriz Lima', enrollment: '20260006', classId: 5, className: '3º Ano A', phone: '(51) 91234-9999', status: 'Ativo' },
            { _row: 7, id: 7, name: 'Rafael Alves', enrollment: '20260007', classId: 5, className: '3º Ano A', phone: '(61) 98765-0000', status: 'Ativo' },
            { _row: 8, id: 8, name: 'Camila Santos', enrollment: '20260008', classId: 3, className: '2º Ano A', phone: '(81) 99876-7777', status: 'Ativo' }
        ];

        // ===== OCORRÊNCIAS =====
        state.occurrences = [
            { 
                id: 1, 
                student: 'Mariana Costa', 
                class: '1º Ano B', 
                date: todayStr, 
                time: '10:30',
                type: 'Disciplinar', 
                description: 'Conversou durante a aula após advertência.', 
                status: 'Pendente',
                teacher: 'Profa. Ana'
            },
            { 
                id: 2, 
                student: 'Pedro Oliveira', 
                class: '2º Ano A', 
                date: todayStr, 
                time: '09:15',
                type: 'Acadêmica', 
                description: 'Não entregou o trabalho de casa pela terceira vez.', 
                status: 'Resolvido',
                teacher: 'Prof. Roberto'
            }
        ];

        // ===== ATIVIDADES =====
        state.activities = [
            { time: '10:42', text: 'Ocorrência registrada para Mariana Costa.' },
            { time: '10:38', text: 'Ocorrência resolvida para Pedro Oliveira.' },
            { time: '10:31', text: 'Turma 1º Ano A visualizada.' }
        ];
    }

    // ======================================================
    // NAVIGATION
    // ======================================================
    function navigateTo(page) {
        state.currentPage = page;
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`.sidebar-nav a[data-page="${page}"]`);
        if (link) link.classList.add('active');
        renderPage();
        closeSidebar();
    }

    // ======================================================
    // RENDER ENGINE
    // ======================================================
    function renderPage() {
        const container = getEl('pageContainer');
        if (!container) return;
        const title = getEl('pageTitle');
        const subtitle = getEl('pageSubtitle');

        let html = '';
        try {
            switch (state.currentPage) {
                case 'ocorrencias': html = buildOcorrencias(); break;
                case 'lista-ocorrencias': html = buildListaOcorrencias(); break;
                default: html = buildOcorrencias();
            }
        } catch (e) {
            console.error(e);
            html = `<div style="padding:40px;text-align:center;color:#B91C1C;">Erro ao carregar a página.</div>`;
        }

        container.innerHTML = html;
        attachPageEvents();
        refreshIcons();
        updateTitleAndSubtitle(title, subtitle);
    }

    function updateTitleAndSubtitle(title, subtitle) {
        const titles = {
            ocorrencias: ['Registro de Ocorrências', 'Selecione a turma e registre ocorrências dos alunos.'],
            'lista-ocorrencias': ['Lista de Ocorrências', 'Todas as ocorrências registradas.']
        };
        const [t, s] = titles[state.currentPage] || titles.ocorrencias;
        if (title) title.textContent = t;
        if (subtitle) subtitle.textContent = s;
    }

    // ======================================================
    // PAGE: OCORRÊNCIAS (Registro)
    // ======================================================
    function buildOcorrencias() {
        // Ordenar turmas
        const sortedClasses = [...state.classes].sort((a, b) => a.name.localeCompare(b.name));

        // Buscar alunos da turma selecionada
        const selectedClassId = state._selectedClassId || (sortedClasses.length > 0 ? sortedClasses[0].id : null);
        const selectedClass = state.classes.find(c => c.id === selectedClassId);
        const students = selectedClass ? state.students.filter(s => s.classId === selectedClass.id && s.status === 'Ativo') : [];

        let html = `
            <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
                <div style="flex:1;min-width:200px;">
                    <label style="font-size:13px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">Selecione a Turma</label>
                    <select id="classSelector" class="form-control" style="width:100%;padding:10px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;">
                        ${sortedClasses.map(c => `
                            <option value="${c.id}" ${c.id === selectedClassId ? 'selected' : ''}>
                                ${c.name} - ${c.shift} (${c.teacher})
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div style="display:flex;gap:8px;align-items:flex-end;padding-top:4px;">
                    <button class="btn btn-outline" id="btnListarOcorrencias">
                        <i data-lucide="list" style="width:16px;height:16px;"></i> Ver todas as ocorrências
                    </button>
                </div>
            </div>
        `;

        if (!selectedClass) {
            html += `<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--text-secondary);">
                <p>Nenhuma turma cadastrada.</p>
            </div></div>`;
            return html;
        }

        // Informações da turma
        html += `
            <div class="card" style="margin-bottom:16px;">
                <div class="card-header">
                    <h3>📚 ${selectedClass.name}</h3>
                    <div style="display:flex;gap:8px;font-size:13px;color:var(--text-secondary);">
                        <span>👨‍🏫 ${selectedClass.teacher}</span>
                        <span>🕐 ${selectedClass.shift}</span>
                        <span>👨‍🎓 ${students.length} alunos</span>
                    </div>
                </div>
            </div>
        `;

        // Lista de alunos com botão de ocorrência
        html += `<div class="card"><div class="card-body no-padding">`;
        html += `<table class="data-table">
            <thead>
                <tr>
                    <th style="width:50px;">#</th>
                    <th>Aluno</th>
                    <th>Matrícula</th>
                    <th>Contato</th>
                    <th style="text-align:center;">Registrar Ocorrência</th>
                </tr>
            </thead>
            <tbody>`;

        if (students.length === 0) {
            html += `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-secondary);">
                Nenhum aluno ativo nesta turma.
            </td></tr>`;
        } else {
            students.forEach((s, index) => {
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${s.name}</strong></td>
                        <td>${s.enrollment}</td>
                        <td style="font-size:12px;">${s.phone || '-'}</td>
                        <td style="text-align:center;">
                            <button class="btn btn-sm btn-primary" onclick="openRegistrarOcorrencia(${s._row})" style="font-size:12px;padding:4px 14px;">
                                <i data-lucide="file-text" style="width:14px;height:14px;"></i> Registrar
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table>`;
        html += `</div></div>`;

        return html;
    }

    // ======================================================
    // PAGE: LISTA DE OCORRÊNCIAS
    // ======================================================
    function buildListaOcorrencias() {
        const occurrences = [...state.occurrences].sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            return dateB - dateA;
        });

        let html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <select id="filterStatus" class="form-control" style="min-width:130px;">
                        <option value="">Todos os status</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Resolvido">Resolvido</option>
                    </select>
                    <input type="text" id="filterSearch" placeholder="Buscar por aluno ou turma..." style="padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:13px;min-width:200px;">
                </div>
                <button class="btn btn-outline" onclick="navigateTo('ocorrencias')">
                    <i data-lucide="arrow-left" style="width:16px;height:16px;"></i> Voltar para registro
                </button>
            </div>
        `;

        if (occurrences.length === 0) {
            html += `<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--text-secondary);">
                <p style="font-size:20px;margin-bottom:8px;">📋</p>
                <p>Nenhuma ocorrência registrada ainda.</p>
                <button class="btn btn-primary" onclick="navigateTo('ocorrencias')" style="margin-top:12px;">
                    Registrar primeira ocorrência
                </button>
            </div></div>`;
            return html;
        }

        html += `<div class="card"><div class="card-body no-padding">`;
        html += `<table class="data-table" id="occurrencesTable">
            <thead>
                <tr>
                    <th style="width:40px;">#</th>
                    <th>Data/Hora</th>
                    <th>Aluno</th>
                    <th>Turma</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Professor</th>
                    <th style="text-align:center;">Status</th>
                    <th style="text-align:center;">Ações</th>
                </tr>
            </thead>
            <tbody>`;

        occurrences.forEach((occ, index) => {
            const displayDate = occ.date ? `${occ.date} ${occ.time || ''}` : occ.dateTime || '-';
            html += `
                <tr data-occ-id="${occ.id}" data-student="${occ.student}" data-class="${occ.class}" data-status="${occ.status}">
                    <td>${index + 1}</td>
                    <td style="font-size:12px;white-space:nowrap;">${displayDate}</td>
                    <td><strong>${occ.student}</strong></td>
                    <td>${occ.class}</td>
                    <td><span class="tag-education ${occ.type === 'Disciplinar' ? 'aula' : occ.type === 'Acadêmica' ? 'prova' : 'evento'}">${occ.type}</span></td>
                    <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${occ.description}">${occ.description}</td>
                    <td>${occ.teacher || '-'}</td>
                    <td style="text-align:center;">${statusBadge(occ.status)}</td>
                    <td style="text-align:center;">
                        <button class="btn btn-sm btn-outline" onclick="editarOcorrencia(${occ.id})" style="font-size:11px;padding:2px 10px;margin-right:4px;">
                            <i data-lucide="edit-2" style="width:12px;height:12px;"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" style="color:#B91C1C;border-color:#FCA5A5;font-size:11px;padding:2px 10px;" onclick="excluirOcorrencia(${occ.id})">
                            <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        html += `</div></div>`;

        return html;
    }

    // ======================================================
    // REGISTRAR OCORRÊNCIA (Slide Panel)
    // ======================================================
    function openRegistrarOcorrencia(studentRow) {
        const student = state.students.find(s => s._row === studentRow);
        if (!student) return;

        const classObj = state.classes.find(c => c.id === student.classId);
        const currentDateTime = getCurrentDateTime();
        const today = new Date().toISOString().split('T')[0];

        const content = getEl('slideContent');
        content.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h3 style="margin:0;">📋 Registrar Ocorrência</h3>
                <button class="btn-icon-sm" onclick="closeSlidePanel()" style="width:32px;height:32px;">
                    <i data-lucide="x" style="width:18px;height:18px;"></i>
                </button>
            </div>

            <div style="background:var(--hover-bg);padding:12px;border-radius:8px;margin-bottom:16px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px;">
                    <div><strong>Aluno:</strong> ${student.name}</div>
                    <div><strong>Matrícula:</strong> ${student.enrollment}</div>
                    <div><strong>Turma:</strong> ${classObj ? classObj.name : '-'}</div>
                    <div><strong>Período:</strong> ${classObj ? classObj.shift : '-'}</div>
                    <div><strong>Professor:</strong> ${classObj ? classObj.teacher : '-'}</div>
                    <div><strong>Data/Hora:</strong> ${currentDateTime}</div>
                </div>
            </div>

            <div class="form-group">
                <label>Tipo de Ocorrência</label>
                <select id="occTipo" class="form-control">
                    <option value="Disciplinar">Disciplinar</option>
                    <option value="Acadêmica">Acadêmica</option>
                    <option value="Comportamental">Comportamental</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Outro">Outro</option>
                </select>
            </div>

            <div class="form-group">
                <label>Descrição da Ocorrência</label>
                <textarea id="occDescricao" rows="4" class="form-control" placeholder="Descreva detalhadamente o que aconteceu..."></textarea>
            </div>

            <div class="form-group">
                <label>Status</label>
                <select id="occStatus" class="form-control">
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Resolvido">Resolvido</option>
                </select>
            </div>

            <div style="margin-top:16px;display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" onclick="closeSlidePanel()">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="saveOcorrenciaBtn">Salvar Ocorrência</button>
            </div>
        `;

        // Salvar ocorrência
        getEl('saveOcorrenciaBtn').onclick = () => {
            const tipo = getEl('occTipo').value;
            const descricao = getEl('occDescricao').value.trim();
            const status = getEl('occStatus').value;

            if (!descricao) {
                showToast('Por favor, descreva a ocorrência.');
                return;
            }

            const newOccurrence = {
                id: Date.now(),
                student: student.name,
                class: classObj ? classObj.name : '-',
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                type: tipo,
                description: descricao,
                status: status,
                teacher: classObj ? classObj.teacher : '-'
            };

            state.occurrences.push(newOccurrence);
            
            // Adicionar atividade
            state.activities.unshift({
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                text: `Ocorrência registrada para ${student.name} (${tipo})`
            });

            saveState();
            closeSlidePanel();
            showToast(`✅ Ocorrência registrada para ${student.name}!`);
            renderPage();
        };

        openSlidePanel();
        refreshIcons();
    }

    // ======================================================
    // EDITAR OCORRÊNCIA (Slide Panel)
    // ======================================================
    function editarOcorrencia(occId) {
        const occ = state.occurrences.find(o => o.id === occId);
        if (!occ) return;

        const content = getEl('slideContent');
        content.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h3 style="margin:0;">✏️ Editar Ocorrência</h3>
                <button class="btn-icon-sm" onclick="closeSlidePanel()" style="width:32px;height:32px;">
                    <i data-lucide="x" style="width:18px;height:18px;"></i>
                </button>
            </div>

            <div style="background:var(--hover-bg);padding:12px;border-radius:8px;margin-bottom:16px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px;">
                    <div><strong>Aluno:</strong> ${occ.student}</div>
                    <div><strong>Turma:</strong> ${occ.class}</div>
                    <div><strong>Data:</strong> ${occ.date || '-'}</div>
                    <div><strong>Hora:</strong> ${occ.time || '-'}</div>
                </div>
            </div>

            <div class="form-group">
                <label>Tipo de Ocorrência</label>
                <select id="editOccTipo" class="form-control">
                    <option value="Disciplinar" ${occ.type === 'Disciplinar' ? 'selected' : ''}>Disciplinar</option>
                    <option value="Acadêmica" ${occ.type === 'Acadêmica' ? 'selected' : ''}>Acadêmica</option>
                    <option value="Comportamental" ${occ.type === 'Comportamental' ? 'selected' : ''}>Comportamental</option>
                    <option value="Saúde" ${occ.type === 'Saúde' ? 'selected' : ''}>Saúde</option>
                    <option value="Outro" ${occ.type === 'Outro' ? 'selected' : ''}>Outro</option>
                </select>
            </div>

            <div class="form-group">
                <label>Descrição</label>
                <textarea id="editOccDescricao" rows="4" class="form-control">${occ.description}</textarea>
            </div>

            <div class="form-group">
                <label>Status</label>
                <select id="editOccStatus" class="form-control">
                    <option value="Pendente" ${occ.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="Em andamento" ${occ.status === 'Em andamento' ? 'selected' : ''}>Em andamento</option>
                    <option value="Resolvido" ${occ.status === 'Resolvido' ? 'selected' : ''}>Resolvido</option>
                </select>
            </div>

            <div style="margin-top:16px;display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" onclick="closeSlidePanel()">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="updateOcorrenciaBtn">Atualizar Ocorrência</button>
            </div>
        `;

        getEl('updateOcorrenciaBtn').onclick = () => {
            const tipo = getEl('editOccTipo').value;
            const descricao = getEl('editOccDescricao').value.trim();
            const status = getEl('editOccStatus').value;

            if (!descricao) {
                showToast('Por favor, descreva a ocorrência.');
                return;
            }

            occ.type = tipo;
            occ.description = descricao;
            occ.status = status;

            state.activities.unshift({
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                text: `Ocorrência de ${occ.student} atualizada para ${status}`
            });

            saveState();
            closeSlidePanel();
            showToast('✅ Ocorrência atualizada!');
            renderPage();
        };

        openSlidePanel();
        refreshIcons();
    }

    // ======================================================
    // EXCLUIR OCORRÊNCIA
    // ======================================================
    function excluirOcorrencia(occId) {
        const occ = state.occurrences.find(o => o.id === occId);
        if (!occ) return;
        if (!confirm(`Tem certeza que deseja excluir a ocorrência de ${occ.student}?`)) return;

        state.occurrences = state.occurrences.filter(o => o.id !== occId);
        state.activities.unshift({
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            text: `Ocorrência de ${occ.student} excluída`
        });

        saveState();
        showToast('🗑️ Ocorrência excluída!');
        renderPage();
    }

    // ======================================================
    // ATTACH EVENTS
    // ======================================================
    function attachPageEvents() {
        // Seletor de turma
        const classSelector = getEl('classSelector');
        if (classSelector) {
            classSelector.addEventListener('change', () => {
                state._selectedClassId = parseInt(classSelector.value);
                renderPage();
            });
        }

        // Botão para listar ocorrências
        const btnListar = getEl('btnListarOcorrencias');
        if (btnListar) {
            btnListar.addEventListener('click', () => navigateTo('lista-ocorrencias'));
        }

        // Filtros da lista de ocorrências
        const filterStatus = getEl('filterStatus');
        if (filterStatus) {
            filterStatus.addEventListener('change', () => {
                const status = filterStatus.value;
                document.querySelectorAll('#occurrencesTable tbody tr').forEach(row => {
                    if (!status) { row.style.display = ''; return; }
                    row.style.display = row.dataset.status === status ? '' : 'none';
                });
            });
        }

        const filterSearch = getEl('filterSearch');
        if (filterSearch) {
            filterSearch.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase();
                document.querySelectorAll('#occurrencesTable tbody tr').forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(q) ? '' : 'none';
                });
            });
        }
    }

    // ======================================================
    // FEEDBACK FORM
    // ======================================================
    function openFeedbackModal() {
        getEl('feedbackModalOverlay')?.classList.add('show');
    }

    function closeFeedbackModal() {
        getEl('feedbackModalOverlay')?.classList.remove('show');
    }

    document.addEventListener('DOMContentLoaded', function() {
        getEl('feedbackFab')?.addEventListener('click', openFeedbackModal);
        getEl('feedbackCloseBtn')?.addEventListener('click', closeFeedbackModal);
        getEl('feedbackModalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeFeedbackModal();
        });
    });

    // ======================================================
    // EXPOR FUNÇÕES GLOBAIS
    // ======================================================
    window.navigateTo = navigateTo;
    window.openRegistrarOcorrencia = openRegistrarOcorrencia;
    window.editarOcorrencia = editarOcorrencia;
    window.excluirOcorrencia = excluirOcorrencia;
    window.closeSlidePanel = closeSlidePanel;
    window.openSlidePanel = openSlidePanel;

    // ======================================================
    // INIT
    // ======================================================
    function init() {
        const loaded = loadState();
        if (!loaded) {
            initMockData();
            saveState();
        }

        // Navegação sidebar
        document.querySelectorAll('.sidebar-nav a').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(a.dataset.page);
            });
        });

        getEl('sidebarOverlay')?.addEventListener('click', closeSidebar);
        getEl('slideOverlay')?.addEventListener('click', closeSlidePanel);

        // Theme toggle
        getEl('themeToggle')?.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const icon = document.querySelector('#themeToggle i');
            if (icon) icon.setAttribute('data-lucide', document.body.classList.contains('dark') ? 'moon' : 'sun');
            localStorage.setItem('pluri-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
            refreshIcons();
        });

        if (localStorage.getItem('pluri-theme') === 'dark') {
            document.body.classList.add('dark');
            const icon = document.querySelector('#themeToggle i');
            if (icon) icon.setAttribute('data-lucide', 'moon');
        }

        renderPage();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

(function(){
    // ===== STATE =====
    const state = {
        currentPage: 'dashboard',
        appointments: [],
        patients: [],
        conversations: [],
        activities: [],
    };

    // ===== MOCK DATA =====
    function initMockData() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth()+1).padStart(2,'0');
        const dd = String(today.getDate()).padStart(2,'0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        state.patients = [
            {id:1,name:'Maria Silva',phone:'(11) 98765-4321',email:'maria@email.com',created:'10/01/2026',lastVisit:'22/07/2026',nextAppt:'28/07/2026',status:'Ativo',notes:'Prefere horário pela manhã.'},
            {id:2,name:'João Santos',phone:'(11) 91234-5678',email:'joao@email.com',created:'15/02/2026',lastVisit:'20/07/2026',nextAppt:'29/07/2026',status:'Ativo',notes:''},
            {id:3,name:'Ana Oliveira',phone:'(21) 99876-5432',email:'ana@email.com',created:'05/03/2026',lastVisit:'18/07/2026',nextAppt:'28/07/2026',status:'Ativo',notes:'Alergia a dipirona.'},
            {id:4,name:'Carlos Souza',phone:'(31) 98765-1234',email:'carlos@email.com',created:'20/04/2026',lastVisit:'25/07/2026',nextAppt:'30/07/2026',status:'Ativo',notes:''},
            {id:5,name:'Fernanda Lima',phone:'(41) 99876-1111',email:'fernanda@email.com',created:'12/05/2026',lastVisit:'15/07/2026',nextAppt:'28/07/2026',status:'Inativo',notes:'Retorno pendente.'},
            {id:6,name:'Mariana Costa',phone:'(51) 91234-9999',email:'mariana@email.com',created:'01/06/2026',lastVisit:'-',nextAppt:'28/07/2026',status:'Novo',notes:''},
            {id:7,name:'Lucas Ferreira',phone:'(61) 98765-0000',email:'lucas@email.com',created:'18/06/2026',lastVisit:'-',nextAppt:'28/07/2026',status:'Novo',notes:''},
            {id:8,name:'Camila Santos',phone:'(71) 91234-8888',email:'camila@email.com',created:'25/06/2026',lastVisit:'10/07/2026',nextAppt:'28/07/2026',status:'Ativo',notes:''},
            {id:9,name:'Beatriz Lima',phone:'(81) 99876-7777',email:'beatriz@email.com',created:'02/07/2026',lastVisit:'-',nextAppt:'28/07/2026',status:'Novo',notes:''},
            {id:10,name:'Rafael Alves',phone:'(91) 98765-6666',email:'rafael@email.com',created:'10/07/2026',lastVisit:'-',nextAppt:'29/07/2026',status:'Novo',notes:''},
        ];

        state.appointments = [
            {id:1,time:'09:00',patient:'Mariana Costa',professional:'Dra. Ana',service:'Avaliação',status:'Confirmado',date:todayStr},
            {id:2,time:'10:30',patient:'João Almeida',professional:'Dr. Carlos',service:'Retorno',status:'Confirmado',date:todayStr},
            {id:3,time:'11:30',patient:'Ana Martins',professional:'Dra. Fernanda',service:'Avaliação',status:'Pendente',date:todayStr},
            {id:4,time:'14:00',patient:'Lucas Ferreira',professional:'Dra. Ana',service:'Procedimento',status:'Confirmado',date:todayStr},
            {id:5,time:'15:30',patient:'Camila Santos',professional:'Dr. Carlos',service:'Retorno',status:'Pendente',date:todayStr},
            {id:6,time:'17:00',patient:'Beatriz Lima',professional:'Dra. Fernanda',service:'Avaliação',status:'Confirmado',date:todayStr},
            {id:7,time:'08:30',patient:'Pedro Rocha',professional:'Dra. Ana',service:'Retorno',status:'Concluído',date:todayStr},
        ];

        state.conversations = [
            {id:1,patient:'Maria Silva',channel:'WhatsApp',lastMsg:'Gostaria de remarcar minha consulta.',time:'10:15',status:'Aguardando',responsible:'-'},
            {id:2,patient:'Fernanda Lima',channel:'WhatsApp',lastMsg:'Qual o horário disponível para amanhã?',time:'09:42',status:'Aguardando',responsible:'-'},
            {id:3,patient:'Carlos Souza',channel:'E-mail',lastMsg:'Preciso de um atestado.',time:'08:30',status:'Em andamento',responsible:'Paula'},
            {id:4,patient:'Novo contato',channel:'WhatsApp',lastMsg:'Olá, gostaria de agendar uma avaliação.',time:'11:02',status:'Aguardando',responsible:'-'},
            {id:5,patient:'Rafael Alves',channel:'Telefone',lastMsg:'Confirmar horário de amanhã.',time:'07:50',status:'Resolvido',responsible:'Paula'},
        ];

        state.activities = [
            {time:'10:42',text:'Maria confirmou consulta.',type:'patient'},
            {time:'10:38',text:'Novo paciente cadastrado.',type:'system'},
            {time:'10:31',text:'PLURI respondeu solicitação de horário.',type:'automation'},
            {time:'10:24',text:'Consulta de João reagendada.',type:'system'},
            {time:'10:17',text:'Lembrete enviado para Ana.',type:'automation'},
        ];
    }

    // ===== HELPERS =====
    function getInitials(name) {
        const parts = name.split(' ');
        return (parts[0]?.[0]||'') + (parts[1]?.[0]||'');
    }

    function safeGetElement(id) {
        return document.getElementById(id);
    }

    // ===== UI CONTROLS =====
    function openModal() {
        const overlay = safeGetElement('modalOverlay');
        if (overlay) overlay.classList.add('show');
        const dateInput = safeGetElement('apptDate');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        const timeInput = safeGetElement('apptTime');
        if (timeInput) timeInput.value = '09:00';
        refreshIcons();
    }

    function closeModal() {
        const overlay = safeGetElement('modalOverlay');
        if (overlay) overlay.classList.remove('show');
    }

    function openSlidePanel() {
        const panel = safeGetElement('slidePanel');
        const overlay = safeGetElement('slideOverlay');
        if (panel) panel.classList.add('show');
        if (overlay) overlay.classList.add('show');
    }

    function closeSlidePanel() {
        const panel = safeGetElement('slidePanel');
        const overlay = safeGetElement('slideOverlay');
        if (panel) panel.classList.remove('show');
        if (overlay) overlay.classList.remove('show');
    }

    function showToast(msg) {
        const container = safeGetElement('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function refreshIcons() {
        if (window.lucide && typeof lucide.createIcons === 'function') {
            lucide.createIcons();
        }
    }

    // ===== NAVIGATION =====
    function navigateTo(page) {
        state.currentPage = page;
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`.sidebar-nav a[data-page="${page}"]`);
        if (link) link.classList.add('active');
        renderPage();
        if (window.innerWidth <= 767) closeSidebar();
    }

    function toggleSidebar() {
        const sidebar = safeGetElement('sidebar');
        const overlay = safeGetElement('sidebarOverlay');
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
    }

    function closeSidebar() {
        const sidebar = safeGetElement('sidebar');
        const overlay = safeGetElement('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
    }

    // ===== RENDER ENGINE =====
    function renderPage() {
        const container = safeGetElement('pageContainer');
        const title = safeGetElement('pageTitle');
        const subtitle = safeGetElement('pageSubtitle');
        if (!container) return;

        // Limpa possível referência anterior do modal
        if (window._modalBtnHandler) {
            const oldBtn = document.getElementById('openModalBtn');
            if (oldBtn) oldBtn.removeEventListener('click', window._modalBtnHandler);
        }

        switch (state.currentPage) {
            case 'dashboard': renderDashboard(container, title, subtitle); break;
            case 'agenda': renderAgenda(container, title, subtitle); break;
            case 'atendimentos': renderAtendimentos(container, title, subtitle); break;
            case 'pacientes': renderPacientes(container, title, subtitle); break;
            case 'automacoes': renderAutomacoes(container, title, subtitle); break;
            case 'indicadores': renderIndicadores(container, title, subtitle); break;
            case 'configuracoes': renderConfiguracoes(container, title, subtitle); break;
        }
        refreshIcons();
    }

    function renderBarChart(values, labels, highlightIdx) {
        const max = Math.max(...values);
        return values.map((v, i) => {
            const pct = (v / max) * 100;
            return `
                <div class="bar-col">
                    <span class="bar-value">${v}</span>
                    <div class="bar-fill${i === highlightIdx ? ' today' : ''}" style="height:${pct}%"></div>
                    <span class="bar-label">${labels[i]}</span>
                </div>`;
        }).join('');
    }

    // ===== DASHBOARD =====
    function renderDashboard(container, title, subtitle) {
        if (title) title.textContent = 'Bom dia, Paula.';
        if (subtitle) subtitle.textContent = 'Veja o que está acontecendo na clínica hoje.';
        const confirmed = state.appointments.filter(a => a.status === 'Confirmado').length;
        const pending = state.appointments.filter(a => a.status === 'Pendente').length;
        const totalToday = state.appointments.length;
        const occupation = 92;

        container.innerHTML = `
            <div class="kpi-row">
                <div class="kpi-card"><div class="kpi-value">${totalToday}</div><div class="kpi-label">Atendimentos hoje</div><div class="kpi-sub">${confirmed} confirmados</div></div>
                <div class="kpi-card"><div class="kpi-value">${occupation}%</div><div class="kpi-label">Taxa de ocupação</div><div class="kpi-sub">+8% esta semana</div></div>
                <div class="kpi-card"><div class="kpi-value">${pending}</div><div class="kpi-label">Confirmações pendentes</div><div class="kpi-sub amber">Precisam de atenção</div></div>
                <div class="kpi-card"><div class="kpi-value">12</div><div class="kpi-label">Novos pacientes</div><div class="kpi-sub">Nos últimos 7 dias</div></div>
            </div>
            <div class="grid-2">
                <div class="card">
                    <div class="card-header"><h3>Agenda de hoje</h3><span class="btn btn-sm btn-outline" id="gotoAgenda">Ver agenda →</span></div>
                    <div class="card-body no-padding">
                        <ul class="agenda-list">${state.appointments.slice(0,6).map(a => `
                            <li class="agenda-item">
                                <span class="agenda-time">${a.time}</span>
                                <div class="agenda-avatar">${getInitials(a.patient)}</div>
                                <div class="agenda-info">
                                    <div class="agenda-name">${a.patient}</div>
                                    <div class="agenda-detail">${a.service} · ${a.professional}</div>
                                </div>
                                <span class="status-badge ${a.status === 'Confirmado' ? 'confirmed' : a.status === 'Pendente' ? 'pending' : 'cancelled'}">
                                    <span class="status-dot ${a.status === 'Confirmado' ? 'green' : 'amber'}"></span>${a.status}
                                </span>
                            </li>`).join('')}</ul>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>Precisa da sua atenção</h3></div>
                    <div class="card-body">
                        <div style="display:flex;flex-direction:column;gap:14px;">
                            <div style="padding:12px 14px;background:#FAFBFC;border-radius:8px;">
                                <strong style="font-size:13px;">${pending} confirmações pendentes</strong>
                                <p style="font-size:12px;color:var(--text-secondary);">Pacientes ainda não confirmaram.</p>
                                <button class="btn btn-sm btn-outline goto-agenda">Ver agenda</button>
                            </div>
                            <div style="padding:12px 14px;background:#FAFBFC;border-radius:8px;">
                                <strong style="font-size:13px;">2 conversas precisam da equipe</strong>
                                <p style="font-size:12px;color:var(--text-secondary);">Solicitações aguardando atendimento.</p>
                                <button class="btn btn-sm btn-outline goto-atendimentos">Ver conversas</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="grid-3">
                <div class="card"><div class="card-header"><h3>Atendimentos da semana</h3></div><div class="card-body"><div class="chart-container">${renderBarChart([18,22,26,21,28,12],['Seg','Ter','Qua','Qui','Sex','Sáb'],2)}</div></div></div>
                <div class="card"><div class="card-header"><h3>Atividade recente</h3></div><div class="card-body"><div class="timeline">${state.activities.map(a => `<div class="timeline-item"><span class="timeline-time">${a.time}</span><div class="timeline-dot"></div><span class="timeline-text">${a.text}</span></div>`).join('')}</div></div></div>
                <div class="card"><div class="card-header"><h3>Automações ativas</h3></div><div class="card-body">
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        ${[{name:'Confirmação de consultas',status:'Ativo'},{name:'Lembrete 24h antes',status:'Ativo'},{name:'Atendimento inicial',status:'Ativo'},{name:'Recuperação de faltas',status:'Pausado'}].map(a => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #F9FAFB;"><span style="font-size:13px;">${a.name}</span><span class="status-badge ${a.status==='Ativo'?'confirmed':'pending'}">${a.status}</span></div>`).join('')}
                        <button class="btn btn-sm btn-outline goto-automacoes" style="margin-top:8px;width:100%;">Gerenciar</button>
                    </div>
                </div></div>
            </div>`;

        // Adiciona os listeners internos
        document.getElementById('gotoAgenda')?.addEventListener('click', () => navigateTo('agenda'));
        document.querySelectorAll('.goto-agenda').forEach(btn => btn.addEventListener('click', () => navigateTo('agenda')));
        document.querySelectorAll('.goto-atendimentos').forEach(btn => btn.addEventListener('click', () => navigateTo('atendimentos')));
        document.querySelector('.goto-automacoes')?.addEventListener('click', () => navigateTo('automacoes'));
    }

    // ===== AGENDA =====
    function renderAgenda(container, title, subtitle) {
        if (title) title.textContent = 'Agenda';
        if (subtitle) subtitle.textContent = 'Gerencie os horários da clínica.';
        const todayStr = new Date().toISOString().split('T')[0];
        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div class="tabs" id="agendaTabs">
                    <button class="tab active">Hoje</button>
                    <button class="tab">Semana</button>
                </div>
                <button class="btn btn-primary" id="openModalBtn"><i data-lucide="plus" style="width:16px;height:16px;"></i> Novo agendamento</button>
            </div>
            <div class="card"><div class="card-body no-padding">
                <ul class="agenda-list">${state.appointments.filter(a => a.date === todayStr).map(a => `
                    <li class="agenda-item">
                        <span class="agenda-time">${a.time}</span>
                        <div class="agenda-avatar">${getInitials(a.patient)}</div>
                        <div class="agenda-info"><div class="agenda-name">${a.patient}</div><div class="agenda-detail">${a.service} · ${a.professional}</div></div>
                        <span class="status-badge ${a.status==='Confirmado'?'confirmed':a.status==='Pendente'?'pending':'cancelled'}"><span class="status-dot ${a.status==='Confirmado'?'green':'amber'}"></span>${a.status}</span>
                    </li>`).join('')}</ul>
            </div></div>`;

        const newBtn = document.getElementById('openModalBtn');
        if (newBtn) {
            window._modalBtnHandler = openModal;
            newBtn.addEventListener('click', openModal);
        }
    }

    // ===== ATENDIMENTOS =====
    function renderAtendimentos(container, title, subtitle) {
        if (title) title.textContent = 'Atendimentos';
        if (subtitle) subtitle.textContent = 'Central de conversas com pacientes.';
        container.innerHTML = `
            <div class="card"><div class="card-body no-padding">
                ${state.conversations.map(c => `
                <div class="agenda-item" style="cursor:pointer;" data-conversation-id="${c.id}">
                    <div class="agenda-avatar">${getInitials(c.patient)}</div>
                    <div class="agenda-info">
                        <div class="agenda-name">${c.patient} <span style="font-weight:400;font-size:11px;color:var(--text-secondary);">${c.channel}</span></div>
                        <div class="agenda-detail">${c.lastMsg}</div>
                    </div>
                    <span class="status-badge ${c.status==='Aguardando'?'pending':'confirmed'}">${c.status}</span>
                </div>`).join('')}
            </div></div>`;
        document.querySelectorAll('[data-conversation-id]').forEach(el => {
            el.addEventListener('click', () => openConversation(Number(el.dataset.conversationId)));
        });
    }

    function openConversation(id) {
        const conv = state.conversations.find(c => c.id === id);
        if (!conv) return;
        const content = safeGetElement('slideContent');
        if (!content) return;
        content.innerHTML = `
            <h3 style="margin-bottom:12px;">${conv.patient}</h3>
            <p style="font-size:13px;color:var(--text-secondary);">Canal: ${conv.channel}</p>
            <p style="font-size:13px;color:var(--text-secondary);">Última mensagem: ${conv.lastMsg}</p>
            <p style="font-size:13px;color:var(--text-secondary);">Horário: ${conv.time}</p>
            <div style="margin-top:16px;display:flex;gap:8px;">
                <button class="btn btn-sm btn-outline" id="slideVerPaciente">Ver paciente</button>
                <button class="btn btn-sm btn-primary" id="slideResolver">Marcar como resolvido</button>
            </div>`;
        document.getElementById('slideVerPaciente')?.addEventListener('click', () => { closeSlidePanel(); navigateTo('pacientes'); });
        document.getElementById('slideResolver')?.addEventListener('click', () => resolveConversation(id));
        openSlidePanel();
    }

    function resolveConversation(id) {
        const conv = state.conversations.find(c => c.id === id);
        if (conv) conv.status = 'Resolvido';
        closeSlidePanel();
        showToast('Atendimento marcado como resolvido.');
        renderPage();
    }

    // ===== PACIENTES =====
    function renderPacientes(container, title, subtitle) {
        if (title) title.textContent = 'Pacientes';
        if (subtitle) subtitle.textContent = 'Base de pacientes da clínica.';
        container.innerHTML = `
            <div class="search-bar"><input type="text" id="patientSearch" placeholder="Buscar por nome ou telefone..."></div>
            <div class="card"><div class="card-body no-padding" style="overflow-x:auto;">
                <table class="data-table">
                    <thead><tr><th>Paciente</th><th>Telefone</th><th>Último atendimento</th><th>Próxima consulta</th><th>Status</th></tr></thead>
                    <tbody id="patientTableBody">${state.patients.map(p => `
                        <tr style="cursor:pointer;" data-patient-id="${p.id}">
                            <td style="font-weight:500;">${p.name}</td><td>${p.phone}</td><td>${p.lastVisit}</td><td>${p.nextAppt}</td>
                            <td><span class="status-badge ${p.status==='Ativo'?'confirmed':p.status==='Novo'?'pending':'cancelled'}">${p.status}</span></td>
                        </tr>`).join('')}</tbody>
                </table>
            </div></div>`;
        document.getElementById('patientSearch')?.addEventListener('input', function(e) {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('#patientTableBody tr').forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });
        document.querySelectorAll('[data-patient-id]').forEach(row => {
            row.addEventListener('click', () => openPatient(Number(row.dataset.patientId)));
        });
    }

    function openPatient(id) {
        const p = state.patients.find(pt => pt.id === id);
        if (!p) return;
        const content = safeGetElement('slideContent');
        if (!content) return;
        content.innerHTML = `
            <h3 style="margin-bottom:8px;">${p.name}</h3>
            <p style="font-size:13px;color:var(--text-secondary);">📞 ${p.phone}</p>
            <p style="font-size:13px;color:var(--text-secondary);">✉️ ${p.email}</p>
            <p style="font-size:13px;color:var(--text-secondary);">📅 Cadastro: ${p.created}</p>
            <hr style="margin:12px 0;border-color:#F2F4F7;">
            <p style="font-size:13px;"><strong>Último atendimento:</strong> ${p.lastVisit}</p>
            <p style="font-size:13px;"><strong>Próxima consulta:</strong> ${p.nextAppt}</p>
            <p style="font-size:13px;"><strong>Observações:</strong> ${p.notes||'Nenhuma.'}</p>
            <div style="margin-top:16px;"><button class="btn btn-sm btn-outline" id="slideAgendar">Agendar</button></div>`;
        document.getElementById('slideAgendar')?.addEventListener('click', () => { closeSlidePanel(); navigateTo('agenda'); });
        openSlidePanel();
    }

    // ===== AUTOMAÇÕES =====
    function renderAutomacoes(container, title, subtitle) {
        if (title) title.textContent = 'Automações';
        if (subtitle) subtitle.textContent = 'Camada operacional inteligente.';
        const autos = [
            {name:'Atendimento inicial',desc:'Responde automaticamente novos contatos.',status:'Ativo',last:'Hoje, 10:31',count:342},
            {name:'Confirmação de consulta',desc:'Solicita confirmação 48h antes.',status:'Ativo',last:'Hoje, 09:15',count:128},
            {name:'Lembrete de consulta',desc:'Envia lembrete 24h antes.',status:'Ativo',last:'Ontem, 18:00',count:256},
            {name:'Follow-up',desc:'Acompanha pacientes após atendimento.',status:'Pausado',last:'15/07/2026',count:89}
        ];
        container.innerHTML = `<div class="automation-grid">${autos.map(a => `
            <div class="automation-card">
                <h4>${a.name}</h4><p>${a.desc}</p>
                <div class="automation-meta">
                    <span class="status-badge ${a.status==='Ativo'?'confirmed':'pending'}">${a.status}</span>
                    <span>Última: ${a.last} · ${a.count}x</span>
                </div>
            </div>`).join('')}</div>`;
    }

    // ===== INDICADORES =====
    function renderIndicadores(container, title, subtitle) {
        if (title) title.textContent = 'Indicadores';
        if (subtitle) subtitle.textContent = 'Visão operacional da clínica.';
        container.innerHTML = `
            <div class="grid-2">
                <div class="card"><div class="card-header"><h3>Agendamentos por dia (semana)</h3></div><div class="card-body"><div class="chart-container">${renderBarChart([18,22,26,21,28,12],['Seg','Ter','Qua','Qui','Sex','Sáb'],2)}</div></div></div>
                <div class="card"><div class="card-header"><h3>Confirmados x Cancelados</h3></div><div class="card-body"><div class="chart-container">${renderBarChart([45,8],['Confirmados','Cancelados'],0)}</div></div></div>
            </div>
            <div class="grid-2">
                <div class="kpi-card"><div class="kpi-value">156</div><div class="kpi-label">Agendamentos no mês</div></div>
                <div class="kpi-card"><div class="kpi-value">89%</div><div class="kpi-label">Taxa de confirmação</div></div>
            </div>`;
    }

    // ===== CONFIGURAÇÕES =====
    function renderConfiguracoes(container, title, subtitle) {
        if (title) title.textContent = 'Configurações';
        if (subtitle) subtitle.textContent = 'Gerencie sua clínica.';
        container.innerHTML = `
            <div class="card"><div class="card-header"><h3>Clínica</h3></div><div class="card-body">
                <div class="form-row"><div class="form-group"><label>Nome</label><input value="Clínica Bem-Estar"></div><div class="form-group"><label>Telefone</label><input value="(11) 3000-1234"></div></div>
                <div class="form-row"><div class="form-group"><label>E-mail</label><input value="contato@bemestar.com"></div><div class="form-group"><label>Horário</label><input value="08:00 - 18:00"></div></div>
                <div class="form-group"><label>Endereço</label><input value="Rua Saúde, 100 - São Paulo/SP"></div>
            </div></div>
            <div class="card"><div class="card-header"><h3>Equipe</h3></div><div class="card-body no-padding">
                <table class="data-table"><thead><tr><th>Nome</th><th>Função</th><th>Status</th></tr></thead>
                    <tbody>${['Paula Santos|Gestora|Ativo','Dra. Ana|Dentista|Ativo','Dr. Carlos|Dentista|Ativo','Dra. Fernanda|Ortodontista|Ativo'].map(u => {
                        const [n,f,s] = u.split('|');
                        return `<tr><td>${n}</td><td>${f}</td><td><span class="status-badge confirmed">${s}</span></td></tr>`;
                    }).join('')}</tbody></table>
            </div></div>
            <div class="card"><div class="card-header"><h3>Integrações</h3></div><div class="card-body">
                <div style="display:flex;flex-direction:column;gap:10px;">
                    ${[{name:'WhatsApp',connected:true},{name:'Google Calendar',connected:true},{name:'E-mail',connected:false}].map(i => `<div style="display:flex;justify-content:space-between;align-items:center;"><span>${i.name}</span><span class="status-badge ${i.connected?'confirmed':'pending'}">${i.connected?'Conectado':'Não conectado'}</span></div>`).join('')}
                </div>
            </div></div>`;
    }

    // ===== SALVAR AGENDAMENTO =====
    function saveAppointment() {
        const patient = safeGetElement('apptPatient')?.value.trim();
        const phone = safeGetElement('apptPhone')?.value.trim();
        const professional = safeGetElement('apptProfessional')?.value;
        const service = safeGetElement('apptService')?.value;
        const date = safeGetElement('apptDate')?.value;
        const time = safeGetElement('apptTime')?.value;
        const notes = safeGetElement('apptNotes')?.value;
        if (!patient || !date || !time) {
            showToast('Preencha paciente, data e horário.');
            return;
        }
        const newAppt = {
            id: Date.now(),
            time,
            patient,
            professional,
            service,
            status: 'Confirmado',
            date
        };
        state.appointments.unshift(newAppt);
        if (!state.patients.some(p => p.name.toLowerCase() === patient.toLowerCase())) {
            state.patients.push({
                id: Date.now(),
                name: patient,
                phone: phone || '-',
                email: '-',
                created: new Date().toLocaleDateString('pt-BR'),
                lastVisit: '-',
                nextAppt: date.split('-').reverse().join('/'),
                status: 'Novo',
                notes: notes || ''
            });
        }
        closeModal();
        showToast('Agendamento criado com sucesso!');
        renderPage();
    }

    // ===== INITIALIZE =====
    function init() {
        try {
            initMockData();

            // Sidebar navigation
            document.querySelectorAll('.sidebar-nav a').forEach(a => {
                a.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateTo(this.dataset.page);
                });
            });

            // Hamburger menu
            safeGetElement('hamburgerBtn')?.addEventListener('click', toggleSidebar);
            safeGetElement('sidebarOverlay')?.addEventListener('click', closeSidebar);

            // Modal controls
            safeGetElement('modalClose')?.addEventListener('click', closeModal);
            safeGetElement('modalCancel')?.addEventListener('click', closeModal);
            safeGetElement('modalSave')?.addEventListener('click', saveAppointment);
            safeGetElement('modalOverlay')?.addEventListener('click', function(e) {
                if (e.target === this) closeModal();
            });

            // Slide panel overlay
            safeGetElement('slideOverlay')?.addEventListener('click', closeSlidePanel);

            // Notifications
            safeGetElement('notifBtn')?.addEventListener('click', () => showToast('Nenhuma notificação nova.'));

            // Initial render
            renderPage();

            // Expose global API
            window.app = { navigateTo, openConversation, resolveConversation, openPatient, openModal, showToast };
        } catch (err) {
            console.error('Erro na inicialização do PLURI OS:', err);
        }
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

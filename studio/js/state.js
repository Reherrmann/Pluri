// js/state.js
const state = {

    clinic: {
    id: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    schedule: "",
    timezone: "America/Sao_Paulo",

    integrations: {
        calendar: false,
        whatsapp: false,
        email: false
    },

    onboarding: false
},

    currentPage: 'dashboard',

    appointments: [],
    patients: [],
    conversations: [],
    activities: [],

    staff: [
        { id: 1, name: 'Recepção', role: 'Atendimento', status: 'Ativo', email: 'recepcao@bergamo.com', phone: '(11) 3000-1234' },
        { id: 2, name: 'Dra. Ana', role: 'Dentista', status: 'Ativo', email: 'ana@bergamo.com', phone: '(11) 98765-1111' },
        { id: 3, name: 'Dr. Carlos', role: 'Dentista', status: 'Ativo', email: 'carlos@bergamo.com', phone: '(11) 98765-2222' },
        { id: 4, name: 'Dra. Fernanda', role: 'Ortodontista', status: 'Ativo', email: 'fernanda@bergamo.com', phone: '(11) 98765-3333' },
    ],
};

function initMockData() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    state.patients = [
        { id: 1, name: 'Maria Silva', phone: '(11) 98765-4321', email: 'maria@email.com', created: '10/01/2026', lastVisit: '22/07/2026', nextAppt: '28/07/2026', status: 'Ativo', notes: 'Prefere contato pelo WhatsApp.' },
        { id: 2, name: 'João Santos', phone: '(11) 91234-5678', email: 'joao@email.com', created: '15/02/2026', lastVisit: '20/07/2026', nextAppt: '29/07/2026', status: 'Ativo', notes: '' },
        { id: 3, name: 'Ana Oliveira', phone: '(21) 99876-5432', email: 'ana@email.com', created: '05/03/2026', lastVisit: '18/07/2026', nextAppt: '28/07/2026', status: 'Ativo', notes: 'Prefere atendimento no período da manhã.' },
        { id: 4, name: 'Carlos Souza', phone: '(31) 98765-1234', email: 'carlos@email.com', created: '20/04/2026', lastVisit: '25/07/2026', nextAppt: '30/07/2026', status: 'Ativo', notes: '' },
        { id: 5, name: 'Fernanda Lima', phone: '(41) 99876-1111', email: 'fernanda@email.com', created: '12/05/2026', lastVisit: '15/07/2026', nextAppt: '28/07/2026', status: 'Inativo', notes: 'Retorno pendente.' },
    ];

    state.appointments = [
        { id: 1, time: '09:00', patient: 'Mariana Costa', professional: 'Dra. Ana', service: 'Avaliação', status: 'Confirmado', date: todayStr },
        { id: 2, time: '10:30', patient: 'João Almeida', professional: 'Dr. Carlos', service: 'Retorno', status: 'Confirmado', date: todayStr },
        { id: 3, time: '11:30', patient: 'Ana Martins', professional: 'Dra. Fernanda', service: 'Avaliação', status: 'Pendente', date: todayStr },
        { id: 4, time: '14:00', patient: 'Lucas Ferreira', professional: 'Dra. Ana', service: 'Procedimento', status: 'Confirmado', date: todayStr },
        { id: 5, time: '15:30', patient: 'Camila Santos', professional: 'Dr. Carlos', service: 'Retorno', status: 'Pendente', date: todayStr },
        { id: 6, time: '17:00', patient: 'Beatriz Lima', professional: 'Dra. Fernanda', service: 'Avaliação', status: 'Confirmado', date: todayStr },
        { id: 7, time: '08:30', patient: 'Pedro Rocha', professional: 'Dra. Ana', service: 'Retorno', status: 'Concluído', date: todayStr },
    ];

    state.conversations = [
        { id: 1, patient: 'Maria Silva', channel: 'WhatsApp', lastMsg: 'Gostaria de remarcar minha consulta.', time: '10:15', status: 'Aguardando', responsible: '-', phone: '(11) 98765-4321' },
        { id: 2, patient: 'Fernanda Lima', channel: 'WhatsApp', lastMsg: 'Qual o horário disponível para amanhã?', time: '09:42', status: 'Aguardando', responsible: '-', phone: '(41) 99876-1111' },
        { id: 3, patient: 'Carlos Souza', channel: 'E-mail', lastMsg: 'Preciso de um atestado.', time: '08:30', status: 'Em andamento', responsible: 'Recepção', phone: '(31) 98765-1234' },
        { id: 4, patient: 'Novo contato', channel: 'WhatsApp', lastMsg: 'Olá, gostaria de agendar uma avaliação.', time: '11:02', status: 'Aguardando', responsible: '-', phone: '' },
        { id: 5, patient: 'Rafael Alves', channel: 'Telefone', lastMsg: 'Confirmar horário de amanhã.', time: '07:50', status: 'Resolvido', responsible: 'Recepção', phone: '(91) 98765-6666' },
    ];

    state.activities = [
        { time: '10:42', text: 'Maria confirmou consulta.' },
        { time: '10:38', text: 'Novo paciente cadastrado.' },
        { time: '10:31', text: 'PLURI respondeu solicitação de horário.' },
        { time: '10:24', text: 'Consulta de João reagendada.' },
        { time: '10:17', text: 'Lembrete enviado para Ana.' },
    ];
}

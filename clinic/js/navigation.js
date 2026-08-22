// js/navigation.js

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar?.classList.remove('open');
    overlay?.classList.remove('show');
}

function navigateTo(page) {
    state.currentPage = page;
    try {
        localStorage.setItem('clinic_navigation', JSON.stringify({ page, patientRow: null, patientSection: null }));
    } catch (_) {}

    document
        .querySelectorAll('.sidebar-nav a')
        .forEach(a => a.classList.remove('active'));

    const link = document.querySelector(
        `.sidebar-nav a[data-page="${page}"]`
    );

    if (link) link.classList.add('active');

    // Fecha imediatamente o menu lateral após escolher uma aba.
    closeSidebar();
    renderPage();
}

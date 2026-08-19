// js/navigation.js

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar?.classList.remove('open');
    overlay?.classList.remove('show');
}

function navigateTo(page) {
    state.currentPage = page;

    document
        .querySelectorAll('.sidebar-nav a')
        .forEach(a => a.classList.remove('active'));

    const link = document.querySelector(
        `.sidebar-nav a[data-page="${page}"]`
    );

    if (link) link.classList.add('active');

    renderPage();
    closeSidebar();
}

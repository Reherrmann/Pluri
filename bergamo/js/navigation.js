// js/navigation.js
function navigateTo(page) {
    state.currentPage = page;
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`.sidebar-nav a[data-page="${page}"]`);
    if (link) link.classList.add('active');
    renderPage();
    if (window.innerWidth <= 767) closeSidebar();
}

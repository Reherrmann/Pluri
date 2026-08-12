// js/theme.js
function toggleTheme() {
    document.body.classList.toggle('dark');
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        const isDark = document.body.classList.contains('dark');
        icon.setAttribute('data-lucide', isDark ? 'moon' : 'sun');
        refreshIcons();
    }
    localStorage.setItem('pluri-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function loadTheme() {
    const saved = localStorage.getItem('pluri-theme');
    if (saved === 'dark') {
        document.body.classList.add('dark');
        const icon = document.querySelector('#themeToggle i');
        if (icon) icon.setAttribute('data-lucide', 'moon');
    }
}

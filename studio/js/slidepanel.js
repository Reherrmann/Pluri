// js/slidepanel.js
function openSlidePanel() {
    getEl('slidePanel')?.classList.add('show');
    getEl('slideOverlay')?.classList.add('show');
}

function closeSlidePanel() {
    getEl('slidePanel')?.classList.remove('show');
    getEl('slideOverlay')?.classList.remove('show');
}

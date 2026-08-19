// Mentalita — infraestrutura do painel lateral
function openSlidePanel() {
    const panel = getEl('slidePanel');
    const overlay = getEl('slideOverlay');
    panel?.classList.add('show');
    overlay?.classList.add('show');
}

function closeSlidePanel() {
    const panel = getEl('slidePanel');
    const overlay = getEl('slideOverlay');
    panel?.classList.remove('show');
    overlay?.classList.remove('show');
}

function setSlideContent(html) {
    const content = getEl('slideContent');
    if (!content) {
        console.error('[Mentalita] Elemento #slideContent não encontrado.');
        return;
    }
    content.innerHTML = html || '';
}

window.openSlidePanel = openSlidePanel;
window.closeSlidePanel = closeSlidePanel;
window.setSlideContent = setSlideContent;

// Clinic — infraestrutura do painel lateral
function openSlidePanel(){getEl('slidePanel')?.classList.add('show');getEl('slideOverlay')?.classList.add('show');}
function closeSlidePanel(){getEl('slidePanel')?.classList.remove('show');getEl('slideOverlay')?.classList.remove('show');}
function setSlideContent(html){const content=getEl('slideContent');if(!content){console.error('[Clinic] Elemento #slideContent não encontrado.');return;}content.innerHTML=html||'';}
window.openSlidePanel=openSlidePanel;window.closeSlidePanel=closeSlidePanel;window.setSlideContent=setSlideContent;

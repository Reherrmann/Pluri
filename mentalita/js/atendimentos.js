// Conversas — Mentalita
// Módulo temporariamente desativado enquanto a integração de conversas é preparada.
function buildAtendimentos() {
    return `
        <div class="card">
            <div class="card-body" style="padding:56px 32px;text-align:center;">
                <div style="width:56px;height:56px;margin:0 auto 18px;border-radius:16px;background:var(--hover-bg);display:flex;align-items:center;justify-content:center;">
                    <i data-lucide="message-circle" style="width:28px;height:28px;color:var(--text-secondary);"></i>
                </div>
                <h3 style="margin:0 0 8px;">Conversas</h3>
                <p style="margin:0;color:var(--text-secondary);font-size:14px;">Em breve</p>
                <p style="margin:8px auto 0;max-width:480px;color:var(--text-secondary);font-size:13px;line-height:1.5;">Estamos preparando a central de conversas da Mentalita. Por enquanto, esta área permanece desativada para não misturar dados ou integrações da PLURI OS.</p>
            </div>
        </div>
    `;
}

window.buildAtendimentos = buildAtendimentos;

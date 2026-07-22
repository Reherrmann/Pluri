const Manual = (() => {
    function render() {
        return `
            <div class="fade-in">
                <h3>Manual Comercial</h3>
                <div class="empty-state" style="margin-top:40px">
                    <div class="empty-state-icon">📖</div>
                    <h3>Manual em breve</h3>
                    <p>O manual comercial completo será incorporado aqui com busca, favoritos, notas e progresso.</p>
                    <div style="display:flex;gap:12px;margin-top:16px">
                        <span class="badge-tag info">🔍 Busca</span>
                        <span class="badge-tag warning">⭐ Favoritos</span>
                        <span class="badge-tag success">📝 Notas</span>
                        <span class="badge-tag accent">📊 Progresso</span>
                    </div>
                </div>
            </div>`;
    }
    window.Manual = { render };
    return { render };
})();

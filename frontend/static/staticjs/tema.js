// Arquivo: tema.js - Alternador Robusto de Tema Claro / Escuro

(function() {
    // Aplica imediatamente antes de renderizar
    if (localStorage.getItem('tema') === 'claro') {
        document.documentElement.classList.add('light-theme');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const root = document.documentElement;

    function atualizarBotao() {
        if (!themeToggleBtn) return;
        if (root.classList.contains('light-theme')) {
            themeToggleBtn.innerHTML = '🌙 Tema Escuro';
        } else {
            themeToggleBtn.innerHTML = '☀️ Tema Claro';
        }
    }

    atualizarBotao();

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            root.classList.toggle('light-theme');
            
            if (root.classList.contains('light-theme')) {
                localStorage.setItem('tema', 'claro');
            } else {
                localStorage.setItem('tema', 'escuro');
            }
            atualizarBotao();
        });
    }
});
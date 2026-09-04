// Arquivo: js/tema.js
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const root = document.documentElement; // A tag <html>

    // Ajusta o texto do botão assim que a página carrega
    if (root.classList.contains('light-theme')) {
        themeToggleBtn.textContent = '🌙 Tema Escuro';
    } else {
        themeToggleBtn.textContent = '☀️ Tema Claro';
    }

    // Ação ao clicar no botão
    themeToggleBtn.addEventListener('click', () => {
        root.classList.toggle('light-theme');
        
        if (root.classList.contains('light-theme')) {
            localStorage.setItem('tema', 'claro');
            themeToggleBtn.textContent = '🌙 Tema Escuro';
        } else {
            localStorage.setItem('tema', 'escuro');
            themeToggleBtn.textContent = '☀️ Tema Claro';
        }
    });
});
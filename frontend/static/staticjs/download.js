// Arquivo: download.js - Registro e Gerenciamento de Downloads de Livros

document.addEventListener('DOMContentLoaded', () => {
    const btnDownload = document.getElementById('btnDownload');
    if (!btnDownload) return;

    const urlParams = new URLSearchParams(window.location.search);
    const livroId = parseInt(urlParams.get('id')) || 1;

    // Elemento para mostrar a contagem de downloads
    let downloadCountBadge = document.getElementById('downloadsCount');
    if (!downloadCountBadge) {
        downloadCountBadge = document.createElement('span');
        downloadCountBadge.id = 'downloadsCount';
        downloadCountBadge.style.cssText = 'display: block; font-size: 0.9rem; color: #a8a8b3; margin-top: 8px; font-weight: normal;';
        btnDownload.parentNode.appendChild(downloadCountBadge);
    }

    // Carrega contagem inicial da API
    fetch(`http://localhost:5000/api/livros/${livroId}`)
        .then(res => res.json())
        .then(livro => {
            if (livro && typeof livro.downloads === 'number') {
                downloadCountBadge.textContent = `📊 Total de downloads: ${livro.downloads}`;
            }
        })
        .catch(() => {
            const downloadsSalvos = localStorage.getItem(`downloads_livro_${livroId}`) || '0';
            downloadCountBadge.textContent = `📊 Total de downloads: ${downloadsSalvos}`;
        });

    btnDownload.addEventListener('click', async (e) => {
        try {
            // Envia requisição para incrementar downloads na API Python
            const res = await fetch(`http://localhost:5000/api/livros/${livroId}/download`, {
                method: 'POST'
            });

            if (res.ok) {
                const data = await res.json();
                if (data && data.downloads) {
                    downloadCountBadge.textContent = `📊 Total de downloads: ${data.downloads}`;
                }
            } else {
                incrementarLocal();
            }
        } catch {
            incrementarLocal();
        }
    });

    function incrementarLocal() {
        const key = `downloads_livro_${livroId}`;
        let atual = parseInt(localStorage.getItem(key) || '0');
        atual++;
        localStorage.setItem(key, atual);
        downloadCountBadge.textContent = `📊 Total de downloads: ${atual}`;
    }
});
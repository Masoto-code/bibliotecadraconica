// Arquivo: pesquisar.js - Busca e Filtragem Inteligente para a Biblioteca Dracônica

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input') || document.querySelector('.search-bar input');
    const searchBtn = document.getElementById('search-btn') || document.querySelector('.search-bar button');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const bookCards = document.querySelectorAll('.book-card');
    const catalogSection = document.querySelector('.catalog-section');
    const categoryHeaders = document.querySelectorAll('.category-header');
    const bookGrids = document.querySelectorAll('.book-grid');

    let currentSystem = 'Todos';
    let currentSearchTerm = '';

    // Cria elemento de feedback de contagem de livros encontrados
    const feedbackBox = document.createElement('div');
    feedbackBox.className = 'search-feedback';
    feedbackBox.style.cssText = 'text-align: center; margin: 15px 0 25px 0; font-size: 1.1rem; color: var(--accent-color, #facc15); font-weight: 600; min-height: 24px;';
    
    const filtersContainer = document.querySelector('.filters');
    if (filtersContainer && filtersContainer.parentNode) {
        filtersContainer.parentNode.insertBefore(feedbackBox, filtersContainer.nextSibling);
    }

    // Cria mensagem de "Nenhum livro encontrado"
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-search-state';
    emptyState.style.cssText = 'display: none; text-align: center; padding: 40px 20px; background: var(--card-bg, #1e1e24); border-radius: 8px; border: 1px dashed var(--accent-color, #facc15); margin: 30px auto; max-width: 600px;';
    emptyState.innerHTML = `
        <h3 style="color: var(--accent-color, #facc15); margin-bottom: 10px; font-size: 1.3rem;">🐉 Nenhum grimório encontrado</h3>
        <p style="color: var(--text-muted, #d1d5db); margin-bottom: 20px;">Não encontramos registros para os critérios informados nos arquivos dracônicos.</p>
        <button id="btn-reset-filters" style="background: var(--accent-color, #facc15); color: #000; font-weight: bold; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; transition: opacity 0.2s;">
            Limpar Busca e Filtros
        </button>
    `;
    if (catalogSection) {
        catalogSection.appendChild(emptyState);
    }

    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            currentSearchTerm = '';
            currentSystem = 'Todos';
            filterButtons.forEach(btn => {
                if (btn.textContent.trim().toLowerCase() === 'todos') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            aplicarFiltros();
        });
    }

    // Identifica e mapeia IDs dos cards estáticos para links com ?id=
    bookCards.forEach((card, index) => {
        const id = index + 1;
        card.setAttribute('data-id', id);

        // Ajusta o link de detalhes para incluir o ID
        const detailsBtn = card.querySelector('.btn-details');
        if (detailsBtn) {
            detailsBtn.href = `detalhes.html?id=${id}`;
        }

        // Extrai texto do sistema para facilitar busca
        const systemSpan = card.querySelector('.system');
        if (systemSpan) {
            card.setAttribute('data-system', systemSpan.textContent.trim());
        }
    });

    // Função principal de filtragem
    function aplicarFiltros() {
        const termo = currentSearchTerm.toLowerCase().trim();
        let totalVisiveis = 0;

        // Mapeia visibilidade de cada grid e cabeçalho de categoria
        bookGrids.forEach(grid => {
            const cardsNoGrid = grid.querySelectorAll('.book-card');
            let visiveisNoGrid = 0;

            cardsNoGrid.forEach(card => {
                const titulo = (card.querySelector('h3') ? card.querySelector('h3').textContent : '').toLowerCase();
                const descricao = (card.querySelector('p') ? card.querySelector('p').textContent : '').toLowerCase();
                const tag = (card.querySelector('.tag') ? card.querySelector('.tag').textContent : '').toLowerCase();
                const cardSistema = (card.getAttribute('data-system') || '').toLowerCase();

                // Verifica correspondência do sistema
                const matchesSystem = (currentSystem.toLowerCase() === 'todos') ||
                                      (cardSistema.includes(currentSystem.toLowerCase())) ||
                                      (currentSystem.toLowerCase().includes('d&d') && cardSistema.includes('d&d')) ||
                                      (currentSystem.toLowerCase().includes('tormenta') && cardSistema.includes('tormenta')) ||
                                      (currentSystem.toLowerCase().includes('fabula') && cardSistema.includes('fabula'));

                // Verifica correspondência do termo de busca
                const matchesSearch = !termo ||
                                      titulo.includes(termo) ||
                                      descricao.includes(termo) ||
                                      tag.includes(termo) ||
                                      cardSistema.includes(termo);

                if (matchesSystem && matchesSearch) {
                    card.style.display = '';
                    visiveisNoGrid++;
                    totalVisiveis++;
                } else {
                    card.style.display = 'none';
                }
            });

            // Encontra o cabeçalho correspondente a esse grid (o elemento anterior)
            let prevHeader = grid.previousElementSibling;
            while (prevHeader && !prevHeader.classList.contains('category-header')) {
                prevHeader = prevHeader.previousElementSibling;
            }

            if (prevHeader && prevHeader.classList.contains('category-header')) {
                prevHeader.style.display = visiveisNoGrid > 0 ? '' : 'none';
            }
        });

        // Atualiza feedback de texto
        if (termo || currentSystem !== 'Todos') {
            let msg = `Exibindo ${totalVisiveis} grimório(s)`;
            if (currentSystem !== 'Todos') msg += ` em [${currentSystem}]`;
            if (termo) msg += ` para "${termo}"`;
            feedbackBox.textContent = msg;
            feedbackBox.style.display = 'block';
        } else {
            feedbackBox.textContent = '';
            feedbackBox.style.display = 'none';
        }

        // Exibe estado vazio se nada foi encontrado
        if (totalVisiveis === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    }

    // Eventos dos botões de filtro
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSystem = btn.textContent.trim();
            aplicarFiltros();
        });
    });

    // Eventos do campo de busca e botão
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            aplicarFiltros();
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                currentSearchTerm = searchInput.value;
                aplicarFiltros();
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (searchInput) {
                currentSearchTerm = searchInput.value;
            }
            aplicarFiltros();
        });
    }

    // Tenta carregar estatísticas atualizadas da API Python se o servidor estiver rodando
    fetch('http://localhost:5000/api/livros')
        .then(res => res.json())
        .then(livrosApi => {
            if (Array.isArray(livrosApi)) {
                livrosApi.forEach(livro => {
                    const card = document.querySelector(`.book-card[data-id="${livro.id}"]`);
                    if (card && livro.media_nota > 0) {
                        let ratingSpan = card.querySelector('.book-rating-badge');
                        if (!ratingSpan) {
                            ratingSpan = document.createElement('div');
                            ratingSpan.className = 'book-rating-badge';
                            ratingSpan.style.cssText = 'color: #facc15; font-size: 0.9rem; font-weight: bold; margin-top: 6px;';
                            const infoBox = card.querySelector('.book-info');
                            if (infoBox) {
                                infoBox.insertBefore(ratingSpan, infoBox.querySelector('.btn-details'));
                            }
                        }
                        ratingSpan.textContent = `⭐ ${livro.media_nota} (${livro.total_avaliacoes} avaliações)`;
                    }
                });
            }
        })
        .catch(() => {
            // Se o backend não estiver rodando no momento, segue silenciosamente com os dados estáticos
        });
});

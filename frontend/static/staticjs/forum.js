// Arquivo: forum.js - Lógica do Fórum da Guilda com Avaliação e Comentários

document.addEventListener('DOMContentLoaded', () => {
    const topicosContainer = document.getElementById('topicosList');
    const filterButtons = document.querySelectorAll('.forum-filter-btn');
    const searchInput = document.getElementById('forum-search-input');
    
    // Modais
    const modalNovoTopico = document.getElementById('modalNovoTopico');
    const btnAbrirNovoTopico = document.getElementById('btnAbrirNovoTopico');
    const btnFecharNovoTopico = document.getElementById('btnFecharNovoTopico');
    const formNovoTopico = document.getElementById('formNovoTopico');

    const modalVerTopico = document.getElementById('modalVerTopico');
    const btnFecharVerTopico = document.getElementById('btnFecharVerTopico');
    const formComentarioTopico = document.getElementById('formComentarioTopico');

    let currentSystem = 'Todos';
    let currentSearch = '';
    let topicoAtivoId = null;

    // Tópicos iniciais padrão de fallback caso a API esteja offline
    const topicosPadrao = [
        {
            id: 1,
            titulo: "Dicas de criação de campanha para D&D 5E",
            autor: "Mestre das Sombras",
            sistema: "D&D 5E",
            conteudo: "Olá a todos os aventureiros! Estou iniciando uma campanha de nível 1 a 10 no cenário de Forgotten Realms. Quais ganchos de aventura vocês recomendam para engajar o grupo nos primeiros níveis?",
            media_avaliacao: 5.0,
            total_comentarios: 2,
            data_criacao: "2026-10-15T14:30:00Z",
            comentarios: [
                {
                    usuario: "Clérigo da Luz",
                    avaliacao: 5,
                    texto: "Recomendo começar com uma investigação na taverna local e pistas sobre uma mina abandonada cheia de kobolds. Funciona sempre!",
                    data_criacao: "2026-10-15T15:00:00Z"
                },
                {
                    usuario: "Ranger da Floresta",
                    avaliacao: 5,
                    texto: "Excelente tópico! Adicionar um rival recorrente logo nas primeiras sessões deixa os jogadores muito envolvidos.",
                    data_criacao: "2026-10-15T16:20:00Z"
                }
            ]
        },
        {
            id: 2,
            titulo: "Qual a classe mais divertida de jogar em Tormenta 20?",
            autor: "Ladino de Valkaria",
            sistema: "Tormenta 20",
            conteudo: "Estou montando meu personagem para a próxima sessão e queria saber a opinião da comunidade sobre qual classe oferece o gameplay mais dinâmico e divertido.",
            media_avaliacao: 4.5,
            total_comentarios: 2,
            data_criacao: "2026-10-16T11:00:00Z",
            comentarios: [
                {
                    usuario: "Bucaneiro Audaz",
                    avaliacao: 5,
                    texto: "O Bucaneiro é incrível! Muito estilo, audácia e habilidades com panache para quem curte manobras ousadas.",
                    data_criacao: "2026-10-16T11:45:00Z"
                },
                {
                    usuario: "Arcanista Artoniano",
                    avaliacao: 4,
                    texto: "O Arcanista Mago permite combinações absurdas de magias se você souber gerenciar seus pontos de mana.",
                    data_criacao: "2026-10-16T13:10:00Z"
                }
            ]
        },
        {
            id: 3,
            titulo: "Guia rápido de Fabula Ultima para iniciantes",
            autor: "Akira RPGista",
            sistema: "Fabula Ultima",
            conteudo: "Para quem vem de sistemas tradicionais como D&D, Fabula Ultima tem um foco muito mais narrativo e colaborativo. Montei esse tópico para trocarmos conselhos e debatermos regras!",
            media_avaliacao: 5.0,
            total_comentarios: 1,
            data_criacao: "2026-10-17T09:15:00Z",
            comentarios: [
                {
                    usuario: "Guerreira das Nuvens",
                    avaliacao: 5,
                    texto: "Muito bom! O sistema de Laços (Bonds) e os Pontos de Fábula tornam as sessões cinematográficas.",
                    data_criacao: "2026-10-17T10:00:00Z"
                }
            ]
        }
    ];

    // Carrega dados iniciais do LocalStorage se existirem
    function obterTopicosLocais() {
        const salvos = localStorage.getItem('draconica_forum_topicos');
        if (salvos) {
            try { return JSON.parse(salvos); } catch {}
        }
        localStorage.setItem('draconica_forum_topicos', JSON.stringify(topicosPadrao));
        return topicosPadrao;
    }

    function salvarTopicosLocais(topicos) {
        localStorage.setItem('draconica_forum_topicos', JSON.stringify(topicos));
    }

    // Carrega tópicos da API ou do LocalStorage
    async function carregarTopicos() {
        let topicos = [];
        try {
            const url = `http://localhost:5000/api/forum/topicos?sistema=${encodeURIComponent(currentSystem)}`;
            const res = await fetch(url);
            if (res.ok) {
                topicos = await res.json();
            } else {
                throw new Error();
            }
        } catch {
            const locais = obterTopicosLocais();
            topicos = locais.filter(t => {
                if (currentSystem !== 'Todos' && t.sistema.toLowerCase() !== currentSystem.toLowerCase()) {
                    return false;
                }
                return true;
            });
        }

        renderizarTopicos(topicos);
    }

    function renderizarTopicos(topicos) {
        const termo = currentSearch.toLowerCase().trim();
        const filtrados = topicos.filter(t => {
            if (!termo) return true;
            return t.titulo.toLowerCase().includes(termo) ||
                   t.conteudo.toLowerCase().includes(termo) ||
                   t.autor.toLowerCase().includes(termo) ||
                   (t.sistema && t.sistema.toLowerCase().includes(termo));
        });

        if (filtrados.length === 0) {
            topicosContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; background: var(--card-bg, #1e1e24); border-radius: 8px; border: 1px dashed var(--border-color, #333);">
                    <h3 style="color: var(--accent-color, #facc15); margin-bottom: 8px;">📜 Nenhum tópico encontrado</h3>
                    <p style="color: var(--text-muted, #a8a8b3);">Nenhum assunto corresponde aos filtros selecionados. Que tal iniciar a discussão?</p>
                </div>
            `;
            return;
        }

        topicosContainer.innerHTML = filtrados.map(t => {
            const estrelas = '★'.repeat(Math.round(t.media_avaliacao || 5)) + '☆'.repeat(5 - Math.round(t.media_avaliacao || 5));
            const dataFmt = t.data_criacao ? new Date(t.data_criacao).toLocaleDateString('pt-BR') : 'Recentemente';
            
            return `
                <article class="topico-card" onclick="window.abrirDiscussaoTopico(${t.id})">
                    <div class="topico-header">
                        <h3 class="topico-titulo">${escapeHtml(t.titulo)}</h3>
                        <span class="badge-sistema">${escapeHtml(t.sistema || 'Geral')}</span>
                    </div>
                    <div class="topico-meta">
                        <span>👤 <strong>${escapeHtml(t.autor)}</strong></span>
                        <span>📅 ${dataFmt}</span>
                    </div>
                    <p class="topico-resumo">${escapeHtml(t.conteudo.length > 200 ? t.conteudo.slice(0, 200) + '...' : t.conteudo)}</p>
                    <div class="topico-footer">
                        <div class="topico-stats">
                            <span title="Média de Avaliação" style="color: #ffda62;">⭐ ${t.media_avaliacao || 5.0} (${estrelas})</span>
                            <span title="Comentários" style="color: var(--text-muted, #a8a8b3);">💬 ${t.total_comentarios || 0} comentário${t.total_comentarios === 1 ? '' : 's'}</span>
                        </div>
                        <span style="color: var(--accent-color, #facc15); font-weight: bold;">Ver Discussão & Avaliar →</span>
                    </div>
                </article>
            `;
        }).join('');
    }

    // Filtros de Sistema
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSystem = btn.textContent.trim();
            carregarTopicos();
        });
    });

    // Busca de tópicos
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            carregarTopicos();
        });
    }

    // Modal Novo Tópico
    if (btnAbrirNovoTopico) {
        btnAbrirNovoTopico.addEventListener('click', () => {
            modalNovoTopico.style.display = 'flex';
        });
    }

    if (btnFecharNovoTopico) {
        btnFecharNovoTopico.addEventListener('click', () => {
            modalNovoTopico.style.display = 'none';
        });
    }

    if (formNovoTopico) {
        formNovoTopico.addEventListener('submit', async (e) => {
            e.preventDefault();

            const titulo = document.getElementById('novoTopicoTitulo').value.trim();
            const autor = document.getElementById('novoTopicoAutor').value.trim() || 'Bardo Viajante';
            const sistema = document.getElementById('novoTopicoSistema').value;
            const conteudo = document.getElementById('novoTopicoConteudo').value.trim();

            if (!titulo || !conteudo) {
                alert('Preencha o título e o conteúdo do tópico.');
                return;
            }

            const novoTopico = { titulo, autor, sistema, conteudo };

            try {
                const res = await fetch('http://localhost:5000/api/forum/topicos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoTopico)
                });
                if (res.ok) {
                    alert('✨ Seu tópico foi publicado com sucesso no fórum!');
                } else {
                    salvarTopicoLocal(novoTopico);
                    alert('✨ Seu tópico foi salvo no fórum!');
                }
            } catch {
                salvarTopicoLocal(novoTopico);
                alert('✨ Seu tópico foi salvo no fórum (Modo Local)!');
            }

            formNovoTopico.reset();
            modalNovoTopico.style.display = 'none';
            carregarTopicos();
        });
    }

    function salvarTopicoLocal(novo) {
        const locais = obterTopicosLocais();
        const id = Date.now();
        locais.unshift({
            id: id,
            ...novo,
            media_avaliacao: 5.0,
            total_comentarios: 0,
            data_criacao: new Date().toISOString(),
            comentarios: []
        });
        salvarTopicosLocais(locais);
    }

    // Visualizar Tópico e Comentar
    window.abrirDiscussaoTopico = async function(topicoId) {
        topicoAtivoId = topicoId;
        modalVerTopico.style.display = 'flex';

        // Preenche com placeholder de carregamento
        document.getElementById('verTopicoTitulo').textContent = 'Carregando...';
        document.getElementById('verTopicoConteudo').textContent = '';
        document.getElementById('listaComentariosTopico').innerHTML = '<p style="color:#7c7c8a;">Carregando respostas e avaliações...</p>';

        let topico = null;

        try {
            const res = await fetch(`http://localhost:5000/api/forum/topicos/${topicoId}`);
            if (res.ok) {
                topico = await res.json();
            } else {
                throw new Error();
            }
        } catch {
            const locais = obterTopicosLocais();
            topico = locais.find(t => t.id === topicoId);
        }

        if (!topico) {
            alert('Tópico não encontrado.');
            modalVerTopico.style.display = 'none';
            return;
        }

        document.getElementById('verTopicoTitulo').textContent = topico.titulo;
        document.getElementById('verTopicoSistema').textContent = topico.sistema || 'Geral';
        document.getElementById('verTopicoAutor').textContent = topico.autor || 'Bardo Viajante';
        document.getElementById('verTopicoData').textContent = topico.data_criacao ? new Date(topico.data_criacao).toLocaleDateString('pt-BR') : 'Recentemente';
        document.getElementById('verTopicoConteudo').textContent = topico.conteudo;

        const media = topico.media_avaliacao || 5.0;
        const total = topico.total_comentarios || (topico.comentarios ? topico.comentarios.length : 0);
        document.getElementById('verTopicoStats').textContent = `⭐ Média: ${media} (${total} comentários com avaliação)`;

        renderizarComentariosTopico(topico.comentarios || []);
    };

    function renderizarComentariosTopico(comentarios) {
        const container = document.getElementById('listaComentariosTopico');
        if (!comentarios || comentarios.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #7c7c8a; padding: 20px; border: 1px dashed #333; border-radius: 8px;">
                    📜 Ainda não há comentários neste tópico. Seja o primeiro a opinar e avaliar!
                </div>
            `;
            return;
        }

        container.innerHTML = comentarios.map(c => {
            const estrelas = '★'.repeat(c.avaliacao || 5) + '☆'.repeat(5 - (c.avaliacao || 5));
            const dataFmt = c.data_criacao ? new Date(c.data_criacao).toLocaleDateString('pt-BR') : 'Recentemente';
            return `
                <div class="comentario-item" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 14px; box-shadow: var(--shadow-sm);">
                    <div class="comentario-item-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong style="color: var(--accent-color);">👤 ${escapeHtml(c.usuario)}</strong>
                        <span style="color: var(--star-active); font-size: 1.1rem; letter-spacing: 2px;">${estrelas}</span>
                    </div>
                    <p style="color: var(--text-main); line-height: 1.5; margin: 8px 0;">${escapeHtml(c.texto)}</p>
                    <small style="color: var(--text-muted);">Postado em: ${dataFmt}</small>
                </div>
            `;
        }).join('');
    }

    if (btnFecharVerTopico) {
        btnFecharVerTopico.addEventListener('click', () => {
            modalVerTopico.style.display = 'none';
        });
    }

    // Fechar modais ao clicar no fundo
    window.addEventListener('click', (e) => {
        if (e.target === modalNovoTopico) modalNovoTopico.style.display = 'none';
        if (e.target === modalVerTopico) modalVerTopico.style.display = 'none';
    });

    // Seletor de estrelas para o comentário do fórum
    let avaliacaoComentario = 5;
    const forumStars = document.querySelectorAll('#forumStarPicker .star');
    forumStars.forEach(s => {
        s.addEventListener('click', () => {
            avaliacaoComentario = parseInt(s.getAttribute('data-value'));
            atualizarEstrelasComentario(avaliacaoComentario);
        });
    });

    function atualizarEstrelasComentario(valor) {
        forumStars.forEach(s => {
            const val = parseInt(s.getAttribute('data-value'));
            if (val <= valor) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
        const feedback = document.getElementById('forumStarFeedback');
        if (feedback) feedback.textContent = `${valor} estrela${valor > 1 ? 's' : ''}`;
    }

    // Formulário de novo comentário com avaliação
    if (formComentarioTopico) {
        formComentarioTopico.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!topicoAtivoId) return;

            const usuario = document.getElementById('comentarioUsuario').value.trim() || 'Aventureiro';
            const texto = document.getElementById('comentarioTexto').value.trim();

            if (!texto) {
                alert('Escreva seu comentário antes de enviar.');
                return;
            }

            const novoComentario = {
                usuario: usuario,
                texto: texto,
                avaliacao: avaliacaoComentario
            };

            const submitBtn = formComentarioTopico.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';
            }

            try {
                const res = await fetch(`http://localhost:5000/api/forum/topicos/${topicoAtivoId}/comentarios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoComentario)
                });

                if (res.ok) {
                    const data = await res.json();
                    renderizarComentariosTopico(data.comentarios);
                    alert('✨ Sua avaliação e comentário foram publicados no fórum!');
                } else {
                    adicionarComentarioLocal(topicoAtivoId, novoComentario);
                    alert('✨ Comentário publicado!');
                }
            } catch {
                adicionarComentarioLocal(topicoAtivoId, novoComentario);
                alert('✨ Comentário publicado com sucesso (Modo Local)!');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Publicar Comentário & Avaliação';
                }
                document.getElementById('comentarioTexto').value = '';
                carregarTopicos();
            }
        });
    }

    function adicionarComentarioLocal(topicoId, comentario) {
        const locais = obterTopicosLocais();
        const topico = locais.find(t => t.id === topicoId);
        if (topico) {
            if (!topico.comentarios) topico.comentarios = [];
            topico.comentarios.push({
                ...comentario,
                data_criacao: new Date().toISOString()
            });
            topico.total_comentarios = topico.comentarios.length;
            const soma = topico.comentarios.reduce((acc, c) => acc + c.avaliacao, 0);
            topico.media_avaliacao = (soma / topico.comentarios.length).toFixed(1);
            salvarTopicosLocais(locais);
            renderizarComentariosTopico(topico.comentarios);
            document.getElementById('verTopicoStats').textContent = `⭐ Média: ${topico.media_avaliacao} (${topico.total_comentarios} comentários com avaliação)`;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Inicialização
    atualizarEstrelasComentario(5);
    carregarTopicos();
});

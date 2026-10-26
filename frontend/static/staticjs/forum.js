// Arquivo: forum.js - Lógica do Fórum da Guilda com Avaliação, Comentários e Deduplicação Robusta

if (window._draconicaForumIniciado) {
    console.log("Forum já iniciado, ignorando reinvocação.");
} else {
    window._draconicaForumIniciado = true;

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
        let isSubmittingTopico = false;
        let isSubmittingComentario = false;

        // Tópicos iniciais padrão de fallback caso a API esteja offline
        const topicosPadrao = [
            {
                id: 101,
                titulo: "Dicas para mestrar Fabula Ultima e combates de chefes no estilo JRPG",
                autor: "Akira RPGista",
                sistema: "JJRPG",
                conteudo: "Olá aventureiros! Para quem está explorando o mundo dos JJRPGs de mesa, quais conselhos vocês dão para criar combates por turnos com chefes de várias fases e trilhas sonoras orquestradas?",
                media_avaliacao: 5.0,
                total_comentarios: 2,
                data_criacao: "2026-10-20T10:00:00Z",
                comentarios: [
                    {
                        usuario: "Chocobo Mestre",
                        avaliacao: 5,
                        texto: "Usar relógios de contagem (Clocks) e mudar a música quando o chefe entra na segunda fase deixa os jogadores de queixo caído! Funciona demais em Fabula Ultima.",
                        data_criacao: "2026-10-20T11:00:00Z"
                    }
                ]
            },
            {
                id: 102,
                titulo: "Sistemas de RPG no estilo Anime / JJRPG: Fabula Ultima vs Ryuutama",
                autor: "Otaku das Sombras",
                sistema: "JJRPG",
                conteudo: "Estou montando uma crônica inspirada em animes de aventura e queria saber a opinião do pessoal da guilda sobre as diferenças entre Fabula Ultima, Ryuutama e Kamigakari.",
                media_avaliacao: 5.0,
                total_comentarios: 1,
                data_criacao: "2026-10-21T14:30:00Z",
                comentarios: [
                    {
                        usuario: "Viajante Ryu",
                        avaliacao: 5,
                        texto: "Ryuutama é perfeito se você quer uma atmosfera relaxante de viagem tipo Studio Ghibli, enquanto Fabula Ultima brilha na fantasia épica de anime shonen!",
                        data_criacao: "2026-10-21T15:20:00Z"
                    }
                ]
            },
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

        // Deduplica lista de tópicos (evita duplicatas acidentais de duplo clique ou sessões passadas)
        function deduplicarTopicos(topicos) {
            const chavesVistas = new Set();
            const idsVistos = new Set();
            const unicos = [];

            for (const t of topicos) {
                // Chave única por id se existir
                if (t.id && idsVistos.has(t.id)) {
                    continue;
                }
                // Chave composta por título + autor + sistema + conteúdo
                const conteudoLimpo = (t.conteudo || '').trim().toLowerCase().slice(0, 150);
                const chaveConteudo = `${(t.titulo || '').trim().toLowerCase()}|||${(t.autor || '').trim().toLowerCase()}|||${(t.sistema || '').trim().toLowerCase()}|||${conteudoLimpo}`;
                
                if (chavesVistas.has(chaveConteudo)) {
                    continue; // Pula duplicata exata
                }

                if (t.id) idsVistos.add(t.id);
                chavesVistas.add(chaveConteudo);
                unicos.push(t);
            }
            return unicos;
        }

        // Carrega dados iniciais do LocalStorage se existirem e limpa duplicatas
        function obterTopicosLocais() {
            const salvos = localStorage.getItem('draconica_forum_topicos');
            if (salvos) {
                try {
                    const parsed = JSON.parse(salvos);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const limpos = deduplicarTopicos(parsed);
                        if (limpos.length !== parsed.length) {
                            localStorage.setItem('draconica_forum_topicos', JSON.stringify(limpos));
                        }
                        return limpos;
                    }
                } catch {}
            }
            localStorage.setItem('draconica_forum_topicos', JSON.stringify(topicosPadrao));
            return topicosPadrao;
        }

        function salvarTopicosLocais(topicos) {
            const limpos = deduplicarTopicos(topicos);
            localStorage.setItem('draconica_forum_topicos', JSON.stringify(limpos));
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
                    throw new Error('API indisponível');
                }
            } catch {
                const locais = obterTopicosLocais();
                const sistLimpo = currentSystem.replace(/[^\w\s&]/gi, '').trim().toLowerCase();
                topicos = locais.filter(t => {
                    if (sistLimpo === 'todos') return true;
                    if (sistLimpo === 'jjrpg' || sistLimpo === 'jrpg') {
                        return (t.sistema && (t.sistema.toLowerCase() === 'jjrpg' || t.sistema.toLowerCase().includes('fabula') || t.sistema.toLowerCase().includes('ryuutama'))) ||
                               (t.titulo && (t.titulo.toLowerCase().includes('jjrpg') || t.titulo.toLowerCase().includes('jrpg')));
                    }
                    if (currentSystem !== 'Todos' && t.sistema.toLowerCase() !== currentSystem.toLowerCase()) {
                        return false;
                    }
                    return true;
                });
            }

            // Garante deduplicação na renderização
            const topicosValidos = deduplicarTopicos(topicos);
            renderizarTopicos(topicosValidos);
        }

        function renderizarTopicos(topicos) {
            if (!topicosContainer) return;

            const termo = currentSearch.toLowerCase().trim();
            const filtrados = topicos.filter(t => {
                if (!termo) return true;
                return (t.titulo && t.titulo.toLowerCase().includes(termo)) ||
                       (t.conteudo && t.conteudo.toLowerCase().includes(termo)) ||
                       (t.autor && t.autor.toLowerCase().includes(termo)) ||
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

            const usuarioAtual = typeof Auth !== 'undefined' ? Auth.getUsuario() : null;

            topicosContainer.innerHTML = filtrados.map(t => {
                const estrelas = '★'.repeat(Math.round(t.media_avaliacao || 5)) + '☆'.repeat(5 - Math.round(t.media_avaliacao || 5));
                const dataFmt = t.data_criacao ? new Date(t.data_criacao).toLocaleDateString('pt-BR') : 'Recentemente';
                
                // Botão de excluir visível se o usuário for o autor ou mestre
                const podeExcluir = usuarioAtual && (usuarioAtual.nome === t.autor || usuarioAtual.email === 'mestre@draconica.com');
                const btnExcluirHtml = podeExcluir ? `
                    <button type="button" onclick="window.excluirTopico(event, ${t.id})" 
                            style="background: transparent; border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444; border-radius: 6px; padding: 4px 10px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;" 
                            title="Excluir este tópico da guilda">
                        🗑️ Excluir
                    </button>
                ` : '';

                return `
                    <article class="topico-card" onclick="window.abrirDiscussaoTopico(${t.id})">
                        <div class="topico-header">
                            <h3 class="topico-titulo">${escapeHtml(t.titulo)}</h3>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span class="badge-sistema">${escapeHtml(t.sistema || 'Geral')}</span>
                                ${btnExcluirHtml}
                            </div>
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

        // Excluir tópico (limpa da API e do LocalStorage)
        window.excluirTopico = async function(event, topicoId) {
            if (event) event.stopPropagation();

            if (!confirm('📜 Deseja realmente remover este tópico do fórum?')) {
                return;
            }

            try {
                await fetch(`http://localhost:5000/api/forum/topicos/${topicoId}`, {
                    method: 'DELETE'
                });
            } catch (err) {
                console.log('Modo local ou erro na exclusão da API:', err);
            }

            // Remove do localStorage também
            const locais = obterTopicosLocais();
            const atualizados = locais.filter(t => t.id !== topicoId);
            salvarTopicosLocais(atualizados);

            alert('✨ Tópico removido com sucesso!');
            carregarTopicos();
        };

        // Filtros de Sistema
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Remove emojis para passar para a API ou filtro de forma limpa
                currentSystem = btn.textContent.replace(/[^\w\s&]/gi, '').trim() || 'Todos';
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
                // Preenche autor se estiver logado
                if (typeof Auth !== 'undefined') {
                    const u = Auth.getUsuario();
                    const autorEl = document.getElementById('novoTopicoAutor');
                    if (u && autorEl) autorEl.value = u.nome;
                }
            });
        }

        if (btnFecharNovoTopico) {
            btnFecharNovoTopico.addEventListener('click', () => {
                modalNovoTopico.style.display = 'none';
            });
        }

        // Formulário de Criação de Tópico com proteção contra duplicação
        if (formNovoTopico) {
            formNovoTopico.addEventListener('submit', async (e) => {
                e.preventDefault();

                if (isSubmittingTopico) return; // Evita envio duplo / clique repetido

                const titulo = document.getElementById('novoTopicoTitulo').value.trim();
                const autor = document.getElementById('novoTopicoAutor').value.trim() || 'Bardo Viajante';
                const sistema = document.getElementById('novoTopicoSistema').value;
                const conteudo = document.getElementById('novoTopicoConteudo').value.trim();

                if (!titulo || !conteudo) {
                    alert('Preencha o título e o conteúdo do tópico.');
                    return;
                }

                isSubmittingTopico = true;
                const submitBtn = formNovoTopico.querySelector('button[type="submit"]');
                const textoOriginal = submitBtn ? submitBtn.textContent : 'Publicar Tópico';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Gravando nos anais da guilda...';
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
                } finally {
                    isSubmittingTopico = false;
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = textoOriginal;
                    }
                    formNovoTopico.reset();
                    modalNovoTopico.style.display = 'none';
                    carregarTopicos();
                }
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

            document.getElementById('verTopicoTitulo').textContent = 'Carregando...';
            document.getElementById('verTopicoConteudo').textContent = '';
            document.getElementById('listaComentariosTopico').innerHTML = '<p style="color:#7c7c8a;">Carregando respostas e avaliações...</p>';

            // Preenche nome do usuário se logado
            if (typeof Auth !== 'undefined') {
                const u = Auth.getUsuario();
                const usuarioEl = document.getElementById('comentarioUsuario');
                if (u && usuarioEl) usuarioEl.value = u.nome;
            }

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
            if (!container) return;

            if (!comentarios || comentarios.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; color: #7c7c8a; padding: 20px; border: 1px dashed var(--border-color, #333); border-radius: 8px;">
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

                if (isSubmittingComentario) return;
                if (!topicoAtivoId) return;

                const usuario = document.getElementById('comentarioUsuario').value.trim() || 'Aventureiro';
                const texto = document.getElementById('comentarioTexto').value.trim();

                if (!texto) {
                    alert('Escreva seu comentário antes de enviar.');
                    return;
                }

                isSubmittingComentario = true;
                const submitBtn = formComentarioTopico.querySelector('button[type="submit"]');
                const textoBtnOriginal = submitBtn ? submitBtn.textContent : 'Publicar Comentário';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Enviando resenha...';
                }

                const novoComentario = {
                    usuario: usuario,
                    texto: texto,
                    avaliacao: avaliacaoComentario
                };

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
                    isSubmittingComentario = false;
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = textoBtnOriginal;
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
                const statsEl = document.getElementById('verTopicoStats');
                if (statsEl) {
                    statsEl.textContent = `⭐ Média: ${topico.media_avaliacao} (${topico.total_comentarios} comentários com avaliação)`;
                }
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
}

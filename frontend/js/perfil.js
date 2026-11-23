// Arquivo: perfil.js - Gerenciamento, Personalização e Submissão de RPGs da Comunidade

document.addEventListener('DOMContentLoaded', async () => {
    const usuarioAtual = Auth.getUsuario();

    const perfilNaoLogado = document.getElementById('perfilNaoLogado');
    const perfilLogado = document.getElementById('perfilLogado');

    if (!usuarioAtual) {
        if (perfilNaoLogado) perfilNaoLogado.style.display = 'block';
        if (perfilLogado) perfilLogado.style.display = 'none';
        return;
    }

    if (perfilNaoLogado) perfilNaoLogado.style.display = 'none';
    if (perfilLogado) perfilLogado.style.display = 'block';

    // Elementos da Interface do Perfil
    const elAvatarDisplay = document.getElementById('perfilAvatarDisplay');
    const elNomeDisplay = document.getElementById('perfilNomeDisplay');
    const elEmailDisplay = document.getElementById('perfilEmailDisplay');
    const elStatusDisplay = document.getElementById('perfilStatusDisplay');
    const elBioDisplay = document.getElementById('perfilBioDisplay');

    // Abas de Atividades
    const tabBtns = document.querySelectorAll('.perfil-tab-btn');
    const tabContents = document.querySelectorAll('.perfil-tab-content');
    const tabCountCriados = document.getElementById('tabCountCriados');
    const tabCountRespondidos = document.getElementById('tabCountRespondidos');
    const tabCountAvaliacoes = document.getElementById('tabCountAvaliacoes');
    const tabCountRPGs = document.getElementById('tabCountRPGs');
    const tabCountPendentes = document.getElementById('tabCountPendentes');
    const tabBtnModeracao = document.getElementById('tabBtnModeracao');

    const listaTopicosCriados = document.getElementById('listaTopicosCriados');
    const listaTopicosRespondidos = document.getElementById('listaTopicosRespondidos');
    const listaMinhasAvaliacoes = document.getElementById('listaMinhasAvaliacoes');
    const listaMeusRPGs = document.getElementById('listaMeusRPGs');
    const listaModeracaoRPGs = document.getElementById('listaModeracaoRPGs');

    // Modal de Edição de Perfil
    const modalEditar = document.getElementById('modalEditarPerfil');
    const btnAbrirEditar = document.getElementById('btnAbrirEditarPerfil');
    const btnFecharEditar = document.getElementById('btnFecharEditarPerfil');
    const formEditarPerfil = document.getElementById('formEditarPerfil');
    const inputEditNome = document.getElementById('editNome');
    const inputEditBio = document.getElementById('editBio');
    const uploadInput = document.getElementById('uploadAvatarInput');
    const uploadArea = document.getElementById('uploadAvatarArea');
    const uploadPreview = document.getElementById('uploadPreview');
    const editFeedback = document.getElementById('editFeedback');

    // Modal de Submissão de RPG
    const modalSubmeter = document.getElementById('modalSubmeterRPG');
    const btnAbrirSubmeter = document.getElementById('btnAbrirSubmeterRPG');
    const btnFecharSubmeter = document.getElementById('btnFecharSubmeterRPG');
    const formSubmeter = document.getElementById('formSubmeterRPG');
    const submeterFeedback = document.getElementById('submeterFeedback');
    const inputSubAutor = document.getElementById('subAutor');

    let avatarSelecionado = usuarioAtual.avatar || '🧙‍♂️';

    // Rótulos para o Status de Campanha
    const rotulosStatus = {
        'procurando_campanha': {
            texto: '🛡️ Procurando Campanha',
            classe: 'status-procurando_campanha',
            descricao: 'Jogador em busca de uma mesa ou mestre'
        },
        'procurando_jogadores': {
            texto: '📜 Procurando Jogadores',
            classe: 'status-procurando_jogadores',
            descricao: 'Mestre recrutando aventureiros para uma crônica'
        },
        'em_campanha': {
            texto: '⚔️ Em Campanha',
            classe: 'status-em_campanha',
            descricao: 'Aventureiro em jornada ativa'
        }
    };

    function renderizarDadosPerfil(u) {
        if (!u) return;

        // Avatar
        if (elAvatarDisplay) {
            const isImagem = u.avatar && (u.avatar.startsWith('data:image') || u.avatar.startsWith('http') || u.avatar.includes('/'));
            if (isImagem) {
                elAvatarDisplay.innerHTML = `<img src="${u.avatar}" alt="${escapeHtml(u.nome)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                elAvatarDisplay.innerHTML = `<span style="font-size: 4rem; line-height: 1;">${u.avatar || '🧙‍♂️'}</span>`;
            }
        }

        // Nome e Email
        if (elNomeDisplay) elNomeDisplay.textContent = u.nome;
        if (elEmailDisplay) elEmailDisplay.textContent = u.email || 'Aventureiro da Guilda';

        // Status de Campanha
        if (elStatusDisplay) {
            const statusKey = u.status_jogo || 'procurando_campanha';
            const infoStatus = rotulosStatus[statusKey] || rotulosStatus['procurando_campanha'];
            elStatusDisplay.className = `status-badge ${infoStatus.classe}`;
            elStatusDisplay.innerHTML = `${infoStatus.texto} <span style="font-size: 0.75rem; opacity: 0.8; margin-left: 4px;">▼</span>`;
            elStatusDisplay.title = `${infoStatus.descricao} (Clique para alterar status)`;
        }

        // Biografia
        if (elBioDisplay) {
            if (u.bio && u.bio.trim()) {
                elBioDisplay.textContent = u.bio;
                elBioDisplay.style.fontStyle = 'normal';
                elBioDisplay.style.opacity = '1';
            } else {
                elBioDisplay.textContent = '📜 Este aventureiro ainda não escreveu sua história. Clique em "Personalizar Perfil" para adicionar sua biografia, classe favorita ou anotações!';
                elBioDisplay.style.fontStyle = 'italic';
                elBioDisplay.style.opacity = '0.75';
            }
        }

        // Se for administrador, exibe a aba de moderação
        const ehAdmin = u.is_admin || (u.email && u.email.toLowerCase() === 'mestre@draconica.com');
        if (tabBtnModeracao && ehAdmin) {
            tabBtnModeracao.style.display = 'inline-flex';
            carregarModeracao();
        }
    }

    // Carrega e renderiza atividades (tópicos e avaliações)
    async function carregarAtividades() {
        const u = Auth.getUsuario();
        if (!u) return;

        const atividades = await Auth.obterAtividades(u.nome);

        // 1. Tópicos Criados
        const criados = atividades.topicos_criados || [];
        if (tabCountCriados) tabCountCriados.textContent = criados.length;
        if (listaTopicosCriados) {
            if (criados.length === 0) {
                listaTopicosCriados.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: var(--card-bg); border-radius: 8px; border: 1px dashed var(--border-color);">
                        <h4 style="color: var(--accent-color); margin-bottom: 8px;">📜 Nenhum tópico criado ainda</h4>
                        <p style="color: var(--text-muted); margin-bottom: 16px;">Você ainda não iniciou nenhuma discussão na Taverna da guilda.</p>
                        <a href="forum.html" class="btn-destaque-perfil" style="text-decoration: none;">⚔️ Criar Tópico no Fórum</a>
                    </div>
                `;
            } else {
                listaTopicosCriados.innerHTML = criados.map(t => {
                    const dataFmt = t.data_criacao ? new Date(t.data_criacao).toLocaleDateString('pt-BR') : 'Recentemente';
                    const estrelas = '★'.repeat(Math.round(t.media_avaliacao || 5));
                    return `
                        <article class="atividade-card">
                            <div class="atividade-header">
                                <h3 class="atividade-titulo">${escapeHtml(t.titulo)}</h3>
                                <span class="badge-sistema">${escapeHtml(t.sistema || 'Geral')}</span>
                            </div>
                            <div class="atividade-meta">
                                <span>📅 Postado em ${dataFmt}</span>
                                <span>⭐ Avaliação: ${t.media_avaliacao || 5.0} (${estrelas})</span>
                                <span>💬 ${t.total_comentarios || 0} respostas</span>
                            </div>
                            <div style="margin-top: 10px;">
                                <a href="forum.html?topico=${t.id}" class="btn-editar-perfil" style="text-decoration: none; font-size: 0.9rem; padding: 6px 14px;">
                                    Ver Discussão &rarr;
                                </a>
                            </div>
                        </article>
                    `;
                }).join('');
            }
        }

        // 2. Tópicos Respondidos
        const respondidos = atividades.topicos_respondidos || [];
        if (tabCountRespondidos) tabCountRespondidos.textContent = respondidos.length;
        if (listaTopicosRespondidos) {
            if (respondidos.length === 0) {
                listaTopicosRespondidos.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: var(--card-bg); border-radius: 8px; border: 1px dashed var(--border-color);">
                        <h4 style="color: var(--accent-color); margin-bottom: 8px;">💬 Nenhuma resposta ainda</h4>
                        <p style="color: var(--text-muted); margin-bottom: 16px;">Participe das mesas e discussões criadas por outros aventureiros!</p>
                        <a href="forum.html" class="btn-destaque-perfil" style="text-decoration: none;">⚔️ Explorar Fórum da Taverna</a>
                    </div>
                `;
            } else {
                listaTopicosRespondidos.innerHTML = respondidos.map(t => {
                    return `
                        <article class="atividade-card">
                            <div class="atividade-header">
                                <h3 class="atividade-titulo">${escapeHtml(t.titulo)}</h3>
                                <span class="badge-sistema">${escapeHtml(t.sistema || 'Geral')}</span>
                            </div>
                            <div class="atividade-meta">
                                <span>👤 Criado por: <strong>${escapeHtml(t.autor || 'Desconhecido')}</strong></span>
                                <span>💬 ${t.total_comentarios || 0} respostas na conversa</span>
                            </div>
                            <div style="margin-top: 10px;">
                                <a href="forum.html?topico=${t.id}" class="btn-editar-perfil" style="text-decoration: none; font-size: 0.9rem; padding: 6px 14px;">
                                    Abrir Discussão &rarr;
                                </a>
                            </div>
                        </article>
                    `;
                }).join('');
            }
        }

        // 3. Avaliações em Livros
        const avals = atividades.avaliacoes || [];
        if (tabCountAvaliacoes) tabCountAvaliacoes.textContent = avals.length;
        if (listaMinhasAvaliacoes) {
            if (avals.length === 0) {
                listaMinhasAvaliacoes.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: var(--card-bg); border-radius: 8px; border: 1px dashed var(--border-color);">
                        <h4 style="color: var(--accent-color); margin-bottom: 8px;">⭐ Nenhuma avaliação enviada</h4>
                        <p style="color: var(--text-muted); margin-bottom: 16px;">Você ainda não avaliou nenhum livro do acervo da Biblioteca Dracônica.</p>
                        <a href="index.html" class="btn-destaque-perfil" style="text-decoration: none;">📚 Explorar Catálogo</a>
                    </div>
                `;
            } else {
                listaMinhasAvaliacoes.innerHTML = avals.map(a => {
                    const dataFmt = a.data_criacao ? new Date(a.data_criacao).toLocaleDateString('pt-BR') : 'Recentemente';
                    const estrelas = '★'.repeat(a.nota) + '☆'.repeat(5 - a.nota);
                    return `
                        <article class="atividade-card" style="display: flex; gap: 15px; align-items: flex-start;">
                            <img src="${a.livro_capa || '../imagens/capas/livro_1.svg'}" alt="${escapeHtml(a.livro_titulo)}" style="width: 55px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color); flex-shrink: 0;">
                            <div style="flex: 1;">
                                <div class="atividade-header">
                                    <h3 class="atividade-titulo">${escapeHtml(a.livro_titulo || 'Livro da Biblioteca')}</h3>
                                    <span class="badge-sistema">${escapeHtml(a.livro_sistema || 'RPG')}</span>
                                </div>
                                <div class="atividade-meta">
                                    <span style="color: var(--accent-color); font-size: 1.1rem; letter-spacing: 2px;">${estrelas}</span>
                                    <span>📅 Avaliado em ${dataFmt}</span>
                                </div>
                                ${a.comentario ? `<p style="margin: 8px 0 0; color: var(--text-main); font-style: italic; font-size: 0.95rem;">"${escapeHtml(a.comentario)}"</p>` : ''}
                                <div style="margin-top: 10px;">
                                    <a href="detalhes.html?id=${a.livro_id}" class="btn-editar-perfil" style="text-decoration: none; font-size: 0.85rem; padding: 4px 10px;">
                                        Ver Grimório &rarr;
                                    </a>
                                </div>
                            </div>
                        </article>
                    `;
                }).join('');
            }
        }
    }

    // ================= CARREGAR SUBMISSÕES DE RPGS DO USUÁRIO =================
    async function carregarMeusRPGs() {
        const u = Auth.getUsuario();
        if (!u || !listaMeusRPGs) return;

        try {
            const res = await fetch(`${(window.location.origin && window.location.origin.startsWith('http') ? '' : 'http://localhost:5000')}/api/livros/submissoes?usuario_id=${u.id}`);
            if (res.ok) {
                const submissoes = await res.json();
                if (tabCountRPGs) tabCountRPGs.textContent = submissoes.length;

                if (submissoes.length === 0) {
                    listaMeusRPGs.innerHTML = `
                        <div style="text-align: center; padding: 40px; background: var(--card-bg); border-radius: 12px; border: 1px dashed var(--border-color);">
                            <div style="font-size: 3rem; margin-bottom: 10px;">🎲</div>
                            <h4 style="color: var(--accent-color); margin-bottom: 8px;">Nenhum RPG ou Conteúdo de Fã submetido ainda</h4>
                            <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto 20px;">
                                Você criou um sistema próprio, suplemento ou homebrew? Envie para a moderação da guilda e compartilhe com todos os aventureiros!
                            </p>
                            <button type="button" class="btn-destaque-perfil" onclick="document.getElementById('btnAbrirSubmeterRPG').click()">
                                📤 Enviar Meu Primeiro RPG
                            </button>
                        </div>
                    `;
                    return;
                }

                listaMeusRPGs.innerHTML = submissoes.map(s => {
                    const statusInfo = {
                        'pendente': { texto: '⏳ Em Análise pelos Administradores', classe: 'pendente' },
                        'aprovado': { texto: '✅ Aprovado na Biblioteca', classe: 'aprovado' },
                        'rejeitado': { texto: '❌ Rejeitado pela Moderação', classe: 'rejeitado' }
                    }[s.status_aprovacao] || { texto: s.status_aprovacao, classe: 'pendente' };

                    return `
                        <div class="submissao-card">
                            <img src="${s.capa_url || '../imagens/capas/livro_1.svg'}" class="submissao-capa-thumb" alt="${escapeHtml(s.titulo)}">
                            <div class="submissao-info">
                                <div class="submissao-header">
                                    <h4 class="submissao-titulo">${escapeHtml(s.titulo)}</h4>
                                    <span class="status-submissao-badge ${statusInfo.classe}">${statusInfo.texto}</span>
                                </div>
                                <div class="submissao-meta">
                                    <span>👤 <strong>${escapeHtml(s.autor)}</strong></span>
                                    <span>⚔️ Sistema: <strong>${escapeHtml(s.sistema)}</strong></span>
                                    <span>📂 Categoria: <strong>${escapeHtml(s.categoria)}</strong></span>
                                    <span>📅 Submetido em ${s.data_criacao || 'Recentemente'}</span>
                                </div>
                                <p class="submissao-sinopse">${escapeHtml(s.sinopse)}</p>
                                ${s.motivo_rejeicao ? `
                                    <div class="submissao-motivo-rejeicao">
                                        <strong>Motivo da Recusa:</strong> ${escapeHtml(s.motivo_rejeicao)}
                                    </div>
                                ` : ''}
                                <div class="submissao-acoes">
                                    ${s.status_aprovacao === 'aprovado' ? `
                                        <a href="detalhes.html?id=${s.id}" class="btn-acao-moderacao btn-acao-download">
                                            📖 Ver no Catálogo Oficial
                                        </a>
                                    ` : ''}
                                    ${s.arquivo_url ? `
                                        <a href="${s.arquivo_url}" target="_blank" download class="btn-acao-moderacao btn-acao-download">
                                            📥 Baixar Arquivo Enviado
                                        </a>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } catch {
            if (listaMeusRPGs) listaMeusRPGs.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Não foi possível carregar as submissões no momento.</p>';
        }
    }

    // ================= CARREGAR PAINEL DE MODERAÇÃO (ADMINISTRADORES) =================
    async function carregarModeracao() {
        const u = Auth.getUsuario();
        if (!u || !listaModeracaoRPGs) return;

        try {
            const res = await fetch(`${(window.location.origin && window.location.origin.startsWith('http') ? '' : 'http://localhost:5000')}/api/livros/submissoes?apenas_pendentes=true&admin_id=${u.id}`);
            if (res.ok) {
                const pendentes = await res.json();
                if (tabCountPendentes) tabCountPendentes.textContent = pendentes.length;

                if (pendentes.length === 0) {
                    listaModeracaoRPGs.innerHTML = `
                        <div style="text-align: center; padding: 40px; background: var(--card-bg); border-radius: 12px; border: 1px dashed var(--border-color);">
                            <div style="font-size: 3rem; margin-bottom: 10px;">🛡️✨</div>
                            <h4 style="color: var(--accent-color); margin-bottom: 8px;">Nenhuma submissão pendente de moderação</h4>
                            <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto;">
                                Todas as obras e conteúdos de fãs enviados pela comunidade já foram revisados pelos administradores da guilda!
                            </p>
                        </div>
                    `;
                    return;
                }

                listaModeracaoRPGs.innerHTML = pendentes.map(p => `
                    <div class="submissao-card" id="card-moderacao-${p.id}">
                        <img src="${p.capa_url || '../imagens/capas/livro_1.svg'}" class="submissao-capa-thumb" alt="${escapeHtml(p.titulo)}">
                        <div class="submissao-info">
                            <div class="submissao-header">
                                <h4 class="submissao-titulo">${escapeHtml(p.titulo)}</h4>
                                <span class="status-submissao-badge pendente">⏳ Aguardando Decisão</span>
                            </div>
                            <div class="submissao-meta">
                                <span>👤 Autor: <strong>${escapeHtml(p.autor)}</strong></span>
                                <span>🛡️ Enviado por: <strong>${escapeHtml(p.usuario_submissao_nome || 'Aventureiro')}</strong></span>
                                <span>⚔️ Sistema: <strong>${escapeHtml(p.sistema)}</strong></span>
                                <span>📂 Categoria: <strong>${escapeHtml(p.categoria)}</strong></span>
                            </div>
                            <p class="submissao-sinopse">${escapeHtml(p.sinopse)}</p>
                            <div class="submissao-acoes">
                                ${p.arquivo_url ? `
                                    <a href="${p.arquivo_url}" target="_blank" download class="btn-acao-moderacao btn-acao-download">
                                        📄 Inspecionar Arquivo / PDF
                                    </a>
                                ` : ''}
                                <button type="button" class="btn-acao-moderacao btn-acao-aprovar" onclick="moderarSubmissao(${p.id}, 'aprovar')">
                                    ✅ Aprovar para o Catálogo
                                </button>
                                <button type="button" class="btn-acao-moderacao btn-acao-rejeitar" onclick="moderarSubmissao(${p.id}, 'rejeitar')">
                                    ❌ Recusar
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        } catch {
            if (listaModeracaoRPGs) listaModeracaoRPGs.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Erro ao carregar lista de moderação.</p>';
        }
    }

    // Função global de moderação
    window.moderarSubmissao = async (livroId, acao) => {
        let motivo = '';
        if (acao === 'rejeitar') {
            motivo = prompt('Informe a justificativa da recusa (aceitamos apenas conteúdos de fã ou RPGs próprios):');
            if (motivo === null) return; // cancelou
        }

        try {
            const u = Auth.getUsuario();
            const res = await fetch(`${(window.location.origin && window.location.origin.startsWith('http') ? '' : 'http://localhost:5000')}/api/livros/${livroId}/moderar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acao, motivo, admin_id: u?.id })
            });

            if (res.ok) {
                const dados = await res.json();
                alert(dados.mensagem);
                carregarModeracao();
                carregarMeusRPGs();
            } else {
                alert('Erro ao processar moderação.');
            }
        } catch {
            alert('Falha na conexão com o servidor.');
        }
    };

    // ================= CONTROLE DAS ABAS DE ATIVIDADES =================
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    // ================= MODAL: SUBMETER RPG PRÓPRIO / HOMEBREW =================
    if (btnAbrirSubmeter && modalSubmeter) {
        btnAbrirSubmeter.addEventListener('click', () => {
            modalSubmeter.style.display = 'flex';
            if (inputSubAutor && !inputSubAutor.value && usuarioAtual) {
                inputSubAutor.value = usuarioAtual.nome;
            }
        });
    }

    if (btnFecharSubmeter && modalSubmeter) {
        btnFecharSubmeter.addEventListener('click', () => {
            modalSubmeter.style.display = 'none';
        });
    }

    // Submissão do Formulário de RPG
    if (formSubmeter) {
        formSubmeter.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (submeterFeedback) {
                submeterFeedback.textContent = 'Enviando seu material para a moderação da guilda...';
                submeterFeedback.style.display = 'block';
                submeterFeedback.style.background = 'rgba(234, 179, 8, 0.15)';
                submeterFeedback.style.color = '#eab308';
                submeterFeedback.style.border = '1px solid #eab308';
            }

            const formData = new FormData(formSubmeter);
            formData.append('usuario_id', usuarioAtual.id);

            try {
                const res = await fetch('${(window.location.origin && window.location.origin.startsWith('http') ? '' : 'http://localhost:5000')}/api/livros/submeter', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();

                if (res.ok) {
                    if (submeterFeedback) {
                        submeterFeedback.textContent = '✨ ' + (data.mensagem || 'RPG enviado com sucesso!');
                        submeterFeedback.style.background = 'rgba(34, 197, 94, 0.15)';
                        submeterFeedback.style.color = '#22c55e';
                        submeterFeedback.style.border = '1px solid #22c55e';
                    }

                    formSubmeter.reset();
                    setTimeout(() => {
                        modalSubmeter.style.display = 'none';
                        if (submeterFeedback) submeterFeedback.style.display = 'none';
                        carregarMeusRPGs();
                        // Seleciona a aba de Meus RPGs
                        const tabRPG = document.querySelector('[data-target="abaMeusRPGs"]');
                        if (tabRPG) tabRPG.click();
                    }, 1400);
                } else {
                    if (submeterFeedback) {
                        submeterFeedback.textContent = data.erro || 'Erro ao enviar o material.';
                        submeterFeedback.style.background = 'rgba(239, 68, 68, 0.15)';
                        submeterFeedback.style.color = '#ef4444';
                        submeterFeedback.style.border = '1px solid #ef4444';
                    }
                }
            } catch {
                if (submeterFeedback) {
                    submeterFeedback.textContent = 'Falha de comunicação com o servidor Django.';
                    submeterFeedback.style.background = 'rgba(239, 68, 68, 0.15)';
                    submeterFeedback.style.color = '#ef4444';
                }
            }
        });
    }

    // ================= MODAL: EDITAR PERFIL =================
    if (btnAbrirEditar && modalEditar) {
        btnAbrirEditar.addEventListener('click', () => {
            const u = Auth.getUsuario() || usuarioAtual;
            if (inputEditNome) inputEditNome.value = u.nome || '';
            if (inputEditBio) inputEditBio.value = u.bio || '';
            const selectStatus = document.getElementById('editStatusJogo');
            if (selectStatus) selectStatus.value = u.status_jogo || 'procurando_campanha';

            avatarSelecionado = u.avatar || '🧙‍♂️';
            document.querySelectorAll('.avatar-option-btn').forEach(btn => {
                if (btn.getAttribute('data-avatar') === avatarSelecionado) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });

            if (editFeedback) editFeedback.style.display = 'none';
            modalEditar.style.display = 'flex';
        });
    }

    if (btnFecharEditar && modalEditar) {
        btnFecharEditar.addEventListener('click', () => {
            modalEditar.style.display = 'none';
        });
    }

    // Seleção de Avatar por Ícone
    document.querySelectorAll('.avatar-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.avatar-option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            avatarSelecionado = btn.getAttribute('data-avatar');
            if (uploadPreview) uploadPreview.style.display = 'none';
        });
    });

    // Upload de Avatar por Imagem do Computador
    if (uploadArea && uploadInput) {
        uploadArea.addEventListener('click', () => uploadInput.click());

        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                alert('A imagem é muito grande! Escolha um arquivo de no máximo 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (ev) => {
                avatarSelecionado = ev.target.result;
                document.querySelectorAll('.avatar-option-btn').forEach(b => b.classList.remove('selected'));

                if (uploadPreview) {
                    uploadPreview.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 10px; justify-content: center;">
                            <img src="${avatarSelecionado}" alt="Preview" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-color);">
                            <span style="font-size: 0.85rem; color: var(--accent-color); font-weight: bold;">Foto carregada!</span>
                        </div>
                    `;
                    uploadPreview.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // Salvar Alterações do Perfil
    if (formEditarPerfil) {
        formEditarPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            const novoNome = inputEditNome.value.trim();
            const novaBio = inputEditBio.value.trim();
            const selectStatus = document.getElementById('editStatusJogo');
            const novoStatus = selectStatus ? selectStatus.value : 'procurando_campanha';

            if (!novoNome) {
                alert('O nome do aventureiro não pode ficar vazio!');
                return;
            }

            const res = await Auth.atualizarPerfil({
                id: usuarioAtual.id,
                nome: novoNome,
                bio: novaBio,
                status_jogo: novoStatus,
                avatar: avatarSelecionado
            });

            if (res.sucesso) {
                if (editFeedback) {
                    editFeedback.textContent = '✨ ' + res.mensagem;
                    editFeedback.style.background = 'rgba(34, 197, 94, 0.15)';
                    editFeedback.style.color = '#22c55e';
                    editFeedback.style.border = '1px solid #22c55e';
                    editFeedback.style.display = 'block';
                }

                renderizarDadosPerfil(res.usuario);

                setTimeout(() => {
                    modalEditar.style.display = 'none';
                    carregarAtividades();
                }, 1000);
            } else {
                if (editFeedback) {
                    editFeedback.textContent = res.erro || 'Falha ao salvar.';
                    editFeedback.style.background = 'rgba(239, 68, 68, 0.15)';
                    editFeedback.style.color = '#ef4444';
                    editFeedback.style.border = '1px solid #ef4444';
                    editFeedback.style.display = 'block';
                }
            }
        });
    }

    // Clique rápido no badge de status para alterar
    if (elStatusDisplay) {
        elStatusDisplay.style.cursor = 'pointer';
        elStatusDisplay.addEventListener('click', () => {
            if (btnAbrirEditar) btnAbrirEditar.click();
        });
    }

    // Fecha modais ao clicar no overlay escuro
    window.addEventListener('click', (e) => {
        if (e.target === modalEditar) modalEditar.style.display = 'none';
        if (e.target === modalSubmeter) modalSubmeter.style.display = 'none';
    });

    // Se a URL contiver ?acao=submeter, abre automaticamente o modal de envio
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('acao') === 'submeter') {
        setTimeout(() => {
            if (btnAbrirSubmeter) btnAbrirSubmeter.click();
        }, 300);
    }

    // Inicialização da Página
    renderizarDadosPerfil(usuarioAtual);
    await carregarAtividades();
    await carregarMeusRPGs();
});

// Helper de escape HTML
function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

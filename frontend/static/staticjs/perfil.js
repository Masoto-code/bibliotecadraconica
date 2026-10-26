// Arquivo: perfil.js - Gerenciamento e Personalização da Ficha de Perfil do Aventureiro

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

    const listaTopicosCriados = document.getElementById('listaTopicosCriados');
    const listaTopicosRespondidos = document.getElementById('listaTopicosRespondidos');
    const listaMinhasAvaliacoes = document.getElementById('listaMinhasAvaliacoes');

    // Modal de Edição
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

    let avatarSelecionado = usuarioAtual.avatar || '🧙‍♂️';

    // Rótulos amigáveis para o Status de Campanha
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
    }

    // Carrega e renderiza as 3 seções de atividades
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
                                <span>💬 ${t.total_comentarios || 0} resposta${t.total_comentarios === 1 ? '' : 's'}</span>
                            </div>
                            <p class="atividade-texto">${escapeHtml(t.conteudo.length > 220 ? t.conteudo.slice(0, 220) + '...' : t.conteudo)}</p>
                            <div class="atividade-footer">
                                <span style="color: var(--text-muted); font-size: 0.85rem;">Status: Tópico ativo na Taverna</span>
                                <a href="forum.html" style="color: var(--accent-color); font-weight: bold; text-decoration: none;">Ver no Fórum →</a>
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
                        <h4 style="color: var(--accent-color); margin-bottom: 8px;">💬 Nenhuma participação recente</h4>
                        <p style="color: var(--text-muted); margin-bottom: 16px;">Compartilhe dicas, estratégias e avalie os tópicos de outros aventureiros!</p>
                        <a href="forum.html" class="btn-destaque-perfil" style="text-decoration: none;">Explorar Fórum</a>
                    </div>
                `;
            } else {
                listaTopicosRespondidos.innerHTML = respondidos.map(t => {
                    const dataFmt = t.data_criacao ? new Date(t.data_criacao).toLocaleDateString('pt-BR') : 'Recentemente';
                    return `
                        <article class="atividade-card">
                            <div class="atividade-header">
                                <h3 class="atividade-titulo">${escapeHtml(t.titulo)}</h3>
                                <span class="badge-sistema">${escapeHtml(t.sistema || 'Geral')}</span>
                            </div>
                            <div class="atividade-meta">
                                <span>👤 Criado por: <strong>${escapeHtml(t.autor)}</strong></span>
                                <span>📅 ${dataFmt}</span>
                                <span>💬 ${t.total_comentarios || 0} comentários</span>
                            </div>
                            <div class="atividade-footer">
                                <span style="color: var(--text-muted); font-size: 0.85rem;">Você contribuiu nesta discussão</span>
                                <a href="forum.html" style="color: var(--accent-color); font-weight: bold; text-decoration: none;">Continuar Conversa →</a>
                            </div>
                        </article>
                    `;
                }).join('');
            }
        }

        // 3. Minhas Avaliações
        const avaliacoes = atividades.avaliacoes || [];
        if (tabCountAvaliacoes) tabCountAvaliacoes.textContent = avaliacoes.length;
        if (listaMinhasAvaliacoes) {
            if (avaliacoes.length === 0) {
                listaMinhasAvaliacoes.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: var(--card-bg); border-radius: 8px; border: 1px dashed var(--border-color);">
                        <h4 style="color: var(--accent-color); margin-bottom: 8px;">⭐ Nenhuma avaliação gravada</h4>
                        <p style="color: var(--text-muted); margin-bottom: 16px;">Explore nosso acervo de RPG e avalie os livros com notas e resenhas críticas.</p>
                        <a href="index.html" class="btn-destaque-perfil" style="text-decoration: none;">Ver Catálogo de Livros</a>
                    </div>
                `;
            } else {
                listaMinhasAvaliacoes.innerHTML = avaliacoes.map(a => {
                    const dataFmt = a.data_criacao ? new Date(a.data_criacao).toLocaleDateString('pt-BR') : 'Recentemente';
                    const estrelas = '★'.repeat(a.nota) + '☆'.repeat(5 - a.nota);
                    return `
                        <article class="atividade-card">
                            <div class="atividade-header">
                                <h3 class="atividade-titulo">📖 ${escapeHtml(a.livro_titulo || 'Livro da Biblioteca')}</h3>
                                <span style="color: var(--star-active); font-size: 1.15rem; letter-spacing: 2px;">${estrelas}</span>
                            </div>
                            <div class="atividade-meta">
                                <span>Nota dada: <strong>${a.nota} / 5 estrelas</strong></span>
                                <span>📅 Avaliado em ${dataFmt}</span>
                            </div>
                            <p class="atividade-texto" style="font-style: italic;">"${escapeHtml(a.comentario || 'Sem resenha por escrito.')}"</p>
                            <div class="atividade-footer">
                                <span style="color: var(--text-muted); font-size: 0.85rem;">Resenha publicada no acervo</span>
                                <a href="detalhes.html?id=${a.livro_id}" style="color: var(--accent-color); font-weight: bold; text-decoration: none;">Ver Livro →</a>
                            </div>
                        </article>
                    `;
                }).join('');
            }
        }
    }

    // Alternador de Abas
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.add('active');
        });
    });

    // Clique direto no badge de status para abrir modal de edição focado no status
    if (elStatusDisplay) {
        elStatusDisplay.addEventListener('click', () => {
            abrirModalEdicao();
        });
    }

    // Modal de Edição
    function abrirModalEdicao() {
        const u = Auth.getUsuario();
        if (!u) return;

        if (inputEditNome) inputEditNome.value = u.nome || '';
        if (inputEditBio) inputEditBio.value = u.bio || '';

        // Status atual
        const statusAtual = u.status_jogo || 'procurando_campanha';
        const radio = document.querySelector(`input[name="editStatus"][value="${statusAtual}"]`);
        if (radio) radio.checked = true;

        // Avatar atual
        avatarSelecionado = u.avatar || '🧙‍♂️';
        atualizarBotoesAvatar();

        // Preview da imagem se for upload
        if (uploadPreview) {
            if (avatarSelecionado.startsWith('data:image') || avatarSelecionado.startsWith('http') || avatarSelecionado.includes('/')) {
                uploadPreview.src = avatarSelecionado;
                uploadPreview.style.display = 'block';
            } else {
                uploadPreview.style.display = 'none';
            }
        }

        if (editFeedback) editFeedback.style.display = 'none';
        modalEditar.style.display = 'flex';
    }

    function fecharModalEdicao() {
        modalEditar.style.display = 'none';
    }

    if (btnAbrirEditar) btnAbrirEditar.addEventListener('click', abrirModalEdicao);
    if (btnFecharEditar) btnFecharEditar.addEventListener('click', fecharModalEdicao);

    window.addEventListener('click', (e) => {
        if (e.target === modalEditar) fecharModalEdicao();
    });

    // Seletor de Avatares RPG (emojis)
    const avatarBtns = document.querySelectorAll('.avatar-option-btn');
    avatarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            avatarSelecionado = btn.getAttribute('data-avatar');
            atualizarBotoesAvatar();
            if (uploadPreview) uploadPreview.style.display = 'none';
            if (uploadInput) uploadInput.value = '';
        });
    });

    function atualizarBotoesAvatar() {
        avatarBtns.forEach(btn => {
            if (btn.getAttribute('data-avatar') === avatarSelecionado) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    // Upload de Imagem de Avatar (FileReader)
    if (uploadArea && uploadInput) {
        uploadArea.addEventListener('click', () => {
            uploadInput.click();
        });

        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Limite de 3MB
            if (file.size > 3 * 1024 * 1024) {
                alert('⚠️ A imagem escolhida é muito pesada. Por favor escolha uma imagem de até 3MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                avatarSelecionado = event.target.result; // DataURL Base64
                if (uploadPreview) {
                    uploadPreview.src = avatarSelecionado;
                    uploadPreview.style.display = 'block';
                }
                avatarBtns.forEach(b => b.classList.remove('selected'));
            };
            reader.readAsDataURL(file);
        });
    }

    // Submissão do Formulário de Edição de Perfil
    if (formEditarPerfil) {
        formEditarPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();

            const novoNome = inputEditNome.value.trim();
            const novaBio = inputEditBio.value.trim();
            const radioStatus = document.querySelector('input[name="editStatus"]:checked');
            const novoStatus = radioStatus ? radioStatus.value : 'procurando_campanha';

            if (!novoNome) {
                alert('O nome do aventureiro não pode ficar em branco.');
                return;
            }

            const submitBtn = formEditarPerfil.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Salvando nos registros da guilda...';
            }

            const resultado = await Auth.atualizarPerfil({
                nome: novoNome,
                avatar: avatarSelecionado,
                bio: novaBio,
                status_jogo: novoStatus
            });

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Salvar Alterações';
            }

            if (resultado.sucesso) {
                renderizarDadosPerfil(resultado.usuario);
                carregarAtividades();
                fecharModalEdicao();
                alert('✨ Perfil atualizado com sucesso!');
            } else {
                alert('Erro ao atualizar perfil: ' + (resultado.erro || 'Tente novamente.'));
            }
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Inicialização da Página
    renderizarDadosPerfil(usuarioAtual);
    carregarAtividades();
});

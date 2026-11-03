// Arquivo: mensagens.js - Sistema de Mensagens e Guildas estilo Facebook Messenger

const MensagensApp = {
    API_URL: 'http://localhost:5000/api',
    usuarioLogado: null,
    conversas: [],
    conversaAtivaId: null,
    filtroAtual: 'todos',
    termoBusca: '',
    iconeGrupoSelecionado: '🏰',

    init() {
        // 1. Obter usuário autenticado
        this.usuarioLogado = Auth.getUsuario();
        if (!this.usuarioLogado) {
            // Cria um perfil temporário/visitante caso não esteja logado
            this.usuarioLogado = {
                id: 1,
                nome: 'Mestre dos Magos',
                email: 'mestre@draconica.com',
                avatar: '🧙‍♂️',
                status_jogo: 'procurando_jogadores'
            };
        }

        // 2. Configurar eventos de interface
        this.bindEvents();

        // 3. Carregar conversas
        this.carregarConversas();

        // Polling suave a cada 4 segundos para atualizar novas mensagens
        setInterval(() => {
            if (this.conversaAtivaId) {
                this.atualizarMensagensSilencioso();
            }
        }, 4000);
    },

    bindEvents() {
        // Filtros (Todas, Privadas, Grupos)
        document.querySelectorAll('.tab-pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filtroAtual = e.target.dataset.filtro;
                this.renderizarListaConversas();
            });
        });

        // Busca de conversas na sidebar
        const inputBusca = document.getElementById('input-busca-conversas');
        if (inputBusca) {
            inputBusca.addEventListener('input', (e) => {
                this.termoBusca = e.target.value.toLowerCase().trim();
                this.renderizarListaConversas();
            });
        }

        // Formulário de envio de mensagem
        const formMsg = document.getElementById('form-enviar-mensagem');
        if (formMsg) {
            formMsg.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('input-mensagem-texto');
                const texto = input.value.trim();
                if (texto && this.conversaAtivaId) {
                    this.enviarMensagem(texto);
                    input.value = '';
                }
            });
        }

        // Botões de rolagem de dados RPG
        const btnD20 = document.getElementById('btn-quick-d20');
        if (btnD20) {
            btnD20.addEventListener('click', () => this.rolarDado(20));
        }

        const btnD6 = document.getElementById('btn-quick-d6');
        if (btnD6) {
            btnD6.addEventListener('click', () => this.rolarDado(6));
        }

        // Abrir Modal de Novo Chat Privado
        const btnNovoChat = document.getElementById('btn-abrir-novo-chat');
        if (btnNovoChat) {
            btnNovoChat.addEventListener('click', () => this.abrirModalNovoChat());
        }

        // Abrir Modal de Criar Grupo
        const btnNovoGrupo = document.getElementById('btn-abrir-novo-grupo');
        if (btnNovoGrupo) {
            btnNovoGrupo.addEventListener('click', () => this.abrirModalNovoGrupo());
        }

        // Seleção de ícones de grupo
        document.querySelectorAll('#grupo-icon-selector .icon-opt').forEach(opt => {
            opt.addEventListener('click', (e) => {
                document.querySelectorAll('#grupo-icon-selector .icon-opt').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                this.iconeGrupoSelecionado = opt.dataset.icon;
            });
        });

        // Confirmar criação de grupo
        const btnCriarGrupo = document.getElementById('btn-confirmar-criar-grupo');
        if (btnCriarGrupo) {
            btnCriarGrupo.addEventListener('click', () => this.confirmarCriarGrupo());
        }

        // Botão de ver membros
        const btnVerMembros = document.getElementById('btn-ver-membros');
        if (btnVerMembros) {
            btnVerMembros.addEventListener('click', () => this.abrirModalMembros());
        }

        // Botão voltar na visualização mobile
        const btnVoltar = document.getElementById('btn-voltar-lista');
        if (btnVoltar) {
            btnVoltar.addEventListener('click', () => {
                document.getElementById('messenger-app').classList.remove('chat-active');
            });
        }
    },

    inserirEmote(emote) {
        const input = document.getElementById('input-mensagem-texto');
        if (input) {
            input.value += (input.value ? ' ' : '') + emote + ' ';
            input.focus();
        }
    },

    formatarDataRelativa(dataString) {
        if (!dataString) return '';
        try {
            const data = new Date(dataString.replace(' ', 'T'));
            if (isNaN(data.getTime())) return '';
            const agora = new Date();
            const diffMs = agora - data;
            const diffMin = Math.floor(diffMs / 60000);
            const diffHoras = Math.floor(diffMin / 60);

            if (diffMin < 1) return 'Agora';
            if (diffMin < 60) return `${diffMin}m`;
            if (diffHoras < 24) return `${diffHoras}h`;
            return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } catch {
            return '';
        }
    },

    formatarStatus(status) {
        if (status === 'procurando_jogadores') return '🟢 Procurando Jogadores';
        if (status === 'procurando_campanha') return '🔵 Procurando Campanha';
        if (status === 'em_campanha') return '🟡 Em Campanha';
        return '';
    },

    // Carregar todas as conversas do usuário
    async carregarConversas() {
        try {
            const res = await fetch(`${this.API_URL}/mensagens/conversas?usuario_id=${this.usuarioLogado.id}`);
            if (res.ok) {
                this.conversas = await res.json();
                this.salvarConversasCache(this.conversas);
            } else {
                this.conversas = this.obterConversasCache();
            }
        } catch {
            this.conversas = this.obterConversasCache();
        }

        this.renderizarListaConversas();

        // Se houver conversas e nenhuma estiver aberta, seleciona a primeira (ex: Taverna dos Dragões)
        if (this.conversas.length > 0 && !this.conversaAtivaId && window.innerWidth > 860) {
            this.selecionarConversa(this.conversas[0].id);
        }
    },

    renderizarListaConversas() {
        const container = document.getElementById('conversas-list');
        if (!container) return;

        let filtradas = this.conversas;

        if (this.filtroAtual === 'privada') {
            filtradas = filtradas.filter(c => c.tipo === 'privada');
        } else if (this.filtroAtual === 'grupo') {
            filtradas = filtradas.filter(c => c.tipo === 'grupo');
        }

        if (this.termoBusca) {
            filtradas = filtradas.filter(c => c.nome.toLowerCase().includes(this.termoBusca));
        }

        if (filtradas.length === 0) {
            container.innerHTML = `
                <div style="padding: 30px 15px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                    Nenhuma conversa encontrada.
                </div>
            `;
            return;
        }

        container.innerHTML = filtradas.map(c => {
            const ativa = c.id === this.conversaAtivaId ? 'active' : '';
            const statusClass = c.tipo === 'grupo' ? 'grupo' : (c.status_jogo || 'procurando_campanha');
            const dataHora = this.formatarDataRelativa(c.data_ultima_mensagem);
            const prefixoRemetente = c.remetente_ultima_mensagem ? `${c.remetente_ultima_mensagem}: ` : '';

            return `
                <div class="conversa-item ${ativa}" onclick="MensagensApp.selecionarConversa(${c.id})">
                    <div class="conversa-avatar-wrap">
                        ${Auth.renderAvatar(c.avatar, 44)}
                        <span class="status-dot ${statusClass}" title="${this.formatarStatus(c.status_jogo) || 'Grupo da Guilda'}"></span>
                    </div>
                    <div class="conversa-info">
                        <div class="conversa-info-top">
                            <span class="conversa-nome">${c.nome}</span>
                            <span class="conversa-hora">${dataHora}</span>
                        </div>
                        <div class="conversa-info-bottom">
                            <span class="conversa-preview">${prefixoRemetente}${c.ultima_mensagem || 'Sem mensagens'}</span>
                            <span class="tipo-badge ${c.tipo}">${c.tipo === 'grupo' ? 'Grupo' : 'Privada'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    async selecionarConversa(conversaId) {
        this.conversaAtivaId = conversaId;
        this.renderizarListaConversas();

        const emptyState = document.getElementById('chat-empty-state');
        const activeContainer = document.getElementById('chat-active-container');
        if (emptyState) emptyState.style.display = 'none';
        if (activeContainer) activeContainer.style.display = 'flex';

        // Suporte Mobile: exibe tela de chat
        document.getElementById('messenger-app').classList.add('chat-active');
        const btnVoltar = document.getElementById('btn-voltar-lista');
        if (btnVoltar && window.innerWidth <= 860) {
            btnVoltar.style.display = 'block';
        }

        const conv = this.conversas.find(c => c.id === conversaId);
        if (conv) {
            document.getElementById('chat-header-title').textContent = conv.nome;
            const subtitle = conv.tipo === 'grupo'
                ? `👥 Grupo com ${conv.total_participantes || (conv.participantes ? conv.participantes.length : 1)} aventureiros`
                : (this.formatarStatus(conv.status_jogo) || 'Chat Direto');
            document.getElementById('chat-header-subtitle').textContent = subtitle;
            document.getElementById('chat-header-avatar').innerHTML = Auth.renderAvatar(conv.avatar, 40);
        }

        await this.carregarMensagens(conversaId);
    },

    async carregarMensagens(conversaId) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        messagesContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 20px;">
                Carregando mensagens da taverna...
            </div>
        `;

        try {
            const res = await fetch(`${this.API_URL}/mensagens/conversas/${conversaId}/mensagens?usuario_id=${this.usuarioLogado.id}`);
            if (res.ok) {
                const dados = await res.json();
                this.renderizarMensagens(dados.mensagens);
                return;
            }
        } catch {}

        // Fallback offline
        const msgsOffline = this.obterMensagensOffline(conversaId);
        this.renderizarMensagens(msgsOffline);
    },

    async atualizarMensagensSilencioso() {
        if (!this.conversaAtivaId) return;
        try {
            const res = await fetch(`${this.API_URL}/mensagens/conversas/${this.conversaAtivaId}/mensagens?usuario_id=${this.usuarioLogado.id}`);
            if (res.ok) {
                const dados = await res.json();
                const container = document.getElementById('chat-messages');
                // Se a contagem mudou, re-renderiza
                const currentCount = container.querySelectorAll('.msg-row').length;
                if (dados.mensagens.length !== currentCount) {
                    this.renderizarMensagens(dados.mensagens);
                    this.carregarConversas(); // atualiza prévias
                }
            }
        } catch {}
    },

    renderizarMensagens(mensagens) {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        if (!mensagens || mensagens.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 30px;">
                    Nenhuma mensagem por enquanto. Quebre o silêncio e envie a primeira mensagem!
                </div>
            `;
            return;
        }

        container.innerHTML = mensagens.map(m => {
            const isMe = m.remetente_id === this.usuarioLogado.id || m.remetente_nome === this.usuarioLogado.nome;
            const rowClass = isMe ? 'sent' : 'received';
            const hora = this.formatarHora(m.data_envio);
            const isDado = m.conteudo.includes('🎲 [Rolagem');

            return `
                <div class="msg-row ${rowClass}">
                    ${!isMe ? `<div class="msg-avatar">${Auth.renderAvatar(m.remetente_avatar, 30)}</div>` : ''}
                    <div class="msg-content-wrap">
                        ${!isMe ? `<span class="msg-sender-name">${m.remetente_nome}</span>` : ''}
                        <div class="msg-bubble ${isDado ? 'dice-roll' : ''}">
                            ${this.formatarConteudoMensagem(m.conteudo)}
                        </div>
                        <span class="msg-timestamp">${hora}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Rolar até o final
        container.scrollTop = container.scrollHeight;
    },

    formatarHora(dataString) {
        if (!dataString) return '';
        try {
            const data = new Date(dataString.replace(' ', 'T'));
            if (isNaN(data.getTime())) return '';
            return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    },

    formatarConteudoMensagem(texto) {
        if (!texto) return '';
        // Destacar rolagens de dados
        if (texto.includes('🎲 [Rolagem')) {
            return texto.replace(/\n/g, '<br>');
        }
        return texto.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    },

    async enviarMensagem(conteudo) {
        if (!this.conversaAtivaId || !conteudo) return;

        const payload = {
            remetente_id: this.usuarioLogado.id,
            remetente_nome: this.usuarioLogado.nome,
            remetente_avatar: this.usuarioLogado.avatar,
            conteudo: conteudo
        };

        // Renderização Otimista no Feed
        const container = document.getElementById('chat-messages');
        const tempMsgId = 'temp_' + Date.now();
        if (container) {
            const html = `
                <div class="msg-row sent" id="${tempMsgId}">
                    <div class="msg-content-wrap">
                        <div class="msg-bubble ${conteudo.includes('🎲 [Rolagem') ? 'dice-roll' : ''}">
                            ${this.formatarConteudoMensagem(conteudo)}
                        </div>
                        <span class="msg-timestamp">Enviando...</span>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
            container.scrollTop = container.scrollHeight;
        }

        try {
            const res = await fetch(`${this.API_URL}/mensagens/conversas/${this.conversaAtivaId}/mensagens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const dados = await res.json();
                const tempEl = document.getElementById(tempMsgId);
                if (tempEl) {
                    tempEl.querySelector('.msg-timestamp').textContent = this.formatarHora(dados.dados.data_envio);
                }
            } else {
                this.salvarMensagemOffline(this.conversaAtivaId, payload);
            }
        } catch {
            this.salvarMensagemOffline(this.conversaAtivaId, payload);
        }

        // Atualizar lista de conversas com última mensagem
        this.carregarConversas();
    },

    // Rolar Dados de RPG com mensagens formatadas
    rolarDado(lados = 20) {
        if (!this.conversaAtivaId) {
            alert('Selecione ou inicie uma conversa para rolar os dados!');
            return;
        }

        const resultado = Math.floor(Math.random() * lados) + 1;
        let complemento = '';
        if (lados === 20) {
            if (resultado === 20) complemento = ' 🌟 ACERTO CRÍTICO!';
            else if (resultado === 1) complemento = ' 💀 FALHA CRÍTICA!';
        }

        const msg = `🎲 [Rolagem de d${lados}]: Resultado = ${resultado}${complemento}`;
        this.enviarMensagem(msg);
    },

    // ================= MODAL: NOVO CHAT PRIVADO =================
    async abrirModalNovoChat() {
        const modal = document.getElementById('modal-novo-chat');
        const container = document.getElementById('lista-aventureiros-privado');
        if (!modal || !container) return;

        modal.style.display = 'flex';
        container.innerHTML = '<div style="padding: 10px; color: var(--text-muted);">Buscando aventureiros da guilda...</div>';

        try {
            const res = await fetch(`${this.API_URL}/usuarios?exceto_id=${this.usuarioLogado.id}`);
            if (res.ok) {
                const usuarios = await res.json();
                this.renderizarListaAventureirosModal(usuarios);
                return;
            }
        } catch {}

        // Fallback de aventureiros
        const aventureirosPadrao = [
            { id: 1, nome: 'Mestre dos Magos', avatar: '🧙‍♂️', status_jogo: 'procurando_jogadores', bio: 'Guardião dos tomos arcanos.' },
            { id: 2, nome: 'Valéria, a Feiticeira', avatar: '🧝‍♀️', status_jogo: 'em_campanha', bio: 'Maga elementalista.' },
            { id: 3, nome: 'Eldrin, o Paladino', avatar: '🛡️', status_jogo: 'procurando_campanha', bio: 'Combatente de linha de frente.' },
            { id: 4, nome: 'Bardo Viajante', avatar: '🪕', status_jogo: 'procurando_campanha', bio: 'Contador de lendas.' }
        ].filter(u => u.id !== this.usuarioLogado.id);

        this.renderizarListaAventureirosModal(aventureirosPadrao);
    },

    renderizarListaAventureirosModal(usuarios) {
        const container = document.getElementById('lista-aventureiros-privado');
        if (!container) return;

        if (usuarios.length === 0) {
            container.innerHTML = '<div style="padding: 15px; text-align: center; color: var(--text-muted);">Nenhum outro aventureiro encontrado.</div>';
            return;
        }

        container.innerHTML = usuarios.map(u => `
            <div class="user-select-item">
                <div class="user-select-item-left">
                    <span style="font-size: 1.4rem;">${Auth.renderAvatar(u.avatar, 32)}</span>
                    <div>
                        <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${u.nome}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${this.formatarStatus(u.status_jogo)}</div>
                    </div>
                </div>
                <button class="btn-sidebar-action" onclick="MensagensApp.iniciarChatPrivadoCom(${u.id})">
                    Conversar 💬
                </button>
            </div>
        `).join('');

        // Filtro em tempo real no modal
        const inputBusca = document.getElementById('input-busca-aventureiro');
        if (inputBusca) {
            inputBusca.oninput = (e) => {
                const termo = e.target.value.toLowerCase().trim();
                const filtrados = usuarios.filter(u => u.nome.toLowerCase().includes(termo));
                this.renderizarListaAventureirosModal(filtrados);
            };
        }
    },

    async iniciarChatPrivadoCom(destinatarioId) {
        this.fecharModais();
        try {
            const res = await fetch(`${this.API_URL}/mensagens/conversas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: 'privada',
                    usuario_id: this.usuarioLogado.id,
                    destinatario_id: destinatarioId
                })
            });

            if (res.ok) {
                const dados = await res.json();
                await this.carregarConversas();
                this.selecionarConversa(dados.conversa_id);
                return;
            }
        } catch {}

        alert('Conversa iniciada!');
        this.carregarConversas();
    },

    // ================= MODAL: CRIAR GRUPO =================
    async abrirModalNovoGrupo() {
        const modal = document.getElementById('modal-novo-grupo');
        const container = document.getElementById('lista-convite-membros');
        if (!modal || !container) return;

        modal.style.display = 'flex';
        container.innerHTML = '<div style="padding: 10px; color: var(--text-muted);">Carregando aventureiros...</div>';

        try {
            const res = await fetch(`${this.API_URL}/usuarios?exceto_id=${this.usuarioLogado.id}`);
            if (res.ok) {
                const usuarios = await res.json();
                this.renderizarListaConviteGrupo(usuarios);
                return;
            }
        } catch {}

        const padrao = [
            { id: 2, nome: 'Valéria, a Feiticeira', avatar: '🧝‍♀️' },
            { id: 3, nome: 'Eldrin, o Paladino', avatar: '🛡️' },
            { id: 4, nome: 'Bardo Viajante', avatar: '🪕' }
        ];
        this.renderizarListaConviteGrupo(padrao);
    },

    renderizarListaConviteGrupo(usuarios) {
        const container = document.getElementById('lista-convite-membros');
        if (!container) return;

        container.innerHTML = usuarios.map(u => `
            <label class="user-select-item" style="cursor: pointer;">
                <div class="user-select-item-left">
                    <span>${Auth.renderAvatar(u.avatar, 28)}</span>
                    <span style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">${u.nome}</span>
                </div>
                <input type="checkbox" name="convidados_grupo" value="${u.id}">
            </label>
        `).join('');
    },

    async confirmarCriarGrupo() {
        const nomeInput = document.getElementById('input-nome-grupo');
        const nome = nomeInput.value.trim();
        if (!nome) {
            alert('Por favor, informe o nome do grupo ou mesa de RPG.');
            return;
        }

        const msgInput = document.getElementById('input-msg-inicial-grupo');
        const msgInicial = msgInput ? msgInput.value.trim() : '';

        const checkboxes = document.querySelectorAll('input[name="convidados_grupo"]:checked');
        const participantesIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

        const payload = {
            tipo: 'grupo',
            nome_grupo: nome,
            foto_grupo: this.iconeGrupoSelecionado,
            usuario_id: this.usuarioLogado.id,
            criador_nome: this.usuarioLogado.nome,
            criador_avatar: this.usuarioLogado.avatar,
            participantes_ids: participantesIds,
            mensagem_inicial: msgInicial || `Mesa de RPG "${nome}" criada com sucesso!`
        };

        try {
            const res = await fetch(`${this.API_URL}/mensagens/conversas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const dados = await res.json();
                this.fecharModais();
                nomeInput.value = '';
                if (msgInput) msgInput.value = '';
                await this.carregarConversas();
                this.selecionarConversa(dados.conversa_id);
                return;
            }
        } catch {}

        alert('Grupo criado com sucesso!');
        this.fecharModais();
        this.carregarConversas();
    },

    // ================= MODAL: MEMBROS DA CONVERSA =================
    async abrirModalMembros() {
        if (!this.conversaAtivaId) return;

        const conv = this.conversas.find(c => c.id === this.conversaAtivaId);
        if (!conv) return;

        const modal = document.getElementById('modal-membros');
        const containerMembros = document.getElementById('lista-membros-atuais');
        const secaoAdicionar = document.getElementById('secao-adicionar-membro');
        const titulo = document.getElementById('titulo-modal-membros');

        if (!modal) return;
        modal.style.display = 'flex';
        titulo.textContent = conv.tipo === 'grupo' ? `👥 Membros do Grupo: ${conv.nome}` : `🗡️ Participantes do Chat`;

        containerMembros.innerHTML = '<div style="padding: 10px; color: var(--text-muted);">Carregando participantes...</div>';

        try {
            const res = await fetch(`${this.API_URL}/mensagens/conversas/${this.conversaAtivaId}/mensagens?usuario_id=${this.usuarioLogado.id}`);
            if (res.ok) {
                const dados = await res.json();
                const participantes = dados.participantes || [];

                containerMembros.innerHTML = participantes.map(p => `
                    <div class="user-select-item">
                        <div class="user-select-item-left">
                            <span>${Auth.renderAvatar(p.avatar, 30)}</span>
                            <div>
                                <span style="font-weight: 700; color: var(--text-main);">${p.nome}</span>
                                <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">${this.formatarStatus(p.status_jogo)}</span>
                            </div>
                        </div>
                    </div>
                `).join('');

                // Se for grupo, exibe opção de adicionar outros aventureiros
                if (conv.tipo === 'grupo') {
                    secaoAdicionar.style.display = 'block';
                    this.carregarAventureirosParaAdicionar(participantes);
                } else {
                    secaoAdicionar.style.display = 'none';
                }
            }
        } catch {
            containerMembros.innerHTML = '<div style="padding: 10px;">Não foi possível carregar os membros.</div>';
        }
    },

    async carregarAventureirosParaAdicionar(participantesAtuais) {
        const container = document.getElementById('lista-novos-membros-adicionar');
        if (!container) return;

        try {
            const res = await fetch(`${this.API_URL}/usuarios`);
            if (res.ok) {
                const todos = await res.json();
                const atuaisIds = new Set(participantesAtuais.map(p => p.id));
                const disponiveis = todos.filter(u => !atuaisIds.has(u.id));

                if (disponiveis.length === 0) {
                    container.innerHTML = '<div style="padding: 8px; color: var(--text-muted); font-size: 0.85rem;">Todos os aventureiros cadastrados já estão no grupo!</div>';
                    return;
                }

                container.innerHTML = disponiveis.map(u => `
                    <div class="user-select-item">
                        <div class="user-select-item-left">
                            <span>${Auth.renderAvatar(u.avatar, 26)}</span>
                            <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-main);">${u.nome}</span>
                        </div>
                        <button class="btn-sidebar-action" onclick="MensagensApp.adicionarMembroAoGrupo(${u.id})">
                            Adicionar ➕
                        </button>
                    </div>
                `).join('');
            }
        } catch {}
    },

    async adicionarMembroAoGrupo(usuarioId) {
        try {
            const res = await fetch(`${this.API_URL}/mensagens/conversas/${this.conversaAtivaId}/participantes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: usuarioId })
            });

            if (res.ok) {
                alert('Aventureiro adicionado ao grupo com sucesso!');
                this.abrirModalMembros();
                this.carregarConversas();
            }
        } catch {
            alert('Falha ao adicionar participante.');
        }
    },

    fecharModais() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
    },

    // Cache local / offline para garantir funcionamento sem internet
    salvarConversasCache(conversas) {
        try {
            localStorage.setItem('draconica_conversas_cache', JSON.stringify(conversas));
        } catch {}
    },

    obterConversasCache() {
        try {
            const salvo = localStorage.getItem('draconica_conversas_cache');
            if (salvo) return JSON.parse(salvo);
        } catch {}

        // Conversas iniciais padrão
        return [
            {
                id: 1,
                tipo: 'grupo',
                nome: 'Taverna dos Dragões 🍻',
                avatar: '🏰',
                status_jogo: null,
                total_participantes: 4,
                ultima_mensagem: 'Uma caneca de hidromel e estou pronto para qualquer canção de batalha.',
                data_ultima_mensagem: new Date().toISOString(),
                remetente_ultima_mensagem: 'Bardo Viajante'
            },
            {
                id: 2,
                tipo: 'privada',
                nome: 'Eldrin, o Paladino',
                avatar: '🛡️',
                status_jogo: 'procurando_campanha',
                total_participantes: 2,
                ultima_mensagem: 'Sim, Mestre! Já preparei a ficha do meu Guardião Sagrado.',
                data_ultima_mensagem: new Date().toISOString(),
                remetente_ultima_mensagem: 'Eldrin, o Paladino'
            }
        ];
    },

    obterMensagensOffline(conversaId) {
        try {
            const salvo = localStorage.getItem(`draconica_msgs_${conversaId}`);
            if (salvo) return JSON.parse(salvo);
        } catch {}
        return [];
    },

    salvarMensagemOffline(conversaId, payload) {
        try {
            const msgs = this.obterMensagensOffline(conversaId);
            msgs.push({
                ...payload,
                id: Date.now(),
                conversa_id: conversaId,
                data_envio: new Date().toISOString()
            });
            localStorage.setItem(`draconica_msgs_${conversaId}`, JSON.stringify(msgs));
        } catch {}
    }
};

// Inicialização automática quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    MensagensApp.init();
});

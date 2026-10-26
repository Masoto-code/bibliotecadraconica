// Arquivo: auth.js - Gerenciador de Autenticação e Perfil de Aventureiro

const Auth = {
    CHAVE_STORAGE: 'draconica_usuario_logado',

    getUsuario() {
        try {
            const salvo = localStorage.getItem(this.CHAVE_STORAGE);
            return salvo ? JSON.parse(salvo) : null;
        } catch {
            return null;
        }
    },

    salvarUsuario(usuario) {
        localStorage.setItem(this.CHAVE_STORAGE, JSON.stringify(usuario));
        this.atualizarInterface();
    },

    fazerLogout() {
        localStorage.removeItem(this.CHAVE_STORAGE);
        this.atualizarInterface();
        if (window.location.pathname.includes('login.html') || window.location.pathname.includes('perfil.html')) {
            window.location.href = 'inicial.html';
        } else {
            alert('Você saiu da sua conta de aventureiro.');
            window.location.reload();
        }
    },

    // Renderiza o avatar de forma elegante (seja imagem enviada por upload ou emoji de classe RPG)
    renderAvatar(avatar, tamanho = 28) {
        if (!avatar) avatar = '🧙‍♂️';
        const isImagem = avatar.startsWith('data:image') || avatar.startsWith('http') || avatar.includes('/');
        if (isImagem) {
            return `<img src="${avatar}" alt="Avatar" style="width: ${tamanho}px; height: ${tamanho}px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-color, #facc15); vertical-align: middle; display: inline-block;">`;
        }
        return `<span style="font-size: ${Math.round(tamanho * 0.85)}px; line-height: 1; vertical-align: middle; display: inline-block;">${avatar}</span>`;
    },

    async login(email, senha) {
        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await res.json();
            if (res.ok && data.usuario) {
                this.salvarUsuario(data.usuario);
                return { sucesso: true, mensagem: data.mensagem, usuario: data.usuario };
            } else {
                return { sucesso: false, erro: data.erro || 'Falha ao autenticar.' };
            }
        } catch {
            // Fallback offline com usuários pré-cadastrados ou registrados localmente
            const usuariosLocais = JSON.parse(localStorage.getItem('draconica_usuarios_db') || '[]');
            
            // Usuário mestre padrão
            if (email === 'mestre@draconica.com' && senha === 'draconica123') {
                const u = { 
                    id: 1, 
                    nome: 'Mestre dos Magos', 
                    email, 
                    avatar: '🧙‍♂️', 
                    bio: 'Guardião dos tomos arcanos da Biblioteca Dracônica.', 
                    status_jogo: 'procurando_jogadores' 
                };
                this.salvarUsuario(u);
                return { sucesso: true, mensagem: 'Login offline como Mestre realizado!', usuario: u };
            }

            const encontrado = usuariosLocais.find(u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha);
            if (encontrado) {
                const u = { 
                    id: encontrado.id, 
                    nome: encontrado.nome, 
                    email: encontrado.email, 
                    avatar: encontrado.avatar || '⚔️',
                    bio: encontrado.bio || '',
                    status_jogo: encontrado.status_jogo || 'procurando_campanha'
                };
                this.salvarUsuario(u);
                return { sucesso: true, mensagem: `Saudações, ${u.nome}!`, usuario: u };
            }

            return { sucesso: false, erro: 'Email ou senha inválidos (Modo Local).' };
        }
    },

    async register(nome, email, senha, avatar = '⚔️') {
        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha, avatar })
            });

            const data = await res.json();
            if (res.ok && data.usuario) {
                this.salvarUsuario(data.usuario);
                return { sucesso: true, mensagem: data.mensagem, usuario: data.usuario };
            } else {
                return { sucesso: false, erro: data.erro || 'Erro ao criar conta.' };
            }
        } catch {
            // Fallback offline
            const usuariosLocais = JSON.parse(localStorage.getItem('draconica_usuarios_db') || '[]');
            if (usuariosLocais.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                return { sucesso: false, erro: 'Este email já está cadastrado localmente.' };
            }

            const novo = { 
                id: Date.now(), 
                nome, 
                email, 
                senha, 
                avatar, 
                bio: 'Aventureiro recém-chegado à guilda.', 
                status_jogo: 'procurando_campanha' 
            };
            usuariosLocais.push(novo);
            localStorage.setItem('draconica_usuarios_db', JSON.stringify(usuariosLocais));

            const usuarioSessao = { 
                id: novo.id, 
                nome, 
                email, 
                avatar, 
                bio: novo.bio, 
                status_jogo: novo.status_jogo 
            };
            this.salvarUsuario(usuarioSessao);
            return { sucesso: true, mensagem: 'Cadastro na guilda concluído com sucesso!', usuario: usuarioSessao };
        }
    },

    async atualizarPerfil(dadosAtualizados) {
        const usuarioAtual = this.getUsuario();
        if (!usuarioAtual) {
            return { sucesso: false, erro: 'Você precisa estar logado para personalizar o perfil.' };
        }

        const payload = {
            id: usuarioAtual.id,
            email: usuarioAtual.email,
            nome: dadosAtualizados.nome || usuarioAtual.nome,
            avatar: dadosAtualizados.avatar !== undefined ? dadosAtualizados.avatar : usuarioAtual.avatar,
            bio: dadosAtualizados.bio !== undefined ? dadosAtualizados.bio : (usuarioAtual.bio || ''),
            status_jogo: dadosAtualizados.status_jogo || usuarioAtual.status_jogo || 'procurando_campanha'
        };

        try {
            const res = await fetch('http://localhost:5000/api/usuarios/perfil', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok && data.usuario) {
                this.salvarUsuario(data.usuario);
                return { sucesso: true, mensagem: 'Perfil atualizado com sucesso!', usuario: data.usuario };
            } else {
                throw new Error(data.erro || 'Falha ao atualizar na API');
            }
        } catch {
            // Fallback LocalStorage
            const usuarioNovo = {
                ...usuarioAtual,
                nome: payload.nome,
                avatar: payload.avatar,
                bio: payload.bio,
                status_jogo: payload.status_jogo
            };
            this.salvarUsuario(usuarioNovo);

            // Atualiza na lista de usuários cadastrados localmente se existir
            const usuariosLocais = JSON.parse(localStorage.getItem('draconica_usuarios_db') || '[]');
            const idx = usuariosLocais.findIndex(u => u.email && u.email.toLowerCase() === usuarioNovo.email.toLowerCase());
            if (idx !== -1) {
                usuariosLocais[idx] = { ...usuariosLocais[idx], ...usuarioNovo };
                localStorage.setItem('draconica_usuarios_db', JSON.stringify(usuariosLocais));
            }

            // Atualiza o nome do autor nos tópicos locais
            if (usuarioAtual.nome !== usuarioNovo.nome) {
                const topicosLocais = JSON.parse(localStorage.getItem('draconica_forum_topicos') || '[]');
                topicosLocais.forEach(t => {
                    if (t.autor === usuarioAtual.nome) t.autor = usuarioNovo.nome;
                    if (t.comentarios) {
                        t.comentarios.forEach(c => {
                            if (c.usuario === usuarioAtual.nome) c.usuario = usuarioNovo.nome;
                        });
                    }
                });
                localStorage.setItem('draconica_forum_topicos', JSON.stringify(topicosLocais));
            }

            return { sucesso: true, mensagem: 'Perfil atualizado localmente com sucesso!', usuario: usuarioNovo };
        }
    },

    async obterAtividades(nomeUsuario) {
        try {
            const res = await fetch(`http://localhost:5000/api/usuarios/atividades?nome=${encodeURIComponent(nomeUsuario)}`);
            if (res.ok) {
                return await res.json();
            }
            throw new Error();
        } catch {
            // Fallback LocalStorage
            const topicosLocais = JSON.parse(localStorage.getItem('draconica_forum_topicos') || '[]');
            const topicosCriados = topicosLocais.filter(t => t.autor === nomeUsuario);
            
            const topicosRespondidos = topicosLocais.filter(t => {
                if (t.autor === nomeUsuario) return false;
                return t.comentarios && t.comentarios.some(c => c.usuario === nomeUsuario);
            });

            // Avaliações de livros salvas localmente
            const avaliacoes = [];
            for (let i = 1; i <= 25; i++) {
                const salvas = JSON.parse(localStorage.getItem(`avaliacoes_armazenadas_${i}`) || '[]');
                salvas.forEach(a => {
                    if (a.usuario === nomeUsuario) {
                        avaliacoes.push({
                            livro_id: i,
                            livro_titulo: `Tomo RPG #${i}`,
                            livro_sistema: 'RPG',
                            nota: a.nota,
                            comentario: a.comentario,
                            data_criacao: a.data_criacao
                        });
                    }
                });
            }

            return {
                usuario: nomeUsuario,
                topicos_criados: topicosCriados,
                topicos_respondidos: topicosRespondidos,
                avaliacoes: avaliacoes
            };
        }
    },

    atualizarInterface() {
        const usuario = this.getUsuario();
        const loginLinks = document.querySelectorAll('.btn-login, .nav-auth-slot');

        loginLinks.forEach(slot => {
            if (usuario) {
                const avatarHtml = this.renderAvatar(usuario.avatar, 28);
                slot.outerHTML = `
                    <div class="nav-auth-slot" style="display: inline-flex; align-items: center; gap: 10px; margin-left: 15px;">
                        <a href="perfil.html" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: inherit; padding: 4px 10px; border-radius: 20px; background: var(--badge-bg); border: 1px solid var(--badge-border); transition: transform 0.2s;" title="Ver e Personalizar Meu Perfil">
                            ${avatarHtml}
                            <strong style="color: var(--accent-color, #facc15); font-size: 0.95rem;">${usuario.nome}</strong>
                        </a>
                        <button onclick="Auth.fazerLogout()" style="background: transparent; border: 1px solid var(--border-color, #444); color: var(--text-muted, #94a3b8); padding: 5px 10px; border-radius: 6px; font-size: 0.82rem; cursor: pointer; transition: all 0.2s;" title="Sair da Guilda">Sair</button>
                    </div>
                `;
            } else {
                slot.outerHTML = `
                    <a href="login.html" class="btn-login" style="margin-left: 15px;">Entrar</a>
                `;
            }
        });

        // Preenche campos de autor se existirem na página
        if (usuario) {
            const autorLivro = document.getElementById('usuarioNome');
            if (autorLivro && !autorLivro.value) autorLivro.value = usuario.nome;

            const comentarioUsuario = document.getElementById('comentarioUsuario');
            if (comentarioUsuario && !comentarioUsuario.value) comentarioUsuario.value = usuario.nome;

            const novoTopicoAutor = document.getElementById('novoTopicoAutor');
            if (novoTopicoAutor && !novoTopicoAutor.value) novoTopicoAutor.value = usuario.nome;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.atualizarInterface();
});

// Arquivo: auth.js - Gerenciador de Autenticação, Recuperação de Senha e Controle de Acesso Admin

const Auth = {
    CHAVE_STORAGE: 'draconica_usuario_logado',

    getBaseUrl() {
        if (typeof window !== 'undefined' && window.location.origin && window.location.origin.startsWith('http')) {
            return '';
        }
        return 'http://localhost:5000';
    },

    getUsuario() {
        try {
            const salvo = localStorage.getItem(this.CHAVE_STORAGE);
            return salvo ? JSON.parse(salvo) : null;
        } catch {
            return null;
        }
    },

    ehAdmin() {
        const u = this.getUsuario();
        return !!(u && (u.is_admin === true || (u.email && u.email.toLowerCase() === 'admbiblioteca@gmail.com')));
    },

    salvarUsuario(usuario) {
        // Assegura flag is_admin se for o email oficial do admin
        if (usuario && usuario.email && usuario.email.toLowerCase() === 'admbiblioteca@gmail.com') {
            usuario.is_admin = true;
        }
        localStorage.setItem(this.CHAVE_STORAGE, JSON.stringify(usuario));
        this.atualizarInterface();
    },

    fazerLogout() {
        localStorage.removeItem(this.CHAVE_STORAGE);
        this.atualizarInterface();
        if (window.location.pathname.includes('login.html') || window.location.pathname.includes('perfil.html') || window.location.pathname.includes('cadastrar-livro.html') || window.location.pathname.includes('central-admin.html')) {
            window.location.href = 'inicial.html';
        } else {
            alert('Você saiu da sua conta.');
            window.location.reload();
        }
    },

    // Renderiza o avatar
    renderAvatar(avatar, tamanho = 28) {
        if (!avatar) avatar = '🧙‍♂️';
        const isImagem = avatar.startsWith('data:image') || avatar.startsWith('http') || avatar.includes('/');
        if (isImagem) {
            return `<img src="${avatar}" alt="Avatar" style="width: ${tamanho}px; height: ${tamanho}px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-color, #facc15); vertical-align: middle; display: inline-block;">`;
        }
        return `<span style="font-size: ${Math.round(tamanho * 0.85)}px; line-height: 1; vertical-align: middle; display: inline-block;">${avatar}</span>`;
    },

    validarSenha(senha) {
        if (!senha || senha.length < 8) {
            return { valida: false, erro: 'A senha deve conter no mínimo 8 caracteres.' };
        }
        if (!/\d/.test(senha)) {
            return { valida: false, erro: 'A senha deve conter pelo menos um número.' };
        }
        if (!/[A-Z]/.test(senha)) {
            return { valida: false, erro: 'A senha deve conter pelo menos uma letra maiúscula.' };
        }
        if (!/[a-z]/.test(senha)) {
            return { valida: false, erro: 'A senha deve conter pelo menos uma letra minúscula.' };
        }
        if (!/[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\;'/~`]/.test(senha)) {
            return { valida: false, erro: 'A senha deve conter pelo menos um caractere especial (!@#$%^&* etc).' };
        }
        return { valida: true };
    },

    async login(email, senha) {
        email = (email || '').trim().toLowerCase();
        senha = (senha || '').trim();

        if (!email || !senha) {
            return { sucesso: false, erro: 'Email ou Senha incorreto' };
        }

        try {
            const res = await fetch(`${this.getBaseUrl()}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await res.json();
            if (res.ok && data.usuario) {
                if (email === 'admbiblioteca@gmail.com') {
                    data.usuario.is_admin = true;
                }
                this.salvarUsuario(data.usuario);
                return { sucesso: true, mensagem: data.mensagem, usuario: data.usuario };
            } else {
                return { sucesso: false, erro: data.erro || 'Email ou Senha incorreto' };
            }
        } catch {
            // Fallback offline
            if (email === 'admbiblioteca@gmail.com' && senha === 'AKhDd*M38DI0(d2N') {
                const adminUser = {
                    id: 999,
                    nome: 'Administrador da Guilda',
                    email: 'admbiblioteca@gmail.com',
                    avatar: '👑',
                    bio: 'Administrador supremo da Biblioteca Dracônica.',
                    status_jogo: 'em_campanha',
                    is_admin: true
                };
                this.salvarUsuario(adminUser);
                return { sucesso: true, mensagem: 'Login como Administrador realizado com sucesso!', usuario: adminUser };
            }

            const usuariosLocais = JSON.parse(localStorage.getItem('draconica_usuarios_db') || '[]');
            const encontrado = usuariosLocais.find(u => u.email.toLowerCase() === email && u.senha === senha);
            if (encontrado) {
                const u = { 
                    id: encontrado.id, 
                    nome: encontrado.nome, 
                    email: encontrado.email, 
                    avatar: encontrado.avatar || '⚔️',
                    bio: encontrado.bio || '',
                    status_jogo: encontrado.status_jogo || 'procurando_campanha',
                    is_admin: !!encontrado.is_admin
                };
                this.salvarUsuario(u);
                return { sucesso: true, mensagem: `Saudações, ${u.nome}!`, usuario: u };
            }

            return { sucesso: false, erro: 'Email ou Senha incorreto' };
        }
    },

    async register(nome, email, senha, avatar = '⚔️') {
        nome = (nome || '').trim();
        email = (email || '').trim().toLowerCase();

        const checagemSenha = this.validarSenha(senha);
        if (!checagemSenha.valida) {
            return { sucesso: false, erro: checagemSenha.erro };
        }

        try {
            const res = await fetch(`${this.getBaseUrl()}/api/auth/register`, {
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
            const usuariosLocais = JSON.parse(localStorage.getItem('draconica_usuarios_db') || '[]');
            if (usuariosLocais.some(u => u.email.toLowerCase() === email)) {
                return { sucesso: false, erro: 'Este email já está cadastrado na guilda.' };
            }

            const novo = { 
                id: Date.now(), 
                nome, 
                email, 
                senha, 
                avatar, 
                bio: 'Aventureiro recém-chegado à guilda.', 
                status_jogo: 'procurando_campanha',
                is_admin: false
            };
            usuariosLocais.push(novo);
            localStorage.setItem('draconica_usuarios_db', JSON.stringify(usuariosLocais));

            const usuarioSessao = { 
                id: novo.id, 
                nome, 
                email, 
                avatar, 
                bio: novo.bio, 
                status_jogo: novo.status_jogo,
                is_admin: false
            };
            this.salvarUsuario(usuarioSessao);
            return { sucesso: true, mensagem: 'Cadastro na guilda concluído com sucesso!', usuario: usuarioSessao };
        }
    },

    async recuperarSenha(email) {
        email = (email || '').trim().toLowerCase();
        if (!email) {
            return { sucesso: false, erro: 'Por favor, informe seu email ou Gmail.' };
        }

        try {
            const res = await fetch(`${this.getBaseUrl()}/api/auth/recuperar-senha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            if (res.ok) {
                return { sucesso: true, mensagem: data.mensagem, token: data.token, email: data.email };
            } else {
                return { sucesso: false, erro: data.erro || 'Falha ao solicitar recuperação.' };
            }
        } catch {
            const usuariosLocais = JSON.parse(localStorage.getItem('draconica_usuarios_db') || '[]');
            const existe = (email === 'admbiblioteca@gmail.com') || usuariosLocais.some(u => u.email.toLowerCase() === email);
            if (existe) {
                const tokenFake = 'tk_' + Math.random().toString(36).substring(2, 10);
                return { sucesso: true, mensagem: 'Confirme aqui para alterar a senha', token: tokenFake, email };
            }
            return { sucesso: false, erro: 'Email não encontrado na guilda.' };
        }
    },

    async redefinirSenha(email, novaSenha, confirmarSenha, token = '') {
        email = (email || '').trim().toLowerCase();
        if (!email || !novaSenha || !confirmarSenha) {
            return { sucesso: false, erro: 'Preencha todos os campos obrigatórios.' };
        }
        if (novaSenha !== confirmarSenha) {
            return { sucesso: false, erro: 'A nova senha e a confirmação não coincidem.' };
        }

        const checagemSenha = this.validarSenha(novaSenha);
        if (!checagemSenha.valida) {
            return { sucesso: false, erro: checagemSenha.erro };
        }

        try {
            const res = await fetch(`${this.getBaseUrl()}/api/auth/redefinir-senha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, nova_senha: novaSenha, confirmar_senha: confirmarSenha, token })
            });

            const data = await res.json();
            if (res.ok) {
                return { sucesso: true, mensagem: data.mensagem };
            } else {
                return { sucesso: false, erro: data.erro || 'Erro ao alterar a senha.' };
            }
        } catch {
            const usuariosLocais = JSON.parse(localStorage.getItem('draconica_usuarios_db') || '[]');
            const idx = usuariosLocais.findIndex(u => u.email.toLowerCase() === email);
            if (idx !== -1) {
                usuariosLocais[idx].senha = novaSenha;
                localStorage.setItem('draconica_usuarios_db', JSON.stringify(usuariosLocais));
                return { sucesso: true, mensagem: 'Senha alterada com sucesso! Você já pode entrar com sua nova senha.' };
            }
            if (email === 'admbiblioteca@gmail.com') {
                return { sucesso: true, mensagem: 'Senha de Administrador alterada localmente com sucesso!' };
            }
            return { sucesso: false, erro: 'Email não encontrado.' };
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
            const res = await fetch(`${this.getBaseUrl()}/api/usuarios/perfil`, {
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
            const usuarioNovo = {
                ...usuarioAtual,
                nome: payload.nome,
                avatar: payload.avatar,
                bio: payload.bio,
                status_jogo: payload.status_jogo
            };
            this.salvarUsuario(usuarioNovo);
            return { sucesso: true, mensagem: 'Perfil atualizado localmente com sucesso!', usuario: usuarioNovo };
        }
    },

    atualizarInterface() {
        const usuario = this.getUsuario();
        const isAdmin = this.ehAdmin();

        // Gerenciamento da Central de Administradores no menu:
        // A REGRA: A Central de Administradores SÓ PODE APARECER PARA CONTAS ADMINS (ADMBIBLIOTECA@gmail.com)!
        const navBars = document.querySelectorAll('header.navbar nav');
        navBars.forEach(nav => {
            // Remove qualquer link existente de admin caso o usuário não seja admin
            const linksAdminExistentes = nav.querySelectorAll('.nav-admin-link, a[href*="central-admin.html"]');
            if (!isAdmin) {
                linksAdminExistentes.forEach(el => {
                    if (el.tagName === 'LI') el.remove();
                    else el.remove();
                });
            } else if (linksAdminExistentes.length === 0) {
                // Usuário é admin! Adiciona o botão da Central de Administradores
                const ul = nav.querySelector('ul');
                if (ul) {
                    const li = document.createElement('li');
                    li.className = 'nav-admin-link';
                    li.innerHTML = `<a href="central-admin.html" style="color: #ef4444; font-weight: bold;"><i class="fa-solid fa-shield-halved"></i> Central Admin</a>`;
                    const slotPerfil = ul.querySelector('a[href*="perfil.html"]');
                    if (slotPerfil && slotPerfil.parentElement) {
                        ul.insertBefore(li, slotPerfil.parentElement);
                    } else {
                        ul.appendChild(li);
                    }
                } else {
                    const a = document.createElement('a');
                    a.href = 'central-admin.html';
                    a.className = 'nav-admin-link';
                    a.style.color = '#ef4444';
                    a.style.fontWeight = 'bold';
                    a.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Central Admin`;
                    const slotPerfil = nav.querySelector('a[href*="perfil.html"]');
                    if (slotPerfil) {
                        nav.insertBefore(a, slotPerfil);
                    } else {
                        nav.appendChild(a);
                    }
                }
            }
        });

        const loginLinks = document.querySelectorAll('.btn-login, .nav-auth-slot');
        loginLinks.forEach(slot => {
            if (usuario) {
                const avatarHtml = this.renderAvatar(usuario.avatar, 28);
                slot.outerHTML = `
                    <div class="nav-auth-slot" style="display: inline-flex; align-items: center; gap: 10px; margin-left: 15px;">
                        <a href="perfil.html" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: inherit; padding: 4px 10px; border-radius: 20px; background: var(--badge-bg); border: 1px solid var(--badge-border); transition: transform 0.2s;" title="Ver e Personalizar Meu Perfil">
                            ${avatarHtml}
                            <strong style="color: ${isAdmin ? '#ef4444' : 'var(--accent-color, #facc15)'}; font-size: 0.95rem;">${usuario.nome}${isAdmin ? ' (Admin)' : ''}</strong>
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

        if (usuario) {
            const autorLivro = document.getElementById('livroAutor') || document.getElementById('usuarioNome');
            if (autorLivro && !autorLivro.value) autorLivro.value = usuario.nome;

            const comentarioUsuario = document.getElementById('comentarioUsuario');
            if (comentarioUsuario && !comentarioUsuario.value) comentarioUsuario.value = usuario.nome;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.atualizarInterface();
});

// Arquivo: auth.js - Gerenciador de Autenticação (Login e Registro)

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
        // Se estiver na tela de login, recarrega
        if (window.location.pathname.includes('login.html')) {
            window.location.reload();
        } else {
            alert('Você saiu da sua conta de aventureiro.');
            window.location.reload();
        }
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
                const u = { id: 1, nome: 'Mestre dos Magos', email, avatar: '🧙‍♂️' };
                this.salvarUsuario(u);
                return { sucesso: true, mensagem: 'Login offline como Mestre realizado!', usuario: u };
            }

            const encontrado = usuariosLocais.find(u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha);
            if (encontrado) {
                const u = { id: encontrado.id, nome: encontrado.nome, email: encontrado.email, avatar: encontrado.avatar || '⚔️' };
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

            const novo = { id: Date.now(), nome, email, senha, avatar };
            usuariosLocais.push(novo);
            localStorage.setItem('draconica_usuarios_db', JSON.stringify(usuariosLocais));

            const usuarioSessao = { id: novo.id, nome, email, avatar };
            this.salvarUsuario(usuarioSessao);
            return { sucesso: true, mensagem: 'Cadastro na guilda concluído com sucesso!', usuario: usuarioSessao };
        }
    },

    atualizarInterface() {
        const usuario = this.getUsuario();
        const loginLinks = document.querySelectorAll('.btn-login, .nav-auth-slot');

        loginLinks.forEach(slot => {
            if (usuario) {
                slot.outerHTML = `
                    <div class="nav-auth-slot" style="display: inline-flex; align-items: center; gap: 8px; margin-left: 15px;">
                        <span style="font-size: 1.1rem;">${usuario.avatar || '⚔️'}</span>
                        <strong style="color: var(--accent-color, #facc15); font-size: 0.95rem;">${usuario.nome}</strong>
                        <button onclick="Auth.fazerLogout()" style="background: transparent; border: 1px solid var(--border-color, #444); color: var(--text-muted, #94a3b8); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; margin-left: 4px;" title="Sair da Guilda">Sair</button>
                    </div>
                `;
            } else {
                // Se era nav-auth-slot e deslogou, volta a ser o botão entrar
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

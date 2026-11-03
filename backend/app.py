import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from database import init_db, get_db_connection

# Diretórios base
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
FRONTEND_DIR = os.path.join(PROJECT_ROOT, 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app)

# Inicializa o banco de dados SQLite
init_db()

# ================= ROTAS DE ARQUIVOS ESTÁTICOS =================

@app.route('/')
def home():
    """Redireciona para a página inicial."""
    return send_from_directory(os.path.join(FRONTEND_DIR, 'index'), 'inicial.html')

@app.route('/<path:filename>')
def serve_frontend_files(filename):
    """Serve arquivos HTML, CSS, JS e imagens da aplicação."""
    # Procura na pasta index (arquivos HTML)
    index_file = os.path.join(FRONTEND_DIR, 'index', filename)
    if os.path.isfile(index_file):
        return send_from_directory(os.path.join(FRONTEND_DIR, 'index'), filename)
    
    # Procura em todo o frontend
    full_path = os.path.join(FRONTEND_DIR, filename)
    if os.path.isfile(full_path):
        return send_from_directory(FRONTEND_DIR, filename)

    # Caso arquivo não seja encontrado diretamente
    return jsonify({"erro": "Arquivo não encontrado", "caminho": filename}), 404


# ================= ROTAS DE AUTENTICAÇÃO (LOGIN & REGISTRO) =================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Registra uma nova conta de aventureiro."""
    dados = request.get_json() or {}
    nome = dados.get('nome', '').strip()
    email = dados.get('email', '').strip().lower()
    senha = dados.get('senha', '').strip()
    avatar = dados.get('avatar', '🧙‍♂️')

    if not nome or not email or not senha:
        return jsonify({"erro": "Preencha todos os campos obrigatórios (nome, email e senha)."}), 400

    if len(senha) < 4:
        return jsonify({"erro": "A senha deve conter no mínimo 4 caracteres."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM usuarios WHERE email = ?', (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"erro": "Este email já está cadastrado na guilda."}), 409

    senha_hash = generate_password_hash(senha)
    cursor.execute('''
        INSERT INTO usuarios (nome, email, senha_hash, avatar, bio, status_jogo)
        VALUES (?, ?, ?, ?, '', 'procurando_campanha')
    ''', (nome, email, senha_hash, avatar))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        "mensagem": "Cadastro realizado com sucesso! Bem-vindo à guilda.",
        "usuario": {
            "id": user_id,
            "nome": nome,
            "email": email,
            "avatar": avatar,
            "bio": "",
            "status_jogo": "procurando_campanha"
        }
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Autentica o aventureiro no sistema."""
    dados = request.get_json() or {}
    email = dados.get('email', '').strip().lower()
    senha = dados.get('senha', '').strip()

    if not email or not senha:
        return jsonify({"erro": "Email e senha são obrigatórios."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM usuarios WHERE email = ?', (email,))
    usuario = cursor.fetchone()
    conn.close()

    if not usuario or not check_password_hash(usuario['senha_hash'], senha):
        return jsonify({"erro": "Email ou senha incorretos."}), 401

    return jsonify({
        "mensagem": f"Saudações, {usuario['nome']}! Login realizado com sucesso.",
        "usuario": {
            "id": usuario['id'],
            "nome": usuario['nome'],
            "email": usuario['email'],
            "avatar": usuario['avatar'],
            "bio": usuario['bio'] if 'bio' in usuario.keys() and usuario['bio'] else "",
            "status_jogo": usuario['status_jogo'] if 'status_jogo' in usuario.keys() and usuario['status_jogo'] else "procurando_campanha"
        }
    })


# ================= ROTAS DA API: LIVROS & CATÁLOGO DINÂMICO =================

@app.route('/api/livros', methods=['GET'])
def listar_livros():
    """
    Retorna todos os livros de RPG do acervo com suporte a filtros completos:
    - tipo_jogo: JJRPG, Fantasia Medieval, Horror Cósmico, Cyberpunk, etc.
    - tipo_link: compra, financiamento ou todos
    - sistema: D&D 5E, Fabula Ultima, Tormenta 20, etc.
    - busca: termo de busca em título, autor, sinopse, sistema e tipo_jogo
    """
    busca = request.args.get('busca', '').strip()
    sistema = request.args.get('sistema', '').strip()
    tipo_jogo = request.args.get('tipo_jogo', '').strip()
    tipo_link = request.args.get('tipo_link', '').strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    query = '''
        SELECT l.*, 
               COALESCE(AVG(a.nota), 0) AS media_nota,
               COUNT(a.id) AS total_avaliacoes
        FROM livros l
        LEFT JOIN avaliacoes a ON l.id = a.livro_id
        WHERE 1=1
    '''
    params = []

    if busca:
        query += ' AND (l.titulo LIKE ? OR l.autor LIKE ? OR l.sinopse LIKE ? OR l.categoria LIKE ? OR l.sistema LIKE ? OR l.tipo_jogo LIKE ?)'
        busca_termo = f'%{busca}%'
        params.extend([busca_termo, busca_termo, busca_termo, busca_termo, busca_termo, busca_termo])

    if sistema and sistema.lower() != 'todos':
        query += ' AND l.sistema = ?'
        params.append(sistema)

    if tipo_jogo and tipo_jogo.lower() != 'todos':
        query += ' AND l.tipo_jogo = ?'
        params.append(tipo_jogo)

    if tipo_link and tipo_link.lower() != 'todos':
        if tipo_link.lower() == 'compra':
            query += " AND l.tipo_link = 'compra'"
        elif tipo_link.lower() == 'financiamento':
            query += " AND l.tipo_link = 'financiamento'"

    query += ' GROUP BY l.id ORDER BY l.id ASC'

    cursor.execute(query, params)
    livros = [dict(row) for row in cursor.fetchall()]
    conn.close()

    for livro in livros:
        livro['media_nota'] = round(livro['media_nota'], 1)

    return jsonify(livros)


@app.route('/api/livros/catalogo-completo', methods=['GET'])
def catalogo_completo():
    """
    Retorna todos os livros agrupados por tópicos de Tipo de Jogo (ex: JJRPG, Fantasia Medieval),
    com contagem de livros para compra direta e em financiamento coletivo.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT l.*, 
               COALESCE(AVG(a.nota), 0) AS media_nota,
               COUNT(a.id) AS total_avaliacoes
        FROM livros l
        LEFT JOIN avaliacoes a ON l.id = a.livro_id
        GROUP BY l.id
        ORDER BY l.tipo_jogo ASC, l.id ASC
    ''')
    todos_livros = [dict(row) for row in cursor.fetchall()]
    conn.close()

    for livro in todos_livros:
        livro['media_nota'] = round(livro['media_nota'], 1)

    # Agrupa por tipo de jogo
    grupos = {}
    total_compra = 0
    total_financiamento = 0

    for l in todos_livros:
        tj = l.get('tipo_jogo') or 'Geral'
        if tj not in grupos:
            grupos[tj] = []
        grupos[tj].append(l)

        if l.get('tipo_link') == 'compra':
            total_compra += 1
        elif l.get('tipo_link') == 'financiamento':
            total_financiamento += 1

    return jsonify({
        "total_livros": len(todos_livros),
        "total_compra": total_compra,
        "total_financiamento": total_financiamento,
        "grupos_por_tipo": grupos,
        "livros": todos_livros
    })


@app.route('/api/livros', methods=['POST'])
def adicionar_livro():
    """Cadastra um novo livro de RPG no catálogo da guilda."""
    dados = request.get_json() or {}
    titulo = dados.get('titulo', '').strip()
    autor = dados.get('autor', '').strip()
    sistema = dados.get('sistema', '').strip()
    tipo_jogo = dados.get('tipo_jogo', 'Fantasia Medieval').strip()
    categoria = dados.get('categoria', 'Manual Principal').strip()
    sinopse = dados.get('sinopse', '').strip()
    capa_url = dados.get('capa_url', '').strip() or '../imagens/livro do jogador dnd.jpg.jpeg'
    link_compra = dados.get('link_compra', '').strip() or None
    tipo_link = dados.get('tipo_link', None) # 'compra', 'financiamento' ou None

    if not titulo or not autor or not sistema:
        return jsonify({"erro": "Título, autor e sistema são obrigatórios."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO livros (titulo, autor, sistema, tipo_jogo, categoria, sinopse, capa_url, link_compra, tipo_link, downloads)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ''', (titulo, autor, sistema, tipo_jogo, categoria, sinopse, capa_url, link_compra, tipo_link))
    livro_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        "mensagem": "Livro de RPG adicionado com sucesso ao catálogo!",
        "livro_id": livro_id
    }), 201


@app.route('/api/tipos-jogo', methods=['GET'])
def listar_tipos_jogo():
    """Retorna os tipos de jogo disponíveis no catálogo e contagem de grimórios."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT tipo_jogo, 
               COUNT(id) as total_livros,
               SUM(CASE WHEN tipo_link = 'compra' THEN 1 ELSE 0 END) as total_compra,
               SUM(CASE WHEN tipo_link = 'financiamento' THEN 1 ELSE 0 END) as total_financiamento
        FROM livros
        GROUP BY tipo_jogo
        ORDER BY total_livros DESC
    ''')
    tipos = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify(tipos)


@app.route('/api/livros/<int:livro_id>', methods=['GET'])
def obter_livro(livro_id):
    """Retorna os detalhes de um livro específico, links de compra e resenhas."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM livros WHERE id = ?', (livro_id,))
    livro = cursor.fetchone()

    if not livro:
        conn.close()
        return jsonify({"erro": "Livro não encontrado."}), 404

    livro_dict = dict(livro)

    # Buscar avaliações e comentários deste livro
    cursor.execute('''
        SELECT id, usuario, nota, comentario, data_criacao 
        FROM avaliacoes 
        WHERE livro_id = ? 
        ORDER BY data_criacao DESC
    ''', (livro_id,))
    avaliacoes = [dict(row) for row in cursor.fetchall()]

    if avaliacoes:
        media = sum(a['nota'] for a in avaliacoes) / len(avaliacoes)
        livro_dict['media_nota'] = round(media, 1)
        livro_dict['total_avaliacoes'] = len(avaliacoes)
    else:
        livro_dict['media_nota'] = 0.0
        livro_dict['total_avaliacoes'] = 0

    livro_dict['avaliacoes'] = avaliacoes
    conn.close()

    return jsonify(livro_dict)


@app.route('/api/livros/<int:livro_id>/avaliar', methods=['POST'])
def avaliar_livro(livro_id):
    """Registra uma avaliação com nota (1-5) e comentário."""
    dados = request.get_json() or {}
    usuario = dados.get('usuario', '').strip() or 'Aventureiro Anônimo'
    nota = dados.get('nota')
    comentario = dados.get('comentario', '').strip()

    if nota is None:
        return jsonify({"erro": "Nota é obrigatória."}), 400

    try:
        nota = int(nota)
        if nota < 1 or nota > 5:
            raise ValueError()
    except (ValueError, TypeError):
        return jsonify({"erro": "A nota deve ser um número inteiro de 1 a 5."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM livros WHERE id = ?', (livro_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"erro": "Livro não encontrado."}), 404

    cursor.execute('''
        INSERT INTO avaliacoes (livro_id, usuario, nota, comentario)
        VALUES (?, ?, ?, ?)
    ''', (livro_id, usuario, nota, comentario))
    conn.commit()

    # Recalcula média
    cursor.execute('''
        SELECT AVG(nota) as media, COUNT(id) as total 
        FROM avaliacoes 
        WHERE livro_id = ?
    ''', (livro_id,))
    stats = cursor.fetchone()
    conn.close()

    return jsonify({
        "mensagem": "Avaliação e resenha gravadas nos arquivos da guilda!",
        "media_nota": round(stats['media'], 1) if stats['media'] else nota,
        "total_avaliacoes": stats['total']
    }), 201


@app.route('/api/livros/<int:livro_id>/download', methods=['POST'])
@app.route('/api/livros/<int:livro_id>/click', methods=['POST'])
def registrar_clique(livro_id):
    """Contabiliza interesse/cliques no livro."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE livros SET downloads = downloads + 1 WHERE id = ?', (livro_id,))
    conn.commit()
    cursor.execute('SELECT downloads FROM livros WHERE id = ?', (livro_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"erro": "Livro não encontrado."}), 404
    return jsonify({"mensagem": "Interesse contabilizado com sucesso!", "downloads": row['downloads']})


# ================= ROTAS DA API: FÓRUM COM AVALIAÇÃO E COMENTÁRIOS =================

@app.route('/api/forum/topicos', methods=['GET'])
def listar_topicos_forum():
    """Lista tópicos do fórum com filtro opcional por sistema e média de notas."""
    sistema = request.args.get('sistema', '').strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    query = '''
        SELECT t.*,
               COUNT(c.id) AS total_comentarios,
               COALESCE(AVG(c.avaliacao), 5.0) AS media_avaliacao
        FROM forum_topicos t
        LEFT JOIN forum_comentarios c ON t.id = c.topico_id
        WHERE 1=1
    '''
    params = []

    if sistema and sistema.lower() != 'todos':
        if sistema.upper() in ['JJRPG', 'JRPG']:
            query += " AND (t.sistema = 'JJRPG' OR t.sistema LIKE '%Fabula%' OR t.sistema LIKE '%Ryuutama%' OR t.titulo LIKE '%JJRPG%' OR t.titulo LIKE '%JRPG%')"
        else:
            query += ' AND t.sistema = ?'
            params.append(sistema)

    query += ' GROUP BY t.id ORDER BY t.data_criacao DESC'

    cursor.execute(query, params)
    topicos = [dict(row) for row in cursor.fetchall()]
    conn.close()

    for t in topicos:
        t['media_avaliacao'] = round(t['media_avaliacao'], 1)

    return jsonify(topicos)


@app.route('/api/forum/topicos', methods=['POST'])
def criar_topico_forum():
    """Cria um novo tópico de discussão no fórum."""
    dados = request.get_json() or {}
    titulo = dados.get('titulo', '').strip()
    autor = dados.get('autor', '').strip() or 'Bardo Viajante'
    sistema = dados.get('sistema', '').strip() or 'Geral'
    conteudo = dados.get('conteudo', '').strip()

    if not titulo or not conteudo:
        return jsonify({"erro": "Título e conteúdo do tópico são obrigatórios."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO forum_topicos (titulo, autor, sistema, conteudo)
        VALUES (?, ?, ?, ?)
    ''', (titulo, autor, sistema, conteudo))
    topico_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        "mensagem": "Tópico criado com sucesso!",
        "id": topico_id
    }), 201


@app.route('/api/forum/topicos/<int:topico_id>', methods=['GET'])
def obter_topico_forum(topico_id):
    """Retorna detalhes do tópico e todos os seus comentários com avaliação."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM forum_topicos WHERE id = ?', (topico_id,))
    topico = cursor.fetchone()

    if not topico:
        conn.close()
        return jsonify({"erro": "Tópico não encontrado."}), 404

    topico_dict = dict(topico)

    cursor.execute('''
        SELECT id, usuario, texto, avaliacao, data_criacao
        FROM forum_comentarios
        WHERE topico_id = ?
        ORDER BY data_criacao ASC
    ''', (topico_id,))
    comentarios = [dict(row) for row in cursor.fetchall()]

    if comentarios:
        media = sum(c['avaliacao'] for c in comentarios) / len(comentarios)
        topico_dict['media_avaliacao'] = round(media, 1)
        topico_dict['total_comentarios'] = len(comentarios)
    else:
        topico_dict['media_avaliacao'] = 5.0
        topico_dict['total_comentarios'] = 0

    topico_dict['comentarios'] = comentarios
    conn.close()

    return jsonify(topico_dict)


@app.route('/api/forum/topicos/<int:topico_id>/comentarios', methods=['POST'])
def adicionar_comentario_forum(topico_id):
    """Adiciona um comentário com avaliação (1 a 5 estrelas) a um tópico do fórum."""
    dados = request.get_json() or {}
    usuario = dados.get('usuario', '').strip() or 'Aventureiro'
    texto = dados.get('texto', '').strip()
    avaliacao = dados.get('avaliacao', 5)

    if not texto:
        return jsonify({"erro": "O texto do comentário não pode estar vazio."}), 400

    try:
        avaliacao = int(avaliacao)
        if avaliacao < 1 or avaliacao > 5:
            avaliacao = 5
    except (ValueError, TypeError):
        avaliacao = 5

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM forum_topicos WHERE id = ?', (topico_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"erro": "Tópico não encontrado."}), 404

    cursor.execute('''
        INSERT INTO forum_comentarios (topico_id, usuario, texto, avaliacao)
        VALUES (?, ?, ?, ?)
    ''', (topico_id, usuario, texto, avaliacao))
    conn.commit()

    cursor.execute('''
        SELECT id, usuario, texto, avaliacao, data_criacao
        FROM forum_comentarios
        WHERE topico_id = ?
        ORDER BY data_criacao DESC
    ''', (topico_id,))
    comentarios = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify({
        "mensagem": "Comentário e avaliação adicionados com sucesso!",
        "comentarios": comentarios
    }), 201


@app.route('/api/forum/topicos/<int:topico_id>', methods=['DELETE'])
def excluir_topico_forum(topico_id):
    """Exclui um tópico do fórum e seus comentários associados."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM forum_topicos WHERE id = ?', (topico_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"erro": "Tópico não encontrado."}), 404

    cursor.execute('DELETE FROM forum_comentarios WHERE topico_id = ?', (topico_id,))
    cursor.execute('DELETE FROM forum_topicos WHERE id = ?', (topico_id,))
    conn.commit()
    conn.close()

    return jsonify({"mensagem": "Tópico e comentários removidos com sucesso!"})


# ================= ROTAS DE PERSONALIZAÇÃO DE PERFIL E ATIVIDADES =================

@app.route('/api/usuarios/perfil', methods=['GET'])
@app.route('/api/usuarios/perfil/<int:user_id>', methods=['GET'])
def obter_perfil_usuario(user_id=None):
    """Retorna os dados do perfil do usuário por ID, Email ou Nome."""
    if not user_id:
        user_id = request.args.get('id')
    email = request.args.get('email', '').strip().lower()
    nome = request.args.get('nome', '').strip()

    if not user_id and not email and not nome:
        return jsonify({"erro": "Parâmetro id, email ou nome é obrigatório."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    if user_id:
        cursor.execute('SELECT id, nome, email, avatar, bio, status_jogo, data_criacao FROM usuarios WHERE id = ?', (user_id,))
    elif email:
        cursor.execute('SELECT id, nome, email, avatar, bio, status_jogo, data_criacao FROM usuarios WHERE LOWER(email) = LOWER(?)', (email,))
    else:
        cursor.execute('SELECT id, nome, email, avatar, bio, status_jogo, data_criacao FROM usuarios WHERE LOWER(nome) = LOWER(?)', (nome,))
        row = cursor.fetchone()
        if not row:
            cursor.execute('SELECT id, nome, email, avatar, bio, status_jogo, data_criacao FROM usuarios WHERE LOWER(nome) LIKE LOWER(?) LIMIT 1', (f'%{nome}%',))

    usuario = cursor.fetchone()
    conn.close()

    if not usuario:
        return jsonify({"erro": "Aventureiro não encontrado."}), 404

    u_dict = dict(usuario)
    if not u_dict.get('bio'):
        u_dict['bio'] = ''
    if not u_dict.get('status_jogo'):
        u_dict['status_jogo'] = 'procurando_campanha'

    return jsonify(u_dict)


@app.route('/api/usuarios/perfil', methods=['PUT'])
def atualizar_perfil_usuario():
    """Atualiza o perfil do usuário: nome, avatar (upload/emoji), bio e status_jogo."""
    dados = request.get_json() or {}
    user_id = dados.get('id')
    email = dados.get('email', '').strip().lower()
    novo_nome = dados.get('nome', '').strip()
    novo_avatar = dados.get('avatar', '').strip()
    nova_bio = dados.get('bio', '').strip()
    novo_status = dados.get('status_jogo', '').strip()

    if not user_id and not email:
        return jsonify({"erro": "Identificador do usuário (id ou email) é obrigatório."}), 400

    if not novo_nome:
        return jsonify({"erro": "O nome do aventureiro não pode ficar em branco."}), 400

    # Validação do status de jogo
    status_permitidos = ['procurando_campanha', 'procurando_jogadores', 'em_campanha']
    if novo_status and novo_status not in status_permitidos:
        novo_status = 'procurando_campanha'

    conn = get_db_connection()
    cursor = conn.cursor()

    # Localiza o usuário
    if user_id:
        cursor.execute('SELECT id, nome FROM usuarios WHERE id = ?', (user_id,))
    else:
        cursor.execute('SELECT id, nome FROM usuarios WHERE email = ?', (email,))
    
    usuario_antigo = cursor.fetchone()
    if not usuario_antigo:
        conn.close()
        return jsonify({"erro": "Usuário não encontrado."}), 404

    u_id = usuario_antigo['id']
    nome_antigo = usuario_antigo['nome']

    # Se o nome mudou, podemos sincronizar também os tópicos e comentários anteriores do usuário
    if novo_nome != nome_antigo:
        cursor.execute('UPDATE forum_topicos SET autor = ? WHERE autor = ?', (novo_nome, nome_antigo))
        cursor.execute('UPDATE forum_comentarios SET usuario = ? WHERE usuario = ?', (novo_nome, nome_antigo))
        cursor.execute('UPDATE avaliacoes SET usuario = ? WHERE usuario = ?', (novo_nome, nome_antigo))

    # Atualiza o perfil
    cursor.execute('''
        UPDATE usuarios 
        SET nome = ?, avatar = COALESCE(NULLIF(?, ''), avatar), bio = ?, status_jogo = ?
        WHERE id = ?
    ''', (novo_nome, novo_avatar, nova_bio, novo_status, u_id))
    conn.commit()

    cursor.execute('SELECT id, nome, email, avatar, bio, status_jogo, data_criacao FROM usuarios WHERE id = ?', (u_id,))
    usuario_atualizado = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "mensagem": "Perfil do aventureiro atualizado com sucesso!",
        "usuario": usuario_atualizado
    })


@app.route('/api/usuarios/atividades', methods=['GET'])
def atividades_usuario():
    """Retorna os tópicos criados, tópicos respondidos e avaliações feitas pelo usuário."""
    nome = request.args.get('nome', '').strip()
    if not nome:
        return jsonify({"erro": "Nome do aventureiro é obrigatório."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Tópicos criados pelo usuário
    cursor.execute('''
        SELECT t.*, 
               COUNT(c.id) as total_comentarios, 
               COALESCE(AVG(c.avaliacao), 5.0) as media_avaliacao
        FROM forum_topicos t
        LEFT JOIN forum_comentarios c ON t.id = c.topico_id
        WHERE t.autor = ?
        GROUP BY t.id
        ORDER BY t.data_criacao DESC
    ''', (nome,))
    topicos_criados = [dict(row) for row in cursor.fetchall()]
    for t in topicos_criados:
        t['media_avaliacao'] = round(t['media_avaliacao'], 1)

    # 2. Tópicos onde o usuário comentou / respondeu (excluindo os que ele mesmo criou)
    cursor.execute('''
        SELECT DISTINCT t.id, t.titulo, t.sistema, t.autor, t.data_criacao,
               COUNT(all_c.id) as total_comentarios,
               COALESCE(AVG(all_c.avaliacao), 5.0) as media_avaliacao
        FROM forum_comentarios c
        JOIN forum_topicos t ON c.topico_id = t.id
        LEFT JOIN forum_comentarios all_c ON t.id = all_c.topico_id
        WHERE c.usuario = ? AND t.autor != ?
        GROUP BY t.id
        ORDER BY t.data_criacao DESC
    ''', (nome, nome))
    topicos_respondidos = [dict(row) for row in cursor.fetchall()]
    for t in topicos_respondidos:
        t['media_avaliacao'] = round(t['media_avaliacao'], 1)

    # 3. Avaliações feitas pelo usuário (em livros)
    cursor.execute('''
        SELECT a.id, a.livro_id, a.nota, a.comentario, a.data_criacao,
               l.titulo as livro_titulo, l.capa_url as livro_capa, l.sistema as livro_sistema
        FROM avaliacoes a
        JOIN livros l ON a.livro_id = l.id
        WHERE a.usuario = ?
        ORDER BY a.data_criacao DESC
    ''', (nome,))
    avaliacoes = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return jsonify({
        "usuario": nome,
        "topicos_criados": topicos_criados,
        "topicos_respondidos": topicos_respondidos,
        "avaliacoes": avaliacoes
    })




# ================= ROTAS DO SISTEMA DE MENSAGENS (MESSENGER / REDE SOCIAL) =================

@app.route('/mensagens.html')
def page_mensagens():
    """Serve a página do mensageiro da guilda."""
    return send_from_directory(os.path.join(FRONTEND_DIR, 'index'), 'mensagens.html')

@app.route('/api/usuarios', methods=['GET'])
def listar_usuarios():
    """Lista aventureiros cadastrados para iniciar chats privados ou adicionar a grupos."""
    busca = request.args.get('busca', '').strip()
    exceto_id = request.args.get('exceto_id', type=int)

    conn = get_db_connection()
    cursor = conn.cursor()

    query = 'SELECT id, nome, email, avatar, bio, status_jogo FROM usuarios WHERE 1=1'
    params = []

    if exceto_id:
        query += ' AND id != ?'
        params.append(exceto_id)

    if busca:
        query += ' AND (nome LIKE ? OR bio LIKE ?)'
        params.extend([f'%{busca}%', f'%{busca}%'])

    query += ' ORDER BY nome ASC'
    cursor.execute(query, params)
    usuarios = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify(usuarios)


@app.route('/api/mensagens/conversas', methods=['GET'])
def listar_conversas():
    """
    Lista conversas do usuário (tanto chats privados onde ele participa quanto grupos dos quais faz parte ou grupos públicos).
    """
    usuario_id = request.args.get('usuario_id', type=int)
    if not usuario_id:
        return jsonify({"erro": "Parâmetro usuario_id é obrigatório."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT DISTINCT c.id, c.tipo, c.nome_grupo, c.criador_id, c.foto_grupo, c.data_criacao, c.data_atualizacao
        FROM conversas c
        LEFT JOIN conversa_participantes cp ON c.id = cp.conversa_id
        WHERE cp.usuario_id = ? OR c.tipo = 'grupo'
        ORDER BY c.data_atualizacao DESC
    ''', (usuario_id,))
    conversas_rows = cursor.fetchall()

    resultado = []
    for crow in conversas_rows:
        cid = crow['id']
        tipo = crow['tipo']

        cursor.execute('''
            SELECT u.id, u.nome, u.avatar, u.status_jogo
            FROM conversa_participantes cp
            JOIN usuarios u ON cp.usuario_id = u.id
            WHERE cp.conversa_id = ?
        ''', (cid,))
        participantes = [dict(p) for p in cursor.fetchall()]

        cursor.execute('''
            SELECT remetente_id, remetente_nome, remetente_avatar, conteudo, data_envio
            FROM mensagens
            WHERE conversa_id = ?
            ORDER BY id DESC LIMIT 1
        ''', (cid,))
        ultima_msg = cursor.fetchone()

        nome_exibicao = crow['nome_grupo']
        avatar_exibicao = crow['foto_grupo'] or '🏰'
        status_jogo = None
        outro_usuario_id = None

        if tipo == 'privada':
            outro = next((p for p in participantes if p['id'] != usuario_id), None)
            if not outro and participantes:
                outro = participantes[0]
            if outro:
                nome_exibicao = outro['nome']
                avatar_exibicao = outro['avatar']
                status_jogo = outro['status_jogo']
                outro_usuario_id = outro['id']
            else:
                nome_exibicao = "Aventureiro"

        resultado.append({
            "id": cid,
            "tipo": tipo,
            "nome": nome_exibicao,
            "avatar": avatar_exibicao,
            "status_jogo": status_jogo,
            "outro_usuario_id": outro_usuario_id,
            "criador_id": crow['criador_id'],
            "total_participantes": len(participantes),
            "participantes": participantes,
            "ultima_mensagem": ultima_msg['conteudo'] if ultima_msg else "Nenhuma mensagem ainda.",
            "data_ultima_mensagem": ultima_msg['data_envio'] if ultima_msg else crow['data_criacao'],
            "remetente_ultima_mensagem": ultima_msg['remetente_nome'] if ultima_msg else None
        })

    conn.close()
    return jsonify(resultado)


@app.route('/api/mensagens/conversas', methods=['POST'])
def criar_conversa():
    """
    Cria uma nova conversa privada ou um grupo de aventureiros.
    """
    dados = request.get_json() or {}
    tipo = dados.get('tipo', 'privada')
    usuario_id = dados.get('usuario_id') or dados.get('criador_id')

    if not usuario_id:
        return jsonify({"erro": "usuario_id do remetente é obrigatório."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    if tipo == 'privada':
        destinatario_id = dados.get('destinatario_id')
        destinatario_nome = dados.get('destinatario_nome')
        if not destinatario_id and destinatario_nome:
            cursor.execute('SELECT id FROM usuarios WHERE LOWER(nome) = LOWER(?)', (destinatario_nome.strip(),))
            user_found = cursor.fetchone()
            if not user_found:
                cursor.execute('SELECT id FROM usuarios WHERE LOWER(nome) LIKE LOWER(?) LIMIT 1', (f'%{destinatario_nome.strip()}%',))
                user_found = cursor.fetchone()
            if user_found:
                destinatario_id = user_found['id']

        if not destinatario_id:
            conn.close()
            return jsonify({"erro": "destinatario_id é obrigatório para chat privado."}), 400

        cursor.execute('''
            SELECT c.id FROM conversas c
            JOIN conversa_participantes cp1 ON c.id = cp1.conversa_id AND cp1.usuario_id = ?
            JOIN conversa_participantes cp2 ON c.id = cp2.conversa_id AND cp2.usuario_id = ?
            WHERE c.tipo = 'privada'
            LIMIT 1
        ''', (usuario_id, destinatario_id))
        conversa_existente = cursor.fetchone()

        if conversa_existente:
            conversa_id = conversa_existente['id']
            conn.close()
            return jsonify({
                "mensagem": "Conversa existente recuperada.",
                "conversa_id": conversa_id,
                "ja_existia": True
            }), 200

        cursor.execute('''
            INSERT INTO conversas (tipo, nome_grupo, criador_id, foto_grupo)
            VALUES ('privada', '', ?, '👤')
        ''', (usuario_id,))
        conversa_id = cursor.lastrowid

        cursor.execute('INSERT INTO conversa_participantes (conversa_id, usuario_id) VALUES (?, ?)', (conversa_id, usuario_id))
        cursor.execute('INSERT INTO conversa_participantes (conversa_id, usuario_id) VALUES (?, ?)', (conversa_id, destinatario_id))
        conn.commit()
        conn.close()

        return jsonify({
            "mensagem": "Chat privado iniciado com sucesso!",
            "conversa_id": conversa_id,
            "ja_existia": False
        }), 201

    elif tipo == 'grupo':
        nome_grupo = dados.get('nome_grupo', '').strip()
        foto_grupo = dados.get('foto_grupo', '🛡️')
        participantes_ids = dados.get('participantes_ids', [])

        if not nome_grupo:
            conn.close()
            return jsonify({"erro": "Nome do grupo é obrigatório."}), 400

        cursor.execute('''
            INSERT INTO conversas (tipo, nome_grupo, criador_id, foto_grupo)
            VALUES ('grupo', ?, ?, ?)
        ''', (nome_grupo, usuario_id, foto_grupo))
        conversa_id = cursor.lastrowid

        cursor.execute('INSERT OR IGNORE INTO conversa_participantes (conversa_id, usuario_id) VALUES (?, ?)', (conversa_id, usuario_id))

        for pid in participantes_ids:
            if pid and pid != usuario_id:
                cursor.execute('INSERT OR IGNORE INTO conversa_participantes (conversa_id, usuario_id) VALUES (?, ?)', (conversa_id, pid))

        msg_inicial = dados.get('mensagem_inicial')
        if msg_inicial:
            cursor.execute('''
                INSERT INTO mensagens (conversa_id, remetente_id, remetente_nome, remetente_avatar, conteudo)
                VALUES (?, ?, ?, ?, ?)
            ''', (conversa_id, usuario_id, dados.get('criador_nome', 'Mestre do Grupo'), dados.get('criador_avatar', '🧙‍♂️'), msg_inicial))

        conn.commit()
        conn.close()

        return jsonify({
            "mensagem": f"Grupo '{nome_grupo}' criado com sucesso!",
            "conversa_id": conversa_id
        }), 201

    else:
        conn.close()
        return jsonify({"erro": f"Tipo de conversa inválido: {tipo}"}), 400


@app.route('/api/mensagens/conversas/<int:conversa_id>/mensagens', methods=['GET'])
def listar_mensagens_conversa(conversa_id):
    """
    Obtém todo o histórico de mensagens de uma conversa.
    """
    usuario_id = request.args.get('usuario_id', type=int)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM conversas WHERE id = ?', (conversa_id,))
    conversa = cursor.fetchone()
    if not conversa:
        conn.close()
        return jsonify({"erro": "Conversa não encontrada."}), 404

    if usuario_id and conversa['tipo'] == 'grupo':
        cursor.execute('INSERT OR IGNORE INTO conversa_participantes (conversa_id, usuario_id) VALUES (?, ?)', (conversa_id, usuario_id))
        conn.commit()

    cursor.execute('''
        SELECT u.id, u.nome, u.avatar, u.status_jogo
        FROM conversa_participantes cp
        JOIN usuarios u ON cp.usuario_id = u.id
        WHERE cp.conversa_id = ?
    ''', (conversa_id,))
    participantes = [dict(p) for p in cursor.fetchall()]

    cursor.execute('''
        SELECT id, conversa_id, remetente_id, remetente_nome, remetente_avatar, conteudo, data_envio
        FROM mensagens
        WHERE conversa_id = ?
        ORDER BY id ASC
    ''', (conversa_id,))
    mensagens = [dict(m) for m in cursor.fetchall()]

    conn.close()

    return jsonify({
        "conversa": dict(conversa),
        "participantes": participantes,
        "mensagens": mensagens
    })


@app.route('/api/mensagens/conversas/<int:conversa_id>/mensagens', methods=['POST'])
def enviar_mensagem(conversa_id):
    """
    Envia uma nova mensagem na conversa selecionada.
    """
    dados = request.get_json() or {}
    remetente_id = dados.get('remetente_id')
    remetente_nome = dados.get('remetente_nome', 'Aventureiro').strip()
    remetente_avatar = dados.get('remetente_avatar', '🧙‍♂️')
    conteudo = dados.get('conteudo', '').strip()

    if not conteudo:
        return jsonify({"erro": "O conteúdo da mensagem não pode ser vazio."}), 400

    if not remetente_id:
        return jsonify({"erro": "remetente_id é obrigatório."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id, tipo FROM conversas WHERE id = ?', (conversa_id,))
    conversa = cursor.fetchone()
    if not conversa:
        conn.close()
        return jsonify({"erro": "Conversa não encontrada."}), 404

    cursor.execute('INSERT OR IGNORE INTO conversa_participantes (conversa_id, usuario_id) VALUES (?, ?)', (conversa_id, remetente_id))

    cursor.execute('''
        INSERT INTO mensagens (conversa_id, remetente_id, remetente_nome, remetente_avatar, conteudo)
        VALUES (?, ?, ?, ?, ?)
    ''', (conversa_id, remetente_id, remetente_nome, remetente_avatar, conteudo))
    msg_id = cursor.lastrowid

    cursor.execute('UPDATE conversas SET data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?', (conversa_id,))
    conn.commit()

    cursor.execute('SELECT * FROM mensagens WHERE id = ?', (msg_id,))
    nova_msg = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "mensagem": "Mensagem enviada com sucesso!",
        "dados": nova_msg
    }), 201


@app.route('/api/mensagens/conversas/<int:conversa_id>/participantes', methods=['POST'])
def adicionar_participante(conversa_id):
    """Adiciona um aventureiro ao grupo."""
    dados = request.get_json() or {}
    usuario_id = dados.get('usuario_id')
    if not usuario_id:
        return jsonify({"erro": "usuario_id é obrigatório."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT OR IGNORE INTO conversa_participantes (conversa_id, usuario_id) VALUES (?, ?)', (conversa_id, usuario_id))
    conn.commit()
    conn.close()

    return jsonify({"mensagem": "Aventureiro adicionado ao grupo com sucesso!"}), 200


if __name__ == '__main__':
    print("=" * 60)
    print(">> BIBLIOTECA DRACONICA - SERVIDOR PYTHON EM EXECUCAO")
    print(">> Acesse: http://localhost:5000")
    print(">> Login/Registro: http://localhost:5000/login.html")
    print(">> API de Livros: http://localhost:5000/api/livros")
    print(">> API do Forum: http://localhost:5000/api/forum/topicos")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)

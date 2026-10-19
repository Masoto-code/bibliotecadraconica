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
        INSERT INTO usuarios (nome, email, senha_hash, avatar)
        VALUES (?, ?, ?, ?)
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
            "avatar": avatar
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
            "avatar": usuario['avatar']
        }
    })


# ================= ROTAS DA API: LIVROS =================

@app.route('/api/livros', methods=['GET'])
def listar_livros():
    """Retorna os livros com links de compra/financiamento, busca e filtro por sistema."""
    busca = request.args.get('busca', '').strip()
    sistema = request.args.get('sistema', '').strip()

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
        query += ' AND (l.titulo LIKE ? OR l.autor LIKE ? OR l.sinopse LIKE ? OR l.categoria LIKE ?)'
        busca_termo = f'%{busca}%'
        params.extend([busca_termo, busca_termo, busca_termo, busca_termo])

    if sistema and sistema.lower() != 'todos':
        query += ' AND l.sistema = ?'
        params.append(sistema)

    query += ' GROUP BY l.id ORDER BY l.id ASC'

    cursor.execute(query, params)
    livros = [dict(row) for row in cursor.fetchall()]
    conn.close()

    for livro in livros:
        livro['media_nota'] = round(livro['media_nota'], 1)

    return jsonify(livros)


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


if __name__ == '__main__':
    print("=" * 60)
    print(">> BIBLIOTECA DRACONICA - SERVIDOR PYTHON EM EXECUCAO")
    print(">> Acesse: http://localhost:5000")
    print(">> Login/Registro: http://localhost:5000/login.html")
    print(">> API de Livros: http://localhost:5000/api/livros")
    print(">> API do Forum: http://localhost:5000/api/forum/topicos")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)

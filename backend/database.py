import sqlite3
import os
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'biblioteca_draconica.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(reset_if_needed=False):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Tabela de Usuários (Login e Registro)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha_hash TEXT NOT NULL,
            avatar TEXT DEFAULT '🧙‍♂️',
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Tabela de Livros com links de compra ou financiamento coletivo
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS livros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            autor TEXT NOT NULL,
            sistema TEXT NOT NULL,
            categoria TEXT NOT NULL,
            sinopse TEXT,
            capa_url TEXT,
            link_compra TEXT,
            tipo_link TEXT, -- 'compra', 'financiamento' ou NULL
            downloads INTEGER DEFAULT 0,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Verifica se as colunas link_compra e tipo_link existem (para migração de banco pré-existente)
    cursor.execute("PRAGMA table_info(livros)")
    colunas = [col[1] for col in cursor.fetchall()]
    if 'link_compra' not in colunas:
        cursor.execute("ALTER TABLE livros ADD COLUMN link_compra TEXT")
    if 'tipo_link' not in colunas:
        cursor.execute("ALTER TABLE livros ADD COLUMN tipo_link TEXT")

    # Tabela de avaliações dos livros (com nota e comentário)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS avaliacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            livro_id INTEGER NOT NULL,
            usuario TEXT DEFAULT 'Aventureiro Anônimo',
            nota INTEGER NOT NULL CHECK(nota >= 1 AND nota <= 5),
            comentario TEXT,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (livro_id) REFERENCES livros (id)
        )
    ''')

    # Tabela de tópicos do fórum
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS forum_topicos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            autor TEXT DEFAULT 'Bardo Viajante',
            sistema TEXT DEFAULT 'Geral',
            conteudo TEXT NOT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Tabela de comentários do fórum (com avaliação por estrelas + comentário)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS forum_comentarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topico_id INTEGER NOT NULL,
            usuario TEXT DEFAULT 'Mochileiro',
            texto TEXT NOT NULL,
            avaliacao INTEGER DEFAULT 5 CHECK(avaliacao >= 1 AND avaliacao <= 5),
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (topico_id) REFERENCES forum_topicos (id)
        )
    ''')

    conn.commit()

    # Preencher com dados iniciais se necessário
    cursor.execute('SELECT COUNT(*) FROM livros')
    count = cursor.fetchone()[0]
    cursor.execute('SELECT link_compra FROM livros WHERE id = 1')
    primeiro_link = cursor.fetchone()
    
    # Se a tabela estiver vazia ou com versão antiga de links
    if count == 0 or (primeiro_link and primeiro_link[0] is None):
        cursor.execute('DELETE FROM livros')
        seed_livros(cursor)
        conn.commit()

    # Cria usuário administrador/demonstração inicial
    cursor.execute('SELECT COUNT(*) FROM usuarios')
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO usuarios (nome, email, senha_hash, avatar)
            VALUES (?, ?, ?, ?)
        ''', ('Mestre dos Magos', 'mestre@draconica.com', generate_password_hash('draconica123'), '🧙‍♂️'))
        conn.commit()

    cursor.execute('SELECT COUNT(*) FROM avaliacoes')
    if cursor.fetchone()[0] == 0:
        seed_avaliacoes(cursor)
        conn.commit()

    cursor.execute('SELECT COUNT(*) FROM forum_topicos')
    if cursor.fetchone()[0] == 0:
        seed_forum(cursor)
        conn.commit()

    conn.close()
    try:
        print("[OK] Banco de Dados SQLite (Biblioteca Draconica) atualizado com sucesso!")
    except Exception:
        pass

def seed_livros(cursor):
    livros_iniciais = [
        # D&D 5E
        (1, "Livro do Jogador", "Gary Gygax e Dave Arneson (Wizards of the Coast)", "D&D 5E", "Manual Principal",
         "O guia essencial para criação de personagens, regras fundamentais de combate, magias e classes.",
         "../imagens/livro do jogador dnd.jpg.jpeg", 
         "https://www.amazon.com.br/dp/8583651158", "compra", 42),

        (2, "Guia do Mestre", "Wizards of the Coast", "D&D 5E", "Suplemento",
         "Ferramentas criativas, diretrizes e segredos para criar mundos e conduzir aventuras épicas.",
         "../imagens/WhatsApp Image 2026-08-26 at 14.26.08.jpeg", 
         "https://www.amazon.com.br/dp/8583651166", "compra", 28),

        (3, "Manual dos Monstros", "Wizards of the Coast", "D&D 5E", "Bestiário",
         "Uma horda de criaturas clássicas com estatísticas completas e histórias para desafiar os heróis.",
         "../imagens/Mm5e-capa.webp", 
         "https://www.amazon.com.br/dp/8583651174", "compra", 35),

        (4, "Guia de Xanathar para Todas as Coisas", "Wizards of the Coast", "D&D 5E", "Suplemento",
         "Primeiro grande suplemento com subclasses inéditas, magias, talentos e conselhos do Beholder Xanathar.",
         "../imagens/GDXPTAC.png", 
         "https://www.amazon.com.br/dp/0786966114", "compra", 19),

        (5, "Valda's Spire of Secrets", "Mage Hand Press", "D&D 5E", "Homebrew Oficial",
         "Expansão massiva trazendo novas classes inovadoras, dezenas de subclasses, raças e regras adicionais.",
         "../img/dnd-valdas.jpg", 
         "https://www.kickstarter.com/projects/magehandpress/spire-of-secrets", "financiamento", 14),

        (6, "Ficha de Personagem D&D", "Wizards of the Coast", "D&D 5E", "Acessório",
         "Folha de personagem oficial customizada e editável para registrar habilidades e inventário.",
         "../img/dnd-ficha.jpg", 
         None, None, 56),

        # Tormenta 20
        (7, "Livro do Jogador Básico", "Jambô Editora", "Tormenta 20", "Manual Principal",
         "O guia completo com o sistema D20 atualizado para jogar no maior cenário de RPG do Brasil.",
         "../img/t20-basico.jpg", 
         "https://jamboeditora.com.br/produto/tormenta20-edicao-jogo-do-ano/", "compra", 61),

        (8, "Ameaças de Arton", "Jambô Editora", "Tormenta 20", "Bestiário",
         "Centenas de monstros, perigos e chefes de fase exclusivos do universo de Arton.",
         "../img/t20-ameacas.jpg", 
         "https://jamboeditora.com.br/produto/ameacas-de-arton/", "compra", 33),

        (9, "Heróis de Arton", "Jambô Editora", "Tormenta 20", "Suplemento",
         "Novas opções de poderes lendários, origens, raças e distinções para seus personagens.",
         "../img/t20-herois.jpg", 
         "https://jamboeditora.com.br/produto/herois-de-arton/", "compra", 27),

        (10, "Deuses de Arton", "Jambô Editora", "Tormenta 20", "Suplemento",
         "Detalhes profundos sobre os vinte deuses do Panteão, poderes concedidos e ordens clericais.",
         "../img/t20-deuses.jpg", 
         "https://www.catarse.me/deusesdearton", "financiamento", 22),

        (11, "Atlas de Arton", "Jambô Editora", "Tormenta 20", "Cenário",
         "A geografia completa, história dos reinos e civilizações fascinantes do mundo de Arton.",
         "../img/t20-atlas.jpg", 
         "https://jamboeditora.com.br/produto/atlas-de-arton/", "compra", 18),

        (12, "Ficha de Personagem T20", "Jambô Editora", "Tormenta 20", "Acessório",
         "Folha de registro otimizada para os heróis de Arton com suporte a atributos, magias e mana.",
         "../img/t20-ficha.jpg", 
         None, None, 45),

        # Fabula Ultima
        (13, "Livro Básico Fabula Ultima", "Need Games", "Fabula Ultima", "Manual Principal",
         "O RPG de mesa que homenageia os clássicos JRPGs dos videogames de 8 e 16 bits.",
         "../img/fu-basico.jpg", 
         "https://www.needgames.it/fabula-ultima-en/", "compra", 39),

        (14, "Guia do Mestre Fabula Ultima", "Need Games", "Fabula Ultima", "Suplemento",
         "Ferramentas avançadas e conselhos de design narrativo para conduzir sagas emocionantes.",
         "../img/fu-mestre.jpg", 
         "https://www.needgames.it/fabula-ultima-en/", "compra", 16),

        (15, "Atlas Techno Fantasy", "Need Games", "Fabula Ultima", "Cenário",
         "Mergulhe em mundos futuristas com mechas, distopias corporativas e magia tecnológica.",
         "../img/fu-techno.jpg", 
         "https://www.needgames.it/categoria-prodotto/fabula-ultima-en/", "compra", 15),

        (16, "Atlas High Fantasy", "Need Games", "Fabula Ultima", "Cenário",
         "Magia ancestral pura, reinos suspensos nos céus e grandes batalhas divinas.",
         "../img/fu-high.jpg", 
         "https://www.needgames.it/categoria-prodotto/fabula-ultima-en/", "compra", 20),

        (17, "Aperte Start", "Need Games", "Fabula Ultima", "Aventura",
         "A aventura tutorial pronta com personagens pré-gerados ideal para mestres e jogadores de primeira viagem.",
         "../img/fu-start.jpg", 
         None, None, 31),

        (18, "Codex Extra", "Need Games", "Fabula Ultima", "Suplemento",
         "Classes alternativas, novas habilidades de suporte e regras para combates contra superchefes.",
         "../img/fu-codex.jpg", 
         "https://www.patreon.com/roosterema", "financiamento", 12),

        (19, "Natural Fantasy", "Need Games", "Fabula Ultima", "Cenário",
         "Cenários idílicos inspirados na natureza, harmonia dos espíritos e exploração de ruínas antigas.",
         "../img/fu-natural.jpg", 
         "https://www.needgames.it/categoria-prodotto/fabula-ultima-en/", "compra", 11),

        (20, "Guia do Estilo", "Need Games", "Fabula Ultima", "Acessório",
         "Dicas visuais, tropos de narrativa e estética para enriquecer a ambientação de mesa.",
         "../img/fu-estilo.jpg", 
         None, None, 9),

        (21, "Ficha de Personagem Fabula Ultima", "Need Games", "Fabula Ultima", "Acessório",
         "Layout limpo e organizado para gerenciar laços, pontos de fábrica, atributos e inventário.",
         "../img/fu-ficha.jpg", 
         None, None, 25)
    ]

    cursor.executemany('''
        INSERT INTO livros (id, titulo, autor, sistema, categoria, sinopse, capa_url, link_compra, tipo_link, downloads)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', livros_iniciais)

def seed_avaliacoes(cursor):
    avaliacoes_iniciais = [
        (1, "Eldrin, o Paladino", 5, "Manual obrigatório! Muito bem diagramado e direto ao ponto."),
        (1, "Mago de Thay", 4, "Regras de magia clássicas e sistema simples de entender."),
        (2, "Mestre Valente", 5, "As tabelas de itens mágicos e criação de masmorras salvaram minha campanha!"),
        (3, "Bardo Boêmio", 5, "Monstros muito variados! A arte é maravilhosa."),
        (7, "Cavaleiro de Khalmyr", 5, "Melhor edição de Tormenta! O sistema de PM simplificou muito a mesa."),
        (13, "Chocobo Rider", 5, "A essência de Final Fantasy perfeitamente traduzida para RPG de mesa.")
    ]
    cursor.executemany('''
        INSERT INTO avaliacoes (livro_id, usuario, nota, comentario)
        VALUES (?, ?, ?, ?)
    ''', avaliacoes_iniciais)

def seed_forum(cursor):
    topicos_iniciais = [
        (1, "Dicas de criação de campanha para D&D 5E", "Mestre das Sombras", "D&D 5E",
         "Olá a todos os aventureiros! Estou iniciando uma campanha de nível 1 a 10 no cenário de Forgotten Realms. Quais ganchos de aventura vocês recomendam para engajar o grupo nos primeiros níveis?"),
        (2, "Qual a classe mais divertida de jogar em Tormenta 20?", "Ladino de Valkaria", "Tormenta 20",
         "Estou montando meu personagem para a próxima sessão e queria saber a opinião da comunidade sobre qual classe oferece o gameplay mais dinâmico e divertido."),
        (3, "Guia rápido de Fabula Ultima para iniciantes", "Akira RPGista", "Fabula Ultima",
         "Para quem vem de sistemas tradicionais como D&D, Fabula Ultima tem um foco muito mais narrativo e colaborativo. Montei esse tópico para trocarmos conselhos e debatermos regras!")
    ]
    cursor.executemany('''
        INSERT INTO forum_topicos (id, titulo, autor, sistema, conteudo)
        VALUES (?, ?, ?, ?, ?)
    ''', topicos_iniciais)

    comentarios_iniciais = [
        (1, "Clérigo da Luz", "Recomendo começar com uma investigação na taverna local e pistas sobre uma mina abandonada cheia de kobolds. Funciona sempre!", 5),
        (1, "Ranger da Floresta", "Excelente tópico! Adicionar um rival recorrente logo nas primeiras sessões deixa os jogadores muito envolvidos.", 5),
        (2, "Bucaneiro Audaz", "O Bucaneiro é incrível! Muito estilo, audácia e habilidades com panache para quem curte manobras ousadas.", 5),
        (2, "Arcanista Artoniano", "O Arcanista Mago permite combinações absurdas de magias se você souber gerenciar seus pontos de mana.", 4),
        (3, "Guerreira das Nuvens", "Muito bom! O sistema de Laços (Bonds) e os Pontos de Fábula tornam as sessões cinematográficas.", 5)
    ]
    cursor.executemany('''
        INSERT INTO forum_comentarios (topico_id, usuario, texto, avaliacao)
        VALUES (?, ?, ?, ?)
    ''', comentarios_iniciais)

if __name__ == '__main__':
    init_db()

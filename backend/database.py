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
            bio TEXT DEFAULT '',
            status_jogo TEXT DEFAULT 'procurando_campanha',
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Migração para colunas adicionais de usuários caso o banco já exista
    cursor.execute("PRAGMA table_info(usuarios)")
    colunas_usuarios = [col[1] for col in cursor.fetchall()]
    if 'bio' not in colunas_usuarios:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN bio TEXT DEFAULT ''")
    if 'status_jogo' not in colunas_usuarios:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN status_jogo TEXT DEFAULT 'procurando_campanha'")

    # Tabela de Livros com tipo_jogo, link_compra e tipo_link (compra / financiamento)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS livros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            autor TEXT NOT NULL,
            sistema TEXT NOT NULL,
            tipo_jogo TEXT NOT NULL DEFAULT 'Fantasia Medieval',
            categoria TEXT NOT NULL,
            sinopse TEXT,
            capa_url TEXT,
            link_compra TEXT,
            tipo_link TEXT, -- 'compra', 'financiamento' ou NULL
            downloads INTEGER DEFAULT 0,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Verifica e migra colunas da tabela livros
    cursor.execute("PRAGMA table_info(livros)")
    colunas_livros = [col[1] for col in cursor.fetchall()]
    if 'link_compra' not in colunas_livros:
        cursor.execute("ALTER TABLE livros ADD COLUMN link_compra TEXT")
    if 'tipo_link' not in colunas_livros:
        cursor.execute("ALTER TABLE livros ADD COLUMN tipo_link TEXT")
    if 'tipo_jogo' not in colunas_livros:
        cursor.execute("ALTER TABLE livros ADD COLUMN tipo_jogo TEXT DEFAULT 'Fantasia Medieval'")

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

    # Preencher com acervo amplo de livros (com URLs diretas de imagem na web)
    cursor.execute('SELECT COUNT(*) FROM livros')
    count = cursor.fetchone()[0]
    cursor.execute("SELECT capa_url FROM livros WHERE id = 1")
    primeira_capa = cursor.fetchone()
    
    # Atualiza se tiver poucos livros ou se as capas ainda forem locais
    if count < 40 or (primeira_capa and not primeira_capa[0].startswith('http')):
        cursor.execute('DELETE FROM livros')
        seed_livros(cursor)
        conn.commit()

    # Cria usuário administrador/demonstração inicial
    cursor.execute('SELECT COUNT(*) FROM usuarios')
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO usuarios (nome, email, senha_hash, avatar, bio, status_jogo)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ('Mestre dos Magos', 'mestre@draconica.com', generate_password_hash('draconica123'), '🧙‍♂️', 'Guardião dos tomos arcanos da Biblioteca Dracônica.', 'procurando_jogadores'))
        conn.commit()

    cursor.execute('SELECT COUNT(*) FROM avaliacoes')
    if cursor.fetchone()[0] == 0:
        seed_avaliacoes(cursor)
        conn.commit()

    cursor.execute('SELECT COUNT(*) FROM forum_topicos')
    if cursor.fetchone()[0] == 0:
        seed_forum(cursor)
        conn.commit()
    else:
        cursor.execute("SELECT COUNT(*) FROM forum_topicos WHERE sistema = 'JJRPG'")
        if cursor.fetchone()[0] == 0:
            seed_topicos_jjrpg(cursor)
            conn.commit()

    conn.close()
    try:
        print("[OK] Banco de Dados SQLite (Biblioteca Draconica) atualizado com sucesso!")
    except Exception:
        pass

def seed_livros(cursor):
    livros_iniciais = [
        # =========================================================================
        # 1. JJRPG (RPG ESTILO JAPONÊS / ANIME) - BÁSICOS, SUPLEMENTOS E HOMEBREWS
        # =========================================================================
        (1, "Fabula Ultima - Livro Básico", "Emanuele Galletto (Need Games)", "Fabula Ultima", "JJRPG", "Manual Principal",
         "O premiado RPG de mesa que homenageia os clássicos JRPGs dos videogames de 8 e 16 bits como Final Fantasy, Chrono Trigger e Dragon Quest.",
         "https://m.media-amazon.com/images/I/81x1Q1rC0nL._AC_SL1500_.jpg", 
         "https://www.needgames.it/fabula-ultima-en/", "compra", 75),

        (2, "Fabula Ultima - Guia do Mestre", "Need Games", "Fabula Ultima", "JJRPG", "Suplemento",
         "Ferramentas avançadas, design narrativo e regras para combates contra superchefes e sagas épicas em turnos.",
         "https://preview.drivethrurpg.com/images/1547/439736.jpg", 
         "https://www.needgames.it/fabula-ultima-en/", "compra", 41),

        (3, "Atlas Techno Fantasy - Fabula Ultima", "Need Games", "Fabula Ultima", "JJRPG", "Suplemento",
         "Mergulhe em mundos futuristas estilo Final Fantasy VII com mechas, distopias corporativas, veículos voadores e magia tecnológica.",
         "https://preview.drivethrurpg.com/images/1547/480838.jpg", 
         "https://www.needgames.it/categoria-prodotto/fabula-ultima-en/", "compra", 33),

        (4, "Atlas High Fantasy - Fabula Ultima", "Need Games", "Fabula Ultima", "JJRPG", "Suplemento",
         "Magia ancestral pura, reinos suspensos nas nuvens, grandes cristais de poder e lendas divinas no melhor estilo JRPG tradicional.",
         "https://preview.drivethrurpg.com/images/1547/460773.jpg", 
         "https://www.needgames.it/categoria-prodotto/fabula-ultima-en/", "compra", 38),

        (5, "Atlas Natural Fantasy - Fabula Ultima", "Need Games", "Fabula Ultima", "JJRPG", "Suplemento",
         "Cenários idílicos inspirados na natureza, harmonia com espíritos da terra e exploração de ruínas estilo Zelda e Studio Ghibli.",
         "https://preview.drivethrurpg.com/images/1547/495000.jpg", 
         "https://www.needgames.it/categoria-prodotto/fabula-ultima-en/", "compra", 29),

        (6, "Codex Extra - Fabula Ultima", "Need Games / Rooster Ema", "Fabula Ultima", "JJRPG", "Homebrew",
         "Classes inéditas criadas pela comunidade e autor, novas perícias heróicas e mecânicas disponibilizadas via financiamento contínuo no Patreon.",
         "https://preview.drivethrurpg.com/images/1547/410108.jpg", 
         "https://www.patreon.com/roosterema", "financiamento", 27),

        (7, "Ryuutama: Natural Fantasy RPG", "Atsuhiro Okada", "Ryuutama", "JJRPG", "Manual Principal",
         "O aclamado RPG de fantasia acolhedora de viagem, companheirismo, mapas e dragões protetores, conhecido como o RPG estilo Ghibli.",
         "https://preview.drivethrurpg.com/images/2340/151366.jpg", 
         "https://kotohi.com/ryuutama/", "compra", 45),

        (8, "Kamigakari: God Hunters", "Shunsaku Yano", "Kamigakari", "JJRPG", "Manual Principal",
         "Modern Fantasy JRPG cinematográfico repleto de combates dinâmicos com caçadores de deuses enfrentando anomalias na Tóquio contemporânea.",
         "https://preview.drivethrurpg.com/images/13840/240304.jpg", 
         "https://www.drivethrurpg.com/en/product/240304/kamigakari-god-hunters", "compra", 22),

        (9, "Tenra Bansho Zero", "Junichi Inoue", "Tenra Bansho Zero", "JJRPG", "Manual Principal",
         "Hiper-RPG japonês de fantasia feudal oriental, magia mecânica, samurais cibernéticos, ninjas e drama intenso de anime shonen.",
         "https://preview.drivethrurpg.com/images/2340/111529.jpg", 
         "https://www.drivethrurpg.com/en/product/111529/tenra-bansho-zero-heaven-and-earth-edition", "compra", 26),

        (10, "Sword World 2.5 - Livro de Regras I", "Kei Kitazawa (Group SNE)", "Sword World", "JJRPG", "Manual Principal",
         "O RPG de mesa mais longevo e jogado do Japão, base do cenário de Lodoss War com combates por dados d6 e progressão veloz.",
         "https://m.media-amazon.com/images/I/71u9sW4YwZL._AC_SL1200_.jpg", 
         "https://bookwalker.jp/", "compra", 19),

        (11, "Anima: Beyond Fantasy", "Carlos B. Garcia (Edge Studio)", "Anima", "JJRPG", "Manual Principal",
         "RPG de alta fantasia épica oriental com influências profundas de videogames japoneses, artes marciais ki e magia de escala cósmica.",
         "https://m.media-amazon.com/images/I/81Pj6l8V-jL._AC_SL1500_.jpg", 
         "https://www.drivethrurpg.com/en/product/64295/anima-beyond-fantasy-core-exxet", "compra", 18),

        (12, "Maid: The Role-Playing Game", "Ryo Kamiya", "Maid RPG", "JJRPG", "Manual Principal",
         "Comédia anime leve e irreverente com tabelas de eventos aleatórios e criação ultrarrápida de personagens em mansões fantásticas.",
         "https://preview.drivethrurpg.com/images/2340/12432.jpg", 
         "https://www.drivethrurpg.com/en/product/12432/maid-the-role-playing-game", "compra", 14),

        # =========================================================================
        # 2. FANTASIA MEDIEVAL & D20 - BÁSICOS, SUPLEMENTOS E HOMEBREWS
        # =========================================================================
        (13, "D&D 5E - Livro do Jogador", "Wizards of the Coast", "D&D 5E", "Fantasia Medieval", "Manual Principal",
         "O guia essencial de regras fundamentais, raças, classes lendárias, perícias e listas de magias para jogar a 5ª edição.",
         "https://m.media-amazon.com/images/I/81T6V2pL7uL._AC_SL1500_.jpg", 
         "https://www.amazon.com.br/dp/8583651158", "compra", 95),

        (14, "D&D 5E - Guia do Mestre", "Wizards of the Coast", "D&D 5E", "Fantasia Medieval", "Suplemento",
         "Diretrizes para arquitetura de masmorras, armadilhas criativas, tabelas completas de tesouros e condução de crônicas medievais.",
         "https://m.media-amazon.com/images/I/81bH9q1h8EL._AC_SL1500_.jpg", 
         "https://www.amazon.com.br/dp/8583651166", "compra", 62),

        (15, "D&D 5E - Manual dos Monstros", "Wizards of the Coast", "D&D 5E", "Fantasia Medieval", "Bestiário",
         "Mais de quatrocentas criaturas com estatísticas, ecologia e comportamentos táticos para desafiar grupos de qualquer nível.",
         "https://m.media-amazon.com/images/I/81x12bL+M3L._AC_SL1500_.jpg", 
         "https://www.amazon.com.br/dp/8583651174", "compra", 68),

        (16, "D&D 5E - Caldeirão de Tasha para Tudo", "Wizards of the Coast", "D&D 5E", "Fantasia Medieval", "Suplemento",
         "Expansão trazendo a classe Artífice, regras opcionais de personalização de origens, patronos de grupo e dezenas de feitiços.",
         "https://m.media-amazon.com/images/I/81R6Q4R+K3L._AC_SL1500_.jpg", 
         "https://www.amazon.com.br/dp/8583651913", "compra", 55),

        (17, "D&D 5E - Guia de Xanathar para Todas as Coisas", "Wizards of the Coast", "D&D 5E", "Fantasia Medieval", "Suplemento",
         "Mais de trinta novas subclasses inovadoras, ferramentas para artesãos e novos sistemas para atividades de tempo livre.",
         "https://m.media-amazon.com/images/I/81q2X9p5oDL._AC_SL1500_.jpg", 
         "https://www.amazon.com.br/dp/8583651581", "compra", 53),

        (18, "D&D 5E - Tesouro dos Dragões de Fizban", "Wizards of the Coast", "D&D 5E", "Fantasia Medieval", "Suplemento",
         "O guia definitivo sobre a linhagem dos dragões, covis mágicos, novas subclasses e monstros dracônicos de alta letalidade.",
         "https://m.media-amazon.com/images/I/81Wn6G9oKNL._AC_SL1500_.jpg", 
         "https://www.amazon.com.br/dp/0786967293", "compra", 43),

        (19, "Valda's Spire of Secrets", "Mage Hand Press", "D&D 5E", "Fantasia Medieval", "Homebrew",
         "O mais premiado homebrew de 5E financiado via Kickstarter, trazendo dez classes originais, 150 subclasses e dezenas de magias.",
         "https://m.media-amazon.com/images/I/81m9rG8Y9VL._AC_SL1500_.jpg", 
         "https://www.kickstarter.com/projects/magehandpress/spire-of-secrets", "financiamento", 38),

        (20, "Grim Hollow: The Campaign Guide", "Ghostfire Gaming", "D&D 5E", "Fantasia Medieval", "Homebrew",
         "Aclamado cenário homebrew de dark fantasy e horror gótico com transformações amaldiçoadas (vampiro, lobisomem, lich).",
         "https://m.media-amazon.com/images/I/81h8kL7pQXL._AC_SL1500_.jpg", 
         "https://ghostfiregaming.com/grim-hollow/", "financiamento", 34),

        (21, "Tome of Beasts 3", "Kobold Press", "D&D 5E", "Fantasia Medieval", "Homebrew",
         "Suplemento bestiário independente com centenas de monstros únicos criados para desafiar veteranos da 5ª edição.",
         "https://m.media-amazon.com/images/I/81Y7y6qT7VL._AC_SL1500_.jpg", 
         "https://koboldpress.com/kpstore/product/tome-of-beasts-3-for-5th-edition/", "compra", 29),

        (22, "Flee, Mortals! The MCDM Monster Book", "MCDM Productions (Matt Colville)", "D&D 5E", "Fantasia Medieval", "Homebrew",
         "Financiamento recordista no Kickstarter reformulando o combate de monstros da 5E com ação dinâmica, lacaios e encontros cinematográficos.",
         "https://m.media-amazon.com/images/I/81e5p8Vq1ML._AC_SL1500_.jpg", 
         "https://www.kickstarter.com/projects/mattcolville/mcdm-monster-book", "financiamento", 46),

        (23, "Tormenta 20 - Edição Jogo do Ano", "Jambô Editora", "Tormenta 20", "Fantasia Medieval", "Manual Principal",
         "A versão definitiva do maior cenário de RPG nacional com mecânica de mana moderna, combate ágil e riqueza de lore.",
         "https://jamboeditora.com.br/wp-content/uploads/2022/10/T20_Jogo-do-Ano_Capa_site.jpg", 
         "https://jamboeditora.com.br/produto/tormenta20-edicao-jogo-do-ano/", "compra", 98),

        (24, "Ameaças de Arton - Tormenta 20", "Jambô Editora", "Tormenta 20", "Fantasia Medieval", "Bestiário",
         "Centenas de monstros do mundo de Arton, perigos climáticos, chefes lendários e regras de colossos de combate.",
         "https://jamboeditora.com.br/wp-content/uploads/2023/11/Ameacas-de-Arton_capa-site.jpg", 
         "https://jamboeditora.com.br/produto/ameacas-de-arton/", "compra", 59),

        (25, "Heróis de Arton - Tormenta 20", "Jambô Editora", "Tormenta 20", "Fantasia Medieval", "Suplemento",
         "Grandes distinções heróicas, raças adicionais, magias supremas e novas perícias para elevar personagens ao status lendário.",
         "https://jamboeditora.com.br/wp-content/uploads/2024/07/Herois-de-Arton_capa-site.jpg", 
         "https://jamboeditora.com.br/produto/herois-de-arton/", "compra", 54),

        (26, "Deuses de Arton - Tormenta 20", "Jambô Editora", "Tormenta 20", "Fantasia Medieval", "Suplemento",
         "Financiamento coletivo épico no Catarse aprofundando o Panteão dos vinte deuses de Tormenta, dogmas e ordens clericais.",
         "https://jamboeditora.com.br/wp-content/uploads/2023/11/Atlas-de-Arton_capa-site.jpg", 
         "https://www.catarse.me/deusesdearton", "financiamento", 49),

        (27, "Atlas de Arton - Tormenta 20", "Jambô Editora", "Tormenta 20", "Fantasia Medieval", "Cenário",
         "A geografia física, política e cultural detalhada de todos os reinos e territórios misteriosos do continente de Arton.",
         "https://jamboeditora.com.br/wp-content/uploads/2023/11/Atlas-de-Arton_capa-site.jpg", 
         "https://jamboeditora.com.br/produto/atlas-de-arton/", "compra", 41),

        (28, "Lendas de Ghanor RPG", "Jambô Editora (Jovem Nerd)", "Ghanor", "Fantasia Medieval", "Manual Principal",
         "Financiamento recordista de fantasia medieval no Catarse baseado no universo de Ruff Ghanor, com batalhas de exércitos e feudos.",
         "https://jamboeditora.com.br/wp-content/uploads/2022/10/Ghanor-RPG_Capa-site.jpg", 
         "https://www.catarse.me/ghanor", "financiamento", 64),

        (29, "Old Dragon 2 - Caixa Básica", "Fabiano Neme e Rafael Beltrame", "Old Dragon", "Fantasia Medieval", "Manual Principal",
         "Financiamento coletivo no Catarse resgatando a essência do RPG clássico de masmorras e espadas em português.",
         "https://m.media-amazon.com/images/I/81e5p8Vq1ML._AC_SL1500_.jpg", 
         "https://www.catarse.me/olddragon2", "financiamento", 52),

        (30, "Shadowdark RPG", "Kelsey Dionne (The Arcane Library)", "Shadowdark", "Fantasia Medieval", "Manual Principal",
         "Financiamento multimilionário no Kickstarter trazendo exploração de masmorras com tocha em tempo real e regras velozes.",
         "https://m.media-amazon.com/images/I/81Y7y6qT7VL._AC_SL1500_.jpg", 
         "https://www.thearcanelibrary.com/pages/shadowdark", "financiamento", 47),

        (31, "Pathfinder 2ª Edição - Livro Básico", "Paizo / New Order Editora", "Pathfinder 2E", "Fantasia Medieval", "Manual Principal",
         "Sistema tático refinado com ação em três pontos, milhares de talentos customizáveis e suporte profundo a aventuras fantásticas.",
         "https://m.media-amazon.com/images/I/81y7W4G8o9L._AC_SL1500_.jpg", 
         "https://newordereditora.com/loja/rpg/pathfinder-2/", "compra", 58),

        # =========================================================================
        # 3. HORROR CÓSMICO & INVESTIGAÇÃO - BÁSICOS E SUPLEMENTOS
        # =========================================================================
        (32, "Chamado de Cthulhu 7ª Edição", "Chaosium / New Order Editora", "Chamado de Cthulhu", "Horror Cósmico", "Manual Principal",
         "O mais célebre RPG de terror e investigação baseado nos mitos de Lovecraft, com regras de sanidade mental e dados percentuais.",
         "https://m.media-amazon.com/images/I/81xXy4L1FQL._AC_SL1500_.jpg", 
         "https://newordereditora.com/loja/rpg/chamado-de-cthulhu/", "compra", 71),

        (33, "Pulp Cthulhu - Suplemento 7E", "Chaosium / New Order Editora", "Chamado de Cthulhu", "Horror Cósmico", "Suplemento",
         "Regras para combates heróicos e ação desenfreada no estilo aventura pulp contra os horrores sobrenaturais de Cthulhu.",
         "https://m.media-amazon.com/images/I/81fH8p5rM8L._AC_SL1500_.jpg", 
         "https://newordereditora.com/loja/rpg/chamado-de-cthulhu/", "compra", 36),

        (34, "Ordem Paranormal RPG", "Cellbit e Felipe Della Corte", "Ordem Paranormal", "Horror Cósmico", "Manual Principal",
         "Fenômeno brasileiro de investigação e combate tático contra entidades paranormais do Outro Lado usando rituais ocultistas.",
         "https://jamboeditora.com.br/wp-content/uploads/2022/10/Ordem-Paranormal-RPG_capa-site.jpg", 
         "https://jamboeditora.com.br/categoria/rpg/ordem-paranormal-rpg/", "compra", 99),

        (35, "Ordem Paranormal - Sobrevivendo ao Horror", "Jambô Editora", "Ordem Paranormal", "Horror Cósmico", "Suplemento",
         "Financiamento coletivo no Catarse expandindo as ameaças paranormais, novos rituais sombrios e mecânicas de sobrevivência.",
         "https://jamboeditora.com.br/wp-content/uploads/2024/07/Herois-de-Arton_capa-site.jpg", 
         "https://www.catarse.me/ordemparanormal", "financiamento", 65),

        (36, "Vampiro: A Máscara 5ª Edição (V5)", "World of Darkness / Galápagos", "Vampiro: A Máscara", "Horror Cósmico", "Manual Principal",
         "RPG de horror pessoal e drama político onde os jogadores interpretam vampiros lutando para manter sua humanidade nas noites modernas.",
         "https://m.media-amazon.com/images/I/81K0Qy2p7aL._AC_SL1500_.jpg", 
         "https://mundogalapagos.com.br/vampiro-a-mascara-5-edicao-livro-de-regras/produto/VAM001", "compra", 63),

        (37, "Kult: Divindade Perdida", "Helmgast / Buró Brasil", "Kult", "Horror Cósmico", "Manual Principal",
         "Financiamento coletivo no Catarse trazendo o aterrorizante RPG onde o mundo real é apenas uma ilusão que esconde horrores cósmicos.",
         "https://m.media-amazon.com/images/I/71u9sW4YwZL._AC_SL1200_.jpg", 
         "https://www.catarse.me/kult", "financiamento", 37),

        (38, "Delta Green: Agent's Handbook", "Arc Dream Publishing", "Delta Green", "Horror Cósmico", "Manual Principal",
         "Conspirações governamentais secretas enfrentando ameaças cósmicas contemporâneas com regras afiadas de investigação.",
         "https://preview.drivethrurpg.com/images/1547/181674.jpg", 
         "https://www.drivethrurpg.com/en/product/181674/delta-green-agent-s-handbook", "compra", 28),

        # =========================================================================
        # 4. CYBERPUNK & FICÇÃO CIENTÍFICA - BÁSICOS E SUPLEMENTOS
        # =========================================================================
        (39, "Cyberpunk RED", "Mike Pondsmith (R. Talsorian / Devir)", "Cyberpunk RED", "Cyberpunk", "Manual Principal",
         "O RPG da Era do Vermelho em Night City, mercenários implacáveis, tecnologia cibernética e tiroteios mortais contra megacorporações.",
         "https://m.media-amazon.com/images/I/81F5G8o6NRL._AC_SL1500_.jpg", 
         "https://devir.com.br/cyberpunk-red/", "compra", 74),

        (40, "Interface RED Vol. 1", "R. Talsorian Games", "Cyberpunk RED", "Cyberpunk", "Suplemento",
         "Coletânea de regras adicionais com novos drones autônomos, cyberware de ponta, armas exóticas e encontros urbanos.",
         "https://preview.drivethrurpg.com/images/13/380649.jpg", 
         "https://talsorianstore.com/products/interface-red-vol-1", "compra", 31),

        (41, "Mothership RPG: Sci-Fi Horror", "Sean McCoy (Tuesday Knight Games)", "Mothership", "Cyberpunk", "Manual Principal",
         "Financiamento cult milionário no Kickstarter de terror e sobrevivência em estações espaciais abandonadas com mecânica de pânico.",
         "https://preview.drivethrurpg.com/images/13601/242638.jpg", 
         "https://www.kickstarter.com/projects/gerbl/mothership-sci-fi-horror-rpg-1st-edition-boxed-set", "financiamento", 48),

        (42, "Alien RPG - Livro de Regras", "Free League / New Order Editora", "Alien RPG", "Cyberpunk", "Manual Principal",
         "RPG oficial cinematográfico de horror espacial com tensão contínua contra os Xenomorfos sob a influência da Corporação Weyland.",
         "https://m.media-amazon.com/images/I/81z9R7o9tLL._AC_SL1500_.jpg", 
         "https://newordereditora.com/loja/rpg/alien-rpg/", "compra", 56),

        (43, "Lancer RPG: Core Rulebook", "Massif Press", "Lancer", "Cyberpunk", "Manual Principal",
         "Financiamento revolucionário no Kickstarter de combates táticos em mechas gigantes com customização de chassi e inteligências artificiais.",
         "https://preview.drivethrurpg.com/images/11497/275861.jpg", 
         "https://massif-press.itch.io/corebook-pdf", "financiamento", 39),

        (44, "Starfinder - Livro Básico", "Paizo / New Order Editora", "Starfinder", "Cyberpunk", "Manual Principal",
         "Ópera espacial de ficção científica e fantasia com naves estelares customizáveis, magia tecnológica e mundos alienígenas.",
         "https://m.media-amazon.com/images/I/81m8R+w5tGL._AC_SL1500_.jpg", 
         "https://newordereditora.com/loja/rpg/starfinder/", "compra", 42)
    ]

    cursor.executemany('''
        INSERT INTO livros (id, titulo, autor, sistema, tipo_jogo, categoria, sinopse, capa_url, link_compra, tipo_link, downloads)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', livros_iniciais)

def seed_avaliacoes(cursor):
    avaliacoes_iniciais = [
        (1, "Eldrin, o Paladino", 5, "Fabula Ultima capturou exatamente o sentimento de jogar um JRPG na mesa com os amigos! Sistema dinâmico e combates emocionantes."),
        (1, "Arcanista das Nuvens", 5, "As regras narrativas e a criação compartilhada de mundo são espetaculares. Recomendo para qualquer fã de Final Fantasy."),
        (6, "Mestre das Fábulas", 5, "O material do Codex Extra no Patreon adiciona classes sensacionais como o Piloto de Mecha e Invocador."),
        (7, "Viajante do Vento", 5, "Ryuutama é acolhedor e poético, perfeito para sessões focadas na jornada e no companheirismo."),
        (13, "Cavaleiro de Khalmyr", 5, "Livro do Jogador de D&D clássico e indispensável para qualquer mesa de fantasia medieval."),
        (19, "Alquimista do Vazio", 5, "Valda's Spire of Secrets é o melhor homebrew já feito para D&D 5E, classes extremamente balanceadas."),
        (23, "Guerreiro de Valkaria", 5, "Tormenta 20 é sem dúvidas o melhor RPG nacional. O sistema de mana deixa o combate muito dinâmico!"),
        (28, "Bárbaro de Ghanor", 5, "Lendas de Ghanor tem o melhor sistema de domínio de feudos e combates medievais mortais."),
        (34, "Agente Investigador", 5, "Ordem Paranormal tem uma mecânica de rituais muito viciante e combate desafiador.")
    ]
    cursor.executemany('''
        INSERT INTO avaliacoes (livro_id, usuario, nota, comentario)
        VALUES (?, ?, ?, ?)
    ''', avaliacoes_iniciais)

def seed_forum(cursor):
    topicos_iniciais = [
        (1, "Dicas para mestrar Fabula Ultima e combates de chefes no estilo JRPG", "Akira RPGista", "JJRPG",
         "Olá aventureiros! Para quem está explorando o mundo dos JJRPGs de mesa, quais conselhos vocês dão para criar combates por turnos com chefes de várias fases e trilhas sonoras orquestradas?"),
        (2, "Sistemas de RPG no estilo Anime / JJRPG: Fabula Ultima vs Ryuutama", "Otaku das Sombras", "JJRPG",
         "Estou montando uma crônica inspirada em animes de aventura e queria saber a opinião do pessoal da guilda sobre as diferenças entre Fabula Ultima, Ryuutama e Kamigakari."),
        (3, "Qual a classe mais divertida de jogar em Tormenta 20?", "Ladino de Valkaria", "Tormenta 20",
         "Estou montando meu personagem para a próxima sessão e queria saber a opinião da comunidade sobre qual classe oferece o gameplay mais dinâmico e divertido."),
        (4, "Financiamentos coletivos de RPG que valem a pena apoiar no Catarse e Kickstarter", "Aventureiro Coletor", "Geral",
         "Montei este tópico para reunirmos os melhores livros em financiamento coletivo ativos do momento, como Deuses de Arton, Valda's Spire, Old Dragon 2 e Lendas de Ghanor!")
    ]
    cursor.executemany('''
        INSERT INTO forum_topicos (id, titulo, autor, sistema, conteudo)
        VALUES (?, ?, ?, ?, ?)
    ''', topicos_iniciais)

    comentarios_iniciais = [
        (1, "Chocobo Mestre", "Usar relógios de contagem (Clocks) e mudar a música quando o chefe entra na segunda fase deixa os jogadores de queixo caído! Funciona demais em Fabula Ultima.", 5),
        (1, "Maga do Cristal", "As habilidades de Pressentimento e Vulnerabilidade Elemental deixam os combates idênticos aos melhores jogos da Square Enix.", 5),
        (2, "Viajante Ryu", "Ryuutama é perfeito se você quer uma atmosfera relaxante de viagem tipo Studio Ghibli, enquanto Fabula Ultima brilha na fantasia épica de anime shonen!", 5),
        (3, "Bucaneiro Audaz", "O Bucaneiro de Tormenta 20 é incrível! Muita audácia, mobilidade e manobras com panache.", 5),
        (4, "Apoiador Veterano", "Os financiamentos do Catarse têm entregado livros lindos no Brasil, recomendo muito acompanhar os lançamentos da Jambô e da Buró.", 5)
    ]
    cursor.executemany('''
        INSERT INTO forum_comentarios (topico_id, usuario, texto, avaliacao)
        VALUES (?, ?, ?, ?)
    ''', comentarios_iniciais)

def seed_topicos_jjrpg(cursor):
    topicos_jjrpg = [
        ("Dicas para mestrar Fabula Ultima e combates de chefes no estilo JRPG", "Akira RPGista", "JJRPG",
         "Olá aventureiros! Para quem está explorando o mundo dos JJRPGs de mesa, quais conselhos vocês dão para criar combates por turnos com chefes de várias fases e trilhas sonoras orquestradas?"),
        ("Sistemas de RPG no estilo Anime / JJRPG: Fabula Ultima vs Ryuutama", "Otaku das Sombras", "JJRPG",
         "Estou montando uma crônica inspirada em animes de aventura e queria saber a opinião do pessoal da guilda sobre as diferenças entre Fabula Ultima, Ryuutama e Kamigakari.")
    ]
    for t in topicos_jjrpg:
        cursor.execute('''
            INSERT INTO forum_topicos (titulo, autor, sistema, conteudo)
            VALUES (?, ?, ?, ?)
        ''', t)

if __name__ == '__main__':
    init_db()

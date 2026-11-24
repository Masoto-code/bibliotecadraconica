import os
import django

# Carrega ambiente Django se executado como script independente
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'draconica_project.settings')
django.setup()

from biblioteca.models import Usuario, Livro, Avaliacao, ForumTopico, ForumComentario

def run_seed():
    print(">> Iniciando o povoamento do Banco de Dados Django...")

    # 1. Usuários Iniciais
    usuarios_iniciais = [
        ('Administrador da Guilda', 'admbiblioteca@gmail.com', 'AKhDd*M38DI0(d2N', '👑', 'Administrador supremo da Biblioteca Dracônica com acesso à Central de Moderação.', 'em_campanha'),
        ('Mestre dos Magos', 'mestre@draconica.com', 'draconica123', '🧙‍♂️', 'Guardião dos tomos arcanos da Biblioteca Dracônica e mestre de masmorra veterano.', 'procurando_jogadores'),
        ('Valéria, a Feiticeira', 'valeria@draconica.com', 'draconica123', '🧝‍♀️', 'Maga elementalista em busca de grimórios raros e feitiços perdidos de Fabula Ultima.', 'em_campanha'),
        ('Eldrin, o Paladino', 'eldrin@draconica.com', 'draconica123', '🛡️', 'Devoto da justiça e combatente de linha de frente. Procurando mesa aos finais de semana.', 'procurando_campanha'),
        ('Bardo Viajante', 'bardo@draconica.com', 'draconica123', '🪕', 'Contador de lendas, cantador de tavernas e especialista em instrumentos mágicos.', 'procurando_campanha')
    ]

    for nome, email, senha, avatar, bio, status in usuarios_iniciais:
        u, created = Usuario.objects.get_or_create(
            email=email,
            defaults={
                'nome': nome,
                'avatar': avatar,
                'bio': bio,
                'status_jogo': status
            }
        )
        if email.lower() == 'admbiblioteca@gmail.com':
            u.is_admin = True
        u.set_senha(senha)
        u.save()

    # 2. Livros Iniciais
    livros_iniciais = [
        # JJRPG
        (1, "Fabula Ultima - Livro Básico", "Emanuele Galletto (Need Games)", "Fabula Ultima", "JJRPG", "Manual Principal",
         "O premiado RPG de mesa que homenageia os clássicos JRPGs dos videogames de 8 e 16 bits como Final Fantasy, Chrono Trigger e Dragon Quest.",
         "../imagens/capas/livro_1.svg", "https://needgames.it/fabula-ultima/", "compra", 75),

        (2, "Fabula Ultima - Guia do Mestre", "Need Games", "Fabula Ultima", "JJRPG", "Suplemento",
         "Ferramentas avançadas, design narrativo e regras para combates contra superchefes e sagas épicas em turnos.",
         "../imagens/capas/livro_2.svg", "https://needgames.it/fabula-ultima/", "compra", 41),

        (3, "Atlas Techno Fantasy - Fabula Ultima", "Need Games", "Fabula Ultima", "JJRPG", "Suplemento",
         "Mergulhe em mundos futuristas estilo Final Fantasy VII com mechas, distopias corporativas, veículos voadores e magia tecnológica.",
         "../imagens/capas/livro_3.svg", "https://needgames.it/fabula-ultima/", "compra", 33),

        (4, "Atlas High Fantasy - Fabula Ultima", "Need Games", "Fabula Ultima", "JJRPG", "Suplemento",
         "Magia ancestral pura, reinos suspensos nas nuvens, grandes cristais de poder e lendas divinas no melhor estilo JRPG tradicional.",
         "../imagens/capas/livro_4.svg", "https://needgames.it/fabula-ultima/", "compra", 38),

        (5, "Atlas Natural Fantasy - Fabula Ultima", "Need Games", "Fabula Ultima", "JJRPG", "Suplemento",
         "Cenários idílicos inspirados na natureza, harmonia com espíritos da terra e exploração de ruínas estilo Zelda e Studio Ghibli.",
         "../imagens/capas/livro_5.svg", "https://needgames.it/fabula-ultima/", "compra", 29),

        (6, "Codex Extra - Fabula Ultima", "Need Games / Rooster Ema", "Fabula Ultima", "JJRPG", "Homebrew",
         "Classes inéditas criadas pela comunidade e autor, novas perícias heróicas e mecânicas disponibilizadas via financiamento contínuo no Patreon.",
         "../imagens/capas/livro_6.svg", "https://patreon.com/roosterema", "financiamento", 27),

        (7, "Ryuutama: Natural Fantasy RPG", "Atsuhiro Okada", "Ryuutama", "JJRPG", "Manual Principal",
         "O aclamado RPG de fantasia acolhedora de viagem, companheirismo, mapas e dragões protetores, conhecido como o RPG estilo Ghibli.",
         "../imagens/capas/livro_7.svg", "https://kotohi.com/ryuutama/", "compra", 45),

        (8, "Kamigakari: God Hunters", "Shunsaku Yano", "Kamigakari", "JJRPG", "Manual Principal",
         "Modern Fantasy JRPG cinematográfico repleto de combates dinâmicos com caçadores de deuses enfrentando anomalias na Tóquio contemporânea.",
         "../imagens/capas/livro_8.svg", "https://drivethrurpg.com/product/240304/Kamigakari-God-Hunters", "compra", 22),

        (9, "Tenra Bansho Zero", "Junichi Inoue", "Tenra Bansho Zero", "JJRPG", "Manual Principal",
         "Hiper-RPG japonês de fantasia feudal oriental, magia mecânica, samurais cibernéticos, ninjas e drama intenso de anime shonen.",
         "../imagens/capas/livro_9.svg", "https://drivethrurpg.com/product/111529/Tenra-Bansho-Zero-Heaven-and-Earth-Edition", "compra", 26),

        (10, "Sword World 2.5 - Livro de Regras I", "Kei Kitazawa (Group SNE)", "Sword World", "JJRPG", "Manual Principal",
         "O RPG de mesa mais longevo e jogado do Japão, base do cenário de Lodoss War com combates por dados d6 e progressão veloz.",
         "../imagens/capas/livro_10.svg", "https://bookwalker.jp/series/193026/", "compra", 19),

        (11, "Anima: Beyond Fantasy", "Carlos B. Garcia (Edge Studio)", "Anima", "JJRPG", "Manual Principal",
         "RPG de alta fantasia épica oriental com influências profundas de videogames japoneses, artes marciais ki e magia de escala cósmica.",
         "../imagens/capas/livro_11.svg", "https://edge-studio.net/anima/", "compra", 18),

        (12, "Maid: The Role-Playing Game", "Ryo Kamiya", "Maid RPG", "JJRPG", "Manual Principal",
         "Comédia anime leve e irreverente com tabelas de eventos aleatórios e criação ultrarrápida de personagens em mansões fantásticas.",
         "../imagens/capas/livro_12.svg", "https://drivethrurpg.com/product/124318/Maid-The-RolePlaying-Game", "compra", 14),

        # D&D 5E & FANTASIA MEDIEVAL
        (13, "D&D 5E - Livro do Jogador", "Wizards of the Coast", "D&D 5E", "Fantasia Medieval", "Manual Principal",
         "O guia essencial de regras fundamentais, raças, classes lendárias, perícias e listas de magias para jogar a 5ª edição.",
         "../imagens/capas/livro_13.svg", "https://dnd.wizards.com/products/rpg-players-handbook", "compra", 95),

        (14, "D&D 5E - Guia do Mestre", "Wizards of the Coast", "D&D 5E", "Fantasia Medieval", "Suplemento",
         "Diretrizes para arquitetura de masmorras, armadilhas criativas, tabelas completas de tesouros e condução de crônicas medievais.",
         "../imagens/capas/livro_14.svg", "https://dnd.wizards.com/products/rpg-dungeon-masters-guide", "compra", 62),

        (15, "D&D 5E - Manual dos Monstros", "Wizards of the Coast", "D&D 5E", "Fantasia Medieval", "Bestiário",
         "Mais de quatrocentas criaturas com estatísticas, ecologia e comportamentos táticos para desafiar grupos de qualquer nível.",
         "../imagens/capas/livro_15.svg", "https://dnd.wizards.com/products/rpg-monster-manual", "compra", 68),

        (16, "D&D 5E - Caldeirão de Tasha para Tudo", "Wizards of the Coast", "D&D 5E", "Fantasia Medieval", "Suplemento",
         "Expansão trazendo a classe Artífice, regras opcionais de personalização de origens, patronos de grupo e dezenas de feitiços.",
         "../imagens/capas/livro_16.svg", "https://dnd.wizards.com/products/tashas-cauldron-everything", "compra", 55),

        (17, "D&D 5E - Guia de Xanathar para Todas as Coisas", "Wizards of the Coast", "D&D 5E", "Fantasia Medieval", "Suplemento",
         "Mais de trinta novas subclasses inovadoras, ferramentas para artesãos e novos sistemas para atividades de tempo livre.",
         "../imagens/capas/livro_17.svg", "https://dnd.wizards.com/products/xanathars-guide-everything", "compra", 53),

        (18, "D&D 5E - Tesouro dos Dragões de Fizban", "Wizards of the Coast", "D&D 5E", "Fantasia Medieval", "Suplemento",
         "O guia definitivo sobre a linhagem dos dragões, covis mágicos, novas subclasses e monstros dracônicos de alta letalidade.",
         "../imagens/capas/livro_18.svg", "https://dnd.wizards.com/products/fizbans-treasury-dragons", "compra", 43),

        (19, "Valda's Spire of Secrets", "Mage Hand Press", "D&D 5E", "Fantasia Medieval", "Homebrew",
         "O mais premiado homebrew de 5E financiado via Kickstarter, trazendo dez classes originais, 150 subclasses e dezenas de magias.",
         "../imagens/capas/livro_19.svg", "https://kickstarter.com/projects/magehandpress/spire-of-secrets", "financiamento", 38),

        (20, "Grim Hollow: The Campaign Guide", "Ghostfire Gaming", "D&D 5E", "Fantasia Medieval", "Homebrew",
         "Aclamado cenário homebrew de dark fantasy e horror gótico com transformações amaldiçoadas (vampiro, lobisomem, lich).",
         "../imagens/capas/livro_20.svg", "https://kickstarter.com/projects/ghostfire/grim-hollow-the-campaign-guide", "financiamento", 34),

        (21, "Tome of Beasts 3", "Kobold Press", "D&D 5E", "Fantasia Medieval", "Homebrew",
         "Suplemento bestiário independente com centenas de monstros únicos criados para desafiar veteranos da 5ª edição.",
         "../imagens/capas/livro_21.svg", "https://koboldpress.com/kpstore/product/tome-of-beasts-3-for-5th-edition/", "compra", 29),

        (22, "Flee, Mortals! The MCDM Monster Book", "MCDM Productions (Matt Colville)", "D&D 5E", "Fantasia Medieval", "Homebrew",
         "Financiamento recordista no Kickstarter reformulando o combate de monstros da 5E com ação dinâmica, lacaios e encontros cinematográficos.",
         "../imagens/capas/livro_22.svg", "https://kickstarter.com/projects/mattcolville/mcdm-monster-book", "financiamento", 46),

        # TORMENTA 20 & NACIONAIS
        (23, "Tormenta 20 - Edição Jogo do Ano", "Jambô Editora", "Tormenta 20", "Fantasia Medieval", "Manual Principal",
         "A versão definitiva do maior cenário de RPG nacional com mecânica de mana moderna, combate ágil e riqueza de lore.",
         "../imagens/capas/livro_23.svg", "https://jamboeditora.com.br/produto/tormenta20-edicao-jogo-do-ano/", "compra", 98),

        (24, "Ameaças de Arton - Tormenta 20", "Jambô Editora", "Tormenta 20", "Fantasia Medieval", "Bestiário",
         "Centenas de monstros do mundo de Arton, perigos climáticos, chefes lendários e regras de colossos de combate.",
         "../imagens/capas/livro_24.svg", "https://jamboeditora.com.br/produto/ameacas-de-arton/", "compra", 59),

        (25, "Heróis de Arton - Tormenta 20", "Jambô Editora", "Tormenta 20", "Fantasia Medieval", "Suplemento",
         "Grandes distinções heróicas, raças adicionais, magias supremas e novas perícias para elevar personagens ao status lendário.",
         "../imagens/capas/livro_25.svg", "https://jamboeditora.com.br/produto/herois-de-arton/", "compra", 54),

        (26, "Deuses de Arton - Tormenta 20", "Jambô Editora", "Tormenta 20", "Fantasia Medieval", "Suplemento",
         "Financiamento coletivo épico no Catarse aprofundando o Panteão dos vinte deuses de Tormenta, dogmas e ordens clericais.",
         "../imagens/capas/livro_26.svg", "https://catarse.me/deusesdearton", "financiamento", 49),

        (27, "Atlas de Arton - Tormenta 20", "Jambô Editora", "Tormenta 20", "Fantasia Medieval", "Cenário",
         "A geografia física, política e cultural detalhada de todos os reinos e territórios misteriosos do continente de Arton.",
         "../imagens/capas/livro_27.svg", "https://jamboeditora.com.br/produto/atlas-de-arton/", "compra", 41),

        (28, "Lendas de Ghanor RPG", "Jambô Editora (Jovem Nerd)", "Ghanor", "Fantasia Medieval", "Manual Principal",
         "Financiamento recordista de fantasia medieval no Catarse baseado no universo de Ruff Ghanor, com batalhas de exércitos e feudos.",
         "../imagens/capas/livro_28.svg", "https://catarse.me/ghanor", "financiamento", 64),

        (29, "Old Dragon 2 - Caixa Básica", "Fabiano Neme e Rafael Beltrame", "Old Dragon", "Fantasia Medieval", "Manual Principal",
         "Financiamento coletivo no Catarse resgatando a essência do RPG clássico de masmorras e espadas em português.",
         "../imagens/capas/livro_29.svg", "https://catarse.me/olddragon2", "financiamento", 52),

        (30, "Shadowdark RPG", "Kelsey Dionne (The Arcane Library)", "Shadowdark", "Fantasia Medieval", "Manual Principal",
         "Financiamento multimilionário no Kickstarter trazendo exploração de masmorras com tocha em tempo real e regras velozes.",
         "../imagens/capas/livro_30.svg", "https://kickstarter.com/projects/shadowdark/shadowdark-rpg", "financiamento", 47),

        (31, "Pathfinder 2ª Edição - Livro Básico", "Paizo / New Order Editora", "Pathfinder 2E", "Fantasia Medieval", "Manual Principal",
         "Sistema tático refinado com ação em três pontos, milhares de talentos customizáveis e suporte profundo a aventuras fantásticas.",
         "../imagens/capas/livro_31.svg", "https://newordereditora.com/loja/rpg/pathfinder2/livro-basico-pathfinder-segunda-edicao/", "compra", 58),

        # HORROR CÓSMICO
        (32, "Chamado de Cthulhu 7ª Edição", "Chaosium / New Order Editora", "Chamado de Cthulhu", "Horror Cósmico", "Manual Principal",
         "O mais célebre RPG de terror e investigação baseado nos mitos de Lovecraft, com regras de sanidade mental e dados percentuais.",
         "../imagens/capas/livro_32.svg", "https://newordereditora.com/loja/rpg/chamado-de-cthulhu/", "compra", 71),

        (33, "Pulp Cthulhu - Suplemento 7E", "Chaosium / New Order Editora", "Chamado de Cthulhu", "Horror Cósmico", "Suplemento",
         "Regras para combates heróicos e ação desenfreada no estilo aventura pulp contra os horrores sobrenaturais de Cthulhu.",
         "../imagens/capas/livro_33.svg", "https://newordereditora.com/loja/rpg/chamado-de-cthulhu/pulp-cthulhu/", "compra", 36),

        (34, "Ordem Paranormal RPG", "Cellbit e Felipe Della Corte", "Ordem Paranormal", "Horror Cósmico", "Manual Principal",
         "Fenômeno brasileiro de investigação e combate tático contra entidades paranormais do Outro Lado usando rituais ocultistas.",
         "../imagens/capas/livro_34.svg", "https://jamboeditora.com.br/produto/ordem-paranormal-rpg-livro-basico/", "compra", 99),

        (35, "Ordem Paranormal - Sobrevivendo ao Horror", "Jambô Editora", "Ordem Paranormal", "Horror Cósmico", "Suplemento",
         "Financiamento coletivo no Catarse expandindo as ameaças paranormais, novos rituais sombrios e mecânicas de sobrevivência.",
         "../imagens/capas/livro_35.svg", "https://catarse.me/ordemparanormal", "financiamento", 65),

        (36, "Vampiro: A Máscara 5ª Edição (V5)", "World of Darkness / Galápagos", "Vampiro: A Máscara", "Horror Cósmico", "Manual Principal",
         "RPG de horror pessoal e drama político onde os jogadores interpretam vampiros lutando para manter sua humanidade nas noites modernas.",
         "../imagens/capas/livro_36.svg", "https://galapagosjogos.com.br/vampiro-a-mascara-5a-edicao", "compra", 63),

        (37, "Kult: Divindade Perdida", "Helmgast / Buró Brasil", "Kult", "Horror Cósmico", "Manual Principal",
         "Financiamento coletivo no Catarse trazendo o aterrorizante RPG onde o mundo real é apenas uma ilusão que esconde horrores cósmicos.",
         "../imagens/capas/livro_37.svg", "https://catarse.me/kult", "financiamento", 37),

        (38, "Delta Green: Agent's Handbook", "Arc Dream Publishing", "Delta Green", "Horror Cósmico", "Manual Principal",
         "Conspirações governamentais secretas enfrentando ameaças cósmicas contemporâneas com regras afiadas de investigação.",
         "../imagens/capas/livro_38.svg", "https://drivethrurpg.com/product/181674/Delta-Green-Agents-Handbook", "compra", 28),

        # CYBERPUNK
        (39, "Cyberpunk RED", "Mike Pondsmith (R. Talsorian / Devir)", "Cyberpunk RED", "Cyberpunk", "Manual Principal",
         "O RPG da Era do Vermelho em Night City, mercenários implacáveis, tecnologia cibernética e tiroteios mortais contra megacorporações.",
         "../imagens/capas/livro_39.svg", "https://devir.com.br/cyberpunk-red/", "compra", 74),

        (40, "Interface RED Vol. 1", "R. Talsorian Games", "Cyberpunk RED", "Cyberpunk", "Suplemento",
         "Coletânea de regras adicionais com novos drones autônomos, cyberware de ponta, armas exóticas e encontros urbanos.",
         "../imagens/capas/livro_40.svg", "https://talsorianstore.com/products/interface-red-vol-1", "compra", 31),

        (41, "Mothership RPG: Sci-Fi Horror", "Sean McCoy (Tuesday Knight Games)", "Mothership", "Cyberpunk", "Manual Principal",
         "Financiamento cult milionário no Kickstarter de terror e sobrevivência em estações espaciais abandonadas com mecânica de pânico.",
         "../imagens/capas/livro_41.svg", "https://kickstarter.com/projects/gerdling/mothership-sci-fi-horror-rpg-1st-edition-boxed-set", "financiamento", 48),

        (42, "Alien RPG - Livro de Regras", "Free League / New Order Editora", "Alien RPG", "Cyberpunk", "Manual Principal",
         "RPG oficial cinematográfico de horror espacial com tensão contínua contra os Xenomorfos sob a influência da Corporação Weyland.",
         "../imagens/capas/livro_42.svg", "https://newordereditora.com/loja/rpg/alien-rpg/", "compra", 56),

        (43, "Lancer RPG: Core Rulebook", "Massif Press", "Lancer", "Cyberpunk", "Manual Principal",
         "Financiamento revolucionário no Kickstarter de combates táticos em mechas gigantes com customização de chassi e inteligências artificiais.",
         "../imagens/capas/livro_43.svg", "https://kickstarter.com/projects/massifpress/lancer", "financiamento", 39),

        (44, "Starfinder - Livro Básico", "Paizo / New Order Editora", "Starfinder", "Cyberpunk", "Manual Principal",
         "Ópera espacial de ficção científica e fantasia com naves estelares customizáveis, magia tecnológica e mundos alienígenas.",
         "../imagens/capas/livro_44.svg", "https://newordereditora.com/loja/rpg/starfinder/", "compra", 42)
    ]

    for id_, titulo, autor, sistema, tipo_jogo, categoria, sinopse, capa_url, link_compra, tipo_link, downloads in livros_iniciais:
        Livro.objects.update_or_create(
            id=id_,
            defaults={
                'titulo': titulo,
                'autor': autor,
                'sistema': sistema,
                'tipo_jogo': tipo_jogo,
                'categoria': categoria,
                'sinopse': sinopse,
                'capa_url': capa_url,
                'link_compra': link_compra,
                'tipo_link': tipo_link,
                'downloads': downloads
            }
        )

    # 3. Avaliações Iniciais
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

    if Avaliacao.objects.count() == 0:
        for livro_id, usuario, nota, comentario in avaliacoes_iniciais:
            livro = Livro.objects.filter(id=livro_id).first()
            if livro:
                Avaliacao.objects.create(
                    livro=livro,
                    usuario=usuario,
                    nota=nota,
                    comentario=comentario
                )

    # 4. Fórum Tópicos e Comentários Iniciais
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

    for id_, titulo, autor, sistema, conteudo in topicos_iniciais:
        ForumTopico.objects.update_or_create(
            id=id_,
            defaults={
                'titulo': titulo,
                'autor': autor,
                'sistema': sistema,
                'conteudo': conteudo
            }
        )

    comentarios_iniciais = [
        (1, "Chocobo Mestre", "Usar relógios de contagem (Clocks) e mudar a música quando o chefe entra na segunda fase deixa os jogadores de queixo caído! Funciona demais em Fabula Ultima.", 5),
        (1, "Maga do Cristal", "As habilidades de Pressentimento e Vulnerabilidade Elemental deixam os combates idênticos aos melhores jogos da Square Enix.", 5),
        (2, "Viajante Ryu", "Ryuutama é perfeito se você quer uma atmosfera relaxante de viagem tipo Studio Ghibli, enquanto Fabula Ultima brilha na fantasia épica de anime shonen!", 5),
        (3, "Bucaneiro Audaz", "O Bucaneiro de Tormenta 20 é incrível! Muita audácia, mobilidade e manobras com panache.", 5),
        (4, "Apoiador Veterano", "Os financiamentos do Catarse têm entregado livros lindos no Brasil, recomendo muito acompanhar os lançamentos da Jambô e da Buró.", 5)
    ]

    if ForumComentario.objects.count() == 0:
        for topico_id, usuario, texto, avaliacao in comentarios_iniciais:
            topico = ForumTopico.objects.filter(id=topico_id).first()
            if topico:
                ForumComentario.objects.create(
                    topico=topico,
                    usuario=usuario,
                    texto=texto,
                    avaliacao=avaliacao
                )

    print(f">> Povoamento concluído com sucesso!")
    print(f"   - {Usuario.objects.count()} Usuários cadastrados.")
    print(f"   - {Livro.objects.count()} Livros catalogados.")
    print(f"   - {Avaliacao.objects.count()} Avaliações salvas.")
    print(f"   - {ForumTopico.objects.count()} Tópicos no fórum.")
    print(f"   - {ForumComentario.objects.count()} Comentários no fórum.")

if __name__ == '__main__':
    run_seed()

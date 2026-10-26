// Arquivo: pesquisar.js - Catálogo Dinâmico via API com Tópicos de Tipo de Jogo, Suplementos, Homebrews e Capas via URL Web

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('catalogoDinamicoContainer');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const statusContador = document.getElementById('statusContadorLivros');
    const botoesTipoJogo = document.querySelectorAll('#filtrosTipoJogo .filter-btn');
    const botoesAquisicao = document.querySelectorAll('.btn-aquisicao-filtro');

    let todosOsLivros = [];
    let tipoJogoAtivo = 'Todos';
    let aquisicaoAtiva = 'todos';
    let termoBusca = '';

    // Metadados dos Tópicos de Tipo de Jogo (sem emojis excessivos)
    const metadadosTipos = {
        'JJRPG': {
            titulo: 'Tópico: JJRPG (RPG Estilo Japonês / Anime)',
            descricao: 'Grimórios inspirados nos videogames de 8, 16 e 32 bits, com combates em turnos, laços narrativos e fantasia épica.',
            ordem: 1
        },
        'Fantasia Medieval': {
            titulo: 'Tópico: Fantasia Medieval Clássica & D20',
            descricao: 'Masmorras ancestrais, dragões lendários, grandes magias e os sistemas mais jogados do mundo dos RPGs de mesa.',
            ordem: 2
        },
        'Horror Cósmico': {
            titulo: 'Tópico: Horror Cósmico, Sobrenatural & Investigação',
            descricao: 'Histórias sombrias de insanidade, mistérios paranormais e o enfrentamento de horrores ocultos.',
            ordem: 3
        },
        'Cyberpunk': {
            titulo: 'Tópico: Cyberpunk, Distopias & Ficção Científica',
            descricao: 'Megacorporações, implantes cibernéticos, distopias de neon, mechas táticos e terror no espaço sideral.',
            ordem: 4
        }
    };

    // Imagem SVG elegante em caso de falha de conexão com imagem externa
    const placeholderSvg = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%27300%27%20height%3D%27420%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20300%20420%27%20preserveAspectRatio%3D%27none%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%25%27%20stop-color%3D%27%231c1f2b%27%2F%3E%3Cstop%20offset%3D%27100%25%27%20stop-color%3D%27%230d0f14%27%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20fill%3D%27url(%23g)%27%2F%3E%3Ctext%20x%3D%2750%25%27%20y%3D%2748%25%27%20fill%3D%27%23facc15%27%20font-family%3D%27sans-serif%27%20font-size%3D%2716%27%20font-weight%3D%27bold%27%20text-anchor%3D%27middle%27%3EBiblioteca%20Drac%C3%B4nica%3C%2Ftext%3E%3Ctext%20x%3D%2750%25%27%20y%3D%2755%25%27%20fill%3D%27%2394a3b8%27%20font-family%3D%27sans-serif%27%20font-size%3D%2712%27%20text-anchor%3D%27middle%27%3EGrim%C3%B3rio%20de%20RPG%3C%2Ftext%3E%3C%2Fsvg%3E";

    // Acervo completo com 44 grimórios (Básicos, Suplementos e Homebrews) com capas em URLs diretas na Web
    const livrosFallback = [
        // JJRPG
        { id: 1, titulo: "Fabula Ultima - Livro Básico", autor: "Emanuele Galletto (Need Games)", sistema: "Fabula Ultima", tipo_jogo: "JJRPG", categoria: "Manual Principal", sinopse: "O premiado RPG de mesa que homenageia os clássicos JRPGs dos videogames de 8 e 16 bits como Final Fantasy, Chrono Trigger e Dragon Quest.", capa_url: "https://m.media-amazon.com/images/I/81x1Q1rC0nL._AC_SL1500_.jpg", link_compra: "https://www.needgames.it/fabula-ultima-en/", tipo_link: "compra", media_nota: 5.0, total_avaliacoes: 2 },
        { id: 2, titulo: "Fabula Ultima - Guia do Mestre", autor: "Need Games", sistema: "Fabula Ultima", tipo_jogo: "JJRPG", categoria: "Suplemento", sinopse: "Ferramentas avançadas, design narrativo e regras para combates contra superchefes e sagas épicas em turnos.", capa_url: "https://preview.drivethrurpg.com/images/1547/439736.jpg", link_compra: "https://www.needgames.it/fabula-ultima-en/", tipo_link: "compra", media_nota: 4.8, total_avaliacoes: 1 },
        { id: 3, titulo: "Atlas Techno Fantasy - Fabula Ultima", autor: "Need Games", sistema: "Fabula Ultima", tipo_jogo: "JJRPG", categoria: "Suplemento", sinopse: "Mergulhe em mundos futuristas estilo Final Fantasy VII com mechas, distopias corporativas, veículos voadores e magia tecnológica.", capa_url: "https://preview.drivethrurpg.com/images/1547/480838.jpg", link_compra: "https://www.needgames.it/categoria-prodotto/fabula-ultima-en/", tipo_link: "compra", media_nota: 5.0, total_avaliacoes: 1 },
        { id: 4, titulo: "Atlas High Fantasy - Fabula Ultima", autor: "Need Games", sistema: "Fabula Ultima", tipo_jogo: "JJRPG", categoria: "Suplemento", sinopse: "Magia ancestral pura, reinos suspensos nas nuvens, grandes cristais de poder e lendas divinas no melhor estilo JRPG tradicional.", capa_url: "https://preview.drivethrurpg.com/images/1547/460773.jpg", link_compra: "https://www.needgames.it/categoria-prodotto/fabula-ultima-en/", tipo_link: "compra", media_nota: 4.9, total_avaliacoes: 1 },
        { id: 5, titulo: "Atlas Natural Fantasy - Fabula Ultima", autor: "Need Games", sistema: "Fabula Ultima", tipo_jogo: "JJRPG", categoria: "Suplemento", sinopse: "Cenários idílicos inspirados na natureza, harmonia com espíritos da terra e exploração de ruínas estilo Zelda e Studio Ghibli.", capa_url: "https://preview.drivethrurpg.com/images/1547/495000.jpg", link_compra: "https://www.needgames.it/categoria-prodotto/fabula-ultima-en/", tipo_link: "compra", media_nota: 5.0, total_avaliacoes: 1 },
        { id: 6, titulo: "Codex Extra - Fabula Ultima", autor: "Need Games / Rooster Ema", sistema: "Fabula Ultima", tipo_jogo: "JJRPG", categoria: "Homebrew", sinopse: "Classes inéditas criadas pela comunidade e autor, novas perícias heróicas e mecânicas disponibilizadas via financiamento contínuo no Patreon.", capa_url: "https://preview.drivethrurpg.com/images/1547/410108.jpg", link_compra: "https://www.patreon.com/roosterema", tipo_link: "financiamento", media_nota: 5.0, total_avaliacoes: 2 },
        { id: 7, titulo: "Ryuutama: Natural Fantasy RPG", autor: "Atsuhiro Okada", sistema: "Ryuutama", tipo_jogo: "JJRPG", categoria: "Manual Principal", sinopse: "O aclamado RPG de fantasia acolhedora de viagem, companheirismo, mapas e dragões protetores, conhecido como o RPG estilo Ghibli.", capa_url: "https://preview.drivethrurpg.com/images/2340/151366.jpg", link_compra: "https://kotohi.com/ryuutama/", tipo_link: "compra", media_nota: 5.0, total_avaliacoes: 1 },
        { id: 8, titulo: "Kamigakari: God Hunters", autor: "Shunsaku Yano", sistema: "Kamigakari", tipo_jogo: "JJRPG", categoria: "Manual Principal", sinopse: "Modern Fantasy JRPG cinematográfico repleto de combates dinâmicos com caçadores de deuses enfrentando anomalias na Tóquio contemporânea.", capa_url: "https://preview.drivethrurpg.com/images/13840/240304.jpg", link_compra: "https://www.drivethrurpg.com/en/product/240304/kamigakari-god-hunters", tipo_link: "compra", media_nota: 4.7, total_avaliacoes: 1 },
        { id: 9, titulo: "Tenra Bansho Zero", autor: "Junichi Inoue", sistema: "Tenra Bansho Zero", tipo_jogo: "JJRPG", categoria: "Manual Principal", sinopse: "Hiper-RPG japonês de fantasia feudal oriental, magia mecânica, samurais cibernéticos, ninjas e drama intenso de anime shonen.", capa_url: "https://preview.drivethrurpg.com/images/2340/111529.jpg", link_compra: "https://www.drivethrurpg.com/en/product/111529/tenra-bansho-zero-heaven-and-earth-edition", tipo_link: "compra", media_nota: 4.9, total_avaliacoes: 1 },
        { id: 10, titulo: "Sword World 2.5 - Livro de Regras I", autor: "Kei Kitazawa (Group SNE)", sistema: "Sword World", tipo_jogo: "JJRPG", categoria: "Manual Principal", sinopse: "O RPG de mesa mais longevo e jogado do Japão, base do cenário de Lodoss War com combates por dados d6 e progressão veloz.", capa_url: "https://m.media-amazon.com/images/I/71u9sW4YwZL._AC_SL1200_.jpg", link_compra: "https://bookwalker.jp/", tipo_link: "compra", media_nota: 4.8, total_avaliacoes: 1 },
        { id: 11, titulo: "Anima: Beyond Fantasy", autor: "Carlos B. Garcia (Edge Studio)", sistema: "Anima", tipo_jogo: "JJRPG", categoria: "Manual Principal", sinopse: "RPG de alta fantasia épica oriental com influências profundas de videogames japoneses, artes marciais ki e magia de escala cósmica.", capa_url: "https://m.media-amazon.com/images/I/81Pj6l8V-jL._AC_SL1500_.jpg", link_compra: "https://www.drivethrurpg.com/en/product/64295/anima-beyond-fantasy-core-exxet", tipo_link: "compra", media_nota: 4.7, total_avaliacoes: 1 },
        { id: 12, titulo: "Maid: The Role-Playing Game", autor: "Ryo Kamiya", sistema: "Maid RPG", tipo_jogo: "JJRPG", categoria: "Manual Principal", sinopse: "Comédia anime leve e irreverente com tabelas de eventos aleatórios e criação ultrarrápida de personagens em mansões fantásticas.", capa_url: "https://preview.drivethrurpg.com/images/2340/12432.jpg", link_compra: "https://www.drivethrurpg.com/en/product/12432/maid-the-role-playing-game", tipo_link: "compra", media_nota: 4.6, total_avaliacoes: 1 },

        // Fantasia Medieval
        { id: 13, titulo: "D&D 5E - Livro do Jogador", autor: "Wizards of the Coast", sistema: "D&D 5E", tipo_jogo: "Fantasia Medieval", categoria: "Manual Principal", sinopse: "O guia essencial de regras fundamentais, raças, classes lendárias, perícias e listas de magias para jogar a 5ª edição.", capa_url: "https://m.media-amazon.com/images/I/81T6V2pL7uL._AC_SL1500_.jpg", link_compra: "https://www.amazon.com.br/dp/8583651158", tipo_link: "compra", media_nota: 5.0, total_avaliacoes: 5 },
        { id: 14, titulo: "D&D 5E - Guia do Mestre", autor: "Wizards of the Coast", sistema: "D&D 5E", tipo_jogo: "Fantasia Medieval", categoria: "Suplemento", sinopse: "Diretrizes para arquitetura de masmorras, armadilhas criativas, tabelas completas de tesouros e condução de crônicas medievais.", capa_url: "https://m.media-amazon.com/images/I/81bH9q1h8EL._AC_SL1500_.jpg", link_compra: "https://www.amazon.com.br/dp/8583651166", tipo_link: "compra", media_nota: 4.8, total_avaliacoes: 2 },
        { id: 15, titulo: "D&D 5E - Manual dos Monstros", autor: "Wizards of the Coast", sistema: "D&D 5E", tipo_jogo: "Fantasia Medieval", categoria: "Bestiário", sinopse: "Mais de quatrocentas criaturas com estatísticas, ecologia e comportamentos táticos para desafiar grupos de qualquer nível.", capa_url: "https://m.media-amazon.com/images/I/81x12bL+M3L._AC_SL1500_.jpg", link_compra: "https://www.amazon.com.br/dp/8583651174", tipo_link: "compra", media_nota: 4.9, total_avaliacoes: 3 },
        { id: 16, titulo: "D&D 5E - Caldeirão de Tasha para Tudo", autor: "Wizards of the Coast", sistema: "D&D 5E", tipo_jogo: "Fantasia Medieval", categoria: "Suplemento", sinopse: "Expansão trazendo a classe Artífice, regras opcionais de personalização de origens, patronos de grupo e dezenas de feitiços.", capa_url: "https://m.media-amazon.com/images/I/81R6Q4R+K3L._AC_SL1500_.jpg", link_compra: "https://www.amazon.com.br/dp/8583651913", tipo_link: "compra", media_nota: 4.9, total_avaliacoes: 2 },
        { id: 17, titulo: "D&D 5E - Guia de Xanathar para Todas as Coisas", autor: "Wizards of the Coast", sistema: "D&D 5E", tipo_jogo: "Fantasia Medieval", categoria: "Suplemento", sinopse: "Mais de trinta novas subclasses inovadoras, ferramentas para artesãos e novos sistemas para atividades de tempo livre.", capa_url: "https://m.media-amazon.com/images/I/81q2X9p5oDL._AC_SL1500_.jpg", link_compra: "https://www.amazon.com.br/dp/8583651581", tipo_link: "compra", media_nota: 4.8, total_avaliacoes: 2 },
        { id: 18, titulo: "D&D 5E - Tesouro dos Dragões de Fizban", autor: "Wizards of the Coast", sistema: "D&D 5E", tipo_jogo: "Fantasia Medieval", categoria: "Suplemento", sinopse: "O guia definitivo sobre a linhagem dos dragões, covis mágicos, novas subclasses e monstros dracônicos de alta letalidade.", capa_url: "https://m.media-amazon.com/images/I/81Wn6G9oKNL._AC_SL1500_.jpg", link_compra: "https://www.amazon.com.br/dp/0786967293", tipo_link: "compra", media_nota: 4.9, total_avaliacoes: 1 },
        { id: 19, titulo: "Valda's Spire of Secrets", autor: "Mage Hand Press", sistema: "D&D 5E", tipo_jogo: "Fantasia Medieval", categoria: "Homebrew", sinopse: "O mais premiado homebrew de 5E financiado via Kickstarter, trazendo dez classes originais, 150 subclasses e dezenas de magias.", capa_url: "https://m.media-amazon.com/images/I/81m9rG8Y9VL._AC_SL1500_.jpg", link_compra: "https://www.kickstarter.com/projects/magehandpress/spire-of-secrets", tipo_link: "financiamento", media_nota: 5.0, total_avaliacoes: 3 },
        { id: 20, titulo: "Grim Hollow: The Campaign Guide", autor: "Ghostfire Gaming", sistema: "D&D 5E", tipo_jogo: "Fantasia Medieval", categoria: "Homebrew", sinopse: "Aclamado cenário homebrew de dark fantasy e horror gótico com transformações amaldiçoadas (vampiro, lobisomem, lich).", capa_url: "https://m.media-amazon.com/images/I/81h8kL7pQXL._AC_SL1500_.jpg", link_compra: "https://ghostfiregaming.com/grim-hollow/", tipo_link: "financiamento", media_nota: 4.9, total_avaliacoes: 2 },
        { id: 21, titulo: "Tome of Beasts 3", autor: "Kobold Press", sistema: "D&D 5E", tipo_jogo: "Fantasia Medieval", categoria: "Homebrew", sinopse: "Suplemento bestiário independente com centenas de monstros únicos criados para desafiar veteranos da 5ª edição.", capa_url: "https://m.media-amazon.com/images/I/81Y7y6qT7VL._AC_SL1500_.jpg", link_compra: "https://koboldpress.com/kpstore/product/tome-of-beasts-3-for-5th-edition/", tipo_link: "compra", media_nota: 4.8, total_avaliacoes: 1 },
        { id: 22, titulo: "Flee, Mortals! The MCDM Monster Book", autor: "MCDM Productions (Matt Colville)", sistema: "D&D 5E", tipo_jogo: "Fantasia Medieval", categoria: "Homebrew", sinopse: "Financiamento recordista no Kickstarter reformulando o combate de monstros da 5E com ação dinâmica, lacaios e encontros cinematográficos.", capa_url: "https://m.media-amazon.com/images/I/81e5p8Vq1ML._AC_SL1500_.jpg", link_compra: "https://www.kickstarter.com/projects/mattcolville/mcdm-monster-book", tipo_link: "financiamento", media_nota: 5.0, total_avaliacoes: 2 },
        { id: 23, titulo: "Tormenta 20 - Edição Jogo do Ano", autor: "Jambô Editora", sistema: "Tormenta 20", tipo_jogo: "Fantasia Medieval", categoria: "Manual Principal", sinopse: "A versão definitiva do maior cenário de RPG nacional com mecânica de mana moderna, combate ágil e riqueza de lore.", capa_url: "https://jamboeditora.com.br/wp-content/uploads/2022/10/T20_Jogo-do-Ano_Capa_site.jpg", link_compra: "https://jamboeditora.com.br/produto/tormenta20-edicao-jogo-do-ano/", tipo_link: "compra", media_nota: 5.0, total_avaliacoes: 4 },
        { id: 24, titulo: "Ameaças de Arton - Tormenta 20", autor: "Jambô Editora", sistema: "Tormenta 20", tipo_jogo: "Fantasia Medieval", categoria: "Bestiário", sinopse: "Centenas de monstros do mundo de Arton, perigos climáticos, chefes lendários e regras de colossos de combate.", capa_url: "https://jamboeditora.com.br/wp-content/uploads/2023/11/Ameacas-de-Arton_capa-site.jpg", link_compra: "https://jamboeditora.com.br/produto/ameacas-de-arton/", tipo_link: "compra", media_nota: 4.9, total_avaliacoes: 2 },
        { id: 25, titulo: "Heróis de Arton - Tormenta 20", autor: "Jambô Editora", sistema: "Tormenta 20", tipo_jogo: "Fantasia Medieval", categoria: "Suplemento", sinopse: "Grandes distinções heróicas, raças adicionais, magias supremas e novas perícias para elevar personagens ao status lendário.", capa_url: "https://jamboeditora.com.br/wp-content/uploads/2024/07/Herois-de-Arton_capa-site.jpg", link_compra: "https://jamboeditora.com.br/produto/herois-de-arton/", tipo_link: "compra", media_nota: 4.8, total_avaliacoes: 2 },
        { id: 26, titulo: "Deuses de Arton - Tormenta 20", autor: "Jambô Editora", sistema: "Tormenta 20", tipo_jogo: "Fantasia Medieval", categoria: "Suplemento", sinopse: "Financiamento coletivo épico no Catarse aprofundando o Panteão dos vinte deuses de Tormenta, dogmas e ordens clericais.", capa_url: "https://jamboeditora.com.br/wp-content/uploads/2023/11/Atlas-de-Arton_capa-site.jpg", link_compra: "https://www.catarse.me/deusesdearton", tipo_link: "financiamento", media_nota: 5.0, total_avaliacoes: 3 },
        { id: 27, titulo: "Atlas de Arton - Tormenta 20", autor: "Jambô Editora", sistema: "Tormenta 20", tipo_jogo: "Fantasia Medieval", categoria: "Cenário", sinopse: "A geografia física, política e cultural detalhada de todos os reinos e territórios misteriosos do continente de Arton.", capa_url: "https://jamboeditora.com.br/wp-content/uploads/2023/11/Atlas-de-Arton_capa-site.jpg", link_compra: "https://jamboeditora.com.br/produto/atlas-de-arton/", tipo_link: "compra", media_nota: 4.9, total_avaliacoes: 2 },
        { id: 28, titulo: "Lendas de Ghanor RPG", autor: "Jambô Editora (Jovem Nerd)", sistema: "Ghanor", tipo_jogo: "Fantasia Medieval", categoria: "Manual Principal", sinopse: "Financiamento recordista de fantasia medieval no Catarse baseado no universo de Ruff Ghanor, com batalhas de exércitos e feudos.", capa_url: "https://jamboeditora.com.br/wp-content/uploads/2022/10/Ghanor-RPG_Capa-site.jpg", link_compra: "https://www.catarse.me/ghanor", tipo_link: "financiamento", media_nota: 5.0, total_avaliacoes: 2 },
        { id: 29, titulo: "Old Dragon 2 - Caixa Básica", autor: "Fabiano Neme e Rafael Beltrame", sistema: "Old Dragon", tipo_jogo: "Fantasia Medieval", categoria: "Manual Principal", sinopse: "Financiamento coletivo no Catarse resgatando a essência do RPG clássico de masmorras e espadas em português.", capa_url: "https://m.media-amazon.com/images/I/81e5p8Vq1ML._AC_SL1500_.jpg", link_compra: "https://www.catarse.me/olddragon2", tipo_link: "financiamento", media_nota: 4.8, total_avaliacoes: 2 },
        { id: 30, titulo: "Shadowdark RPG", autor: "Kelsey Dionne (The Arcane Library)", sistema: "Shadowdark", tipo_jogo: "Fantasia Medieval", categoria: "Manual Principal", sinopse: "Financiamento multimilionário no Kickstarter trazendo exploração de masmorras com tocha em tempo real e regras velozes.", capa_url: "https://m.media-amazon.com/images/I/81Y7y6qT7VL._AC_SL1500_.jpg", link_compra: "https://www.thearcanelibrary.com/pages/shadowdark", tipo_link: "financiamento", media_nota: 4.9, total_avaliacoes: 1 },
        { id: 31, titulo: "Pathfinder 2ª Edição - Livro Básico", autor: "Paizo / New Order Editora", sistema: "Pathfinder 2E", tipo_jogo: "Fantasia Medieval", categoria: "Manual Principal", sinopse: "Sistema tático refinado com ação em três pontos, milhares de talentos customizáveis e suporte profundo a aventuras fantásticas.", capa_url: "https://m.media-amazon.com/images/I/81y7W4G8o9L._AC_SL1500_.jpg", link_compra: "https://newordereditora.com/loja/rpg/pathfinder-2/", tipo_link: "compra", media_nota: 4.9, total_avaliacoes: 2 },

        // Horror Cósmico
        { id: 32, titulo: "Chamado de Cthulhu 7ª Edição", autor: "Chaosium / New Order Editora", sistema: "Chamado de Cthulhu", tipo_jogo: "Horror Cósmico", categoria: "Manual Principal", sinopse: "O mais célebre RPG de terror e investigação baseado nos mitos de Lovecraft, com regras de sanidade mental e dados percentuais.", capa_url: "https://m.media-amazon.com/images/I/81xXy4L1FQL._AC_SL1500_.jpg", link_compra: "https://newordereditora.com/loja/rpg/chamado-de-cthulhu/", tipo_link: "compra", media_nota: 5.0, total_avaliacoes: 3 },
        { id: 33, titulo: "Pulp Cthulhu - Suplemento 7E", autor: "Chaosium / New Order Editora", sistema: "Chamado de Cthulhu", tipo_jogo: "Horror Cósmico", categoria: "Suplemento", sinopse: "Regras para combates heróicos e ação desenfreada no estilo aventura pulp contra os horrores sobrenaturais de Cthulhu.", capa_url: "https://m.media-amazon.com/images/I/81fH8p5rM8L._AC_SL1500_.jpg", link_compra: "https://newordereditora.com/loja/rpg/chamado-de-cthulhu/", tipo_link: "compra", media_nota: 4.8, total_avaliacoes: 1 },
        { id: 34, titulo: "Ordem Paranormal RPG", autor: "Cellbit e Felipe Della Corte", sistema: "Ordem Paranormal", tipo_jogo: "Horror Cósmico", categoria: "Manual Principal", sinopse: "Fenômeno brasileiro de investigação e combate tático contra entidades paranormais do Outro Lado usando rituais ocultistas.", capa_url: "https://jamboeditora.com.br/wp-content/uploads/2022/10/Ordem-Paranormal-RPG_capa-site.jpg", link_compra: "https://jamboeditora.com.br/categoria/rpg/ordem-paranormal-rpg/", tipo_link: "compra", media_nota: 5.0, total_avaliacoes: 6 },
        { id: 35, titulo: "Ordem Paranormal - Sobrevivendo ao Horror", autor: "Jambô Editora", sistema: "Ordem Paranormal", tipo_jogo: "Horror Cósmico", categoria: "Suplemento", sinopse: "Financiamento coletivo no Catarse expandindo as ameaças paranormais, novos rituais sombrios e mecânicas de sobrevivência.", capa_url: "https://jamboeditora.com.br/wp-content/uploads/2024/07/Herois-de-Arton_capa-site.jpg", link_compra: "https://www.catarse.me/ordemparanormal", tipo_link: "financiamento", media_nota: 4.9, total_avaliacoes: 2 },
        { id: 36, titulo: "Vampiro: A Máscara 5ª Edição (V5)", autor: "World of Darkness / Galápagos", sistema: "Vampiro: A Máscara", tipo_jogo: "Horror Cósmico", categoria: "Manual Principal", sinopse: "RPG de horror pessoal e drama político onde os jogadores interpretam vampiros lutando para manter sua humanidade nas noites modernas.", capa_url: "https://m.media-amazon.com/images/I/81K0Qy2p7aL._AC_SL1500_.jpg", link_compra: "https://mundogalapagos.com.br/vampiro-a-mascara-5-edicao-livro-de-regras/produto/VAM001", tipo_link: "compra", media_nota: 4.8, total_avaliacoes: 2 },
        { id: 37, titulo: "Kult: Divindade Perdida", autor: "Helmgast / Buró Brasil", sistema: "Kult", tipo_jogo: "Horror Cósmico", categoria: "Manual Principal", sinopse: "Financiamento coletivo no Catarse trazendo o aterrorizante RPG onde o mundo real é apenas uma ilusão que esconde horrores cósmicos.", capa_url: "https://m.media-amazon.com/images/I/71u9sW4YwZL._AC_SL1200_.jpg", link_compra: "https://www.catarse.me/kult", tipo_link: "financiamento", media_nota: 4.8, total_avaliacoes: 1 },
        { id: 38, titulo: "Delta Green: Agent's Handbook", autor: "Arc Dream Publishing", sistema: "Delta Green", tipo_jogo: "Horror Cósmico", categoria: "Manual Principal", sinopse: "Conspirações governamentais secretas enfrentando ameaças cósmicas contemporâneas com regras afiadas de investigação.", capa_url: "https://preview.drivethrurpg.com/images/1547/181674.jpg", link_compra: "https://www.drivethrurpg.com/en/product/181674/delta-green-agent-s-handbook", tipo_link: "compra", media_nota: 4.9, total_avaliacoes: 1 },

        // Cyberpunk & Sci-Fi
        { id: 39, titulo: "Cyberpunk RED", autor: "Mike Pondsmith (R. Talsorian / Devir)", sistema: "Cyberpunk RED", tipo_jogo: "Cyberpunk", categoria: "Manual Principal", sinopse: "O RPG da Era do Vermelho em Night City, mercenários implacáveis, tecnologia cibernética e tiroteios mortais contra megacorporações.", capa_url: "https://m.media-amazon.com/images/I/81F5G8o6NRL._AC_SL1500_.jpg", link_compra: "https://devir.com.br/cyberpunk-red/", tipo_link: "compra", media_nota: 4.9, total_avaliacoes: 3 },
        { id: 40, titulo: "Interface RED Vol. 1", autor: "R. Talsorian Games", sistema: "Cyberpunk RED", tipo_jogo: "Cyberpunk", categoria: "Suplemento", sinopse: "Coletânea de regras adicionais com novos drones autônomos, cyberware de ponta, armas exóticas e encontros urbanos.", capa_url: "https://preview.drivethrurpg.com/images/13/380649.jpg", link_compra: "https://talsorianstore.com/products/interface-red-vol-1", tipo_link: "compra", media_nota: 4.8, total_avaliacoes: 1 },
        { id: 41, titulo: "Mothership RPG: Sci-Fi Horror", autor: "Sean McCoy (Tuesday Knight Games)", sistema: "Mothership", tipo_jogo: "Cyberpunk", categoria: "Manual Principal", sinopse: "Financiamento cult milionário no Kickstarter de terror e sobrevivência em estações espaciais abandonadas com mecânica de pânico.", capa_url: "https://preview.drivethrurpg.com/images/13601/242638.jpg", link_compra: "https://www.kickstarter.com/projects/gerbl/mothership-sci-fi-horror-rpg-1st-edition-boxed-set", tipo_link: "financiamento", media_nota: 5.0, total_avaliacoes: 2 },
        { id: 42, titulo: "Alien RPG - Livro de Regras", autor: "Free League / New Order Editora", sistema: "Alien RPG", tipo_jogo: "Cyberpunk", categoria: "Manual Principal", sinopse: "RPG oficial cinematográfico de horror espacial com tensão contínua contra os Xenomorfos sob a influência da Corporação Weyland.", capa_url: "https://m.media-amazon.com/images/I/81z9R7o9tLL._AC_SL1500_.jpg", link_compra: "https://newordereditora.com/loja/rpg/alien-rpg/", tipo_link: "compra", media_nota: 4.8, total_avaliacoes: 2 },
        { id: 43, titulo: "Lancer RPG: Core Rulebook", autor: "Massif Press", sistema: "Lancer", tipo_jogo: "Cyberpunk", categoria: "Manual Principal", sinopse: "Financiamento revolucionário no Kickstarter de combates táticos em mechas gigantes com customização de chassi e inteligências artificiais.", capa_url: "https://preview.drivethrurpg.com/images/11497/275861.jpg", link_compra: "https://massif-press.itch.io/corebook-pdf", tipo_link: "financiamento", media_nota: 4.9, total_avaliacoes: 1 },
        { id: 44, titulo: "Starfinder - Livro Básico", autor: "Paizo / New Order Editora", sistema: "Starfinder", tipo_jogo: "Cyberpunk", categoria: "Manual Principal", sinopse: "Ópera espacial de ficção científica e fantasia com naves estelares customizáveis, magia tecnológica e mundos alienígenas.", capa_url: "https://m.media-amazon.com/images/I/81m8R+w5tGL._AC_SL1500_.jpg", link_compra: "https://newordereditora.com/loja/rpg/starfinder/", tipo_link: "compra", media_nota: 4.7, total_avaliacoes: 1 }
    ];

    // Carrega todos os livros da API Python ou Fallback Local
    async function carregarLivrosAPI() {
        try {
            const res = await fetch('http://localhost:5000/api/livros');
            if (res.ok) {
                todosOsLivros = await res.json();
                console.log(`Catálogo: ${todosOsLivros.length} grimórios carregados com sucesso.`);
            } else {
                throw new Error();
            }
        } catch (err) {
            console.log('Modo local/fallback ativado para o catálogo.');
            todosOsLivros = livrosFallback;
        }

        renderizarCatalogo();
    }

    // Renderiza o catálogo organizado por Tópicos de Tipo de Jogo
    function renderizarCatalogo() {
        if (!container) return;

        const termo = termoBusca.toLowerCase().trim();

        // Filtra os livros de acordo com os filtros selecionados
        const filtrados = todosOsLivros.filter(livro => {
            const tipoLivro = livro.tipo_jogo || 'Fantasia Medieval';
            const matchesTipo = (tipoJogoAtivo === 'Todos') || 
                                (tipoLivro.toLowerCase() === tipoJogoAtivo.toLowerCase()) ||
                                (tipoJogoAtivo.toUpperCase() === 'JJRPG' && (tipoLivro.toUpperCase() === 'JJRPG' || (livro.sistema && livro.sistema.includes('Fabula'))));

            const tipoLink = livro.tipo_link || '';
            const matchesAquisicao = (aquisicaoAtiva === 'todos') ||
                                     (aquisicaoAtiva === 'compra' && tipoLink === 'compra') ||
                                     (aquisicaoAtiva === 'financiamento' && tipoLink === 'financiamento');

            const matchesBusca = !termo ||
                                 (livro.titulo && livro.titulo.toLowerCase().includes(termo)) ||
                                 (livro.autor && livro.autor.toLowerCase().includes(termo)) ||
                                 (livro.sinopse && livro.sinopse.toLowerCase().includes(termo)) ||
                                 (livro.sistema && livro.sistema.toLowerCase().includes(termo)) ||
                                 (livro.categoria && livro.categoria.toLowerCase().includes(termo)) ||
                                 (tipoLivro.toLowerCase().includes(termo));

            return matchesTipo && matchesAquisicao && matchesBusca;
        });

        atualizarContador(filtrados.length);

        if (filtrados.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px 20px; background: var(--card-bg); border-radius: 12px; border: 1px dashed var(--accent-color); margin: 30px auto; max-width: 650px;">
                    <h3 style="color: var(--accent-color); margin-bottom: 10px; font-size: 1.35rem;">Nenhum grimório encontrado</h3>
                    <p style="color: var(--text-muted); margin-bottom: 20px;">Não encontramos registros para os critérios informados (${tipoJogoAtivo !== 'Todos' ? tipoJogoAtivo : ''} ${aquisicaoAtiva !== 'todos' ? 'em ' + aquisicaoAtiva : ''}).</p>
                    <button type="button" id="btnResetarFiltros" style="background: var(--accent-color); color: var(--accent-text); font-weight: bold; padding: 10px 22px; border: none; border-radius: 6px; cursor: pointer;">
                        Mostrar Todos os Livros
                    </button>
                </div>
            `;
            const btnReset = document.getElementById('btnResetarFiltros');
            if (btnReset) btnReset.addEventListener('click', resetarFiltros);
            return;
        }

        // Agrupa os livros filtrados por Tipo de Jogo
        const grupos = {};
        filtrados.forEach(l => {
            const tj = l.tipo_jogo || 'Fantasia Medieval';
            if (!grupos[tj]) grupos[tj] = [];
            grupos[tj].push(l);
        });

        // Ordena os grupos
        const chavesOrdenadas = Object.keys(grupos).sort((a, b) => {
            const ordemA = (metadadosTipos[a] && metadadosTipos[a].ordem) || 99;
            const ordemB = (metadadosTipos[b] && metadadosTipos[b].ordem) || 99;
            return ordemA - ordemB;
        });

        let htmlFinal = '';

        chavesOrdenadas.forEach(tj => {
            const lista = grupos[tj];
            const meta = metadadosTipos[tj] || { titulo: `Tópico: ${tj}`, descricao: 'Grimórios e aventuras do acervo.' };

            htmlFinal += `
                <section class="topico-tipo-jogo-secao" style="margin-bottom: 50px;">
                    <div class="category-header" style="margin-top: 20px;">
                        <div>
                            <h3 style="margin-bottom: 4px;">${meta.titulo}</h3>
                            <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0; font-style: italic;">${meta.descricao}</p>
                        </div>
                        <hr>
                    </div>

                    <div class="book-grid">
                        ${lista.map(livro => renderCardLivro(livro)).join('')}
                    </div>
                </section>
            `;
        });

        container.innerHTML = htmlFinal;
    }

    // Renderiza cada card com capas web diretas e badges sem excesso de emojis
    function renderCardLivro(livro) {
        let badgeAquisicaoHtml = '';
        if (livro.tipo_link === 'compra') {
            badgeAquisicaoHtml = `<span class="badge-aquisicao badge-aquisicao-compra">Para Comprar</span>`;
        } else if (livro.tipo_link === 'financiamento') {
            badgeAquisicaoHtml = `<span class="badge-aquisicao badge-aquisicao-financiamento">Financiamento Coletivo</span>`;
        } else {
            badgeAquisicaoHtml = `<span class="badge-aquisicao badge-aquisicao-acervo">Acervo da Guilda</span>`;
        }

        const notaEstrelas = livro.media_nota ? `${livro.media_nota} ★` : 'Novo!';
        const totalAv = livro.total_avaliacoes ? `(${livro.total_avaliacoes})` : '';

        // Se a capa_url for vazia ou falhar, usa o placeholderSvg
        const capaFinal = (livro.capa_url && livro.capa_url.startsWith('http')) ? livro.capa_url : placeholderSvg;

        return `
            <article class="book-card" data-id="${livro.id}">
                <div class="cover-placeholder">
                    <img src="${escapeHtml(capaFinal)}" 
                         alt="Capa de ${escapeHtml(livro.titulo)}" 
                         class="book-cover" 
                         loading="lazy" 
                         onerror="this.onerror=null; this.src='${placeholderSvg}'">
                    <span class="tag">${escapeHtml(livro.categoria || 'Manual Principal')}</span>
                    ${badgeAquisicaoHtml}
                </div>
                <div class="book-info">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span class="badge-tipo-jogo-tag">${escapeHtml(livro.tipo_jogo || 'RPG')}</span>
                        <span style="color: var(--star-active, #facc15); font-size: 0.88rem; font-weight: bold;">${notaEstrelas} <small style="color: var(--text-muted);">${totalAv}</small></span>
                    </div>

                    <span class="system">${escapeHtml(livro.sistema || 'RPG')}</span>
                    <h3 style="font-size: 1.15rem; margin: 6px 0 8px 0; color: var(--text-main); line-height: 1.35;">${escapeHtml(livro.titulo)}</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; margin-bottom: 18px; flex-grow: 1;">
                        ${escapeHtml(livro.sinopse ? (livro.sinopse.length > 130 ? livro.sinopse.slice(0, 130) + '...' : livro.sinopse) : 'Grimório do acervo dracônico.')}
                    </p>

                    <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between;">
                        <a href="detalhes.html?id=${livro.id}" class="btn-details" style="flex: 1; text-align: center; padding: 10px 14px; text-decoration: none; border-radius: 6px; font-weight: bold; background: var(--btn-bg); color: var(--text-main); border: 1px solid var(--border-color); transition: all 0.2s;">
                            Ver Detalhes
                        </a>
                        ${livro.link_compra ? `
                            <a href="${escapeHtml(livro.link_compra)}" target="_blank" rel="noopener noreferrer" 
                               style="padding: 10px 14px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-flex; align-items: center; ${livro.tipo_link === 'financiamento' ? 'background: #8b5cf6; color: #fff;' : 'background: var(--accent-color); color: var(--accent-text);'}" 
                               title="${livro.tipo_link === 'financiamento' ? 'Acessar Financiamento Coletivo' : 'Adquirir Livro'}">
                                ${livro.tipo_link === 'financiamento' ? 'Apoiar' : 'Comprar'}
                            </a>
                        ` : ''}
                    </div>
                </div>
            </article>
        `;
    }

    function atualizarContador(total) {
        if (!statusContador) return;
        let texto = `Exibindo ${total} grimório(s)`;
        if (tipoJogoAtivo !== 'Todos') texto += ` em [${tipoJogoAtivo}]`;
        if (aquisicaoAtiva === 'compra') texto += ' • Compra Direta';
        if (aquisicaoAtiva === 'financiamento') texto += ' • Financiamento Coletivo';
        if (termoBusca) texto += ` para "${termoBusca}"`;
        statusContador.textContent = texto;
    }

    function resetarFiltros() {
        tipoJogoAtivo = 'Todos';
        aquisicaoAtiva = 'todos';
        termoBusca = '';
        if (searchInput) searchInput.value = '';

        botoesTipoJogo.forEach(btn => {
            if (btn.getAttribute('data-tipo') === 'Todos') btn.classList.add('active');
            else btn.classList.remove('active');
        });

        botoesAquisicao.forEach(btn => {
            if (btn.getAttribute('data-aquisicao') === 'todos') {
                btn.classList.add('active');
                btn.style.background = 'var(--accent-color)';
                btn.style.color = 'var(--accent-text)';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'var(--btn-bg)';
                btn.style.color = 'var(--text-main)';
            }
        });

        renderizarCatalogo();
    }

    // Eventos de Filtro por Tipo de Jogo
    botoesTipoJogo.forEach(btn => {
        btn.addEventListener('click', () => {
            botoesTipoJogo.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tipoJogoAtivo = btn.getAttribute('data-tipo');
            renderizarCatalogo();
        });
    });

    // Eventos de Filtro por Aquisição (Compra vs Financiamento)
    botoesAquisicao.forEach(btn => {
        btn.addEventListener('click', () => {
            botoesAquisicao.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'var(--btn-bg)';
                b.style.color = 'var(--text-main)';
            });
            btn.classList.add('active');
            btn.style.background = 'var(--accent-color)';
            btn.style.color = 'var(--accent-text)';
            aquisicaoAtiva = btn.getAttribute('data-aquisicao');
            renderizarCatalogo();
        });
    });

    // Eventos de Busca
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            termoBusca = e.target.value;
            renderizarCatalogo();
        });
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            termoBusca = searchInput.value;
            renderizarCatalogo();
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Início: busca dados da API
    carregarLivrosAPI();
});

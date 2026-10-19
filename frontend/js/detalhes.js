// Arquivo: detalhes.js - Carregamento Dinâmico de Livros, Compra e Financiamento Coletivo

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const livroId = parseInt(urlParams.get('id')) || 1;

    // Elementos DOM da página de detalhes
    const capaEl = document.getElementById('capaLivro');
    const tituloEl = document.getElementById('tituloLivro');
    const autorEl = document.getElementById('autorLivro');
    const sistemaEl = document.getElementById('sistemaLivro');
    const descricaoEl = document.getElementById('descricaoLivro');
    const btnCompra = document.getElementById('btnAcaoLivro');
    const acaoContainer = document.getElementById('acaoContainer');

    // Catálogo completo de fallback com links reais de compra e financiamento
    const catalogoFallback = {
        1: {
            titulo: "Livro do Jogador",
            autor: "Gary Gygax e Dave Arneson (Wizards of the Coast)",
            sistema: "Dungeons & Dragons 5ª Edição (D&D 5E)",
            sinopse: "O livro funciona como o manual primordial para todos os aventureiros. Ele fornece ferramentas completas para criação de personagens, histórico, classes clássicas, magias arcanas e divinas e o sistema de combate que definiu gerações de RPGistas.",
            capa: "../imagens/livro do jogador dnd.jpg.jpeg",
            link_compra: "https://www.amazon.com.br/dp/8583651158",
            tipo_link: "compra"
        },
        2: {
            titulo: "Guia do Mestre",
            autor: "Wizards of the Coast",
            sistema: "Dungeons & Dragons 5ª Edição (D&D 5E)",
            sinopse: "O manual definitivo para o narrador. Fornece ferramentas criativas, diretrizes e regras opcionais para que o Mestre crie e conduza universos de fantasia, gerencie o ritmo da história e desafie os jogadores com itens mágicos lendários e armadilhas mortais.",
            capa: "../imagens/WhatsApp Image 2026-08-26 at 14.26.08.jpeg",
            link_compra: "https://www.amazon.com.br/dp/8583651166",
            tipo_link: "compra"
        },
        3: {
            titulo: "Manual dos Monstros",
            autor: "Gary Gygax (Wizards of the Coast)",
            sistema: "Dungeons & Dragons 5ª Edição (D&D 5E)",
            sinopse: "Uma coleção ilustrada de bestas míticas, dragões titânicos, mortos-vivos e demônios planares. Contém blocos de estatísticas prontos para combate e ecologias detalhadas para povoar masmorras e florestas esquecidas.",
            capa: "../imagens/Mm5e-capa.webp",
            link_compra: "https://www.amazon.com.br/dp/8583651174",
            tipo_link: "compra"
        },
        4: {
            titulo: "Guia de Xanathar para Todas as Coisas",
            autor: "Wizards of the Coast",
            sistema: "Dungeons & Dragons 5ª Edição (D&D 5E)",
            sinopse: "O primeiro grande suplemento de regras para a 5ª edição de D&D, trazendo novas subclasses fascinantes para cada classe, novos feitiços, regras para atividades de tempo livre e comentários cômicos do notório observador Xanathar.",
            capa: "../imagens/GDXPTAC.png",
            link_compra: "https://www.amazon.com.br/dp/0786966114",
            tipo_link: "compra"
        },
        5: {
            titulo: "Valda's Spire of Secrets",
            autor: "Mage Hand Press",
            sistema: "Dungeons & Dragons 5ª Edição (D&D 5E)",
            sinopse: "Uma expansão massiva com novas classes consagradas pela comunidade (como o Alquimista, Capitão, Pistoleiro e Necromante), além de dezenas de magias e mecânicas adicionais.",
            capa: "../img/dnd-valdas.jpg",
            link_compra: "https://www.kickstarter.com/projects/magehandpress/spire-of-secrets",
            tipo_link: "financiamento"
        },
        6: {
            titulo: "Ficha de Personagem D&D 5E",
            autor: "Wizards of the Coast",
            sistema: "Dungeons & Dragons 5ª Edição (D&D 5E)",
            sinopse: "Modelo otimizado e elegante da ficha de personagem oficial de D&D 5ª Edição, preparado para registro ágil de atributos, perícias, magias e equipamentos.",
            capa: "../img/dnd-ficha.jpg",
            link_compra: null,
            tipo_link: null
        },
        7: {
            titulo: "Tormenta 20 - Livro do Jogador Básico",
            autor: "Leonel Caldela, Marcelo Cassaro, Guilherme Dei Svaldi e JM Trevisan",
            sistema: "Tormenta 20 (T20)",
            sinopse: "O maior RPG de mesa do Brasil em sua versão definitiva com o sistema D20 refinado. Regras ágeis de Pontos de Mana (PM), dezenas de origens e raças nativas de Arton e combate dinâmico contra a tempestade rubra.",
            capa: "../img/t20-basico.jpg",
            link_compra: "https://jamboeditora.com.br/produto/tormenta20-edicao-jogo-do-ano/",
            tipo_link: "compra"
        },
        8: {
            titulo: "Ameaças de Arton",
            autor: "Jambô Editora",
            sistema: "Tormenta 20 (T20)",
            sinopse: "O maior bestiário já concebido para o cenário de Tormenta. Centenas de criaturas originais, chefões de fase épicos, lefeu da Tormenta e táticas especiais para mestres exigentes.",
            capa: "../img/t20-ameacas.jpg",
            link_compra: "https://jamboeditora.com.br/produto/ameacas-de-arton/",
            tipo_link: "compra"
        },
        9: {
            titulo: "Heróis de Arton",
            autor: "Jambô Editora",
            sistema: "Tormenta 20 (T20)",
            sinopse: "Expanda as fronteiras do heroísmo com novas distinções de prestígio, poderes lendários, novas opções de raças e classes para elevar o nível das suas aventuras.",
            capa: "../img/t20-herois.jpg",
            link_compra: "https://jamboeditora.com.br/produto/herois-de-arton/",
            tipo_link: "compra"
        },
        10: {
            titulo: "Deuses de Arton",
            autor: "Jambô Editora",
            sistema: "Tormenta 20 (T20)",
            sinopse: "A obra definitiva sobre os vinte deuses maiores do Panteão de Arton. Apresenta o lore completo dos deuses, ordens sagradas, poderes concedidos exclusivos e regras para avatares divinos.",
            capa: "../img/t20-deuses.jpg",
            link_compra: "https://www.catarse.me/deusesdearton",
            tipo_link: "financiamento"
        },
        11: {
            titulo: "Atlas de Arton",
            autor: "Jambô Editora",
            sistema: "Tormenta 20 (T20)",
            sinopse: "Um guia geográfico e histórico completo pelo continente de Arton. Detalhes de cada reino, intrigas políticas, capitais, mapas e ganchos de aventura.",
            capa: "../img/t20-atlas.jpg",
            link_compra: "https://jamboeditora.com.br/produto/atlas-de-arton/",
            tipo_link: "compra"
        },
        12: {
            titulo: "Ficha de Personagem Tormenta 20",
            autor: "Jambô Editora",
            sistema: "Tormenta 20 (T20)",
            sinopse: "Ficha de personagem customizada para Tormenta 20 com espaços dedicados ao cálculo de PV, PM, Defesa, perícias treinadas e magias.",
            capa: "../img/t20-ficha.jpg",
            link_compra: null,
            tipo_link: null
        },
        13: {
            titulo: "Fabula Ultima - Livro de Regras Básico",
            autor: "Emanuele Galletto (Need Games)",
            sistema: "Fabula Ultima (TTJRPG)",
            sinopse: "O Tabletop RPG inspirado nos mais aclamados JRPGs japoneses (Final Fantasy, Dragon Quest, Bravely Default). Um sistema de combate tático ágil baseado em pontos de fábrica, laços heroicos e criação colaborativa de mundo.",
            capa: "../img/fu-basico.jpg",
            link_compra: "https://www.needgames.it/fabula-ultima-en/",
            tipo_link: "compra"
        },
        14: {
            titulo: "Guia do Mestre Fabula Ultima",
            autor: "Need Games",
            sistema: "Fabula Ultima (TTJRPG)",
            sinopse: "Conselhos de narrativa cinematográfica, regras para elaboração de vilões recorrentes e criação de arcos narrativos épicos que ressoam com a alma dos personagens.",
            capa: "../img/fu-mestre.jpg",
            link_compra: "https://www.needgames.it/fabula-ultima-en/",
            tipo_link: "compra"
        },
        15: {
            titulo: "Atlas Techno Fantasy",
            autor: "Need Games",
            sistema: "Fabula Ultima (TTJRPG)",
            sinopse: "Suplemento de cenário que une magia e tecnologia. Inclui novas classes de pilotos de mechas, cibernética, magia hacker e mundos futuristas.",
            capa: "../img/fu-techno.jpg",
            link_compra: "https://www.needgames.it/categoria-prodotto/fabula-ultima-en/",
            tipo_link: "compra"
        },
        16: {
            titulo: "Atlas High Fantasy",
            autor: "Need Games",
            sistema: "Fabula Ultima (TTJRPG)",
            sinopse: "Suplemento voltado para alta magia pura, castelos voadores, deuses e imperadores cósmicos, com novas classes dedicadas a magias antigas.",
            capa: "../img/fu-high.jpg",
            link_compra: "https://www.needgames.it/categoria-prodotto/fabula-ultima-en/",
            tipo_link: "compra"
        },
        17: {
            titulo: "Aperte Start - Fabula Ultima",
            autor: "Need Games",
            sistema: "Fabula Ultima (TTJRPG)",
            sinopse: "Cenário e aventura introdutória com personagens prontos e passo a passo tutorial para começar a jogar de imediato sem ter que ler o manual antes.",
            capa: "../img/fu-start.jpg",
            link_compra: null,
            tipo_link: null
        },
        18: {
            titulo: "Codex Extra Fabula Ultima",
            autor: "Need Games",
            sistema: "Fabula Ultima (TTJRPG)",
            sinopse: "Regras opcionais, novas armas, equipamentos lendários e classes extras criadas para enriquecer campanhas de alto nível.",
            capa: "../img/fu-codex.jpg",
            link_compra: "https://www.patreon.com/roosterema",
            tipo_link: "financiamento"
        },
        19: {
            titulo: "Natural Fantasy Atlas",
            autor: "Need Games",
            sistema: "Fabula Ultima (TTJRPG)",
            sinopse: "Um suplemento lírico e bucólico com foco em espíritos da natureza, vilarejos pacíficos e jornadas espirituais.",
            capa: "../img/fu-natural.jpg",
            link_compra: "https://www.needgames.it/categoria-prodotto/fabula-ultima-en/",
            tipo_link: "compra"
        },
        20: {
            titulo: "Guia do Estilo Fabula Ultima",
            autor: "Need Games",
            sistema: "Fabula Ultima (TTJRPG)",
            sinopse: "Guia de estética e narrativa para trazer a atmosfera visual dos jogos japoneses clássicos para a mesa de jogo.",
            capa: "../img/fu-estilo.jpg",
            link_compra: null,
            tipo_link: null
        },
        21: {
            titulo: "Ficha de Personagem Fabula Ultima",
            autor: "Need Games",
            sistema: "Fabula Ultima (TTJRPG)",
            sinopse: "Folha de controle de herói com layout temático de videogame retro, espaço para 3 classes combinadas, laços e inventário.",
            capa: "../img/fu-ficha.jpg",
            link_compra: null,
            tipo_link: null
        }
    };

    // Atualiza a página com os dados e configura botão de Compra / Financiamento
    function atualizarPagina(livro) {
        if (!livro) return;

        if (tituloEl) tituloEl.textContent = livro.titulo;
        document.title = `${livro.titulo} - Detalhes - Biblioteca Dracônica`;

        if (autorEl) autorEl.textContent = livro.autor;
        if (sistemaEl) sistemaEl.textContent = livro.sistema;
        if (descricaoEl) descricaoEl.textContent = livro.sinopse || livro.descricao;

        if (capaEl) {
            capaEl.src = livro.capa_url || livro.capa;
            capaEl.alt = `Capa de ${livro.titulo}`;
        }

        // Lógica do botão de compra ou financiamento coletivo
        configurarBotaoCompra(livro.link_compra, livro.tipo_link);
    }

    function configurarBotaoCompra(link, tipo) {
        if (!btnCompra || !acaoContainer) return;

        if (!link || tipo === 'nenhum' || tipo === null) {
            // Se o livro não tem onde comprar nem financiamento, remove o botão!
            acaoContainer.style.display = 'none';
        } else if (tipo === 'financiamento') {
            acaoContainer.style.display = 'block';
            btnCompra.href = link;
            btnCompra.target = '_blank';
            btnCompra.rel = 'noopener noreferrer';
            btnCompra.className = 'btn-compra btn-financiamento';
            btnCompra.innerHTML = '📦 Apoiar Financiamento Coletivo';
            btnCompra.style.background = '#8b5cf6';
            btnCompra.style.color = '#ffffff';
        } else {
            // Compra normal (loja ou editora)
            acaoContainer.style.display = 'block';
            btnCompra.href = link;
            btnCompra.target = '_blank';
            btnCompra.rel = 'noopener noreferrer';
            btnCompra.className = 'btn-compra';
            btnCompra.innerHTML = '🛒 Compre o Livro';
            btnCompra.style.background = 'var(--accent-color)';
            btnCompra.style.color = 'var(--accent-text)';
        }
    }

    // Primeiro aplica fallback imediato
    if (catalogoFallback[livroId]) {
        atualizarPagina(catalogoFallback[livroId]);
    }

    // Em seguida, consulta a API Python para obter os dados do banco
    fetch(`http://localhost:5000/api/livros/${livroId}`)
        .then(res => res.json())
        .then(livroBanco => {
            if (livroBanco && livroBanco.titulo) {
                atualizarPagina({
                    titulo: livroBanco.titulo,
                    autor: livroBanco.autor,
                    sistema: livroBanco.sistema,
                    sinopse: livroBanco.sinopse,
                    capa: livroBanco.capa_url,
                    link_compra: livroBanco.link_compra,
                    tipo_link: livroBanco.tipo_link
                });
            }
        })
        .catch(() => {
            // Silencioso - fallback local aplicado
        });
});

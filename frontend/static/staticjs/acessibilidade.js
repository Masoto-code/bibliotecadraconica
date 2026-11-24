// Arquivo: acessibilidade.js - Ferramentas de Acessibilidade com Ícones Web para Pessoas Cegas, Idosas e Deficientes

(function () {
    const CHAVE_FONTE = 'draconica_tamanho_fonte';
    const CHAVE_CONTRASTE = 'draconica_alto_contraste';
    const CHAVE_LEGIBILIDADE = 'draconica_fonte_legivel';

    let synth = window.speechSynthesis;
    let locucaoAtual = null;

    // Carrega Font Awesome na página dinamicamente se ainda não estiver presente
    function garantirIconesWeb() {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
            document.head.appendChild(faLink);
        }
    }

    // Inicializa preferências salvas
    function carregarPreferencias() {
        garantirIconesWeb();
        const delta = parseInt(localStorage.getItem(CHAVE_FONTE) || '0', 10);
        if (delta !== 0) aplicarTamanhoFonte(delta, false);

        if (localStorage.getItem(CHAVE_CONTRASTE) === 'true') {
            document.documentElement.classList.add('alto-contraste');
        }

        if (localStorage.getItem(CHAVE_LEGIBILIDADE) === 'true') {
            document.documentElement.classList.add('modo-legivel');
        }
    }

    // Controle de tamanho de texto
    function aplicarTamanhoFonte(delta, salvar = true) {
        let atual = parseInt(localStorage.getItem(CHAVE_FONTE) || '0', 10);
        let novoDelta = salvar ? Math.min(6, Math.max(-2, atual + delta)) : delta;

        if (salvar) {
            localStorage.setItem(CHAVE_FONTE, novoDelta);
        }

        document.documentElement.style.fontSize = novoDelta === 0 ? '' : `${100 + novoDelta * 8}%`;
        anunciarAcessibilidade(`Tamanho da fonte ajustado para ${100 + novoDelta * 8}%`);
    }

    function redefinirFonte() {
        localStorage.setItem(CHAVE_FONTE, '0');
        document.documentElement.style.fontSize = '';
        anunciarAcessibilidade('Tamanho da fonte restaurado ao padrão');
    }

    // Alto Contraste
    function alternarAltoContraste() {
        const ativo = document.documentElement.classList.toggle('alto-contraste');
        localStorage.setItem(CHAVE_CONTRASTE, ativo ? 'true' : 'false');
        anunciarAcessibilidade(ativo ? 'Alto contraste ativado' : 'Alto contraste desativado');
    }

    // Modo Leitura Fácil
    function alternarModoLegivel() {
        const ativo = document.documentElement.classList.toggle('modo-legivel');
        localStorage.setItem(CHAVE_LEGIBILIDADE, ativo ? 'true' : 'false');
        anunciarAcessibilidade(ativo ? 'Modo de leitura legível ativado' : 'Modo de leitura legível desativado');
    }

    // Leitor de Tela em Áudio (Síntese de Voz Nativa em Português)
    function iniciarLeitorVoz() {
        if (!synth) {
            alert('A síntese de voz não é suportada neste navegador.');
            return;
        }

        if (synth.speaking) {
            if (synth.paused) {
                synth.resume();
                anunciarAcessibilidade('Leitura retomada.');
                return;
            }
            synth.cancel();
        }

        const main = document.querySelector('main') || document.body;
        const textos = Array.from(main.querySelectorAll('h1, h2, h3, p, .sinopse, .descricao, article'))
            .map(el => el.innerText.trim())
            .filter(t => t.length > 0)
            .join('. ');

        if (!textos) {
            anunciarAcessibilidade('Nenhum texto encontrado para leitura.');
            return;
        }

        locucaoAtual = new SpeechSynthesisUtterance(textos);
        locucaoAtual.lang = 'pt-BR';
        locucaoAtual.rate = 1.0;

        const vozes = synth.getVoices();
        const vozPt = vozes.find(v => v.lang.includes('pt') || v.lang.includes('PT'));
        if (vozPt) locucaoAtual.voice = vozPt;

        locucaoAtual.onend = () => {
            anunciarAcessibilidade('Leitura finalizada.');
        };

        synth.speak(locucaoAtual);
        anunciarAcessibilidade('Iniciando leitura em voz alta da página.');
    }

    function pausarLeitorVoz() {
        if (synth && synth.speaking) {
            synth.pause();
            anunciarAcessibilidade('Leitura pausada.');
        }
    }

    function pararLeitorVoz() {
        if (synth) {
            synth.cancel();
            anunciarAcessibilidade('Leitura interrompida.');
        }
    }

    function anunciarAcessibilidade(msg) {
        let liveRegion = document.getElementById('draconica-aria-live');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'draconica-aria-live';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-9999px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }
        liveRegion.textContent = msg;
    }

    function injetarInterfaceAcessibilidade() {
        garantirIconesWeb();

        // 1. Skip link
        if (!document.querySelector('.skip-to-content')) {
            const skipLink = document.createElement('a');
            skipLink.href = '#main-content';
            skipLink.className = 'skip-to-content';
            skipLink.textContent = 'Pular para o conteúdo principal';
            skipLink.setAttribute('aria-label', 'Pular para o conteúdo principal');
            document.body.insertBefore(skipLink, document.body.firstChild);

            const main = document.querySelector('main');
            if (main && !main.id) {
                main.id = 'main-content';
                main.setAttribute('role', 'main');
            }
        }

        // 2. Barra / Widget Flutuante de Acessibilidade com Ícones Web
        if (!document.querySelector('.widget-acessibilidade')) {
            const painel = document.createElement('aside');
            painel.className = 'widget-acessibilidade';
            painel.setAttribute('aria-label', 'Menu de Acessibilidade da Guilda');
            painel.innerHTML = `
                <button id="btnAcessibilidadeToggle" class="btn-acessibilidade-toggle" aria-expanded="false" aria-controls="menuAcessibilidade" title="Opções de Acessibilidade (Cegos, Idosos e Deficientes)">
                    <i class="fa-solid fa-universal-access" style="font-size: 1.25rem;"></i>
                    <span class="texto-btn-acessivel">Acessibilidade</span>
                </button>
                <div id="menuAcessibilidade" class="menu-acessibilidade" style="display: none;" role="dialog" aria-label="Ferramentas de Acessibilidade">
                    <div class="menu-acessibilidade-header">
                        <strong><i class="fa-solid fa-shield-halved" style="color: var(--accent-color);"></i> Acessibilidade</strong>
                        <button id="btnFecharAcessibilidade" aria-label="Fechar menu de acessibilidade" style="background: transparent; border: none; color: inherit; font-size: 1.1rem; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="acessibilidade-grupo">
                        <label>Tamanho do Texto (Idosos e Baixa Visão):</label>
                        <div class="botoes-grupo">
                            <button id="btnFonteMenos" title="Diminuir tamanho da fonte" aria-label="Diminuir fonte"><i class="fa-solid fa-minus"></i> A-</button>
                            <button id="btnFonteReset" title="Restaurar tamanho padrão" aria-label="Restaurar fonte padrão"><i class="fa-solid fa-rotate-left"></i> Padrão</button>
                            <button id="btnFonteMais" title="Aumentar tamanho da fonte" aria-label="Aumentar fonte"><i class="fa-solid fa-plus"></i> A+</button>
                        </div>
                    </div>
                    <div class="acessibilidade-grupo">
                        <label>Visão e Leitura:</label>
                        <button id="btnContraste" class="btn-acao-acessivel" title="Alternar modo de alto contraste">
                            <i class="fa-solid fa-circle-half-stroke" style="color: var(--accent-color);"></i> Alto Contraste
                        </button>
                        <button id="btnLegibilidade" class="btn-acao-acessivel" title="Alternar fonte legível para dislexia">
                            <i class="fa-solid fa-book-open-reader" style="color: var(--accent-color);"></i> Fonte Legível
                        </button>
                    </div>
                    <div class="acessibilidade-grupo">
                        <label>Leitor de Texto (Pessoas Cegas):</label>
                        <div class="botoes-grupo">
                            <button id="btnVozPlay" title="Ouvir conteúdo em voz alta" class="btn-acao-acessivel" style="flex: 2;">
                                <i class="fa-solid fa-volume-high"></i> Ouvir Página
                            </button>
                            <button id="btnVozPause" title="Pausar voz" class="btn-acao-acessivel"><i class="fa-solid fa-pause"></i></button>
                            <button id="btnVozStop" title="Parar voz" class="btn-acao-acessivel"><i class="fa-solid fa-stop"></i></button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(painel);
        }

        // 3. Botão Flutuante "Subir ao Topo" com Ícone Web
        if (!document.getElementById('btnSubirAoTopo')) {
            const btnTopo = document.createElement('button');
            btnTopo.id = 'btnSubirAoTopo';
            btnTopo.className = 'btn-subir-ao-topo';
            btnTopo.setAttribute('aria-label', 'Subir ao topo da página');
            btnTopo.setAttribute('title', 'Voltar ao topo da página');
            btnTopo.innerHTML = `<i class="fa-solid fa-arrow-up" aria-hidden="true"></i> <span class="texto-btn-topo">Subir ao Topo</span>`;
            document.body.appendChild(btnTopo);

            window.addEventListener('scroll', () => {
                if (window.scrollY > 280) {
                    btnTopo.classList.add('visivel');
                } else {
                    btnTopo.classList.remove('visivel');
                }
            });

            btnTopo.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                anunciarAcessibilidade('Rolagem para o topo da página realizada.');
            });
        }

        // Eventos do Painel de Acessibilidade
        const toggleBtn = document.getElementById('btnAcessibilidadeToggle');
        const menu = document.getElementById('menuAcessibilidade');
        const fecharBtn = document.getElementById('btnFecharAcessibilidade');

        if (toggleBtn && menu && fecharBtn) {
            toggleBtn.onclick = () => {
                const aberto = menu.style.display === 'block';
                menu.style.display = aberto ? 'none' : 'block';
                toggleBtn.setAttribute('aria-expanded', !aberto);
            };

            fecharBtn.onclick = () => {
                menu.style.display = 'none';
                toggleBtn.setAttribute('aria-expanded', 'false');
            };

            document.getElementById('btnFonteMais').onclick = () => aplicarTamanhoFonte(1);
            document.getElementById('btnFonteMenos').onclick = () => aplicarTamanhoFonte(-1);
            document.getElementById('btnFonteReset').onclick = redefinirFonte;
            document.getElementById('btnContraste').onclick = alternarAltoContraste;
            document.getElementById('btnLegibilidade').onclick = alternarModoLegivel;
            document.getElementById('btnVozPlay').onclick = iniciarLeitorVoz;
            document.getElementById('btnVozPause').onclick = pausarLeitorVoz;
            document.getElementById('btnVozStop').onclick = pararLeitorVoz;
        }
    }

    carregarPreferencias();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injetarInterfaceAcessibilidade);
    } else {
        injetarInterfaceAcessibilidade();
    }
})();

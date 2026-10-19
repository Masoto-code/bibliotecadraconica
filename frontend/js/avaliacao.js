// Arquivo: avaliacao.js - Sistema de Avaliação com Estrelas e Comentários

document.addEventListener('DOMContentLoaded', () => {
    // Obtém o ID do livro pela URL (ex: detalhes.html?id=2) ou assume 1 por padrão
    const urlParams = new URLSearchParams(window.location.search);
    const livroId = parseInt(urlParams.get('id')) || 1;

    const estrelas = document.querySelectorAll('.estrelas .estrela');
    const estrellasBox = document.getElementById('estrellasBox');
    let notaSelecionada = parseInt(localStorage.getItem(`avaliacao_livro_${livroId}`)) || 0;

    // Destacar nota previamente salva pelo usuário
    if (notaSelecionada > 0) {
        destacarEstrelas(notaSelecionada);
    }

    estrelas.forEach(estrela => {
        estrela.addEventListener('mouseover', () => {
            const val = parseInt(estrela.getAttribute('data-value'));
            destacarEstrelas(val);
        });

        estrela.addEventListener('click', () => {
            notaSelecionada = parseInt(estrela.getAttribute('data-value'));
            localStorage.setItem(`avaliacao_livro_${livroId}`, notaSelecionada);
            destacarEstrelas(notaSelecionada);

            const notaInput = document.getElementById('avaliacaoNotaInput');
            if (notaInput) {
                notaInput.value = notaSelecionada;
            }

            const feedbackSpan = document.getElementById('notaFeedback');
            if (feedbackSpan) {
                feedbackSpan.textContent = `Nota selecionada: ${notaSelecionada} estrela${notaSelecionada > 1 ? 's' : ''}`;
            }
        });
    });

    if (estrellasBox) {
        estrellasBox.addEventListener('mouseleave', () => {
            destacarEstrelas(notaSelecionada);
        });
    }

    function destacarEstrelas(valor) {
        estrelas.forEach(e => {
            const v = parseInt(e.getAttribute('data-value'));
            if (v <= valor) {
                e.classList.add('marcada');
            } else {
                e.classList.remove('marcada');
            }
        });
    }

    // Formulário de Comentário e Avaliação
    const formAvaliacao = document.getElementById('formAvaliacaoLivro');
    const listaComentarios = document.getElementById('listaComentariosLivro');
    const mediaNotaEl = document.getElementById('mediaNotaTexto');
    const totalAvaliacoesEl = document.getElementById('totalAvaliacoesTexto');

    // Carrega avaliações da API ou LocalStorage
    carregarAvaliacoes();

    if (formAvaliacao) {
        formAvaliacao.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usuarioInput = document.getElementById('usuarioNome');
            const comentarioInput = document.getElementById('usuarioComentario');
            
            const usuario = usuarioInput ? usuarioInput.value.trim() : '';
            const comentario = comentarioInput ? comentarioInput.value.trim() : '';

            if (notaSelecionada <= 0) {
                alert('⚠️ Por favor, selecione uma nota de 1 a 5 estrelas clicando nas estrelas acima.');
                return;
            }

            const dadosAvaliacao = {
                usuario: usuario || 'Aventureiro Anônimo',
                nota: notaSelecionada,
                comentario: comentario
            };

            const submitBtn = formAvaliacao.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Gravando nos anais...';
            }

            try {
                // Tenta enviar para a API Python
                const res = await fetch(`http://localhost:5000/api/livros/${livroId}/avaliar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosAvaliacao)
                });

                if (res.ok) {
                    const json = await res.json();
                    alert('✨ Sua avaliação e comentário foram registrados com sucesso no banco de dados!');
                } else {
                    salvarLocalmente(dadosAvaliacao);
                    alert('✨ Sua avaliação foi registrada localmente!');
                }
            } catch (err) {
                salvarLocalmente(dadosAvaliacao);
                alert('✨ Sua avaliação foi registrada localmente (Modo Offline)!');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Enviar Avaliação e Comentário';
                }
                if (comentarioInput) comentarioInput.value = '';
                carregarAvaliacoes();
            }
        });
    }

    function salvarLocalmente(avaliacao) {
        const key = `avaliacoes_armazenadas_${livroId}`;
        const locais = JSON.parse(localStorage.getItem(key) || '[]');
        locais.unshift({
            ...avaliacao,
            data_criacao: new Date().toISOString()
        });
        localStorage.setItem(key, JSON.stringify(locais));
    }

    async function carregarAvaliacoes() {
        if (!listaComentarios) return;

        let avaliacoes = [];
        let media = 0;
        let total = 0;

        try {
            const res = await fetch(`http://localhost:5000/api/livros/${livroId}`);
            if (res.ok) {
                const livro = await res.json();
                avaliacoes = livro.avaliacoes || [];
                media = livro.media_nota || 0;
                total = livro.total_avaliacoes || 0;
            } else {
                throw new Error('API indisponível');
            }
        } catch {
            // Fallback para LocalStorage se o backend não estiver acessível
            const key = `avaliacoes_armazenadas_${livroId}`;
            avaliacoes = JSON.parse(localStorage.getItem(key) || '[]');
            total = avaliacoes.length;
            if (total > 0) {
                const soma = avaliacoes.reduce((acc, a) => acc + a.nota, 0);
                media = (soma / total).toFixed(1);
            }
        }

        // Atualiza cabeçalho com estatísticas
        if (mediaNotaEl) mediaNotaEl.textContent = total > 0 ? `${media} ★` : 'Novo!';
        if (totalAvaliacoesEl) totalAvaliacoesEl.textContent = `(${total} avaliaç${total === 1 ? 'ão' : 'ões'})`;

        // Renderiza lista de comentários
        if (avaliacoes.length === 0) {
            listaComentarios.innerHTML = `
                <div style="text-align: center; color: var(--text-muted, #a8a8b3); padding: 25px; border: 1px dashed #333; border-radius: 8px;">
                    📜 Seja o primeiro aventureiro a avaliar e comentar sobre este tomo!
                </div>
            `;
            return;
        }

        listaComentarios.innerHTML = avaliacoes.map(a => {
            const estrelasRep = '★'.repeat(a.nota) + '☆'.repeat(5 - a.nota);
            const dataFmt = a.data_criacao ? new Date(a.data_criacao).toLocaleDateString('pt-BR') : 'Recentemente';
            return `
                <div class="comentario-card" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: var(--shadow-sm);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="color: var(--accent-color); font-size: 1.05rem;">👤 ${escapeHtml(a.usuario)}</strong>
                        <span style="color: var(--star-active); font-size: 1.1rem; letter-spacing: 2px;">${estrelasRep}</span>
                    </div>
                    <p style="color: var(--text-main); line-height: 1.5; margin: 6px 0;">${escapeHtml(a.comentario || 'Sem comentário por escrito.')}</p>
                    <small style="color: var(--text-muted); font-size: 0.8rem;">Postado em: ${dataFmt}</small>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
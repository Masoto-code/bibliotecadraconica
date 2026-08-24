document.addEventListener('DOMContentLoaded', () => {
    const estrelas = document.querySelectorAll('.estrela');
    
    // Recupera a avaliação salva anteriormente para este livro (se houver)
    const avaliacaoSalva = localStorage.getItem('avaliacao_atual');
    if (avaliacaoSalva) {
        destacarEstrelas(avaliacaoSalva);
    }

    estrelas.forEach(estrela => {
        // Evento de clique para definir a nota
        estrela.addEventListener('click', () => {
            const valorNota = estrela.getAttribute('data-value');
            localStorage.setItem('avaliacao_atual', valorNota);
            destacarEstrelas(valorNota);
            alert(`Você avaliou este tomo com ${valorNota} estrelas!`);
        });

        // Efeito visual ao passar o mouse por cima
        estrela.addEventListener('mouseover', () => {
            const valorNota = estrela.getAttribute('data-value');
            destacarEstrelas(valorNota);
        });
    });

    // Remove o destaque temporário ao tirar o mouse se não houver nota fixa
    document.getElementById('estrellasBox').addEventListener('mouseleave', () => {
        const notaFixa = localStorage.getItem('avaliacao_atual') || 0;
        destacarEstrelas(notaFixa);
    });

    function destacarEstrelas(valor) {
        estrelas.forEach(estrela => {
            if (parseInt(estrela.getAttribute('data-value')) <= parseInt(valor)) {
                estrela.classList.add('marcada');
            } else {
                estrela.classList.remove('marcada');
            }
        });
    }
});

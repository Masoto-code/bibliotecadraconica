const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST: Registrar uma nota de 1 a 5 estrelas
router.post('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nota } = req.body;

        if (!nota || nota < 1 || nota > 5) {
            return res.status(400).json({ erro: 'Informe uma nota válida entre 1 e 5.' });
        }

        const sql = 'INSERT INTO avaliacoes (livro_id, nota) VALUES (?, ?)';
        await db.query(sql, [id, nota]);

        res.status(201).json({ mensagem: 'Avaliação salva com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao salvar avaliação.' });
    }
});

module.exports = router;
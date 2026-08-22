const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST: Incrementar o número de downloads de um livro
router.post('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'UPDATE livros SET downloads = downloads + 1 WHERE id = ?';
        
        await db.query(sql, [id]);
        res.json({ mensagem: 'Download contabilizado com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao contabilizar o download.' });
    }
});

module.exports = router;
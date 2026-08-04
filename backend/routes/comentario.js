const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST: Salvar novo comentário
router.post('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario, texto } = req.body;

        if (!texto) {
            return res.status(400).json({ erro: 'O comentário não pode estar vazio.' });
        }

        const sql = 'INSERT INTO comentarios (livro_id, usuario, texto) VALUES (?, ?, ?)';
        await db.query(sql, [id, usuario || 'Anônimo', texto]);

        res.status(201).json({ mensagem: 'Comentário enviado!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao salvar comentário.' });
    }
});

// GET: Buscar todos os comentários de um livro
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'SELECT * FROM comentarios WHERE livro_id = ? ORDER BY data_criacao DESC';
        
        const [comentarios] = await db.query(sql, [id]);
        res.json(comentarios);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao carregar comentários.' });
    }
});

module.exports = router;
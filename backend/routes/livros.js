const express = require('express');
const router = express.Router();
const db = require('../config/db'); // <-- Importa o banco aqui!

// ROTA: Buscar todos os livros
router.get('/', async (req, res) => {
    try {
        // Executa a consulta SQL usando a conexão importada
        const [livros] = await db.query('SELECT * FROM livros');
        res.json(livros);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar livros no banco.' });
    }
});

module.exports = router;
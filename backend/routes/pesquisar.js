const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET: Filtrar livros por título ou sistema
router.get('/', async (req, res) => {
    try {
        const { busca, sistema } = req.query;
        let sql = 'SELECT * FROM livros WHERE 1=1';
        let params = [];

        if (busca) {
            sql += ' AND (titulo LIKE ? OR autor LIKE ?)';
        }

        if (sistema) {
            sql += ' AND sistema = ?';
            params.push(sistema);
        }

        const [livros] = await db.query(sql, params);
        res.json(livros);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao realizar a busca.' });
    }
});

module.exports = router;
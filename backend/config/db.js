const mysql = require('mysql2');

// Configuração do banco de dados MySQL
const pool = mysql.createPool({
    host: 'localhost',         // Endereço do servidor MySQL (geralmente localhost)
    user: 'root',              // Seu usuário do MySQL (padrão é root)
    password: 'sua_senha',     // Insira a sua senha do MySQL aqui
    database: 'biblioteca_draconica', // Nome do Banco de Dados que você criou
    waitForConnections: true,
    connectionLimit: 10,       // Limite máximo de conexões simultâneas
    queueLimit: 0
});

// Testar a conexão ao iniciar o servidor
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erro ao conectar com o Banco de Dados MySQL:', err.message);
    } else {
        console.log('🐉 Conexão com o Banco de Dados (Biblioteca Dracônica) estabelecida com sucesso!');
        connection.release(); // Libera a conexão de teste
    }
});

// Exporta o pool preparado para usar async / await nas suas rotas
module.exports = pool.promise();
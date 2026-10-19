# 🐉 Biblioteca Dracônica - Sistema de Acervo RPG & Fórum da Guilda

Projeto completo de acervo e comunidade de RPG (D&D 5E, Tormenta 20, Fabula Ultima) com backend em Python, banco de dados SQLite, sistema de busca e filtragem em tempo real, avaliações com resenhas e fórum comunitário interativo.

---

## 🚀 Como Iniciar o Projeto

Você pode iniciar o projeto de duas formas:

### Opção 1: Via executável `.bat` (Recomendado no Windows)
Basta dar dois cliques no arquivo:
```
iniciar.bat
```
Ele iniciará o servidor Python e abrirá automaticamente no seu navegador padrão em `http://localhost:5000`.

### Opção 2: Pelo terminal
```bash
python backend/app.py
```
Em seguida, acesse no navegador: **`http://localhost:5000`**

---

## 🛠️ Bugs e Falhas que Foram Corrigidos

1. **Botões de Busca e Filtragem não funcionavam**:
   - O campo `<input>` e o `<button>` não tinham identificadores (`id`), nem manipuladores de evento (`onclick`/`addEventListener`).
   - O arquivo `pesquisar.js` estava vazio (0 bytes) e nem sequer era importado no `index.html`.
   - **Correção**: Implementada busca inteligente em tempo real e ao clicar/pressionar Enter em `pesquisar.js`, além de filtragem instantânea pelas abas de sistema (*Todos, D&D 5E, Tormenta 20, Fabula Ultima*), indicador de contagem de grimórios encontrados e tela de estado vazio com botão para limpar filtros.

2. **Código de Backend Node.js colocado no Frontend**:
   - `frontend/static/staticjs/avaliacao.js` e `download.js` continham código Express (`const express = require('express'); ...`), gerando erros fatais no console do navegador (`ReferenceError: require is not defined`).
   - **Correção**: Substituído por JavaScript cliente assíncrono moderno (`fetch`), com suporte a envio para API Python e fallback automático no `localStorage` (caso o usuário abra os arquivos estáticos diretamente).

3. **Caminhos de CSS e Scripts Quebrados**:
   - Tags `<link rel="stylesheet" href="../css/...">` e `<script src="../js/...">` apontavam para pastas inexistentes (os arquivos reais ficavam em `static/staticcss/` e `static/staticjs/`).
   - Haviam tags inválidas como `<link rel="stylesheet" href="../js/tema.js"` (carregando `.js` como folha de estilo e sem fechar a tag `>`), além de `<script> src="..."</script>`.
   - **Correção**: Todos os caminhos foram corrigidos e as pastas `css` e `js` foram sincronizadas para garantir compatibilidade 100%.

4. **Navegação Inconsistente e Tags Duplicadas**:
   - Existiam tags duplicadas de `<nav>` e duplos `</body></body>` em vários arquivos HTML.
   - Links apontavam para arquivos inexistentes como `livros.html` e links de detalhes apontavam todos para o mesmo arquivo sem identificar o livro.
   - **Correção**: Padronização dos menus (*Início*, *Catálogo*, *Fórum*, *Tema Claro/Escuro*), criação de redirecionamento em `livros.html` e suporte a carregamento dinâmico via URL (`detalhes.html?id=X`).

---

## 🐍 Banco de Dados em Python (SQLite)

O backend foi totalmente implementado em **Python (Flask + SQLite3)**, não necessitando de configurações externas de MySQL, senhas ou serviços rodando:

- **Arquivo do banco**: `backend/biblioteca_draconica.db`
- **Script de inicialização e dados semente**: `backend/database.py` (contém 21 livros completos, avaliações iniciais e tópicos do fórum).
- **Servidor REST API**: `backend/app.py`

### Principais Endpoints da API:
- `GET /api/livros` - Lista todos os livros (suporta `?busca=...` e `?sistema=...`).
- `GET /api/livros/<id>` - Detalhes do livro com média de notas e lista de resenhas.
- `POST /api/livros/<id>/avaliar` - Registra nota (1 a 5 estrelas) e comentário do leitor.
- `POST /api/livros/<id>/download` - Incrementa e retorna a contagem de downloads.
- `GET /api/forum/topicos` - Lista tópicos do fórum com estatísticas de comentários e média de notas.
- `POST /api/forum/topicos` - Cria um novo tópico na guilda.
- `GET /api/forum/topicos/<id>` - Obtém tópico com todos os comentários e avaliações.
- `POST /api/forum/topicos/<id>/comentarios` - Adiciona comentário com nota de 1 a 5 estrelas ao tópico.

---

## ⭐ Novo Sistema de Avaliação com Comentário & Fórum da Guilda

1. **Avaliações com Resenhas em Livros (`detalhes.html`)**:
   - Seletor interativo de 1 a 5 estrelas.
   - Campo para nome/apelido do aventureiro e textarea para resenha.
   - Exibição de média de notas com emblema dourado e lista cronológica de comentários deixados pela comunidade.

2. **Fórum dos Aventureiros (`forum.html`)**:
   - Discussões organizadas por sistemas (D&D 5E, Tormenta 20, Fabula Ultima, Discussão Geral).
   - Busca em tempo real por tópicos.
   - Modal para criar novos tópicos de discussão.
   - Modal de detalhes da discussão exibindo o texto original e todos os comentários.
   - Formulário para **comentar avaliando a discussão com notas de 1 a 5 estrelas**!

# 🐉 Biblioteca Dracônica - Sistema de Acervo RPG & Fórum da Guilda (Django)

Projeto completo de acervo e comunidade de RPG (D&D 5E, Tormenta 20, Fabula Ultima, JJRPG, Horror Cósmico, Cyberpunk) com **backend em Python & Django**, **Django ORM**, banco de dados SQLite com migrações automáticas, sistema de busca e filtragem em tempo real, avaliações com resenhas, personalização de perfil e fórum comunitário interativo.

---

## 🚀 Como Iniciar o Projeto

Você pode iniciar o projeto de duas formas:

### Opção 1: Via executável `.bat` (Recomendado no Windows)
Basta dar dois cliques no arquivo:
```
iniciar.bat
```
Ele iniciará o servidor Django na porta `5000` e abrirá automaticamente no seu navegador padrão em `http://localhost:5000`.

### Opção 2: Pelo terminal
```bash
python manage.py runserver 0.0.0.0:5000
```
Em seguida, acesse no navegador: **`http://localhost:5000`**

---

## 🏛️ Banco de Dados e Backend em Django

O backend e o banco de dados funcionam 100% sobre a arquitetura do **Django**:

- **Modelos Django ORM** (`backend/draconica_project/biblioteca/models.py`):
  - `Usuario`: Registro, login, hash seguro de senhas, avatar, biografia e status de jogo (*Procurando Campanha*, *Procurando Jogadores*, *Em Campanha*).
  - `Livro`: Título, autor, sistema, tipo de jogo (JJRPG, Fantasia Medieval, Horror Cósmico, Cyberpunk), links de compra ou financiamento coletivo e downloads.
  - `Avaliacao`: Avaliações com notas de 1 a 5 estrelas e resenhas nos livros.
  - `ForumTopico`: Tópicos de discussão categorizados por sistema e tipo de jogo.
  - `ForumComentario`: Comentários com notas e respostas aos tópicos.
- **Painel Administrativo do Django**: Acesse `http://localhost:5000/admin/` (usuário: `admin`, senha: `admin123`) para gerenciar todos os registros visualmente.
- **Comandos de Gerenciamento**:
  ```bash
  python manage.py migrate          # Aplica as migrações do banco
  python manage.py seed_db          # Popula o banco com livros, capas e dados iniciais
  python manage.py runserver 5000   # Inicia o servidor na porta 5000
  ```

---

## 🧪 Testes Automatizados

Para rodar a suíte completa de testes no Django:
```bash
python test_api.py
```
Todos os 18 testes de integração validam livros, buscas, fóruns, avaliações, autenticação, perfis e páginas estáticas.

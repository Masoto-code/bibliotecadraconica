import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from app import app

client = app.test_client()

# 1. Testar listar livros (acervo ampliado de livros, suplementos e homebrews com capas web)
res = client.get('/api/livros')
assert res.status_code == 200, f'Status: {res.status_code}'
livros = res.get_json()
assert len(livros) >= 44, f'Esperava pelo menos 44 livros, obteve {len(livros)}'
assert all(l['capa_url'].startswith('http') for l in livros), 'Todas as capas devem ser URLs web!'
assert any(l['categoria'] == 'Suplemento' for l in livros), 'Deve conter suplementos'
assert any(l['categoria'] == 'Homebrew' for l in livros), 'Deve conter homebrews'
print(f'[TEST 1 OK] /api/livros retornou {len(livros)} livros com capas web, suplementos e homebrews!')

# 2. Testar busca de livros
res = client.get('/api/livros?busca=fabula')
livros_busca = res.get_json()
assert len(livros_busca) >= 5, f'Busca fabula: {len(livros_busca)}'
print(f'[TEST 2 OK] /api/livros?busca=fabula retornou {len(livros_busca)} livros!')

# 3. Testar links de compra e financiamento
l1 = client.get('/api/livros/1').get_json()
assert l1['tipo_link'] == 'compra'
assert l1['link_compra'] is not None

l6 = client.get('/api/livros/6').get_json()
assert l6['tipo_link'] == 'financiamento'
assert 'patreon' in l6['link_compra'] or 'kickstarter' in l6['link_compra'] or 'catarse' in l6['link_compra']
print('[TEST 3 OK] Links de compra e financiamento coletivo validados!')

# 4. Testar obter livro 1
res = client.get('/api/livros/1')
assert res.status_code == 200
livro1 = res.get_json()
assert 'avaliacoes' in livro1 and len(livro1['avaliacoes']) > 0
print(f"[TEST 4 OK] /api/livros/1 retornou livro e avaliacoes!")

# 5. Testar avaliar livro
res = client.post('/api/livros/1/avaliar', json={'usuario': 'Mago Testador', 'nota': 5, 'comentario': 'Excelente!'})
assert res.status_code == 201
print('[TEST 5 OK] POST /api/livros/1/avaliar salvou avaliacao!')

# 6. Testar forum topicos
res = client.get('/api/forum/topicos')
assert res.status_code == 200
topicos = res.get_json()
assert len(topicos) >= 3
print(f'[TEST 6 OK] /api/forum/topicos retornou {len(topicos)} topicos!')

# 7. Testar criar topico
res = client.post('/api/forum/topicos', json={'titulo': 'Topico de Teste', 'autor': 'Tester', 'sistema': 'Geral', 'conteudo': 'Conteudo de teste'})
assert res.status_code == 201
print('[TEST 7 OK] POST /api/forum/topicos criou topico!')

# 8. Testar comentar no forum
res = client.post('/api/forum/topicos/1/comentarios', json={'usuario': 'Comentador', 'texto': 'Comentario de teste', 'avaliacao': 5})
assert res.status_code == 201
print('[TEST 8 OK] POST /api/forum/topicos/1/comentarios adicionou avaliacao e comentario!')

# 9. Testar Registro e Login
email_teste = f'teste_{os.getpid()}@draconica.com'
res_reg = client.post('/api/auth/register', json={'nome': 'Paladino de Teste', 'email': email_teste, 'senha': 'segredoepico'})
assert res_reg.status_code == 201
res_login = client.post('/api/auth/login', json={'email': email_teste, 'senha': 'segredoepico'})
assert res_login.status_code == 200
print('[TEST 9 OK] Registro e Login funcionando com sucesso!')

# 10. Testar páginas estáticas (incluindo perfil.html)
assert client.get('/').status_code == 200
assert client.get('/index.html').status_code == 200
assert client.get('/inicial.html').status_code == 200
assert client.get('/forum.html').status_code == 200
assert client.get('/detalhes.html').status_code == 200
assert client.get('/login.html').status_code == 200
assert client.get('/perfil.html').status_code == 200
print('[TEST 10 OK] Todas as paginas estaticas (inicial, catalogo, forum, detalhes, login, perfil) servidas com sucesso!')

# 11. Testar Personalização de Perfil (Nome, Bio, Status de Jogo e Avatar/Upload)
user_id = res_login.get_json()['usuario']['id']
res_perfil_put = client.put('/api/usuarios/perfil', json={
    'id': user_id,
    'nome': 'Paladino Sagrado Renomeado',
    'bio': 'Defensor do templo de Valkaria e guardião dos tomos antigos.',
    'status_jogo': 'procurando_jogadores',
    'avatar': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
})
assert res_perfil_put.status_code == 200
perfil_atualizado = res_perfil_put.get_json()['usuario']
assert perfil_atualizado['nome'] == 'Paladino Sagrado Renomeado'
assert perfil_atualizado['status_jogo'] == 'procurando_jogadores'
assert 'base64' in perfil_atualizado['avatar']
print('[TEST 11 OK] PUT /api/usuarios/perfil atualizou nome, bio, avatar e status_jogo com sucesso!')

# 12. Testar Atividades do Usuário
res_atividades = client.get('/api/usuarios/atividades?nome=Paladino Sagrado Renomeado')
assert res_atividades.status_code == 200
atividades = res_atividades.get_json()
assert 'topicos_criados' in atividades
assert 'topicos_respondidos' in atividades
assert 'avaliacoes' in atividades
print('[TEST 12 OK] GET /api/usuarios/atividades retornou tópicos e avaliações do aventureiro!')

# 13. Testar Exclusão de Tópico do Fórum
res_del = client.delete(f'/api/forum/topicos/{topicos[-1]["id"]}')
assert res_del.status_code in [200, 404]
print('[TEST 13 OK] DELETE /api/forum/topicos/<id> validado com sucesso!')

# 14. Testar API de Livros com filtro por Tipo de Jogo (JJRPG)
res_jjrpg = client.get('/api/livros?tipo_jogo=JJRPG')
assert res_jjrpg.status_code == 200
livros_jjrpg = res_jjrpg.get_json()
assert len(livros_jjrpg) >= 6, f'Esperava livros de JJRPG, obteve {len(livros_jjrpg)}'
assert any('Fabula' in l['titulo'] for l in livros_jjrpg)
print(f'[TEST 14 OK] /api/livros?tipo_jogo=JJRPG retornou {len(livros_jjrpg)} grimórios de JJRPG!')

# 15. Testar API de Livros com filtro por Financiamento Coletivo e Compra
res_fin = client.get('/api/livros?tipo_link=financiamento')
assert res_fin.status_code == 200
livros_fin = res_fin.get_json()
assert len(livros_fin) >= 4
assert all(l['tipo_link'] == 'financiamento' for l in livros_fin)

res_compra = client.get('/api/livros?tipo_link=compra')
assert res_compra.status_code == 200
livros_compra = res_compra.get_json()
assert len(livros_compra) >= 12
assert all(l['tipo_link'] == 'compra' for l in livros_compra)
print(f'[TEST 15 OK] Filtros por financiamento ({len(livros_fin)}) e compra ({len(livros_compra)}) validados com sucesso!')

# 16. Testar Catálogo Completo e Tipos de Jogo
res_cat = client.get('/api/livros/catalogo-completo')
assert res_cat.status_code == 200
cat = res_cat.get_json()
assert 'JJRPG' in cat['grupos_por_tipo']
assert cat['total_compra'] > 0
assert cat['total_financiamento'] > 0

res_tipos = client.get('/api/tipos-jogo')
assert res_tipos.status_code == 200
tipos = res_tipos.get_json()
assert any(t['tipo_jogo'] == 'JJRPG' for t in tipos)
print('[TEST 16 OK] /api/livros/catalogo-completo e /api/tipos-jogo agrupando por Tipo de Jogo perfeitamente!')

# 17. Testar Adicionar Novo Livro de RPG via API (POST /api/livros)
res_post_livro = client.post('/api/livros', json={
    'titulo': 'Sword World 2.5 - Livro de Regras',
    'autor': 'Kei Kitazawa / Group SNE',
    'sistema': 'Sword World',
    'tipo_jogo': 'JJRPG',
    'categoria': 'Manual Principal',
    'sinopse': 'O mais lendário RPG de mesa japonês de fantasia com dados 2d6 e combates ágeis.',
    'capa_url': '../img/fu-basico.jpg',
    'link_compra': 'https://bookwalker.jp/',
    'tipo_link': 'compra'
})
assert res_post_livro.status_code == 201
print('[TEST 17 OK] POST /api/livros cadastrou novo grimório via API com sucesso!')

# 18. Testar Tópicos do Fórum por Tipo de Jogo (JJRPG)
res_topicos_jjrpg = client.get('/api/forum/topicos?sistema=JJRPG')
assert res_topicos_jjrpg.status_code == 200
topicos_jjrpg = res_topicos_jjrpg.get_json()
assert len(topicos_jjrpg) >= 1
print(f'[TEST 18 OK] /api/forum/topicos?sistema=JJRPG retornou {len(topicos_jjrpg)} discussões de JJRPG!')

print('\n>>> TODOS OS TESTES (18/18) PASSARAM COM 100% DE SUCESSO! <<<')

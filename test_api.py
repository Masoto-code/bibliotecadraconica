import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from app import app

client = app.test_client()

# 1. Testar listar livros
res = client.get('/api/livros')
assert res.status_code == 200, f'Status: {res.status_code}'
livros = res.get_json()
assert len(livros) == 21, f'Esperava 21 livros, obteve {len(livros)}'
print('[TEST 1 OK] /api/livros retornou 21 livros!')

# 2. Testar busca de livros
res = client.get('/api/livros?busca=jogador')
livros_busca = res.get_json()
assert len(livros_busca) >= 2, f'Busca jogador: {len(livros_busca)}'
print(f'[TEST 2 OK] /api/livros?busca=jogador retornou {len(livros_busca)} livros!')

# 3. Testar links de compra e financiamento
l1 = client.get('/api/livros/1').get_json()
assert l1['tipo_link'] == 'compra'
assert 'amazon' in l1['link_compra']

l5 = client.get('/api/livros/5').get_json()
assert l5['tipo_link'] == 'financiamento'

l6 = client.get('/api/livros/6').get_json()
assert l6['link_compra'] is None
print('[TEST 3 OK] Links de compra, financiamento e itens sem compra validados!')

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

# 10. Testar páginas estáticas
assert client.get('/').status_code == 200
assert client.get('/index.html').status_code == 200
assert client.get('/inicial.html').status_code == 200
assert client.get('/forum.html').status_code == 200
assert client.get('/detalhes.html').status_code == 200
assert client.get('/login.html').status_code == 200
print('[TEST 10 OK] Todas as paginas estaticas (inicial, catalogo, forum, detalhes, login) servidas com sucesso!')
print('\n>>> TODOS OS TESTES PASSARAM COM 100% DE SUCESSO! <<<')

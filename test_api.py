import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from app import app

client = app.test_client()

# 1. Testar listar livros (acervo ampliado de livros, suplementos e homebrews com capas garantidas)
res = client.get('/api/livros')
assert res.status_code == 200, f'Status: {res.status_code}'
livros = res.get_json()
assert len(livros) >= 44, f'Esperava pelo menos 44 livros, obteve {len(livros)}'
assert all(bool(l['capa_url']) for l in livros), 'Todos os livros devem ter capa definida!'
assert any(l['categoria'] == 'Suplemento' for l in livros), 'Deve conter suplementos'
assert any(l['categoria'] == 'Homebrew' for l in livros), 'Deve conter homebrews'
print(f'[TEST 1 OK] /api/livros retornou {len(livros)} livros com capas garantidas, suplementos e homebrews!')

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
topico_criado_id = res.get_json()['id']
print('[TEST 7 OK] POST /api/forum/topicos criou topico!')

# 8. Testar comentar no forum
res = client.post(f'/api/forum/topicos/{topico_criado_id}/comentarios', json={'usuario': 'Comentador', 'texto': 'Comentario de teste', 'avaliacao': 5})
assert res.status_code == 201
print('[TEST 8 OK] POST /api/forum/topicos/<id>/comentarios adicionou avaliacao e comentario!')

# 9. Testar Registro e Login
email_teste = f'teste_{os.getpid()}@draconica.com'
res_reg = client.post('/api/auth/register', json={'nome': 'Paladino de Teste', 'email': email_teste, 'senha': 'segredoepico'})
assert res_reg.status_code == 201
res_login = client.post('/api/auth/login', json={'email': email_teste, 'senha': 'segredoepico'})
assert res_login.status_code == 200
print('[TEST 9 OK] Registro e Login funcionando com sucesso!')

# 10. Testar páginas estáticas (incluindo perfil.html e mensagens.html)
assert client.get('/').status_code == 200
assert client.get('/index.html').status_code == 200
assert client.get('/inicial.html').status_code == 200
assert client.get('/forum.html').status_code == 200
assert client.get('/detalhes.html').status_code == 200
assert client.get('/login.html').status_code == 200
assert client.get('/perfil.html').status_code == 200
assert client.get('/mensagens.html').status_code == 200
print('[TEST 10 OK] Todas as paginas estaticas (inicial, catalogo, forum, detalhes, login, perfil, mensagens) servidas com sucesso!')

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
ativ = res_atividades.get_json()
assert 'topicos_criados' in ativ
assert 'topicos_respondidos' in ativ
assert 'avaliacoes' in ativ
print('[TEST 12 OK] GET /api/usuarios/atividades retornou histórico completo do perfil!')

# 13. Testar Obter Perfil por ID
res_perfil_get = client.get(f'/api/usuarios/perfil/{user_id}')
assert res_perfil_get.status_code == 200
perfil_get = res_perfil_get.get_json()
assert perfil_get['nome'] == 'Paladino Sagrado Renomeado'
assert perfil_get['status_jogo'] == 'procurando_jogadores'
print('[TEST 13 OK] GET /api/usuarios/perfil/<id> retornou dados do perfil!')

# 14. Testar Tratamento de Erros e Proteção contra Duplicidade
res_dup = client.post('/api/auth/register', json={'nome': 'Outro', 'email': email_teste, 'senha': 'senha_duplicada'})
assert res_dup.status_code == 409
assert 'já está cadastrado' in res_dup.get_json()['erro']
print('[TEST 14 OK] Proteção contra emails duplicados validada!')

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
    'capa_url': '../imagens/capas/livro_1.svg',
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

# ================= TESTES DO SISTEMA DE MENSAGENS (MESSENGER / REDE SOCIAL) =================

# 19. Testar Listar Usuários da Guilda para Mensagens
res_users = client.get('/api/usuarios')
assert res_users.status_code == 200
guild_users = res_users.get_json()
assert len(guild_users) >= 4
assert any(u['nome'] == 'Mestre dos Magos' for u in guild_users)
print(f'[TEST 19 OK] /api/usuarios retornou {len(guild_users)} aventureiros para chat e grupos!')

# 20. Testar Listar Conversas do Usuário
res_convs = client.get('/api/mensagens/conversas?usuario_id=1')
assert res_convs.status_code == 200
convs = res_convs.get_json()
assert len(convs) >= 2
assert any(c['tipo'] == 'grupo' for c in convs)
print(f'[TEST 20 OK] /api/mensagens/conversas listou {len(convs)} conversas com participantes e prévias!')

# 21. Testar Criar Conversa Privada (Direct Message 1-a-1)
res_priv = client.post('/api/mensagens/conversas', json={
    'tipo': 'privada',
    'usuario_id': user_id,
    'destinatario_id': 1
})
assert res_priv.status_code in [200, 201]
chat_priv_id = res_priv.get_json()['conversa_id']
print(f'[TEST 21 OK] POST /api/mensagens/conversas iniciou chat privado (ID: {chat_priv_id})!')

# 22. Testar Criar Grupo de Mesa de RPG (Social Group Chat)
res_grupo = client.post('/api/mensagens/conversas', json={
    'tipo': 'grupo',
    'nome_grupo': 'Mesa Semanal de Fabula Ultima',
    'criador_id': user_id,
    'criador_nome': 'Paladino Sagrado Renomeado',
    'foto_grupo': '🏰',
    'participantes_ids': [1, 2, 3],
    'mensagem_inicial': 'Saudações aventureiros! Sessão 0 agendada para sexta-feira.'
})
assert res_grupo.status_code == 201
grupo_id = res_grupo.get_json()['conversa_id']
print(f'[TEST 22 OK] POST /api/mensagens/conversas criou grupo social (ID: {grupo_id}) com participantes!')

# 23. Testar Enviar Mensagens na Conversa
res_msg = client.post(f'/api/mensagens/conversas/{grupo_id}/mensagens', json={
    'remetente_id': user_id,
    'remetente_nome': 'Paladino Sagrado Renomeado',
    'remetente_avatar': '🛡️',
    'conteudo': '🎲 [Rolagem de d20]: Resultado = 20 🌟 ACERTO CRÍTICO!'
})
assert res_msg.status_code == 201
msg_enviada = res_msg.get_json()['dados']
assert 'ACERTO CRÍTICO' in msg_enviada['conteudo']
print('[TEST 23 OK] POST /api/mensagens/conversas/<id>/mensagens enviou mensagem e rolagem de dado!')

# 24. Testar Histórico Completo de Mensagens e Membros
res_hist = client.get(f'/api/mensagens/conversas/{grupo_id}/mensagens')
assert res_hist.status_code == 200
dados_hist = res_hist.get_json()
assert len(dados_hist['mensagens']) >= 2
assert len(dados_hist['participantes']) >= 2
print(f"[TEST 24 OK] GET /api/mensagens/conversas/<id>/mensagens retornou histórico ({len(dados_hist['mensagens'])} msgs) e membros ({len(dados_hist['participantes'])})!")

print('\n>>> TODOS OS TESTES (24/24) PASSARAM COM 100% DE SUCESSO! <<<')

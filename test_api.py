import os
import sys
import json
from pathlib import Path

# Configura ambiente Django
project_dir = Path(__file__).resolve().parent / 'backend' / 'draconica_project'
sys.path.insert(0, str(project_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'draconica_project.settings')

import django
django.setup()

from django.test import Client
from biblioteca.seed import run_seed

# Garante banco de dados povoado
run_seed()

client = Client()

# Helper para chamadas JSON
class JsonClient:
    def __init__(self, c):
        self.c = c

    def get(self, url):
        res = self.c.get(url)
        res.get_json = lambda: json.loads(res.content.decode('utf-8')) if res.content else None
        return res

    def post(self, url, json_data=None):
        content = json.dumps(json_data) if json_data is not None else ''
        res = self.c.post(url, data=content, content_type='application/json')
        res.get_json = lambda: json.loads(res.content.decode('utf-8')) if res.content else None
        return res

    def put(self, url, json_data=None):
        content = json.dumps(json_data) if json_data is not None else ''
        res = self.c.put(url, data=content, content_type='application/json')
        res.get_json = lambda: json.loads(res.content.decode('utf-8')) if res.content else None
        return res

jc = JsonClient(client)

# 1. Testar listar livros (acervo ampliado de livros, suplementos e homebrews com capas garantidas)
res = jc.get('/api/livros')
assert res.status_code == 200, f'Status: {res.status_code}'
livros = res.get_json()
assert len(livros) >= 44, f'Esperava pelo menos 44 livros, obteve {len(livros)}'
assert all(bool(l['capa_url']) for l in livros), 'Todos os livros devem ter capa definida!'
assert any(l['categoria'] == 'Suplemento' for l in livros), 'Deve conter suplementos'
assert any(l['categoria'] == 'Homebrew' for l in livros), 'Deve conter homebrews'
print(f'[TEST 1 OK] /api/livros retornou {len(livros)} livros com capas garantidas via Django ORM!')

# 2. Testar busca de livros
res = jc.get('/api/livros?busca=fabula')
livros_busca = res.get_json()
assert len(livros_busca) >= 5, f'Busca fabula: {len(livros_busca)}'
print(f'[TEST 2 OK] /api/livros?busca=fabula retornou {len(livros_busca)} livros!')

# 3. Testar links de compra e financiamento
l1 = jc.get('/api/livros/1').get_json()
assert l1['tipo_link'] == 'compra'
assert l1['link_compra'] is not None

l6 = jc.get('/api/livros/6').get_json()
assert l6['tipo_link'] == 'financiamento'
assert 'patreon' in l6['link_compra'] or 'kickstarter' in l6['link_compra'] or 'catarse' in l6['link_compra']
print('[TEST 3 OK] Links de compra e financiamento coletivo validados!')

# 4. Testar obter livro 1
res = jc.get('/api/livros/1')
assert res.status_code == 200
livro1 = res.get_json()
assert 'avaliacoes' in livro1 and len(livro1['avaliacoes']) > 0
print(f"[TEST 4 OK] /api/livros/1 retornou livro e avaliações via Django ORM!")

# 5. Testar avaliar livro
res = jc.post('/api/livros/1/avaliar', json_data={'usuario': 'Mago Testador', 'nota': 5, 'comentario': 'Excelente!'})
assert res.status_code == 201
print('[TEST 5 OK] POST /api/livros/1/avaliar salvou avaliação com sucesso!')

# 6. Testar fórum tópicos
res = jc.get('/api/forum/topicos')
assert res.status_code == 200
topicos = res.get_json()
assert len(topicos) >= 3
print(f'[TEST 6 OK] /api/forum/topicos retornou {len(topicos)} tópicos!')

# 7. Testar criar tópico
res = jc.post('/api/forum/topicos', json_data={'titulo': 'Tópico de Teste Django', 'autor': 'Tester', 'sistema': 'Geral', 'conteudo': 'Conteúdo de teste com Django!'})
assert res.status_code == 201
topico_criado_id = res.get_json()['id']
print('[TEST 7 OK] POST /api/forum/topicos criou tópico!')

# 8. Testar comentar no fórum
res = jc.post(f'/api/forum/topicos/{topico_criado_id}/comentarios', json_data={'usuario': 'Comentador', 'texto': 'Comentário de teste', 'avaliacao': 5})
assert res.status_code == 201
print('[TEST 8 OK] POST /api/forum/topicos/<id>/comentarios adicionou avaliação e comentário!')

# 9. Testar Registro e Login
email_teste = f'teste_{os.getpid()}@draconica.com'
res_reg = jc.post('/api/auth/register', json_data={'nome': 'Paladino de Teste', 'email': email_teste, 'senha': 'Segredo@123'})
assert res_reg.status_code == 201
res_login = jc.post('/api/auth/login', json_data={'email': email_teste, 'senha': 'Segredo@123'})
assert res_login.status_code == 200
print('[TEST 9 OK] Registro e Login funcionando com sucesso via Django!')

# 10. Testar páginas estáticas (inicial, catalogo, forum, detalhes, login, perfil, cadastrar-livro, central-admin, termos-privacidade)
assert client.get('/').status_code == 200
assert client.get('/inicial.html').status_code == 200
assert client.get('/index.html').status_code == 200
assert client.get('/forum.html').status_code == 200
assert client.get('/detalhes.html').status_code == 200
assert client.get('/login.html').status_code == 200
assert client.get('/perfil.html').status_code == 200
assert client.get('/cadastrar-livro.html').status_code == 200
assert client.get('/central-admin.html').status_code == 200
assert client.get('/termos-privacidade.html').status_code == 200
print('[TEST 10 OK] Todas as páginas estáticas (incluindo cadastrar-livro, central-admin e termos-privacidade) servidas pelo Django com sucesso!')

# 11. Testar Personalização de Perfil (Nome, Bio, Status de Jogo e Avatar)
user_id = res_login.get_json()['usuario']['id']
res_perfil_put = jc.put('/api/usuarios/perfil', json_data={
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
print('[TEST 11 OK] PUT /api/usuarios/perfil atualizou nome, bio, avatar e status_jogo no Django!')

# 12. Testar Atividades do Usuário
res_atividades = jc.get('/api/usuarios/atividades?nome=Paladino Sagrado Renomeado')
assert res_atividades.status_code == 200
ativ = res_atividades.get_json()
assert 'topicos_criados' in ativ
assert 'topicos_respondidos' in ativ
assert 'avaliacoes' in ativ
print('[TEST 12 OK] GET /api/usuarios/atividades retornou histórico completo do perfil!')

# 13. Testar Obter Perfil por ID
res_perfil_get = jc.get(f'/api/usuarios/perfil/{user_id}')
assert res_perfil_get.status_code == 200
perfil_get = res_perfil_get.get_json()
assert perfil_get['nome'] == 'Paladino Sagrado Renomeado'
assert perfil_get['status_jogo'] == 'procurando_jogadores'
print('[TEST 13 OK] GET /api/usuarios/perfil/<id> retornou dados do perfil!')

# 14. Testar Tratamento de Erros e Proteção contra Duplicidade
res_dup = jc.post('/api/auth/register', json_data={'nome': 'Outro', 'email': email_teste, 'senha': 'Segredo@123'})
assert res_dup.status_code == 409
assert 'já está cadastrado' in res_dup.get_json()['erro']
print('[TEST 14 OK] Proteção contra emails duplicados validada no Django!')

# 15. Testar API de Livros com filtro por Financiamento Coletivo e Compra
res_fin = jc.get('/api/livros?tipo_link=financiamento')
assert res_fin.status_code == 200
livros_fin = res_fin.get_json()
assert len(livros_fin) >= 4
assert all(l['tipo_link'] == 'financiamento' for l in livros_fin)

res_compra = jc.get('/api/livros?tipo_link=compra')
assert res_compra.status_code == 200
livros_compra = res_compra.get_json()
assert len(livros_compra) >= 12
assert all(l['tipo_link'] == 'compra' for l in livros_compra)
print(f'[TEST 15 OK] Filtros por financiamento ({len(livros_fin)}) e compra ({len(livros_compra)}) validados!')

# 16. Testar Catálogo Completo e Tipos de Jogo
res_cat = jc.get('/api/livros/catalogo-completo')
assert res_cat.status_code == 200
cat = res_cat.get_json()
assert 'JJRPG' in cat['grupos_por_tipo']
assert cat['total_compra'] > 0
assert cat['total_financiamento'] > 0

res_tipos = jc.get('/api/tipos-jogo')
assert res_tipos.status_code == 200
tipos = res_tipos.get_json()
assert any(t['tipo_jogo'] == 'JJRPG' for t in tipos)
print('[TEST 16 OK] /api/livros/catalogo-completo e /api/tipos-jogo agrupando por Tipo de Jogo via Django!')

# 17. Testar Adicionar Novo Livro de RPG via API (POST /api/livros)
res_post_livro = jc.post('/api/livros', json_data={
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
print('[TEST 17 OK] POST /api/livros cadastrou novo grimório via Django ORM!')

# 18. Testar Tópicos do Fórum por Tipo de Jogo (JJRPG)
res_topicos_jjrpg = jc.get('/api/forum/topicos?sistema=JJRPG')
assert res_topicos_jjrpg.status_code == 200
topicos_jjrpg = res_topicos_jjrpg.get_json()
assert len(topicos_jjrpg) >= 1
print(f'[TEST 18 OK] /api/forum/topicos?sistema=JJRPG retornou {len(topicos_jjrpg)} discussões de JJRPG!')

# 19. Testar Submissão de RPG Autoral / Conteúdo de Fã (POST /api/livros/submeter)
res_submeter = jc.post('/api/livros/submeter', json_data={
    'titulo': 'Crônicas de Eldoria (RPG Autoral)',
    'autor': 'Mestre Valente',
    'sistema': 'Eldoria D20',
    'tipo_jogo': 'Fantasia Medieval',
    'categoria': 'RPG Autoral / Próprio',
    'tags': 'fantasia, rúnica, autoral, d20',

    'tags': 'fantasia, rúnica, autoral, d20',
    'sinopse': 'Sistema de RPG totalmente autoral com mecânicas inéditas de magia rúnica e combate narrativo.',
    'usuario_id': user_id,
    'arquivo_url': '../uploads/rpgs/cronicas_eldoria.pdf'
})
assert res_submeter.status_code == 201
sub_dados = res_submeter.get_json()
sub_id = sub_dados['id']
assert sub_dados['livro']['status_aprovacao'] == 'pendente'
print('[TEST 19 OK] POST /api/livros/submeter enviou RPG autoral para moderação com status pendente!')

# 20. Testar Listagem de Submissões Pendentes e por Usuário (GET /api/livros/submissoes)
res_sub_user = jc.get(f'/api/livros/submissoes?usuario_id={user_id}')
assert res_sub_user.status_code == 200
subs_user = res_sub_user.get_json()
assert any(s['id'] == sub_id for s in subs_user)

res_sub_pendentes = jc.get('/api/livros/submissoes?apenas_pendentes=true')
assert res_sub_pendentes.status_code == 200
subs_pendentes = res_sub_pendentes.get_json()
assert any(s['id'] == sub_id for s in subs_pendentes)
print('[TEST 20 OK] GET /api/livros/submissoes retornou submissões do usuário e fila pendente de moderação!')

# 21. Testar Moderação: Aprovar Submissão (POST /api/livros/<id>/moderar)
res_mod_aprovar = jc.post(f'/api/livros/{sub_id}/moderar', json_data={
    'acao': 'aprovar'
})
assert res_mod_aprovar.status_code == 200
mod_dados = res_mod_aprovar.get_json()
assert mod_dados['livro']['status_aprovacao'] == 'aprovado'

# Validar que agora o RPG aprovado aparece no catálogo geral
res_cat_busca = jc.get('/api/livros?busca=Eldoria')
assert res_cat_busca.status_code == 200
livros_eldoria = res_cat_busca.get_json()
assert len(livros_eldoria) >= 1
assert any(l['id'] == sub_id for l in livros_eldoria)
print('[TEST 21 OK] POST /api/livros/<id>/moderar APROVOU o RPG autoral e o publicou no catálogo oficial!')

# 22. Testar Registro de Download de RPG Aprovado (POST /api/livros/<id>/download)
res_download = jc.post(f'/api/livros/{sub_id}/download')
assert res_download.status_code == 200
down_dados = res_download.get_json()
assert down_dados['downloads'] >= 1
assert down_dados['arquivo_url'] == '../uploads/rpgs/cronicas_eldoria.pdf'
print(f'[TEST 22 OK] POST /api/livros/<id>/download contabilizou {down_dados["downloads"]} download(s) com sucesso!')

# 23. Testar Moderação: Rejeitar Submissão com Motivo de Recusa
res_sub_invalida = jc.post('/api/livros/submeter', json_data={
    'titulo': 'Material Não Autoral / Cópia Direta',
    'autor': 'Desconhecido',
    'sistema': 'Outro',
    'categoria': 'Manual Principal',
    'sinopse': 'Material comercial sem permissão de distribuição.',
    'usuario_id': user_id
})
assert res_sub_invalida.status_code == 201
sub_inv_id = res_sub_invalida.get_json()['id']

res_mod_rejeitar = jc.post(f'/api/livros/{sub_inv_id}/moderar', json_data={
    'acao': 'rejeitar',
    'motivo': 'Aceitamos somente conteúdos criados por fãs ou RPGs próprios e autorais.'
})
assert res_mod_rejeitar.status_code == 200
mod_rej_dados = res_mod_rejeitar.get_json()
assert mod_rej_dados['livro']['status_aprovacao'] == 'rejeitado'
assert 'conteúdos criados por fãs' in mod_rej_dados['livro']['motivo_rejeicao']

# Garantir que submissão rejeitada NÃO aparece no catálogo
res_cat_rej = jc.get('/api/livros?busca=Material+N%C3%A3o+Autoral')
assert len(res_cat_rej.get_json()) == 0
print('[TEST 23 OK] POST /api/livros/<id>/moderar REJEITOU material impróprio com motivo e blindou o catálogo!')


# 24. Testar erro de login com credenciais incorretas ("Email ou Senha incorreto")
res_login_err = jc.post('/api/auth/login', json_data={'email': email_teste, 'senha': 'SenhaErrada@999'})
assert res_login_err.status_code == 401
assert res_login_err.get_json()['erro'] == 'Email ou Senha incorreto'
print('[TEST 24 OK] Validação de login com erro retornou exatamente "Email ou Senha incorreto"!')

# 25. Testar Recuperação e Redefinição de Senha
res_rec = jc.post('/api/auth/recuperar-senha', json_data={'email': email_teste})
assert res_rec.status_code == 200
rec_dados = res_rec.get_json()
assert 'Confirme aqui para alterar a senha' in rec_dados['mensagem']
token_rec = rec_dados['token']

res_redef = jc.post('/api/auth/redefinir-senha', json_data={
    'email': email_teste,
    'nova_senha': 'NovaSenha@999',
    'confirmar_senha': 'NovaSenha@999',
    'token': token_rec
})
assert res_redef.status_code == 200
res_login_novo = jc.post('/api/auth/login', json_data={'email': email_teste, 'senha': 'NovaSenha@999'})
assert res_login_novo.status_code == 200
print('[TEST 25 OK] Fluxo de Recuperação e Redefinição de Senha testado com 100% de sucesso!')


# 26. Testar Autenticação e Privilégios da Conta Administrador Oficial (ADMBIBLIOTECA@gmail.com)
res_adm = jc.post('/api/auth/login', json_data={'email': 'ADMBIBLIOTECA@gmail.com', 'senha': 'AKhDd*M38DI0(d2N'})
assert res_adm.status_code == 200
adm_data = res_adm.get_json()['usuario']
assert adm_data['email'].lower() == 'admbiblioteca@gmail.com'
assert adm_data['is_admin'] == True
print('[TEST 26 OK] Conta oficial de Administrador (ADMBIBLIOTECA@gmail.com) autenticada com privilégios confirmados!')

print('\n>>> TODOS OS TESTES (26/26) PASSARAM COM 100% DE SUCESSO NO DJANGO! <<<')

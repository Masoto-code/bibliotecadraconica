import json
import mimetypes
import os
import re
import time
from pathlib import Path

from django.conf import settings
from django.db.models import Avg, Count, Q
from django.http import FileResponse, Http404, HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Avaliacao, ForumComentario, ForumTopico, Livro, Usuario

# Diretório base do frontend
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent.parent
FRONTEND_DIR = PROJECT_ROOT / 'frontend'


# ================= SERVIÇO DE ARQUIVOS ESTÁTICOS / FRONTEND =================

def serve_home(request):
    """Serve a página inicial."""
    caminho = FRONTEND_DIR / 'index' / 'inicial.html'
    if caminho.exists():
        return FileResponse(open(caminho, 'rb'), content_type='text/html')
    return HttpResponse("Página inicial não encontrada.", status=404)


def serve_frontend(request, filename):
    """Serve arquivos HTML, CSS, JS e imagens do projeto com proteção de caminhos."""
    filename = filename.replace('\\', '/').lstrip('/')
    filename = re.sub(r'^(?:\.\./)+', '', filename)

    # 1. Procura na pasta frontend/index (arquivos HTML principais)
    caminho_index = FRONTEND_DIR / 'index' / filename
    if caminho_index.is_file():
        content_type, _ = mimetypes.guess_type(str(caminho_index))
        return FileResponse(open(caminho_index, 'rb'), content_type=content_type or 'text/html')

    # 2. Suporte para rota /media/ mapeada para frontend/uploads/
    if filename.startswith('media/'):
        caminho_media = FRONTEND_DIR / 'uploads' / filename[6:]
        if caminho_media.is_file():
            content_type, _ = mimetypes.guess_type(str(caminho_media))
            return FileResponse(open(caminho_media, 'rb'), content_type=content_type or 'application/octet-stream')

    # 3. Procura em toda a pasta frontend (incluindo static, css, js, imagens, uploads)
    caminho_geral = FRONTEND_DIR / filename
    if caminho_geral.is_file():
        content_type, _ = mimetypes.guess_type(str(caminho_geral))
        return FileResponse(open(caminho_geral, 'rb'), content_type=content_type or 'application/octet-stream')

    return JsonResponse({"erro": "Arquivo não encontrado", "caminho": filename}, status=404)


# ================= ROTAS DE AUTENTICAÇÃO =================

def validar_complexidade_senha(senha):
    """Valida os requisitos de senha: mín 8 caracteres, número, especial, maiúscula e minúscula."""
    if len(senha) < 8:
        return False, "A senha deve conter no mínimo 8 caracteres."
    if not re.search(r'[0-9]', senha):
        return False, "A senha deve conter pelo menos um número."
    if not re.search(r'[A-Z]', senha):
        return False, "A senha deve conter pelo menos uma letra maiúscula."
    if not re.search(r'[a-z]', senha):
        return False, "A senha deve conter pelo menos uma letra minúscula."
    if not re.search(r'[^a-zA-Z0-9]', senha):
        return False, "A senha deve conter pelo menos um caractere especial (!@#$%^&* etc)."
    return True, ""

@csrf_exempt
def auth_register(request):
    """Registra uma nova conta de aventureiro."""
    if request.method != 'POST':
        return JsonResponse({"erro": "Método não permitido"}, status=405)

    try:
        dados = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        dados = {}

    nome = dados.get('nome', '').strip()
    email = dados.get('email', '').strip().lower()
    senha = dados.get('senha', '').strip()
    avatar = dados.get('avatar', '🧙‍♂️')

    if not nome or not email or not senha:
        return JsonResponse({"erro": "Preencha todos os campos obrigatórios (nome, email e senha)."}, status=400)

    valida, msg_erro = validar_complexidade_senha(senha)
    if not valida:
        return JsonResponse({"erro": msg_erro}, status=400)

    if Usuario.objects.filter(email=email).exists():
        return JsonResponse({"erro": "Este email já está cadastrado na guilda."}, status=409)

    usuario = Usuario(
        nome=nome,
        email=email,
        avatar=avatar,
        bio='',
        status_jogo='procurando_campanha'
    )
    usuario.set_senha(senha)
    usuario.save()

    return JsonResponse({
        "mensagem": "Cadastro realizado com sucesso! Bem-vindo à guilda.",
        "usuario": usuario.to_dict()
    }, status=201)


@csrf_exempt
def auth_login(request):
    """Autentica o aventureiro no sistema."""
    if request.method != 'POST':
        return JsonResponse({"erro": "Método não permitido"}, status=405)

    try:
        dados = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        dados = {}

    email = dados.get('email', '').strip().lower()
    senha = dados.get('senha', '').strip()

    if not email or not senha:
        return JsonResponse({"erro": "Email e senha são obrigatórios."}, status=400)

    usuario = Usuario.objects.filter(email=email).first()
    if not usuario or not usuario.check_senha(senha):
        return JsonResponse({"erro": "Email ou Senha incorreto"}, status=401)

    return JsonResponse({
        "mensagem": f"Saudações, {usuario.nome}! Login realizado com sucesso.",
        "usuario": usuario.to_dict()
    }, status=200)



@csrf_exempt
def auth_recuperar_senha(request):
    """Envia o link / token de confirmação de recuperação de senha."""
    if request.method != 'POST':
        return JsonResponse({"erro": "Método não permitido"}, status=405)
    
    try:
        dados = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        dados = {}

    email = dados.get('email', '').strip().lower()
    if not email:
        return JsonResponse({"erro": "Email é obrigatório."}, status=400)

    usuario = Usuario.objects.filter(email=email).first()
    if not usuario:
        return JsonResponse({"erro": "Email não encontrado na guilda."}, status=404)

    import uuid
    token = uuid.uuid4().hex[:12]
    usuario.reset_token = token
    usuario.save(update_fields=['reset_token'])

    return JsonResponse({
        "mensagem": "Confirme aqui para alterar a senha",
        "email": usuario.email,
        "token": token,
        "link_confirmacao": f"login.html?token={token}&email={usuario.email}"
    }, status=200)


@csrf_exempt
def auth_redefinir_senha(request):
    """Muda a senha da conta do usuário após confirmação."""
    if request.method != 'POST':
        return JsonResponse({"erro": "Método não permitido"}, status=405)

    try:
        dados = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        dados = {}

    email = dados.get('email', '').strip().lower()
    nova_senha = dados.get('nova_senha', '').strip()
    confirmar_senha = dados.get('confirmar_senha', '').strip()
    token = dados.get('token', '').strip()

    if not email or not nova_senha or not confirmar_senha:
        return JsonResponse({"erro": "Preencha todos os campos (email, nova senha e confirmação)."}, status=400)

    if nova_senha != confirmar_senha:
        return JsonResponse({"erro": "A nova senha e a confirmação não coincidem."}, status=400)

    valida, msg_erro = validar_complexidade_senha(nova_senha)
    if not valida:
        return JsonResponse({"erro": msg_erro}, status=400)

    usuario = Usuario.objects.filter(email=email).first()
    if not usuario:
        return JsonResponse({"erro": "Email não cadastrado."}, status=404)

    if token and usuario.reset_token and usuario.reset_token != token:
        return JsonResponse({"erro": "Token de recuperação inválido ou expirado."}, status=400)

    usuario.set_senha(nova_senha)
    usuario.reset_token = ''
    usuario.save()

    return JsonResponse({
        "mensagem": "Senha alterada com sucesso! Você já pode entrar com sua nova senha.",
        "email": usuario.email
    }, status=200)

# ================= ROTAS DE PERFIL DE USUÁRIO =================

@csrf_exempt
def usuarios_perfil(request, user_id=None):
    """Obtém ou atualiza os dados do perfil do aventureiro."""
    if request.method == 'GET':
        if not user_id:
            user_id = request.GET.get('id')
        email = request.GET.get('email', '').strip().lower()
        nome = request.GET.get('nome', '').strip()

        usuario = None
        if user_id:
            usuario = Usuario.objects.filter(id=user_id).first()
        elif email:
            usuario = Usuario.objects.filter(email=email).first()
        elif nome:
            usuario = Usuario.objects.filter(nome__iexact=nome).first()
            if not usuario:
                usuario = Usuario.objects.filter(nome__icontains=nome).first()

        if not usuario:
            return JsonResponse({"erro": "Aventureiro não encontrado."}, status=404)

        return JsonResponse(usuario.to_dict())

    elif request.method == 'PUT':
        try:
            dados = json.loads(request.body.decode('utf-8')) if request.body else {}
        except Exception:
            dados = {}

        uid = dados.get('id') or user_id
        if not uid:
            return JsonResponse({"erro": "ID do usuário é obrigatório."}, status=400)

        usuario = Usuario.objects.filter(id=uid).first()
        if not usuario:
            return JsonResponse({"erro": "Aventureiro não encontrado."}, status=404)

        if 'nome' in dados and dados['nome'].strip():
            usuario.nome = dados['nome'].strip()
        if 'bio' in dados:
            usuario.bio = dados['bio'].strip()
        if 'status_jogo' in dados and dados['status_jogo'] in ['procurando_campanha', 'procurando_jogadores', 'em_campanha']:
            usuario.status_jogo = dados['status_jogo']
        if 'avatar' in dados and dados['avatar']:
            usuario.avatar = dados['avatar']

        usuario.save()

        return JsonResponse({
            "mensagem": "Perfil do aventureiro atualizado com sucesso!",
            "usuario": usuario.to_dict()
        })

    return JsonResponse({"erro": "Método não permitido"}, status=405)


def usuarios_atividades(request):
    """Retorna as atividades sociais do aventureiro: tópicos criados, respondidos e avaliações."""
    nome = request.GET.get('nome', '').strip()
    if not nome:
        return JsonResponse({"erro": "Parâmetro nome é obrigatório."}, status=400)

    # 1. Tópicos criados pelo usuário
    topicos_criados_qs = ForumTopico.objects.filter(autor=nome).order_by('-data_criacao')
    topicos_criados = [t.to_dict() for t in topicos_criados_qs]

    # 2. Tópicos onde o usuário comentou/respondeu (excluindo os que ele mesmo criou)
    respondidos_ids = ForumComentario.objects.filter(usuario=nome).exclude(topico__autor=nome).values_list('topico_id', flat=True).distinct()
    topicos_respondidos_qs = ForumTopico.objects.filter(id__in=respondidos_ids).order_by('-data_criacao')
    topicos_respondidos = [t.to_dict() for t in topicos_respondidos_qs]

    # 3. Avaliações feitas pelo usuário
    avaliacoes_qs = Avaliacao.objects.filter(usuario=nome).select_related('livro').order_by('-data_criacao')
    avaliacoes = []
    for a in avaliacoes_qs:
        item = a.to_dict()
        item['livro_titulo'] = a.livro.titulo
        item['livro_capa'] = a.livro.capa_url
        item['livro_sistema'] = a.livro.sistema
        avaliacoes.append(item)

    return JsonResponse({
        "usuario": nome,
        "topicos_criados": topicos_criados,
        "topicos_respondidos": topicos_respondidos,
        "avaliacoes": avaliacoes
    })


def usuarios_list(request):
    """Lista todos os aventureiros da guilda."""
    busca = request.GET.get('busca', '').strip()
    qs = Usuario.objects.all().order_by('nome')
    if busca:
        qs = qs.filter(Q(nome__icontains=busca) | Q(bio__icontains=busca))
    return JsonResponse([u.to_dict() for u in qs], safe=False)


# ================= ROTAS DE LIVROS & GRIMÓRIOS =================

@csrf_exempt
def livros_list(request):
    """Lista ou adiciona grimórios no acervo da biblioteca."""
    if request.method == 'GET':
        busca = request.GET.get('busca', '').strip()
        sistema = request.GET.get('sistema', '').strip()
        tipo_jogo = request.GET.get('tipo_jogo', '').strip()
        tipo_link = request.GET.get('tipo_link', '').strip()
        categoria = request.GET.get('categoria', '').strip()
        status_aprovacao = request.GET.get('status_aprovacao', 'aprovado')

        if status_aprovacao == 'todos':
            qs = Livro.objects.all()
        elif status_aprovacao:
            qs = Livro.objects.filter(status_aprovacao=status_aprovacao)
        else:
            qs = Livro.objects.filter(status_aprovacao='aprovado')

        if busca:
            qs = qs.filter(
                Q(titulo__icontains=busca) |
                Q(autor__icontains=busca) |
                Q(sistema__icontains=busca) |
                Q(sinopse__icontains=busca) |
                Q(tags__icontains=busca) |
                Q(tipo_jogo__icontains=busca)
            )

        if sistema and sistema != 'Todos':
            qs = qs.filter(sistema__iexact=sistema)

        if tipo_jogo and tipo_jogo != 'Todos':
            qs = qs.filter(tipo_jogo__iexact=tipo_jogo)

        if tipo_link and tipo_link != 'Todos':
            qs = qs.filter(tipo_link=tipo_link)

        if categoria and categoria != 'Todos':
            qs = qs.filter(categoria__iexact=categoria)

        qs = qs.annotate(
            media_avaliacao=Avg('avaliacoes__nota'),
            total_avaliacoes=Count('avaliacoes')
        ).order_by('id')

        resultado = []
        for l in qs:
            d = l.to_dict()
            d['media_avaliacao'] = round(l.media_avaliacao, 1) if l.media_avaliacao else 5.0
            d['total_avaliacoes'] = l.total_avaliacoes
            resultado.append(d)

        return JsonResponse(resultado, safe=False)

    elif request.method == 'POST':
        # Permite criação direta via API (usado em testes ou por administradores)
        try:
            dados = json.loads(request.body.decode('utf-8')) if request.body else {}
        except Exception:
            dados = {}

        titulo = dados.get('titulo', '').strip()
        autor = dados.get('autor', '').strip()
        sistema = dados.get('sistema', '').strip()
        tipo_jogo = dados.get('tipo_jogo', 'Fantasia Medieval').strip()
        categoria = dados.get('categoria', 'Manual Principal').strip()
        sinopse = dados.get('sinopse', '').strip() or dados.get('descricao', '').strip()
        tags = dados.get('tags', '').strip()
        capa_url = dados.get('capa_url', '').strip()
        link_compra = dados.get('link_compra')
        tipo_link = dados.get('tipo_link')
        status_aprovacao = dados.get('status_aprovacao', 'aprovado')

        if not titulo or not autor or not sistema:
            return JsonResponse({"erro": "Título, autor e sistema são obrigatórios."}, status=400)

        livro = Livro.objects.create(
            titulo=titulo,
            autor=autor,
            sistema=sistema,
            tipo_jogo=tipo_jogo,
            categoria=categoria,
            sinopse=sinopse,
            tags=tags,
            capa_url=capa_url,
            link_compra=link_compra,
            tipo_link=tipo_link,
            status_aprovacao=status_aprovacao
        )

        return JsonResponse({
            "mensagem": "Livro cadastrado com sucesso!",
            "id": livro.id,
            "livro": livro.to_dict()
        }, status=201)

    return JsonResponse({"erro": "Método não permitido"}, status=405)


def livro_detail(request, livro_id):
    """Retorna detalhes de um grimório específico e suas avaliações."""
    livro = Livro.objects.filter(id=livro_id).first()
    if not livro:
        return JsonResponse({"erro": "Grimório não encontrado."}, status=404)
    return JsonResponse(livro.to_dict(include_avaliacoes=True))


@csrf_exempt
def livro_avaliar(request, livro_id):
    """Envia uma avaliação de 1 a 5 estrelas para um grimório."""
    if request.method != 'POST':
        return JsonResponse({"erro": "Método não permitido"}, status=405)

    livro = Livro.objects.filter(id=livro_id).first()
    if not livro:
        return JsonResponse({"erro": "Grimório não encontrado."}, status=404)

    try:
        dados = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        dados = {}

    usuario = dados.get('usuario', 'Aventureiro Anônimo').strip() or 'Aventureiro Anônimo'
    try:
        nota = int(dados.get('nota', 5))
    except (ValueError, TypeError):
        nota = 5
    nota = max(1, min(5, nota))
    comentario = dados.get('comentario', '').strip()

    avaliacao = Avaliacao.objects.create(
        livro=livro,
        usuario=usuario,
        nota=nota,
        comentario=comentario
    )

    return JsonResponse({
        "mensagem": "Avaliação enviada com sucesso!",
        "avaliacao": avaliacao.to_dict()
    }, status=201)


@csrf_exempt
def livro_download(request, livro_id):
    """Registra download / acesso ao grimório."""
    if request.method != 'POST':
        return JsonResponse({"erro": "Método não permitido"}, status=405)

    livro = Livro.objects.filter(id=livro_id).first()
    if not livro:
        return JsonResponse({"erro": "Grimório não encontrado."}, status=404)

    livro.downloads += 1
    livro.save(update_fields=['downloads'])

    return JsonResponse({
        "mensagem": "Download registrado com sucesso!",
        "downloads": livro.downloads,
        "arquivo_url": livro.arquivo_url
    })


def catalogo_completo(request):
    """Retorna grimórios agrupados por tipo de jogo e estatísticas gerais."""
    livros = Livro.objects.filter(status_aprovacao='aprovado').order_by('id')
    grupos = {}
    total_compra = 0
    total_financiamento = 0

    for l in livros:
        tipo = l.tipo_jogo or 'Outros'
        if tipo not in grupos:
            grupos[tipo] = []
        grupos[tipo].append(l.to_dict())

        if l.tipo_link == 'compra':
            total_compra += 1
        elif l.tipo_link == 'financiamento':
            total_financiamento += 1

    return JsonResponse({
        "total_livros": livros.count(),
        "total_compra": total_compra,
        "total_financiamento": total_financiamento,
        "grupos_por_tipo": grupos
    })


def tipos_jogo(request):
    """Lista todos os tipos de jogo com descrições e contagens."""
    contagens = Livro.objects.filter(status_aprovacao='aprovado').values('tipo_jogo').annotate(total=Count('id')).order_by('-total')
    
    icones_descricoes = {
        'JJRPG': {
            'icone': '⚔️🌸',
            'descricao': 'RPGs de mesa no estilo japonês e anime (como Fabula Ultima, Ryuutama e Kamigakari), focados em narrativa heróica e combates em turnos.'
        },
        'Fantasia Medieval': {
            'icone': '🐉⚔️',
            'descricao': 'Mundos clássicos de espadas, masmorras, dragões e magia ancestral (D&D 5E, Tormenta 20, Pathfinder 2E, Old Dragon e Ghanor).'
        },
        'Horror Cósmico': {
            'icone': '🐙🕯️',
            'descricao': 'Investigação sobrenatural, conspirações, loucura e horrores indescritíveis (Chamado de Cthulhu, Ordem Paranormal, Kult e Delta Green).'
        },
        'Cyberpunk': {
            'icone': '🦾🏙️',
            'descricao': 'Alta tecnologia, baixa qualidade de vida, megacorporações, implantes neurais e viagens estelares (Cyberpunk RED, Mothership, Alien e Lancer).'
        }
    }

    resultado = []
    for item in contagens:
        tj = item['tipo_jogo']
        info = icones_descricoes.get(tj, {'icone': '🎲📜', 'descricao': f'Grimórios e suplementos focados no estilo {tj}.'})
        resultado.append({
            'tipo_jogo': tj,
            'total': item['total'],
            'icone': info['icone'],
            'descricao': info['descricao']
        })

    return JsonResponse(resultado, safe=False)


# ================= SUBMISSÃO E MODERAÇÃO DE RPGs (CONTEÚDOS DE FÃS / RPG AUTORAL) =================

@csrf_exempt
def livro_submeter(request):
    """
    Submissão de arquivos de RPG e conteúdos autorais/fãs por usuários.
    Enviado para os administradores avaliarem antes de entrar no catálogo.
    """
    if request.method != 'POST':
        return JsonResponse({"erro": "Método não permitido"}, status=405)

    if request.content_type and 'multipart/form-data' in request.content_type:
        dados = request.POST
        arquivos = request.FILES
    else:
        try:
            dados = json.loads(request.body.decode('utf-8')) if request.body else {}
        except Exception:
            dados = {}
        arquivos = {}

    titulo = dados.get('titulo', '').strip()
    autor = dados.get('autor', '').strip()
    sistema = dados.get('sistema', 'Sistema Próprio').strip() or 'Sistema Próprio'
    tipo_jogo = dados.get('tipo_jogo', 'Fantasia Medieval').strip() or 'Fantasia Medieval'
    categoria = dados.get('categoria', 'RPG Autoral / Próprio').strip() or 'RPG Autoral / Próprio'
    sinopse = dados.get('sinopse', '').strip() or dados.get('descricao', '').strip()
    tags = dados.get('tags', '').strip()
    link_compra = dados.get('link_compra', '').strip() or None
    tipo_link = dados.get('tipo_link', '').strip() or None
    usuario_id = dados.get('usuario_id')
    capa_url = dados.get('capa_url', '').strip()
    arquivo_url = dados.get('arquivo_url', '').strip()

    if not titulo or not autor or not sinopse:
        return JsonResponse({"erro": "Título, autor e descrição da obra são obrigatórios."}, status=400)

    # Aceitando somente conteúdos criados por fãs ou RPG próprio / autoral
    termos_aceitos = ['fã', 'fan', 'autoral', 'próprio', 'proprio', 'homebrew', 'suplemento', 'aventura']
    if not any(t in categoria.lower() for t in termos_aceitos):
        categoria = f"{categoria} (Conteúdo de Fã)"

    usuario = None
    if usuario_id:
        usuario = Usuario.objects.filter(id=usuario_id).first()
    if not usuario:
        return JsonResponse({"erro": "Conta não encontrada. Entre em uma conta ou Crie para enviar um livro."}, status=401)

    # Salva arquivo de RPG enviado (PDF, ZIP, etc.)
    if 'arquivo' in arquivos:
        arq = arquivos['arquivo']
        nome_limpo = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', arq.name)
        nome_arquivo = f"{int(time.time())}_{nome_limpo}"
        destino = FRONTEND_DIR / 'uploads' / 'rpgs' / nome_arquivo
        destino.parent.mkdir(parents=True, exist_ok=True)
        with open(destino, 'wb+') as f:
            for chunk in arq.chunks():
                f.write(chunk)
        arquivo_url = f"../uploads/rpgs/{nome_arquivo}"

    # Salva imagem de capa se enviada
    if 'capa_arquivo' in arquivos:
        capa_file = arquivos['capa_arquivo']
        nome_capa = f"capa_{int(time.time())}_{re.sub(r'[^a-zA-Z0-9_\-\.]', '_', capa_file.name)}"
        destino_capa = FRONTEND_DIR / 'uploads' / 'capas' / nome_capa
        destino_capa.parent.mkdir(parents=True, exist_ok=True)
        with open(destino_capa, 'wb+') as f:
            for chunk in capa_file.chunks():
                f.write(chunk)
        capa_url = f"../uploads/capas/{nome_capa}"

    if not capa_url:
        capa_url = "../imagens/capas/livro_1.svg"

    livro = Livro.objects.create(
        titulo=titulo,
        autor=autor,
        sistema=sistema,
        tipo_jogo=tipo_jogo,
        categoria=categoria,
        sinopse=sinopse,
        tags=tags,
        capa_url=capa_url,
        arquivo_url=arquivo_url,
        link_compra=link_compra,
        tipo_link=tipo_link,
        status_aprovacao='pendente',
        usuario_submissao=usuario
    )

    return JsonResponse({
        "mensagem": "Seu RPG ou conteúdo de fã foi enviado com sucesso para a moderação! Os administradores analisarão seu material em breve.",
        "id": livro.id,
        "livro": livro.to_dict()
    }, status=201)


def livro_submissoes(request):
    """Lista as submissões de RPG enviadas para moderação."""
    usuario_id = request.GET.get('usuario_id')
    apenas_pendentes = request.GET.get('apenas_pendentes', '').lower() == 'true'

    qs = Livro.objects.all().order_by('-data_criacao')

    if usuario_id:
        qs = qs.filter(usuario_submissao_id=usuario_id)
    elif apenas_pendentes:
        qs = qs.filter(status_aprovacao='pendente').exclude(usuario_submissao__isnull=True)
    else:
        # Modo Administrador
        admin_id = request.GET.get('admin_id')
        if admin_id:
            adm = Usuario.objects.filter(id=admin_id).first()
            if adm and adm.eh_administrador():
                qs = qs.exclude(usuario_submissao__isnull=True)
            else:
                qs = qs.none()
        else:
            qs = qs.filter(status_aprovacao='pendente').exclude(usuario_submissao__isnull=True)

    return JsonResponse([l.to_dict() for l in qs], safe=False)


@csrf_exempt
def livro_moderar(request, livro_id):
    """Aprova ou rejeita uma submissão de RPG feita por usuário."""
    if request.method != 'POST':
        return JsonResponse({"erro": "Método não permitido"}, status=405)

    try:
        dados = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        dados = {}

    acao = dados.get('acao', '').lower()
    motivo = dados.get('motivo', '').strip()

    livro = Livro.objects.filter(id=livro_id).first()
    if not livro:
        return JsonResponse({"erro": "Submissão de RPG não encontrada."}, status=404)

    if acao == 'aprovar':
        livro.status_aprovacao = 'aprovado'
        livro.motivo_rejeicao = ''
        livro.save()
        return JsonResponse({
            "mensagem": f"O grimório '{livro.titulo}' foi APROVADO com sucesso e agora está disponível no catálogo oficial!",
            "livro": livro.to_dict()
        })
    elif acao == 'rejeitar':
        livro.status_aprovacao = 'rejeitado'
        livro.motivo_rejeicao = motivo or 'Não atende às diretrizes de conteúdo autoral ou de fã da guilda.'
        livro.save()
        return JsonResponse({
            "mensagem": f"A submissão '{livro.titulo}' foi rejeitada pelos administradores.",
            "livro": livro.to_dict()
        })
    else:
        return JsonResponse({"erro": "Ação inválida. Use 'aprovar' ou 'rejeitar'."}, status=400)


# ================= ROTAS DO FÓRUM DA TAVERNA =================

@csrf_exempt
def forum_topicos(request):
    """Lista ou cria tópicos de discussão na taverna."""
    if request.method == 'GET':
        sistema = request.GET.get('sistema', '').strip()
        busca = request.GET.get('busca', '').strip()

        qs = ForumTopico.objects.all().order_by('-data_criacao')

        if sistema and sistema != 'Todos':
            qs = qs.filter(sistema__iexact=sistema)

        if busca:
            qs = qs.filter(Q(titulo__icontains=busca) | Q(conteudo__icontains=busca) | Q(autor__icontains=busca))

        return JsonResponse([t.to_dict() for t in qs], safe=False)

    elif request.method == 'POST':
        try:
            dados = json.loads(request.body.decode('utf-8')) if request.body else {}
        except Exception:
            dados = {}

        titulo = dados.get('titulo', '').strip()
        conteudo = dados.get('conteudo', '').strip()
        autor = dados.get('autor', 'Bardo Viajante').strip() or 'Bardo Viajante'
        sistema = dados.get('sistema', 'Geral').strip() or 'Geral'

        if not titulo or not conteudo:
            return JsonResponse({"erro": "Título e conteúdo do tópico são obrigatórios."}, status=400)

        topico = ForumTopico.objects.create(
            titulo=titulo,
            conteudo=conteudo,
            autor=autor,
            sistema=sistema
        )

        return JsonResponse({
            "mensagem": "Tópico criado com sucesso!",
            "id": topico.id,
            "topico": topico.to_dict()
        }, status=201)

    return JsonResponse({"erro": "Método não permitido"}, status=405)


def forum_topico_detail(request, topico_id):
    """Retorna detalhes de um tópico e seus comentários."""
    topico = ForumTopico.objects.filter(id=topico_id).first()
    if not topico:
        return JsonResponse({"erro": "Tópico não encontrado."}, status=404)
    return JsonResponse(topico.to_dict(include_comentarios=True))


@csrf_exempt
def forum_topico_comentarios(request, topico_id):
    """Envia um comentário / avaliação com estrelas em um tópico."""
    if request.method != 'POST':
        return JsonResponse({"erro": "Método não permitido"}, status=405)

    topico = ForumTopico.objects.filter(id=topico_id).first()
    if not topico:
        return JsonResponse({"erro": "Tópico não encontrado."}, status=404)

    try:
        dados = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        dados = {}

    usuario = dados.get('usuario', 'Mochileiro').strip() or 'Mochileiro'
    texto = dados.get('texto', '').strip()
    try:
        avaliacao = int(dados.get('avaliacao', 5))
    except (ValueError, TypeError):
        avaliacao = 5
    avaliacao = max(1, min(5, avaliacao))

    if not texto:
        return JsonResponse({"erro": "O comentário não pode ser vazio."}, status=400)

    comentario = ForumComentario.objects.create(
        topico=topico,
        usuario=usuario,
        texto=texto,
        avaliacao=avaliacao
    )

    return JsonResponse({
        "mensagem": "Comentário enviado com sucesso!",
        "comentario": comentario.to_dict()
    }, status=201)

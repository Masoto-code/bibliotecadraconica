from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class Usuario(models.Model):
    nome = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    senha_hash = models.CharField(max_length=255)
    avatar = models.TextField(default='🧙‍♂️')
    bio = models.TextField(blank=True, default='')
    status_jogo = models.CharField(max_length=50, default='procurando_campanha')
    is_admin = models.BooleanField(default=False)
    reset_token = models.CharField(max_length=100, blank=True, default='')
    data_criacao = models.DateTimeField(auto_now_add=True)

    def set_senha(self, raw_password):
        self.senha_hash = make_password(raw_password)

    def check_senha(self, raw_password):
        # Suporta tanto hash do Django quanto werkzeug (pbkdf2 / scrypt / etc)
        if self.senha_hash.startswith(('pbkdf2_', 'argon2', 'bcrypt')):
            return check_password(raw_password, self.senha_hash)
        try:
            from werkzeug.security import check_password_hash
            return check_password_hash(self.senha_hash, raw_password)
        except Exception:
            return check_password(raw_password, self.senha_hash)

    def eh_administrador(self):
        return self.is_admin or self.email.lower() in ['admbiblioteca@gmail.com', 'mestre@draconica.com']

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'avatar': self.avatar,
            'bio': self.bio,
            'status_jogo': self.status_jogo,
            'is_admin': self.eh_administrador(),
            'data_criacao': self.data_criacao.strftime('%Y-%m-%d %H:%M:%S') if self.data_criacao else None
        }

    def __str__(self):
        return self.nome


class Livro(models.Model):
    STATUS_CHOICES = [
        ('pendente', 'Pendente de Moderação'),
        ('aprovado', 'Aprovado na Biblioteca'),
        ('rejeitado', 'Rejeitado'),
    ]

    titulo = models.CharField(max_length=255)
    autor = models.CharField(max_length=150)
    sistema = models.CharField(max_length=100)
    tipo_jogo = models.CharField(max_length=100, default='Fantasia Medieval')
    categoria = models.CharField(max_length=100)
    sinopse = models.TextField(blank=True, default='')
    tags = models.CharField(max_length=255, blank=True, default='')
    capa_url = models.CharField(max_length=500, blank=True, default='')
    arquivo_url = models.CharField(max_length=500, blank=True, default='')
    link_compra = models.CharField(max_length=500, null=True, blank=True)
    tipo_link = models.CharField(max_length=50, null=True, blank=True)  # 'compra', 'financiamento' ou None
    downloads = models.IntegerField(default=0)
    status_aprovacao = models.CharField(max_length=20, choices=STATUS_CHOICES, default='aprovado')
    motivo_rejeicao = models.TextField(blank=True, default='')
    usuario_submissao = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='livros_submetidos')
    data_criacao = models.DateTimeField(auto_now_add=True)

    def to_dict(self, include_avaliacoes=False):
        data = {
            'id': self.id,
            'titulo': self.titulo,
            'autor': self.autor,
            'sistema': self.sistema,
            'tipo_jogo': self.tipo_jogo,
            'categoria': self.categoria,
            'sinopse': self.sinopse,
            'tags': self.tags,
            'capa_url': self.capa_url,
            'arquivo_url': self.arquivo_url,
            'link_compra': self.link_compra,
            'tipo_link': self.tipo_link,
            'downloads': self.downloads,
            'status_aprovacao': self.status_aprovacao,
            'motivo_rejeicao': self.motivo_rejeicao,
            'usuario_submissao_id': self.usuario_submissao_id,
            'usuario_submissao_nome': self.usuario_submissao.nome if self.usuario_submissao else None,
            'data_criacao': self.data_criacao.strftime('%Y-%m-%d %H:%M:%S') if self.data_criacao else None
        }
        if include_avaliacoes:
            avals = self.avaliacoes.all().order_by('-data_criacao')
            data['avaliacoes'] = [a.to_dict() for a in avals]
            if avals.exists():
                data['media_avaliacao'] = round(sum(a.nota for a in avals) / avals.count(), 1)
            else:
                data['media_avaliacao'] = 5.0
        return data

    def __str__(self):
        return f"{self.titulo} ({self.sistema}) [{self.status_aprovacao}]"


class Avaliacao(models.Model):
    livro = models.ForeignKey(Livro, on_delete=models.CASCADE, related_name='avaliacoes')
    usuario = models.CharField(max_length=150, default='Aventureiro Anônimo')
    nota = models.IntegerField(default=5)
    comentario = models.TextField(blank=True, default='')
    data_criacao = models.DateTimeField(auto_now_add=True)

    def to_dict(self):
        return {
            'id': self.id,
            'livro_id': self.livro_id,
            'usuario': self.usuario,
            'nota': self.nota,
            'comentario': self.comentario,
            'data_criacao': self.data_criacao.strftime('%Y-%m-%d %H:%M:%S') if self.data_criacao else None
        }

    def __str__(self):
        return f"Avaliação de {self.usuario} para {self.livro.titulo} ({self.nota} estrelas)"


class ForumTopico(models.Model):
    titulo = models.CharField(max_length=255)
    autor = models.CharField(max_length=150, default='Bardo Viajante')
    sistema = models.CharField(max_length=100, default='Geral')
    conteudo = models.TextField()
    data_criacao = models.DateTimeField(auto_now_add=True)

    def to_dict(self, include_comentarios=False):
        coms = self.comentarios.all().order_by('data_criacao')
        total_coms = coms.count()
        media_aval = round(sum(c.avaliacao for c in coms) / total_coms, 1) if total_coms > 0 else 5.0
        data = {
            'id': self.id,
            'titulo': self.titulo,
            'autor': self.autor,
            'sistema': self.sistema,
            'conteudo': self.conteudo,
            'data_criacao': self.data_criacao.strftime('%Y-%m-%d %H:%M:%S') if self.data_criacao else None,
            'total_comentarios': total_coms,
            'media_avaliacao': media_aval
        }
        if include_comentarios:
            data['comentarios'] = [c.to_dict() for c in coms]
        return data

    def __str__(self):
        return self.titulo


class ForumComentario(models.Model):
    topico = models.ForeignKey(ForumTopico, on_delete=models.CASCADE, related_name='comentarios')
    usuario = models.CharField(max_length=150, default='Mochileiro')
    texto = models.TextField()
    avaliacao = models.IntegerField(default=5)
    data_criacao = models.DateTimeField(auto_now_add=True)

    def to_dict(self):
        return {
            'id': self.id,
            'topico_id': self.topico_id,
            'usuario': self.usuario,
            'texto': self.texto,
            'avaliacao': self.avaliacao,
            'data_criacao': self.data_criacao.strftime('%Y-%m-%d %H:%M:%S') if self.data_criacao else None
        }

    def __str__(self):
        return f"Comentário de {self.usuario} no tópico {self.topico_id}"

from django.contrib import admin
from .models import Usuario, Livro, Avaliacao, ForumTopico, ForumComentario

@admin.action(description='✅ Aprovar submissões selecionadas para o catálogo da guilda')
def aprovar_submissoes(modeladmin, request, queryset):
    queryset.update(status_aprovacao='aprovado', motivo_rejeicao='')

@admin.action(description='❌ Rejeitar submissões selecionadas')
def rejeitar_submissoes(modeladmin, request, queryset):
    queryset.update(status_aprovacao='rejeitado', motivo_rejeicao='Não atende às diretrizes de conteúdo autoral ou de fã.')

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'email', 'status_jogo', 'is_admin', 'data_criacao')
    search_fields = ('nome', 'email', 'bio')
    list_filter = ('status_jogo', 'is_admin')

@admin.register(Livro)
class LivroAdmin(admin.ModelAdmin):
    list_display = ('id', 'titulo', 'autor', 'sistema', 'tipo_jogo', 'categoria', 'status_aprovacao', 'usuario_submissao', 'downloads')
    search_fields = ('titulo', 'autor', 'sistema', 'sinopse')
    list_filter = ('status_aprovacao', 'sistema', 'tipo_jogo', 'categoria', 'tipo_link')
    actions = [aprovar_submissoes, rejeitar_submissoes]
    fieldsets = (
        ('Identificação da Obra', {
            'fields': ('titulo', 'autor', 'sistema', 'tipo_jogo', 'categoria', 'sinopse')
        }),
        ('Arquivos e Capa', {
            'fields': ('capa_url', 'arquivo_url', 'link_compra', 'tipo_link')
        }),
        ('Moderação de Conteúdo de Fã / RPG Próprio', {
            'fields': ('status_aprovacao', 'usuario_submissao', 'motivo_rejeicao')
        }),
        ('Estatísticas', {
            'fields': ('downloads',)
        }),
    )

@admin.register(Avaliacao)
class AvaliacaoAdmin(admin.ModelAdmin):
    list_display = ('id', 'livro', 'usuario', 'nota', 'data_criacao')
    search_fields = ('usuario', 'comentario')
    list_filter = ('nota',)

@admin.register(ForumTopico)
class ForumTopicoAdmin(admin.ModelAdmin):
    list_display = ('id', 'titulo', 'autor', 'sistema', 'data_criacao')
    search_fields = ('titulo', 'autor', 'conteudo')
    list_filter = ('sistema',)

@admin.register(ForumComentario)
class ForumComentarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'topico', 'usuario', 'avaliacao', 'data_criacao')
    search_fields = ('usuario', 'texto')
    list_filter = ('avaliacao',)

from django.contrib import admin
from django.urls import path, re_path
from biblioteca import views

urlpatterns = [
    path('admin/', admin.site.urls),

    # ================= ROTAS DE API DA BIBLIOTECA DRACÔNICA =================
    # Autenticação
    path('api/auth/register', views.auth_register, name='api_register'),
    path('api/auth/login', views.auth_login, name='api_login'),

    # Perfil e Aventureiros
    path('api/usuarios/perfil', views.usuarios_perfil, name='api_perfil'),
    path('api/usuarios/perfil/<int:user_id>', views.usuarios_perfil, name='api_perfil_id'),
    path('api/usuarios/atividades', views.usuarios_atividades, name='api_atividades'),
    path('api/usuarios', views.usuarios_list, name='api_usuarios'),

    # Grimórios / Livros
    path('api/livros', views.livros_list, name='api_livros'),
    path('api/livros/submeter', views.livro_submeter, name='api_livro_submeter'),
    path('api/livros/submissoes', views.livro_submissoes, name='api_livro_submissoes'),
    path('api/livros/<int:livro_id>/moderar', views.livro_moderar, name='api_livro_moderar'),
    path('api/livros/catalogo-completo', views.catalogo_completo, name='api_catalogo_completo'),
    path('api/livros/<int:livro_id>', views.livro_detail, name='api_livro_detail'),
    path('api/livros/<int:livro_id>/avaliar', views.livro_avaliar, name='api_livro_avaliar'),
    path('api/livros/<int:livro_id>/download', views.livro_download, name='api_livro_download'),
    path('api/tipos-jogo', views.tipos_jogo, name='api_tipos_jogo'),

    # Fórum da Taverna
    path('api/forum/topicos', views.forum_topicos, name='api_forum_topicos'),
    path('api/forum/topicos/<int:topico_id>', views.forum_topico_detail, name='api_forum_topico_detail'),
    path('api/forum/topicos/<int:topico_id>/comentarios', views.forum_topico_comentarios, name='api_forum_topico_comentarios'),

    # ================= SERVIÇO DE ARQUIVOS ESTÁTICOS / FRONTEND =================
    path('', views.serve_home, name='home'),
    re_path(r'^(?P<filename>.+)$', views.serve_frontend, name='serve_frontend'),
]

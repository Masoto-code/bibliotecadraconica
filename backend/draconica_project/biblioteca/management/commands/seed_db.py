from django.core.management.base import BaseCommand
from biblioteca.seed import run_seed

class Command(BaseCommand):
    help = 'Popula o banco de dados da Biblioteca Dracônica com dados iniciais (livros, fórum, usuários).'

    def handle(self, *args, **options):
        run_seed()
        self.stdout.write(self.style.SUCCESS('Banco de dados povoado com sucesso via Django ORM!'))

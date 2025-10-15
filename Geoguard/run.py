# Arquivo: run.py

# 1. Importa a função que cria o app de dentro da sua pasta/pacote `meu_app`
from meu_app import create_app

# 2. Cria a instância da aplicação Flask
app = create_app()

# 3. Roda o servidor de desenvolvimento apenas quando o script é executado diretamente
if __name__ == '__main__':
    app.run(debug=True)
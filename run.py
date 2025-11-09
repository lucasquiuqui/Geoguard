# Arquivo: run.py (Corrigido para Produção e Desenvolvimento)

import os  # Importe o 'os' para ler a variável PORTA
from meu_app import create_app

# 1. Cria a instância da aplicação Flask
# Gunicorn (produção) vai importar esta variável 'app'
app = create_app()

# 2. Roda o servidor de desenvolvimento apenas quando o script é executado diretamente
if __name__ == '__main__':
    
    # >>> Bloco de DEBUG movido para dentro do 'if' <<<
    # Estas configurações só serão aplicadas quando você rodar "python run.py"
    app.config.update(
        DEBUG=True,
        TEMPLATES_AUTO_RELOAD=True,
        SEND_FILE_MAX_AGE_DEFAULT=0
    )

    # Pega a porta do ambiente (para o Cloud Run) ou usa 5000 como padrão local
    port = int(os.environ.get("PORT", 5000))
    
    app.run(
        debug=True,
        use_reloader=True,
        host="0.0.0.0",  # Mudei de "127.0.0.1" para "0.0.0.0"
        port=port
    )
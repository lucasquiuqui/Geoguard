# Arquivo: meu_app/__init__.py

from flask import Flask

def create_app():
    app = Flask(__name__)

    # Importa o nosso Blueprint do arquivo de rotas
    from .routes import main_bp
    
    # Registra o Blueprint na aplicação principal
    app.register_blueprint(main_bp)

    return app
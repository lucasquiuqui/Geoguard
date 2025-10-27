from flask import Flask

def create_app():
    app = Flask(__name__)
    
    # Configurações
    app.config['SECRET_KEY'] = 'sua-chave-secreta-aqui'
    
    # Registrar Blueprints
    from meu_app.routes import main_bp
    app.register_blueprint(main_bp)
    
    return app
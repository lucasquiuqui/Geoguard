from flask import Flask, render_template

# 1. Cria a aplicação Flask
app = Flask(__name__)

# 2. Define a rota para a página inicial ('/')
@app.route('/')
def home():
    # 3. Diz ao Flask para renderizar o seu arquivo HTML
    return render_template('index.html')

# (Opcional, mas bom para debug) Permite rodar com 'python app.py'
if __name__ == '__main__':
    app.run(debug=True)
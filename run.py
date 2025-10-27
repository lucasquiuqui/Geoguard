# Arquivo: run.py

# 1. Importa a função que cria o app de dentro da sua pasta/pacote `meu_app`
from meu_app import create_app

# 2. Cria a instância da aplicação Flask
app = create_app()

# >>> ITEM A (desenvolvimento com auto-reload e cache desligado) <<<
app.config.update(
    DEBUG=True,                    # modo debug
    TEMPLATES_AUTO_RELOAD=True,    # recarrega templates ao salvar
    SEND_FILE_MAX_AGE_DEFAULT=0    # evita cache de CSS/JS/imagens em dev
)

# 3. Roda o servidor de desenvolvimento apenas quando o script é executado diretamente
if __name__ == '__main__':
    app.run(
        debug=True,
        use_reloader=True,         # reinicia o servidor ao salvar arquivos .py
        host="127.0.0.1",          # use "0.0.0.0" se quiser acessar de outro dispositivo
        port=5000
    )

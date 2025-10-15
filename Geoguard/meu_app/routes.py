# Arquivo: meu_app/routes.py

from flask import Blueprint, render_template, send_file, current_app
import rasterio
import numpy as np
from matplotlib.colors import LinearSegmentedColormap, Normalize
from PIL import Image
import io
import os

main_bp = Blueprint('main', __name__)

# --- PÁGINAS PRINCIPAIS ---

@main_bp.route('/')
def home():
    return render_template('index.html')

@main_bp.route('/sobre')
def sobre():
    return render_template('sobre.html', title='Sobre')

@main_bp.route('/relatorios')
def relatorios():
    return render_template('relatorios.html', title='Relatórios')

@main_bp.route('/contato')
def contato():
    return render_template('contato.html', title='Contato')

@main_bp.route('/monitoramento')
def monitor_page():
    return render_template('monitor.html', title='Monitoramento Interativo')

# --- ROTAS DA API DO MAPA ---

# CORREÇÃO APLICADA AQUI: Adicionamos a pasta 'images/' ao caminho
GEOTIFF_FILENAME = 'images/img2.tif' 

@main_bp.route('/tile/amazonia.png')
def generate_tile():
    try:
        geotiff_path = os.path.join(current_app.static_folder, GEOTIFF_FILENAME)
        with rasterio.open(geotiff_path) as src:
            band1 = src.read(1)
            nodata_value = src.nodata
            mask = (band1 == nodata_value)
            cmap = LinearSegmentedColormap.from_list("gradiente_suave", ["black", "white"])
            norm = Normalize(vmin=0, vmax=1)
            colored_data = (cmap(norm(band1)) * 255).astype(np.uint8)
            colored_data[mask] = [0, 0, 0, 0]
            img = Image.fromarray(colored_data, 'RGBA')
            img_io = io.BytesIO()
            img.save(img_io, 'PNG')
            img_io.seek(0)
            return send_file(img_io, mimetype='image/png')
    except Exception as e:
        print(f"Erro ao gerar o tile: {e}")
        return "Erro ao gerar a imagem", 500

@main_bp.route('/bounds')
def get_bounds():
    try:
        geotiff_path = os.path.join(current_app.static_folder, GEOTIFF_FILENAME)
        with rasterio.open(geotiff_path) as src:
            bounds = src.bounds
            return {
                "extent": [bounds.left, bounds.bottom, bounds.right, bounds.top],
                "projection": str(src.crs)
            }
    except Exception as e:
        print(f"Erro ao ler os limites: {e}")
        return f"Erro ao ler os limites do arquivo: {e}", 500
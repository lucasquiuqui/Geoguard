# Arquivo: meu_app/routes.py

from flask import Blueprint, render_template, send_file, current_app, jsonify, abort
import rasterio
import numpy as np
from matplotlib.colors import LinearSegmentedColormap, Normalize
from PIL import Image
import io
import os
import glob

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

# --- CONFIGURAÇÃO PARA MÚLTIPLAS IMAGENS ---
# ALTERAÇÃO: GeoTIFs está dentro de static/images
GEOTIFF_FOLDER_NAME = 'images/GeoTIFs'

def get_available_tiffs():
    """Encontra todos os arquivos .tif e .tiff na pasta static/images/GeoTIFs"""
    # ALTERAÇÃO: Busca na pasta static/images/GeoTIFs
    geotiff_folder = os.path.join(current_app.static_folder, 'images', 'GeoTIFs')
    
    # Verifica se a pasta existe
    if not os.path.exists(geotiff_folder):
        print(f"Aviso: Pasta {geotiff_folder} não encontrada")
        return []
    
    search_path = os.path.join(geotiff_folder, '*.tif*')
    tiff_files = [os.path.basename(f) for f in glob.glob(search_path)]
    print(f"Arquivos TIF encontrados em {geotiff_folder}: {tiff_files}")
    return tiff_files

def get_geotiff_path(filename):
    """Retorna o caminho completo para um arquivo GeoTIFF"""
    # ALTERAÇÃO: Caminho para static/images/GeoTIFs
    return os.path.join(current_app.static_folder, 'images', 'GeoTIFs', filename)

# --- ROTAS DA API DO MAPA (COMPATÍVEIS COM VERSÃO ANTIGA) ---

@main_bp.route('/bounds')
def get_bounds():
    """Rota legada - retorna bounds da primeira imagem TIF encontrada"""
    try:
        tiffs = get_available_tiffs()
        if not tiffs:
            return jsonify({"error": "Nenhum arquivo TIF encontrado em static/images/GeoTIFs"}), 404
            
        first_image = tiffs[0]
        geotiff_path = get_geotiff_path(first_image)
        
        with rasterio.open(geotiff_path) as src:
            bounds = src.bounds
            return jsonify({
                "extent": [bounds.left, bounds.bottom, bounds.right, bounds.top],
                "projection": str(src.crs)
            })
    except Exception as e:
        print(f"Erro ao ler os limites: {e}")
        return jsonify({"error": f"Erro ao ler os limites do arquivo: {e}"}), 500

@main_bp.route('/tile/amazonia.png')
def generate_tile():
    """Rota legada - gera tile da primeira imagem TIF encontrada"""
    try:
        tiffs = get_available_tiffs()
        if not tiffs:
            return "Nenhum arquivo TIF encontrado em static/images/GeoTIFs", 404
            
        first_image = tiffs[0]
        geotiff_path = get_geotiff_path(first_image)
        
        with rasterio.open(geotiff_path) as src:
            band1 = src.read(1)
            nodata_value = src.nodata
            mask = (band1 == nodata_value) if nodata_value is not None else np.zeros(band1.shape, dtype=bool)
            
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

# --- NOVAS ROTAS PARA MÚLTIPLAS IMAGENS ---

@main_bp.route('/images')
def list_images():
    """Nova rota para listar todos os GeoTIFFs disponíveis em static/images/GeoTIFs"""
    tiffs = get_available_tiffs()
    return jsonify(tiffs)

@main_bp.route('/tile/<string:filename>')
def generate_tile_by_filename(filename):
    """Gera tile para um arquivo específico de static/images/GeoTIFs"""
    try:
        available_tiffs = get_available_tiffs()
        if filename not in available_tiffs:
            abort(404, description=f"Arquivo {filename} não encontrado em static/images/GeoTIFs")

        geotiff_path = get_geotiff_path(filename)
        
        with rasterio.open(geotiff_path) as src:
            band1 = src.read(1)
            nodata_value = src.nodata
            
            # Cria máscara para valores NoData
            if nodata_value is not None:
                mask = (band1 == nodata_value)
            else:
                mask = np.zeros(band1.shape, dtype=bool)
            
            # Colormap para monitoramento ambiental
            cmap = LinearSegmentedColormap.from_list("amazon_gradient", 
                                                   ["darkgreen", "yellow", "red"])
            
            # Normaliza os dados válidos
            valid_mask = ~mask
            if np.any(valid_mask):
                valid_data = band1[valid_mask]
                vmin, vmax = np.nanmin(valid_data), np.nanmax(valid_data)
            else:
                vmin, vmax = 0, 1
                
            norm = Normalize(vmin=vmin, vmax=vmax)
            
            colored_data = (cmap(norm(band1)) * 255).astype(np.uint8)
            colored_data[mask] = [0, 0, 0, 0]  # Transparente para NoData

            img = Image.fromarray(colored_data, 'RGBA')
            img_io = io.BytesIO()
            img.save(img_io, 'PNG')
            img_io.seek(0)
            return send_file(img_io, mimetype='image/png')

    except Exception as e:
        print(f"Erro ao gerar o tile para {filename}: {e}")
        return f"Erro ao gerar a imagem: {e}", 500

@main_bp.route('/bounds/<string:filename>')
def get_bounds_by_filename(filename):
    """Retorna bounds para um arquivo específico de static/images/GeoTIFs"""
    try:
        available_tiffs = get_available_tiffs()
        if filename not in available_tiffs:
            abort(404, description=f"Arquivo {filename} não encontrado em static/images/GeoTIFs")

        geotiff_path = get_geotiff_path(filename)
        
        with rasterio.open(geotiff_path) as src:
            bounds = src.bounds
            
            # Obtém a projeção de forma mais robusta
            try:
                epsg_code = src.crs.to_epsg()
                projection = f"EPSG:{epsg_code}" if epsg_code else str(src.crs)
            except:
                projection = str(src.crs)

            return jsonify({
                "extent": [bounds.left, bounds.bottom, bounds.right, bounds.top],
                "projection": projection
            })
    except Exception as e:
        print(f"Erro ao ler os limites para {filename}: {e}")
        return jsonify({"error": f"Erro ao ler os limites do arquivo: {e}"}), 500
# Arquivo: meu_app/routes.py (Atualizado com Geração de Legenda Gradiente)

from flask import Blueprint, render_template, send_file, current_app, jsonify, abort
import rasterio
import numpy as np
from matplotlib.colors import LinearSegmentedColormap, Normalize
from PIL import Image, ImageDraw, ImageFont # Importa ImageDraw e ImageFont
import io
import os
import glob
import matplotlib.cm as cm # Importa matplotlib.cm para cores
import matplotlib.pyplot as plt # Importa pyplot para gerar a barra de cores


main_bp = Blueprint('main', __name__)

# =====================================================================
# MAPA DE NOMES AMIGÁVEIS
# =====================================================================
FRIENDLY_NAMES_MAP = {
    "prediction1.tif": "Quinzena 1 - Jan/2022",
    "prediction2.tif": "Quinzena 2 - Jan/2022",
    "prediction3.tif": "Quinzena 1 - Fev/2022",
    "prediction4.tif": "Quinzena 2 - Fev/2022",
    "prediction5.tif": "Quinzena 1 - Mar/2022",
    "prediction6.tif": "Quinzena 2 - Mar/2022", 
    "prediction7.tif": "Quinzena 1 - Abr/2022", 
    "prediction8.tif": "Quinzena 2 - Abr/2022", 
    "prediction9.tif": "Quinzena 1 - Mai/2022", 
}
# =====================================================================


# --- CONFIGURAÇÃO E FUNÇÕES AUXILIARES ---

GEOTIFF_FOLDER_NAME = 'images/GeoTIFs'

def get_available_tiffs():
    """Encontra todos os arquivos .tif e .tiff na pasta static/images/GeoTIFs"""
    geotiff_folder = os.path.join(current_app.static_folder, 'images', 'GeoTIFs')
    if not os.path.exists(geotiff_folder):
        print(f"Aviso: Pasta {geotiff_folder} não encontrada")
        return []
    search_path = os.path.join(geotiff_folder, '*.tif*')
    tiff_files = [os.path.basename(f) for f in glob.glob(search_path)]
    return tiff_files

def get_geotiff_path(filename):
    """Retorna o caminho completo para um arquivo GeoTIFF"""
    return os.path.join(current_app.static_folder, 'images', 'GeoTIFs', filename)

# =====================================================================
# FUNÇÃO 'calculate_statistics' ATUALIZADA (COM RISCO BAIXO)
# =====================================================================
def calculate_statistics(geotiff_path):
    """
    Abre um GeoTIFF e calcula a porcentagem de área de risco Alto, Médio e Baixo.
    
    DEFINIÇÕES (conforme solicitado):
    - Alto Risco:   > 0.75
    - Médio Risco:  > 0.5 E <= 0.75
    - Baixo Risco:  >= 0.0 E <= 0.5
    
    VOCÊ PODE AJUSTAR OS VALORES DE 'HIGH_RISK_THRESHOLD' E 'MEDIUM_RISK_THRESHOLD'.
    """
    try:
        with rasterio.open(geotiff_path) as src:
            band1 = src.read(1)
            nodata_value = src.nodata
            
            if nodata_value is not None:
                valid_mask = (band1 != nodata_value)
            else:
                valid_mask = np.ones(band1.shape, dtype=bool)
                
            valid_data = band1[valid_mask]
            
            if valid_data.size == 0:
                # Retorna todas as estatísticas como 0 se não houver dados válidos
                return {
                    "high_risk_percentage": 0, 
                    "medium_risk_percentage": 0, 
                    "low_risk_percentage": 0
                }

            # --- AJUSTE OS LIMITES CONFORME NECESSÁRIO ---
            HIGH_RISK_THRESHOLD = 0.75  # Acima deste valor é "Alto Risco"
            MEDIUM_RISK_THRESHOLD = 0.5 # Acima deste valor (e <= Alto) é "Médio Risco"
            # --- FIM DOS AJUSTES ---

            total_valid_pixels = valid_data.size

            # Cálculo Risco Alto
            high_risk_pixels = np.count_nonzero(valid_data > HIGH_RISK_THRESHOLD)
            high_percentage = (high_risk_pixels / total_valid_pixels) * 100
            
            # Cálculo Risco Médio (entre 0.5 e 0.75)
            medium_risk_pixels = np.count_nonzero(
                (valid_data > MEDIUM_RISK_THRESHOLD) & (valid_data <= HIGH_RISK_THRESHOLD)
            )
            medium_percentage = (medium_risk_pixels / total_valid_pixels) * 100
            
            # Cálculo Risco Baixo (entre 0.0 e 0.5)
            low_risk_pixels = np.count_nonzero(
                (valid_data >= 0) & (valid_data <= MEDIUM_RISK_THRESHOLD)
            )
            low_percentage = (low_risk_pixels / total_valid_pixels) * 100
            
            # Retorna todas as três estatísticas
            return {
                "high_risk_percentage": round(high_percentage, 2),
                "medium_risk_percentage": round(medium_percentage, 2),
                "low_risk_percentage": round(low_percentage, 2)
            }

    except Exception as e:
        print(f"Erro ao calcular estatísticas para {geotiff_path}: {e}")
        # Retorna N/A para todas em caso de erro
        return {
            "high_risk_percentage": "N/A", 
            "medium_risk_percentage": "N/A", 
            "low_risk_percentage": "N/A"
        }
# =====================================================================
# FIM DA SEÇÃO ATUALIZADA
# =====================================================================

# =====================================================================
# NOVO: GERAÇÃO DA IMAGEM DA LEGENDA
# =====================================================================
@main_bp.route('/generate_legend_image')
def generate_legend_image():
    try:
        # Define o colormap EXATAMENTE como no generate_tile_by_filename
        # Verde para baixo risco, Amarelo para moderado, Vermelho para alto
        colors = ["darkgreen", "yellow", "red"]
        cmap = LinearSegmentedColormap.from_list("risk_gradient", colors)

        # Configurações da imagem da legenda
        width, height = 120, 300 # Largura e altura da imagem da legenda
        bar_width = 17 # Largura da barra de gradiente
        text_offset = 8 # Espaçamento do texto em relação à barra

        # Cria uma imagem em branco
        img = Image.new('RGBA', (width, height), (0, 0, 0, 0)) # Fundo transparente
        draw = ImageDraw.Draw(img)

        # Tenta carregar uma fonte TTF. Se falhar, usa a fonte padrão.
        try:
            # Caminho relativo à pasta static. Ajuste se sua fonte estiver em outro lugar.
            font_path = os.path.join(current_app.static_folder, 'fonts', 'arial.ttf')
            font = ImageFont.truetype(font_path, 18)
        except IOError:
            print("Aviso: Fonte Arial.ttf não encontrada, usando fonte padrão.")
            font = ImageFont.load_default()

        # Desenha a barra de gradiente
        for y in range(height):
            # Normaliza a posição Y para o intervalo [0, 1]
            norm_y = 1 - (y / height) # Inverte para que o vermelho fique no topo
            color_rgba = cmap(norm_y)
            color_pil = tuple(int(c * 255) for c in color_rgba) # Converte para formato PIL

            draw.line([(0, y), (bar_width, y)], fill=color_pil, width=1)

        # Adiciona os rótulos (ajuste os valores conforme o significado do seu dado)
        # Assumindo que o mapa de calor vai de 0 (verde) a 1 (vermelho)
        draw.text((bar_width + text_offset, 0), "Alto Risco", font=font, fill=(255, 255, 255, 255)) # Branco para contraste
        draw.text((bar_width + text_offset, height // 2 - 10), "Moderado", font=font, fill=(255, 255, 255, 255))
        draw.text((bar_width + text_offset, height - 20), "Baixo Risco", font=font, fill=(255, 255, 255, 255))
        
        # Opcional: Adicionar um título à legenda
        title_font = ImageFont.truetype(font_path, 14) if 'font_path' in locals() else ImageFont.load_default()
        draw.text((0, -20), "Nível de Risco", font=title_font, fill=(255, 255, 255, 255))


        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        return send_file(img_io, mimetype='image/png')
    except Exception as e:
        print(f"Erro ao gerar imagem da legenda: {e}")
        abort(500, description="Erro ao gerar imagem da legenda.")
# =====================================================================


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

@main_bp.route('/bounds')
def get_bounds():
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
        print(f"Erro ao ler os limites (legado): {e}")
        return jsonify({"error": f"Erro ao ler os limites do arquivo: {e}"}), 500

@main_bp.route('/tile/amazonia.png')
def generate_tile():
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
            
            # Use o mesmo colormap verde-amarelo-vermelho
            cmap = LinearSegmentedColormap.from_list("risk_gradient", ["darkgreen", "yellow", "red"])
            norm = Normalize(vmin=0, vmax=1) # Ajuste vmin/vmax se seus dados não forem de 0 a 1
            colored_data = (cmap(norm(band1)) * 255).astype(np.uint8)
            colored_data[mask] = [0, 0, 0, 0]
            
            img = Image.fromarray(colored_data, 'RGBA')
            img_io = io.BytesIO()
            img.save(img_io, 'PNG')
            img_io.seek(0)
            return send_file(img_io, mimetype='image/png')
    except Exception as e:
        print(f"Erro ao gerar o tile (legado): {e}")
        return "Erro ao gerar a imagem", 500


@main_bp.route('/images')
def list_images():
    """Retorna todos os GeoTIFFs disponíveis com nomes amigáveis e estatísticas."""
    
    available_tiffs_set = set(get_available_tiffs()) 
    image_data = []
    
    print("Calculando estatísticas para as camadas...")
    
    for filename, friendly_name in FRIENDLY_NAMES_MAP.items():
        if filename in available_tiffs_set:
            geotiff_path = get_geotiff_path(filename)
            stats = calculate_statistics(geotiff_path) 
            
            image_data.append({
                "filename": filename,
                "name": friendly_name,
                "stats": stats 
            })
        else:
            print(f"Aviso: Arquivo '{filename}' definido no MAPA mas não encontrado em /static/images/GeoTIFs/")
            
    print("Cálculo de estatísticas concluído.")
    return jsonify(image_data)


@main_bp.route('/tile/<string:filename>')
def generate_tile_by_filename(filename):
    """Gera tile para um arquivo específico de static/images/GeoTIFs."""
    try:
        available_tiffs = get_available_tiffs()
        if filename not in available_tiffs:
            abort(404, description=f"Arquivo {filename} não encontrado em static/images/GeoTIFs")

        geotiff_path = get_geotiff_path(filename)
        
        with rasterio.open(geotiff_path) as src:
            band1 = src.read(1)
            nodata_value = src.nodata
            
            if nodata_value is not None:
                mask = (band1 == nodata_value)
            else:
                mask = np.zeros(band1.shape, dtype=bool)
            
            # Use o mesmo colormap verde-amarelo-vermelho
            cmap = LinearSegmentedColormap.from_list("risk_gradient", 
                                                    ["darkgreen", "yellow", "red"])
            
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
    """Retorna bounds para um arquivo específico de static/images/GeoTIFs."""
    try:
        available_tiffs = get_available_tiffs()
        if filename not in available_tiffs:
            abort(404, description=f"Arquivo {filename} não encontrado em static/images/GeoTIFs")

        geotiff_path = get_geotiff_path(filename)
        
        with rasterio.open(geotiff_path) as src:
            bounds = src.bounds
            
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
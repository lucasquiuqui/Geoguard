// Arquivo: meu_app/static/js/map_loader.js

let map;
let currentImageLayer;

async function createMap() {
    try {
        // Primeiro, busca a lista de imagens disponíveis
        const imagesResponse = await fetch('/images');
        if (!imagesResponse.ok) {
            throw new Error('Falha ao buscar lista de imagens');
        }
        
        const imageList = await imagesResponse.json();
        console.log('Imagens TIF encontradas:', imageList);
        
        if (imageList.length === 0) {
            throw new Error('Nenhuma imagem TIF encontrada na pasta static/images/GeoTIFs');
        }

        // Filtra apenas arquivos TIF
        const tifImages = imageList.filter(img => 
            img.toLowerCase().endsWith('.tif') || 
            img.toLowerCase().endsWith('.tiff')
        );
        
        if (tifImages.length === 0) {
            throw new Error('Nenhum arquivo .tif ou .tiff encontrado na pasta static/images/GeoTIFs');
        }

        console.log('Arquivos TIF filtrados:', tifImages);

        // Adiciona controle de seletor de imagens PRIMEIRO
        addImageSelector(tifImages); // <--- ESTA FUNÇÃO SERÁ SUBSTITUÍDA

        // Usa a primeira imagem TIF da lista
        const firstImage = tifImages[0];
        
        // Busca os bounds da imagem selecionada
        const boundsResponse = await fetch(`/bounds/${firstImage}`);
        if (!boundsResponse.ok) {
            // Fallback para rota legada
            console.log('Tentando rota legada /bounds...');
            const legacyBoundsResponse = await fetch('/bounds');
            if (!legacyBoundsResponse.ok) {
                throw new Error('Falha ao buscar os limites da imagem');
            }
            const legacyData = await legacyBoundsResponse.json();
            await loadImageWithData(firstImage, legacyData);
        } else {
            const data = await boundsResponse.json();
            await loadImageWithData(firstImage, data);
        }

    } catch (error) {
        console.error("Erro ao criar o mapa:", error);
        showError(error.message);
    }
}

async function loadImageWithData(imageFilename, data) {
    try {
        const imageBounds = data.extent;
        const imageProjection = data.projection;

        console.log('Bounds da imagem:', imageBounds);
        console.log('Projeção:', imageProjection);

        // Remove layer anterior se existir
        if (currentImageLayer) {
            map.removeLayer(currentImageLayer);
        }

        // Cria camada base (se o mapa ainda não existe)
        if (!map) {
            const baseLayer = new ol.layer.Tile({
                source: new ol.source.OSM()
            });

            // Cria o mapa (versão simplificada - sem controles problemáticos)
            map = new ol.Map({
                target: 'map',
                layers: [baseLayer],
                view: new ol.View({
                    projection: 'EPSG:3857',
                    center: [0, 0],
                    zoom: 2
                })
            });
        }

        // Cria camada da imagem
        currentImageLayer = new ol.layer.Image({
            source: new ol.source.ImageStatic({
                url: `/tile/${imageFilename}`,
                projection: imageProjection,
                imageExtent: imageBounds,
            }),
            opacity: 0.8
        });

        map.addLayer(currentImageLayer);

        // Atualiza a view para a nova imagem
        const transformedExtent = ol.proj.transformExtent(
            imageBounds, 
            imageProjection, 
            'EPSG:3857'
        );
        
        map.getView().fit(transformedExtent, {
            padding: [50, 50, 50, 50],
            duration: 1000
        });

        // Atualiza a informação da imagem selecionada
        updateSelectedImageInfo(imageFilename);

        console.log(`Imagem ${imageFilename} carregada com sucesso`);

    } catch (error) {
        console.error("Erro ao carregar imagem com dados:", error);
        throw error;
    }
}

async function updateImageLayer(imageFilename) {
    if (!map || !imageFilename) return;

    try {
        console.log('Carregando imagem:', imageFilename);
        
        // Remove layer anterior se existir
        if (currentImageLayer) {
            map.removeLayer(currentImageLayer);
        }

        // Busca bounds da nova imagem
        const boundsResponse = await fetch(`/bounds/${imageFilename}`);
        if (!boundsResponse.ok) {
            throw new Error('Falha ao buscar limites da imagem');
        }

        const data = await boundsResponse.json();
        const imageBounds = data.extent;
        const imageProjection = data.projection;

        console.log('Novos bounds:', imageBounds);

        // Cria nova layer
        currentImageLayer = new ol.layer.Image({
            source: new ol.source.ImageStatic({
                url: `/tile/${imageFilename}`,
                projection: imageProjection,
                imageExtent: imageBounds,
            }),
            opacity: 0.8
        });

        map.addLayer(currentImageLayer);

        // Atualiza a view para a nova imagem
        const transformedExtent = ol.proj.transformExtent(
            imageBounds, 
            imageProjection, 
            'EPSG:3857'
        );
        
        map.getView().fit(transformedExtent, {
            padding: [50, 50, 50, 50],
            duration: 1000
        });

        // Atualiza a informação da imagem selecionada
        updateSelectedImageInfo(imageFilename);

        console.log(`Imagem ${imageFilename} atualizada com sucesso`);

    } catch (error) {
        console.error("Erro ao atualizar imagem:", error);
        showAlert(`Erro ao carregar a imagem: ${error.message}`);
    }
}

// ===================================================================
// INÍCIO DA FUNÇÃO CORRIGIDA
// ===================================================================
function addImageSelector(imageList) {
    // Remove o painel antigo que estava no HTML (ex: o <aside> em index.html)
    const existingSelector = document.getElementById('image-controls-container');
    if (existingSelector) {
        existingSelector.remove();
    }

    // Cria container principal para controles - A BARRA SUPERIOR
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'layer-controls-bar';
    controlsContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap; 
        align-items: center;
        gap: 15px; 
        padding: 10px 20px;
        background: #0f2619; 
        border-bottom: 1px solid rgba(255, 255, 255, .1);
        width: 100%;
        color: #eefcf3; 
        font-family: 'Poppins', sans-serif;
        z-index: 900; 
        border-radius: var(--radius); /* Adiciona bordas arredondadas */
        margin-bottom: 20px; /* Adiciona espaço abaixo da barra */
        box-shadow: var(--shadow); /* Adiciona a sombra do seu tema */
        border-top: 1px solid rgba(255, 255, 255, .1); /* Consistência visual */
    `;

    // Título da seção
    const title = document.createElement('div');
    title.style.cssText = `
        font-size: 16px;
        font-weight: 600;
        color: #eefcf3;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    title.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        Controle de Camadas
    `;

    // Container do seletor
    const selectorGroup = document.createElement('div');
    selectorGroup.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const label = document.createElement('label');
    label.textContent = 'Selecionar Camada:';
    label.style.cssText = `
        font-size: 14px;
        font-weight: 500;
        color: #cde8d8; 
    `;

    const select = document.createElement('select');
    select.id = 'image-selector';
    select.style.cssText = `
        padding: 6px 10px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, .14);
        background: #0a2012; 
        font-size: 14px;
        color: #eefcf3;
        cursor: pointer;
    `;

    select.innerHTML = imageList.map(img => 
        `<option value="${img}">${img}</option>`
    ).join('');

    select.addEventListener('change', (e) => {
        updateImageLayer(e.target.value);
    });

    // Informações da imagem selecionada
    const selectedInfo = document.createElement('div');
    selectedInfo.id = 'selected-image-info';
    selectedInfo.style.cssText = `
        background: #0a2012;
        border-radius: 8px;
        padding: 6px 12px;
        border-left: 4px solid #7be495; 
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    selectedInfo.innerHTML = `
        <div style="font-size: 13px; color: #cde8d8;">Camada Atual:</div>
        <div id="current-image-name" style="font-size: 14px; color: #eefcf3; font-weight: 500;"></div>
    `;

    // Monta a estrutura da barra
    selectorGroup.appendChild(label);
    selectorGroup.appendChild(select);

    controlsContainer.appendChild(title);
    controlsContainer.appendChild(selectorGroup);
    controlsContainer.appendChild(selectedInfo);
    
    // --- MUDANÇA NA INSERÇÃO ---
    // Agora, vamos inserir a barra logo antes do container do mapa.
    const mapElement = document.getElementById('map');
    
    // O elemento 'map' está dentro de um '.map-container' em ambos os HTMLs
    const mapContainer = mapElement ? mapElement.closest('.map-container') : null;
    
    // O '.map-container' está dentro de um bloco maior 
    // ('.main-container' em index.html ou '.monitor-container' em monitor.html)
    const mainMapBlock = mapContainer ? mapContainer.parentElement : null;

    if (mainMapBlock) {
        // Insere a barra de controles *ANTES* desse bloco principal do mapa
        // Isso a colocará depois do H1/H2 (título) e antes do mapa
        mainMapBlock.before(controlsContainer);
    } else if (mapElement) {
        // Fallback: se não achar a estrutura esperada, insere antes do próprio mapa
        mapElement.before(controlsContainer);
    } else {
        // Fallback 2: (Lógica antiga) insere no 'main'
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.prepend(controlsContainer);
        } else {
            document.body.prepend(controlsContainer);
        }
    }

    // --- REMOVE AJUSTE ANTIGO DO MAPA ---
    // Remove as linhas que ajustavam a margem esquerda do mapa
    if (mapElement) {
        mapElement.style.marginLeft = '0';
        mapElement.style.width = '100%';
    }

    // Atualiza a informação da primeira imagem
    updateSelectedImageInfo(imageList[0]);
}
// ===================================================================
// FIM DA FUNÇÃO CORRIGIDA
// ===================================================================


function updateSelectedImageInfo(filename) {
    const infoElement = document.getElementById('current-image-name');
    if (infoElement) {
        infoElement.textContent = filename;
    }
}

function showError(message) {
    const mapDiv = document.getElementById('map');
    if (mapDiv) {
        mapDiv.innerHTML = `
            <div style="text-align:center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 8px; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">🗺️</div>
                <h3 style="color: #dc3545; margin-bottom: 15px;">Não foi possível carregar o mapa</h3>
                <p style="margin-bottom: 10px; max-width: 400px;">${message}</p>
                <p style="font-size: 14px; color: #888; margin-bottom: 20px;">
                    Verifique se existem arquivos .tif na pasta <strong>static/images/GeoTIFs</strong>
                </p>
                <button onclick="location.reload()" style="
                    padding: 10px 20px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background 0.2s;
                " onmouseover="this.style.background='#0056b3'" onmouseout="this.style.background='#007bff'">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

function showAlert(message) {
    // Remove alertas anteriores
    const existingAlert = document.getElementById('map-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Cria novo alerta - CENTRALIZADO
    const alert = document.createElement('div');
    alert.id = 'map-alert';
    alert.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fef2f2;
        color: #dc2626;
        padding: 16px 20px;
        border-radius: 8px;
        border: 1px solid #fecaca;
        z-index: 1001;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        text-align: center;
        font-size: 14px;
    `;
    alert.textContent = message;

    const mapElement = document.getElementById('map');
    if (mapElement) {
        mapElement.appendChild(alert);
        
        // Remove o alerta após 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}

// Função para debug - verifica se o script foi carregado
console.log('map_loader.js carregado com sucesso');

// Inicializa o mapa quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando mapa...');
    if (document.getElementById('map')) {
        createMap();
    } else {
        console.error('Elemento #map não encontrado');
    }
});

// Exporta funções para uso global (se necessário)
window.createMap = createMap;
window.updateImageLayer = updateImageLayer;
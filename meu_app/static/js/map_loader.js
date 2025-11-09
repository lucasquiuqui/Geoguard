// Arquivo: meu_app/static/js/map_loader.js (Atualizado com Risco Baixo)

let map;
let currentImageLayer;
let layerDataStore = {};

async function createMap() {
    try {
        const imagesResponse = await fetch('/images');
        if (!imagesResponse.ok) {
            throw new Error('Falha ao buscar lista de imagens');
        }
        
        const imageList = await imagesResponse.json();
        console.log('Dados das camadas recebidos:', imageList);
        
        if (imageList.length === 0) {
            throw new Error('Nenhuma imagem TIF encontrada e mapeada em routes.py');
        }

        imageList.forEach(layer => {
            layerDataStore[layer.filename] = layer;
        });

        await initializeMapWithLayers(imageList);

    } catch (error) {
        console.error("Erro ao criar o mapa:", error);
        showError(error.message);
    }
}

async function initializeMapWithLayers(imageList) {
    addImageSelector(imageList);

    const firstImage = imageList[0];
    const firstImageFilename = firstImage.filename;
    const firstImageFriendlyName = firstImage.name;
    
    const boundsResponse = await fetch(`/bounds/${firstImageFilename}`);
    if (!boundsResponse.ok) {
        const legacyBoundsResponse = await fetch('/bounds');
        if (!legacyBoundsResponse.ok) {
            throw new Error('Falha ao buscar os limites da imagem');
        }
        const legacyData = await legacyBoundsResponse.json();
        await loadImageWithData(firstImageFilename, firstImageFriendlyName, legacyData);
    } else {
        const data = await boundsResponse.json();
        await loadImageWithData(firstImageFilename, firstImageFriendlyName, data);
    }

    if (map) {
        addGradientLegendToMap();
    }
}


async function loadImageWithData(imageFilename, friendlyName, data) {
    try {
        const imageBounds = data.extent;
        const imageProjection = data.projection;

        if (currentImageLayer) {
            map.removeLayer(currentImageLayer);
        }

        if (!map) {
            const baseLayer = new ol.layer.Tile({
                source: new ol.source.OSM()
            });

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

        currentImageLayer = new ol.layer.Image({
            source: new ol.source.ImageStatic({
                url: `/tile/${imageFilename}`,
                projection: imageProjection,
                imageExtent: imageBounds,
            }),
            opacity: 0.8
        });

        map.addLayer(currentImageLayer);

        const transformedExtent = ol.proj.transformExtent(
            imageBounds, 
            imageProjection, 
            'EPSG:3857'
        );
        
        map.getView().fit(transformedExtent, {
            padding: [50, 50, 50, 50],
            duration: 1000
        });

        const stats = layerDataStore[imageFilename]?.stats;
        updateSelectedImageInfo(friendlyName, stats);

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
        
        if (currentImageLayer) {
            map.removeLayer(currentImageLayer);
        }

        const boundsResponse = await fetch(`/bounds/${imageFilename}`);
        if (!boundsResponse.ok) {
            throw new Error('Falha ao buscar limites da imagem');
        }

        const data = await boundsResponse.json();
        const imageBounds = data.extent;
        const imageProjection = data.projection;

        currentImageLayer = new ol.layer.Image({
            source: new ol.source.ImageStatic({
                url: `/tile/${imageFilename}`,
                projection: imageProjection,
                imageExtent: imageBounds,
            }),
            opacity: 0.8
        });

        map.addLayer(currentImageLayer);

        const transformedExtent = ol.proj.transformExtent(
            imageBounds, 
            imageProjection, 
            'EPSG:3857'
        );
        
        map.getView().fit(transformedExtent, {
            padding: [50, 50, 50, 50],
            duration: 1000
        });

        const layerData = layerDataStore[imageFilename];
        const friendlyName = layerData?.name || imageFilename;
        const stats = layerData?.stats;
        
        updateSelectedImageInfo(friendlyName, stats);

        console.log(`Imagem ${imageFilename} atualizada com sucesso`);

    } catch (error) {
        console.error("Erro ao atualizar imagem:", error);
        showAlert(`Erro ao carregar a imagem: ${error.message}`);
    }
}

function addImageSelector(imageList) {
    const controlsContainer = document.getElementById('image-controls-container');
    const panelContent = controlsContainer ? controlsContainer.querySelector('.control-panel') : null;

    if (!panelContent) {
        console.error('Elemento .control-panel não foi encontrado.');
        if(controlsContainer) controlsContainer.innerHTML = '';
        else return; 
    } else {
        panelContent.innerHTML = '';
    }

    const destinationContainer = panelContent || controlsContainer;

    const title = document.createElement('div');
    title.className = 'control-title'; 
    title.style.cssText = `
        font-size: 18px; font-weight: 600; color: var(--text, #1f2937);
        margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
        padding-bottom: 12px; border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    `;
    title.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        Controle de Camadas
    `;

    const selectorGroup = document.createElement('div');
    selectorGroup.style.marginBottom = '16px';

    const label = document.createElement('label');
    label.textContent = 'Selecionar Camada:';
    label.style.cssText = `
        display: block; font-size: 14px; font-weight: 500;
        color: var(--muted, #374151); margin-bottom: 8px;
    `;

    const select = document.createElement('select');
    select.id = 'image-selector';
    select.style.cssText = `
        width: 100%; padding: 12px; border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: var(--bg, #FFFFFF); font-size: 14px;
        color: var(--text, #374151); cursor: pointer;
        transition: all 0.2s ease; margin-bottom: 12px;
    `;

    select.innerHTML = imageList.map(imgObject => 
        `<option value="${imgObject.filename}">${imgObject.name}</option>`
    ).join('');

    select.addEventListener('mouseenter', () => { select.style.borderColor = 'var(--brand-2, #3b82f6)'; });
    select.addEventListener('mouseleave', () => { select.style.borderColor = 'rgba(255, 255, 255, 0.2)'; });
    select.addEventListener('focus', () => { select.style.borderColor = 'var(--brand-2, #3b82f6)'; });
    select.addEventListener('blur', () => { select.style.borderColor = 'rgba(255, 255, 255, 0.2)'; });

    select.addEventListener('change', (e) => {
        updateImageLayer(e.target.value);
    });

    const selectedInfo = document.createElement('div');
    selectedInfo.id = 'selected-image-info';
    selectedInfo.style.cssText = `
        background: var(--bg2, #f8fafc); border-radius: 8px;
        padding: 16px; border-left: 4px solid var(--brand, #3b82f6);
        margin-bottom: 16px;
    `;

    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = `
        background: rgba(123, 228, 149, 0.1); border-radius: 8px;
        padding: 12px; border: 1px solid rgba(123, 228, 149, 0.2);
        margin-bottom: 16px;
    `;

    statsContainer.innerHTML = `
        <div style="font-size: 13px; color: var(--brand-2, #0369a1); font-weight: 500; margin-bottom: 6px;">📊 Estatísticas Gerais</div>
        <div style="font-size: 12px; color: var(--muted, #0c4a6e);">
            <div>• ${imageList.length} camada(s) carregada(s)</div>
            <div>• Formato: GeoTIFF</div>
            <div>• Projeção: Dinâmica</div>
        </div>
    `;

    selectorGroup.appendChild(label);
    selectorGroup.appendChild(select);

    destinationContainer.appendChild(title);
    destinationContainer.appendChild(selectorGroup);
    destinationContainer.appendChild(selectedInfo);
    destinationContainer.appendChild(statsContainer);
    
    const firstImage = imageList[0];
    updateSelectedImageInfo(firstImage.name, firstImage.stats);
}

// ==========================================================
// FUNÇÃO: ADICIONAR LEGENDA GRADIENTE AO MAPA
// (Esta é a sua versão preferida, com 56x140)
// ==========================================================
function addGradientLegendToMap() {
    const legendDiv = document.createElement('div');
    legendDiv.className = 'ol-control legend-control';
    legendDiv.style.cssText = `
        background-color: rgba(0, 0, 0, 0.6);
        padding: 7px; /* AJUSTADO: 70% de 10px */
        border-radius: 8px;
        position: absolute;
        bottom: 15px; 
        left: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        color: white;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    const legendImage = document.createElement('img');
    legendImage.src = '/generate_legend_image';
    legendImage.alt = 'Legenda de Risco';
    legendImage.style.cssText = `
        width: 56px; /* AJUSTADO: 70% de 80px */
        height: 140px; /* AJUSTADO: 70% de 200px */
        object-fit: contain;
        margin-bottom: 5px;
        filter: drop-shadow(0px 0px 2px rgba(0,0,0,0.5));
    `;
    legendDiv.appendChild(legendImage);

    const legendControl = new ol.control.Control({
        element: legendDiv
    });

    map.addControl(legendControl);
}
// ==========================================================


// ==========================================================
// FUNÇÃO: ATUALIZAR INFO - CORRIGIDA
// (Exibe Risco Alto, Médio e Baixo)
// ==========================================================
function updateSelectedImageInfo(displayName, stats) {
    const infoElement = document.getElementById('selected-image-info');
    if (!infoElement) return;

    let highRiskText = "Calculando...";
    let mediumRiskText = "Calculando...";
    let lowRiskText = "Calculando..."; // NOVO

    if (stats) {
        // Lógica para Risco Alto
        if (stats.high_risk_percentage === "N/A") {
            highRiskText = "Erro no cálculo (Alto)";
        } else if (stats.high_risk_percentage !== undefined) {
            highRiskText = `${stats.high_risk_percentage}% de Risco Alto`;
        } else {
            highRiskText = "Estatística (Alto) N/D";
        }

        // Lógica para Risco Médio
        if (stats.medium_risk_percentage === "N/A") {
            mediumRiskText = "Erro no cálculo (Médio)";
        } else if (stats.medium_risk_percentage !== undefined) {
            mediumRiskText = `${stats.medium_risk_percentage}% de Risco Médio`;
        } else {
            mediumRiskText = "Estatística (Médio) N/D";
        }
        
        // Lógica para Risco Baixo (NOVO)
        if (stats.low_risk_percentage === "N/A") {
            lowRiskText = "Erro no cálculo (Baixo)";
        } else if (stats.low_risk_percentage !== undefined) {
            lowRiskText = `${stats.low_risk_percentage}% de Risco Baixo`;
        } else {
            lowRiskText = "Estatística (Baixo) N/D";
        }
        
    } else {
         highRiskText = "Estatísticas não disponíveis";
         mediumRiskText = ""; 
         lowRiskText = ""; // NOVO
    }


    infoElement.innerHTML = `
        <div style="font-size: 13px; color: var(--muted, #6b7280); margin-bottom: 4px;">Camada Atual:</div>
        <div id="current-image-name" style="font-size: 16px; color: var(--text, #1f2937); font-weight: 600; word-break: break-word; margin-bottom: 8px;">
            ${displayName}
        </div>
        
        <div style="font-size: 14px; color: #dc3545; font-weight: 500;">
            ${highRiskText}
        </div>

        <div style="font-size: 14px; color: #EAB308; font-weight: 500; margin-top: 4px;">
            ${mediumRiskText}
        </div>

        <div style="font-size: 14px; color: #22c55e; font-weight: 500; margin-top: 4px;">
            ${lowRiskText}
        </div>
    `;
}
// ==========================================================


function showError(message) {
    const mapDiv = document.getElementById('map');
    if (mapDiv) {
        mapDiv.innerHTML = `
            <div style="text-align:center; padding: 40px; color: var(--muted, #666); background: var(--panel, #f8f9fa); border-radius: 12px; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">🗺️</div>
                <h3 style="color: #dc3545; margin-bottom: 15px;">Não foi possível carregar o mapa</h3>
                <p style="margin-bottom: 10px; max-width: 400px;">${message}</p>
                <p style="font-size: 14px; color: var(--muted, #888); margin-bottom: 20px;">
                    Verifique o mapa <strong>FRIENDLY_NAMES_MAP</strong> em <strong>routes.py</strong> e a pasta <strong>static/images/GeoTIFs</strong>
                </p>
                <button onclick="location.reload()" style="
                            padding: 10px 20px; background: var(--brand, #007bff); color: white;
                            border: none; border-radius: 6px; cursor: pointer;
                            font-weight: 500; transition: background 0.2s;
                " onmouseover="this.style.background='var(--brand-2, #0056b3)'" onmouseout="this.style.background='var(--brand, #007bff)'">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

function showAlert(message) {
    const existingAlert = document.getElementById('map-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    const alert = document.createElement('div');
    alert.id = 'map-alert';
    alert.style.cssText = `
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: #fef2f2; color: #dc2626;
        padding: 16px 20px; border-radius: 8px; border: 1px solid #fecaca;
        z-index: 1001; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px; text-align: center; font-size: 14px;
    `;
    alert.textContent = message;
    const mapElement = document.getElementById('map');
    if (mapElement) {
        mapElement.appendChild(alert);
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando mapa...');
    if (document.getElementById('map')) {
        createMap();
    } else {
        console.error('Elemento #map não encontrado');
    }
});

window.createMap = createMap;
window.updateImageLayer = updateImageLayer;
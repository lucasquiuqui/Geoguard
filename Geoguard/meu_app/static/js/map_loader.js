// Arquivo: meu_app/static/js/map_loader.js

async function createMap() {
    try {
        const response = await fetch('/bounds');
        if (!response.ok) {
            throw new Error(`Falha ao buscar os limites: ${response.statusText}`);
        }
        const data = await response.json();
        
        const imageBounds = data.extent;
        const imageProjection = data.projection;

        const baseLayer = new ol.layer.Tile({
            source: new ol.source.OSM()
        });

        const imageLayer = new ol.layer.Image({
            source: new ol.source.ImageStatic({
                url: '/tile/amazonia.png',
                projection: imageProjection,
                imageExtent: imageBounds,
            }),
            opacity: 0.7
        });

        const map = new ol.Map({
            target: 'map',
            layers: [baseLayer, imageLayer],
            view: new ol.View({
                center: ol.extent.getCenter(
                    ol.proj.transformExtent(imageBounds, imageProjection, 'EPSG:3857')
                ),
                zoom: 6
            })
        });
    } catch (error) {
        console.error("Erro ao criar o mapa:", error);
        const mapDiv = document.getElementById('map');
        if (mapDiv) {
            mapDiv.innerHTML = '<p style="text-align:center; padding: 20px;">Não foi possível carregar o mapa. Verifique o console para mais detalhes.</p>';
        }
    }
}

if (document.getElementById('map')) {
    createMap();
}
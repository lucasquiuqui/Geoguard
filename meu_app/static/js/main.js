// --- DADOS DAS IMAGENS DO MAPA ---
// IMPORTANTE: Atualize esta lista com os seus meses e nomes de arquivos de imagem.
const DADOS_MAPA = [
    { mes: "Outubro 2025", arquivo: "mapa_2025-10.png" },
    { mes: "Setembro 2025", arquivo: "mapa_2025-09.png" },
    { mes: "Agosto 2025", arquivo: "mapa_2025-08.png" }
    // Adicione mais meses e imagens aqui
];

// --- CÓDIGO DO SITE ---

// Ano atual no rodapé
document.getElementById('year').textContent = new Date().getFullYear();

// Menu mobile
const btn = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');
btn?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
});


// --- LÓGICA DO MONITORAMENTO ---

// Pega os elementos do HTML
const seletorMes = document.getElementById('seletorMes');
const imagemMapa = document.getElementById('imagemMapa');

// Função para atualizar a imagem exibida
function atualizarMapa() {
    // Pega o nome do arquivo selecionado no <select>
    const arquivoSelecionado = seletorMes.value;
    
    if (arquivoSelecionado && imagemMapa) {
        // Constrói o caminho completo da imagem
        const caminhoDaImagem = `/static/images/${arquivoSelecionado}`;
        // Define o 'src' da tag <img> para o novo caminho
        imagemMapa.src = caminhoDaImagem;
    }
}

// Popula o seletor de mês e configura o estado inicial
if (seletorMes) {
    // Limpa opções existentes
    seletorMes.innerHTML = '';

    // Adiciona cada mês dos nossos dados como uma opção no <select>
    DADOS_MAPA.forEach(item => {
        const option = document.createElement('option');
        option.value = item.arquivo; // O valor é o nome do arquivo
        option.textContent = item.mes; // O texto visível é o mês
        seletorMes.appendChild(option);
    });

    // Adiciona um "ouvinte" que chama a função atualizarMapa toda vez que o usuário troca a opção
    seletorMes.addEventListener('change', atualizarMapa);

    // Carrega a primeira imagem da lista assim que a página abre
    atualizarMapa();
}

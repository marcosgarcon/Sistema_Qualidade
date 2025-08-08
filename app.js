document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DE NAVEGAÇÃO ---
    const currentPage = window.location.pathname.split('/').pop();
    const sidebarItems = document.querySelectorAll('.tool-item');
    sidebarItems.forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === currentPage || (currentPage === '' && itemPage === 'index.html')) {
            item.classList.add('active');
        }
        item.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = item.getAttribute('data-page');
        });
    });

    // --- ROTEADOR DE PÁGINAS ---
    // Chama a função de setup específica para a página atual
    if (document.getElementById('video-player')) setupCronoanaliseVideo();
    if (document.getElementById('pareto-chart')) setupParetoPage();
    if (document.getElementById('histogram-chart')) setupHistogramPage();
    if (document.getElementById('gut-table')) setupGutPage();
    if (document.getElementById('esforco-impacto-chart')) setupEsforcoImpactoPage();
    if (document.getElementById('5s-form')) setup5SPage();
    if (document.getElementById('dispersao-chart')) setupDispersaoPage();
    if (document.getElementById('vsm-form')) setupVsmPage();
    if (document.getElementById('kpi-definition-form')) setupKpiPage();
    
    // --- LÓGICA GENÉRICA PARA FORMULÁRIOS SIMPLES ---
    const form = document.querySelector('form');
    // Lista de IDs de formulários com lógica própria que devem ser ignorados aqui
    const specialForms = ['5s-form', 'crono-analysis-form', 'kpi-definition-form', 'kpi-reading-form', 'vsm-form'];
    if (form && !specialForms.includes(form.id)) {
        loadGenericFormData(form.id);
        const saveButton = form.querySelector('.btn-save');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                saveGenericFormData(form.id);
                alert('Dados salvos com sucesso!');
            });
        }
        const clearButton = form.querySelector('.btn-clear');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja limpar os dados deste formulário?')) {
                    localStorage.removeItem(form.id);
                    form.reset();
                    const tableBody = form.querySelector('tbody');
                    if (tableBody) tableBody.innerHTML = '';
                }
            });
        }
    }
    
    // --- LÓGICA GLOBAL (Backup/Restore) ---
    const backupBtn = document.getElementById('backup-btn');
    const restoreInput = document.getElementById('restore-input');
    if (backupBtn) backupBtn.addEventListener('click', backupAllData);
    if (restoreInput) restoreInput.addEventListener('change', restoreAllData);
});

// --- FUNÇÕES GENÉRICAS PARA SALVAR/CARREGAR FORMULÁRIOS ---
function saveGenericFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    const data = {};
    form.querySelectorAll('input, textarea, select').forEach(element => {
        if (element.type === 'radio') {
            if (element.checked) data[element.name] = element.value;
        } else {
            data[element.id] = element.type === 'checkbox' ? element.checked : element.value;
        }
    });
    localStorage.setItem(formId, JSON.stringify(data));
}
function loadGenericFormData(formId) {
    const savedData = localStorage.getItem(formId);
    if (!savedData) return;
    const data = JSON.parse(savedData);
    const form = document.getElementById(formId);
    if (!form) return;
    for (const key in data) {
        const element = form.elements[key];
        if (element) {
            if (element.type === 'radio' || (typeof element.length !== 'undefined' && element[0]?.type === 'radio')) {
                 const radioToSelect = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                 if(radioToSelect) radioToSelect.checked = true;
            } else if (element.type === 'checkbox') {
                element.checked = data[key];
            } else {
                element.value = data[key];
            }
        }
    }
}

// --- LÓGICA DA CRONOANÁLISE POR VÍDEO E MTM ---
let videoAnalysisData = {
    points: [],
    notes: '',
    mtmBase: [
        { codigo: 'G1A', tipo: 'Pegar', tmu: 2.0 },
        { codigo: 'M1A', tipo: 'Mover (1cm)', tmu: 2.0 },
        { codigo: 'RL1', tipo: 'Soltar', tmu: 2.0 }
    ]
};
function setupCronoanaliseVideo() {
    loadCronoVideoData();
    const videoPlayer = document.getElementById('video-player');
    const videoUpload = document.getElementById('video-upload');
    const timeDisplay = document.getElementById('video-time-display');
    const markPointBtn = document.getElementById('mark-point-btn');
    const resetBtn = document.getElementById('reset-analysis-btn');
    const analysisForm = document.getElementById('crono-analysis-form');
    const addMtmBaseRowBtn = document.getElementById('add-mtm-base-row');
    videoUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) videoPlayer.src = URL.createObjectURL(file);
    });
    videoPlayer.addEventListener('timeupdate', () => timeDisplay.textContent = formatVideoTime(videoPlayer.currentTime));
    markPointBtn.addEventListener('click', () => {
        videoAnalysisData.points.push({ timestamp: videoPlayer.currentTime, description: '', mtmCode: '', tipo: '', tmu: 0, fator: 100 });
        renderMeasurePoints();
        saveCronoVideoData();
    });
    resetBtn.addEventListener('click', () => {
        if (confirm('Zerar TODA a análise?')) {
            videoAnalysisData.points = [];
            videoAnalysisData.notes = '';
            document.getElementById('analysis-notes').value = '';
            renderMeasurePoints();
            saveCronoVideoData();
        }
    });
    analysisForm.querySelector('#analysis-notes').addEventListener('input', (e) => {
        videoAnalysisData.notes = e.target.value;
        saveCronoVideoData();
    });
    analysisForm.querySelector('.btn-save').addEventListener('click', () => {
        saveCronoVideoData();
        alert('Análise salva com sucesso!');
    });
    addMtmBaseRowBtn.addEventListener('click', () => {
        videoAnalysisData.mtmBase.push({ codigo: '', tipo: '', tmu: 0 });
        renderMtmBaseTable();
        saveCronoVideoData();
    });
    renderMtmBaseTable();
    renderMeasurePoints();
}
function formatVideoTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    const ms = Math.floor((seconds - Math.floor(seconds)) * 100);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}
function renderMtmBaseTable() {
    const tableBody = document.getElementById('mtm-base-table').querySelector('tbody');
    tableBody.innerHTML = '';
    videoAnalysisData.mtmBase.forEach((item, index) => {
        const row = tableBody.insertRow();
        row.innerHTML = `<td><input type="text" class="mtm-base-codigo" value="${item.codigo}"></td><td><input type="text" class="mtm-base-tipo" value="${item.tipo}"></td><td><input type="number" class="mtm-base-tmu" value="${item.tmu}" step="0.1"></td><td><button class="btn-danger remove-row">X</button></td>`;
        row.querySelector('.remove-row').onclick = () => {
            videoAnalysisData.mtmBase.splice(index, 1);
            renderMtmBaseTable();
            saveCronoVideoData();
        };
    });
    tableBody.querySelectorAll('input').forEach(input => {
        input.oninput = (e) => {
            const rowIndex = e.target.closest('tr').rowIndex - 1;
            const key = e.target.className.split('-')[2];
            videoAnalysisData.mtmBase[rowIndex][key] = input.type === 'number' ? parseFloat(input.value) : input.value;
            saveCronoVideoData();
        };
    });
}
function renderMeasurePoints() {
    const tableBody = document.getElementById('measure-points-table').querySelector('tbody');
    tableBody.innerHTML = '';
    let totalTmuCorr = 0;
    let totalTempoS = 0;
    videoAnalysisData.points.forEach((point, index) => {
        const tmuCorr = (point.tmu || 0) * ((point.fator || 100) / 100);
        const tempoS = tmuCorr / 27.8;
        totalTmuCorr += tmuCorr;
        totalTempoS += tempoS;
        const row = tableBody.insertRow();
        row.innerHTML = `<td>${index + 1}</td><td><textarea class="activity-description" rows="1">${point.description}</textarea></td><td><input type="text" class="mtm-code" value="${point.mtmCode || ''}"></td><td><input type="text" class="mtm-type" value="${point.tipo || ''}" readonly></td><td><input type="number" class="mtm-tmu" value="${point.tmu || 0}" readonly></td><td><input type="number" class="mtm-fator" value="${point.fator || 100}" step="1"></td><td class="tmu-corr">${tmuCorr.toFixed(2)}</td><td class="tempo-s">${tempoS.toFixed(4)}</td><td><button class="btn-danger remove-row">X</button></td>`;
    });
    document.getElementById('total-tmu-corr').textContent = totalTmuCorr.toFixed(2);
    document.getElementById('total-tempo-s').textContent = totalTempoS.toFixed(4);
    tableBody.querySelectorAll('.remove-row').forEach((btn, index) => {
        btn.onclick = () => {
            videoAnalysisData.points.splice(index, 1);
            renderMeasurePoints();
            saveCronoVideoData();
        };
    });
    tableBody.querySelectorAll('textarea.activity-description, input.mtm-code, input.mtm-fator').forEach(input => {
        input.oninput = (e) => {
            const index = e.target.closest('tr').rowIndex - 1;
            const point = videoAnalysisData.points[index];
            const className = e.target.className;
            if (className.includes('activity-description')) point.description = e.target.value;
            if (className.includes('mtm-fator')) point.fator = parseInt(e.target.value) || 100;
            if (className.includes('mtm-code')) {
                point.mtmCode = e.target.value.toUpperCase();
                const base = videoAnalysisData.mtmBase.find(b => b.codigo.toUpperCase() === point.mtmCode);
                point.tipo = base ? base.tipo : '';
                point.tmu = base ? base.tmu : 0;
            }
            renderMeasurePoints();
            saveCronoVideoData();
        };
    });
}
function saveCronoVideoData() { localStorage.setItem('cronoVideoAnalysisData', JSON.stringify(videoAnalysisData)); }
function loadCronoVideoData() {
    const savedData = JSON.parse(localStorage.getItem('cronoVideoAnalysisData'));
    if (savedData) {
        if (!savedData.mtmBase) {
            savedData.mtmBase = [{ codigo: 'G1A', tipo: 'Pegar', tmu: 2.0 }, { codigo: 'M1A', tipo: 'Mover (1cm)', tmu: 2.0 }, { codigo: 'RL1', tipo: 'Soltar', tmu: 2.0 }];
        }
        videoAnalysisData = savedData;
        document.getElementById('analysis-notes').value = videoAnalysisData.notes || '';
    }
}

// --- LÓGICA DO CHECKLIST 5S ---
function setup5SPage() {
    const criteriaContainer = document.getElementById('5s-criteria');
    const questions = { Seiri: ["O local está livre de itens desnecessários?", "Ferramentas e materiais não utilizados são removidos?", "Há um sistema de descarte claro (cartão vermelho)?", "Os corredores e passagens estão desobstruídos?"], Seiton: ["Todas as ferramentas/materiais têm um local definido?", "Os locais estão claramente identificados?", "Itens de uso frequente estão próximos ao local de uso?", "A organização visual facilita encontrar qualquer item em 30 segundos?"], Seiso: ["O ambiente de trabalho está visivelmente limpo?", "As máquinas e equipamentos estão limpos?", "A limpeza é uma responsabilidade de todos?", "Existem padrões de limpeza definidos e seguidos?"], Seiketsu: ["Os padrões de organização e limpeza são mantidos?", "As melhorias dos 3S anteriores foram padronizadas?", "A gestão visual (cores, marcações) é utilizada?", "As responsabilidades pelo 5S são claras?"], Shitsuke: ["As auditorias 5S são realizadas regularmente?", "A equipe demonstra disciplina em seguir os padrões?", "Há reconhecimento e incentivo para a prática do 5S?", "A melhoria contínua do 5S é praticada?"] };
    for (const s in questions) {
        const fieldset = document.createElement('fieldset');
        let fieldsetContent = `<legend>${s}</legend>`;
        questions[s].forEach((q, index) => {
            const questionId = `${s}-${index}`;
            fieldsetContent += `<div class="form-group"><label>${q}</label><div>${[0,1,2,3,4].map(val => `<input type="radio" id="${questionId}-${val}" name="${questionId}" value="${val}" required><label for="${questionId}-${val}" style="display:inline-block; margin-right:15px; font-weight:normal;">${val}</label>`).join('')}</div></div>`;
        });
        fieldset.innerHTML = fieldsetContent;
        criteriaContainer.appendChild(fieldset);
    }
    const form = document.getElementById('5s-form');
    form.addEventListener('input', calculate5SScores);
    form.querySelector('.btn-save').addEventListener('click', () => { saveGenericFormData('5s-form'); alert('Auditoria salva!'); });
    form.querySelector('.btn-clear').addEventListener('click', () => { if (confirm('Limpar auditoria?')) { localStorage.removeItem('5s-form'); form.reset(); calculate5SScores(); } });
    loadGenericFormData('5s-form');
    calculate5SScores();
}
function calculate5SScores() {
    let totalScore = 0, totalMaxScore = 0;
    ['Seiri', 'Seiton', 'Seiso', 'Seiketsu', 'Shitsuke'].forEach(s => {
        const questions = document.querySelectorAll(`fieldset:has(legend:contains(${s})) input[type="radio"]:checked`);
        let sectionScore = 0;
        questions.forEach(q => sectionScore += parseInt(q.value));
        const maxSectionScore = document.querySelectorAll(`fieldset:has(legend:contains(${s})) .form-group`).length * 4;
        const percentage = maxSectionScore > 0 ? (sectionScore / maxSectionScore * 100).toFixed(0) : 0;
        document.getElementById(`score-${s.toLowerCase()}`).textContent = `${percentage}%`;
        totalScore += sectionScore;
        totalMaxScore += maxSectionScore;
    });
    const totalPercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore * 100).toFixed(0) : 0;
    document.getElementById('score-total').textContent = `${totalPercentage}%`;
}

// --- LÓGICA DA MATRIZ ESFORÇO X IMPACTO ---
let eiChartInstance = null;
function setupEsforcoImpactoPage() {
    document.getElementById('add-ei-row').onclick = () => addEiRow();
    document.getElementById('generate-ei-chart-btn').onclick = generateEsforcoImpactoChart;
    loadEiData();
}
function addEiRow(item = { acao: '', esforco: 5, impacto: 5 }) {
    const tableBody = document.getElementById('esforco-impacto-table').querySelector('tbody');
    const row = tableBody.insertRow();
    row.innerHTML = `<td><input type="text" class="ei-acao" value="${item.acao}"></td><td><input type="number" class="ei-esforco" min="1" max="10" value="${item.esforco}"></td><td><input type="number" class="ei-impacto" min="1" max="10" value="${item.impacto}"></td><td><button class="btn-danger remove-row">Remover</button></td>`;
    row.querySelector('.remove-row').onclick = (e) => e.target.closest('tr').remove();
}
function saveEiData() {
    const rows = document.querySelectorAll('#esforco-impacto-table tbody tr');
    const data = Array.from(rows).map(row => ({ acao: row.querySelector('.ei-acao').value, esforco: row.querySelector('.ei-esforco').value, impacto: row.querySelector('.ei-impacto').value, }));
    localStorage.setItem('eiData', JSON.stringify(data));
}
function loadEiData() {
    const data = JSON.parse(localStorage.getItem('eiData')) || [];
    if (data.length === 0) { addEiRow(); } else { data.forEach(item => addEiRow(item)); generateEsforcoImpactoChart(); }
}
function generateEsforcoImpactoChart() {
    saveEiData();
    const rows = document.querySelectorAll('#esforco-impacto-table tbody tr');
    const data = Array.from(rows).map(row => ({ label: row.querySelector('.ei-acao').value, x: parseInt(row.querySelector('.ei-esforco').value) || 0, y: parseInt(row.querySelector('.ei-impacto').value) || 0, })).filter(d => d.label);
    const ctx = document.getElementById('esforco-impacto-chart').getContext('2d');
    if (eiChartInstance) { eiChartInstance.destroy(); }
    eiChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: [{ label: 'Iniciativas', data: data, backgroundColor: 'rgba(0, 123, 255, 0.7)' }] },
        options: { scales: { x: { type: 'linear', position: 'bottom', min: 0, max: 10, title: { display: true, text: 'Esforço' } }, y: { min: 0, max: 10, title: { display: true, text: 'Impacto' } } }, plugins: { tooltip: { callbacks: { label: (context) => context.raw.label || '' } } } }
    });
}

// --- LÓGICA DA MATRIZ GUT ---
function setupGutPage() {
    document.getElementById('add-gut-row').onclick = () => addGutRow();
    document.getElementById('sort-gut-btn').onclick = () => sortGutTable();
    loadGutData();
}
function addGutRow(item = { problema: '', g: 1, u: 1, t: 1 }) {
    const tableBody = document.getElementById('gut-table').querySelector('tbody');
    const row = tableBody.insertRow();
    row.innerHTML = `<td><input type="text" class="gut-problema" value="${item.problema}"></td><td><select class="gut-g"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></td><td><select class="gut-u"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></td><td><select class="gut-t"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></td><td class="gut-score">${item.g * item.u * item.t}</td><td><button class="btn-danger remove-row">Remover</button></td>`;
    row.querySelector('.gut-g').value = item.g; row.querySelector('.gut-u').value = item.u; row.querySelector('.gut-t').value = item.t;
    row.querySelectorAll('select, input').forEach(el => el.addEventListener('input', () => { calculateGutRow(row); saveGutData(); }));
    row.querySelector('.remove-row').onclick = (e) => { e.target.closest('tr').remove(); saveGutData(); };
}
function calculateGutRow(row) { const g = parseInt(row.querySelector('.gut-g').value), u = parseInt(row.querySelector('.gut-u').value), t = parseInt(row.querySelector('.gut-t').value); row.querySelector('.gut-score').textContent = g * u * t; }
function saveGutData() {
    const rows = document.querySelectorAll('#gut-table tbody tr');
    const data = Array.from(rows).map(row => ({ problema: row.querySelector('.gut-problema').value, g: row.querySelector('.gut-g').value, u: row.querySelector('.gut-u').value, t: row.querySelector('.gut-t').value }));
    localStorage.setItem('gutData', JSON.stringify(data));
}
function loadGutData() {
    const data = JSON.parse(localStorage.getItem('gutData')) || [];
    if (data.length === 0) { addGutRow(); } else { data.forEach(item => addGutRow(item)); }
}
function sortGutTable() {
    const tableBody = document.getElementById('gut-table').querySelector('tbody');
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    rows.sort((a, b) => parseInt(b.querySelector('.gut-score').textContent) - parseInt(a.querySelector('.gut-score').textContent));
    rows.forEach(row => tableBody.appendChild(row));
    saveGutData();
}

// --- LÓGICA DO HISTOGRAMA ---
let histogramChartInstance = null;
function setupHistogramPage() { document.getElementById('generate-histogram-btn').onclick = generateHistogram; }
function generateHistogram() {
    const data = document.getElementById('histogram-data').value.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (data.length === 0) return alert('Por favor, insira dados numéricos válidos.');
    const numClasses = parseInt(document.getElementById('histogram-classes').value) || Math.ceil(Math.sqrt(data.length));
    const min = Math.min(...data), max = Math.max(...data), range = max - min, classWidth = range / numClasses;
    let classes = Array.from({ length: numClasses }, (_, i) => ({ label: `${(min + i * classWidth).toFixed(2)} - ${(min + (i + 1) * classWidth).toFixed(2)}`, count: 0 }));
    data.forEach(value => {
        let classIndex = Math.floor((value - min) / classWidth);
        if (value === max) classIndex = numClasses - 1;
        if (classes[classIndex]) classes[classIndex].count++;
    });
    const ctx = document.getElementById('histogram-chart').getContext('2d');
    if (histogramChartInstance) histogramChartInstance.destroy();
    histogramChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: classes.map(c => c.label), datasets: [{ label: 'Frequência', data: classes.map(c => c.count), backgroundColor: 'rgba(0, 123, 255, 0.6)', borderWidth: 1, barPercentage: 1.0, categoryPercentage: 1.0 }] },
        options: { scales: { x: { grid: { offset: false } }, y: { beginAtZero: true, title: { display: true, text: 'Frequência' } } } }
    });
}

// --- LÓGICA DO PARETO ---
let paretoChartInstance = null;
function setupParetoPage() { document.getElementById('add-pareto-row').onclick = () => addParetoRow(); document.getElementById('generate-chart-btn').onclick = () => generateParetoChart(); document.getElementById('export-csv-btn').onclick = () => exportTableToCSV('pareto-table', 'dados_pareto.csv'); loadParetoData(); }
function addParetoRow(causa = '', frequencia = '') {
    const tableBody = document.getElementById('pareto-table').querySelector('tbody');
    const row = tableBody.insertRow();
    row.innerHTML = `<td><input type="text" class="pareto-causa" value="${causa}"></td><td><input type="number" class="pareto-frequencia" value="${frequencia}"></td><td><button class="btn-danger remove-row">Remover</button></td>`;
    row.querySelector('.remove-row').onclick = (e) => e.target.closest('tr').remove();
}
function saveParetoData() {
    const rows = document.querySelectorAll('#pareto-table tbody tr');
    const data = Array.from(rows).map(row => ({ causa: row.querySelector('.pareto-causa').value, frequencia: row.querySelector('.pareto-frequencia').value }));
    localStorage.setItem('paretoData', JSON.stringify(data));
}
function loadParetoData() {
    const data = JSON.parse(localStorage.getItem('paretoData')) || [];
    if (data.length === 0) { addParetoRow(); } else { data.forEach(item => addParetoRow(item.causa, item.frequencia)); generateParetoChart(); }
}
function generateParetoChart() {
    saveParetoData();
    let data = [];
    document.querySelectorAll('#pareto-table tbody tr').forEach(row => {
        const causa = row.querySelector('.pareto-causa').value;
        const frequencia = parseInt(row.querySelector('.pareto-frequencia').value) || 0;
        if (causa && frequencia > 0) data.push({ label: causa, value: frequencia });
    });
    data.sort((a, b) => b.value - a.value);
    let cumulative = 0;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const cumulativePercentage = data.map(item => { cumulative += item.value; return (cumulative / total) * 100; });
    const ctx = document.getElementById('pareto-chart').getContext('2d');
    if (paretoChartInstance) paretoChartInstance.destroy();
    paretoChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: data.map(item => item.label), datasets: [{ label: 'Frequência', data: data.map(item => item.value), backgroundColor: 'rgba(0, 123, 255, 0.6)', yAxisID: 'y-axis-freq' }, { label: '% Acumulado', data: cumulativePercentage, type: 'line', borderColor: '#dc3545', yAxisID: 'y-axis-percent' }] },
        options: { scales: { 'y-axis-freq': { position: 'left', beginAtZero: true, title: { display: true, text: 'Frequência' } }, 'y-axis-percent': { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, ticks: { callback: value => value + '%' }, title: { display: true, text: '% Acumulado' } } } }
    });
}
function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    let csv = [];
    const headers = [];
    table.querySelectorAll('thead th').forEach(header => { if (header.textContent.toLowerCase() !== 'ação') headers.push(`"${header.textContent}"`); });
    csv.push(headers.join(','));
    table.querySelectorAll('tbody tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td input, td select').forEach(input => { rowData.push(`"${input.value}"`); });
        csv.push(rowData.join(','));
    });
    const csvFile = new Blob([`\uFEFF${csv.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const downloadLink = document.createElement('a');
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// --- LÓGICA DO DASHBOARD KPI ---
const KPI_DEFS_KEY = 'kpi-definitions';
function setupKpiPage() {
    const definitionForm = document.getElementById('kpi-definition-form');
    const readingForm = document.getElementById('kpi-reading-form');
    const kpiSelect = document.getElementById('kpi-select');
    loadKpiDefinitions();
    definitionForm.addEventListener('submit', (e) => { e.preventDefault(); const name = document.getElementById('kpi-name').value; const target = document.getElementById('kpi-target').value; if (name && target) { saveKpiDefinition({ name, target }); definitionForm.reset(); loadKpiDefinitions(); } });
    kpiSelect.addEventListener('change', () => { const selectedKpiName = kpiSelect.value; if (selectedKpiName) { document.getElementById('kpi-data-area').style.display = 'block'; loadKpiData(selectedKpiName); } else { document.getElementById('kpi-data-area').style.display = 'none'; } });
    readingForm.addEventListener('submit', (e) => { e.preventDefault(); const selectedKpiName = kpiSelect.value; const date = document.getElementById('kpi-reading-date').value; const value = document.getElementById('kpi-reading-value').value; if (selectedKpiName && date && value) { saveKpiReading(selectedKpiName, { date, value }); readingForm.reset(); loadKpiData(selectedKpiName); } });
}
function getKpiDefinitions() { return JSON.parse(localStorage.getItem(KPI_DEFS_KEY)) || []; }
function saveKpiDefinition(newDef) {
    const defs = getKpiDefinitions();
    if (defs.some(d => d.name === newDef.name)) return alert('Um KPI com este nome já existe.');
    defs.push(newDef);
    localStorage.setItem(KPI_DEFS_KEY, JSON.stringify(defs));
}
function loadKpiDefinitions() {
    const defs = getKpiDefinitions();
    const kpiSelect = document.getElementById('kpi-select');
    kpiSelect.innerHTML = '<option value="">-- Selecione --</option>';
    if (defs.length > 0) { defs.forEach(def => { const option = document.createElement('option'); option.value = def.name; option.textContent = def.name; kpiSelect.appendChild(option); }); } else { kpiSelect.innerHTML = '<option>Nenhum KPI definido</option>'; }
}
function getKpiData(kpiName) { return JSON.parse(localStorage.getItem(`kpi-data-${kpiName}`)) || []; }
function saveKpiReading(kpiName, newReading) { const data = getKpiData(kpiName); data.push(newReading); data.sort((a, b) => new Date(a.date) - new Date(b.date)); localStorage.setItem(`kpi-data-${kpiName}`, JSON.stringify(data)); }
function deleteKpiReading(kpiName, index) { if (!confirm('Apagar esta leitura?')) return; let data = getKpiData(kpiName); data.splice(index, 1); localStorage.setItem(`kpi-data-${kpiName}`, JSON.stringify(data)); loadKpiData(kpiName); }
function loadKpiData(kpiName) {
    const selectedDef = getKpiDefinitions().find(d => d.name === kpiName);
    document.getElementById('selected-kpi-name').textContent = selectedDef.name;
    document.getElementById('selected-kpi-target').textContent = selectedDef.target;
    const data = getKpiData(kpiName);
    const historyBody = document.getElementById('kpi-history-body');
    historyBody.innerHTML = '';
    if (data.length > 0) {
        data.forEach((reading, index) => {
            const row = historyBody.insertRow();
            row.innerHTML = `<td>${new Date(reading.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td><td>${reading.value}</td><td><button class="btn-danger btn-delete-reading" data-index="${index}">X</button></td>`;
        });
        document.querySelectorAll('.btn-delete-reading').forEach(button => button.onclick = (e) => deleteKpiReading(kpiName, e.target.dataset.index));
    } else {
        historyBody.innerHTML = '<tr><td colspan="3">Nenhum resultado registrado.</td></tr>';
    }
}

// --- LÓGICA DO DIAGRAMA DE DISPERSÃO ---
let dispersaoChartInstance = null;
function setupDispersaoPage() {
    document.getElementById('add-dispersao-row').onclick = () => addDispersaoRow();
    document.getElementById('generate-dispersao-chart-btn').onclick = generateDispersaoChart;
    loadDispersaoData();
}
function addDispersaoRow(item = { x: '', y: '' }) {
    const tableBody = document.getElementById('dispersao-table').querySelector('tbody');
    const row = tableBody.insertRow();
    row.innerHTML = `<td><input type="number" class="dispersao-x" value="${item.x}"></td><td><input type="number" class="dispersao-y" value="${item.y}"></td><td><button class="btn-danger remove-row">X</button></td>`;
    row.querySelector('.remove-row').onclick = (e) => e.target.closest('tr').remove();
}
function saveDispersaoData() {
    const rows = document.querySelectorAll('#dispersao-table tbody tr');
    const data = Array.from(rows).map(row => ({ x: row.querySelector('.dispersao-x').value, y: row.querySelector('.dispersao-y').value }));
    localStorage.setItem('dispersaoData', JSON.stringify(data));
}
function loadDispersaoData() {
    const data = JSON.parse(localStorage.getItem('dispersaoData')) || [];
    if (data.length === 0) { addDispersaoRow(); } 
    else { data.forEach(item => addDispersaoRow(item)); generateDispersaoChart(); }
}
function generateDispersaoChart() {
    saveDispersaoData();
    const rows = document.querySelectorAll('#dispersao-table tbody tr');
    const data = Array.from(rows).map(row => ({
        x: parseFloat(row.querySelector('.dispersao-x').value),
        y: parseFloat(row.querySelector('.dispersao-y').value)
    })).filter(d => !isNaN(d.x) && !isNaN(d.y));
    const ctx = document.getElementById('dispersao-chart').getContext('2d');
    if (dispersaoChartInstance) dispersaoChartInstance.destroy();
    dispersaoChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Relação entre Variáveis',
                data: data,
                backgroundColor: 'rgba(0, 123, 255, 0.7)'
            }]
        },
        options: {
            scales: {
                x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Variável X' } },
                y: { title: { display: true, text: 'Variável Y' } }
            }
        }
    });
}


// --- FUNÇÕES GLOBAIS DE BACKUP E RESTAURAÇÃO ---
function backupAllData() { if (localStorage.length === 0) return alert('Nenhum dado para fazer backup!'); const allData = {}; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); allData[key] = localStorage.getItem(key); } const dataStr = JSON.stringify(allData, null, 2); const dataBlob = new Blob([dataStr], { type: 'application/json' }); const url = URL.createObjectURL(dataBlob); const a = document.createElement('a'); a.href = url; a.download = `backup_pan_eng_process_quality_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); alert('Backup realizado com sucesso!'); }
function restoreAllData(event) { const file = event.target.files[0]; if (!file || !confirm('ATENÇÃO: Isso irá sobrescrever TODOS os dados atuais. Deseja continuar?')) { if (event.target) event.target.value = ''; return; } const reader = new FileReader(); reader.onload = (e) => { try { const allData = JSON.parse(e.target.result); localStorage.clear(); for (const key in allData) { if (Object.hasOwnProperty.call(allData, key)) localStorage.setItem(key, allData[key]); } alert('Dados restaurados com sucesso! A página será recarregada.'); window.location.href = 'index.html'; } catch (error) { alert('Erro ao ler o arquivo de backup.'); } }; reader.readAsText(file); }
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('report-8d-form');
    const reportsTableBody = document.querySelector('#nao-conformidade-table tbody');
    
    let reports = JSON.parse(localStorage.getItem('reports8d')) || [];
    reports.forEach(report => addReportToTable(report));

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const reportData = {
            id: Date.now(),
            'peca-afetada': document.getElementById('peca-afetada').value,
            sintoma: document.getElementById('sintoma').value,
            'lider-equipe': document.getElementById('lider-equipe').value,
            'membros-equipe': document.getElementById('membros-equipe').value,
            'd3-acoes': document.getElementById('d3-acoes').value,
            'd4-causa-raiz': document.getElementById('d4-causa-raiz').value,
            'd5-acoes': document.getElementById('d5-acoes').value,
            'd7-prevencao': document.getElementById('d7-prevencao').value,
        };

        addReportToTable(reportData);
        reports.push(reportData);
        localStorage.setItem('reports8d', JSON.stringify(reports));
        form.reset();
    });

    function addReportToTable(report) {
        const row = reportsTableBody.insertRow();
        row.setAttribute('data-id', report.id);
        row.innerHTML = `
            <td>${report['peca-afetada']}</td>
            <td>${report.sintoma}</td>
            <td>${report['lider-equipe']}</td>
            <td>
                <button class="view-btn">Visualizar</button>
                <button class="delete-btn">Excluir</button>
            </td>
        `;
    }

    reportsTableBody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;

        const id = Number(row.getAttribute('data-id'));
        
        if (e.target.classList.contains('delete-btn')) {
            row.remove();
            reports = reports.filter(r => r.id !== id);
            localStorage.setItem('reports8d', JSON.stringify(reports));
        }
        
        if (e.target.classList.contains('view-btn')) {
            const report = reports.find(r => r.id === id);
            if (report) {
                // Preenche o formulário com os dados do relatório para visualização/edição
                for (const key in report) {
                    const element = document.getElementById(key);
                    if (element) {
                        element.value = report[key];
                    }
                }
                alert('Dados do relatório carregados no formulário para visualização.');
            }
        }
    });
});

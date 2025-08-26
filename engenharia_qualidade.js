document.addEventListener('DOMContentLoaded', () => {
    // Lógica para o FMEA
    const fmeaForm = document.getElementById('fmea-form');
    const fmeaTableBody = document.querySelector('#fmea-table tbody');
    let fmeaData = JSON.parse(localStorage.getItem('fmeaData')) || [];
    fmeaData.forEach(item => addFmeaToTable(item));

    fmeaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const severidade = parseInt(document.getElementById('fmea-severidade').value);
        const ocorrencia = parseInt(document.getElementById('fmea-ocorrencia').value);
        const deteccao = parseInt(document.getElementById('fmea-deteccao').value);
        
        const newItem = {
            id: Date.now(),
            etapa: document.getElementById('fmea-etapa').value,
            modoFalha: document.getElementById('fmea-modo-falha').value,
            severidade,
            ocorrencia,
            deteccao,
            rpn: severidade * ocorrencia * deteccao,
        };
        addFmeaToTable(newItem);
        fmeaData.push(newItem);
        localStorage.setItem('fmeaData', JSON.stringify(fmeaData));
        fmeaForm.reset();
    });

    function addFmeaToTable(item) {
        const row = fmeaTableBody.insertRow();
        row.setAttribute('data-id', item.id);
        row.innerHTML = `
            <td>${item.etapa}</td>
            <td>${item.modoFalha}</td>
            <td>${item.severidade}</td>
            <td>${item.ocorrencia}</td>
            <td>${item.deteccao}</td>
            <td><strong>${item.rpn}</strong></td>
            <td><button class="delete-btn">Excluir</button></td>
        `;
    }
    
    fmeaTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const row = e.target.closest('tr');
            const id = Number(row.getAttribute('data-id'));
            row.remove();
            fmeaData = fmeaData.filter(item => item.id !== id);
            localStorage.setItem('fmeaData', JSON.stringify(fmeaData));
        }
    });

    // Lógica para o Plano de Controle
    const cpForm = document.getElementById('control-plan-form');
    const cpTableBody = document.querySelector('#control-plan-table tbody');
    let cpData = JSON.parse(localStorage.getItem('cpData')) || [];
    cpData.forEach(item => addCpToTable(item));

    cpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newItem = {
            id: Date.now(),
            etapa: document.getElementById('cp-etapa').value,
            caracteristica: document.getElementById('cp-caracteristica').value,
            especificacao: document.getElementById('cp-especificacao').value,
            amostra: document.getElementById('cp-amostra').value,
            metodo: document.getElementById('cp-metodo').value,
        };
        addCpToTable(newItem);
        cpData.push(newItem);
        localStorage.setItem('cpData', JSON.stringify(cpData));
        cpForm.reset();
    });

    function addCpToTable(item) {
        const row = cpTableBody.insertRow();
        row.setAttribute('data-id', item.id);
        row.innerHTML = `
            <td>${item.etapa}</td>
            <td>${item.caracteristica}</td>
            <td>${item.especificacao}</td>
            <td>${item.amostra}</td>
            <td>${item.metodo}</td>
            <td><button class="delete-btn">Excluir</button></td>
        `;
    }

    cpTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const row = e.target.closest('tr');
            const id = Number(row.getAttribute('data-id'));
            row.remove();
            cpData = cpData.filter(item => item.id !== id);
            localStorage.setItem('cpData', JSON.stringify(cpData));
        }
    });
});

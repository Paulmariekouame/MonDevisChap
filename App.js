document.addEventListener('DOMContentLoaded', function() {
    const quoteBody = document.getElementById('quoteBody');
    const addRowBtn = document.getElementById('addRowBtn');
    const resetBtn = document.getElementById('resetBtn');
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    const previewPdfBtn = document.getElementById('previewPdfBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importInput = document.getElementById('importInput');
    const themeToggle = document.getElementById('themeToggle');
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    const quoteNameEl = document.getElementById('quoteName');
    const modelSelect = document.getElementById('modelSelect');
    const logoUpload = document.getElementById('logoUpload');
    const imageUpload = document.getElementById('imageUpload');
    const signatureUpload = document.getElementById('signatureUpload');
    const toast = new bootstrap.Toast(document.getElementById('toast'));
    const toastMessage = document.getElementById('toastMessage');

    // Charger les données depuis localStorage
    function loadData() {
        const data = JSON.parse(localStorage.getItem('devisData')) || {};
        if (data.quoteName) quoteNameEl.value = data.quoteName;
        if (data.model) modelSelect.value = data.model;
        if (data.company) {
            document.getElementById('companyName').value = data.company.name || '';
            document.getElementById('companyAddress').value = data.company.address || '';
            document.getElementById('companyPhone').value = data.company.phone || '';
            document.getElementById('companyEmail').value = data.company.email || '';
        }
        if (data.client) {
            document.getElementById('clientName').value = data.client.name || '';
            document.getElementById('clientAddress').value = data.client.address || '';
            document.getElementById('clientPhone').value = data.client.phone || '';
            document.getElementById('clientEmail').value = data.client.email || '';
        }
        if (data.rows) {
            data.rows.forEach(rowData => addRow(rowData));
        }
        if (data.theme) {
            document.body.classList.toggle('dark', data.theme === 'dark');
            themeToggle.innerHTML = data.theme === 'dark' ? '<i class="bi bi-sun"></i> Thème' : '<i class="bi bi-moon"></i> Thème';
        }
        updateTotals();
    }

    // Sauvegarder les données dans localStorage
    function saveData() {
        const data = {
            quoteName: quoteNameEl.value,
            model: modelSelect.value,
            company: {
                name: document.getElementById('companyName').value,
                address: document.getElementById('companyAddress').value,
                phone: document.getElementById('companyPhone').value,
                email: document.getElementById('companyEmail').value
            },
            client: {
                name: document.getElementById('clientName').value,
                address: document.getElementById('clientAddress').value,
                phone: document.getElementById('clientPhone').value,
                email: document.getElementById('clientEmail').value
            },
            rows: Array.from(quoteBody.querySelectorAll('tr')).map(row => ({
                description: row.querySelector('.description').value,
                quantity: row.querySelector('.quantity').value,
                unitPrice: row.querySelector('.unitPrice').value
            })),
            theme: document.body.classList.contains('dark') ? 'dark' : 'light'
        };
        localStorage.setItem('devisData', JSON.stringify(data));
    }

    // Fonction pour ajouter une ligne
    function addRow(rowData = {}) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="form-control description" placeholder="Description" value="${rowData.description || ''}"></td>
            <td><input type="number" class="form-control quantity" placeholder="0" min="0" step="1" value="${rowData.quantity || ''}"></td>
            <td><input type="number" class="form-control unitPrice" placeholder="0.00" min="0" step="0.01" value="${rowData.unitPrice || ''}"></td>
            <td><span class="lineTotal">0.00 FCFA</span></td>
            <td><button class="btn btn-danger btn-sm deleteRow"><i

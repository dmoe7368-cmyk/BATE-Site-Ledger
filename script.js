const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw9oqCSvnz8qW0GH7Kx5Tf0spq3TLUVi3yH9f6SoMooFHV54iZ4Q1tJSNS_GdrouOzH/exec"; 

function getTodayLocal() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return (new Date(now - offset)).toISOString().split('T')[0];
}

function checkLogin() {
    const pin = document.getElementById('pinInput').value;
    if (pin === "1234") { 
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.body.style.overflow = 'auto';
        document.getElementById('dateField').value = getTodayLocal();
        loadData(); 
    } else { alert("PIN မှားယွင်းနေပါသည်။"); }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('active');
    overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
}

function changeSheet(name, currency, element) {
    document.getElementById('entryForm').parentElement.style.display = 'block';
    document.getElementById('historyList').style.display = 'block';
    
    document.getElementById('sheetNameInput').value = name;
    document.getElementById('headerTitle').innerText = name;
    document.getElementById('currencyText').innerText = currency;
    document.getElementById('sheetLabel').innerText = name + " USAGE";
    
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    
    const card = document.getElementById('summaryCard');
    card.className = 'summary-card shadow-lg';
    if (currency === 'SGD') card.classList.add('sg-theme');

    toggleSidebar();
    loadData(); 
}

async function loadData() {
    const sheetName = document.getElementById('sheetNameInput').value;
    const historyList = document.getElementById('historyList');
    const currency = document.getElementById('currencyText').innerText;
    historyList.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        const response = await fetch(`${WEB_APP_URL}?sheetName=${encodeURIComponent(sheetName)}`);
        const data = await response.json();
        
        let total = 0;
        historyList.innerHTML = '';
        
        data.forEach(item => {
            const cleanAmount = parseFloat(String(item.amount).replace(/,/g, '')) || 0;
            total += cleanAmount;
            
            historyList.innerHTML += `
                <div class="record-card">
                    <div>
                        <div class="record-cat">${item.category}</div>
                        <div class="record-date">${item.date}</div>
                    </div>
                    <div class="record-amt">${cleanAmount.toLocaleString()}</div>
                </div>
            `;
        });

        document.getElementById('totalAmount').innerText = total.toLocaleString();
        document.getElementById('recordCount').innerText = data.length + " Items";
    } catch (error) {
        historyList.innerHTML = '<div class="text-center text-danger p-4">ဒေတာ မရှိသေးပါ။</div>';
    }
}

document.getElementById('entryForm').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING...';

    const rawDate = document.getElementById('dateField').value;
    const parts = rawDate.split("-"); 
    const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

    const formData = new FormData(e.target);
    const params = new URLSearchParams();
    for (const pair of formData.entries()) {
        params.append(pair[0], pair[0] === 'date' ? formattedDate : pair[1]);
    }
    
    try {
        await fetch(WEB_APP_URL, { method: 'POST', body: params });
        e.target.reset();
        document.getElementById('dateField').value = getTodayLocal();
        alert("စာရင်းသွင်းပြီးပါပြီ။");
        loadData(); 
    } catch (error) {
        alert("Error: ပို့၍မရပါ။");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i> SUBMIT DATA';
    }
};

async function showSummaryReport(element) {
    const historyList = document.getElementById('historyList');
    const formContainer = document.getElementById('entryForm').parentElement;

    formContainer.style.display = 'none'; 
    historyList.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Generating Report...</div>';
    
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('headerTitle').innerText = "ALL GROUPS SUMMARY";

    try {
        const response = await fetch(WEB_APP_URL + "?sheetName=SUMMARY_REPORT_ACTION", { method: 'POST' });
        const result = await response.json(); 
        
        historyList.innerHTML = '<h5 class="fw-bold mb-3 text-primary"><i class="fas fa-file-contract me-2"></i>MMK Summary Overview</h5>';
        
        result.details.forEach(item => {
            historyList.innerHTML += `
                <div class="record-card" style="border-left: 5px solid #0891b2; margin-bottom: 10px;">
                    <div class="record-cat" style="font-size: 1.1rem;">${item.name}</div>
                    <div class="record-amt" style="color: #0891b2; font-weight: bold;">
                        ${item.total.toLocaleString()} <small>MMK</small>
                    </div>
                </div>
            `;
        });

        document.getElementById('totalAmount').innerText = result.mmkGrandTotal.toLocaleString();
        document.getElementById('currencyText').innerText = "MMK";
        document.getElementById('sheetLabel').innerText = "GRAND TOTAL (MMK)";
        
        toggleSidebar();
    } catch (error) {
        alert("Report ထုတ်မရပါ။");
        formContainer.style.display = 'block';
    }
}

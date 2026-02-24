const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxwhFz9S_C0a__t4i-6kW1J8pqVFZRF4TOhJk9i1xXbblIHY2ulj9wEKN0HDp1U28B8/exec"; 

function getTodayLocal() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return (new Date(now - offset)).toISOString().split('T')[0];
}

function checkLogin() {
    if (document.getElementById('pinInput').value === "1234") { 
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
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
    card.className = 'summary-card shadow-lg' + (currency === 'SGD' ? ' sg-theme' : '');

    toggleSidebar();
    loadData(); 
}

async function loadData() {
    const sheetName = document.getElementById('sheetNameInput').value;
    const list = document.getElementById('historyList');
    list.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        const res = await fetch(`${WEB_APP_URL}?sheetName=${encodeURIComponent(sheetName)}`);
        const data = await res.json();
        let total = 0;
        list.innerHTML = '';
        
        data.forEach(item => {
            const amt = parseFloat(item.amount) || 0;
            total += amt;
            list.innerHTML += `
                <div class="record-card">
                    <div><div class="record-cat">${item.category}</div><div class="record-date">${item.date}</div></div>
                    <div class="record-amt">${amt.toLocaleString()}</div>
                </div>`;
        });
        document.getElementById('totalAmount').innerText = total.toLocaleString();
        document.getElementById('recordCount').innerText = data.length + " Items";
    } catch (e) { list.innerHTML = '<div class="text-center p-4">ဒေတာ မရှိသေးပါ။</div>'; }
}

document.getElementById('entryForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = 'SENDING...';

    const rawDate = document.getElementById('dateField').value;
    const parts = rawDate.split("-");
    const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

    const params = new URLSearchParams(new FormData(e.target));
    params.set('date', formattedDate);
    
    try {
        await fetch(WEB_APP_URL, { method: 'POST', body: params });
        e.target.reset();
        document.getElementById('dateField').value = getTodayLocal();
        alert("စာရင်းသွင်းပြီးပါပြီ။");
        loadData(); 
    } catch (e) { alert("ပို့၍မရပါ။"); }
    finally { btn.disabled = false; btn.innerHTML = 'SUBMIT DATA'; }
};

async function showSummaryReport(element) {
    const list = document.getElementById('historyList');
    const form = document.getElementById('entryForm').parentElement;
    form.style.display = 'none'; 
    list.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Generating Report...</div>';
    
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('headerTitle').innerText = "ALL GROUPS SUMMARY";

    try {
        const res = await fetch(`${WEB_APP_URL}?action=summary`);
        const result = await res.json();
        list.innerHTML = '<h6 class="fw-bold mb-3 text-secondary">MMK SUMMARY OVERVIEW</h6>';
        
        result.details.forEach(item => {
            list.innerHTML += `
                <div class="record-card" style="border-left: 5px solid #0891b2; margin-bottom:10px;">
                    <div class="record-cat">${item.name}</div>
                    <div class="record-amt" style="color:#0891b2; font-weight:bold;">${item.total.toLocaleString()} MMK</div>
                </div>`;
        });
        document.getElementById('totalAmount').innerText = result.mmkGrandTotal.toLocaleString();
        document.getElementById('currencyText').innerText = "MMK";
        document.getElementById('sheetLabel').innerText = "GRAND TOTAL";
        toggleSidebar();
    } catch (e) { alert("Report ထုတ်မရပါ။"); form.style.display = 'block'; }
}

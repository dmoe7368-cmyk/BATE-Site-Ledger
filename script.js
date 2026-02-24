const WEB_APP_URL = "သင်၏_GOOGLE_APPS_SCRIPT_URL_ဒီမှာထည့်ပါ";
const correctPin = "1234";
let activeSheet = "ဆန်းဦး";

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('overlay');
    sb.classList.toggle('active');
    ov.style.display = sb.classList.contains('active') ? 'block' : 'none';
}

function checkLogin() {
    if(document.getElementById('pinInput').value === correctPin) {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('dateField').valueAsDate = new Date();
        loadData(activeSheet);
    } else { alert("Incorrect PIN!"); }
}

function changeSheet(name, curr, btn) {
    activeSheet = name;
    document.getElementById('formContainer').style.display = 'block';
    document.getElementById('headerTitle').innerText = "BATE SITE LEDGER";
    document.getElementById('sheetNameInput').value = name;
    document.getElementById('sheetLabel').innerText = name + " - အသုံးပြုမှု";
    document.getElementById('currencyText').innerText = curr === 'SGD' ? "Singapore Dollar (SGD)" : "Myanmar Kyats (MMK)";
    
    const card = document.getElementById('summaryCard');
    card.className = "summary-card";
    if(curr === 'SGD') card.classList.add('sg-theme');

    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    btn.classList.add('active');
    toggleSidebar();
    loadData(name);
}

async function loadData(name) {
    document.getElementById('historyList').innerHTML = "<p class='text-center py-5'>Data လာနေသည်...</p>";
    try {
        const res = await fetch(`${WEB_APP_URL}?action=get&sheet=${encodeURIComponent(name)}`);
        const data = await res.json();
        document.getElementById('totalAmount').innerText = data.total;
        let html = '';
        data.history.forEach(item => {
            html += `<div class="record-card">
                <div><b>${item.category}</b><br><small class="text-muted">${new Date(item.date).toLocaleDateString()}</small></div>
                <div class="fw-bold text-danger">${Number(item.amount).toLocaleString()}</div>
            </div>`;
        });
        document.getElementById('historyList').innerHTML = html || "<p class='text-center py-5'>မှတ်တမ်းမရှိသေးပါ</p>";
    } catch (e) { document.getElementById('historyList').innerHTML = "Error!"; }
}

async function showSummaryReport(btn) {
    toggleSidebar();
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('headerTitle').innerText = "SUMMARY REPORT";
    document.getElementById('sheetLabel').innerText = "အဖွဲ့အားလုံး၏ ကုန်ကျငွေ စုစုပေါင်း";
    document.getElementById('summaryCard').className = "summary-card report-theme";
    document.getElementById('historyList').innerHTML = "<p class='text-center py-5'>Report တွက်ချက်နေသည်...</p>";

    try {
        const res = await fetch(`${WEB_APP_URL}?action=summary`);
        const data = await res.json();
        document.getElementById('totalAmount').innerText = data.grandTotal;
        let html = '<div class="card border-0 shadow-sm p-3 bg-white" style="border-radius:15px;">';
        data.details.forEach(item => {
            html += `<div class="d-flex justify-content-between py-2 border-bottom">
                <span>${item.name}</span>
                <span class="fw-bold text-primary">${item.total.toLocaleString()}</span>
            </div>`;
        });
        html += '</div>';
        document.getElementById('historyList').innerHTML = html;
    } catch (e) { alert("Report error!"); }
}

document.getElementById('entryForm').onsubmit = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "သိမ်းနေသည်..."; btn.disabled = true;
    const params = new URLSearchParams(new FormData(this)).toString();
    try {
        await fetch(`${WEB_APP_URL}?action=save&${params}`, {method:'POST'});
        this.reset(); document.getElementById('dateField').valueAsDate = new Date();
        loadData(activeSheet);
    } catch(e) { alert("Save Error!"); }
    btn.innerText = "စာရင်းသွင်းမည်"; btn.disabled = false;
};

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxvIS1z5vSaaRDGaEYcUUovrHTEAIlnfu8KAzYgTiS2hv2F-jh66XFAvf0OSSgVAT46/exec"; 

// ၁။ Login စစ်ဆေးခြင်း
function checkLogin() {
    const pin = document.getElementById('pinInput').value;
    if (pin === "1234") { // PIN နံပါတ်ကို ဤနေရာတွင် ပြင်နိုင်သည်
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.body.style.overflow = 'auto';
        loadData(); // App ပွင့်လျှင် Data စဖတ်မည်
    } else {
        alert("PIN မှားယွင်းနေပါသည်။");
    }
}

// ၂။ Sidebar အဖွင့်အပိတ်
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    const overlay = document.getElementById('overlay');
    overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
}

// ၃။ Sheet ပြောင်းခြင်း
function changeSheet(name, currency, element) {
    document.getElementById('sheetNameInput').value = name;
    document.getElementById('headerTitle').innerText = name;
    document.getElementById('currencyText').innerText = currency;
    document.getElementById('sheetLabel').innerText = name + " USAGE";
    
    // UI အပြောင်းအလဲ
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    
    // Theme အရောင်ပြောင်းခြင်း
    const card = document.getElementById('summaryCard');
    card.className = 'summary-card shadow-lg';
    if (currency === 'SGD') card.classList.add('sg-theme');

    toggleSidebar();
    loadData(); // Sheet ပြောင်းတိုင်း Data အသစ်ဖတ်မည်
}

// ၄။ Google Sheets ထံမှ Data ဖတ်ခြင်း
async function loadData() {
    const sheetName = document.getElementById('sheetNameInput').value;
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        const response = await fetch(`${WEB_APP_URL}?sheetName=${encodeURIComponent(sheetName)}`);
        const data = await response.json();
        
        let total = 0;
        historyList.innerHTML = '';
        
        data.forEach(item => {
            total += parseFloat(item.amount);
            historyList.innerHTML += `
                <div class="record-card">
                    <div>
                        <div class="record-cat">${item.category}</div>
                        <div class="record-date">${item.date}</div>
                    </div>
                    <div class="record-amt">${Number(item.amount).toLocaleString()}</div>
                </div>
            `;
        });

        document.getElementById('totalAmount').innerText = total.toLocaleString();
        document.getElementById('recordCount').innerText = data.length + " Items";
    } catch (error) {
        historyList.innerHTML = '<div class="text-center text-danger p-4">Data ဖတ်၍မရပါ။ URL ကိုစစ်ပါ။</div>';
    }
}

// ၅။ စာရင်းအသစ်သွင်းခြင်း
document.getElementById('entryForm').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING...';

    const formData = new FormData(e.target);
    
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: new URLSearchParams(formData)
        });
        e.target.reset();
        alert("စာရင်းသွင်းပြီးပါပြီ။");
        loadData(); // Update list
    } catch (error) {
        alert("Error: ပို့၍မရပါ။");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i> SUBMIT DATA';
    }
};

// ၆။ Summary Report ထုတ်ခြင်း
async function showSummaryReport(element) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Generating Report...</div>';
    
    try {
        const response = await fetch(WEB_APP_URL + "?sheetName=SUMMARY_REPORT_ACTION", { method: 'POST' });
        const data = await response.json();
        
        historyList.innerHTML = '<h5 class="fw-bold mb-3">Summary Overview</h5>';
        data.forEach(item => {
            historyList.innerHTML += `
                <div class="record-card" style="border-left-color: #0891b2">
                    <div class="record-cat">${item.name}</div>
                    <div class="record-amt" style="color: #0891b2">${Number(item.total).toLocaleString()}</div>
                </div>
            `;
        });
        toggleSidebar();
    } catch (error) {
        alert("Report ထုတ်မရပါ။");
    }
}

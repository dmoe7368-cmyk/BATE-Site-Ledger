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
    // Form နဲ့ List ကို ပြန်ပြမယ်
    document.getElementById('formContainer').style.display = 'block';
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
    historyList.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        const response = await fetch(`${WEB_APP_URL}?sheetName=${encodeURIComponent(sheetName)}`);
        const data = await response.json();
        
        let total = 0;
        historyList.innerHTML = '';
        
        if (data.length === 0) {
            historyList.innerHTML = '<div class="text-center p-4">ဒေတာ မရှိသေးပါ။</div>';
        } else {
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
        }

        document.getElementById('totalAmount').innerText = total.toLocaleString();
        document.getElementById('recordCount').innerText = data.length + " Items";
    } catch (error) {
        historyList.innerHTML = '<div class="text-center text-danger p-4">ဒေတာဆွဲယူရာတွင် အမှားအယွင်းရှိပါသည်။</div>';
    }
}

document.getElementById('entryForm').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING...';

    const formData = new FormData(e.target);
    const params = new URLSearchParams();
    for (const pair of formData.entries()) {
        params.append(pair[0], pair[1]);
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

// --- SUMMARY REPORT ပြင်ဆင်ချက် ---
async function showSummaryReport(element) {
    const historyList = document.getElementById('historyList');
    const formContainer = document.getElementById('formContainer'); // Form ရှိတဲ့ div ကို ဖျောက်မယ်

    formContainer.style.display = 'none'; 
    historyList.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Generating Report...</div>';
    
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('headerTitle').innerText = "ALL GROUPS SUMMARY";

    try {
        // SUMMARY_REPORT_ACTION ကို POST အစား URL မှာ action အနေနဲ့ ပို့ကြည့်ပါ
        const response = await fetch(`${WEB_APP_URL}?action=summary`);
        const result = await response.json(); 
        
        historyList.innerHTML = '<h6 class="fw-bold mb-3 text-secondary">MMK SUMMARY OVERVIEW</h6>';
        
        result.details.forEach(item => {
            historyList.innerHTML += `
                <div class="record-card" style="border-left: 5px solid #0891b2; margin-bottom: 10px;">
                    <div class="record-cat" style="font-size: 1rem;">${item.name}</div>
                    <div class="record-amt" style="color: #0891b2; font-weight: bold;">
                        ${item.total.toLocaleString()} <small style="font-size: 0.6rem">MMK</small>
                    </div>
                </div>
            `;
        });

        document.getElementById('totalAmount').innerText = result.mmkGrandTotal.toLocaleString();
        document.getElementById('currencyText').innerText = "MMK";
        document.getElementById('sheetLabel').innerText = "GRAND TOTAL (MMK)";
        document.getElementById('recordCount').innerText = result.details.length + " Groups";
        
        toggleSidebar();
    } catch (error) {
        console.error(error);
        alert("Report ထုတ်မရပါ။ Formula Sheet ပြင်ဆင်ထားမှု ရှိမရှိ စစ်ဆေးပါ။");
        formContainer.style.display = 'block';
    }
}

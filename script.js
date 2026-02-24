const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxvIS1z5vSaaRDGaEYcUUovrHTEAIlnfu8KAzYgTiS2hv2F-jh66XFAvf0OSSgVAT46/exec"; 

// ယနေ့ရက်စွဲကို Local Format (YYYY-MM-DD) ဖြင့် ရယူရန် Function
function getTodayLocal() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000; // local offset
    const localISOTime = (new Date(now - offset)).toISOString().split('T')[0];
    return localISOTime;
}

// ၁။ Login စစ်ဆေးခြင်း
function checkLogin() {
    const pin = document.getElementById('pinInput').value;
    if (pin === "1234") { 
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.body.style.overflow = 'auto';
        
        // ယနေ့ရက်စွဲကို Calendar တွင် Local အချိန်အတိုင်း သတ်မှတ်ရန်
        document.getElementById('dateField').value = getTodayLocal();
        
        loadData(); 
    } else {
        alert("PIN မှားယွင်းနေပါသည်။");
    }
}

// ၂။ Sidebar အဖွင့်အပိတ်
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('active');
    overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
}

// ၃။ Sheet ပြောင်းခြင်း
function changeSheet(name, currency, element) {
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
        historyList.innerHTML = '<div class="text-center text-danger p-4">ဒေတာ မရှိသေးပါ သို့မဟုတ် URL ကိုစစ်ပါ။</div>';
    }
}

// ၅။ စာရင်းအသစ်သွင်းခြင်း (Timezone ကင်းလွတ်သော ရက်စွဲပြင်ဆင်မှု)
document.getElementById('entryForm').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING...';

    // ရက်စွဲ format ကို input မှ တိုက်ရိုက်ယူပြီး DD/MM/YYYY ပြောင်းခြင်း
    const rawDate = document.getElementById('dateField').value; // YYYY-MM-DD
    let formattedDate = "";
    if(rawDate) {
        const parts = rawDate.split("-"); 
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }

    const formData = new FormData(e.target);
    const params = new URLSearchParams();
    
    for (const pair of formData.entries()) {
        if(pair[0] === 'date') {
            params.append('date', formattedDate); 
        } else {
            params.append(pair[0], pair[1]);
        }
    }
    
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: params
        });
        e.target.reset();
        
        // Reset လုပ်ပြီးလျှင် Local ရက်စွဲကို ပြန်ဖြည့်ထားပေးရန်
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

// ၆။ Summary Report ထုတ်ခြင်း
async function showSummaryReport(element) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Generating Report...</div>';
    
    try {
        const response = await fetch(WEB_APP_URL + "?sheetName=SUMMARY_REPORT_ACTION", { method: 'POST' });
        const data = await response.json();
        
        historyList.innerHTML = '<h5 class="fw-bold mb-3 text-primary"><i class="fas fa-file-contract me-2"></i>Summary Overview</h5>';
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

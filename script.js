const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby99lAphFNkCL9ep-2XmzV0HYoYcFKECQdjio4YBjMerguv7diEe9_g2Nozatg29XwJ/exec"; 

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
    // Summary ကြည့်ပြီးပြန်လာလျှင် Form ပြန်ပြရန်
    document.getElementById('entryForm').parentElement.style.display = 'block';
    
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

// ၅။ စာရင်းအသစ်သွင်းခြင်း
document.getElementById('entryForm').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING...';

    const rawDate = document.getElementById('dateField').value;
    let formattedDate = "";
    if(rawDate) {
        const parts = rawDate.split("-"); 
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
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

// ၆။ Summary Report ထုတ်ခြင်း (FIXED: Bar/UI ပြဿနာ ဖြေရှင်းပြီး)
async function showSummaryReport(element) {
    const historyList = document.getElementById('historyList');
    const formContainer = document.getElementById('entryForm').parentElement; // Form အကွက်ကို ယူသည်

    // UI အပြောင်းအလဲ - Form ကို ခေတ္တဖျောက်မည်
    formContainer.style.display = 'none';
    historyList.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Generating Report...</div>';
    
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('headerTitle').innerText = "ALL GROUPS SUMMARY";

    try {
        const response = await fetch(WEB_APP_URL + "?sheetName=SUMMARY_REPORT_ACTION", { method: 'POST' });
        const data = await response.json();
        
        historyList.innerHTML = '<h5 class="fw-bold mb-3 text-primary"><i class="fas fa-file-contract me-2"></i>Summary Overview</h5>';
        let grandTotal = 0;

        data.forEach(item => {
            const amt = parseFloat(item.total) || 0;
            grandTotal += amt;
            historyList.innerHTML += `
                <div class="record-card" style="border-left: 5px solid #0891b2; margin-bottom: 10px;">
                    <div class="record-cat" style="font-size: 1.1rem;">${item.name}</div>
                    <div class="record-amt" style="color: #0891b2; font-weight: bold;">${amt.toLocaleString()}</div>
                </div>
            `;
        });

        // ထိပ်ဆုံးက Total Card မှာ Grand Total ပြရန်
        document.getElementById('totalAmount').innerText = grandTotal.toLocaleString();
        document.getElementById('sheetLabel').innerText = "ALL GROUPS TOTAL";
        document.getElementById('currencyText').innerText = "MMK";
        
        toggleSidebar();
    } catch (error) {
        console.error(error);
        alert("Report ထုတ်မရပါ။");
        formContainer.style.display = 'block'; // Error တက်လျှင် Form ပြန်ပြမည်
    }
}

// 1. Supabase Connection
const supabaseUrl = 'https://zicpxxyoyavgmvephgus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppY3B4eHlveWF2Z212ZXBoZ3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzEzMTYsImV4cCI6MjA4NzI0NzMxNn0.VxszlGUB3ANLEFS6rZtSHS9h-dP5-4fIiSV6PMIFNJQ';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let editingId = null;

window.onload = function () {
    renderSalesList();
    resetInvoice("2025-26-001");
};

// --- ROW MANAGEMENT ---
function addNewRow(data = null) {
    const tbody = document.getElementById('itemsBody');
    if (!tbody) return;
    const srNo = tbody.rows.length + 1;
    const row = `<tr class="item-row">
        <td>${srNo}</td>
        <td contenteditable="true" style="text-align: left;" class="item-name" onkeydown="handleBackspace(event, this)">${data ? data.name : ''}</td>
        <td contenteditable="true" class="item-hsn">${data ? data.hsn : ''}</td>
        <td contenteditable="true" class="qty">${data ? data.qty : ''}</td>
        <td contenteditable="true" class="rate">${data ? data.rate : ''}</td>
        <td class="amount">0.00</td>
    </tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
    setupListeners();
}

function handleBackspace(event, element) {
    if (event.key === "Backspace" && element.innerText.trim() === "") {
        const row = element.closest('tr');
        const tbody = row.parentElement;
        if (tbody.rows.length > 1) {
            event.preventDefault();
            const prevRow = row.previousElementSibling;
            if (prevRow) prevRow.querySelector('.item-name').focus();
            row.remove();
            updateSerialNumbers();
            calculateInvoice();
        }
    }
}

function updateSerialNumbers() {
    document.querySelectorAll('#itemsBody tr').forEach((row, index) => {
        row.cells[0].innerText = index + 1;
    });
}

function setupListeners() {
    document.querySelectorAll('[contenteditable="true"]').forEach(cell => {
        cell.onblur = () => calculateInvoice();
    });
}

// --- CALCULATIONS ---
function calculateInvoice() {
    let subTotal = 0;
    let hsnGroups = {};

    document.querySelectorAll('#itemsBody tr').forEach(row => {
        const hsn = row.querySelector('.item-hsn').innerText.trim();
        const qty = parseFloat(row.querySelector('.qty').innerText) || 0;
        const rate = parseFloat(row.querySelector('.rate').innerText) || 0;
        const amount = qty * rate;

        row.querySelector('.amount').innerText = amount.toFixed(2);
        subTotal += amount;

        if (hsn !== "") {
            hsnGroups[hsn] = (hsnGroups[hsn] || 0) + amount;
        }
    });

    const subTotalEl = document.getElementById('subTotalVal');
    if (subTotalEl) subTotalEl.innerText = subTotal.toFixed(2);
    updateGstTable(hsnGroups, subTotal);
}

function updateGstTable(hsnGroups, subTotal) {
    const gstBody = document.getElementById('gstBody');
    if (!gstBody) return;

    let existingRates = {};
    document.querySelectorAll('#gstBody tr').forEach(row => {
        existingRates[row.cells[0].innerText] = row.cells[1].innerText;
    });

    gstBody.innerHTML = "";
    let totalTax = 0;

    Object.keys(hsnGroups).forEach(hsn => {
        let rate = existingRates[hsn] || "0";
        let taxable = hsnGroups[hsn];
        let taxAmt = (taxable * parseFloat(rate)) / 100;
        totalTax += (taxAmt * 2);

        const row = `<tr>
            <td>${hsn}</td>
            <td contenteditable="true" class="cgst-p">${rate}</td>
            <td>${taxAmt.toFixed(2)}</td>
            <td class="sgst-p">${rate}</td>
            <td>${taxAmt.toFixed(2)}</td>
            <td>${(taxAmt * 2).toFixed(2)}</td>
        </tr>`;
        gstBody.insertAdjacentHTML('beforeend', row);
    });

    setupTaxListeners();

    // --- GRAND TOTAL & ROUND OFF LOGIC ---
    let grandTotal = subTotal + totalTax;
    const isRoundOffOn = document.getElementById('roundOffToggle').checked;
    const roundOffRow = document.getElementById('roundOffRow');
    const roundOffValEl = document.getElementById('roundOffVal');

    if (isRoundOffOn) {
        let roundedTotal = Math.round(grandTotal);
        let roundOffDiff = roundedTotal - grandTotal;
        grandTotal = roundedTotal;

        if (roundOffRow) roundOffRow.style.display = "table-row";
        if (roundOffValEl) roundOffValEl.innerText = roundOffDiff.toFixed(2);
    } else {
        if (roundOffRow) roundOffRow.style.display = "none";
    }

    const taxSumEl = document.getElementById('totalTaxSumVal');
    const grandTotalEl = document.getElementById('grandTotalVal');

    if (taxSumEl) taxSumEl.innerText = totalTax.toFixed(2);
    if (grandTotalEl) {
        grandTotalEl.innerText = "₹ " + grandTotal.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Words Conversion
    const gstWords = document.getElementById('gstWords');
    const grandWords = document.getElementById('grandWords');
    if (gstWords) gstWords.innerText = numberToWords(Math.round(totalTax)) + " RUPEES ONLY";
    if (grandWords) grandWords.innerText = numberToWords(Math.round(grandTotal)) + " RUPEES ONLY";
}

function setupTaxListeners() {
    document.querySelectorAll('.cgst-p').forEach(cell => {
        cell.oninput = (e) => {
            const row = e.target.closest('tr');
            row.querySelector('.sgst-p').innerText = e.target.innerText;
        };
        cell.onblur = () => calculateInvoice();
    });
}

// --- CLOUD STORAGE ---
async function saveInvoice() {
    const clientEl = document.querySelector('.grid-left .grid-row:nth-child(1) .field');
    const invNoEl = document.querySelector('.grid-right .grid-row:nth-child(1) .field');
    const dateEl = document.querySelector('.grid-right .grid-row:nth-child(2) .field');
    const addrEl = document.querySelector('.grid-left .grid-row:nth-child(3) .field');

    if (!clientEl || clientEl.innerText.trim() === "") { alert("Bhai, Client Name toh dalo!"); return; }

    const invoiceData = {
        items: Array.from(document.querySelectorAll('#itemsBody tr')).map(row => ({
            name: row.querySelector('.item-name').innerText,
            hsn: row.querySelector('.item-hsn').innerText,
            qty: row.querySelector('.qty').innerText,
            rate: row.querySelector('.rate').innerText
        })).filter(i => i.name.trim() !== ""),
        total: document.getElementById('grandTotalVal').innerText,
        gstTotal: document.getElementById('totalTaxSumVal').innerText,
        date: dateEl ? dateEl.innerText : "",
        address: addrEl ? addrEl.innerText : ""
    };

    if (editingId) {
        await supabaseClient.from('invoices').update({
            invoice_no: invNoEl.innerText,
            client_name: clientEl.innerText,
            invoice_data: invoiceData
        }).eq('id', editingId);
        alert("Updated! ✅");
    } else {
        await supabaseClient.from('invoices').insert([{
            invoice_no: invNoEl.innerText,
            client_name: clientEl.innerText,
            invoice_data: invoiceData
        }]);
        alert("Saved! ☁️");
    }

    editingId = null;
    await renderSalesList();
    resetInvoice(generateNextInvoiceNo(invNoEl.innerText));
}

async function renderSalesList() {
    const list = document.getElementById('salesList');
    if (!list) return;

    const { data } = await supabaseClient.from('invoices').select('*').order('created_at', { ascending: false });

    if (data) {
        list.innerHTML = data.map(item => `
            <div class="sales-card" style="background:#fff; border:1px solid #ddd; padding:10px; margin-bottom:8px; border-radius:6px;">
                <div style="font-weight:700;">${item.client_name}</div>
                <div style="font-size:11px;">No: ${item.invoice_no} | ${item.invoice_data.total}</div>
                <div style="margin-top:5px;">
                    <button onclick="editInvoice('${item.id}')" style="cursor:pointer;">✏️</button>
                    <button onclick="deleteInvoice('${item.id}')" style="cursor:pointer; color:red;">🗑️</button>
                </div>
            </div>
        `).join('');
    }
}

async function editInvoice(id) {
    const { data } = await supabaseClient.from('invoices').select('*').eq('id', id).single();
    if (!data) return;

    editingId = id;
    const invData = data.invoice_data;

    document.querySelector('.grid-left .grid-row:nth-child(1) .field').innerText = data.client_name;
    document.querySelector('.grid-left .grid-row:nth-child(3) .field').innerText = invData.address || "";
    document.querySelector('.grid-right .grid-row:nth-child(1) .field').innerText = data.invoice_no;
    document.querySelector('.grid-right .grid-row:nth-child(2) .field').innerText = invData.date || "";

    const tbody = document.getElementById('itemsBody');
    tbody.innerHTML = "";
    invData.items.forEach(item => addNewRow(item));
    while (tbody.rows.length < 10) addNewRow();

    const saveBtn = document.getElementById('main-save-btn');
    if (saveBtn) saveBtn.innerHTML = "UPDATE INVOICE";
    calculateInvoice();
}

async function deleteInvoice(id) {
    if (confirm("Delete karein?")) {
        await supabaseClient.from('invoices').delete().eq('id', id);
        renderSalesList();
    }
}

// --- HELPERS ---
function resetInvoice(nextNumber = "") {
    editingId = null;
    const saveBtn = document.getElementById('main-save-btn');
    if (saveBtn) saveBtn.innerHTML = "SAVE TO REGISTER";

    document.querySelectorAll('.billing-grid .field').forEach(f => f.innerText = "");
    if (nextNumber) {
        const invField = document.querySelector('.grid-right .grid-row:nth-child(1) .field');
        if (invField) invField.innerText = nextNumber;
    }

    const tbody = document.getElementById('itemsBody');
    if (tbody) {
        tbody.innerHTML = "";
        for (let i = 1; i <= 10; i++) addNewRow();
    }
    calculateInvoice();
}

function generateNextInvoiceNo(curr) {
    let parts = curr.split('-');
    let last = parts[parts.length - 1];
    if (!isNaN(last)) {
        parts[parts.length - 1] = (parseInt(last) + 1).toString().padStart(last.length, '0');
        return parts.join('-');
    }
    return curr;
}

function numberToWords(num) {
    if (num === 0) return 'ZERO';
    const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
    const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'CRORE ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'LAKH ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'THOUSAND ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'HUNDRED ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'AND ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
}

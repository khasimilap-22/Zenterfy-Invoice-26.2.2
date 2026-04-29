// 1. Supabase Connection
const supabaseUrl = 'https://zicpxxyoyavgmvephgus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppY3B4eHlveWF2Z212ZXBoZ3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzEzMTYsImV4cCI6MjA4NzI0NzMxNn0.VxszlGUB3ANLEFS6rZtSHS9h-dP5-4fIiSV6PMIFNJQ';
const supabaseClient = supabase.createClient(s// --- Supabase Setup ---
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://uxhualclugoipshiilsu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aHVhbGNsdWdvaXBzaGlpbHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTM4MDksImV4cCI6MjA5MTU2OTgwOX0.3L1hJyeinykZty-VKWs1zrACGg-aAUkiOE7_9cuV7VU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Configuration ---
const INITIAL_ROWS = 10;
const TAX_OPTIONS = [0, 5, 12, 18, 28];

const state = {
    items: []
};

document.getElementById('save-btn').onclick = async () => {
    const dataToInsert = {
        // Invoice details
        invoice_number: document.getElementById('billNumber').value,
        date: document.getElementById('dated').value,
        customer: document.getElementById('billTo').value,

        // First item (basic version)
        item_name: state.items[0]?.particulars || "",
        hsn_code: state.items[0]?.hsn || "",
        rate: state.items[0]?.rate || 0,
        qty: state.items[0]?.qty || 0,
        amount: state.items[0]?.amount || 0,

        // Discount (abhi static)
        discount_percent: 0,
        discounted_amount: 0,

        // GST
        gst_percent: state.items[0]?.tax || 0,
        gst_amount: (state.items[0]?.cgst || 0) + (state.items[0]?.sgst || 0),

        cgst: state.items[0]?.cgst || 0,
        sgst: state.items[0]?.sgst || 0,

        // Final total
        net_bill: parseFloat(document.getElementById('grand-total').textContent) || 0,

        // Extra fields
        status: "Pending",
        gst_enabled: true,
        payments: []
    };

    const { data, error } = await supabase
        .from('sales_entries')
        .insert([dataToInsert]);

    if (error) {
        console.error("Error saving:", error);
        alert("Error saving invoice");
    } else {
        console.log("Saved:", data);
        alert("Invoice saved successfully");
    }
};

// --- Number to Words ---
function numberToWords(amount) {
    const words = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    function convert(n) {
        if (n < 20) return words[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + words[n % 10] : "");
        if (n < 1000) return words[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
        if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
        if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
        return "";
    }
    
    let num = Math.floor(amount);
    if (num === 0) return "Zero Rupees Only";
    return convert(num) + " Rupees Only";
}

// --- Logic ---
function initRows() {
    state.items = [];
    const body = document.getElementById('items-body');
    body.innerHTML = '';
    for (let i = 0; i < INITIAL_ROWS; i++) {
        addRow();
    }
}

function addRow() {
    const body = document.getElementById('items-body');
    const index = state.items.length;
    const item = { sr: index + 1, particulars: '', hsn: '', qty: 0, rate: 0, tax: 0, amount: 0, cgst: 0, sgst: 0, total: 0 };
    state.items.push(item);

    const tr = document.createElement('tr');
    tr.className = 'border-b border-black h-8';
    tr.innerHTML = `
        <td class="border-r border-black text-center p-1">${item.sr}</td>
        <td class="border-r border-black p-1"><input class="w-full outline-none p-val" data-idx="${index}"></td>
        <td class="border-r border-black p-1"><input class="w-full outline-none text-center hsn-val" data-idx="${index}"></td>
        <td class="border-r border-black p-1"><input type="number" class="w-full outline-none text-center qty-val" data-idx="${index}"></td>
        <td class="border-r border-black p-1"><input type="number" class="w-full outline-none text-right rate-val" data-idx="${index}"></td>
        <td class="border-r border-black p-1 text-right amt-cell">0.00</td>
        <td class="border-r border-black p-1">
            <select class="w-full bg-transparent tax-val" data-idx="${index}">
                ${TAX_OPTIONS.map(t => `<option value="${t}" ${t === 0 ? 'selected' : ''}>${t}%</option>`).join('')}
            </select>
        </td>
        <td class="border-r border-black p-1 text-right cgst-cell">0.00</td>
        <td class="border-r border-black p-1 text-right sgst-cell">0.00</td>
        <td class="p-1 text-right font-bold total-cell">0.00</td>
    `;
    body.appendChild(tr);
    attachListeners(tr, index);
}

function attachListeners(row, idx) {
    row.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', (e) => {
            const val = e.target.value;
            if (el.classList.contains('qty-val')) state.items[idx].qty = parseFloat(val) || 0;
            if (el.classList.contains('rate-val')) state.items[idx].rate = parseFloat(val) || 0;
            if (el.classList.contains('tax-val')) state.items[idx].tax = parseFloat(val) || 0;
            if (el.classList.contains('p-val')) state.items[idx].particulars = val;
            if (el.classList.contains('hsn-val')) state.items[idx].hsn = val;
            updateCalculations(idx);
        });
    });
}

function updateCalculations(idx) {
    const item = state.items[idx];
    const amount = item.qty * item.rate;
    const taxAmt = (amount * item.tax) / 100;
    
    item.amount = amount;
    item.cgst = taxAmt / 2;
    item.sgst = taxAmt / 2;
    item.total = amount + taxAmt;

    const row = document.getElementById('items-body').children[idx];
    row.querySelector('.amt-cell').textContent = amount.toFixed(2);
    row.querySelector('.cgst-cell').textContent = item.cgst.toFixed(2);
    row.querySelector('.sgst-cell').textContent = item.sgst.toFixed(2);
    row.querySelector('.total-cell').textContent = item.total.toFixed(2);

    calculateGrandTotal();
}

function calculateGrandTotal() {
    let tQty = 0, tAmt = 0, tCgst = 0, tSgst = 0, tTotal = 0;

    state.items.forEach(item => {
        tQty += item.qty;
        tAmt += item.amount;
        tCgst += item.cgst;
        tSgst += item.sgst;
        tTotal += item.total;
    });

    // --- NEW: GST Amount Calculation (CGST + SGST) ---
    const totalGstCombined = tCgst + tSgst;

    const grandFinal = Math.round(tTotal);
    const roundOff = grandFinal - tTotal;

    document.getElementById('total-qty').textContent = tQty;
    document.getElementById('sub-total').textContent = tAmt.toFixed(2);
    document.getElementById('total-cgst').textContent = tCgst.toFixed(2);
    document.getElementById('total-sgst').textContent = tSgst.toFixed(2);
    document.getElementById('table-grand-total').textContent = tTotal.toFixed(2);
    
    // Summary Box Updates
    const summaryGstEl = document.getElementById('summary-total-gst');
    if (summaryGstEl) summaryGstEl.textContent = totalGstCombined.toFixed(2);
    
    document.getElementById('round-off-value').textContent = roundOff.toFixed(2);
    document.getElementById('grand-total').textContent = grandFinal.toFixed(2);
    document.getElementById('grand-total-words').textContent = numberToWords(grandFinal);
}

// --- Events ---
document.getElementById('add-row-btn').onclick = addRow;
document.getElementById('print-btn').onclick = () => window.print();
document.getElementById('reset-btn').onclick = initRows;

// Launch
initRows();upabaseUrl, supabaseKey);

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

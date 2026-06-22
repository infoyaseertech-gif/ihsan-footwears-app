/* ═══════════════════════════════════════════
   IHSAN FOOTWEARS — App Logic (app.js)
   Built by YaseerTech · Abuja, Nigeria
═══════════════════════════════════════════ */

'use strict';

// ── STATE ──────────────────────────────────────────
let deferredPWAPrompt = null;
let currentPIN = '';
let enteredPIN = '';
let currentPage = 'dashboard';
let creditPayTarget = null;
let reportData = null;
let settings = {};

// ── DATA STORE ─────────────────────────────────────
function loadData(key, def = []) {
  try { return JSON.parse(localStorage.getItem('ihsan_' + key)) ?? def; } catch { return def; }
}
function saveData(key, val) {
  localStorage.setItem('ihsan_' + key, JSON.stringify(val));
}

function getData() {
  return {
    sales:     loadData('sales', []),
    expenses:  loadData('expenses', []),
    stock:     loadData('stock', []),
    restocks:  loadData('restocks', []),
    credits:   loadData('credits', []),
    customers: loadData('customers', []),
    suppliers: loadData('suppliers', []),
  };
}

// ── BOOT ───────────────────────────────────────────
window.addEventListener('load', () => {
  settings = loadData('settings', { pin: '1234', lowStock: 5, bizName: 'IHSAN Footwears & General Enterprises', owner: '', phone: '', address: '' });
  currentPIN = settings.pin || '1234';
  setHeaderDate();
  setGreeting();
  checkPWAInstall();
  loadSettings();

  document.getElementById('sale-payment').addEventListener('change', function () {
    document.getElementById('part-pay-row').style.display = this.value === 'part' ? 'block' : 'none';
  });
});

// ── DATE / GREETING ────────────────────────────────
function setHeaderDate() {
  const el = document.getElementById('header-date');
  const now = new Date();
  el.textContent = now.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function setGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const name = settings.owner ? `, ${settings.owner.split(' ')[0]}` : '';
  document.getElementById('dash-greeting').textContent = `${g}${name} 👋`;
}

function fmtNGN(n) {
  return '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 });
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}
function today() { return new Date().toISOString().slice(0, 10); }
function isToday(iso) { return iso && iso.slice(0, 10) === today(); }
function isThisWeek(iso) {
  if (!iso) return false;
  const d = new Date(iso), now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  start.setHours(0,0,0,0);
  return d >= start;
}
function isThisMonth(iso) {
  if (!iso) return false;
  const d = new Date(iso), now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

// ── PWA INSTALL ────────────────────────────────────
function checkPWAInstall() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const dismissed = localStorage.getItem('ihsan_pwa_dismissed');
  if (isStandalone || dismissed) return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPWAPrompt = e;
    showPWAPopup(false);
  });

  if (isIOS) {
    setTimeout(() => showPWAPopup(true), 1800);
  }
}

function showPWAPopup(isIOS) {
  const overlay = document.getElementById('pwa-overlay');
  overlay.classList.remove('hidden');
  if (isIOS) {
    document.getElementById('pwa-ios-steps').style.display = 'block';
    document.getElementById('pwa-android-actions').style.display = 'none';
    document.getElementById('pwa-ios-actions').style.display = 'flex';
  }
  document.getElementById('pwa-install-btn').onclick = async () => {
    if (!deferredPWAPrompt) return;
    deferredPWAPrompt.prompt();
    const { outcome } = await deferredPWAPrompt.userChoice;
    if (outcome === 'accepted') showToast('App installed successfully!');
    deferredPWAPrompt = null;
    hidePWAPopup();
  };
  document.getElementById('pwa-later-btn').onclick = hidePWAPopup;
  document.getElementById('pwa-ios-close-btn') && (document.getElementById('pwa-ios-close-btn').onclick = hidePWAPopup);
}
function hidePWAPopup() {
  document.getElementById('pwa-overlay').classList.add('hidden');
  localStorage.setItem('ihsan_pwa_dismissed', '1');
}
function installPWA() {
  if (deferredPWAPrompt) {
    deferredPWAPrompt.prompt();
  } else {
    showToast('Open in Chrome/Edge and use browser menu to install');
  }
}

// ── PIN ────────────────────────────────────────────
function pinInput(digit) {
  if (enteredPIN.length >= 4) return;
  enteredPIN += digit;
  updatePinDots();
  if (enteredPIN.length === 4) setTimeout(checkPIN, 120);
}
function pinDel() {
  enteredPIN = enteredPIN.slice(0, -1);
  updatePinDots();
  document.getElementById('pin-error').textContent = '';
  document.querySelectorAll('.pin-dot').forEach(d => d.classList.remove('error'));
}
function updatePinDots() {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('d' + i);
    dot.classList.toggle('filled', i <= enteredPIN.length);
    dot.classList.remove('error');
  }
}
function checkPIN() {
  if (enteredPIN === currentPIN) {
    document.getElementById('pin-screen').style.display = 'none';
    document.getElementById('app').classList.remove('hidden');
    refreshDashboard();
    checkNotifications();
    // Show PWA prompt slightly after login if available
    if (deferredPWAPrompt && !localStorage.getItem('ihsan_pwa_dismissed')) {
      setTimeout(() => showPWAPopup(false), 1500);
    }
  } else {
    document.querySelectorAll('.pin-dot').forEach(d => d.classList.add('error'));
    document.getElementById('pin-error').textContent = 'Incorrect PIN. Try again.';
    enteredPIN = '';
    setTimeout(() => {
      updatePinDots();
    }, 600);
  }
}
function changePin() {
  const old = document.getElementById('set-old-pin').value;
  const nw  = document.getElementById('set-new-pin').value;
  const cf  = document.getElementById('set-confirm-pin').value;
  if (old !== currentPIN) return showToast('Current PIN is incorrect');
  if (nw.length !== 4 || !/^\d{4}$/.test(nw)) return showToast('PIN must be exactly 4 digits');
  if (nw !== cf) return showToast('New PINs do not match');
  currentPIN = nw;
  settings.pin = nw;
  saveData('settings', settings);
  showToast('PIN updated successfully');
  document.getElementById('set-old-pin').value = '';
  document.getElementById('set-new-pin').value = '';
  document.getElementById('set-confirm-pin').value = '';
}

// ── NAVIGATION ────────────────────────────────────
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');
  currentPage = page;
  switch (page) {
    case 'dashboard': refreshDashboard(); break;
    case 'sales':     renderSales('today'); break;
    case 'stock':     renderStock(''); break;
    case 'expenses':  renderExpenses('today'); break;
    case 'credit':    renderCredit(''); break;
    case 'reports':   break;
    case 'customers': renderCustomers(''); break;
    case 'suppliers': renderSuppliers(''); break;
    case 'settings':  loadSettings(); break;
  }
}

function showMoreMenu() {
  document.getElementById('nav-more').classList.add('active');
  document.getElementById('more-menu').classList.remove('hidden');
}
function hideMoreMenu() {
  document.getElementById('nav-more').classList.remove('active');
  document.getElementById('more-menu').classList.add('hidden');
}

// ── MODALS ────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  refreshDataLists();
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function refreshDataLists() {
  const { stock, customers, suppliers } = getData();
  ['stock-datalist', 'stock-datalist2'].forEach(dlId => {
    const dl = document.getElementById(dlId);
    if (dl) dl.innerHTML = stock.map(s => `<option value="${s.name} (${s.colour||''} Sz ${s.size||''})">`).join('');
  });
  const cdl = document.getElementById('customer-datalist');
  if (cdl) cdl.innerHTML = customers.map(c => `<option value="${c.name}">`).join('');
  const sdl = document.getElementById('supplier-datalist');
  if (sdl) sdl.innerHTML = suppliers.map(s => `<option value="${s.name}">`).join('');
}

// ── RECORD SALE ────────────────────────────────────
function recordSale() {
  const item     = document.getElementById('sale-item').value.trim();
  const qty      = parseFloat(document.getElementById('sale-qty').value) || 1;
  const price    = parseFloat(document.getElementById('sale-price').value) || 0;
  const cost     = parseFloat(document.getElementById('sale-cost').value) || 0;
  const payment  = document.getElementById('sale-payment').value;
  const customer = document.getElementById('sale-customer').value.trim();
  const phone    = document.getElementById('sale-cust-phone').value.trim();
  const note     = document.getElementById('sale-note').value.trim();
  let partPaid   = payment === 'part' ? parseFloat(document.getElementById('sale-part-paid').value) || 0 : 0;

  if (!item) return showToast('Please enter item name');
  if (!price) return showToast('Please enter selling price');

  const total = qty * price;
  const totalCost = qty * cost;
  const sale = { id: uid(), item, qty, price, cost, totalCost, total, payment, customer, phone, note, partPaid, date: new Date().toISOString() };
  const sales = loadData('sales', []);
  sales.unshift(sale);
  saveData('sales', sales);

  // Deduct from stock
  const stock = loadData('stock', []);
  const si = stock.find(s => item.toLowerCase().startsWith(s.name.toLowerCase()));
  if (si) { si.qty = Math.max(0, (si.qty || 0) - qty); saveData('stock', stock); }

  // Auto-add to customers
  if (customer) autoAddCustomer(customer, phone);

  // If credit / part payment — add to credit tracker
  if (payment === 'credit') {
    addCreditEntry(customer || 'Unknown', phone, item, total, 0, '', note);
  } else if (payment === 'part') {
    const bal = total - partPaid;
    if (bal > 0) addCreditEntry(customer || 'Unknown', phone, item, total, partPaid, '', note);
  }

  // Show receipt
  showReceipt(sale);
  clearSaleForm();
  closeModal('modal-sale');
  showToast('Sale recorded!');
  if (currentPage === 'dashboard') refreshDashboard();
  if (currentPage === 'sales') renderSales(currentSaleFilter);
}

function clearSaleForm() {
  ['sale-item','sale-qty','sale-price','sale-cost','sale-customer','sale-cust-phone','sale-note','sale-part-paid'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'sale-qty' ? '1' : '';
  });
  document.getElementById('sale-payment').value = 'cash';
  document.getElementById('part-pay-row').style.display = 'none';
}

// ── RECEIPT ────────────────────────────────────────
function showReceipt(sale) {
  const biz = settings.bizName || 'IHSAN Footwears & General Enterprises';
  const bal = sale.payment === 'credit' ? sale.total : sale.payment === 'part' ? (sale.total - sale.partPaid) : 0;
  document.getElementById('receipt-body').innerHTML = `
    <div class="receipt">
      <div class="receipt-header">
        <div class="receipt-biz">${biz}</div>
        <div>${settings.phone || ''}</div>
        <div style="font-size:11px;margin-top:4px;">${fmtDate(sale.date)} · ${fmtTime(sale.date)}</div>
      </div>
      <div class="receipt-row"><span>Item</span><span>${sale.item}</span></div>
      <div class="receipt-row"><span>Qty</span><span>${sale.qty}</span></div>
      <div class="receipt-row"><span>Unit Price</span><span>${fmtNGN(sale.price)}</span></div>
      <hr class="receipt-divider"/>
      <div class="receipt-row receipt-total"><span>TOTAL</span><span>${fmtNGN(sale.total)}</span></div>
      <div class="receipt-row"><span>Payment</span><span>${sale.payment.toUpperCase()}</span></div>
      ${sale.payment === 'part' ? `<div class="receipt-row"><span>Paid</span><span>${fmtNGN(sale.partPaid)}</span></div>` : ''}
      ${bal > 0 ? `<div class="receipt-row" style="color:var(--red-main)"><span><strong>Balance Owed</strong></span><span><strong>${fmtNGN(bal)}</strong></span></div>` : ''}
      ${sale.customer ? `<div class="receipt-row"><span>Customer</span><span>${sale.customer}</span></div>` : ''}
      <hr class="receipt-divider"/>
      <div style="text-align:center;font-size:11px;margin-top:8px;">Thank you for your patronage!<br/>Built by YaseerTech</div>
    </div>`;
  window._lastReceiptSale = sale;
  openModal('modal-receipt');
}

function shareReceipt() {
  const sale = window._lastReceiptSale;
  if (!sale) return;
  const biz = settings.bizName || 'IHSAN Footwears';
  const bal = sale.payment === 'credit' ? sale.total : sale.payment === 'part' ? (sale.total - sale.partPaid) : 0;
  const msg = `*${biz}*\n` +
    `📦 ${sale.item} x${sale.qty}\n` +
    `💰 Total: ${fmtNGN(sale.total)}\n` +
    `💳 Payment: ${sale.payment.toUpperCase()}\n` +
    (bal > 0 ? `⚠️ Balance: ${fmtNGN(bal)}\n` : '') +
    `📅 ${fmtDate(sale.date)}\n` +
    `\n_Thank you for your patronage!_`;
  const url = `https://wa.me/${(sale.phone||'').replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ── ADD STOCK ITEM ─────────────────────────────────
function addStockItem() {
  const name   = document.getElementById('si-name').value.trim();
  const brand  = document.getElementById('si-brand').value.trim();
  const cat    = document.getElementById('si-category').value;
  const size   = document.getElementById('si-size').value.trim();
  const colour = document.getElementById('si-colour').value.trim();
  const qty    = parseFloat(document.getElementById('si-qty').value) || 0;
  const buy    = parseFloat(document.getElementById('si-buy').value) || 0;
  const sell   = parseFloat(document.getElementById('si-sell').value) || 0;
  if (!name) return showToast('Item name is required');
  if (!buy || !sell) return showToast('Please enter buying and selling prices');
  const stock = loadData('stock', []);
  stock.unshift({ id: uid(), name, brand, cat, size, colour, qty, buy, sell, date: new Date().toISOString() });
  saveData('stock', stock);
  ['si-name','si-brand','si-size','si-colour','si-buy','si-sell'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('si-qty').value = '1';
  closeModal('modal-stock-item');
  showToast('Stock item added');
  if (currentPage === 'stock') renderStock('');
}

// ── RESTOCK ────────────────────────────────────────
function recordRestock() {
  const item     = document.getElementById('rs-item').value.trim();
  const qty      = parseFloat(document.getElementById('rs-qty').value) || 0;
  const cost     = parseFloat(document.getElementById('rs-cost').value) || 0;
  const supplier = document.getElementById('rs-supplier').value.trim();
  const note     = document.getElementById('rs-note').value.trim();
  if (!item || !qty) return showToast('Item name and quantity are required');
  const rs = loadData('restocks', []);
  rs.unshift({ id: uid(), item, qty, cost, supplier, note, date: new Date().toISOString() });
  saveData('restocks', rs);

  // Update stock qty
  const stock = loadData('stock', []);
  const si = stock.find(s => s.name.toLowerCase() === item.toLowerCase() || item.toLowerCase().startsWith(s.name.toLowerCase()));
  if (si) { si.qty = (si.qty || 0) + qty; saveData('stock', stock); }

  ['rs-item','rs-qty','rs-cost','rs-supplier','rs-note'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('rs-qty').value = '1';
  closeModal('modal-restock');
  showToast('Restock recorded');
  if (currentPage === 'stock') renderStock('');
  if (currentPage === 'dashboard') refreshDashboard();
}

// ── EXPENSES ────────────────────────────────────────
let currentExpFilter = 'today';
function addExpense() {
  const desc    = document.getElementById('exp-desc').value.trim();
  const cat     = document.getElementById('exp-cat').value;
  const amount  = parseFloat(document.getElementById('exp-amount').value) || 0;
  const payment = document.getElementById('exp-payment').value;
  const note    = document.getElementById('exp-note').value.trim();
  if (!desc) return showToast('Description is required');
  if (!amount) return showToast('Amount is required');
  const expenses = loadData('expenses', []);
  expenses.unshift({ id: uid(), desc, cat, amount, payment, note, date: new Date().toISOString() });
  saveData('expenses', expenses);
  ['exp-desc','exp-amount','exp-note'].forEach(id => document.getElementById(id).value = '');
  closeModal('modal-expense');
  showToast('Expense recorded');
  if (currentPage === 'expenses') renderExpenses(currentExpFilter);
  if (currentPage === 'dashboard') refreshDashboard();
}

// ── CREDIT ─────────────────────────────────────────
function addCredit() {
  const name  = document.getElementById('cr-name').value.trim();
  const phone = document.getElementById('cr-phone').value.trim();
  const item  = document.getElementById('cr-item').value.trim();
  const total = parseFloat(document.getElementById('cr-total').value) || 0;
  const paid  = parseFloat(document.getElementById('cr-paid').value) || 0;
  const due   = document.getElementById('cr-due').value;
  const note  = document.getElementById('cr-note').value.trim();
  if (!name) return showToast('Customer name is required');
  if (!total) return showToast('Amount owed is required');
  addCreditEntry(name, phone, item, total, paid, due, note);
  ['cr-name','cr-phone','cr-item','cr-total','cr-paid','cr-due','cr-note'].forEach(id => document.getElementById(id).value = '');
  closeModal('modal-credit');
  showToast('Credit recorded');
  if (currentPage === 'credit') renderCredit('');
  if (currentPage === 'dashboard') refreshDashboard();
}
function addCreditEntry(name, phone, item, total, paid, due, note) {
  const credits = loadData('credits', []);
  credits.unshift({ id: uid(), name, phone, item, total, paid, balance: total - paid, due, note, payments: [], date: new Date().toISOString() });
  saveData('credits', credits);
}
function openCreditPay(id) {
  const credits = loadData('credits', []);
  const cr = credits.find(c => c.id === id);
  if (!cr) return;
  creditPayTarget = id;
  document.getElementById('credit-pay-info').textContent = `${cr.name} owes ${fmtNGN(cr.balance)}`;
  document.getElementById('credit-pay-amount').value = '';
  openModal('modal-credit-pay');
}
function recordCreditPayment() {
  const amount = parseFloat(document.getElementById('credit-pay-amount').value) || 0;
  const method = document.getElementById('credit-pay-method').value;
  if (!amount) return showToast('Enter amount paid');
  const credits = loadData('credits', []);
  const cr = credits.find(c => c.id === creditPayTarget);
  if (!cr) return;
  cr.paid = (cr.paid || 0) + amount;
  cr.balance = Math.max(0, cr.total - cr.paid);
  cr.payments = cr.payments || [];
  cr.payments.push({ amount, method, date: new Date().toISOString() });
  saveData('credits', credits);
  closeModal('modal-credit-pay');
  showToast(`Payment of ${fmtNGN(amount)} recorded`);
  renderCredit('');
  if (currentPage === 'dashboard') refreshDashboard();
}

// ── CUSTOMERS ──────────────────────────────────────
function addCustomer() {
  const name    = document.getElementById('cust-name').value.trim();
  const phone   = document.getElementById('cust-phone').value.trim();
  const address = document.getElementById('cust-address').value.trim();
  const note    = document.getElementById('cust-note').value.trim();
  if (!name) return showToast('Customer name is required');
  autoAddCustomer(name, phone, address, note);
  ['cust-name','cust-phone','cust-address','cust-note'].forEach(id => document.getElementById(id).value = '');
  closeModal('modal-customer');
  showToast('Customer added');
  if (currentPage === 'customers') renderCustomers('');
}
function autoAddCustomer(name, phone = '', address = '', note = '') {
  const customers = loadData('customers', []);
  if (customers.some(c => c.name.toLowerCase() === name.toLowerCase())) return;
  customers.unshift({ id: uid(), name, phone, address, note, date: new Date().toISOString() });
  saveData('customers', customers);
}

// ── SUPPLIERS ──────────────────────────────────────
function addSupplier() {
  const name     = document.getElementById('sup-name').value.trim();
  const phone    = document.getElementById('sup-phone').value.trim();
  const items    = document.getElementById('sup-items').value.trim();
  const location = document.getElementById('sup-location').value.trim();
  const note     = document.getElementById('sup-note').value.trim();
  if (!name) return showToast('Supplier name is required');
  const suppliers = loadData('suppliers', []);
  suppliers.unshift({ id: uid(), name, phone, items, location, note, date: new Date().toISOString() });
  saveData('suppliers', suppliers);
  ['sup-name','sup-phone','sup-items','sup-location','sup-note'].forEach(id => document.getElementById(id).value = '');
  closeModal('modal-supplier');
  showToast('Supplier added');
  if (currentPage === 'suppliers') renderSuppliers('');
}

// ── DASHBOARD REFRESH ──────────────────────────────
function refreshDashboard() {
  const { sales, expenses, stock, credits } = getData();
  const todaySales = sales.filter(s => isToday(s.date));
  const todayExp   = expenses.filter(e => isToday(e.date));

  const todaySaleAmt = todaySales.reduce((a, s) => a + (s.payment === 'credit' ? 0 : s.payment === 'part' ? s.partPaid : s.total), 0);
  const todayExpAmt  = todayExp.reduce((a, e) => a + e.amount, 0);
  const totalCreditOut = credits.reduce((a, c) => a + (c.balance || 0), 0);
  const totalRevenue   = todaySales.reduce((a, s) => a + s.total, 0);
  const totalCOGS      = todaySales.reduce((a, s) => a + (s.totalCost || 0), 0);
  const grossProfit    = totalRevenue - totalCOGS;
  const netProfit      = grossProfit - todayExpAmt;
  const cashIn         = todaySales.filter(s => s.payment === 'cash').reduce((a, s) => a + s.total, 0);
  const transferIn     = todaySales.filter(s => s.payment === 'transfer').reduce((a, s) => a + s.total, 0);
  const partIn         = todaySales.filter(s => s.payment === 'part').reduce((a, s) => a + s.partPaid, 0);
  const creditGivenToday = todaySales.filter(s => s.payment === 'credit').reduce((a, s) => a + s.total, 0) +
    todaySales.filter(s => s.payment === 'part').reduce((a, s) => a + (s.total - s.partPaid), 0);

  document.getElementById('stat-today-sales').textContent = fmtNGN(todaySaleAmt);
  document.getElementById('stat-today-exp').textContent   = fmtNGN(todayExpAmt);
  document.getElementById('stat-stock').textContent       = stock.length;
  document.getElementById('stat-credit').textContent      = fmtNGN(totalCreditOut);
  document.getElementById('sum-revenue').textContent      = fmtNGN(totalRevenue);
  document.getElementById('sum-cogs').textContent         = fmtNGN(totalCOGS);
  document.getElementById('sum-gross').textContent        = fmtNGN(grossProfit);
  document.getElementById('sum-expenses').textContent     = fmtNGN(todayExpAmt);
  document.getElementById('sum-net').textContent          = fmtNGN(netProfit);
  document.getElementById('sum-cash').textContent         = fmtNGN(cashIn + partIn);
  document.getElementById('sum-transfer').textContent     = fmtNGN(transferIn);
  document.getElementById('sum-credit-today').textContent = fmtNGN(creditGivenToday);

  // Color net profit
  const netEl = document.getElementById('sum-net');
  netEl.className = netProfit >= 0 ? 'green-text' : 'red-text';

  // Recent sales
  const rsEl = document.getElementById('dash-recent-sales');
  if (todaySales.length === 0) {
    rsEl.innerHTML = `<div class="empty-state"><i class="ti ti-receipt-off"></i><p>No sales yet today</p></div>`;
  } else {
    rsEl.innerHTML = todaySales.slice(0, 5).map(s => saleCard(s, false)).join('');
  }

  // Low stock alerts
  const lowStock = stock.filter(s => (s.qty || 0) <= (settings.lowStock || 5));
  const lsEl = document.getElementById('dash-low-stock');
  if (lowStock.length === 0) {
    lsEl.innerHTML = `<div class="empty-state"><i class="ti ti-package-off"></i><p>All stock levels are fine</p></div>`;
  } else {
    lsEl.innerHTML = lowStock.map(s => `
      <div class="record-card">
        <div class="record-icon amber"><i class="ti ti-alert-triangle"></i></div>
        <div class="record-body"><div class="record-title">${s.name}</div><div class="record-meta">${s.colour || ''} ${s.size ? '· Sz '+s.size : ''} · ${s.brand||''}</div></div>
        <div class="record-right"><div class="record-amount amber">${s.qty} left</div><div class="record-time">Low Stock</div></div>
      </div>`).join('');
  }
}

function saleCard(s, showDelete = true) {
  const pmtColor = s.payment === 'cash' ? 'green' : s.payment === 'transfer' ? 'blue' : 'amber';
  const pmtIcon  = s.payment === 'cash' ? 'ti-cash' : s.payment === 'transfer' ? 'ti-building-bank' : 'ti-clock-dollar';
  const paid     = s.payment === 'credit' ? 0 : s.payment === 'part' ? s.partPaid : s.total;
  return `<div class="record-card">
    <div class="record-icon ${pmtColor}"><i class="ti ${pmtIcon}"></i></div>
    <div class="record-body">
      <div class="record-title">${s.item}</div>
      <div class="record-meta">Qty: ${s.qty} · ${s.payment.toUpperCase()}${s.customer ? ' · '+s.customer : ''}</div>
      ${showDelete ? `<div class="record-actions"><button class="rec-btn green" onclick="showReceipt(${JSON.stringify(s).replace(/"/g,'&quot;')})"><i class="ti ti-receipt"></i> Receipt</button><button class="rec-btn red" onclick="deleteSale('${s.id}')"><i class="ti ti-trash"></i></button></div>` : ''}
    </div>
    <div class="record-right">
      <div class="record-amount ${pmtColor}">${fmtNGN(paid)}</div>
      <div class="record-time">${fmtTime(s.date)}</div>
    </div>
  </div>`;
}

// ── RENDER SALES ───────────────────────────────────
let currentSaleFilter = 'today';
function filterSales(period, el) {
  currentSaleFilter = period;
  document.querySelectorAll('#sales-filter .ftab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderSales(period);
}
function renderSales(period) {
  const { sales } = getData();
  const filtered = filterByPeriod(sales, period);
  const total    = filtered.reduce((a, s) => a + (s.payment === 'credit' ? 0 : s.payment === 'part' ? s.partPaid : s.total), 0);
  document.getElementById('sales-period-total').textContent = `Total: ${fmtNGN(total)} | ${filtered.length} sale${filtered.length !== 1 ? 's' : ''}`;
  const el = document.getElementById('sales-list');
  if (filtered.length === 0) { el.innerHTML = `<div class="empty-state"><i class="ti ti-receipt-off"></i><p>No sales in this period</p></div>`; return; }
  el.innerHTML = filtered.map(s => saleCard(s, true)).join('');
}
function deleteSale(id) {
  if (!confirm('Delete this sale record?')) return;
  const sales = loadData('sales', []).filter(s => s.id !== id);
  saveData('sales', sales);
  showToast('Sale deleted');
  renderSales(currentSaleFilter);
  if (currentPage === 'dashboard') refreshDashboard();
}

// ── RENDER STOCK ───────────────────────────────────
function filterStock(q) { renderStock(q); }
function renderStock(q = '') {
  const { stock } = getData();
  const low = settings.lowStock || 5;
  const filtered = stock.filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()) || (s.colour||'').toLowerCase().includes(q.toLowerCase()) || (s.brand||'').toLowerCase().includes(q.toLowerCase()));
  const el = document.getElementById('stock-list');
  if (filtered.length === 0) { el.innerHTML = `<div class="empty-state"><i class="ti ti-package-off"></i><p>${q ? 'No items match your search' : 'No stock items yet. Add your first item.'}</p></div>`; return; }
  el.innerHTML = filtered.map(s => {
    const isLow = (s.qty || 0) <= low;
    const profit = s.sell - s.buy;
    const margin = s.buy > 0 ? Math.round((profit / s.sell) * 100) : 0;
    return `<div class="stock-card" style="margin-bottom:8px;">
      <div class="stock-header">
        <div class="stock-icon"><i class="ti ti-shoe"></i></div>
        <div class="stock-body">
          <div class="stock-name">${s.name}</div>
          <div class="stock-meta">${[s.brand, s.cat, s.colour, s.size ? 'Sz '+s.size : ''].filter(Boolean).join(' · ')}</div>
          ${isLow ? '<span class="low-badge"><i class="ti ti-alert-triangle"></i> Low Stock</span>' : ''}
        </div>
        <div class="stock-right">
          <div class="stock-qty ${isLow ? 'low' : ''}">${s.qty || 0}</div>
          <div class="stock-qty-label">in stock</div>
        </div>
      </div>
      <div class="stock-prices">
        <div class="stock-price-item"><span class="stock-price-label">Bought</span><span class="stock-price-val">${fmtNGN(s.buy)}</span></div>
        <div class="stock-price-item"><span class="stock-price-label">Selling</span><span class="stock-price-val">${fmtNGN(s.sell)}</span></div>
        <div class="stock-price-item"><span class="stock-price-label">Profit/unit</span><span class="stock-price-val green-text">${fmtNGN(profit)}</span></div>
        <span class="profit-chip">${margin}% margin</span>
      </div>
      <div class="record-actions" style="margin-top:10px;">
        <button class="rec-btn green" onclick="openRestockFor('${s.name}')"><i class="ti ti-truck"></i> Restock</button>
        <button class="rec-btn red" onclick="deleteStock('${s.id}')"><i class="ti ti-trash"></i> Delete</button>
      </div>
    </div>`;
  }).join('');
}
function openRestockFor(name) {
  openModal('modal-restock');
  setTimeout(() => { document.getElementById('rs-item').value = name; }, 100);
}
function deleteStock(id) {
  if (!confirm('Delete this stock item?')) return;
  saveData('stock', loadData('stock', []).filter(s => s.id !== id));
  showToast('Item deleted');
  renderStock('');
}

// ── RENDER EXPENSES ────────────────────────────────
function filterExp(period, el) {
  currentExpFilter = period;
  document.querySelectorAll('#exp-filter .ftab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderExpenses(period);
}
function renderExpenses(period) {
  const { expenses } = getData();
  const filtered = filterByPeriod(expenses, period);
  const total = filtered.reduce((a, e) => a + e.amount, 0);
  document.getElementById('exp-period-total').textContent = `Total: ${fmtNGN(total)}`;
  const catIcons = { rent:'ti-building', transport:'ti-truck', wages:'ti-users', electricity:'ti-bolt', packaging:'ti-package', restock:'ti-packages', maintenance:'ti-tools', other:'ti-dots' };
  const el = document.getElementById('expense-list');
  if (filtered.length === 0) { el.innerHTML = `<div class="empty-state"><i class="ti ti-receipt-off"></i><p>No expenses in this period</p></div>`; return; }
  el.innerHTML = filtered.map(e => `<div class="record-card">
    <div class="record-icon red"><i class="ti ${catIcons[e.cat]||'ti-minus-circle'}"></i></div>
    <div class="record-body">
      <div class="record-title">${e.desc}</div>
      <div class="record-meta">${e.cat.charAt(0).toUpperCase()+e.cat.slice(1)} · ${e.payment.toUpperCase()}${e.note ? ' · '+e.note : ''}</div>
      <div class="record-actions"><button class="rec-btn red" onclick="deleteExpense('${e.id}')"><i class="ti ti-trash"></i> Delete</button></div>
    </div>
    <div class="record-right">
      <div class="record-amount red">${fmtNGN(e.amount)}</div>
      <div class="record-time">${fmtDate(e.date)}</div>
    </div>
  </div>`).join('');
}
function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  saveData('expenses', loadData('expenses', []).filter(e => e.id !== id));
  showToast('Expense deleted');
  renderExpenses(currentExpFilter);
  if (currentPage === 'dashboard') refreshDashboard();
}

// ── RENDER CREDIT ──────────────────────────────────
function filterCredit(q) { renderCredit(q); }
function renderCredit(q = '') {
  const credits = loadData('credits', []);
  const filtered = credits.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.phone||'').includes(q));
  const total = filtered.reduce((a, c) => a + (c.balance || 0), 0);
  document.getElementById('credit-total').textContent = `Total Outstanding: ${fmtNGN(total)}`;
  const el = document.getElementById('credit-list');
  if (filtered.length === 0) { el.innerHTML = `<div class="empty-state"><i class="ti ti-user-off"></i><p>No credit records found</p></div>`; return; }
  el.innerHTML = filtered.map(c => {
    const pct = c.total > 0 ? Math.min(100, Math.round((c.paid / c.total) * 100)) : 0;
    const fullyPaid = (c.balance || 0) <= 0;
    return `<div class="credit-card" style="margin-bottom:8px;">
      <div class="credit-top">
        <div class="credit-avatar">${c.name.charAt(0).toUpperCase()}</div>
        <div>
          <div class="credit-name">${c.name}</div>
          <div class="credit-phone">${c.phone || 'No phone'} ${c.item ? '· '+c.item : ''}</div>
        </div>
        <div style="margin-left:auto;text-align:right;">
          <div class="credit-balance ${fullyPaid ? 'fully-paid' : ''}">${fullyPaid ? '✓ Paid' : fmtNGN(c.balance)}</div>
          <div style="font-size:11px;color:var(--text-3)">of ${fmtNGN(c.total)}</div>
        </div>
      </div>
      <div class="credit-progress">
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <div class="credit-amounts"><span>${pct}% paid</span><span>${c.due ? 'Due: '+fmtDate(c.due) : ''}</span></div>
      </div>
      ${!fullyPaid ? `<div class="record-actions">
        <button class="rec-btn green" onclick="openCreditPay('${c.id}')"><i class="ti ti-cash"></i> Record Payment</button>
        <button class="rec-btn" onclick="callCustomer('${c.phone}')"><i class="ti ti-phone"></i> Call</button>
        <button class="rec-btn" onclick="whatsAppReminder('${c.phone}','${c.name}','${fmtNGN(c.balance)}')"><i class="ti ti-brand-whatsapp"></i></button>
        <button class="rec-btn red" onclick="deleteCredit('${c.id}')"><i class="ti ti-trash"></i></button>
      </div>` : `<div class="record-actions"><button class="rec-btn red" onclick="deleteCredit('${c.id}')"><i class="ti ti-trash"></i> Remove</button></div>`}
    </div>`;
  }).join('');
}
function deleteCredit(id) {
  if (!confirm('Delete this credit record?')) return;
  saveData('credits', loadData('credits', []).filter(c => c.id !== id));
  showToast('Credit record deleted');
  renderCredit('');
  if (currentPage === 'dashboard') refreshDashboard();
}
function callCustomer(phone) { if (phone) window.open('tel:' + phone); }
function whatsAppReminder(phone, name, bal) {
  const msg = `Hello ${name}, this is a gentle reminder that you have an outstanding balance of *${bal}* at IHSAN Footwears. Kindly make payment at your earliest convenience. Thank you!`;
  window.open(`https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── RENDER CUSTOMERS ───────────────────────────────
function filterCustomers(q) { renderCustomers(q); }
function renderCustomers(q = '') {
  const { customers, sales } = getData();
  const filtered = customers.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.phone||'').includes(q));
  const el = document.getElementById('customer-list');
  if (filtered.length === 0) { el.innerHTML = `<div class="empty-state"><i class="ti ti-user-off"></i><p>No customers yet</p></div>`; return; }
  el.innerHTML = filtered.map(c => {
    const custSales = sales.filter(s => s.customer && s.customer.toLowerCase() === c.name.toLowerCase());
    return `<div class="contact-card" style="margin-bottom:8px;">
      <div class="contact-avatar">${c.name.charAt(0).toUpperCase()}</div>
      <div class="contact-body">
        <div class="contact-name">${c.name}</div>
        <div class="contact-meta">${c.phone||'No phone'} · ${custSales.length} purchase${custSales.length !== 1 ? 's' : ''}</div>
        ${c.note ? `<div class="contact-meta" style="margin-top:2px;">${c.note}</div>` : ''}
      </div>
      <div class="contact-actions">
        ${c.phone ? `<button class="contact-btn" onclick="callCustomer('${c.phone}')"><i class="ti ti-phone"></i></button>` : ''}
        <button class="contact-btn" style="color:var(--red-main)" onclick="deleteCustomer('${c.id}')"><i class="ti ti-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}
function deleteCustomer(id) {
  if (!confirm('Delete this customer?')) return;
  saveData('customers', loadData('customers', []).filter(c => c.id !== id));
  showToast('Customer deleted');
  renderCustomers('');
}

// ── RENDER SUPPLIERS ───────────────────────────────
function filterSuppliers(q) { renderSuppliers(q); }
function renderSuppliers(q = '') {
  const { suppliers } = getData();
  const filtered = suppliers.filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()));
  const el = document.getElementById('supplier-list');
  if (filtered.length === 0) { el.innerHTML = `<div class="empty-state"><i class="ti ti-building-store"></i><p>No suppliers yet</p></div>`; return; }
  el.innerHTML = filtered.map(s => `<div class="contact-card" style="margin-bottom:8px;">
    <div class="contact-avatar" style="background:var(--blue-light);color:var(--blue-main)">${s.name.charAt(0).toUpperCase()}</div>
    <div class="contact-body">
      <div class="contact-name">${s.name}</div>
      <div class="contact-meta">${s.phone||'No phone'}${s.location ? ' · '+s.location : ''}</div>
      ${s.items ? `<div class="contact-meta">${s.items}</div>` : ''}
    </div>
    <div class="contact-actions">
      ${s.phone ? `<button class="contact-btn" onclick="callCustomer('${s.phone}')"><i class="ti ti-phone"></i></button>` : ''}
      <button class="contact-btn" style="color:var(--red-main)" onclick="deleteSupplier('${s.id}')"><i class="ti ti-trash"></i></button>
    </div>
  </div>`).join('');
}
function deleteSupplier(id) {
  if (!confirm('Delete this supplier?')) return;
  saveData('suppliers', loadData('suppliers', []).filter(s => s.id !== id));
  showToast('Supplier deleted');
  renderSuppliers('');
}

// ── REPORTS ────────────────────────────────────────
function generateReport() {
  const from = document.getElementById('rpt-from').value;
  const to   = document.getElementById('rpt-to').value;
  if (!from || !to) return showToast('Please select both dates');
  const { sales, expenses, credits } = getData();
  const fD = new Date(from); fD.setHours(0,0,0,0);
  const tD = new Date(to);   tD.setHours(23,59,59,999);
  const inRange = iso => { const d = new Date(iso); return d >= fD && d <= tD; };
  const filtS = sales.filter(s => inRange(s.date));
  const filtE = expenses.filter(e => inRange(e.date));

  const revenue  = filtS.reduce((a, s) => a + s.total, 0);
  const cogs     = filtS.reduce((a, s) => a + (s.totalCost||0), 0);
  const grossP   = revenue - cogs;
  const totalExp = filtE.reduce((a, e) => a + e.amount, 0);
  const netP     = grossP - totalExp;
  const cashSales = filtS.filter(s => s.payment === 'cash').reduce((a, s) => a + s.total, 0);
  const transSales = filtS.filter(s => s.payment === 'transfer').reduce((a, s) => a + s.total, 0);
  const creditSales = filtS.filter(s => s.payment === 'credit').reduce((a, s) => a + s.total, 0);

  const expBycat = {};
  filtE.forEach(e => { expBycat[e.cat] = (expBycat[e.cat]||0) + e.amount; });

  const bestSellers = {};
  filtS.forEach(s => { bestSellers[s.item] = (bestSellers[s.item]||0) + s.qty; });
  const topItems = Object.entries(bestSellers).sort((a,b)=>b[1]-a[1]).slice(0,5);

  reportData = { from, to, filtS, filtE, revenue, cogs, grossP, totalExp, netP };

  document.getElementById('report-output').innerHTML = `
    <div class="report-section">
      <div class="report-section-title">📅 Period: ${fmtDate(from)} — ${fmtDate(to)}</div>
      <div class="rpt-row"><span>Total Sales</span><span>${filtS.length} transactions</span></div>
      <div class="rpt-row"><span>Total Revenue</span><span class="rpt-total">${fmtNGN(revenue)}</span></div>
      <div class="rpt-row"><span>Cost of Goods Sold</span><span style="color:var(--red-main)">${fmtNGN(cogs)}</span></div>
      <div class="rpt-row"><span>Gross Profit</span><span style="color:var(--green-text)">${fmtNGN(grossP)}</span></div>
      <div class="rpt-row"><span>Total Expenses</span><span style="color:var(--red-main)">${fmtNGN(totalExp)}</span></div>
      <div class="rpt-row" style="border-top:2px solid var(--border);padding-top:10px;"><span><strong>Net Profit</strong></span><span class="rpt-total" style="color:${netP>=0?'var(--green-text)':'var(--red-main)'}">${fmtNGN(netP)}</span></div>
    </div>
    <div class="report-section">
      <div class="report-section-title">💳 Payment Breakdown</div>
      <div class="rpt-row"><span>Cash Sales</span><span>${fmtNGN(cashSales)}</span></div>
      <div class="rpt-row"><span>Transfer Sales</span><span>${fmtNGN(transSales)}</span></div>
      <div class="rpt-row"><span>Credit Given</span><span style="color:var(--amber-dark)">${fmtNGN(creditSales)}</span></div>
    </div>
    ${topItems.length ? `<div class="report-section">
      <div class="report-section-title">🏆 Best Selling Items</div>
      ${topItems.map((t,i)=>`<div class="rpt-row"><span>${i+1}. ${t[0]}</span><span>${t[1]} units</span></div>`).join('')}
    </div>` : ''}
    ${Object.keys(expBycat).length ? `<div class="report-section">
      <div class="report-section-title">💸 Expenses by Category</div>
      ${Object.entries(expBycat).map(([k,v])=>`<div class="rpt-row"><span>${k.charAt(0).toUpperCase()+k.slice(1)}</span><span>${fmtNGN(v)}</span></div>`).join('')}
    </div>` : ''}`;
  document.getElementById('report-export-row').style.display = 'flex';
}

function exportReport(type) {
  if (!reportData) return;
  const { from, to, filtS, filtE, revenue, cogs, grossP, totalExp, netP } = reportData;
  if (type === 'csv') {
    let csv = `IHSAN Footwears — Report ${from} to ${to}\n\nSALES\nDate,Item,Qty,Total,Payment,Customer\n`;
    filtS.forEach(s => { csv += `${fmtDate(s.date)},${s.item},${s.qty},${s.total},${s.payment},${s.customer||''}\n`; });
    csv += `\nEXPENSES\nDate,Description,Category,Amount\n`;
    filtE.forEach(e => { csv += `${fmtDate(e.date)},${e.desc},${e.cat},${e.amount}\n`; });
    csv += `\nSUMMARY\nRevenue,${revenue}\nCOGS,${cogs}\nGross Profit,${grossP}\nExpenses,${totalExp}\nNet Profit,${netP}\n`;
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `IHSAN_Report_${from}_to_${to}.csv`; a.click();
    showToast('CSV downloaded');
  } else {
    const content = document.getElementById('report-output').innerHTML;
    const win = window.open('','_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>IHSAN Report</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;max-width:600px;margin:0 auto}
    .report-section{background:#f9f9f9;border:1px solid #ddd;border-radius:8px;padding:16px;margin-bottom:16px}
    .report-section-title{font-weight:700;font-size:14px;color:#555;margin-bottom:12px;text-transform:uppercase}
    .rpt-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee;font-size:14px}
    .rpt-total{font-weight:700;font-size:16px}
    h1{text-align:center;color:#1a3c1a} p{text-align:center;color:#666}
    </style></head><body>
    <h1>IHSAN Footwears & General Enterprises</h1>
    <p>Financial Report: ${from} to ${to}</p>
    ${content}
    <p style="margin-top:32px;font-size:12px;color:#999;text-align:center">Generated by IHSAN Footwears App · Built by YaseerTech</p>
    </body></html>`);
    win.document.close();
    win.print();
  }
}

// ── FILTER BY PERIOD ───────────────────────────────
function filterByPeriod(arr, period) {
  switch (period) {
    case 'today': return arr.filter(x => isToday(x.date));
    case 'week':  return arr.filter(x => isThisWeek(x.date));
    case 'month': return arr.filter(x => isThisMonth(x.date));
    default:      return [...arr];
  }
}

// ── SETTINGS ───────────────────────────────────────
function loadSettings() {
  document.getElementById('set-biz-name').value  = settings.bizName || '';
  document.getElementById('set-owner').value     = settings.owner || '';
  document.getElementById('set-phone').value     = settings.phone || '';
  document.getElementById('set-address').value   = settings.address || '';
  document.getElementById('set-low-stock').value = settings.lowStock || 5;
}
function saveSettings() {
  settings.bizName  = document.getElementById('set-biz-name').value.trim();
  settings.owner    = document.getElementById('set-owner').value.trim();
  settings.phone    = document.getElementById('set-phone').value.trim();
  settings.address  = document.getElementById('set-address').value.trim();
  settings.lowStock = parseInt(document.getElementById('set-low-stock').value) || 5;
  saveData('settings', settings);
  setGreeting();
  showToast('Settings saved');
}
function confirmClearData() {
  if (!confirm('WARNING: This will permanently delete ALL your data — sales, stock, expenses, credits, and customers. This cannot be undone.\n\nType YES and confirm to proceed.')) return;
  const pin = prompt('Enter your PIN to confirm data deletion:');
  if (pin !== currentPIN) return showToast('Incorrect PIN. Data not cleared.');
  ['sales','expenses','stock','restocks','credits','customers','suppliers'].forEach(k => localStorage.removeItem('ihsan_' + k));
  showToast('All data cleared');
  refreshDashboard();
}

// ── NOTIFICATIONS ──────────────────────────────────
function checkNotifications() {
  const notifs = [];
  const { credits, stock } = getData();
  const low = settings.lowStock || 5;
  credits.forEach(c => {
    if ((c.balance||0) > 0 && c.due) {
      const due = new Date(c.due);
      const now = new Date();
      const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      if (diff <= 2 && diff >= 0) notifs.push({ icon: 'ti-clock-dollar', color: 'amber', text: `${c.name} owes ${fmtNGN(c.balance)} — due ${diff === 0 ? 'today' : `in ${diff} day${diff>1?'s':''}` }`, time: 'Credit due soon' });
      if (diff < 0) notifs.push({ icon: 'ti-alert-triangle', color: 'red', text: `${c.name} credit of ${fmtNGN(c.balance)} is OVERDUE by ${Math.abs(diff)} days`, time: 'Overdue credit' });
    }
  });
  stock.filter(s => (s.qty||0) <= low).forEach(s => {
    notifs.push({ icon: 'ti-packages', color: 'amber', text: `${s.name} is low in stock — only ${s.qty||0} left`, time: 'Low stock' });
  });

  const badge = document.getElementById('notify-badge');
  if (notifs.length > 0) { badge.style.display = 'block'; badge.textContent = notifs.length > 9 ? '9+' : notifs.length; }
  else badge.style.display = 'none';
  window._notifications = notifs;
}

function showNotifications() {
  const notifs = window._notifications || [];
  const el = document.getElementById('notif-list');
  if (notifs.length === 0) {
    el.innerHTML = `<div class="empty-state" style="margin:16px"><i class="ti ti-bell-off"></i><p>No notifications</p></div>`;
  } else {
    el.innerHTML = notifs.map(n => `<div class="notif-item">
      <div class="notif-icon ${n.color === 'amber' ? '' : ''}" style="background:${n.color==='red'?'var(--red-light)':'var(--amber-light)'};color:${n.color==='red'?'var(--red-main)':'var(--amber-main)'}"><i class="ti ${n.icon}"></i></div>
      <div><div class="notif-text">${n.text}</div><div class="notif-time">${n.time}</div></div>
    </div>`).join('');
  }
  document.getElementById('notif-panel').classList.remove('hidden');
}
function hideNotifications() { document.getElementById('notif-panel').classList.add('hidden'); }

// ── TOAST ──────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), 2800);
}

// ── SERVICE WORKER ─────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

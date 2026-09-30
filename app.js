
const STORAGE_KEY = 'expense_tracker_transactions';


const EXPENSE_CATEGORIES = [
  'Food & Groceries',
  'Housing & Rent',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Health & Fitness',
  'Shopping',
  'Other Expense',
];

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts',
  'Other Income',
];

const CATEGORY_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];


let transactions = [];
let editingId = null;


const form = document.getElementById('transactionForm');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');

const amountError = document.getElementById('amountError');
const categoryError = document.getElementById('categoryError');
const dateError = document.getElementById('dateError');
const descError = document.getElementById('descError');

const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');
const currentBalanceEl = document.getElementById('currentBalance');

const filterTypeSelect = document.getElementById('filterType');
const filterCategorySelect = document.getElementById('filterCategory');
const transactionsTableBody = document.getElementById('transactionsTableBody');
const emptyMessage = document.getElementById('emptyMessage');

const monthlySummaryContainer = document.getElementById('monthlySummaryContainer');
const chartCanvas = document.getElementById('categoryChartCanvas');
const chartLegend = document.getElementById('chartLegend');


function formatCurrency(amount) {
  return '$' + Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getSelectedType() {
  const selected = document.querySelector('input[name="transactionType"]:checked');
  return selected ? selected.value : 'expense';
}

function setSelectedType(type) {
  const radio = document.querySelector(`input[name="transactionType"][value="${type}"]`);
  if (radio) {
    radio.checked = true;
    updateCategoryDropdown();
  }
}

function loadTransactions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      transactions = JSON.parse(raw);
    } catch (e) {
      console.error('Error parsing localStorage transactions', e);
      transactions = [];
    }
  } else {
    
    transactions = [
      
    ];
    saveTransactions();
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}


function updateCategoryDropdown(selectedVal = '') {
  const type = getSelectedType();
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  categorySelect.innerHTML = '<option value="">-- Select Category --</option>';
  list.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === selectedVal) opt.selected = true;
    categorySelect.appendChild(opt);
  });
}

function updateFilterCategoryDropdown() {
  const currentVal = filterCategorySelect.value;
  const categories = new Set();
  transactions.forEach((t) => categories.add(t.category));

  filterCategorySelect.innerHTML = '<option value="all">All Categories</option>';
  Array.from(categories).sort().forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === currentVal) opt.selected = true;
    filterCategorySelect.appendChild(opt);
  });
}


function clearValidationErrors() {
  amountError.classList.remove('visible');
  categoryError.classList.remove('visible');
  dateError.classList.remove('visible');
  descError.classList.remove('visible');

  amountInput.classList.remove('error');
  categorySelect.classList.remove('error');
  dateInput.classList.remove('error');
  descriptionInput.classList.remove('error');
}

function validateForm() {
  clearValidationErrors();
  let isValid = true;

  const amountVal = parseFloat(amountInput.value);
  if (!amountInput.value || isNaN(amountVal) || amountVal <= 0) {
    amountError.classList.add('visible');
    amountInput.classList.add('error');
    isValid = false;
  }

  if (!categorySelect.value) {
    categoryError.classList.add('visible');
    categorySelect.classList.add('error');
    isValid = false;
  }

  if (!dateInput.value) {
    dateError.classList.add('visible');
    dateInput.classList.add('error');
    isValid = false;
  }

  if (!descriptionInput.value.trim()) {
    descError.classList.add('visible');
    descriptionInput.classList.add('error');
    isValid = false;
  }

  return isValid;
}


function handleSubmit(e) {
  e.preventDefault();

  if (!validateForm()) return;

  const type = getSelectedType();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;
  const date = dateInput.value;
  const description = descriptionInput.value.trim();

  if (editingId) {
    
    transactions = transactions.map((t) =>
      t.id === editingId
        ? { ...t, type, amount, category, date, description }
        : t
    );
    cancelEdit();
  } else {
    
    const newTx = {
      id: Date.now().toString(),
      type,
      amount,
      category,
      date,
      description,
    };
    transactions.unshift(newTx);
    resetForm();
  }

  saveTransactions();
  updateUI();
}

function startEdit(id) {
  const tx = transactions.find((t) => t.id === id);
  if (!tx) return;

  editingId = id;
  formTitle.textContent = 'Edit Transaction';
  submitBtn.textContent = 'Update Transaction';
  cancelEditBtn.style.display = 'block';

  setSelectedType(tx.type);
  amountInput.value = tx.amount;
  updateCategoryDropdown(tx.category);
  dateInput.value = tx.date;
  descriptionInput.value = tx.description;

  clearValidationErrors();
  form.scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
  editingId = null;
  formTitle.textContent = 'Add Transaction';
  submitBtn.textContent = 'Add Transaction';
  cancelEditBtn.style.display = 'none';
  resetForm();
}

function resetForm() {
  amountInput.value = '';
  descriptionInput.value = '';
  dateInput.value = new Date().toISOString().slice(0, 10);
  setSelectedType('expense');
  clearValidationErrors();
}

function deleteTransaction(id) {
  if (confirm('Are you sure you want to delete this transaction?')) {
    transactions = transactions.filter((t) => t.id !== id);
    if (editingId === id) cancelEdit();
    saveTransactions();
    updateUI();
  }
}




function renderSummary() {
  let income = 0;
  let expenses = 0;

  transactions.forEach((t) => {
    if (t.type === 'income') {
      income += t.amount;
    } else {
      expenses += t.amount;
    }
  });

  const balance = income - expenses;

  totalIncomeEl.textContent = '+' + formatCurrency(income);
  totalExpensesEl.textContent = '-' + formatCurrency(expenses);
  currentBalanceEl.textContent = (balance < 0 ? '-' : '') + formatCurrency(balance);
  currentBalanceEl.className = 'amount balance ' + (balance < 0 ? 'expense' : '');
}

function renderTransactions() {
  const typeFilter = filterTypeSelect.value;
  const categoryFilter = filterCategorySelect.value;

  const filtered = transactions.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  transactionsTableBody.innerHTML = '';

  if (filtered.length === 0) {
    emptyMessage.style.display = 'block';
    return;
  }

  emptyMessage.style.display = 'none';

  filtered.forEach((tx) => {
    const tr = document.createElement('tr');

    const formattedAmount = (tx.type === 'income' ? '+' : '-') + formatCurrency(tx.amount);
    const amountClass = tx.type === 'income' ? 'tx-income' : 'tx-expense';

    tr.innerHTML = `
      <td>${escapeHtml(tx.description)}</td>
      <td>${escapeHtml(tx.category)}</td>
      <td>${tx.date}</td>
      <td class="${amountClass}">${formattedAmount}</td>
      <td>
        <button class="btn-action edit" data-id="${tx.id}">Edit</button>
        <button class="btn-action delete" data-id="${tx.id}">Delete</button>
      </td>
    `;

    tr.querySelector('.edit').addEventListener('click', () => startEdit(tx.id));
    tr.querySelector('.delete').addEventListener('click', () => deleteTransaction(tx.id));

    transactionsTableBody.appendChild(tr);
  });
}


function renderCategoryChart() {
  if (!chartCanvas || !chartLegend) return;
  const ctx = chartCanvas.getContext('2d');
  if (!ctx) return;


  const categoryTotals = {};
  let totalExpense = 0;

  transactions.forEach((t) => {
    if (t.type === 'expense') {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      totalExpense += t.amount;
    }
  });

  const categories = Object.keys(categoryTotals);


  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
  chartLegend.innerHTML = '';

  if (categories.length === 0 || totalExpense === 0) {

    ctx.beginPath();
    ctx.arc(110, 110, 80, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 24;
    ctx.stroke();

    chartLegend.innerHTML = '<p class="empty-text">No expenses to display chart.</p>';
    return;
  }

  let startAngle = -Math.PI / 2;
  const centerX = 110;
  const centerY = 110;
  const radius = 80;

  categories.forEach((cat, index) => {
    const amount = categoryTotals[cat];
    const sliceAngle = (amount / totalExpense) * (2 * Math.PI);
    const endAngle = startAngle + sliceAngle;
    const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];


    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 26;
    ctx.stroke();

    startAngle = endAngle;


    const percentage = ((amount / totalExpense) * 100).toFixed(1);
    const row = document.createElement('div');
    row.className = 'legend-row';
    row.innerHTML = `
      <div class="legend-label">
        <span class="legend-color-box" style="background-color: ${color}"></span>
        <span>${escapeHtml(cat)}</span>
      </div>
      <div>
        <strong>${formatCurrency(amount)}</strong>
        <span style="color: var(--text-muted); font-size: 0.75rem;">(${percentage}%)</span>
      </div>
    `;
    chartLegend.appendChild(row);
  });
}


function renderMonthlySummary() {
  if (!monthlySummaryContainer) return;

  const monthlyTotals = {};

  transactions.forEach((t) => {
    const monthKey = t.date ? t.date.slice(0, 7) : 'Unknown';
    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = { income: 0, expense: 0 };
    }
    if (t.type === 'income') {
      monthlyTotals[monthKey].income += t.amount;
    } else {
      monthlyTotals[monthKey].expense += t.amount;
    }
  });

  const sortedMonths = Object.keys(monthlyTotals).sort().reverse();

  monthlySummaryContainer.innerHTML = '';

  if (sortedMonths.length === 0) {
    monthlySummaryContainer.innerHTML = '<p class="empty-text">No transactions recorded yet.</p>';
    return;
  }

  sortedMonths.forEach((monthKey) => {
    const data = monthlyTotals[monthKey];
    const net = data.income - data.expense;

    const card = document.createElement('div');
    card.className = 'monthly-card';
    card.innerHTML = `
      <h4>${monthKey}</h4>
      <div class="monthly-row">
        <span>Income:</span>
        <strong class="tx-income">+${formatCurrency(data.income)}</strong>
      </div>
      <div class="monthly-row">
        <span>Expenses:</span>
        <strong class="tx-expense">-${formatCurrency(data.expense)}</strong>
      </div>
      <div class="monthly-row" style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed var(--border-color);">
        <span>Net:</span>
        <strong class="${net >= 0 ? 'tx-income' : 'tx-expense'}">${net < 0 ? '-' : '+'}${formatCurrency(net)}</strong>
      </div>
    `;
    monthlySummaryContainer.appendChild(card);
  });
}


function updateUI() {
  renderSummary();
  updateFilterCategoryDropdown();
  renderTransactions();
  renderCategoryChart();
  renderMonthlySummary();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function init() {
  loadTransactions();

 
  
  dateInput.value = new Date().toISOString().slice(0, 10);
  updateCategoryDropdown();


  document.querySelectorAll('input[name="transactionType"]').forEach((radio) => {
    radio.addEventListener('change', () => updateCategoryDropdown());
  });


  form.addEventListener('submit', handleSubmit);
  cancelEditBtn.addEventListener('click', cancelEdit);


  filterTypeSelect.addEventListener('change', renderTransactions);
  filterCategorySelect.addEventListener('change', renderTransactions);


  updateUI();
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

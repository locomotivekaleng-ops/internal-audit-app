/* ============================================================
   UTILITIES — Formatting, helpers, etc.
   ============================================================ */

const Utils = {
  formatIDR(value) {
    if (!value && value !== 0) return '-';
    const num = Math.abs(Number(value));
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toLocaleString('id-ID');
  },

  formatIDRFull(value) {
    if (!value && value !== 0) return 'Rp 0';
    return 'Rp ' + Number(value).toLocaleString('id-ID');
  },

  parseLocalDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return new Date(+parts[0], +parts[1] - 1, +parts[2]);
    }
    return new Date(dateStr);
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = Utils.parseLocalDate(dateStr);
    if (!d || isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatDateInput(dateStr) {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  },

  formatPct(value, total) {
    if (!total) return '0%';
    return Math.round((value / total) * 100) + '%';
  },

  pct(numerator, denominator) {
    if (!denominator) return 0;
    return Math.round((numerator / denominator) * 100);
  },

  getMonthLabel(dateStr) {
    const d = Utils.parseLocalDate(dateStr);
    if (!d || isNaN(d)) return dateStr;
    return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
  },

  groupBy(arr, key) {
    return arr.reduce((acc, item) => {
      const k = item[key] || 'Unknown';
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    }, {});
  },

  sum(arr, key) {
    return arr.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);
  },

  getInitials(name) {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  },

  statusBadge(status) {
    const map = {
      'Closed':      'badge-green',
      'Open':        'badge-blue',
      'New':         'badge-blue',
      'Investigation':'badge-amber',
      'Reporting':   'badge-purple',
      'In Progress': 'badge-purple',
      'On Hold':     'badge-gray',
      'Hold':        'badge-gray',
      'Planned':     'badge-cyan',
      'Monitoring':  'badge-blue',
      'Cancelled':   'badge-red',
      'Cancel':      'badge-red',
      'Fieldwork':   'badge-purple',
      'active':      'badge-green',
      'inactive':    'badge-red',
    };
    return `<span class="badge ${map[status] || 'badge-gray'}">${status}</span>`;
  },

  laporanBadge(status) {
    const map = {
      'Plan':        'badge-blue',
      'In Progress': 'badge-amber',
      'Completed':   'badge-green',
      'Cancelled':   'badge-red',
    };
    return `<span class="badge ${map[status] || 'badge-gray'}">${status || '-'}</span>`;
  },

  aapStatusBadge(status) {
    if (status === 'Completed') {
      return `<span class="badge badge-green">Completed</span>`;
    } else if (status === 'New') {
      return `<span class="badge badge-gray">New</span>`;
    }
    return `<span class="badge badge-amber">In Progress</span>`;
  },

  severityBadge(sev) {
    const map = { 'High': 'badge-red', 'Medium': 'badge-amber', 'Low': 'badge-green' };
    return `<span class="badge ${map[sev] || 'badge-gray'}">${sev || '-'}</span>`;
  },

  trendHtml(pct) {
    if (pct > 0) return `<span class="trend-up">▲ ${Math.abs(pct)}%</span>`;
    if (pct < 0) return `<span class="trend-down">▼ ${Math.abs(pct)}%</span>`;
    return `<span class="trend-neutral">─ 0%</span>`;
  },

  debounce(fn, delay = 300) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  updateElementHtmlAndPreserveFocus(elementId, html) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Save active element details
    const activeEl = document.activeElement;
    const activeId = activeEl ? activeEl.id : null;
    let selectionStart = null;
    let selectionEnd = null;

    if (activeEl && activeId && el.contains(activeEl)) {
      try {
        selectionStart = activeEl.selectionStart;
        selectionEnd = activeEl.selectionEnd;
      } catch (e) {}
    }

    el.innerHTML = html;

    // Restore active element focus and selection
    if (activeId) {
      const newActiveEl = document.getElementById(activeId);
      if (newActiveEl) {
        newActiveEl.focus();
        if (selectionStart !== null && selectionEnd !== null) {
          try {
            newActiveEl.setSelectionRange(selectionStart, selectionEnd);
          } catch (e) {}
        }
      }
    }
  },

  formatNumberInput(inputElement) {
    if (!inputElement) return;

    // Get digits only
    let val = inputElement.value.replace(/[^\d]/g, '');
    if (val === '') {
      inputElement.value = '';
      return;
    }

    // Save selection bounds
    let cursor = inputElement.selectionStart;
    const oldLen = inputElement.value.length;

    // Format with commas
    const num = parseInt(val, 10);
    const formatted = num.toLocaleString('en-US');

    inputElement.value = formatted;

    // Adjust cursor position
    const newLen = formatted.length;
    cursor = cursor + (newLen - oldLen);
    inputElement.setSelectionRange(cursor, cursor);
  },

  parseFormattedNumber(val) {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.replace(/,/g, '')) || 0;
  },

  // Month list between two dates
  monthsBetween(startDate, endDate) {
    const months = [];
    const start = Utils.parseLocalDate(startDate) || new Date();
    const end = Utils.parseLocalDate(endDate) || new Date();
    start.setDate(1);
    while (start <= end) {
      months.push(new Date(start));
      start.setMonth(start.getMonth() + 1);
    }
    return months;
  },

  // Generate month buckets for chart
  buildMonthBuckets(items, dateField, startDate, endDate) {
    const months = Utils.monthsBetween(startDate, endDate);
    return months.map(m => {
      const ym = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      const bucket = items.filter(item => {
        if (!item[dateField]) return false;
        const d = item[dateField].substring(0, 7);
        return d === ym;
      });
      return {
        label: m.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        items: bucket,
        ym
      };
    });
  },

  _parseDate(v) {
    if (v instanceof Date) return v.getTime();
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const s = v.trim();
      if (s.length >= 8 && (s.includes('-') || s.includes('/') || s.includes(','))) {
        const t = Date.parse(s);
        if (!isNaN(t)) return t;
      }
    }
    return null;
  },

  _cmpVal(av, bv, dir) {
    // nulls/undefined last
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    // date strings/objects → compare as timestamps
    const da = Utils._parseDate(av);
    const db = Utils._parseDate(bv);
    if (da !== null && db !== null) {
      return dir === 'asc' ? da - db : db - da;
    }
    // numbers
    if (typeof av === 'number' && typeof bv === 'number') {
      return dir === 'asc' ? av - bv : bv - av;
    }
    // strings case-insensitive
    const sa = String(av).toLowerCase(), sb = String(bv).toLowerCase();
    if (sa < sb) return dir === 'asc' ? -1 : 1;
    if (sa > sb) return dir === 'asc' ? 1 : -1;
    return 0;
  },

  sortBy(arr, key, dir = 'asc') {
    return [...arr].sort((a, b) => Utils._cmpVal(a[key], b[key], dir));
  },

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // ── Master Data Lookup Helpers ─────────────────────────
  getCatName(id) {
    if (!id) return '';
    const cat = DB.find('fraud_categories', id);
    return cat ? cat.name : id;
  },
  getProvName(id) {
    if (!id) return '';
    const p = DB.find('provinces', id);
    return p ? p.name : id;
  },
  getDeptName(id) {
    if (!id) return '';
    const d = DB.find('departments', id);
    return d ? d.name : id;
  },
  getOutletName(code) {
    if (!code) return '';
    const outlet = DB.get('outlets').find(o => o.code === code);
    return outlet ? outlet.name : code;
  },
  getBrandName(id) {
    if (!id) return '';
    const b = DB.find('brands', id);
    return b ? b.name : id;
  },
};

// ---- Toast ----
const Toast = {
  show(message, type = 'info', title = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error:   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info:    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  success(msg, title) { Toast.show(msg, 'success', title || 'Success'); },
  error(msg, title)   { Toast.show(msg, 'error', title || 'Error'); },
  warning(msg, title) { Toast.show(msg, 'warning', title || 'Warning'); },
  info(msg, title)    { Toast.show(msg, 'info', title || 'Info'); },
};

// ---- Modal ----
const Modal = {
  open(content, cls = 'modal-md') {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    container.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true">${content}</div>`;
    overlay.classList.remove('hidden');
    // Close on overlay click
    overlay.onclick = (e) => { if (e.target === overlay) Modal.close(); };
    // Auto-bind data-action="modal-close" inside the modal
    container.querySelectorAll('[data-action="modal-close"]').forEach(el => {
      el.addEventListener('click', () => Modal.close());
      // Add aria-label to icon-only close buttons
      if (!el.textContent.trim() && el.querySelector('i, svg')) {
        el.setAttribute('aria-label', 'Close modal');
      }
    });
    // Focus trap: save previous focus and focus first focusable element
    Modal._previousFocus = document.activeElement;
    const firstFocusable = container.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();
  },

  close() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    document.getElementById('modal-container').innerHTML = '';
    // Restore focus to previously focused element
    if (Modal._previousFocus) {
      Modal._previousFocus.focus();
      Modal._previousFocus = null;
    }
  },

  confirm(title, message, onConfirm) {
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          Confirm Action
        </div>
        <button class="modal-close" data-action="modal-close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="confirm-dialog">
          <div class="confirm-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3>${title}</h3>
          <p>${message}</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Cancel</button>
        <button class="btn btn-danger" id="confirm-btn">Delete</button>
      </div>
    `, 'modal-sm');
    document.getElementById('confirm-btn').onclick = () => {
      Modal.close();
      onConfirm();
    };
  },
};

window.Utils = Utils;
window.Toast = Toast;
window.Modal = Modal;

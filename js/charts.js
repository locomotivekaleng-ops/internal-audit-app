/* ============================================================
   CHART CONFIGURATIONS — Reusable chart factory using Chart.js
   ============================================================ */

// Global Chart.js defaults
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 11;

const CHART_COLORS = {
  blue:   '#3b82f6',
  green:  '#10b981',
  amber:  '#f59e0b',
  red:    '#ef4444',
  purple: '#a855f7',
  cyan:   '#06b6d4',
  orange: '#f97316',
  pink:   '#ec4899',
  indigo: '#6366f1',
  teal:   '#14b8a6',
};

const CHART_PALETTE = Object.values(CHART_COLORS);

const gridColor = 'rgba(59, 130, 246, 0.06)';
const borderColor = 'rgba(59, 130, 246, 0.15)';

const Charts = {
  _instances: {},

  destroy(id) {
    if (Charts._instances[id]) {
      Charts._instances[id].destroy();
      delete Charts._instances[id];
    }
  },

  destroyAll() {
    Object.keys(Charts._instances).forEach(id => Charts.destroy(id));
  },

  register(id, instance) {
    Charts._instances[id] = instance;
    return instance;
  },

  // ---- Combo: Bar + Line ----
  combo(canvasId, labels, barData, lineData, barLabel, lineLabel, barColor = CHART_COLORS.amber, lineColor = CHART_COLORS.blue, opts = {}) {
    Charts.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    return Charts.register(canvasId, new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: barLabel,
            data: barData,
            backgroundColor: barColor + 'cc',
            borderColor: barColor,
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: lineLabel,
            data: lineData,
            borderColor: lineColor,
            backgroundColor: lineColor + '20',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: lineColor,
            tension: 0.3,
            yAxisID: 'y1',
            fill: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11 } } },
          tooltip: {
            backgroundColor: 'rgba(13, 27, 46, 0.95)',
            borderColor: borderColor,
            borderWidth: 1,
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            callbacks: {
              label: (ctx) => {
                const label = ctx.dataset.label || '';
                const val = ctx.parsed.y;
                if (ctx.datasetIndex === 0) return ` ${label}: ${Utils.formatIDR(val)}`;
                return ` ${label}: ${val}`;
              }
            }
          }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { maxRotation: 0 } },
          y: {
            type: 'linear', position: 'left',
            grid: { color: gridColor },
            ticks: { callback: v => Utils.formatIDR(v) }
          },
          y1: {
            type: 'linear', position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { stepSize: 1, precision: 0 }
          }
        },
        ...opts
      }
    }));
  },

  // ---- Donut ----
  donut(canvasId, labels, data, colors, opts = {}) {
    Charts.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    return Charts.register(canvasId, new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors || CHART_PALETTE, borderWidth: 2, borderColor: '#0d1b2e', hoverOffset: 6 }] },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '68%',
        plugins: {
          legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', padding: 14, font: { size: 11 } } },
          tooltip: {
            backgroundColor: 'rgba(13, 27, 46, 0.95)',
            borderColor: borderColor,
            borderWidth: 1,
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total ? Math.round((ctx.parsed / total) * 100) : 0;
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              }
            }
          }
        },
        ...opts
      }
    }));
  },

  // ---- Horizontal Bar ----
  hbar(canvasId, labels, datasets, opts = {}) {
    Charts.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    return Charts.register(canvasId, new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: datasets.length > 1, position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12 } },
          tooltip: {
            backgroundColor: 'rgba(13, 27, 46, 0.95)',
            borderColor: borderColor,
            borderWidth: 1,
          }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { precision: 0 } },
          y: { grid: { color: gridColor } }
        },
        ...opts
      }
    }));
  },

  // ---- Stacked Horizontal Bar ----
  stackedHbar(canvasId, labels, datasets, opts = {}) {
    Charts.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    return Charts.register(canvasId, new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12 } },
          tooltip: {
            backgroundColor: 'rgba(13, 27, 46, 0.95)',
            borderColor: borderColor,
            borderWidth: 1,
          }
        },
        scales: {
          x: { stacked: true, grid: { color: gridColor }, ticks: { callback: v => v + '%' }, max: 100 },
          y: { stacked: true, grid: { color: gridColor } }
        },
        ...opts
      }
    }));
  },

  // ---- Bar ----
  bar(canvasId, labels, datasets, opts = {}) {
    Charts.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    return Charts.register(canvasId, new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: datasets.length > 1, position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12 } },
          tooltip: {
            backgroundColor: 'rgba(13, 27, 46, 0.95)',
            borderColor: borderColor,
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${Utils.formatIDR(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: { grid: { color: gridColor } },
          y: { grid: { color: gridColor }, ticks: { callback: v => Utils.formatIDR(v) } }
        },
        ...opts
      }
    }));
  },

  // ---- Line ----
  line(canvasId, labels, datasets, opts = {}) {
    Charts.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    return Charts.register(canvasId, new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12 } },
          tooltip: { backgroundColor: 'rgba(13, 27, 46, 0.95)', borderColor: borderColor, borderWidth: 1 }
        },
        scales: {
          x: { grid: { color: gridColor } },
          y: { grid: { color: gridColor }, ticks: { precision: 0 } }
        },
        ...opts
      }
    }));
  },
};

window.Charts = Charts;
window.CHART_COLORS = CHART_COLORS;

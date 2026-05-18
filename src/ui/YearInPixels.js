import { storageService } from '../services/StorageService.js';
import { getThemeColor } from '../theme.js';
import { t } from '../utils/i18n.js';
import { getPollenLevelByType, getAggregatedPollenLevel } from '../services/AqiManager.js';

let selectedLocation = null;
let selectedParam = 'maxTemp';
let _closeSheet = null;

let _yipScrollInit = false;

export function initYearInPixels() {
  const openBtn = document.getElementById('year-in-pixels-btn');
  const modal = document.getElementById('yip-modal');
  const closeBtn = document.getElementById('close-yip-modal-btn');
  const chipsContainer = document.getElementById('yip-location-chips');
  const paramDisplay = document.getElementById('yip-param-display');
  const delLocBtn = document.getElementById('yip-delete-loc-btn');

  if (!openBtn || !modal) return;

  if (paramDisplay) {
    paramDisplay.addEventListener('click', () => {
      populateParamSheet();
      _closeSheet = window.openBottomSheet('yip-param-sheet', 'yip-param-sheet-backdrop');
    });
  }

  if (delLocBtn) {
      delLocBtn.addEventListener('click', async () => {
          if (!selectedLocation) return;
          const confirmText = (t('config.deleteLocConfirm') || '¿Borrar todos los datos históricos de {loc}?').replace('{loc}', selectedLocation);
          const confirmed = await showConfirm(
              t('config.confirmAction', 'Confirmar'),
              confirmText
          );
          if (confirmed) {
              await storageService.init();
              const db = storageService.db;
              const tx = db.transaction([storageService.historyStoreName], 'readwrite');
              const store = tx.objectStore(storageService.historyStoreName);
              const req = store.delete(selectedLocation);
              req.onsuccess = () => {
                  modal.style.display = 'none';
              };
              req.onerror = (e) => {
                  console.error('Error deleting location historical data:', e);
              };
          }
      });
  }

  openBtn.addEventListener('click', async () => {
     await storageService.init();
     const db = storageService.db;
     const transaction = db.transaction([storageService.historyStoreName], 'readonly');
     const store = transaction.objectStore(storageService.historyStoreName);
     const request = store.getAllKeys();

     request.onsuccess = async () => {
         const keys = request.result;
         if (chipsContainer) chipsContainer.innerHTML = '';
         if (keys.length === 0) {
             selectedLocation = null;
             renderYIPGrid(null);
         } else {
             keys.forEach(k => {
                 const chip = document.createElement('div');
                 chip.className = 'yip-chip';
                 chip.dataset.value = k;
                 chip.textContent = k;
                 if (k === selectedLocation || (!selectedLocation && keys.indexOf(k) === 0)) {
                     chip.classList.add('active');
                     if (!selectedLocation) selectedLocation = k;
                 }
                 chip.addEventListener('click', async () => {
                     chipsContainer.querySelectorAll('.yip-chip').forEach(c => c.classList.remove('active'));
                     chip.classList.add('active');
                     selectedLocation = k;
                     await loadLocationData(k);
                 });
                 chipsContainer.appendChild(chip);
             });
             if (keys.length > 0) {
                 const target = selectedLocation || keys[0];
                 selectedLocation = target;
                 await loadLocationData(target);
             }
         }
          modal.style.display = 'flex';
          if (!_yipScrollInit) { _yipScrollInit = true; initYipLocationScroll(); }
          requestAnimationFrame(updateYipScrollUI);
      };
   });

  closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
      if (e.target === modal) {
          modal.style.display = 'none';
      }
  });
}

let cachedHistory = null;

async function loadLocationData(locationName) {
    const history = await storageService.getHistory(locationName);
    cachedHistory = history;
    renderYIPGrid(history, selectedParam);
}

function populateParamSheet() {
  const container = document.getElementById('yip-param-sheet');
  if (!container) return;
  const existingBody = container.querySelector('.yip-bottom-sheet-body');
  const body = existingBody || document.createElement('div');
  body.className = 'yip-bottom-sheet-body';
  body.innerHTML = '';

  const categories = [
    { key: 'temp', label: t('config.yipCategoryTemp', 'Temperatura'), params: [
      { value: 'maxTemp', label: 'T. Máx' },
      { value: 'minTemp', label: 'T. Mín' },
      { value: 'apparentMax', label: 'Sensación Térmica' }
    ]},
    { key: 'precip', label: t('config.yipCategoryPrecip', 'Precipitación'), params: [
      { value: 'precip', label: t('config.precip', 'Precipitación') }
    ]},
    { key: 'wind', label: t('config.yipCategoryWind', 'Viento'), params: [
      { value: 'windMax', label: t('config.windMax', 'Viento Máx') },
      { value: 'gustMax', label: t('config.gustMax', 'Ráfagas') }
    ]},
    { key: 'aqi', label: t('config.yipCategoryAQI', 'Calidad del Aire'), params: [
      { value: 'aqi', label: 'AQI' }
    ]},
    { key: 'pollen', label: t('config.yipCategoryPollen', 'Polen'), params: [
      { value: 'pollen', label: t('config.pollen', 'Polen') },
      { value: 'pollen_alder', label: t('config.yipPollenAlder', 'Polen (Aliso)') },
      { value: 'pollen_birch', label: t('config.yipPollenBirch', 'Polen (Abedul)') },
      { value: 'pollen_grass', label: t('config.yipPollenGrass', 'Polen (Gramíneas)') },
      { value: 'pollen_mugwort', label: t('config.yipPollenMugwort', 'Polen (Artemisa)') },
      { value: 'pollen_olive', label: t('config.yipPollenOlive', 'Polen (Olivo)') },
      { value: 'pollen_ragweed', label: t('config.yipPollenRagweed', 'Polen (Ambrosía)') }
    ]}
  ];

  categories.forEach(cat => {
    const catDiv = document.createElement('div');
    catDiv.className = 'yip-param-category';
    const catTitle = document.createElement('div');
    catTitle.className = 'yip-param-category-title';
    catTitle.textContent = cat.label;
    catDiv.appendChild(catTitle);

    cat.params.forEach(p => {
      const opt = document.createElement('div');
      opt.className = 'yip-param-item' + (p.value === selectedParam ? ' active' : '');
      opt.dataset.value = p.value;
      opt.innerHTML =
        `<span class="yip-param-item-label">${p.label}</span>` +
        `<span class="material-symbols-outlined yip-param-item-check">check</span>`;
      opt.addEventListener('click', () => {
        selectedParam = p.value;
        const paramDisplay = document.getElementById('yip-param-display');
        if (paramDisplay) {
          const labelSpan = paramDisplay.querySelector('span:first-child');
          if (labelSpan) labelSpan.textContent = p.label;
        }
        if (cachedHistory) renderYIPGrid(cachedHistory, selectedParam);
        if (_closeSheet) _closeSheet();
      });
      catDiv.appendChild(opt);
    });

    body.appendChild(catDiv);
  });

  if (!existingBody) container.appendChild(body);
}

function renderYIPGrid(history, param) {
    const container = document.getElementById('yip-grid-container');
    const legend = document.getElementById('yip-legend');

    container.innerHTML = '';
    legend.innerHTML = '';

    if (!history || !history.daily || history.daily.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 20px;">Sin historial para mostrar. Usa la app diariamente para acumular datos.</div>';
        return;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const yearGrid = Array.from({length: 12}, () => new Array(31).fill(null));
    const yearFullData = Array.from({length: 12}, () => new Array(31).fill(null));

    history.daily.forEach(d => {
        const date = new Date(d.time);
        if (date.getFullYear() === currentYear) {
            const m = date.getMonth();
            const day = date.getDate() - 1;

            let val = null;
            if (param === 'maxTemp') val = d.tempMax;
            else if (param === 'minTemp') val = d.tempMin;
            else if (param === 'apparentMax') val = d.apparentMax !== undefined ? d.apparentMax : d.tempMax;
            else if (param === 'precip') val = d.precipTotal || 0;
            else if (param === 'windMax') val = d.windMax || 0;
            else if (param === 'gustMax') val = d.gustMax || 0;
            else if (param === 'aqi') val = d.aqi || 0;
            else if (param === 'pollen') {
                val = getAggregatedPollenLevel(d.pollenDetails || {});
            } else if (param.startsWith('pollen_')) {
                const type = param.replace('pollen_', '');
                const raw = (d.pollenDetails && d.pollenDetails[type]) ? d.pollenDetails[type] : 0;
                val = getPollenLevelByType(type, raw);
            }

            yearGrid[m][day] = val;
            yearFullData[m][day] = d;
        }
    });

    const monthNames = [
        t('months.long.0', 'Enero'), t('months.long.1', 'Febrero'), t('months.long.2', 'Marzo'),
        t('months.long.3', 'Abril'), t('months.long.4', 'Mayo'), t('months.long.5', 'Junio'),
        t('months.long.6', 'Julio'), t('months.long.7', 'Agosto'), t('months.long.8', 'Septiembre'),
        t('months.long.9', 'Octubre'), t('months.long.10', 'Noviembre'), t('months.long.11', 'Diciembre')
    ];

    for (let m=0; m<12; m++) {
        const monthBlock = document.createElement('div');
        monthBlock.className = 'yip-month-block';

        const titleRow = document.createElement('div');
        titleRow.style.display = 'flex';
        titleRow.style.justifyContent = 'space-between';
        titleRow.style.alignItems = 'center';
        titleRow.style.marginBottom = '8px';

        const title = document.createElement('div');
        title.className = 'yip-month-title';
        title.style.marginBottom = '0';
        title.textContent = monthNames[m];

        const delBtn = document.createElement('button');
        delBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">delete</span>';
        delBtn.style.background = 'transparent';
        delBtn.style.border = 'none';
        delBtn.style.color = 'var(--text-secondary)';
        delBtn.style.cursor = 'pointer';
        delBtn.title = t('config.deleteMonthData', 'Borrar datos del mes');
        delBtn.onclick = async () => {
            const confirmText = (t('config.deleteMonthDataConfirm') || '¿Borrar todos los datos de {month} en {loc}?').replace('{loc}', selectedLocation).replace('{month}', monthNames[m]);
            const confirmed = await showConfirm(
                t('config.confirmAction', 'Confirmar'),
                confirmText
            );

            if (confirmed && selectedLocation) {
                await storageService.init();
                const db = storageService.db;
                const tx = db.transaction([storageService.historyStoreName], 'readwrite');
                const store = tx.objectStore(storageService.historyStoreName);
                const getReq = store.get(selectedLocation);
                getReq.onsuccess = () => {
                    if (getReq.result) {
                        if (getReq.result.daily) {
                            getReq.result.daily = getReq.result.daily.filter(d => {
                                const dDate = new Date(d.time);
                                return !(dDate.getMonth() === m && dDate.getFullYear() === currentYear);
                            });
                        }
                        if (getReq.result.hourly) {
                            getReq.result.hourly = getReq.result.hourly.filter(h => {
                                const hDate = new Date(h.time);
                                return !(hDate.getMonth() === m && hDate.getFullYear() === currentYear);
                            });
                        }
                        const putReq = store.put(getReq.result, selectedLocation);
                        putReq.onsuccess = () => {
                            renderYIPGrid(getReq.result, selectedParam);
                        };
                    }
                };
            }
        };

        titleRow.appendChild(title);
        titleRow.appendChild(delBtn);
        monthBlock.appendChild(titleRow);

        const monthGrid = document.createElement('div');
        monthGrid.className = 'yip-month-grid';

        const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
        const firstDay = new Date(currentYear, m, 1).getDay();
        const emptyDays = firstDay === 0 ? 6 : firstDay - 1;

        for (let e=0; e<emptyDays; e++) {
            const emptyCell = document.createElement('div');
            emptyCell.style.pointerEvents = 'none';
            monthGrid.appendChild(emptyCell);
        }

        for (let day=0; day<daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'yip-day-cell';

            const isFuture = (m > currentMonth) || (m === currentMonth && day > currentDay - 1);
            if (isFuture) {
                cell.classList.add('future');
            } else {
                const val = yearGrid[m][day];
                if (val !== null && val !== undefined) {
                    cell.style.backgroundColor = getColorForParam(param, val);
                    cell.classList.add('completed');
                    cell.onclick = () => openYIPDetail(yearFullData[m][day], `${day+1} ${monthNames[m]} ${currentYear}`);
                }
            }
            monthGrid.appendChild(cell);
        }

        monthBlock.appendChild(monthGrid);
        container.appendChild(monthBlock);
    }

    renderLegend(param, legend);
}

function openYIPDetail(data, dateStr) {
    if (!data) return;

    document.getElementById('yip-detail-date').textContent = dateStr;
    const desc = document.getElementById('yip-detail-desc');
    desc.textContent = `T. Máx: ${data.tempMax !== undefined ? Math.round(data.tempMax) : '-'}°C | T. Mín: ${data.tempMin !== undefined ? Math.round(data.tempMin) : '-'}°C`;

    const details = data.pollenDetails || {};
    const pollenLevel = getAggregatedPollenLevel(details);
    const pollenTypeNames = { alder: 'Aliso', birch: 'Abedul', grass: 'Gramíneas', mugwort: 'Artemisa', olive: 'Olivo', ragweed: 'Ambrosía' };
    const pollenSpeciesHtml = Object.keys(pollenTypeNames).map(type => {
        const raw = details[type] || 0;
        const level = getPollenLevelByType(type, raw);
        return `<div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-secondary);padding:2px 0;border-bottom:1px solid var(--grid-color);">
            <span>${pollenTypeNames[type]}</span>
            <span>${raw} — Nv.${level}</span>
        </div>`;
    }).join('');

    const metricsHtml = `
        <div class="yip-detail-item">
            <span class="yip-detail-label">Precipitación</span>
            <span class="yip-detail-value">${data.precipTotal?.toFixed(1) || 0} mm</span>
        </div>
        <div class="yip-detail-item">
            <span class="yip-detail-label">Viento / Rachas</span>
            <span class="yip-detail-value">${Math.round(data.windMax || 0)} / ${Math.round(data.gustMax || 0)} km/h</span>
        </div>
        <div class="yip-detail-item">
            <span class="yip-detail-label">Calidad Aire (AQI)</span>
            <span class="yip-detail-value">${data.aqi || 0}</span>
        </div>
        <div class="yip-detail-item">
            <span class="yip-detail-label">Polen (Máx)</span>
            <span class="yip-detail-value">Nv.${pollenLevel}</span>
        </div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--grid-color);">
            <div style="font-size:0.75rem;font-weight:700;color:var(--text-secondary);margin-bottom:4px;">Especies</div>
            ${pollenSpeciesHtml}
        </div>
    `;
    document.getElementById('yip-detail-metrics').innerHTML = metricsHtml;

    window.openBottomSheet('yip-detail-sheet', 'yip-sheet-backdrop');
}

function getColorForParam(param, value) {
    if (param === 'maxTemp' || param === 'minTemp' || param === 'apparentMax') {
        if (value < 0) return '#3b82f6';
        if (value < 10) return '#60a5fa';
        if (value < 15) return '#93c5fd';
        if (value < 20) return '#fde047';
        if (value < 25) return '#facc15';
        if (value < 30) return '#fb923c';
        if (value < 35) return '#ea580c';
        return '#dc2626';
    } else if (param === 'precip') {
        if (value === 0) return 'var(--grid-color)';
        if (value < 2) return '#bfdbfe';
        if (value < 5) return '#60a5fa';
        if (value < 15) return '#3b82f6';
        return '#1d4ed8';
    } else if (param === 'windMax' || param === 'gustMax') {
        if (value < 10) return '#ccfbf1';
        if (value < 20) return '#5eead4';
        if (value < 40) return '#06b6d4';
        if (value < 60) return '#6366f1';
        return '#d946ef';
    } else if (param === 'aqi') {
        if (value <= 50) return '#22c55e';
        if (value <= 100) return '#eab308';
        if (value <= 150) return '#f97316';
        if (value <= 200) return '#ef4444';
        if (value <= 300) return '#a855f7';
        return '#9f1239';
    } else if (param.startsWith('pollen')) {
        if (value === 0) return 'var(--grid-color)';
        if (value === 1) return '#a3e635';
        if (value === 2) return '#facc15';
        if (value === 3) return '#f97316';
        return '#dc2626';
    }
    return 'var(--grid-color)';
}

function renderLegend(param, legendContainer) {
    let steps = [];
    if (param === 'maxTemp' || param === 'minTemp' || param === 'apparentMax') {
        steps = [
            { c: '#3b82f6', l: '<0°' },
            { c: '#93c5fd', l: '10°' },
            { c: '#fde047', l: '20°' },
            { c: '#fb923c', l: '30°' },
            { c: '#dc2626', l: '35°+' }
        ];
    } else if (param === 'precip') {
        steps = [
            { c: '#bfdbfe', l: '<2mm' },
            { c: '#60a5fa', l: '5mm' },
            { c: '#3b82f6', l: '15mm' },
            { c: '#1d4ed8', l: '>15mm' }
        ];
    } else if (param === 'windMax' || param === 'gustMax') {
        steps = [
            { c: '#ccfbf1', l: '<10' },
            { c: '#5eead4', l: '20' },
            { c: '#06b6d4', l: '40' },
            { c: '#6366f1', l: '60' },
            { c: '#d946ef', l: '60+' }
        ];
    } else if (param === 'aqi') {
        steps = [
            { c: '#22c55e', l: t('config.legendGood') },
            { c: '#eab308', l: t('config.legendMod') },
            { c: '#f97316', l: t('config.legendUnhealthyS') },
            { c: '#ef4444', l: t('config.legendBad') }
        ];
    } else if (param.startsWith('pollen')) {
        steps = [
            { c: 'var(--grid-color)', l: t('pollenLevels.none', 'Ninguno') },
            { c: '#a3e635', l: t('pollenLevels.low', 'Bajo') },
            { c: '#facc15', l: t('pollenLevels.moderate', 'Moderado') },
            { c: '#f97316', l: t('pollenLevels.high', 'Alto') },
            { c: '#dc2626', l: t('pollenLevels.veryHigh', 'Muy Alto') }
        ];
    }

    steps.forEach(s => {
        legendContainer.insertAdjacentHTML('beforeend', `
            <div style="display:flex; align-items:center; gap:4px;">
                <div style="width:12px; height:12px; background:${s.c}; border-radius:2px;"></div>
                <span>${s.l}</span>
            </div>
        `);
    });
}

let _yipScrollListenersAttached = false;

function initYipLocationScroll() {
    if (_yipScrollListenersAttached) return;
    _yipScrollListenersAttached = true;

    const container = document.getElementById('yip-location-chips');
    if (!container) return;

    container.addEventListener('scroll', updateYipScrollUI, { passive: true });

    const observer = new MutationObserver(() => {
        requestAnimationFrame(updateYipScrollUI);
    });
    observer.observe(container, { childList: true, subtree: true });
}

function updateYipScrollUI() {
    const container = document.getElementById('yip-location-chips');
    const dotsContainer = document.getElementById('yip-location-dots');
    if (!container || !dotsContainer) return;

    const hasOverflow = container.scrollWidth > container.clientWidth;

    if (!hasOverflow) {
        dotsContainer.innerHTML = '';
        return;
    }

    const pageWidth = container.clientWidth;
    const totalPages = Math.max(1, Math.ceil(container.scrollWidth / pageWidth));
    const currentPage = Math.round(container.scrollLeft / pageWidth);

    let html = '';
    for (let i = 0; i < totalPages; i++) {
        html += `<span class="yip-dot${i === currentPage ? ' active' : ''}"></span>`;
    }
    dotsContainer.innerHTML = html;
}

async function showConfirm(title, message) {
    return new Promise((resolve) => {
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-message');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        const okBtn = document.getElementById('confirm-ok-btn');

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;

        if (cancelBtn) cancelBtn.textContent = t('config.cancel') || 'Cancelar';
        if (okBtn) okBtn.textContent = t('config.accept') || 'Aceptar';

        if (okBtn) {
            const newOk = okBtn.cloneNode(true);
            okBtn.parentNode.replaceChild(newOk, okBtn);
            newOk.onclick = () => {
                closeFn();
                resolve(true);
            };
        }
        if (cancelBtn) {
            const newCancel = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
            newCancel.onclick = () => {
                closeFn();
                resolve(false);
            };
        }

        const closeFn = window.openBottomSheet ? window.openBottomSheet('confirm-modal', 'confirm-sheet-backdrop') : () => { resolve(confirm(message)); };
    });
}

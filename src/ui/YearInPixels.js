import { storageService } from '../services/StorageService.js';
import { getThemeColor } from '../theme.js';
import { t } from '../utils/i18n.js';
import { ModalManager } from '../services/ModalManager.js';

export function initYearInPixels() {
  const openBtn = document.getElementById('year-in-pixels-btn');
  const modal = document.getElementById('yip-modal');
  const closeBtn = document.getElementById('close-yip-modal-btn');
  const locSelect = document.getElementById('yip-location-select');
  const paramSelect = document.getElementById('yip-param-select');
  const delLocBtn = document.getElementById('yip-delete-loc-btn');

  if (!openBtn || !modal) return;
  
  if (delLocBtn) {
      delLocBtn.addEventListener('click', async () => {
          const locSelectValue = document.getElementById('yip-location-select')?.value;
          if (!locSelectValue) return;
          
          const confirmText = (t('config.deleteLocConfirm') || `¿Borrar todos los datos históricos de {loc}?`).replace('{loc}', locSelectValue);
          const confirmed = await showConfirm(
              t('config.confirmAction', 'Confirmar'),
              confirmText
          );

            if (confirmed) {
                await storageService.init();
                const db = storageService.db;
                const tx = db.transaction([storageService.historyStoreName], 'readwrite');
                const store = tx.objectStore(storageService.historyStoreName);
                const req = store.delete(locSelectValue);
                req.onsuccess = () => {
                    ModalManager.closeAll();
                };
              req.onerror = (e) => {
                  console.error('Error deleting location historical data:', e);
              };
          }
      });
  }

  openBtn.addEventListener('click', async () => {
     // Fetch all available keys in historyStoreName
     await storageService.init();
     const db = storageService.db;
     
     const transaction = db.transaction([storageService.historyStoreName], 'readonly');
     const store = transaction.objectStore(storageService.historyStoreName);
     const request = store.getAllKeys();
     
     request.onsuccess = async () => {
         const keys = request.result;
         locSelect.innerHTML = '';
         if (keys.length === 0) {
             const opt = document.createElement('option');
             opt.value = "";
             opt.textContent = "No hay datos históricos guardados";
             locSelect.appendChild(opt);
             renderYIPGrid(null);
         } else {
             // Fill dropdown
             keys.forEach(k => {
                 const opt = document.createElement('option');
                 opt.value = k;
                 opt.textContent = k;
                 locSelect.appendChild(opt);
             });
             // Select the first one or the currently viewed one
             if (keys.length > 0) {
                locSelect.value = keys[0];
                await loadLocationData(keys[0]);
             }
         }
          ModalManager.openModal(modal, {
              show: (el) => el.style.display = 'flex',
              hide: (el) => el.style.display = 'none'
          });
     };
  });

  closeBtn.addEventListener('click', () => {
      ModalManager.closeModal(modal);
  });

  modal.addEventListener('click', (e) => {
      if (e.target === modal) {
          ModalManager.closeModal(modal);
      }
  });

  locSelect.addEventListener('change', async (e) => {
      if (e.target.value) {
         await loadLocationData(e.target.value);
      }
  });

  paramSelect.addEventListener('change', () => {
     if (locSelect.value) {
         renderYIPGrid(cachedHistory, paramSelect.value);
     }
  });
}

let cachedHistory = null;

async function loadLocationData(locationName) {
    const history = await storageService.getHistory(locationName);
    cachedHistory = history;
    const param = document.getElementById('yip-param-select').value;
    renderYIPGrid(history, param);
}

function renderYIPGrid(history, param) {
    const container = document.getElementById('yip-grid-container');
    const legend = document.getElementById('yip-legend');
    const locSelect = document.getElementById('yip-location-select');
    const paramSelect = document.getElementById('yip-param-select');
    
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
    
    // Group days by month (0-11) and day (0-30)
    const yearGrid = Array.from({length: 12}, () => new Array(31).fill(null));
    const yearFullData = Array.from({length: 12}, () => new Array(31).fill(null));
    
    history.daily.forEach(d => {
        const date = new Date(d.time);
        if (date.getFullYear() === currentYear) {
            const m = date.getMonth();
            const day = date.getDate() - 1; // 0-based
            
            let val = null;
            if (param === 'maxTemp') val = d.tempMax;
            else if (param === 'minTemp') val = d.tempMin;
            else if (param === 'apparentMax') val = d.apparentMax !== undefined ? d.apparentMax : d.tempMax;
            else if (param === 'precip') val = d.precipTotal || 0;
            else if (param === 'windMax') val = d.windMax || 0;
            else if (param === 'gustMax') val = d.gustMax || 0;
            else if (param === 'aqi') val = d.aqi || 0;
            else if (param === 'pollen') val = d.pollen || 0;
            else if (param.startsWith('pollen_')) {
                const type = param.replace('pollen_', '');
                val = (d.pollenDetails && d.pollenDetails[type]) ? d.pollenDetails[type] : 0;
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
            const dloc = document.getElementById('yip-location-select')?.value;
            const confirmText = (t('config.deleteMonthDataConfirm') || `¿Borrar todos los datos de {month} en {loc}?`).replace('{loc}', dloc).replace('{month}', monthNames[m]);
            const confirmed = await showConfirm(
                t('config.confirmAction', 'Confirmar'),
                confirmText
            );
            
            if (confirmed && dloc) {
                await storageService.init();
                const db = storageService.db;
                const tx = db.transaction([storageService.historyStoreName], 'readwrite');
                const store = tx.objectStore(storageService.historyStoreName);
                const getReq = store.get(dloc);
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
                        const putReq = store.put(getReq.result, dloc);
                        putReq.onsuccess = () => {
                            renderYIPGrid(getReq.result, paramSelect.value);
                            // Cierra el modal de confirmación si procede, aunque como es de fondo ya debería
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
        const firstDay = new Date(currentYear, m, 1).getDay(); // 0 is Sunday, 1 is Monday
        const emptyDays = firstDay === 0 ? 6 : firstDay - 1; // Assuming Monday is first
        
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
    const sheet = document.getElementById('yip-detail-sheet');
    
    document.getElementById('yip-detail-date').textContent = dateStr;
    const desc = document.getElementById('yip-detail-desc');
    desc.textContent = `T. Máx: ${data.tempMax !== undefined ? Math.round(data.tempMax) : '-'}°C | T. Mín: ${data.tempMin !== undefined ? Math.round(data.tempMin) : '-'}°C`;
    
    const details = data.pollenDetails || {};
    const pollenHtml = Object.keys(details).length > 0 ? 
        `<div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">Gramíneas: ${details.grass||0} | Olivo: ${details.olive||0} | Abedul: ${details.birch||0}</div>` : '';

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
            <span class="yip-detail-value">${data.pollen || 0}</span>
            ${pollenHtml}
        </div>
    `;
    document.getElementById('yip-detail-metrics').innerHTML = metricsHtml;
    
    ModalManager.openModal(sheet, { canSwipeClose: true, handleId: 'yip-detail-sheet-drag-handle' });
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
        if (value < 10) return '#ccfbf1'; // teal-50
        if (value < 20) return '#5eead4'; // teal-300
        if (value < 40) return '#06b6d4'; // cyan-500
        if (value < 60) return '#6366f1'; // indigo-500
        return '#d946ef'; // fuchsia-500
    } else if (param === 'aqi') {
        if (value <= 50) return '#22c55e'; // green
        if (value <= 100) return '#eab308'; // yellow
        if (value <= 150) return '#f97316'; // orange
        if (value <= 200) return '#ef4444'; // red
        if (value <= 300) return '#a855f7'; // purple
        return '#9f1239'; // rose-800
    } else if (param.startsWith('pollen')) {
        if (value === 0) return 'var(--grid-color)';
        if (value === 1) return '#a3e635'; // lime
        if (value === 2) return '#facc15'; // yellow
        if (value === 3) return '#f97316'; // orange
        return '#dc2626'; // red
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
            { c: '#a3e635', l: t('config.legendLow') },
            { c: '#facc15', l: t('config.legendMod') },
            { c: '#f97316', l: t('config.legendHigh') },
            { c: '#dc2626', l: t('config.legendVeryHigh') }
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

/**
 * Shared confirm modal logic for YIP
 */
async function showConfirm(title, message) {
    return ModalManager.showConfirm(title, message, {
        okText: t('config.accept') || 'Aceptar',
        cancelText: t('config.cancel') || 'Cancelar'
    });
}

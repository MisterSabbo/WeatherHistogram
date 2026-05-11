import { storageService } from '../services/StorageService.js';
import { getThemeColor } from '../theme.js';

export function initYearInPixels() {
  const openBtn = document.getElementById('year-in-pixels-btn');
  const modal = document.getElementById('yip-modal');
  const closeBtn = document.getElementById('close-yip-modal-btn');
  const locSelect = document.getElementById('yip-location-select');
  const paramSelect = document.getElementById('yip-param-select');

  if (!openBtn || !modal) return;

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
                await loadLocationData(keys[0]);
             }
         }
         modal.style.display = 'flex';
     };
  });

  closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
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
    container.innerHTML = '';
    legend.innerHTML = '';

    if (!history || !history.daily || history.daily.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 20px;">Sin historial para mostrar. Usa la app diariamente para acumular datos.</div>';
        return;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Group days by month (0-11) and day (1-31)
    const yearGrid = Array.from({length: 12}, () => new Array(31).fill(null));
    
    history.daily.forEach(d => {
        const date = new Date(d.time);
        if (date.getFullYear() === currentYear) {
            const m = date.getMonth();
            const day = date.getDate() - 1; // 0-based
            
            let val = null;
            if (param === 'maxTemp') val = d.tempMax;
            if (param === 'minTemp') val = d.tempMin;
            if (param === 'precip') val = d.precipTotal || 0; // precip might not be tracked right in daily, usually it is sum or we can extract it if needed. Wait, open-meteo daily has short info. We will use tempMax for now.
            
            yearGrid[m][day] = val;
        }
    });

    // We draw columns as months and rows as days to fit "Year in pixels" standard.
    // Or normally it is 12 columns (months) x 31 rows (days)
    
    // Header row: empty corner + 12 months
    const monthNames = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
    // Since our container uses repeat(12, 1fr), we maybe should make it 13 cols to include row numbers?
    container.style.gridTemplateColumns = 'repeat(13, 1fr)';
    
    // Empty top-left
    let headerHTML = '<div></div>';
    for (let m=0; m<12; m++) {
        headerHTML += `<div style="text-align: center; font-size: 0.7rem; font-weight: bold; color: var(--text-secondary);">${monthNames[m]}</div>`;
    }
    container.insertAdjacentHTML('beforeend', headerHTML);

    for (let day=0; day<31; day++) {
        // Row header
        const rowHeader = document.createElement('div');
        rowHeader.style.fontSize = '0.7rem';
        rowHeader.style.color = 'var(--text-secondary)';
        rowHeader.style.textAlign = 'right';
        rowHeader.style.paddingRight = '4px';
        rowHeader.style.display = 'flex';
        rowHeader.style.alignItems = 'center';
        rowHeader.style.justifyContent = 'flex-end';
        rowHeader.innerText = (day + 1).toString();
        container.appendChild(rowHeader);

        for (let m=0; m<12; m++) {
            const cell = document.createElement('div');
            cell.style.aspectRatio = '1 / 1';
            cell.style.borderRadius = '2px';
            cell.style.backgroundColor = 'var(--grid-color)';
            
            const val = yearGrid[m][day];
            if (val !== null && val !== undefined) {
               cell.style.backgroundColor = getColorForParam(param, val);
               cell.title = `Día ${day+1} ${monthNames[m]}: ${Math.round(val)}`;
            } else {
               // Check if date is valid
               const tempDate = new Date(currentYear, m, day+1);
               if (tempDate.getMonth() !== m) {
                   cell.style.backgroundColor = 'transparent'; // invalid date like Feb 30
               }
            }
            container.appendChild(cell);
        }
    }

    renderLegend(param, legend);
}

function getColorForParam(param, value) {
    if (param === 'maxTemp' || param === 'minTemp') {
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
    }
    return 'var(--grid-color)';
}

function renderLegend(param, legendContainer) {
    let steps = [];
    if (param === 'maxTemp' || param === 'minTemp') {
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

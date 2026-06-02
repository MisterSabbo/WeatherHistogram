import { storageService } from '../services/StorageService.js';
import { t } from '../utils/i18n.js';
import { getPollenLevelByType, getAggregatedPollenLevel } from '../services/AqiManager.js';
import { getTextColorForBg } from '../utils/color.js';
import { state } from '../store.js';
import { openBottomSheet } from './BottomSheet.js';
import { showConfirm } from './ConfirmModal.js';

const MOODS = [
  { id: 'happy', emoji: '😊', labelKey: 'moods.happy', color: '#fbbf24' },
  { id: 'neutral', emoji: '😐', labelKey: 'moods.neutral', color: '#94a3b8' },
  { id: 'sad', emoji: '😢', labelKey: 'moods.sad', color: '#60a5fa' },
  { id: 'angry', emoji: '😠', labelKey: 'moods.angry', color: '#ef4444' },
  { id: 'anxious', emoji: '😰', labelKey: 'moods.anxious', color: '#a855f7' },
  { id: 'tired', emoji: '😴', labelKey: 'moods.tired', color: '#6b7280' }
];

const DOT_COLORS = {
  notes: '#60a5fa',
  mood: '#fbbf24',
  cold: '#ef4444',
  allergies: '#22c55e'
};

let selectedLocation = null;
let selectedParam = 'maxTemp';
let _closeSheet = null;
let _closeDetailSheet = null;
let _closeYipModal = null;

let _yipDragState = null;

let _yipScrollInit = false;

let _yipTheme = 'dark';
let _activeLegendTab = 'cell';
let _legendTabListenersAttached = false;

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
      _closeSheet = openBottomSheet('yip-param-sheet', 'yip-param-sheet-backdrop', 'yip-param-options-container');
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
                   closeYipModal();
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
                  chip.dataset.value = String(k);
                  chip.textContent = String(k);
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
          modal.classList.add('open');
          const backdrop = document.getElementById('yip-modal-backdrop');
          if (backdrop) backdrop.classList.add('open');
          if (!_yipScrollInit) { _yipScrollInit = true; initYipLocationScroll(); }
          requestAnimationFrame(updateYipScrollUI);
      };
   });

  closeBtn.addEventListener('click', () => {
      closeYipModal();
  });

  const backdrop = document.getElementById('yip-modal-backdrop');
  if (backdrop) {
      backdrop.addEventListener('click', () => {
          closeYipModal();
      });
  }

  _closeYipModal = closeYipModal;

  _initYipModalDrag();
}

function closeYipModal() {
  const modal = document.getElementById('yip-modal');
  const backdrop = document.getElementById('yip-modal-backdrop');
  if (modal) {
    modal.classList.remove('open');
    modal.style.transform = '';
    modal.style.transition = '';
  }
  if (backdrop) backdrop.classList.remove('open');
  if (_yipDragState) {
    _yipDragState = null;
  }
}

function _initYipModalDrag() {
  const modal = document.getElementById('yip-modal');
  const scrollContent = document.getElementById('yip-modal-scroll-content');
  if (!modal || !scrollContent) return;

  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  const threshold = 100;

  function canDragFrom(target) {
    if (target.closest('.yip-modal-drag-handle')) return true;
    const header = target.closest('.yip-modal-header');
    if (header && !target.closest('button')) return true;
    const fieldsBar = target.closest('.yip-modal-fields-bar');
    if (fieldsBar && !target.closest('button, input, select, textarea, .yip-chip, .yip-mood-btn')) return true;
    return false;
  }

  function onStart(clientY) {
    if (!modal.classList.contains('open')) return;

    _yipDragState = { startY: clientY, currentY: clientY, isDragging: true };
    isDragging = true;
    startY = clientY;
    currentY = clientY;
    modal.style.transition = 'none';
  }

  function onMove(clientY) {
    if (!isDragging) return;
    currentY = clientY;
    const delta = currentY - startY;
    if (delta > 0) {
      modal.style.transform = `translateY(${delta}px)`;
    }
  }

  function onEnd() {
    if (!isDragging) return;
    isDragging = false;
    modal.style.transition = '';
    const delta = currentY - startY;
    if (delta > threshold) {
      closeYipModal();
    } else {
      modal.style.transform = 'translateY(0)';
    }
    _yipDragState = null;
  }

  modal.addEventListener('pointerdown', (e) => {
    if (!canDragFrom(e.target)) return;
    e.preventDefault();
    onStart(e.clientY);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  });

  function onPointerMove(e) {
    onMove(e.clientY);
  }

  function onPointerUp() {
    onEnd();
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
  }

  scrollContent.addEventListener('touchstart', (e) => {
    if (!modal.classList.contains('open')) return;
    if (scrollContent.scrollTop > 0) return;
    const touch = e.touches[0];
    onStart(touch.clientY);
  }, { passive: true });

  scrollContent.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const delta = touch.clientY - startY;
    if (delta > 0) {
      e.preventDefault();
      onMove(touch.clientY);
    } else {
      isDragging = false;
      modal.style.transition = '';
      modal.style.transform = '';
    }
  }, { passive: false });

  scrollContent.addEventListener('touchend', () => {
    onEnd();
  }, { passive: true });

  scrollContent.addEventListener('touchcancel', () => {
    onEnd();
  }, { passive: true });
}

let cachedHistory = null;

async function loadLocationData(locationName) {
    const history = await storageService.getHistory(locationName);
    cachedHistory = history;
    renderYIPGrid(history, selectedParam);
}

function populateParamSheet() {
  const container = document.getElementById('yip-param-options-container');
  if (!container) return;
  container.innerHTML = '';

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
    ]},
    { key: 'mood', label: t('config.yipMoodsParam', 'Mood'), params: [
      { value: 'mood', label: t('config.yipMoodsParam', 'Mood') }
    ]},
    { key: 'health', label: t('config.yipCategoryHealth', 'Health'), params: [
      { value: 'cold', label: t('config.yipCold', 'Cold') },
      { value: 'allergies', label: t('config.yipAllergies', 'Allergies') }
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

    container.appendChild(catDiv);
  });
}

function renderYIPGrid(history, param) {
    const container = document.getElementById('yip-grid-container');

    container.innerHTML = '';

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
            } else             if (param === 'mood') {
                if (d.moods && d.moods.length > 0) {
                    const moodDef = MOODS.find(m => m.id === d.moods[0]);
                    val = moodDef ? moodDef.id : null;
                }
            } else if (param === 'cold') {
                val = d.cold ? true : false;
            } else if (param === 'allergies') {
                val = d.allergies ? true : false;
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

    const cardBgColor = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim();
    _yipTheme = state.theme;

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

        // DAY-OF-WEEK HEADERS
        const dayHeaders = document.createElement('div');
        dayHeaders.className = 'yip-month-day-headers';
        const dayNames = t('days.short', ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']);
        const dayOrder = [1, 2, 3, 4, 5, 6, 0];
        for (let d = 0; d < 7; d++) {
            const header = document.createElement('span');
            header.className = 'yip-month-day-header';
            header.textContent = dayNames[dayOrder[d]];
            dayHeaders.appendChild(header);
        }
        monthBlock.appendChild(dayHeaders);

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

            const dayNum = document.createElement('span');
            dayNum.className = 'yip-day-number';
            dayNum.textContent = String(day + 1);
            cell.appendChild(dayNum);

            const isFuture = (m > currentMonth) || (m === currentMonth && day > currentDay - 1);
            if (isFuture) {
                dayNum.style.color = getTextColorForBg(cardBgColor);
                cell.classList.add('future');
            } else {
                const val = yearGrid[m][day];
                let dayData = yearFullData[m][day];

                if (val !== null && val !== undefined) {
                    const cellBg = getColorForParam(param, val);
                    cell.style.backgroundColor = cellBg;
                    dayNum.style.color = getTextColorForBg(cellBg);
                    cell.classList.add('completed');
                } else {
                    dayNum.style.color = getTextColorForBg(cardBgColor);
                    cell.classList.add('past-no-data');
                    if (!dayData) {
                        dayData = { time: new Date(currentYear, m, day + 1).getTime() };
                    }
                }
                if (dayData && dayData.time !== undefined) {
                    cell.dataset.time = String(dayData.time);
                }

                const dotStates = [];
                if (dayData && dayData.notes) dotStates.push('notes');
                if (dayData && dayData.moods && dayData.moods.length > 0) dotStates.push('mood');
                if (dayData && dayData.cold) dotStates.push('cold');
                if (dayData && dayData.allergies) dotStates.push('allergies');

                if (dotStates.length > 0) {
                    const dotContainer = document.createElement('div');
                    dotContainer.className = 'yip-dot-container';
                    const dotLimit = dotStates.length > 3 ? 2 : 3;
                    const visibleDots = dotStates.slice(0, dotLimit);
                    visibleDots.forEach(state => {
                        const dot = document.createElement('span');
                        dot.className = 'yip-condition-dot';
                        dot.style.backgroundColor = DOT_COLORS[state];
                        dotContainer.appendChild(dot);
                    });
                    if (dotStates.length > 3) {
                        const badge = document.createElement('span');
                        badge.className = 'yip-dot-badge';
                        badge.textContent = `+${dotStates.length - 2}`;
                        dotContainer.appendChild(badge);
                    }
                    cell.appendChild(dotContainer);
                }
                cell.onclick = () => openYIPDetail(dayData, `${day+1} ${monthNames[m]} ${currentYear}`);
            }
            monthGrid.appendChild(cell);
        }

        monthBlock.appendChild(monthGrid);
        container.appendChild(monthBlock);
    }

    renderLegendTabs(param);
}

function openYIPDetail(data, dateStr, locationName) {
    const hasWeatherData = data && (data.tempMax !== undefined || data.precipTotal !== undefined);
    const loc = locationName || selectedLocation;

    const scrollContent = document.getElementById('yip-detail-sheet-scroll-content');
    if (scrollContent) scrollContent.scrollTop = 0;

    document.getElementById('yip-detail-date').textContent = dateStr;
    const desc = document.getElementById('yip-detail-desc');
    if (hasWeatherData) {
        desc.textContent = `T. Máx: ${data.tempMax !== undefined ? Math.round(data.tempMax) : '-'}°C | T. Mín: ${data.tempMin !== undefined ? Math.round(data.tempMin) : '-'}°C`;
    } else {
        desc.textContent = '';
    }

    const notesSection = document.getElementById('yip-detail-notes-section');
    const notesInput = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('yip-detail-notes-input'));

    if (notesSection) notesSection.style.display = 'block';
    if (notesInput) notesInput.value = data ? (data.notes || '') : '';
    if (notesInput) notesInput.placeholder = t('config.yipNotesPlaceholder', 'Write your notes...');

    const moodsSection = document.getElementById('yip-detail-moods-section');
    const moodsSelector = document.getElementById('yip-moods-selector');
    const existingMoods = data ? (data.moods || []) : [];

    if (moodsSection) moodsSection.style.display = 'block';

    const conditionsSection = document.getElementById('yip-detail-conditions-section');
    const coldToggle = document.getElementById('yip-cold-toggle');
    const allergiesToggle = document.getElementById('yip-allergies-toggle');

    if (conditionsSection) conditionsSection.style.display = 'block';
    if (coldToggle) {
        if (data && data.cold) {
            coldToggle.classList.add('active');
        } else {
            coldToggle.classList.remove('active');
        }
        coldToggle.onclick = () => {
            coldToggle.classList.toggle('active');
        };
    }
    if (allergiesToggle) {
        if (data && data.allergies) {
            allergiesToggle.classList.add('active');
        } else {
            allergiesToggle.classList.remove('active');
        }
        allergiesToggle.onclick = () => {
            allergiesToggle.classList.toggle('active');
        };
    }

    if (moodsSelector) {
        moodsSelector.innerHTML = '';
        MOODS.forEach(mood => {
            const btn = document.createElement('button');
            btn.className = 'yip-mood-btn' + (existingMoods.includes(mood.id) ? ' active' : '');
            btn.dataset.mood = mood.id;
            btn.style.setProperty('--mood-color', mood.color);
            btn.innerHTML = `${mood.emoji} ${t(mood.labelKey, mood.id)}<span class="yip-mood-check material-symbols-outlined">check</span>`;
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
            });
            moodsSelector.appendChild(btn);
        });
    }

    const metricsContainer = document.getElementById('yip-detail-metrics');
    if (hasWeatherData) {
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

        metricsContainer.innerHTML = `
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
    } else {
        metricsContainer.innerHTML = `<div class="yip-no-data-msg">${t('config.yipNoDataMeteo', 'Sin datos meteorológicos')}</div>`;
    }

    _closeDetailSheet = openBottomSheet('yip-detail-sheet', 'yip-sheet-backdrop', 'yip-detail-sheet-scroll-content');

    const saveBtn = /** @type {HTMLElement|null} */ (document.getElementById('yip-detail-save-btn'));
    const clearBtn = /** @type {HTMLElement|null} */ (document.getElementById('yip-detail-clear-btn'));
    const cancelBtn = /** @type {HTMLElement|null} */ (document.getElementById('yip-detail-cancel-btn'));
    const savedMsg = document.getElementById('yip-detail-saved-msg');
    if (savedMsg) savedMsg.style.display = 'none';

    if (saveBtn) {
        const newSave = /** @type {HTMLElement} */ (saveBtn.cloneNode(true));
        saveBtn.parentNode.replaceChild(newSave, saveBtn);
        newSave.onclick = () => saveDayDetail(data, loc);
    }
    if (clearBtn) {
        const newClear = /** @type {HTMLElement} */ (clearBtn.cloneNode(true));
        clearBtn.parentNode.replaceChild(newClear, clearBtn);
        newClear.onclick = () => {
            if (notesInput) notesInput.value = '';
            if (moodsSelector) {
                moodsSelector.querySelectorAll('.yip-mood-btn.active').forEach((btn) => {
                    btn.classList.remove('active');
                });
            }
            if (coldToggle) coldToggle.classList.remove('active');
            if (allergiesToggle) allergiesToggle.classList.remove('active');
        };
    }
    if (cancelBtn) {
        const newCancel = /** @type {HTMLElement} */ (cancelBtn.cloneNode(true));
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
        newCancel.onclick = () => {
            if (_closeDetailSheet) _closeDetailSheet();
        };
    }
}

async function saveDayNote(data, locationName) {
    const notesInput = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('yip-detail-notes-input'));
    const savedMsg = document.getElementById('yip-notes-saved-msg');
    const cancelBtn = /** @type {HTMLElement|null} */ (document.getElementById('yip-notes-cancel-btn'));
    const value = notesInput ? notesInput.value : '';

    const success = await storageService.updateDayNotes(locationName, data.time, value);
    if (success) {
        data.notes = value || undefined;
        if (savedMsg) {
            savedMsg.textContent = t('config.yipNotesSaved', 'Note saved');
            savedMsg.style.display = 'inline';
        }
        if (cancelBtn) cancelBtn.style.display = 'none';
        setTimeout(() => {
            if (savedMsg) savedMsg.style.display = 'none';
        }, 2000);
    }
}

async function saveDayMoods(data, locationName) {
    const moodsSelector = document.getElementById('yip-moods-selector');
    const moodsSavedMsg = document.getElementById('yip-moods-saved-msg');
    const loc = locationName || selectedLocation;

    const selectedMoods = [];
    if (moodsSelector) {
        moodsSelector.querySelectorAll('.yip-mood-btn.active').forEach((btn) => {
            const b = /** @type {HTMLElement} */ (btn);
            selectedMoods.push(b.dataset.mood);
        });
    }

    const success = await storageService.updateDayMoods(loc, data.time, selectedMoods);
    if (success) {
        data.moods = selectedMoods.length > 0 ? selectedMoods : undefined;
        if (moodsSavedMsg) {
            moodsSavedMsg.textContent = t('config.yipMoodsSaved', 'Mood saved!');
            moodsSavedMsg.style.display = 'inline';
        }
        setTimeout(() => {
            if (moodsSavedMsg) moodsSavedMsg.style.display = 'none';
        }, 2000);
    }
}

async function saveDayDetail(data, locationName) {
    const notesInput = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('yip-detail-notes-input'));
    const moodsSelector = document.getElementById('yip-moods-selector');
    const coldToggle = document.getElementById('yip-cold-toggle');
    const allergiesToggle = document.getElementById('yip-allergies-toggle');
    const loc = locationName || selectedLocation;

    const noteValue = notesInput ? notesInput.value : '';

    const selectedMoods = [];
    if (moodsSelector) {
        moodsSelector.querySelectorAll('.yip-mood-btn.active').forEach((btn) => {
            const b = /** @type {HTMLElement} */ (btn);
            selectedMoods.push(b.dataset.mood);
        });
    }

    const conditions = {
        cold: coldToggle ? coldToggle.classList.contains('active') : false,
        allergies: allergiesToggle ? allergiesToggle.classList.contains('active') : false
    };

    try {
        const ok = await storageService.updateDayData(loc, data.time, {
            notes: noteValue || undefined,
            moods: selectedMoods.length > 0 ? selectedMoods : undefined,
            cold: conditions.cold || undefined,
            allergies: conditions.allergies || undefined
        });

        if (ok) {
            data.notes = noteValue || undefined;
            data.moods = selectedMoods.length > 0 ? selectedMoods : undefined;
            data.cold = conditions.cold || undefined;
            data.allergies = conditions.allergies || undefined;

            if (cachedHistory && !cachedHistory.daily.some(d => d.time === data.time)) {
                cachedHistory.daily.push(data);
            }

            renderYIPGrid(cachedHistory, selectedParam);
        } else {
            showErrorToast(t('config.yipSaveError', 'Error saving'));
            return;
        }
    } catch (err) {
        console.error('YIP save error:', err);
        showErrorToast(t('config.yipSaveError', 'Error saving'));
        return;
    }

    const savedToast = document.getElementById('yip-detail-saved-toast');
    if (savedToast) {
        savedToast.textContent = t('config.yipSavedAll', '✓ Saved');
        savedToast.classList.add('visible');
        if (_closeDetailSheet) _closeDetailSheet();

        setTimeout(() => {
            if (cachedHistory) {
                highlightYIPCell(data.time);
            }
        }, 350);

        setTimeout(() => {
            savedToast.classList.remove('visible');
        }, 1350);
    } else {
        requestAnimationFrame(() => {
            if (_closeDetailSheet) _closeDetailSheet();
        });
    }
}

function highlightYIPCell(time) {
    const cell = /** @type {HTMLElement|null} */ (document.querySelector(`.yip-day-cell[data-time="${time}"]`));
    if (cell) {
        cell.classList.remove('yip-highlight-flash');
        void cell.offsetWidth;
        cell.classList.add('yip-highlight-flash');
        setTimeout(() => {
            cell.classList.remove('yip-highlight-flash');
        }, 1000);
    }
}

let _toastTimer = null;

function showErrorToast(message) {
    const toast = document.getElementById('yip-toast');
    if (!toast) return;
    if (_toastTimer) clearTimeout(_toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toast.style.display = 'block';
    _toastTimer = setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => { toast.style.display = 'none'; }, 300);
        _toastTimer = null;
    }, 3000);
}

function getColorForParam(param, value) {
    if (param === 'maxTemp' || param === 'minTemp' || param === 'apparentMax') {
        if (value < 0) return '#3b82f6';
        if (value < 10) return '#60a5fa';
        if (value < 15) return _yipTheme === 'light' ? '#60a5fa' : '#93c5fd';
        if (value < 20) return '#fde047';
        if (value < 25) return '#facc15';
        if (value < 30) return '#fb923c';
        if (value < 35) return '#ea580c';
        return '#dc2626';
    } else if (param === 'precip') {
        if (value === 0) return 'var(--grid-color)';
        if (value < 2) return _yipTheme === 'light' ? '#93c5fd' : '#bfdbfe';
        if (value < 5) return '#60a5fa';
        if (value < 15) return '#3b82f6';
        return '#1d4ed8';
    } else if (param === 'windMax' || param === 'gustMax') {
        if (value < 10) return _yipTheme === 'light' ? '#5eead4' : '#ccfbf1';
        if (value < 20) return _yipTheme === 'light' ? '#14b8a6' : '#5eead4';
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
        if (value === 1) return _yipTheme === 'light' ? '#65a30d' : '#a3e635';
        if (value === 2) return '#facc15';
        if (value === 3) return '#f97316';
        return '#dc2626';
    } else if (param === 'mood') {
        const moodDef = MOODS.find(m => m.id === value);
        if (moodDef) return moodDef.color;
        return 'var(--grid-color)';
    } else if (param === 'cold') {
        return value ? '#eab308' : 'var(--grid-color)';
    } else if (param === 'allergies') {
        return value ? '#22c55e' : 'var(--grid-color)';
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
    } else if (param === 'mood') {
        steps = MOODS.map(m => ({
            c: m.color,
            l: `${m.emoji} ${t(m.labelKey, m.id)}`
        }));
    } else if (param === 'cold') {
        steps = [
            { c: '#eab308', l: `🤧 ${t('config.yipCold', 'Cold')}` },
            { c: 'var(--grid-color)', l: t('config.yipNoDataMeteo', 'No') }
        ];
    } else if (param === 'allergies') {
        steps = [
            { c: '#22c55e', l: `🌿 ${t('config.yipAllergies', 'Allergies')}` },
            { c: 'var(--grid-color)', l: t('config.yipNoDataMeteo', 'No') }
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

function renderLegendTabs(param) {
    const content = document.getElementById('yip-legend-content');
    if (!content) return;

    content.innerHTML = '';

    if (_activeLegendTab === 'cell') {
        renderLegend(param, content);
    } else if (_activeLegendTab === 'state') {
        renderStateTabContent(content);
    }

    const dots = document.querySelectorAll('.yip-legend-dot');
    const labels = document.querySelectorAll('.yip-tab-label');
    dots.forEach((dot, i) => {
        const label = /** @type {HTMLElement} */ (labels[i]);
        if (label && label.dataset.tab === _activeLegendTab) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });

    if (!_legendTabListenersAttached) {
        _legendTabListenersAttached = true;
        const tabsContainer = document.querySelector('.yip-legend-tabs');
        if (!tabsContainer) return;

        tabsContainer.addEventListener('click', (e) => {
            const target = /** @type {HTMLElement} */ (e.target);
            let tab = null;

            if (target.classList.contains('yip-tab-label')) {
                tab = target.dataset.tab;
            } else if (target.classList.contains('yip-legend-dot')) {
                const allDots = tabsContainer.querySelectorAll('.yip-legend-dot');
                const allLabels = tabsContainer.querySelectorAll('.yip-tab-label');
                const idx = Array.from(allDots).indexOf(target);
                const matchedLabel = /** @type {HTMLElement} */ (allLabels[idx]);
                if (matchedLabel) {
                    tab = matchedLabel.dataset.tab;
                }
            }

            if (tab && tab !== _activeLegendTab) {
                _activeLegendTab = tab;
                renderLegendTabs(selectedParam);
            }
        });
    }
}

function renderStateTabContent(container) {
    const items = [
        { key: 'notes', label: t('config.legendNotes', 'Notes') },
        { key: 'mood', label: t('config.legendMood', 'Mood') },
        { key: 'cold', label: t('config.legendCold', 'Cold') },
        { key: 'allergies', label: t('config.legendAllergies', 'Allergies') }
    ];

    items.forEach(item => {
        const color = DOT_COLORS[item.key];
        container.insertAdjacentHTML('beforeend', `
            <div style="display:flex; align-items:center; gap:4px;">
                <span class="yip-state-dot" style="background:${color};"></span>
                <span>${item.label}</span>
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
    window.addEventListener('resize', updateYipScrollUI);

    const observer = new MutationObserver(() => {
        requestAnimationFrame(updateYipScrollUI);
    });
    observer.observe(container, { childList: true, subtree: true });
}

function updateYipScrollUI() {
    const container = document.getElementById('yip-location-chips');
    const dotsContainer = document.getElementById('yip-location-dots');
    if (!container || !dotsContainer) return;

    const chips = container.querySelectorAll('.yip-chip');
    if (chips.length === 0) {
        dotsContainer.innerHTML = '';
        return;
    }

    const hasOverflow = container.scrollWidth > container.clientWidth;
    if (!hasOverflow) {
        dotsContainer.innerHTML = '';
        return;
    }

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let bestIndex = 0;
    let bestRatio = 0;

    chips.forEach((chip, i) => {
        const chipRect = chip.getBoundingClientRect();
        const visibleLeft = Math.max(chipRect.left, containerRect.left);
        const visibleRight = Math.min(chipRect.right, containerRect.right);
        const visibleWidth = Math.max(0, visibleRight - visibleLeft);
        const visibleRatio = visibleWidth / chipRect.width;

        if (visibleRatio > bestRatio) {
            bestRatio = visibleRatio;
            bestIndex = i;
        } else if (visibleRatio === bestRatio && visibleRatio > 0) {
            const chipCenter = chipRect.left + chipRect.width / 2;
            const bestChip = chips[bestIndex];
            const bestRect = bestChip.getBoundingClientRect();
            const bestCenter = bestRect.left + bestRect.width / 2;
            if (Math.abs(chipCenter - containerCenter) < Math.abs(bestCenter - containerCenter)) {
                bestIndex = i;
            }
        }
    });

    let html = '';
    for (let i = 0; i < chips.length; i++) {
        html += `<span class="yip-dot${i === bestIndex ? ' active' : ''}"></span>`;
    }
    dotsContainer.innerHTML = html;
}

export { renderYIPGrid, saveDayNote, saveDayMoods, saveDayDetail, openYIPDetail, updateYipScrollUI, closeYipModal };



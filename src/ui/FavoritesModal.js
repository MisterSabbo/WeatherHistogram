import { favoritesService } from '../services/FavoritesService.js';
import { state } from '../store.js';
import { t } from '../utils/i18n.js';

export function initFavoritesModal(onSelect) {
    const modal = document.getElementById('favorites-modal');
    const closeBtn = document.getElementById('close-favorites-btn');
    const mapFavBtn = document.getElementById('map-favorites-btn');
    const listContainer = document.getElementById('favorites-list');
    let isEditMode = false;

    if (mapFavBtn) {
        mapFavBtn.addEventListener('click', async () => {
            isEditMode = false;
            await renderFavorites();
            ModalManager.openModal(modal, {
                show: (el) => el.style.display = 'flex',
                hide: (el) => el.style.display = 'none'
            });
        });
    }

    closeBtn.addEventListener('click', () => {
        ModalManager.closeModal(modal);
        isEditMode = false;
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            ModalManager.closeModal(modal);
            isEditMode = false;
        }
    });

    async function renderFavorites() {
        const favs = await favoritesService.load();
        listContainer.innerHTML = '';
        
        if (favs.length === 0) {
            listContainer.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px;">${t('map.noFavorites') || 'No hay ubicaciones favoritas.'}</div>`;
            return;
        }

        favs.forEach((fav, index) => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: var(--bg-color);
                border: 1px solid var(--grid-color);
                border-radius: 8px;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                ${!isEditMode ? 'cursor: pointer;' : ''}
            `;
            
            if (!isEditMode) {
                card.onclick = () => {
                    ModalManager.closeAll();
                    onSelect(fav.lat, fav.lon, fav.originName);
                };
            }

            // Top section: Name + Actions
            const topRow = document.createElement('div');
            topRow.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; width: 100%;';
            
            const nameDiv = document.createElement('div');
            nameDiv.style.flex = '1';
            nameDiv.style.minWidth = '0';
            
            const parts = fav.originName.split(',').map(s => s.trim());
            const city = parts[0] ? parts[0].trim() : 'Ubicación Desconocida';
            const rest = parts.slice(1).map(s => s.trim()).filter(s => s).join(', ');

            const aliasDisplay = document.createElement('div');
            // If alias matches originName (or if no alias), show city
            aliasDisplay.textContent = (fav.alias && fav.alias !== fav.originName) ? fav.alias : city;
            aliasDisplay.style.cssText = `
                width: 100%;
                color: var(--text-primary);
                font-size: 1.1rem;
                font-weight: bold;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            `;
            
            const subName = document.createElement('div');
            // If alias is set and differs from originName, show the full originName. Otherwise show 'rest'.
            subName.textContent = (fav.alias && fav.alias !== fav.originName) ? fav.originName : rest;
            subName.style.cssText = 'font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            
            nameDiv.appendChild(aliasDisplay);
            if (subName.textContent) nameDiv.appendChild(subName);

            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '8px';
            actionsDiv.style.alignItems = 'center';

            if (isEditMode) {
                const editNameBtn = document.createElement('button');
                editNameBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">edit</span>';
                editNameBtn.title = t('config.edit') || "Editar nombre";
                editNameBtn.style.cssText = 'background: transparent; color: var(--text-primary); border: 1px solid var(--grid-color); padding: 6px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;';
                editNameBtn.onclick = (e) => {
                    e.stopPropagation();
                    const promptModal = document.getElementById('prompt-modal');
                    const promptInput = document.getElementById('prompt-input');
                    const promptCancel = document.getElementById('prompt-cancel-btn');
                    const promptOk = document.getElementById('prompt-ok-btn');
                    const promptTitle = document.getElementById('prompt-title');
                    
                    if (!promptModal) {
                        console.error('Prompt modal not found');
                        return;
                    }
                    
                    promptTitle.textContent = t('config.edit') || "Editar nombre";
                    promptInput.value = (fav.alias && fav.alias !== fav.originName) ? fav.alias : city;
                    promptCancel.textContent = t('config.cancel') || 'Cancelar';
                    promptOk.textContent = t('config.accept') || 'Aceptar';
                    
                    ModalManager.openModal(promptModal, {
                        show: (el) => { el.style.display = 'flex'; promptInput.focus(); },
                        hide: (el) => el.style.display = 'none'
                    });
                    
                    // cleanup old listeners
                    const newOk = promptOk.cloneNode(true);
                    promptOk.parentNode.replaceChild(newOk, promptOk);
                    const newCancel = promptCancel.cloneNode(true);
                    promptCancel.parentNode.replaceChild(newCancel, promptCancel);
                    
                    newCancel.onclick = () => { ModalManager.closeModal(promptModal); };
                    newOk.onclick = () => {
                        const newAlias = promptInput.value;
                        if (newAlias !== null && newAlias.trim() !== '') {
                            favoritesService.updateAlias(index, newAlias.trim()).then(() => {
                                ModalManager.closeModal(promptModal);
                                renderFavorites().then(() => {
                                    // Make sure we keep the edit mode active
                                    if(!isEditMode) {
                                        isEditMode = true; 
                                        renderFavorites();
                                    }
                                });
                            });
                        } else {
                            ModalManager.closeModal(promptModal);
                        }
                    };
                };
            }

            topRow.appendChild(nameDiv);
            if (isEditMode) topRow.appendChild(actionsDiv);

            card.appendChild(topRow);
            listContainer.appendChild(card);
        });

        // Toggle edit mode button at bottom has been moved to HTML overlay
        const toggleEditBtn = document.getElementById('toggle-edit-favorites-btn');
        if (toggleEditBtn) {
            toggleEditBtn.innerHTML = isEditMode 
                ? '<span class="material-symbols-outlined" style="font-size: 18px;">check</span> <span data-i18n="config.done">Hecho</span>'
                : '<span class="material-symbols-outlined" style="font-size: 18px;">edit</span> <span data-i18n="config.edit">Editar</span>';
            
            toggleEditBtn.onclick = () => {
                isEditMode = !isEditMode;
                renderFavorites();
            };
            
            const spanText = toggleEditBtn.querySelector('span[data-i18n]');
            if (spanText) {
                spanText.textContent = isEditMode ? (t('config.done') || 'Hecho') : (t('config.edit') || 'Editar');
            }
        }
    }
}

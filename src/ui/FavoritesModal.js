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
            modal.style.display = 'flex';
        });
    }

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        isEditMode = false;
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
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
                    modal.style.display = 'none';
                    const mapModal = document.getElementById('map-location-modal');
                    if(mapModal) mapModal.style.display = 'none';
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
                    
                    promptModal.style.display = 'flex';
                    promptInput.focus();
                    
                    // cleanup old listeners
                    const newOk = promptOk.cloneNode(true);
                    promptOk.parentNode.replaceChild(newOk, promptOk);
                    const newCancel = promptCancel.cloneNode(true);
                    promptCancel.parentNode.replaceChild(newCancel, promptCancel);
                    
                    newCancel.onclick = () => { promptModal.style.display = 'none'; };
                    newOk.onclick = () => {
                        const newAlias = promptInput.value;
                        if (newAlias !== null && newAlias.trim() !== '') {
                            favoritesService.updateAlias(index, newAlias.trim()).then(() => {
                                promptModal.style.display = 'none';
                                renderFavorites().then(() => {
                                    // Make sure we keep the edit mode active
                                    if(!isEditMode) {
                                        isEditMode = true; 
                                        renderFavorites();
                                    }
                                });
                            });
                        } else {
                            promptModal.style.display = 'none';
                        }
                    };
                };

                const delBtn = document.createElement('button');
                delBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">delete</span>';
                delBtn.title = t('map.remove') || "Eliminar";
                delBtn.style.cssText = 'background: #ef4444; color: white; border: none; padding: 6px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;';
                delBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await favoritesService.remove(index);
                    renderFavorites();
                };

                // Reorder buttons
                const reorderDiv = document.createElement('div');
                reorderDiv.style.display = 'flex';
                reorderDiv.style.flexDirection = 'column';
                reorderDiv.style.gap = '2px';
                
                const upBtn = document.createElement('button');
                upBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">expand_less</span>';
                upBtn.style.cssText = 'background: transparent; color: var(--text-primary); border: 1px solid var(--grid-color); padding: 0px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;';
                upBtn.disabled = index === 0;
                if(index === 0) upBtn.style.opacity = '0.3';
                upBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await favoritesService.reorder(index, index - 1);
                    renderFavorites();
                };
                
                const downBtn = document.createElement('button');
                downBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">expand_more</span>';
                downBtn.style.cssText = 'background: transparent; color: var(--text-primary); border: 1px solid var(--grid-color); padding: 0px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;';
                downBtn.disabled = index === favs.length - 1;
                if(index === favs.length - 1) downBtn.style.opacity = '0.3';
                downBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await favoritesService.reorder(index, index + 1);
                    renderFavorites();
                };
                reorderDiv.appendChild(upBtn);
                reorderDiv.appendChild(downBtn);

                actionsDiv.appendChild(reorderDiv);
                actionsDiv.appendChild(editNameBtn);
                actionsDiv.appendChild(delBtn);
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

import { favoritesService } from '../services/FavoritesService.js';
import { state } from '../store.js';
import { t } from '../utils/i18n.js';

export function initFavoritesModal(onSelect) {
    const modal = document.getElementById('favorites-modal');
    const closeBtn = document.getElementById('close-favorites-btn');
    const mapFavBtn = document.getElementById('map-favorites-btn');
    const listContainer = document.getElementById('favorites-list');

    if (mapFavBtn) {
        mapFavBtn.addEventListener('click', async () => {
            await renderFavorites();
            modal.style.display = 'flex';
        });
    }

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
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
            `;

            // Top section: Name + Actions
            const topRow = document.createElement('div');
            topRow.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;';
            
            const nameDiv = document.createElement('div');
            nameDiv.style.flex = '1';
            
            const aliasInput = document.createElement('input');
            aliasInput.value = fav.alias || fav.originName;
            aliasInput.style.cssText = `
                width: 100%;
                background: transparent;
                border: none;
                border-bottom: 1px dashed var(--grid-color);
                color: var(--text-primary);
                font-size: 1.1rem;
                font-weight: bold;
                padding-bottom: 4px;
                outline: none;
            `;
            
            aliasInput.addEventListener('change', async (e) => {
                await favoritesService.updateAlias(index, e.target.value.trim() || fav.originName);
            });
            
            const subName = document.createElement('div');
            subName.textContent = fav.originName !== fav.alias ? fav.originName : `${fav.lat.toFixed(4)}, ${fav.lon.toFixed(4)}`;
            subName.style.cssText = 'font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;';
            
            nameDiv.appendChild(aliasInput);
            nameDiv.appendChild(subName);

            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '4px';

            const goBtn = document.createElement('button');
            goBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">arrow_forward</span>';
            goBtn.title = t('map.goToLocation') || "Ir a ubicación";
            goBtn.style.cssText = 'background: #3b82f6; color: white; border: none; padding: 6px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;';
            goBtn.onclick = () => {
                modal.style.display = 'none';
                const mapModal = document.getElementById('map-location-modal');
                if(mapModal) mapModal.style.display = 'none';
                onSelect(fav.lat, fav.lon, fav.originName);
            };

            const delBtn = document.createElement('button');
            delBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">delete</span>';
            delBtn.title = t('map.remove') || "Eliminar";
            delBtn.style.cssText = 'background: #ef4444; color: white; border: none; padding: 6px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;';
            delBtn.onclick = async () => {
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
            upBtn.onclick = async () => {
                await favoritesService.reorder(index, index - 1);
                renderFavorites();
            };
            
            const downBtn = document.createElement('button');
            downBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">expand_more</span>';
            downBtn.style.cssText = 'background: transparent; color: var(--text-primary); border: 1px solid var(--grid-color); padding: 0px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;';
            downBtn.disabled = index === favs.length - 1;
            if(index === favs.length - 1) downBtn.style.opacity = '0.3';
            downBtn.onclick = async () => {
                await favoritesService.reorder(index, index + 1);
                renderFavorites();
            };
            reorderDiv.appendChild(upBtn);
            reorderDiv.appendChild(downBtn);

            actionsDiv.appendChild(reorderDiv);
            actionsDiv.appendChild(delBtn);
            actionsDiv.appendChild(goBtn);
            
            topRow.appendChild(nameDiv);
            topRow.appendChild(actionsDiv);

            card.appendChild(topRow);
            listContainer.appendChild(card);
        });
    }
}

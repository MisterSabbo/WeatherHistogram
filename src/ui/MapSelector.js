import { state } from "../store.js";
import { geoService } from "../services/GeoService.js";
import { t } from "../utils/i18n.js";

let map = null;
let currentMarker = null;

export function initMapModal(onLocationSelected) {
  const modal = document.getElementById("map-location-modal");
  const openBtn = document.getElementById("open-location-modal-btn");
  const closeBtn = document.getElementById("close-map-modal-btn");
  const currentLocBtn = document.getElementById("map-current-location-btn");
  const searchToggleBtn = document.getElementById("map-toggle-search-btn");

  // Search elements inside modal
  const searchOverlay = document.getElementById("map-search-overlay");
  const searchInput = document.getElementById("map-search-input");
  const closeSearchBtn = document.getElementById("close-map-search-btn");
  const suggestionsBox = document.getElementById("map-search-suggestions");

  let searchTimeout = null;

  openBtn.addEventListener("click", async () => {
    modal.style.display = "flex";
    
    // Check if user has favorites, if so automatically open the favorites modal on top of map
    const { favoritesService } = await import('../services/FavoritesService.js');
    const favs = await favoritesService.load();
    if (favs && favs.length > 0) {
       const mapFavBtn = document.getElementById("map-favorites-btn");
       if (mapFavBtn) mapFavBtn.click();
    }

    // Initialize map if it doesn't exist yet
    if (!map) {
      // Leaflet requires container to be visible before initializing size properly
      setTimeout(() => {
        map = L.map("leaflet-map", {
          zoomControl: false
        }).setView(
          [state.lat || 40.4167, state.lon || -3.70325],
          state.lat ? 10 : 2,
        );
        L.control.zoom({ position: 'bottomleft' }).addTo(map);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);

        if (state.lat && state.lon) {
          placeMarker(state.lat, state.lon, state.locationName);
        }

        map.on("click", async (e) => {
          const lat = e.latlng.lat;
          const lon = e.latlng.lng;
          placeMarker(lat, lon, t("config.loading") || "Cargando...");
          await resolveLocationName(lat, lon);
        });
      }, 100);
    } else {
      // Refresh map size incase modal was closed and window resized
      setTimeout(() => map.invalidateSize(), 100);
      if (state.lat && state.lon) {
        map.setView([state.lat, state.lon], 10);
        placeMarker(state.lat, state.lon, state.locationName);
      }
    }
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    searchOverlay.style.display = "none";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      searchOverlay.style.display = "none";
    }
  });

  function placeMarker(lat, lon, nameLabel) {
    if (currentMarker) {
      map.removeLayer(currentMarker);
    }
    currentMarker = L.marker([lat, lon]).addTo(map);

    const isLoading = nameLabel === "Cargando..." || nameLabel === t("config.loading");

    const div = document.createElement("div");
    div.style.textAlign = "center";
    div.style.color = "#000";
    div.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;" class="popup-loc-name">${nameLabel}</div>
        <div style="font-size: 11px; margin-bottom: 8px; color: #666;">${lat.toFixed(4)}, ${lon.toFixed(4)}</div>
    `;
    
    // Contenedor para botones
    const btnContainer = document.createElement("div");
    btnContainer.style.display = "flex";
    btnContainer.style.gap = "8px";
    btnContainer.style.justifyContent = "center";
    btnContainer.style.marginTop = "4px";

    const goBtn = document.createElement("button");
    goBtn.className = "popup-go-btn";
    goBtn.textContent = "Ir";
    goBtn.style.cssText =
      "background: #3b82f6; color: white; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; display: flex; align-items: center;";
      
    if (isLoading) {
      goBtn.disabled = true;
      goBtn.style.opacity = "0.5";
      goBtn.style.cursor = "not-allowed";
    }

    goBtn.onclick = () => {
      const nameEl = div.querySelector(".popup-loc-name");
      const finalName = nameEl ? /** @type {HTMLElement} */ (nameEl).innerText : nameLabel;
      document.getElementById("map-location-modal").style.display = "none";
      document.getElementById("map-search-overlay").style.display = "none";
      onLocationSelected(lat, lon, finalName);
    };

    const favBtn = document.createElement("button");
    favBtn.className = "popup-fav-btn";
    favBtn.title = "Añadir a favoritas";
    favBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px; font-variation-settings: \'FILL\' 0;">bookmark</span>';
    favBtn.style.cssText =
      "background: transparent; color: #eab308; border: 1px solid #eab308; padding: 6px 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;";
    
    if (isLoading) {
      favBtn.disabled = true;
      favBtn.style.opacity = "0.5";
      favBtn.style.cursor = "not-allowed";
    }

    favBtn.onclick = async () => {
      const nameEl = div.querySelector(".popup-loc-name");
      const finalName = nameEl ? /** @type {HTMLElement} */ (nameEl).innerText : nameLabel;
      const { favoritesService } = await import('../services/FavoritesService.js');
      await favoritesService.add(lat, lon, finalName);
      
      // Feedback visual
      favBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px; color: #22c55e;">check_circle</span>';
      favBtn.disabled = true;
      favBtn.style.cursor = "default";
      favBtn.style.border = "1px solid #22c55e";
    };

    btnContainer.appendChild(goBtn);
    btnContainer.appendChild(favBtn);
    div.appendChild(btnContainer);

    currentMarker.bindPopup(div).openPopup();
  }

  async function resolveLocationName(lat, lon) {
    try {
      const name = await geoService.reverseGeocode(lat, lon);

      // Check if the marker the user clicked is still the one on these coordinates
      const isCurrent = currentMarker && 
                        Math.abs(currentMarker.getLatLng().lat - lat) < 0.0001 && 
                        Math.abs(currentMarker.getLatLng().lng - lon) < 0.0001;
      
      if (!isCurrent) return;

      // Update popup if still open
      const nameEls = document.querySelectorAll(".popup-loc-name");
      if (nameEls.length > 0) {
        nameEls.forEach(el => /** @type {HTMLElement} */ (el).innerText = name);
        
        document.querySelectorAll(".popup-go-btn").forEach(goBtn => {
          const btn = /** @type {HTMLButtonElement} */ (goBtn);
          btn.disabled = false;
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
        });
        
        document.querySelectorAll(".popup-fav-btn").forEach(favBtn => {
          const btn = /** @type {HTMLButtonElement} */ (favBtn);
          btn.disabled = false;
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
        });
      } else {
        // If popup was closed but we wanted to update the marker's bind
        placeMarker(lat, lon, name);
      }
    } catch (e) {
      console.warn("Reverse geocode error:", e);
      const isCurrent = currentMarker && 
                        Math.abs(currentMarker.getLatLng().lat - lat) < 0.0001 && 
                        Math.abs(currentMarker.getLatLng().lng - lon) < 0.0001;
      if (!isCurrent) return;

      const nameEls = document.querySelectorAll(".popup-loc-name");
      if (nameEls.length > 0 && e.message !== "Cancelled") {
        nameEls.forEach(el => /** @type {HTMLElement} */ (el).innerText = "Ubicación Seleccionada");
        document.querySelectorAll(".popup-go-btn").forEach(goBtn => {
          const btn = /** @type {HTMLButtonElement} */ (goBtn);
          btn.disabled = false;
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
        });
        document.querySelectorAll(".popup-fav-btn").forEach(favBtn => {
          const btn = /** @type {HTMLButtonElement} */ (favBtn);
          btn.disabled = false;
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
        });
      }
    }
  }

  // Current location button
  currentLocBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert(
        t("map.geoNotSupported") ||
          "Geolocalización no soportada en este navegador.",
      );
      return;
    }

    // Visual feedback
    const originalContent = currentLocBtn.innerHTML;
    currentLocBtn.innerHTML =
      '<span class="loader" style="width:16px;height:16px;border-width:2px;display:block;"></span>';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        currentLocBtn.innerHTML = originalContent;

        map.setView([lat, lon], 10);
        placeMarker(lat, lon, t("config.loading") || "Cargando...");
        resolveLocationName(lat, lon);
      },
      (err) => {
        currentLocBtn.innerHTML = originalContent;
        console.warn(err);
        alert(
          t("map.geoFailed") ||
            "No se pudo obtener la ubicación. Verifica los permisos de tu navegador o dispositivo.",
        );
      },
      { timeout: 30000, enableHighAccuracy: false, maximumAge: 60000 },
    );
  });

  // Search Toggle
  searchToggleBtn.addEventListener("click", () => {
    searchOverlay.style.display =
      searchOverlay.style.display === "none" ? "block" : "none";
    if (searchOverlay.style.display === "block") {
      searchInput.focus();
    }
  });

  closeSearchBtn.addEventListener("click", () => {
    searchOverlay.style.display = "none";
    /** @type {HTMLInputElement} */ (searchInput).value = "";
    suggestionsBox.style.display = "none";
  });

  // Search input
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    const query = /** @type {HTMLInputElement} */ (e.target).value.trim();
    if (query.length < 2) {
      suggestionsBox.style.display = "none";
      return;
    }
    searchTimeout = setTimeout(() => fetchMapSuggestions(query), 500);
  });

  async function fetchMapSuggestions(query) {
    try {
      const results = await geoService.searchLocation(query, 5);
      suggestionsBox.innerHTML = "";
      if (results.length > 0) {
        results.forEach((loc) => {
          const div = document.createElement("div");
          div.style.padding = "12px";
          div.style.cursor = "pointer";
          div.style.borderBottom = "1px solid var(--grid-color)";
          div.style.display = "flex";
          div.style.alignItems = "center";
          div.style.gap = "8px";

          const favBtn = document.createElement("button");
          favBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px; font-variation-settings: \'FILL\' 0;">bookmark</span>';
          favBtn.style.cssText = "background: transparent; color: #eab308; border: none; padding: 4px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;";
          
          const admin1Str = loc.admin1 || "";
          const countryStr = loc.country || "";
          const nameParts = [loc.name];
          if (admin1Str) nameParts.push(admin1Str);
          if (countryStr) nameParts.push(countryStr);
          const fullName = nameParts.join(", ");

          favBtn.onclick = async (e) => {
             e.stopPropagation();
             const { favoritesService } = await import('../services/FavoritesService.js');
             await favoritesService.add(loc.latitude, loc.longitude, fullName);
             favBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px; color: #22c55e;">check_circle</span>';
             favBtn.disabled = true;
             favBtn.style.cursor = "default";
          };

          const textWrapper = document.createElement("div");
          textWrapper.style.flex = "1";
          
          let flagEmoji = "";
          if (loc.country_code) {
             const code = loc.country_code.toUpperCase();
             flagEmoji = code.replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397)) + " ";
          }

          const adminParts = [];
          if (admin1Str) adminParts.push(admin1Str);
          if (countryStr) adminParts.push(countryStr);

          const admin =
            adminParts.length > 0
              ? `<span style="font-size:12px; color:var(--text-secondary);">(${adminParts.join(", ")})</span>`
              : "";
          textWrapper.innerHTML = `<div><strong style="color:var(--text-primary); font-size:1.1em;">${flagEmoji}${loc.name}</strong></div><div style="margin-top:2px;">${admin}</div>`;

          div.appendChild(textWrapper);
          div.appendChild(favBtn);
          
          // Tactile feedback
          div.addEventListener('touchstart', () => { div.style.backgroundColor = 'var(--grid-color)'; }, {passive: true});
          div.addEventListener('touchend', () => { div.style.backgroundColor = 'transparent'; });
          div.addEventListener('touchcancel', () => { div.style.backgroundColor = 'transparent'; });

          div.onclick = () => {
            map.setView([loc.latitude, loc.longitude], 10);
            placeMarker(loc.latitude, loc.longitude, fullName);

            searchOverlay.style.display = "none";
            /** @type {HTMLInputElement} */ (searchInput).value = "";
            suggestionsBox.style.display = "none";
          };
          suggestionsBox.appendChild(div);
        });
        suggestionsBox.style.display = "block";
      } else {
        suggestionsBox.style.display = "none";
      }
    } catch (err) {
      console.error(err);
      suggestionsBox.style.display = "none";
    }
  }
}

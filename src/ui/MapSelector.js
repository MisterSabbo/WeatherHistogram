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

  openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
    // Initialize map if it doesn't exist yet
    if (!map) {
      // Leaflet requires container to be visible before initializing size properly
      setTimeout(() => {
        map = L.map("leaflet-map").setView(
          [state.lat || 40.4167, state.lon || -3.70325],
          state.lat ? 10 : 2,
        );
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

  function placeMarker(lat, lon, nameLabel) {
    if (currentMarker) {
      map.removeLayer(currentMarker);
    }
    currentMarker = L.marker([lat, lon]).addTo(map);

    const popupContent = `
            <div style="text-align: center; color: #000;">
                <div style="font-weight: 600; margin-bottom: 4px;" id="popup-loc-name">${nameLabel}</div>
                <div style="font-size: 11px; margin-bottom: 8px; color: #666;">${lat.toFixed(4)}, ${lon.toFixed(4)}</div>
                <button id="popup-go-btn" style="background: #3b82f6; color: white; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-weight: 600;">Ir</button>
            </div>
        `;

    const attachGoBtnListener = () => {
      const goBtn = document.getElementById("popup-go-btn");
      if (goBtn) {
        goBtn.onclick = () => {
          const finalName = document.getElementById("popup-loc-name").innerText;
          document.getElementById("map-location-modal").style.display = "none";
          document.getElementById("map-search-overlay").style.display = "none";
          onLocationSelected(lat, lon, finalName);
        };
      }
    };

    currentMarker.on("popupopen", attachGoBtnListener);
    currentMarker.bindPopup(popupContent).openPopup();
    setTimeout(attachGoBtnListener, 50);
  }

  async function resolveLocationName(lat, lon) {
    try {
      // Reverse geocoding can be done with nominatim or open-meteo if they have it
      // GeoService doesn't have reverse geocoding right now, let's use nominatim directly
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
      );
      if (!response.ok) throw new Error("Reverse geocoding failed");
      const data = await response.json();
      const name =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.county ||
        data.address.state ||
        "Ubicación Desconocida";

      // Update popup if still open
      const nameEl = document.getElementById("popup-loc-name");
      if (nameEl) {
        nameEl.innerText = name;
      } else {
        // If popup was closed but we wanted to update the marker's bind
        placeMarker(lat, lon, name);
      }
    } catch (e) {
      console.warn("Reverse geocode error:", e);
      const nameEl = document.getElementById("popup-loc-name");
      if (nameEl) nameEl.innerText = "Ubicación Seleccionada";
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
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        let finalName = t("map.currentLocation") || "Ubicación actual";
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
          );
          if (response.ok) {
            const data = await response.json();
            finalName =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.county ||
              data.address.state ||
              finalName;
          }
        } catch (e) {
          console.warn("Reverse geocode failed", e);
        }

        currentLocBtn.innerHTML = originalContent;
        document.getElementById("map-location-modal").style.display = "none";
        document.getElementById("map-search-overlay").style.display = "none";
        onLocationSelected(lat, lon, finalName);
      },
      (err) => {
        currentLocBtn.innerHTML = originalContent;
        console.warn(err);
        alert(
          t("map.geoFailed") ||
            "No se pudo obtener la ubicación. Verifica los permisos de tu navegador o dispositivo.",
        );
      },
      { timeout: 10000, enableHighAccuracy: false },
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
    searchInput.value = "";
    suggestionsBox.style.display = "none";
  });

  // Search input
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    if (query.length < 2) {
      suggestionsBox.style.display = "none";
      return;
    }
    searchTimeout = setTimeout(() => fetchMapSuggestions(query), 500);
  });

  async function fetchMapSuggestions(query) {
    try {
      const results = await geoService.searchLocation(query);
      suggestionsBox.innerHTML = "";
      if (results.length > 0) {
        results.forEach((loc) => {
          const div = document.createElement("div");
          div.style.padding = "12px";
          div.style.cursor = "pointer";
          div.style.borderBottom = "1px solid var(--grid-color)";

          const admin1Str = loc.admin1 || "";
          const countryStr = loc.country || "";
          const adminParts = [];
          if (admin1Str) adminParts.push(admin1Str);
          if (countryStr) adminParts.push(countryStr);

          const admin =
            adminParts.length > 0
              ? `<span style="font-size:12px; color:var(--text-secondary);">(${adminParts.join(", ")})</span>`
              : "";
          div.innerHTML = `<strong style="color:var(--text-primary);">${loc.name}</strong> ${admin}`;

          div.onclick = () => {
            const nameParts = [loc.name];
            if (admin1Str) nameParts.push(admin1Str);
            if (countryStr) nameParts.push(countryStr);
            const fullName = nameParts.join(", ");

            map.setView([loc.latitude, loc.longitude], 10);
            placeMarker(loc.latitude, loc.longitude, fullName);

            searchOverlay.style.display = "none";
            searchInput.value = "";
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

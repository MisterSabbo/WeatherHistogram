import { state, updateState, on } from '../core/Store.js';
import { fetchSuggestions, useMyLocation } from '../services/LocationAPI.js';

export class SearchBar {
    constructor() {
        this.input = document.getElementById('location-input');
        this.suggestionsBox = document.getElementById('suggestions');
        this.searchBtn = document.getElementById('search-btn');
        this.geoBtn = document.getElementById('geo-btn');
        this.toggleBtn = document.getElementById('toggle-search-btn');
        this.searchBox = document.getElementById('search-box');
        this.controlsLeft = document.querySelector('.controls-left');
        
        this.searchTimeout = null;
    }

    init(onSearchCallback) {
        this.onSearch = onSearchCallback;

        this.toggleBtn?.addEventListener('click', () => {
            const isActive = this.searchBox.classList.toggle('active');
            this.toggleBtn.classList.toggle('active', isActive);
            this.controlsLeft.classList.toggle('has-active', isActive);
        });

        this.input.addEventListener('input', () => {
            clearTimeout(this.searchTimeout);
            const query = this.input.value.trim();
            if (query.length < 2) {
                this.suggestionsBox.style.display = 'none';
                return;
            }
            this.searchTimeout = setTimeout(async () => {
                const results = await fetchSuggestions(query);
                this.showSuggestions(results);
            }, 300);
        });

        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        this.geoBtn.addEventListener('click', () => useMyLocation(true));

        on('stateChange', () => {
            this.updateLocationUI();
        });
    }

    showSuggestions(results) {
        this.suggestionsBox.innerHTML = '';
        if (results.length === 0) {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.style.cursor = 'default';
            div.innerText = 'No se encontraron resultados';
            this.suggestionsBox.appendChild(div);
        } else {
            results.forEach(loc => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                const admin = loc.admin1 ? `<span class="admin">(${loc.admin1}, ${loc.country})</span>` : `<span class="admin">(${loc.country})</span>`;
                div.innerHTML = `<strong>${loc.name}</strong> ${admin}`;
                div.onclick = () => {
                    updateState({
                        lat: loc.latitude,
                        lon: loc.longitude,
                        locationName: loc.name + (loc.admin1 ? `, ${loc.admin1}` : "")
                    });
                    this.input.value = loc.name;
                    this.suggestionsBox.style.display = 'none';
                    if (this.onSearch) this.onSearch();
                };
                this.suggestionsBox.appendChild(div);
            });
        }
        this.suggestionsBox.style.display = 'block';
    }

    async handleSearch() {
        const query = this.input.value.trim();
        if (!query) return;

        const results = await fetchSuggestions(query);
        if (results.length > 0) {
            const loc = results[0];
            updateState({
                lat: loc.latitude,
                lon: loc.longitude,
                locationName: loc.name + (loc.admin1 ? `, ${loc.admin1}` : "")
            });
            if (this.onSearch) this.onSearch();
        }
    }

    updateLocationUI() {
        const el = document.getElementById('location-name');
        if (el) el.innerText = state.locationName;
        localStorage.setItem('last_weather_location', JSON.stringify({
            lat: state.lat,
            lon: state.lon,
            name: state.locationName
        }));
    }
}

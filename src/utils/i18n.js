export const translations = {
    es: {
        config: {
            language: "Idioma / Language:",
            chartTheme: "Tema de Gráficas:",
            clearCache: "Limpiar Caché y Recargar",
            loading: "Cargando...",
            version: "Versión:",
            edit: "Editar",
            done: "Hecho",
            repository: "Código fuente:",
            stickmanConfig: "Ajustar umbrales:",
            skinTypeConfig: "Ajustar fototipo:",
            skinTypeProfile: "Tu Fototipo de Piel (Fitzpatrick):",
            skinType1: "I - Piel muy clara, pecas, pelo rubio/pelirrojo. Se quema siempre, nunca se broncea.",
            skinType2: "II - Piel clara, pelo rubio/castaño claro. Se quema fácilmente, se broncea poco.",
            skinType3: "III - Piel intermedia, pelo castaño. Se quema moderadamente, se broncea gradualmente.",
            skinType4: "IV - Piel morena, pelo oscuro. Se quema poco, se broncea con facilidad.",
            skinType5: "V - Piel oscura. Raramente se quema, se broncea mucho.",
            skinType6: "VI - Piel oscura. Raramente se quema, se broncea mucho.",
            moreThan2h: "> 2h",
            spfModalTitleUVI: "Índice UV",
            spfModalRiskLow: "Riesgo bajo de daño por exposición solar.",
            spfModalRiskMod: "Riesgo moderado de daño por exposición solar.",
            spfModalRiskHigh: "Riesgo alto de daño por exposición solar.",
            spfModalRiskVHigh: "Riesgo muy alto de daño por exposición solar.",
            spfModalRiskExt: "Riesgo extremo de daño solar. Obligatorio protegerse.",
            spfModalTimeNone: "Sin protección solar, para Fototipo",
            spfModalReapply: "Protección media. Reaplica cada 2 horas y después de sudar o bañarte.",
            coldThreshold: "Umbral de Frío (°C):",
            hotThreshold: "Umbral de Calor (°C):",
            windThreshold: "Umbral de Viento (km/h):",
            cloudsThreshold: "Umbral de Nubes para Gafas (%):"
        },
        theme: {
        },
        overlay: {
            fetchingLocation: "Obteniendo ubicación...",
            loadingData: "Cargando datos...",
            skipWait: "Saltar espera"
        },
        search: {
            placeholder: "Buscar ciudad (ej: Madrid, Tokyo)...",
            changeLocation: "Cambiar ubicación"
        },
        map: {
            searchPlaceholder: "Buscar ubicación...",
            searchBtn: "Buscar Ubicación",
            myLocationBtn: "Mi Ubicación",
            currentLocation: "Ubicación actual",
            closeBtn: "Cerrar",
            nowBtn: "Ir al momento actual",
            geoNotSupported: "Geolocalización no soportada en este navegador.",
            geoFailed: "No se pudo obtener la ubicación. Verifica los permisos de tu navegador o dispositivo.",
            favorites: "Favoritos",
            addFavorite: "Añadir a favoritas",
            noFavorites: "No hay ubicaciones favoritas.",
            goToLocation: "Ir a ubicación",
            remove: "Eliminar"
        },
        nav: {
            infoBtn: "Información y Ajustes",
            changeViewBtn: "Cambiar vista"
        },
        topPanel: {
            loading: "Cargando...",
            ttLocation: "Ubicación",
            ttSummary: "Resumen del tiempo",
            windN: "N",
            today: "HOY",
            activeAlerts: "Alertas Activas (próx 12h)"
        },
        pollen: {
            riskTitle: "Riesgo por Planta",
            alder: "Aliso",
            birch: "Abedul",
            grass: "Gramíneas",
            mugwort: "Artemisa",
            olive: "Olivo",
            ragweed: "Ambrosía",
            noData: "S/D"
        },
        minimap: {
            past: "Pasado",
            future: "Previsión"
        },
        weatherCodes: {
            0: "Despejado",
            1: "Principalmente despejado",
            2: "Parcialmente nublado",
            3: "Cubierto",
            45: "Niebla",
            48: "Niebla con escarcha",
            51: "Llovizna ligera",
            53: "Llovizna moderada",
            55: "Llovizna densa",
            56: "Llovizna helada ligera",
            57: "Llovizna helada densa",
            61: "Lluvia débil",
            63: "Lluvia moderada",
            65: "Lluvia fuerte",
            66: "Lluvia helada ligera",
            67: "Lluvia helada fuerte",
            71: "Nieve débil",
            73: "Nieve moderada",
            75: "Nieve fuerte",
            77: "Granizo",
            80: "Chubascos de lluvia débiles",
            81: "Chubascos de lluvia moderados",
            82: "Chubascos de lluvia violentos",
            85: "Chubascos de nieve débiles",
            86: "Chubascos de nieve fuertes",
            95: "Tormenta",
            96: "Tormenta con granizo débil",
            99: "Tormenta con granizo fuerte",
            unknown: "Desconocido"
        },
        weather: {
            clear: "Despejado",
            partlyCloudy: "Parcialmente nublado",
            cloudy: "Nublado",
            overcast: "Cubierto",
            fog: "Niebla",
            drizzle: "Llovizna",
            rain: "Lluvia",
            heavyRain: "Lluvia fuerte",
            snow: "Nieve",
            heavySnow: "Nieve fuerte",
            thunderstorm: "Tormenta",
            unknown: "Desconocido"
        },
        aqiLevel: {
            1: { t: 'Buena', r: 'Calidad del aire satisfactoria, sin riesgo para la salud.' },
            2: { t: 'Moderada', r: 'Aceptable para la mayoría, algunas personas sensibles pueden experimentar molestias.' },
            3: { t: 'Dañina para sensibles', r: 'Grupos sensibles pueden experimentar efectos en la salud.' },
            4: { t: 'Dañina', r: 'Todos pueden comenzar a experimentar efectos en la salud.' },
            5: { t: 'Muy dañina', r: 'Alerta de salud: todos pueden experimentar efectos más graves.' },
            6: { t: 'Peligrosa', r: 'Emergencia sanitaria. Toda la población en riesgo.' }
        },
        aqi: {
            title: "Calidad del Aire",
            good: "Bueno",
            fair: "Moderado",
            moderate: "Perjudicial (Sensibles)",
            poor: "Perjudicial",
            veryPoor: "Muy Perjudicial",
            extreme: "Peligroso"
        },
        pollenLevels: {
            none: "Nulo",
            low: "Bajo",
            moderate: "Moderado",
            high: "Alto",
            veryHigh: "Muy Alto"
        },
        days: {
            short: ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"],
            long: ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"]
        },
        months: {
            short: ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
        }
    },
    en: {
        config: {
            language: "Language / Idioma:",
            chartTheme: "Chart Theme:",
            clearCache: "Clear Cache & Reload",
            loading: "Loading...",
            version: "Version:",
            edit: "Edit",
            done: "Done",
            repository: "Source Code:",
            stickmanConfig: "Adjust thresholds:",
            skinTypeConfig: "Adjust phototype:",
            skinTypeProfile: "Your Skin Type (Fitzpatrick):",
            skinType1: "I - Very fair skin, freckles, blonde/red hair. Always burns, never tans.",
            skinType2: "II - Fair skin, blonde/light brown hair. Burns easily, tans poorly.",
            skinType3: "III - Intermediate skin, brown hair. Burns moderately, tans gradually.",
            skinType4: "IV - Brown skin, dark hair. Burns minimally, tans easily.",
            skinType5: "V - Dark skin. Rarely burns, tans profusely.",
            skinType6: "VI - Dark skin. Rarely burns, tans profusely.",
            moreThan2h: "> 2h",
            spfModalTitleUVI: "UV Index",
            spfModalRiskLow: "Low risk of harm from unprotected sun exposure.",
            spfModalRiskMod: "Moderate risk of harm from unprotected sun exposure.",
            spfModalRiskHigh: "High risk of harm from unprotected sun exposure.",
            spfModalRiskVHigh: "Very high risk of harm from unprotected sun exposure.",
            spfModalRiskExt: "Extreme risk of harm from unprotected sun exposure. Protection mandatory.",
            spfModalTimeNone: "Without sun protection, for Skin Type",
            spfModalReapply: "Medium protection. Reapply every 2 hours and after sweating or swimming.",
            coldThreshold: "Cold Threshold (°C):",
            hotThreshold: "Hot Threshold (°C):",
            windThreshold: "Wind Threshold (km/h):",
            cloudsThreshold: "Cloudiness threshold for sunglasses (%):"
        },
        theme: {
        },
        overlay: {
            fetchingLocation: "Fetching location...",
            loadingData: "Loading data...",
            skipWait: "Skip wait"
        },
        search: {
            placeholder: "Search city (e.g. London, Tokyo)...",
            changeLocation: "Change location"
        },
        map: {
            searchPlaceholder: "Search location...",
            searchBtn: "Search Location",
            myLocationBtn: "My Location",
            currentLocation: "Current Location",
            closeBtn: "Close",
            nowBtn: "Go to current time",
            geoNotSupported: "Geolocation is not supported by this browser.",
            geoFailed: "Failed to get location. Please check your browser or device permissions.",
            favorites: "Favorites",
            addFavorite: "Add to favorites",
            noFavorites: "No favorite locations yet.",
            goToLocation: "Go to location",
            remove: "Remove"
        },
        nav: {
            infoBtn: "Info & Settings",
            changeViewBtn: "Toggle view"
        },
        topPanel: {
            loading: "Loading...",
            ttLocation: "Location",
            ttSummary: "Weather Summary",
            windN: "N",
            today: "TODAY",
            activeAlerts: "Active Alerts (next 12h)"
        },
        pollen: {
            riskTitle: "Risk by Plant",
            alder: "Alder",
            birch: "Birch",
            grass: "Grass",
            mugwort: "Mugwort",
            olive: "Olive",
            ragweed: "Ragweed",
            noData: "N/A"
        },
        minimap: {
            past: "Past",
            future: "Forecast"
        },
        weatherCodes: {
            0: "Clear",
            1: "Mostly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Depositing rime fog",
            51: "Light drizzle",
            53: "Moderate drizzle",
            55: "Dense drizzle",
            56: "Light freezing drizzle",
            57: "Dense freezing drizzle",
            61: "Slight rain",
            63: "Moderate rain",
            65: "Heavy rain",
            66: "Light freezing rain",
            67: "Heavy freezing rain",
            71: "Slight snow fall",
            73: "Moderate snow fall",
            75: "Heavy snow fall",
            77: "Snow grains",
            80: "Slight rain showers",
            81: "Moderate rain showers",
            82: "Violent rain showers",
            85: "Slight snow showers",
            86: "Heavy snow showers",
            95: "Thunderstorm",
            96: "Thunderstorm with slight hail",
            99: "Thunderstorm with heavy hail",
            unknown: "Unknown"
        },
        weather: {
            clear: "Clear",
            partlyCloudy: "Partly cloudy",
            cloudy: "Cloudy",
            overcast: "Overcast",
            fog: "Fog",
            drizzle: "Drizzle",
            rain: "Rain",
            heavyRain: "Heavy rain",
            snow: "Snow",
            heavySnow: "Heavy snow",
            thunderstorm: "Thunderstorm",
            unknown: "Unknown"
        },
        aqiLevel: {
            1: { t: 'Good', r: 'Air quality is satisfactory, and air pollution poses little or no risk.' },
            2: { t: 'Moderate', r: 'Acceptable; however, there may be a risk for some sensitive people.' },
            3: { t: 'Unhealthy for Sensitive', r: 'Members of sensitive groups may experience health effects.' },
            4: { t: 'Unhealthy', r: 'Everyone may begin to experience health effects.' },
            5: { t: 'Very Unhealthy', r: 'Health alert: everyone may experience more serious health effects.' },
            6: { t: 'Hazardous', r: 'Health warnings of emergency conditions. The entire population is more likely to be affected.' }
        },
        aqi: {
            title: "Air Quality",
            good: "Good",
            fair: "Fair",
            moderate: "Moderate",
            poor: "Poor",
            veryPoor: "Very Poor",
            extreme: "Extreme"
        },
        pollenLevels: {
            none: "None",
            low: "Low",
            moderate: "Moderate",
            high: "High",
            veryHigh: "Very High"
        },
        days: {
            short: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
            long: ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
        },
        months: {
            short: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
        }
    }
};

let currentLanguage = localStorage.getItem('weatherhist_language') || 'es';

export function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        localStorage.setItem('weatherhist_language', lang);
        applyTranslations();
    }
}

export function getLanguage() {
    return currentLanguage;
}

export function t(key) {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    for (const k of keys) {
        if (value && value[k] !== undefined) {
            value = value[k];
        } else {
            return key; // Fallback to key if not found
        }
    }
    return value;
}

export function getLocale() {
    return currentLanguage === 'es' ? 'es-ES' : 'en-US';
}

export function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.setAttribute('placeholder', t(key));
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.setAttribute('title', t(key));
    });
}

# WeatherHist

WeatherHist is a high-performance, mobile-first weather application that visualizes meteorological data through interactive histograms and daily summaries. It leverages the Canvas API for smooth, zero-lag rendering of complex weather patterns and integrates seamlessly with the Open-Meteo API.

## Badges

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![Open-Meteo API](https://img.shields.io/badge/API-Open--Meteo-brightgreen)
![PWA Ready](https://img.shields.io/badge/Status-PWA%20Ready-success)

## Key Features

*   **Efficient Canvas Rendering:** Utilizes the HTML5 Canvas API to draw complex weather histograms, ensuring 60fps performance without stuttering even on iOS/mobile devices.
*   **Dual View Navigation:** Seamlessly switch between a detailed daily cards view and a continuous interactive minimap. State is persisted via `localStorage`.
*   **Internationalization (i18n):** Features bilingual support out of the box (English and Spanish) via a lightweight, scalable custom module that handles translation files, UI texts, dates, weather phenomena, and AQI statuses dynamically.
*   **Zero-Lag Time Scrubber:** Features a smoothly animated present-time pulsing indicator (Now playhead) with dynamic historical shading for past weather, rendered instantly via native CSS hardware acceleration.
*   **Intelligent Interactive Graphing:** 
    *   **Advanced Atmospheric Rendering:** Features a dynamic, multi-layered volumetric neon glow for temperature lines that accurately calculates visual collisions with clouds and precipitation using native Gaussian blurs for zero-banding smooth falloffs.
    *   **Dynamic Puddles:** A continuous, fluid puddle effect that organically outlines the temperature line during rain probabilities.
    *   **Apparent Temperature vs Real:** Fill areas highlight cold/heat stress periods in intuitive icy/warm hues when the "feels-like" temperature splits from the ambient one.
    *   **Dynamic Precipitation:** Advanced visual bars to mark thunderstorms (blue/purple) and snowfall (pale frost), intelligently adapting to dark/light modes.
    *   **UV Index & Environmental Risk:** Smart UI collision detection to stack and cleanly present UV Index and Precipitation probabilities at the scrubber point cleanly without overlapping.
    *   **0°C Visual Marker:** Contextual 0-degree horizon line overlay to easily spot sub-zero plunging.
*   **Floating Present-Time Centering:** The "Now" re-centering button floats dynamically depending on which way the horizon scroll is lost.
*   **Offline First & Network Strategy:** Service Worker-enabled caching system that prioritizes network fetches during active connections while making static payload accessible offline.
*   **Dynamic Theming:** Supports both light and dark modes with seamless transitions, deep contrast shadows, and refined visual weighting.

## Tech Stack

*   **Core:** Vanilla JavaScript (ES6+), HTML5, CSS3
*   **Rendering:** HTML5 Canvas API (for histograms, precipitation effects, and pollen radar) combined with standard DOM layering for playheads and real-time pointers.
*   **Styling:** Native CSS Variables (`var(--color)`) for dynamic theming and responsive design
*   **Offline Capabilities:** Service Workers (`sw.js`) and Web App Manifest (`manifest.json`) for PWA support
*   **Build Tool:** Vite (for fast development server and optimized production builds)

## Changelog & Versions
You can consult the complete and detailed evolution of the latest features in our [CHANGELOG.md](CHANGELOG.md) file.

## Project Structure

The project directory follows a standard structure splitting logic, static views, and assets cleanly:
*   `./index.html` — The core layout and app shell.
*   `./src/` — Contains application source logic (`app.js`) and core styling (`style.css`).
*   `./assets/images/` — Contains standard image and icon assets across the application.
*   `./manifest.json` \& `./sw.js` — Core PWA and Service layout.

## Installation and Usage

To run this project locally, ensure you have Node.js installed, then execute the following commands:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

## Technical Architecture

The application follows a centralized state management pattern using a single global `state` object. This object holds all critical application data, including coordinates, raw forecast data, parsed hourly/daily data, UI state (like the current hover position), and theme preferences. 

DOM updates are driven by this state. When the state changes (e.g., after fetching new weather data or scrubbing the timeline), a centralized `render()` function is called. This function clears the canvas, recalculates dimensions based on the current device pixel ratio (DPR) and window size, and redraws all visual elements (temperature curves, precipitation bars, sun/moon indicators) to reflect the updated state. Layering and hardware-accelerated transforms are strategically mapped to keep interactions fluid.

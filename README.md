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

*   **No backend needed**
*   **Efficient Canvas Rendering:** Utilizes the HTML5 Canvas API to draw complex weather histograms, ensuring 60fps performance even on mobile devices.
*   **Network-First API Strategy:** Implements a robust caching mechanism for weather data, prioritizing fresh data from the network while falling back to cached data when offline.
*   **Cache-First Asset Strategy:** Employs a Service Worker to cache static assets (HTML, CSS, JS, icons) for immediate loading and offline availability.
*   **Interactive Minimap & Scrubbing:** Features a responsive minimap and vertical scrubber for precise temporal navigation through the forecast data.
*   **Dynamic Theming:** Supports both light and dark modes with seamless transitions and high-contrast UI elements.

## Tech Stack

*   **Core:** Vanilla JavaScript (ES6+), HTML5, CSS3
*   **Rendering:** HTML5 Canvas API (for histograms, precipitation effects, and pollen radar)
*   **Styling:** Native CSS Variables (`var(--color)`) for dynamic theming and responsive design
*   **Offline Capabilities:** Service Workers (`sw.js`) and Web App Manifest (`manifest.json`) for PWA support
*   **Build Tool:** Vite (for fast development server and optimized production builds)

## Installation and Usage

This project can run directly hosted on any repo (published on github pages).

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

DOM updates are driven by this state. When the state changes (e.g., after fetching new weather data or scrubbing the timeline), a centralized `render()` function is called. This function clears the canvas, recalculates dimensions based on the current device pixel ratio (DPR) and window size, and redraws all visual elements (temperature curves, precipitation bars, sun/moon indicators) to reflect the updated state. This approach ensures UI consistency and predictable rendering cycles.

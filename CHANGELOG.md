# Changelog

All new features, improvements, and fixes for WeatherHist will be documented in this file comprehensibly.

## [v1.3.25] - 2026-04-26

### Bug Fixes & I18n
- **Today Label (i18n)**: Added "Today" (HOY/TODAY) to the translation dictionary to ensure the header correctly updates when switching languages.
- **Reference Error Fix**: Fixed `Uncaught ReferenceError: drawMainCanvas is not defined` by correctly referencing the internal `render()` function during language changes.
- **Modal Z-Index**: Increased the info modal `z-index` to `5000` to ensure it always overlays correctly on top of the header in mobile devices.
- **Theme Names i18n**: Removed local translations from theme names; they are now loaded dynamically from their respective JSON configuration files to respect the source name.

## [v1.3.24] - 2026-04-26

### Visual & Functional Improvements (UI/UX)
- **Internationalization (i18n)**: Implemented full bilingual support. Users can now toggle between English and Spanish via the settings modal. A scalable `i18n.js` module handles all UI text, dates, weather conditions, and AQI status.
- **UV Fix**: The dynamic UV index label now accurately displays in its proper location across the top timeband, ensuring pre-existing hourly digits remain fully visible without visual overlap.
- **Precipitation Transparency**: Fixed an overlap bug in precipitation blocks displaying overly bright white backgrounds. The low-opacity curve now blends harmoniously throughout the entire histogram background.
- **Diagonal Rain Lines**: Greatly immersive improvement to the lower rain section; random fixed rain icons have been replaced. The graph now draws delicate fine diagonal lines simulating real precipitation falling.
- **Dusk Artifacts (22h & 6h Lines)**: Fixed an obscure visual glitch where shadow blending transparency during dusk (22:00) and dawn (06:00) transitions caused a barely visible dark line overlap.
- **Night UV Hidden**: UV index paths and segments will no longer mistakenly render when the sun is down during nighttime hours.

## [v1.3.23] - 2026-04-26

### Visual Improvements (UI/UX)
- **Hourly Tick Fixes**: Improved hourly ticks in the upper X-axis. Demarcation lines now use an extra white outer glow ensuring superior contrast against different background tones corresponding to the time of day.
- **Integrated UV Label**: The extreme UV background box is now painted cleanly below the time text. This resolves text collisions and double-layered text issues.
- **Temperature Glow Fidelity**: The main temperature line accurately preserves its crisp physical path with appropriate directional shading, eliminating the messy blur towards solid white light.
- **Enhanced Thunderbolts**: Visual effect representing electrical storms and lightning phenomena is now fully dynamic, utilizing irregular sine wave animations to simulate cartoon-style high-tension wires actively electrocuting.
- **Smoothed Precipitation**: Reduced opacity added to the rain probability fill. For superior immersion, inner cloud icons were exchanged for water droplets under the rain, and for snow, the label inside is now rendered solidly in black for drastic contrast.
- **21:00 Artifact Clean-up**: Corrected a millimeter-wide gap defect rendering during sunset/sunrise shifts (mostly noticeable around 21:00h). Shadow stitching is now totally seamless vertically.

## [v1.3.22] - 2026-04-24

### Visual Improvements (UI/UX)
- **Removed Wind Interference**: Removed the overlay graphical line for wind gusts to vastly clear clutter off the temperature visual interface.
- **Perfected Temperature Glow**:
  - Removed standard apparent temperature glow.
  - Visibility logic now actively scans physical bounds against clouds, fixing instances where clear skies wrongly displayed no associated *glow*.
  - The luminous trail now progressively diffuses at string edges for banding-free organic transitions manipulating thin core widths against deep gaussian-blurred layer composites and alpha-blending logic.
  - White moon glow intensity greatly bumped at night to actively maintain solid visibility and contrast atop clear background canvases.

## [v1.3.21] - 2026-04-24

### Visual Improvements (UI/UX)
- **Continuous Puddle**: Puddles under the temperature curve are now structured as a continuous fluid strip instead of separated ellipses, smoothly transitioning to overall rain fills.
- **Organic Splashes & Drops**: Replaced static dots with dynamic splash vectors. Additionally, water drips now fall matching realistic bezier shapes, terminating straight artificial drops.
- **Dual-layer Temp Glow**: Implemented an explicit dual-layer backbone for temperature luminosity (daytime orange, nighttime white) ensuring rendering compatibility on both desktop and mobile devices.

## [v1.3.20] - 2026-04-23

### Visual Improvements (UI/UX)
- **Progressive Glow Fading**: White and orange glares surrounding temperature paths now dynamically fade in/out during clear to overcast interactions rather than switching instantly.
- **Mobile Glow Optimizations**: Smoothed the orange glare intensity for portable devices, increasing blur passes and dimming general bounds intended for a cleaner professional display.

## [v1.3.19] - 2026-04-23

### Visual Improvements (UI/UX)
- **Apparent Temperature Color Clarity**: Tuned coloring logic forces the apparent line to retain distinct blue tones when strictly below true temperature (even traversing direct sunlight). Yields an unambiguous interpretation of freezing dips.
- **Softened Readouts**: The heavy white background glow accompanying temperature tags over low-visibility spots is now 60% more transparent, seamlessly harmonizing the background without dropping standard legibility.

## [v1.3.18] - 2026-04-23

### Visual Improvements (UI/UX)
- **Apparent Temp Mixing Adjustments**: Apparent temperature lines threading through direct sun/moonlight automatically mix color arrays depending on value relation. Values exceeding standard heat merge with existing orange/white glows while blue merges the ambient hue rendering far more polished visuals.

## [v1.3.17] - 2026-04-23

### Visual Improvements (UI/UX)
- **Silky Smooth Precipitation Steps**: Widened gradient ranges bridging rain and snow intersections to 60px making graphical shift almost unnoticeable.
- **Adaptive Base Colors**: The apparent temperature line changes coloring to distinct oranges or whites when entering clear skies mimicking interface conditions.
- **Clean Point Reading Labels**: Temperature readout nodes traversing clear skies omit default white bounding halation preventing noisy artifacts.

## [v1.3.16] - 2026-04-23

### Visual Improvements (UI/UX)
- **Graphical Rain Blending Gradient**: Improved blending limits where weather changes from sun to precipitation storms. Advanced Alpha Gradients across edge vertices completely remove hard line break rendering probability organically.
- **Temp Glow Redesign**: Erased dashed/dotted artifacts overlapping lines. A clear sky emits continuous backlist diffusion. Sunshine projects deep thick **orange radiance**, and calm nights emit distinct non-intrusive white lunar glows.

## [v1.3.15] - 2026-04-23

### Visual Improvements (UI/UX)
- **Unified Wet Physics**: Crossfading between probable rain, thunderstorm activity, and snow blocks is dynamically uniform. Hard transparent disconnects deleted for overall cohesive precipitation graph layouts.
- **Integrated Base Core**: Glow aesthetics applying real-daytime illumination and moonlit reflections no longer trick viewers causing fake dual pathways. Shading sits directly integrated matching curve paths carrying pseudo-random density shifts for realism against aggressiveness.
- **Refactored Moisture Beading**: Wet effects coating historical chart bands on rainy shifts enhanced. Ambiguous dashed geometry replaced using elegant drop tears dispersed variably across timeline axes.

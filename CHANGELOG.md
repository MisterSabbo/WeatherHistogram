# Changelog

All new features, improvements, and fixes for WeatherHist will be documented in this file comprehensibly.

## [v1.3.30] - 2026-04-27
 
### UX & Aesthetic Refinements
- **Alerts Tooltip Interaction**: Simplified alerts tooltip triggering and ensured its CSS alignment behaves consistently on high-DPI and regular desktop screens. Increased the hit target size for easier interaction and verified visibility overrides against default hidden states.
- **Canvas Label Fidelity**: Re-harmonized the hour digit rendering color in the upper X-axis when overlapping UV panels. Switched to a universal white-haloing strategy to match the core theme's grid axes, ensuring perfect legibility and color consistency between "free" and "covered" hours.
- **iOS Rendering Stability**: Integrated canvas smoothing and adjusted redraw buffering to eliminate microscopic flickering on modern iOS devices during rapid horizontal panning or panel expansion.

## [v1.3.29] - 2026-04-27

### Fixes & Optimizations
- **Cloud Scrubber Interpolation**: Adjusted the scrubber tracker Y coordinate mapped calculation point to perfectly match the cubic bezier curves applied natively by the Canvas 2D engine in `AtmosphereRenderer`, completely fixing the scrubber marker drawing into the "air". 
- **Tooltips Positioning**: Cleaned up the CSS rules controlling the desktop and mobile views of the geolocation and weather alert tooltips so they correctly align towards the view bounds without getting truncated out of the screen.
- **X-Axis Overlap by UV Panels**: Restored visibility of the hour markers directly beneath dynamically expanded active Ultraviolet panels, cleanly separating them along the left/right boundaries of the panel overlay logic and improving rendering hierarchies.
- **Polar Region Support**: Added direct native response queries for `is_day` onto the hourly API to prevent edge-case infinite loops where locations situated near the polar circles caused infinite "Night" bugs because `sunrise` and `sunset` times can be reported as null/missing.
- **UX Hover Refinements**: Refactored the DOM styling inline properties causing conflicts with alert CSS interactions, solving issues where alert panels would fail to display.

## [v1.3.28] - 2026-04-27

### Fixes & Optimizations
- **Tooltip Positioning Override**: Ensured that the tooltips logic explicitly leverages bounding adjustments correctly. They respect screen bounds directly and prevent edge trimming. Specifically removed conflictive nested layout directives driving elements towards negative translation boundaries. 
- **UX Hover Refinements**: For the active alerts notification capability in mobile view, its hover logic is completely suppressed and strictly relies on active tap. This eliminates unintended constant and intrusive system behavior while users drag through the interface. Furthermore, visibility and opacity rendering triggers were re-patched. 
- **Z-Index Layer Hierarchy Optimization (UV / Scrubber axis)**: Rendering the interactive UV extended panel natively into the scrubber overlay no longer obscures the underlying temporal hours ticks framework structure underneath. Now, a dynamic top-level re-render is layered properly upon overlap allowing consistent axis readout overlaying any dynamically constructed block.
- **Micro-adjustment of Curve Render Accuracy**: Eliminated subtle fractional subpixel rounding misalignments introduced within horizontal scroll mapping bounds, ensuring perfectly anchored marker locations directly onto real pathing coordinate intersects across the mathematical drawing logic frame.

## [v1.3.27] - 2026-04-27

### UI/UX Refinements
- **Tooltip Adjustments**: Fixed off-screen positioning for the top panel tooltips (Location & Active Alerts), preventing horizontal layout shifts on smaller devices. Also reduced their font size internally for improved proportion.
- **Header Layout Constraint**: Re-arranged the inner flex container of the header timeblock and modified the warning icon size and placement such that rendering it doesn't cause vertical shifting of the main chart layout. Also ensured the tooltip interaction triggers cleanly over standard hover patterns and modern Safari touch devices.
- **UV Index State Presentation**: The universal background UV index layer now draws in a minified visual state (reduced height, intense color) globally across the entire timeline, expanding to reveal its full numeric value metric block strictly under the active vertical scrubber's position.
- **Visual Scrubber Fixes**: Removed an overlapping dashed line effect underneath the primary solid reference scrubber line, resolving blurring/dotted artifacts. Adjusted the interaction points center to perfectly perfectly align horizontally with the solid scrubber axis.
- **Translations (i18n)**: Appended new text dictionary keys mapped across EN & ES files for localized Active Alerts descriptors.

## [v1.3.26] - 2026-04-27

### Feature Additions & Improvements
- **Uniform UV Style**: The UV Index label across the axis on the desktop version now explicitly uses the same styling rules as the mobile version, maintaining a consistent block format.
- **UV Label Rendering Logic Overhaul**: UV labels are now rendered natively within `BackgroundRenderer` avoiding asynchronous reposition calculations on the DOM layer. This absolutely solves the flickering bug experienced on modern iOS devices when scrolling the histogram.
- **Layer Stacking Consistency**: By rendering UV in the background and before drawing grid elements `GridRenderer`, the upper X-axis hour digits correctly overlap over the UV label instead of being hidden behind it.
- **Snow Frost Effect**: Added a frosty cyan glow internal visual effect on the temperature line graph when traversing a snow weather condition.
- **Smart Notification System**: Incorporated a predictive active weather alert notification capability checking conditions (Temperature >35°C/<-5°C, Hurriquate Winds, Torrential Rain, Extreme UV >11 or Intense Snowwards) over a 12-hour horizon, with a visual indicator tooltip directly on the header interface.
- **Label Collision Fix**: Refined constraints causing `% clouds` labels occasionally overlapping with UV index block.

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

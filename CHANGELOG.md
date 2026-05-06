# Changelog

All new features, improvements, and fixes for WeatherHist will be documented in this file comprehensibly.

## [v1.4.5] - 2026-05-06
### UI & UX Improvements
- **Modal Aesthetic Sync**: Unified the close button styling across all modals (AQI, Pollen, Settings). They now utilize the floating, circular, border-aligned "X" style originally introduced in the SPF modal.
- **Enhanced Mobile PTR Feedback**: The Pull-To-Refresh behavior has been augmented to trigger the location search function. This forces an explicit UI loading state and re-verifies the user's geocoding to provide better interaction feedback.
- **Micro-Scroll Prevention**: Implemented `touch-action: none` on the non-scrollable overlay modals (SPF, Pollen, AQI) to eliminate native mobile browser micro-scrolling (frequently observed on Android devices) when users interact with the overlays.

## [v1.4.4] - 2026-05-06
### Bug Fixes
- **Animated Weather Zone Spacing**: Fixed a layout bug in the animated weather zone capsule where an empty gap was rendered when both AQI and Pollen warning icons were inactive due to a persistent flexing container row.

## [v1.4.3] - 2026-05-06
### UI Refinements
- **Settings Modal Enhancement**: Renamed the "Sun Protection" section to "Adjust Phototype" for better technical alignment. Added a filled shield icon to the section header for improved visual signaling.

## [v1.4.2] - 2026-05-06
### UX & Aesthetic Refinements
- **UI Consistency**: Decreased tooltip radar modal dimensions to perfectly match the size specifications of the original inline tooltips, ensuring formatting symmetry across the board.
- **Micro-Interactions**: Hovering on dynamic risk icons in the bottom scrubber area now yields standard `pointer` cursor states. Language cards in the settings menu are realigned, resolving any vertical baseline offsets from added emojis.
- **Dynamic Header Palette**: Header readouts for Air Quality (AQI) and Pollen now dynamically color shift along the standard hazard severity scales (Green, Yellow, Orange, Red, Purple, Maroon), mirroring the bottom-HUD alerting icons.
- **Skin Type Modal**: Finalized UI parity for the SPF widget modal by porting it from hardcoded transparent dark overlays to the native App Theme `var()` colors.

## [v1.4.1] - 2026-05-06
### Features & UX Improvements
- **Animated Weather Zone Priority**: Implemented dynamic z-index management for the animated weather zone. When it displays more than 2 icons, it successfully overlays above the 0°C grid reference line text to prevent visual crossover and clutter.
- **Interactive AQI & Pollen Capsules**: The AQI and Pollen icons within the animated weather zone are now fully interactive, spawning detailed modals that match the comprehensive radar canvases provided in the header tooltips.
- **SPF Modal Redesign**: Completely overhauled the SPF (Sun Protection) modal presentation. It now features a robust dark-themed layout displaying large colorful stats, risk descriptions, recommended SPF, and safe un-protected time limits for clear legibility on mobile formats.

## [v1.4.0] - 2026-05-06
### Features & UI Overhaul
- **Pull-to-Refresh Indicator**: Added a visual feedback indicator with a spinner to show when data is being refreshed via the pull-down gesture on mobile.
- **Settings Gear Icon**: Updated the info icon in the header to be a settings gear (`settings`) to better signify its functionality.
- **Language Selector Cards**: Replaced the previous `select` dropdown with distinct, clickable cards showing country flags and ISO codes for better accessibility and design language consistency.
- **Animated Weather Zone Redesign**: Wrapped the weather summary icon, AQI/Pollen icons, and SPF indicator into a single translucent glass pill. This unifies them visually, resolving horizontal alignment issues from their inherently varied widths.
- **Refined Terminology**: Updated strings (e.g., "Repositorio" to "Código fuente", "Ajustes del Stickman" to "Ajustar umbrales 🧍") across both the UI and translation dictionaries (`i18n.js`).

## [v1.3.50] - 2026-05-05
### Visual Polish & Collision Fixes
- **Animated Weather Zone Spacing**: Increased bottom padding of animated weather zone to properly separate the summary weather icon from the stickman's drawn position.
- **Summary Icon Rescaling**: Decreased weather summary icon down to 20px so that extreme icons don't hit the umbrella canopy top.

## [v1.3.49] - 2026-05-05
### Visual Polish & Collision Fixes
- **Animated Weather Zone Tidy Up**: Avoid overlap between the stickman and weather summary icons by scaling down the summary icon to 22px.
- **Stickman Bounds Re-Align**: Shifted stickman vertical rendering footprint to utilize the full extent of the canvas limits, matching zero-padding bottom anchoring constraints.

## [v1.3.48] - 2026-05-05
### Bug Fixes & Refinements
- **SPF Icon Rendering**: Adjusted the generic Google Fonts API request ensuring `FILL` weight property gets downloaded properly and solves the issue where the SPF icon was lacking fill.
- **Mobile Container Overflow**: Fixed an issue where the Animated Weather Zone was pushing elements outward via `overflow: hidden` by dropping the clip limit and decreasing bottom padding.
- **SPF Burn Time Formula Algorithm**: Refined the "Time to burn" equation to rely on true UV scale factors, increasing accuracy for Fitzpatrick skin types.

## [v1.3.47] - 2026-05-05
### Refinements & Layout Adjustments
- **Animated Weather Zone Container**: Added height restrictions and refiltered the blur effect solely to the range below the 0° Celsius threshold.
- **SPF Shield Correction**: Remedied layout and rendering anomalies for the Sun Protection icon making the shield properly filled (`FILL` set to 1) without blurry shadows overlapping the text.
- **Icon Alignment**: Standardized the display flow within the animated zone making sure the AQI and Pollen icons can peacefully sit next to each other within an assigned row instead of suffering overflow when both are active simultaneously.
- **Enhanced Skin Type Display Cards**: Updated the literal explanations per card referring strictly to the Fitzpatrick Scale recommendations, applying gender alternating single-char emojis for broader support and visual distinctiveness.

## [v1.3.46] - 2026-05-05
### Features & Refinements
- **Animated Weather Zone Redux**: The animated weather zone has strictly been confined to the lower area beneath the 0°C line, ensuring optimal visibility of upper chart elements.
- **Icon Alignment & Consistency**: All hazard icons in the animated zone now match their top-panel counterparts (`eco` for AQI and `local_florist` for pollen) to maintain design consistency.
- **SPF Modal & Presentation**: The SPF indicator in the main view now features a solid blue shield along with horizontal value placement. The modal view has been equipped with a new field for "Recommended SPF" and a dismiss-on-outside-click functionality.
- **Graphic Temperature Refresh**: Decimals have been stripped entirely from the main temperature labels over the graph to eliminate clutter and provide clearer readouts.
- **Fitzpatrick Scale Selection**: The simple dropdown for Skin Type selection has been replaced by an interactive grid of descriptive emoji cards detailing the Fitzpatrick scale classifications in the settings panel.

## [v1.3.45] - 2026-05-05
### Features & Refinements
- **Animated Weather Zone**: We've reserved the area on the left of the scrubber for a beautifully blurred background emphasizing the current weather summary, AQI warnings, Pollen risk alerts, and SPF considerations in a vertically-aligned stack.
- **US AQI Parsing**: Synchronized the app to use `us_aqi` explicitly instead of `european_aqi` for better predictability of Air Quality constraints.
- **SPF Tracking**: The new SPF indicator evaluates current UV readings along with the user's selected Skin Type to provide safe sun practices, optimal SPF, and time-to-burn metrics inside a brand new modal.
- **Mobile Pull-to-Refresh Fixed**: Corrected an issue where the pull-to-refresh logic only registered in the top 150 pixels of the screen.

## [v1.3.44] - 2026-05-04
### UI & Usability Updates
- **Pull To Refresh**: Refined mobile pull-to-refresh logic to correctly identify vertical intent and ignore horizontal panning.
- **Scrubber Label Alignment**: Repositioned data point labels so their upper-left corners directly attach to their corresponding scrubber points. Labels now present square top-left corners to visually emphasize this connection.
- **Visual Refinements**: Reverted the opacity in the clouds graph to 0.7 for optimal visual balance.

## [v1.3.43] - 2026-05-04
### UI Refinements
- **Temperature Label Alignment**: Refined the scrubber labels to individually associate icons with their respective temperature values. The thermometer icon is now strictly aligned with the real temperature, while the "feels like" icon is aligned with the apparent temperature, both following a consistent two-column layout within the label for improved clarity.

## [v1.3.42] - 2026-05-04
### UI & Usability Updates
- **Mobile Adjustments**: The information modal now respects vertical viewport constraints with a maximum height and internal scrolling. Stickman configuration is neatly collapsed by default to save space.
- **Pull To Refresh**: Added a pull-down gesture to intuitively refresh current location data on touch devices without clearing the entire app environment. 
- **Temperature Display Logic**: Eliminated decimals uniformly across all main temperature readouts (header, tooltip, and scrubber labels).
- **Apparent Temperature Focus**: Adjusted the threshold gap for showing apparent temperature from 1.0 to 1.5 degrees difference. The apparent temperature secondary label now distinctly prefixes its value with a dynamic icon (person) alongside.

## [v1.3.41] - 2026-05-04
### Visual Refinements
- **Zero Degree Line**: Synchronized the text color of the "0°C" indicator with its corresponding icon for better UI consistency.
- **Atmosphere Rendering**: Adjusted the cloudiness histogram fill to be lighter and more translucent at higher percentage levels, improving overall chart legibility in overcast conditions.
- **Starry Sky**: Improved night sky distribution by allowing stars to appear across 85% of the vertical space (previously restricted to the top 50%).

## [v1.3.40] - 2026-04-30
### Stickman & UI Adjustments
- **Stickman Logic Update**: Sunglasses are now only worn during daytime when cloud cover is below 60% (configurable via settings). Cold outfits dynamically display only a scarf, while winter boots and gloves are now strictly reserved for snowy conditions. The umbrella is correctly deployed during any liquid/storm precipitation. Stickman blushing effects are now applied with precise unified color for fill and stroke. Addressed an occasional rendering bug related to the back arm.
- **Wind Gust Labels**: The hourly wind gusts labels now embed an inline wind icon seamlessly matching the alarm color associated with the intensity of the wind.
- **Visual Clarity Adjustments**: The left side dashed segment of the 0°C baseline in the overlay properly synchronizes its opacity and styling with the rest of the layout, eliminating jarring intensity. Additionally, past daily cards exhibit heightened grayscale and reduced opacity to reinforce visual differentiation from the forecast section.

## [v1.3.39] - 2026-04-30
### Animated Interactions and Visual Enhancements
- **Interactive Stickman**: Added a stickman animation at the left of the scrubber that walks forward/backward in tandem with the user's scrolling.
- **Dynamic Stickman Reactions**: The stickman dynamically reacts to the current weather on screen (e.g. holding an umbrella when raining, wiping sweat when hot, wearing a scarf/beanie returning cold, leaning into the wind).
- **Scrubber Weather Summary**: A large, responsive current-weather icon was added to the bottom left section of the scrubber area for a quick reading of the active hour.
- **3D Cloudy Temperature Line**: Transformed the shadow beneath the cloudy temperature line into a multi-layered embossed effect, giving the line genuine geometric volume.
- **Past Days Card Dimming**: The daily forecast cards for past days are now gracefully desaturated and dimmed to help users distinguish historical data from upcoming forecasts instantly.

## [v1.3.38] - 2026-04-29
### Fixes
- **Location Search**: Fixed an error that showed "undefined" for the country in certain locations (e.g., Ittoqqortoormiit). Search results and selected locations now correctly handle the absence of administrative or country fields, providing more complete and cleaner names.

## [v1.3.37] - 2026-04-29
### UI Improvements & Visual Fixes
- **Critical Label Visibility**: Fixed the bug that caused cloud or rain probability labels to disappear when their value reached 100%. They are now correctly constrained to the top and bottom edges of the canvas area before attempting collision placement.
- **Minimap Magnifier Relief**: The base blur of the animated content in the minimap magnifier has been completely removed to improve sharpness. Refraction shadows have been intensified to enhance the 3D crystalline relief effect.
- **Precipitation Gradients**: Precipitation bars and the probability line in the minimap now accurately reflect precipitation types, gradually interpolating colors for snow (cyan), storm (purple), or rain (blue) based on context.
- **0°C Base Line**: Relocated the 0°C label and placed it horizontally aligned with its snow icon, integrating it better into the left column.

## [v1.3.35] - 2026-04-29
### Fixes & UX Improvements
- **Minimap Visual Effects**: The minimap magnifier is now transparent and works as a convex glass with 3D shadows and refraction. The minimap restores the past/forecast split with independent scrolling, darkening the past as a temporal reference without the UI toggle.
- **Adaptive Labels & Jitter**: Fixed temperature label flickering (visual jitter caused by variable character widths during scrolling). Precision now uses simulated tabular figures for the bubble.
- **Weather Iconography**: Precipitation probability dynamically changes its color and icon for rain, snow, or storm. Duplicate icons in precipitation bars and wind gusts have been removed for better readability.
- **Temperature Visuals**: Underlying shadow of the temperature line in cloudy segments has been further blurred for better differentiation.
- **iOS Performance**: Fixed flickering by introducing an independent DOM element for the UV block and removing unnecessary canvas redraws. Native smooth scrolling has also been added for daily cards, eliminating lag.
- **Simplified Minimap**: Removed the Past/Forecast selector, unifying the minimap view. The minimap now freely shows the entire timeline without artificial darkening, and its magnifier is fully transparent.
- **Labels & Text**: Increased the size of chart point labels (temperature, clouds, rain) for better readability on mobile. Apparent temperature remains visible and proportionate.
- **Minimap Dates**: Added a "dd/MM" format next to the day of the week and expanded its space to prevent date labels from overlapping at lower resolutions.

## [v1.3.34] - 2026-04-28
### Minimalist Design
- **Minimap Selector Redesign**: The Past/Forecast toggle has been simplified to its maximum, removing text and using subtle icons over a semi-transparent background to avoid obscuring critical chart information.

## [v1.3.33] - 2026-04-28
### Minimap & Alerts
- **Minimap Improvement**: The Past/Forecast selector is now more minimalist and allows direct navigation to the corresponding section upon clicking. 
- **Day Overlapping**: Optimized the drawing of day names in the minimap to avoid visual collisions between labels.
- **Mobile Alerts**: Fixed the positioning of weather alert tooltips on mobile devices to prevent them from overflowing off the side of the screen.
- **Apparent Temperature**: Slightly reduced the font size of the apparent temperature to improve visual hierarchy on the temperature line.

## [v1.3.32] - 2026-04-28
### Tooltips, Scrubber & Minimap Mode
- **Dual Minimap**: Split minimap operation into two toggleable states (Past and Forecast), independently navigable to better view data on a larger scale for recent days. Auto-toggle when moving at the edges.
- **Dual Temperature (Apparent Temp)**: Redesigned the temperature label on the timeline to include the dynamic "apparent temperature" note on a line below in a slightly smaller size, avoiding a confusing horizontal rectangle.
- **Dynamic Zero Icon**: Reinforced the number and marker color of the 0°C on the left over the panel shadow, adding a "halo effect" for better readability regardless of the solar light or darkness at the time.
- **Alert Tooltips Hover/Click Fix**: Added transparent listeners to `mouseenter` and `mouseleave` to prevent opacity 0 from prematurely cutting off the message.

## [v1.3.31] - 2026-04-28
 
### Visual Upgrades & Bug Fixes
- **Volumetric Clouds Effect**: Replaced the flat cyan dotted line from freezing temperatures with a sleek dynamic shadow system. When the temperature line passes "behind" clouds visually, a subtle drop shadow perfectly simulates the sensation of clouds eclipsing the sun.
- **Flawless Scrubber Tracking**: Aligned the vertical scrubber dots to snap mathematically to the visual curve intersections. Clouds and Precipitation Probability interpolation functions were matched exactly to the bezier `t` parameters used by the canvas renderer. 
- **Bulletproof Alerts Tooltip**: Redesigned the tooltip logic for severe weather alerts. Extracted it from the generic tooltip class to prevent `visibility` CSS conflicts and guaranteed reliable `hover` scaling across all desktop and mobile formats.
- **Consistent Axis Colors**: Matched the text color of X-axis time blocks during expanded UV modes precisely to the main dataset to avoid unexpected dimming.

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

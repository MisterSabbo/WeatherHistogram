import { initThemeBindings } from './ThemeBindings.js';
import { initSettingsBindings } from './SettingsBindings.js';
import { initTooltipBindings } from './TooltipBindings.js';
import { initNavigationBindings } from './NavigationBindings.js';
import { initMaintenanceBindings } from './MaintenanceBindings.js';

export function initEventBindings(options) {
    initThemeBindings(options);
    initSettingsBindings(options);
    initTooltipBindings();
    initNavigationBindings(options);
    initMaintenanceBindings(options);
}

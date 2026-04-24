import re
import os

def extract_function(content, func_name):
    # Matches both "function name(" and "const name = (" or "let name = ("
    pattern = rf"(function\s+{func_name}\s*\(.*?\)\s*\{{|(?:const|let)\s+{func_name}\s*=\s*(?:async\s+)?\(.*?\)\s*=>\s*\{{|(?:const|let)\s+{func_name}\s*=\s*function\s*\(.*?\)\s*\{{)"
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        return None
    
    start_pos = match.start()
    brace_count = 0
    end_pos = -1
    
    for i in range(match.start(), len(content)):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end_pos = i + 1
                break
                
    if end_pos != -1:
        return content[start_pos:end_pos]
    return None

def main():
    app_path = "src/app.js"
    if not os.path.exists(app_path):
        print(f"Error: {app_path} not found")
        return

    with open(app_path, "r", encoding="utf-8") as f:
        content = f.read()

    layers = {
        "GridLayer": ["drawGrid", "drawAxes"],
        "DayNamesLayer": ["drawDayNames"],
        "SunMoonLayer": ["drawSunMarkersOnCanvas", "drawSunnyBackground", "drawNightOverlay", "drawNightShadow", "drawStarrySky", "drawSun", "drawMoon"],
        "CloudLayer": ["drawClouds"],
        "PrecipitationLayer": ["drawPrecipitation", "drawPrecipitationProbability"],
        "HumidityLayer": ["drawHumidity"],
        "WindLayer": ["drawWind"],
        "TemperatureLayer": ["drawTemperature"],
        "UvLayer": ["drawUVSegments"],
        "WeatherPhenomenaLayer": ["drawWeatherPhenomena"]
    }

    for layer_name, funcs in layers.items():
        extracted = []
        for func in funcs:
            code = extract_function(content, func)
            if code:
                # Replace global constants with state properties
                code = code.replace("PIXELS_PER_HOUR", "state.pixelsPerHour")
                code = code.replace("TILE_WIDTH", "state.tileWidth")
                code = code.replace("CHART_HEIGHT", "state.chartHeight")
                code = code.replace("MINIMAP_HEIGHT", "state.minimapHeight")
                code = code.replace("PIXELS_PER_MM", "state.pixelsPerMm")
                code = code.replace("window.hexToRgb", "hexToRgb")
                
                extracted.append(code)
            else:
                print(f"Warning: Could not find function {func}")
        
        if extracted:
            output_path = f"src/renderer/layers/{layer_name}.js"
            with open(output_path, "w", encoding="utf-8") as f:
                f.write("import { state } from '../../core/Store.js';\n")
                f.write("import { getThemeColor, getThemeFont, getThemeIcon } from '../../services/ThemeManager.js';\n")
                f.write("import { normalizeY, hexToRgb } from '../../utils/math.js';\n\n")
                f.write(f"export class {layer_name} {{\n")
                f.write(f"    constructor() {{}}\n\n")
                f.write(f"    render(ctx, viewX, viewW, h, styles) {{\n")
                for func in funcs:
                     f.write(f"        this.{func}(ctx, viewX, viewW, h, styles);\n")
                f.write(f"    }}\n\n")
                for code in extracted:
                    method_code = re.sub(r"function\s+([a-zA-Z0-9_]+)", r"\1", code)
                    # Indent the code to fit in class
                    lines = method_code.split('\n')
                    indented_lines = ["    " + line for line in lines]
                    f.write('\n'.join(indented_lines) + "\n\n")
                f.write("}\n")
            print(f"Created {output_path}")

if __name__ == "__main__":
    main()

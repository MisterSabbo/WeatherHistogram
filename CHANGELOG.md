# Registro de Cambios (Changelog)

Todas las novedades, mejoras y correcciones de WeatherHist se documentarán en este archivo de manera comprensible.

## [v1.3.20] - 2026-04-23

### Mejoras Visuales (UI/UX)
- **Degradado Progresivo de Glow**: Los resplandores (glows) blanco y anaranjado de la línea de temperatura ahora aparecen y desaparecen de forma paulatina al transicionar entre zonas despejadas y nubladas/con lluvia, evitando cambios bruscos.
- **Optimización de Resplandor Móvil**: Se ha suavizado el resplandor anaranjado en dispositivos móviles, aumentando la difuminación (blur) y ajustando su intensidad para una visualización más cómoda y profesional.

## [v1.3.19] - 2026-04-23

### Mejoras Visuales (UI/UX)
- **Fidelidad de Color en Sensación Térmica**: Se ha ajustado la lógica de color para que la línea de sensación térmica mantenga su azul distintivo cuando se encuentra por debajo de la temperatura real, incluso en zonas despejadas. Esto asegura una interpretación clara de los tramos más fríos.
- **Suavizado de Etiquetas de Temperatura**: El resplandor (glow) blanco que aparece tras los números de temperatura en zonas de baja visibilidad ahora es un 60% más transparente, integrándose mejor con el fondo sin perder su función de legibilidad.

## [v1.3.18] - 2026-04-23

### Mejoras Visuales (UI/UX)
- **Mezcla de Colores en Sensación Térmica**: La línea de sensación térmica en zonas despejadas ahora utiliza una mezcla de color dinámica. Si la sensación está por encima de la temperatura real, el rojo se fusiona con el naranja/blanco del resplandor. Si está por debajo, es el azul el que se mezcla con el tono del resplandor, logrando una transición cromática mucho más coherente y estética.

## [v1.3.17] - 2026-04-23

### Mejoras Visuales (UI/UX)
- **Transiciones de Precipitación Extra Suaves**: Se ha ampliado el área de degradado de los efectos de lluvia y nieve a 60px, haciendo que las transiciones sean prácticamente imperceptibles y mucho más naturales.
- **Color Adaptativo en Sensación Térmica**: La línea de sensación térmica ahora cambia su color a tonos anaranjados (día) o blanquecinos (noche) cuando el cielo está despejado, haciendo juego con el resto de la interfaz.
- **Etiquetas de Temperatura Limpias**: Se ha eliminado el halo blanco de los números de temperatura cuando se muestran sobre áreas despejadas del histograma, mejorando la estética y nitidez general.

## [v1.3.16] - 2026-04-23

### Mejoras Visuales (UI/UX)
- **Degradado en Transiciones de Precipitación**: Se ha perfeccionado el suavizado (blending) en los puntos de contacto cuando se pasa de sol a lluvia/tormenta/nieve. Ahora se aplica una transparencia difuminada (Alpha Gradient) en los bordes de los tramos que logra evitar los cortes secos integrando orgánicamente la probabilidad de lluvia.
- **Rediseño del Resplandor de Temperatura**: Se han eliminado los resaltes "punteados" que asomaban en las líneas. Ahora, el efecto de un cielo despejado emite un brillo continuo retroiluminado difuminado. Para las horas de soleado incide un **resplandor naranja denso** sobre la zona superior, y para las noches despejadas un halo blanco (Moon glow) claramente visible y poco intrusivo.

## [v1.3.15] - 2026-04-23

### Mejoras Visuales (UI/UX)
- **Fusión de Lluvia y Nieve**: La transición visual entre zonas con probabilidad de lluvia, nieve y tormentas ahora es completamente fluida. Ya no hay recortes invisibles abruptos cuando pasas de un estado al siguiente, dando un patrón continuo de precipitaciones.
- **Brillo de Temperatura Integrado**: El efecto de luz diurna y el brillo lunar que afecta a la línea de temperatura en cielos despejados ahora se dibuja directamente integrada sobre la propia línea principal (sin crear una sensación accidental de línea doble flotante) y con una irregularidad aleatoria más natural, haciendo el efecto menos agresivo.
- **Reformulación de las Gotas de Lluvia**: El efecto mojado en la gráfica de temperatura durante las horas lluviosas ha recibido una mejora. En lugar de dibujar puntos o rayitas poco claras, ahora dibuja elegantes lágrimas sutiles esparcidas de forma orgánica.

# 🎹 Notitas — piano y música jugando

App gamificada (estilo Duolingo) para aprender música y piano en familia y competir.
Funciona en **Mac, iPad y celular** desde el navegador, se instala como app y funciona sin internet.

## ¿Qué tiene?
- **93 lecciones en 4 niveles** de dificultad creciente:
  - 🌱 **Principiante**: teclado, teclas negras, pentagrama, oído, ritmo, acordes, canciones y teoría.
  - 🌿 **Intermedio**: bemoles, clave de fa, intervalos, puntillo, acordes mayores/menores, escalas, canciones sin nombres en las teclas y examen.
  - 🌳 **Avanzado**: ♯ y ♭ en la partitura, reconocer notas de oído, dictado musical, lectura a primera vista, acordes con teclas negras, canciones leyendo partitura, teoría avanzada y examen.
  - 🏆 **Experto**: lectura y dictado sin pistas, oído absoluto, escalas avanzadas y cromática, todos los acordes, *Para Elisa* y gran examen final.
- **Piano táctil con sonido** para tocar en cada ejercicio.
- **Canciones reales** guiadas frase por frase: Estrellita, María tenía un corderito, Martinillo, Himno de la alegría y Cumpleaños feliz.
- **Gamificación**: XP, estrellas, 3 corazones por lección, combos, racha diaria 🔥, meta diaria de 30 XP, niveles y medallas.
- **⚡ Reto del día**: 60 segundos contrarreloj. Todos reciben **las mismas preguntas ese día**, así que es una competencia justa.
- **👑 Liga semanal**: ranking de XP de la semana entre los jugadores.
- Varios jugadores por dispositivo (p. ej. papá e hija en el mismo iPad).

## Cómo abrirla
1. En GitHub: **Settings → Pages → Source: GitHub Actions** (una sola vez).
2. Cada push publica la app en `https://<tu-usuario>.github.io/<repo>/`.
3. Abre ese enlace en cada dispositivo:
   - **iPhone/iPad (Safari)**: Compartir → *Añadir a pantalla de inicio*.
   - **Mac (Safari)**: Archivo → *Añadir al Dock*. (En Chrome: ícono de instalar en la barra de direcciones.)

> En iPhone/iPad, si no se oye el sonido, quita el modo silencio.

## Competir en dispositivos distintos
El progreso se guarda en cada dispositivo (no necesita cuentas ni servidor).
En la pestaña **Liga**, toca **📤 Enviar progreso** y manda el enlace al otro dispositivo
(WhatsApp, iMessage, AirDrop). Al abrirlo, ese jugador aparece/actualiza en la liga.

## Desarrollo
Es HTML + CSS + JS sin dependencias. Para probar localmente:

```bash
python3 -m http.server 8000
```

y abre http://localhost:8000.

## Plugins de Claude Code del proyecto
Al abrir este repo con Claude Code, se ofrecen automáticamente (configurados en `.claude/settings.json`):

| Plugin | Qué hace | Origen |
|---|---|---|
| **Ponytail** | Hace que Claude escriba menos código: reutiliza lo que ya existe antes de agregar cosas nuevas. Comandos `/ponytail-review` y `/ponytail-help`. Requiere Node.js. | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) |
| **Agent Skills** | Skills de ingeniería: especificar, planear, probar y revisar código. | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) |
| **graphify** | Skill `/graphify .` que convierte el proyecto en un mapa de conocimiento (`graphify-out/graph.html`). Requiere Python 3.10+; instala el paquete `graphifyy` la primera vez. | [safishamsi/graphify](https://github.com/safishamsi/graphify) (copiada en `.claude/skills/graphify/`) |

Claude Code pide confirmar la instalación la primera vez que abres el proyecto. También puedes instalarlos a mano:

```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills
```

---

# 🧭 Ruta — agente de planificación de viajes

App web en [`viajes/`](viajes/) (se publica en `https://<tu-usuario>.github.io/<repo>/viajes/`).

**Flujo:** primero pregunta si el viaje es **en carro o en avión**.

- **🚗⚡ Carro (Chery iCAR 03T):** ruta en Google Maps (mapa + botones a Google Maps/Waze), peajes categoría I y estado de la vía,
  **plan de energía** (con cuánto % salir, dónde y cuánto cargar, % de batería por tramo según subidas/bajadas y regeneración),
  sitios turísticos en ruta, hospedajes con cargador, presupuesto y checklist.
- **✈️ Avión:** sitios imperdibles, zonas clave para hospedaje, movilidad local, itinerario día por día y presupuesto.
- Después se puede seguir conversando con el agente; los planes quedan en **Mis viajes** (en el dispositivo).

**Cómo funciona:** el agente es Claude (Opus 5.5 por defecto) con búsqueda web en vivo y una herramienta local
(`viajes/energia.js`) que calcula el consumo de la iCAR 03T. La llamada va directo del navegador a la API de Anthropic con tu
clave, que se guarda solo en tu navegador (⚙️ Ajustes). Sin clave funcionan el mapa y la calculadora de batería.
Los datos del carro (69,77 kWh, consumo, reserva, potencia DC) se pueden ajustar en ⚙️ Ajustes.

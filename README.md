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

## 🔁 La Brecha Invisible (carpeta `traductor/`)
App web con las herramientas del libro *La Brecha Invisible*, de Leonardo Pineda Lombana, para conectar la ciberseguridad con el lenguaje del negocio.
Se publica en `https://<tu-usuario>.github.io/<repo>/traductor/`, funciona sin internet y se puede instalar como app.

| Cap. | Herramienta | Qué hace la app |
|---|---|---|
| 1 | El Traductor Bidireccional | Traduce una frase técnica al negocio y al revés, con detector de jerga. |
| 2 | Los 3 filtros antes de bloquear | Calcula las horas que cuesta una restricción y da un veredicto. |
| 3 | La Plantilla Financiera de una Página | Hace las cuentas y arma la página de 4 cuadrantes para el CFO (imprimible). |
| 4 | Las 3 Preguntas del CEO | Revisa si el proyecto está listo: sin jerga y con métricas de negocio. |
| 5 | La conversación del "Sí, y…" | Guion en 4 pasos y acta de responsabilidad compartida. |
| 6 | El Validador de Frameworks | Tres preguntas y veredicto antes de firmar. |
| 7 | Las 5 preguntas iniciales | Arma el brief del proyecto empezando por el dolor. |
| 8 | La Regla de las Tres Frases | Cuenta palabras y oraciones y compara el antes y el después. |
| 10 | Guía de Bolsillo del Traductor Ejecutivo | Fórmula de tres frases para CEO, CFO, comité, equipo técnico o incidente. |

Además: detector de jerga en la portada, biblioteca para guardar, copiar e imprimir documentos, y copia de seguridad en JSON.
Todo se guarda solo en el dispositivo.

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

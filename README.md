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

# 🎹 Notitas — piano y música jugando

App gamificada (estilo Duolingo) para aprender música y piano en familia y competir.
Funciona en **Mac, iPad y celular** desde el navegador, se instala como app y funciona sin internet.

## ¿Qué tiene?
- **Camino de 29 lecciones** en 9 unidades: teclado, teclas negras, leer el pentagrama, notas agudas, oído, ritmo, acordes, canciones y teoría.
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

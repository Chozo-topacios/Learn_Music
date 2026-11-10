import { marked } from 'https://cdn.jsdelivr.net/npm/marked@15.0.12/+esm';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.2.6/+esm';
import { AgenteViajes } from './agent.js';
import { ICAR_DEFAULTS, planificarEnergia } from './energia.js';

// ---------- Estado y almacenamiento ----------
const LS = { ajustes: 'ruta.ajustes', viajes: 'ruta.viajes' };
const leer = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

let ajustes = { apiKey: '', model: 'claude-opus-5-5', effort: 'medium', energia: { ...ICAR_DEFAULTS }, ...leer(LS.ajustes, {}) };
ajustes.energia = { ...ICAR_DEFAULTS, ...(ajustes.energia || {}) };

const $app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = txt => DOMPurify.sanitize(marked.parse(txt || ''), { ADD_ATTR: ['target'] });
const fmt = (n, d = 0) => Number(n).toLocaleString('es-CO', { maximumFractionDigits: d, minimumFractionDigits: d });
const hoy = () => new Date().toISOString().slice(0, 10);

let agente = null;
let controlador = null;

// ---------- Pantalla 1: ¿carro o avión? ----------
function vistaInicio() {
  cancelar();
  $app.innerHTML = `
    ${!ajustes.apiKey ? `<div class="aviso">🔑 Para que el agente investigue rutas, peajes y hoteles en vivo, agrega tu clave de API en
      <button class="link" data-accion="ajustes">Ajustes</button>. Sin clave puedes usar el mapa y la calculadora de batería.</div>` : ''}
    <section class="hero">
      <h1>¿Cómo vas a viajar?</h1>
      <p>Te armo el plan completo: ruta, energía, peajes, sitios imperdibles y dónde dormir.</p>
    </section>
    <section class="modos">
      <button class="modo carro" data-modo="carro" type="button">
        <div class="ico">🚗⚡</div>
        <h2>En carro</h2>
        <p>Con tu Chery iCAR 03T eléctrica</p>
        <ul>
          <li>Mejor ruta en Google Maps</li>
          <li>Peajes y estado de la vía</li>
          <li>Plan de carga de la batería</li>
          <li>Sitios turísticos en ruta</li>
          <li>Hospedajes estratégicos</li>
        </ul>
      </button>
      <button class="modo avion" data-modo="avion" type="button">
        <div class="ico">✈️</div>
        <h2>En avión</h2>
        <p>Destino, días y lo que te gusta</p>
        <ul>
          <li>Top sitios imperdibles</li>
          <li>Zonas clave para hospedaje</li>
          <li>Movilidad local</li>
          <li>Itinerario día por día</li>
          <li>Estimado de presupuesto</li>
        </ul>
      </button>
    </section>`;
  $app.querySelectorAll('[data-modo]').forEach(b => b.onclick = () => vistaFormulario(b.dataset.modo));
}

// ---------- Pantalla 2: formulario ----------
const INTERESES = ['Naturaleza', 'Pueblos', 'Gastronomía', 'Cultura e historia', 'Aventura', 'Playa', 'Termales', 'Café', 'Vida nocturna', 'Con niños'];

function vistaFormulario(modo) {
  const carro = modo === 'carro';
  $app.innerHTML = `
    <form class="card form-viaje" id="form-viaje">
      <h2>${carro ? '🚗⚡ Viaje en carro' : '✈️ Viaje en avión'}</h2>
      <p class="sub">${carro ? 'Cuéntame origen y destino; yo busco la ruta, los peajes y dónde cargar.' : 'Cuéntame a dónde vas y cuántos días; yo armo lo imperdible.'}</p>
      <div class="grid">
        <label>Origen<input name="origen" required placeholder="${carro ? 'Ej: Bogotá' : 'Ej: Bogotá (BOG)'}" value="Bogotá"></label>
        <label>Destino<input name="destino" required placeholder="${carro ? 'Ej: Salento, Quindío' : 'Ej: Cartagena'}"></label>
        ${carro ? `<label class="full">Paradas intermedias (opcional)<input name="paradas" placeholder="Ej: Girardot, Ibagué"></label>` : ''}
        <label>Fecha de salida<input type="date" name="fecha" value="${hoy()}"></label>
        <label>Días de viaje<input type="number" name="dias" min="1" max="60" value="${carro ? 3 : 4}"></label>
        <label>Viajeros<input type="number" name="viajeros" min="1" max="20" value="2"></label>
        <label>Presupuesto
          <select name="presupuesto"><option>Económico</option><option selected>Medio</option><option>Alto</option></select>
        </label>
        ${carro ? `
          <label>Batería hoy (%)<input type="number" name="bateria" min="0" max="100" value="80"></label>
          <label class="check"><input type="checkbox" name="cargadorCasa" checked> Tengo cargador en casa</label>
          <label class="check"><input type="checkbox" name="regreso" checked> Incluir el regreso</label>
          <label class="check"><input type="checkbox" name="evitarPeajes"> Prefiero evitar peajes si hay buena alternativa</label>` : ''}
        <div class="full">
          <label>¿Qué les gusta?</label>
          <div class="chips">${INTERESES.map(i => `<label><input type="checkbox" name="intereses" value="${i}"><span>${i}</span></label>`).join('')}</div>
        </div>
        <label class="full">Algo más que deba saber (opcional)<textarea name="notas" placeholder="Ej: vamos con un perro, queremos un hotel con piscina, no manejar de noche…"></textarea></label>
      </div>
      <div class="acciones">
        <button type="button" class="ghost" data-accion="inicio">← Cambiar tipo de viaje</button>
        <button type="submit" class="primary">🧭 Planificar mi viaje</button>
      </div>
    </form>`;
  const form = document.getElementById('form-viaje');
  form.destino.focus();
  form.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(form);
    const datos = Object.fromEntries(fd.entries());
    datos.intereses = fd.getAll('intereses');
    ['cargadorCasa', 'regreso', 'evitarPeajes'].forEach(k => datos[k] = form[k]?.checked ?? false);
    vistaResultado(modo, datos);
  };
}

function promptInicial(modo, d) {
  const comunes = `- Fecha de salida: ${d.fecha || 'flexible'}\n- Días: ${d.dias}\n- Viajeros: ${d.viajeros}\n- Presupuesto: ${d.presupuesto}\n- Intereses: ${d.intereses.length ? d.intereses.join(', ') : 'variados'}\n${d.notas ? `- Notas: ${d.notas}\n` : ''}`;
  if (modo === 'carro') {
    return `Planifica mi viaje en carro con mi iCAR 03T.
- Origen: ${d.origen}
- Destino: ${d.destino}
${d.paradas ? `- Quiero pasar por: ${d.paradas}\n` : ''}${comunes}- Batería actual: ${d.bateria}%
- Cargador en casa: ${d.cargadorCasa ? 'sí' : 'no'}
- ${d.regreso ? 'Incluye el regreso (ida y vuelta)' : 'Solo ida'}
${d.evitarPeajes ? '- Prefiero evitar peajes si la alternativa no es mucho peor\n' : ''}`;
  }
  return `Planifica mi viaje en avión.
- Ciudad de origen: ${d.origen}
- Destino: ${d.destino}
${comunes}`;
}

// ---------- Mapa (Google Maps sin clave) ----------
function htmlMapa(modo, d) {
  const enc = encodeURIComponent;
  const paradas = (d.paradas || '').split(',').map(s => s.trim()).filter(Boolean);
  let embed, abrir, extra = '';
  if (modo === 'carro') {
    const daddr = [...paradas, d.destino].map(enc).join('+to:');
    embed = `https://maps.google.com/maps?saddr=${enc(d.origen)}&daddr=${daddr}&output=embed`;
    abrir = `https://www.google.com/maps/dir/?api=1&origin=${enc(d.origen)}&destination=${enc(d.destino)}${paradas.length ? `&waypoints=${enc(paradas.join('|'))}` : ''}&travelmode=driving`;
    extra = `
      <a class="btn" target="_blank" rel="noopener" href="https://www.waze.com/ul?q=${enc(d.destino)}&navigate=yes">🚙 Waze</a>
      <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${enc('cargador carro eléctrico cerca de ' + d.destino)}">⚡ Cargadores</a>
      <a class="btn" target="_blank" rel="noopener" href="https://www.plugshare.com/">🔌 PlugShare</a>`;
  } else {
    embed = `https://maps.google.com/maps?q=${enc(d.destino)}&z=12&output=embed`;
    abrir = `https://www.google.com/maps/search/?api=1&query=${enc(d.destino)}`;
    extra = `
      <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/travel/flights?q=${enc(`vuelos de ${d.origen} a ${d.destino} ${d.fecha || ''}`)}">🎫 Vuelos</a>
      <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/travel/hotels/${enc(d.destino)}">🏨 Hoteles</a>`;
  }
  return `
    <div class="card mapa">
      <iframe title="Mapa del viaje" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${embed}"></iframe>
      <div class="botones">
        <a class="btn" target="_blank" rel="noopener" href="${abrir}">🗺️ Abrir en Google Maps</a>${extra}
      </div>
    </div>`;
}

// ---------- Panel de energía ----------
function htmlEnergia(r) {
  if (!r) {
    return `<h3>🔋 Energía iCAR 03T</h3>
      <p class="hint">El agente calculará el consumo por tramos con el perfil de altura de la ruta. También puedes estimarlo tú:</p>
      ${htmlCalcManual()}`;
  }
  return `<h3>🔋 Energía iCAR 03T (ida)</h3>
    <div class="kpis">
      <div class="kpi"><b>${fmt(r.totalKm)} km</b><span>distancia</span></div>
      <div class="kpi"><b>${fmt(r.totalKwh, 1)} kWh</b><span>energía neta</span></div>
      <div class="kpi"><b>${fmt(r.recomendacion.cargaSalidaPct)}%</b><span>salir con</span></div>
      <div class="kpi"><b>${r.paradasNecesarias}</b><span>paradas de carga DC</span></div>
      <div class="kpi"><b>${fmt(r.consumoMedio, 1)}</b><span>kWh/100 km</span></div>
      <div class="kpi"><b>~${fmt(r.autonomiaRealKm)} km</b><span>autonomía en esta ruta</span></div>
    </div>
    <div class="barras">${r.filas.map(f => `
      <div class="barra ${f.bajoReserva ? 'bajo' : ''}">
        <div class="nom"><span>${esc(f.tramo)}</span><span>${f.socFinPct < 0 ? 'sin carga ⚠️' : fmt(f.socFinPct) + '%'}</span></div>
        <div class="pista"><i style="width:${Math.max(0, Math.min(100, f.socFinPct))}%"></i></div>
      </div>`).join('')}
    </div>
    <p class="hint">% de batería al final de cada tramo saliendo con ${fmt(r.recomendacion.cargaSalidaPct)}% y sin cargar en ruta. En rojo: por debajo de la reserva → carga antes.</p>
    <ul>${r.recomendacion.consejos.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`;
}

function htmlCalcManual() {
  return `<form class="calc-manual" id="calc-manual">
    <label>Distancia (km)<input type="number" name="km" value="300" min="1"></label>
    <label>Velocidad prom. (km/h)<input type="number" name="vel" value="70" min="20"></label>
    <label>Subida total (m)<input type="number" name="sube" value="2000" min="0"></label>
    <label>Bajada total (m)<input type="number" name="baja" value="2000" min="0"></label>
    <button class="ghost" type="submit">Calcular</button>
  </form>`;
}

function enlazarCalcManual(contenedor) {
  const f = contenedor.querySelector('#calc-manual');
  if (!f) return;
  f.onsubmit = e => {
    e.preventDefault();
    const r = planificarEnergia([{ nombre: 'Viaje completo', km: +f.km.value, subida_m: +f.sube.value, bajada_m: +f.baja.value, velocidad_kmh: +f.vel.value }], {}, ajustes.energia);
    contenedor.innerHTML = htmlEnergia(r) + `<p><button class="link" id="otra-calc">Calcular otro</button></p>`;
    contenedor.querySelector('#otra-calc').onclick = () => { contenedor.innerHTML = htmlEnergia(null); enlazarCalcManual(contenedor); };
  };
}

// ---------- Pantalla 3: resultado del agente ----------
function vistaResultado(modo, datos, guardado) {
  cancelar();
  const titulo = `${modo === 'carro' ? '🚗' : '✈️'} ${datos.origen} → ${datos.destino}`;
  $app.innerHTML = `
    <div class="resultado">
      <section>
        <div class="card plan">
          <div class="estado" id="estado" hidden></div>
          <div class="md" id="plan"></div>
          <form class="seguir" id="seguir" hidden>
            <input name="q" placeholder="Pregúntale algo más al agente…" autocomplete="off">
            <button class="primary" type="submit">Enviar</button>
          </form>
          <div class="sugerencias" id="sugerencias" hidden></div>
        </div>
        <div class="acciones">
          <button class="ghost" type="button" data-accion="inicio">＋ Nuevo viaje</button>
          <span>
            <button class="ghost" type="button" id="btn-copiar">📋 Copiar</button>
            <button class="ghost" type="button" onclick="print()">🖨️ Imprimir / PDF</button>
          </span>
        </div>
      </section>
      <aside class="lado">
        ${htmlMapa(modo, datos)}
        ${modo === 'carro' ? `<div class="card energia" id="energia">${htmlEnergia(guardado?.energia)}</div>` : ''}
        <div class="card fuentes" id="fuentes" hidden><h3>🔗 Fuentes consultadas</h3><ol></ol></div>
      </aside>
    </div>`;
  const $plan = document.getElementById('plan');
  const $estado = document.getElementById('estado');
  const $seguir = document.getElementById('seguir');
  const $sug = document.getElementById('sugerencias');
  const $energia = document.getElementById('energia');
  const $fuentes = document.getElementById('fuentes');
  if ($energia && !guardado?.energia) enlazarCalcManual($energia);

  const viaje = guardado || { id: Date.now(), titulo, modo, datos, texto: '', energia: null, fuentes: [], fecha: new Date().toISOString() };
  const fuentes = new Map(viaje.fuentes.map(f => [f.url, f.title]));
  const pintarFuentes = () => {
    if (!fuentes.size) return;
    $fuentes.hidden = false;
    $fuentes.querySelector('ol').innerHTML = [...fuentes].map(([u, t]) =>
      `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || new URL(u).hostname)}</a></li>`).join('');
  };
  pintarFuentes();

  document.getElementById('btn-copiar').onclick = async () => {
    try { await navigator.clipboard.writeText(viaje.texto); toast('Plan copiado ✅'); } catch { toast('No se pudo copiar'); }
  };

  const sugerencias = modo === 'carro'
    ? ['¿Y si salgo con 80%?', 'Dame una ruta alternativa', 'Restaurantes en ruta', 'Hoteles con cargador en el destino', 'Clima esos días']
    : ['Hazlo más económico', 'Planes para un día de lluvia', 'Restaurantes imperdibles', 'Excursiones de un día', '¿Qué empacar?'];
  $sug.innerHTML = sugerencias.map(s => `<button type="button">${esc(s)}</button>`).join('');
  $sug.querySelectorAll('button').forEach(b => b.onclick = () => preguntar(b.textContent));

  $plan.innerHTML = md(viaje.texto);

  const persistir = () => {
    viaje.fuentes = [...fuentes].map(([url, title]) => ({ url, title }));
    const lista = leer(LS.viajes, []).filter(v => v.id !== viaje.id);
    lista.unshift(viaje);
    guardar(LS.viajes, lista.slice(0, 15));
  };

  async function preguntar(texto) {
    if (!ajustes.apiKey) {
      $plan.innerHTML = md(viaje.texto) + `<p class="error">🔑 Falta la clave de API. Ábrela en <button class="link" data-accion="ajustes">Ajustes</button> y vuelve a intentar.</p>`;
      $seguir.hidden = true;
      if (!viaje.texto) {
        const btn = document.createElement('button');
        btn.className = 'primary'; btn.type = 'button'; btn.textContent = 'Reintentar';
        btn.onclick = () => ajustes.apiKey && preguntar(texto);
        $plan.appendChild(btn);
      }
      return;
    }
    if (!agente) {
      agente = new AgenteViajes({ apiKey: ajustes.apiKey, model: ajustes.model, effort: ajustes.effort, ajustesEnergia: ajustes.energia });
      agente.iniciar(modo);
      if (viaje.texto) {
        // Retomar un viaje guardado: se le da el plan anterior como contexto.
        agente.messages.push({ role: 'user', content: promptInicial(modo, datos) });
        agente.messages.push({ role: 'assistant', content: viaje.texto });
      }
    }
    const previo = viaje.texto;
    let nuevo = '';
    if (previo) {
      viaje.texto += `\n\n<hr class="turno">\n\n<p class="pregunta">🙋 ${esc(texto)}</p>\n\n`;
    }
    const base = viaje.texto;
    $seguir.hidden = true; $sug.hidden = true;
    $estado.hidden = false; $estado.textContent = '🧭 Arrancando el agente…';
    controlador = new AbortController();
    let pendiente = false;
    const repintar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => { pendiente = false; $plan.innerHTML = md(base + nuevo); });
    };
    try {
      await agente.enviar(previo ? texto : promptInicial(modo, datos), {
        onText: t => { nuevo += t; repintar(); },
        onEstado: s => { $estado.textContent = s; },
        onFuente: f => { if (!fuentes.has(f.url)) { fuentes.set(f.url, f.title); pintarFuentes(); } },
        onEnergia: r => { if ($energia) { $energia.innerHTML = htmlEnergia(r); viaje.energia = r; } },
      }, controlador.signal);
      viaje.texto = base + nuevo;
      persistir();
    } catch (err) {
      if (err?.name === 'AbortError' || controlador?.signal.aborted) return;
      viaje.texto = base + nuevo;
      $plan.innerHTML = md(viaje.texto) + `<p class="error">⚠️ ${esc(mensajeError(err))}</p>`;
      if (!previo && !nuevo) agente = null;
    } finally {
      $estado.hidden = true;
      $seguir.hidden = false; $sug.hidden = false;
      $plan.innerHTML = md(viaje.texto) + ($plan.querySelector('.error')?.outerHTML || '');
    }
  }

  $seguir.onsubmit = e => {
    e.preventDefault();
    const q = $seguir.q.value.trim();
    if (!q) return;
    $seguir.q.value = '';
    preguntar(q);
  };

  if (guardado) { $seguir.hidden = false; $sug.hidden = false; }
  else preguntar(promptInicial(modo, datos));
}

function mensajeError(err) {
  const status = err?.status;
  if (status === 401) return 'La clave de API no es válida. Revísala en Ajustes.';
  if (status === 403) return 'Tu clave no tiene permiso para este modelo o herramienta (búsqueda web). Revisa la consola de Anthropic.';
  if (status === 429) return 'Demasiadas solicitudes o sin saldo. Espera un momento y reintenta.';
  if (status >= 500) return 'El servicio está ocupado. Reintenta en un minuto.';
  if (!status && /fetch|network/i.test(String(err?.message))) return 'Sin conexión a internet.';
  return err?.error?.error?.message || err?.message || 'Error inesperado.';
}

function cancelar() {
  controlador?.abort();
  controlador = null;
  agente = null;
}

// ---------- Mis viajes ----------
function vistaHistorial() {
  cancelar();
  const lista = leer(LS.viajes, []);
  $app.innerHTML = `<section class="historial">
    <h1>🗂️ Mis viajes</h1>
    ${lista.length ? '' : '<p class="hint">Aún no has planificado viajes en este dispositivo.</p>'}
    ${lista.map(v => `<div class="card item">
      <div><b>${esc(v.titulo)}</b><br><small>${new Date(v.fecha).toLocaleString('es-CO')} · ${esc(v.datos?.dias)} días</small></div>
      <span><button class="ghost" data-abrir="${v.id}">Abrir</button> <button class="ghost" data-borrar="${v.id}" aria-label="Borrar">🗑️</button></span>
    </div>`).join('')}
    <div class="acciones"><button class="ghost" data-accion="inicio">← Volver</button></div>
  </section>`;
  $app.querySelectorAll('[data-abrir]').forEach(b => b.onclick = () => {
    const v = lista.find(x => String(x.id) === b.dataset.abrir);
    if (v) vistaResultado(v.modo, v.datos, v);
  });
  $app.querySelectorAll('[data-borrar]').forEach(b => b.onclick = () => {
    guardar(LS.viajes, lista.filter(x => String(x.id) !== b.dataset.borrar));
    vistaHistorial();
  });
}

// ---------- Ajustes ----------
const dlg = document.getElementById('dlg-ajustes');
const fAj = document.getElementById('form-ajustes');
const CAMPOS_ENERGIA = ['bateriaKwh', 'consumoBase', 'masaKg', 'reservaPct', 'cargaDcMaxPct', 'potenciaDcKw'];

function abrirAjustes() {
  fAj.apiKey.value = ajustes.apiKey;
  fAj.model.value = ajustes.model;
  fAj.effort.value = ajustes.effort;
  CAMPOS_ENERGIA.forEach(k => fAj[k].value = ajustes.energia[k]);
  dlg.showModal();
}
document.getElementById('btn-reset-energia').onclick = () => CAMPOS_ENERGIA.forEach(k => fAj[k].value = ICAR_DEFAULTS[k]);
dlg.addEventListener('close', () => {
  if (dlg.returnValue !== 'ok') return;
  const energia = { ...ajustes.energia };
  CAMPOS_ENERGIA.forEach(k => { const v = parseFloat(fAj[k].value); if (Number.isFinite(v) && v > 0) energia[k] = v; });
  ajustes = { apiKey: fAj.apiKey.value.trim(), model: fAj.model.value, effort: fAj.effort.value, energia };
  guardar(LS.ajustes, ajustes);
  agente = null;
  toast('Ajustes guardados ✅');
  document.querySelector('.aviso')?.remove();
});

function toast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'var(--text)', color: 'var(--bg)', padding: '10px 16px', borderRadius: '10px', zIndex: 20 });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

// ---------- Navegación ----------
document.addEventListener('click', e => {
  const a = e.target.closest('[data-accion]');
  if (!a) return;
  if (a.dataset.accion === 'inicio') vistaInicio();
  if (a.dataset.accion === 'ajustes') abrirAjustes();
});
document.getElementById('btn-inicio').onclick = vistaInicio;
document.getElementById('btn-ajustes').onclick = abrirAjustes;
document.getElementById('btn-historial').onclick = vistaHistorial;

vistaInicio();

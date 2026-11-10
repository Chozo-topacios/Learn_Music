// Agente de viajes: Claude con búsqueda web + herramienta local de energía de la iCAR 03T.
// Se llama directo desde el navegador con la clave del usuario (guardada solo en este dispositivo).
import Anthropic from 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.4.0/+esm';
import { planificarEnergia } from './energia.js';

const MAX_VUELTAS = 12;

const SYSTEM_BASE = `Eres "Ruta", un agente experto en planificación de viajes, con foco en Colombia y Latinoamérica.
Responde siempre en español, con tono cercano y práctico. Hoy es ${new Date().toLocaleDateString('es-CO', { dateStyle: 'full' })}.

Reglas:
- Usa la búsqueda web para datos que cambian: estado de las vías y cierres (INVÍAS, @InviasOficial, ANI, concesiones), tarifas de peajes vigentes para categoría I (automóvil), cargadores eléctricos (Electrolineras, Celsia, Enel X, Terpel Voltex, EPM, PlugShare), precios de hoteles y tiquetes. Cita la fuente con enlace.
- Si no encuentras un dato con certeza, dilo y da un rango estimado marcado como "estimado".
- Valores en pesos colombianos (COP) salvo que el destino use otra moneda; en ese caso muestra ambas.
- Da enlaces de Google Maps con el formato https://www.google.com/maps/search/?api=1&query=<lugar codificado> para cada sitio, cargador y hotel.
- Formato: Markdown con encabezados ##, listas y tablas cortas. Nada de relleno; ve al grano.`;

const SYSTEM_CARRO = `${SYSTEM_BASE}

Este viaje es EN CARRO con una Chery iCAR 03T: SUV 100% eléctrica (no usa gasolina), 4x4, batería LFP de ~69,8 kWh, ~421 km WLTP (real en carretera de montaña ~300–380 km), conector CCS2, carga DC hasta ~90 kW.

Pasos que debes seguir:
1. Busca la ruta recomendada en Google Maps (y 1 alternativa si existe): distancia, tiempo, vías principales, puntos de altura (pasos de cordillera) y desnivel aproximado.
2. Llama a la herramienta "calcular_energia" con la ruta partida en 3–8 tramos entre ciudades/puntos clave, con km, subida y bajada acumulada en metros y velocidad promedio realista. Usa su resultado para el plan de carga.
3. Busca peajes en la ruta con tarifa categoría I vigente y el total. Busca el estado actual de la vía (cierres, pasos restringidos, obras).
4. Busca cargadores rápidos DC reales sobre la ruta (nombre, ubicación, potencia, operador) y ubica las paradas de carga en los puntos que el cálculo indique.
5. Sitios turísticos que valgan la pena SOBRE la ruta o con desvío corto (indica el desvío en km/min), idealmente coincidiendo con las paradas de carga.
6. Hospedajes estratégicos: prioriza los que tengan cargador para carro eléctrico o permitan carga lenta; da rango de precio por noche.

Estructura de la respuesta:
## 🗺️ Ruta recomendada
## 🔋 Plan de energía iCAR 03T  (cuánto cargar antes de salir, dónde cargar, cuánto tiempo, con qué % llegas; responde explícitamente la duda "¿100% o gasolina?")
## 💰 Peajes y estado de la vía  (tabla peaje | tarifa cat. I; total ida y total ida+regreso)
## 📍 Sitios turísticos en ruta
## 🏨 Hospedajes estratégicos
## 💵 Presupuesto estimado  (energía en casa ~COP 900/kWh, carga rápida ~COP 1.800–2.300/kWh, peajes, hospedaje, comida)
## ✅ Checklist antes de salir`;

const SYSTEM_AVION = `${SYSTEM_BASE}

Este viaje es EN AVIÓN. Pasos:
1. Busca los sitios imperdibles del destino (mezcla de clásicos y joyas locales) según los intereses del viajero.
2. Recomienda las mejores zonas para hospedarse (seguridad, ubicación, ambiente) con 2–3 hoteles por zona y rango de precio.
3. Consejos de movilidad local: desde el aeropuerto al centro (opciones y precio), transporte público, apps, si conviene alquilar carro.
4. Busca precio aproximado de tiquetes desde el origen y arma un estimado de presupuesto total.
5. Arma un itinerario día por día optimizado por cercanía.

Estructura de la respuesta:
## ✈️ Resumen del viaje
## ⭐ Sitios imperdibles
## 🏨 Zonas clave para hospedaje
## 🚕 Movilidad local
## 🗓️ Itinerario día por día
## 💵 Presupuesto estimado  (tabla por rubro, por persona y total)
## 💡 Tips (clima de esas fechas, seguridad, documentos, propinas)`;

const TOOL_ENERGIA = {
  name: 'calcular_energia',
  description: 'Calcula el consumo de batería de la iCAR 03T por tramos considerando distancia, subidas, bajadas (regeneración) y velocidad. Devuelve % de batería al final de cada tramo, número de paradas de carga necesarias y recomendación de carga antes de salir. Llámala una vez que conozcas la ruta y su perfil de altura.',
  eager_input_streaming: true,
  input_schema: {
    type: 'object',
    properties: {
      tramos: {
        type: 'array',
        description: 'Tramos consecutivos de la ruta, en orden.',
        items: {
          type: 'object',
          properties: {
            nombre: { type: 'string', description: 'Ej: "Bogotá → Girardot"' },
            km: { type: 'number' },
            subida_m: { type: 'number', description: 'Metros de subida acumulada en el tramo' },
            bajada_m: { type: 'number', description: 'Metros de bajada acumulada en el tramo' },
            velocidad_kmh: { type: 'number', description: 'Velocidad promedio realista' },
          },
          required: ['nombre', 'km', 'subida_m', 'bajada_m', 'velocidad_kmh'],
          additionalProperties: false,
        },
      },
    },
    required: ['tramos'],
    additionalProperties: false,
  },
};

function tramosValidos(input) {
  return input && Array.isArray(input.tramos) && input.tramos.length > 0 &&
    input.tramos.every(t => t && typeof t.nombre === 'string' && Number.isFinite(Number(t.km)));
}

// Tras un cambio de modelo a mitad de respuesta (fallback), no se reenvían los bloques internos previos al corte.
function limpiarParaHistorial(content) {
  const corte = content.map(b => b.type).lastIndexOf('fallback');
  if (corte < 0) return content;
  const pares = new Set(content.filter(b => b.type?.endsWith('_tool_result')).map(b => b.tool_use_id));
  return content.filter((b, i) => {
    if (i >= corte) return true;
    if (['thinking', 'redacted_thinking', 'tool_use'].includes(b.type)) return false;
    if (b.type === 'server_tool_use') return pares.has(b.id);
    return true;
  });
}

export class AgenteViajes {
  constructor({ apiKey, model, effort, ajustesEnergia }) {
    this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    this.model = model;
    this.effort = effort;
    this.ajustesEnergia = ajustesEnergia;
    this.messages = [];
    this.system = SYSTEM_BASE;
    this.modo = null;
  }

  iniciar(modo) {
    this.modo = modo;
    this.system = modo === 'carro' ? SYSTEM_CARRO : SYSTEM_AVION;
    this.messages = [];
  }

  /**
   * Envía un mensaje y corre el ciclo del agente.
   * cb: { onText(delta), onEstado(texto), onEnergia(resultado), onFuente({url,title}) }
   */
  async enviar(texto, cb = {}, signal) {
    this.messages.push({ role: 'user', content: texto });
    const tools = [
      { type: 'web_search_20260209', name: 'web_search', max_uses: 12, user_location: { type: 'approximate', country: 'CO', timezone: 'America/Bogota' } },
      { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 6 },
    ];
    if (this.modo === 'carro') tools.push(TOOL_ENERGIA);

    for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
      const stream = this.client.beta.messages.stream({
        model: this.model,
        max_tokens: 32000,
        thinking: { type: 'adaptive' },
        output_config: { effort: this.effort },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: this.system,
        tools,
        messages: this.messages,
      }, { signal });

      stream.on('streamEvent', ev => {
        if (ev.type === 'content_block_start') {
          const b = ev.content_block;
          if (b.type === 'server_tool_use') cb.onEstado?.(b.name === 'web_search' ? '🔎 Buscando en la web…' : '📄 Leyendo una página…');
          if (b.type === 'tool_use') cb.onEstado?.('🔋 Calculando energía de la iCAR 03T…');
          if (b.type === 'thinking') cb.onEstado?.('🧠 Pensando el plan…');
          if (b.type === 'text') cb.onEstado?.('✍️ Escribiendo…');
          if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
            b.content.forEach(r => r.url && cb.onFuente?.({ url: r.url, title: r.title }));
          }
        }
        if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') cb.onText?.(ev.delta.text);
        if (ev.type === 'content_block_delta' && ev.delta.type === 'citations_delta') {
          const c = ev.delta.citation;
          if (c?.url) cb.onFuente?.({ url: c.url, title: c.title });
        }
      });

      const msg = await stream.finalMessage();
      this.messages.push({ role: 'assistant', content: limpiarParaHistorial(msg.content) });

      if (msg.stop_reason === 'pause_turn') continue; // el servidor retoma la búsqueda solo
      if (msg.stop_reason === 'refusal') {
        cb.onText?.('\n\n> ⚠️ El modelo no pudo completar esta solicitud. Intenta reformularla.\n');
        return msg;
      }
      if (msg.stop_reason === 'max_tokens') {
        cb.onText?.('\n\n> ⚠️ La respuesta se cortó por longitud. Escribe "continúa" para seguir.\n');
        return msg;
      }
      if (msg.stop_reason !== 'tool_use') return msg;

      const resultados = msg.content.filter(b => b.type === 'tool_use').map(b => {
        if (b.name !== 'calcular_energia') {
          return { type: 'tool_result', tool_use_id: b.id, is_error: true, content: `Herramienta desconocida: ${b.name}` };
        }
        if (!tramosValidos(b.input)) {
          return { type: 'tool_result', tool_use_id: b.id, is_error: true, content: 'Entrada inválida: envía "tramos" con nombre, km, subida_m, bajada_m y velocidad_kmh.' };
        }
        const r = planificarEnergia(b.input.tramos, {}, this.ajustesEnergia);
        cb.onEnergia?.(r, b.input.tramos);
        return { type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(redondear(r)) };
      });
      this.messages.push({ role: 'user', content: resultados });
      cb.onText?.('\n\n');
    }
    cb.onText?.('\n\n> ⚠️ El agente dio demasiadas vueltas. Intenta una pregunta más concreta.\n');
  }
}

function redondear(obj) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : v)));
}

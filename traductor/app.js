'use strict';
/* =========================================================
   La Brecha Invisible — las herramientas del libro
   de Leonardo Pineda Lombana
   convertidas en formularios guiados. Todo corre en el
   navegador y se guarda solo en este dispositivo.
   ========================================================= */

const BOOK = { title: 'La Brecha Invisible', author: 'Leonardo Pineda Lombana' };

// ---------------- Utilidades ----------------
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) { if (k == null || k === false || k === '') continue; el.append(k.nodeType ? k : String(k)); }
  return el;
}
function toast(msg, ms = 2400) {
  const t = h('div', { class: 'toast', role: 'status' }, msg);
  document.getElementById('toasts').append(t);
  setTimeout(() => t.remove(), ms);
}
const txt = v => String(v ?? '').trim();
const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const fmtNum = n => new Intl.NumberFormat('es', { maximumFractionDigits: 1 }).format(n);
const fmtPct = n => new Intl.NumberFormat('es', { maximumFractionDigits: n < 1 ? 2 : 1 }).format(n) + '%';
function money(n, cur) {
  try { return new Intl.NumberFormat('es', { style: 'currency', currency: cur || 'USD', maximumFractionDigits: 0 }).format(n); }
  catch (e) { return fmtNum(n) + ' ' + (cur || ''); }
}
const fmtDate = ts => new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
const words = s => (txt(s).match(/[\p{L}\d$%][\p{L}\d$%.,'’-]*/gu) || []).length;
const sentences = s => txt(s).split(/(?<=[.!?…])\s+(?=[¿¡"“«\p{Lu}])/u).filter(x => x.trim()).length;
const ensureEnd = s => { s = txt(s); return !s || /[.!?…"”»]$/.test(s) ? s : s + '.'; };

// ---------------- Detector de jerga ----------------
// [término mostrado, patrón, traducción sugerida, sensible a mayúsculas]
const JARGON = [
  ['CVE', 'CVEs?', 'una debilidad conocida', true],
  ['CVSS', 'CVSS', 'el nivel de gravedad', true],
  ['XDR / EDR', '[XE]DR', 'un sistema que detecta y frena ataques en los equipos', true],
  ['SIEM', 'SIEM', 'el sistema que vigila todas las alertas', true],
  ['SOC', 'SOC', 'el equipo que vigila la seguridad día y noche', true],
  ['SOAR', 'SOAR', 'respuesta automática a ataques', true],
  ['ZTNA', 'ZTNA', 'acceso remoto seguro', true],
  ['SASE', 'SASE', 'protección para trabajar desde cualquier lugar', true],
  ['Zero Trust', 'zero[ -]?trust', 'verificar siempre antes de dar acceso', false],
  ['MFA / 2FA', 'MFA|2FA', 'doble verificación de identidad', true],
  ['SSO', 'SSO', 'un solo inicio de sesión', true],
  ['IAM / PAM', 'IAM|PAM', 'el control de quién accede a qué', true],
  ['DLP', 'DLP', 'protección contra fuga de información', true],
  ['DDoS', 'DD?oS', 'un ataque que satura y tumba el servicio', false],
  ['APT', 'APTs?', 'un atacante organizado y persistente', true],
  ['WAF', 'WAF', 'una barrera de protección para el sitio web', true],
  ['VPN', 'VPN', 'una conexión remota segura', true],
  ['OWASP', 'OWASP', 'los riesgos más comunes en aplicaciones web', true],
  ['IOC', 'IOCs?', 'señales de que hubo un ataque', true],
  ['CSPM', 'CSPM', 'revisión de la configuración en la nube', true],
  ['ransomware', 'ransomware', 'el secuestro de datos que detiene la operación', false],
  ['malware', 'malware', 'un programa malicioso', false],
  ['phishing', 'phishing', 'un engaño por correo o mensaje', false],
  ['zero-day', 'zero[ -]?days?|día cero', 'una falla que aún no tiene solución', false],
  ['exploit', 'exploits?', 'una forma de aprovechar la falla', false],
  ['endpoint', 'endpoints?', 'los computadores y equipos de la empresa', false],
  ['firewall', 'firewalls?|cortafuegos', 'la barrera de la red', false],
  ['parche', 'parche(s|ar|ado|ados|adas)?', 'la corrección', false],
  ['vulnerabilidad', 'vulnerabilidad(es)?', 'una debilidad que podría detener la operación', false],
  ['superficie de ataque', 'superficie de (ataque|exposici[oó]n)', 'los puntos que debemos proteger', false],
  ['vector de ataque', 'vectores? de ataque', 'una forma de entrar', false],
  ['movimiento lateral', 'movimiento lateral', 'que el atacante salte de un equipo a otro', false],
  ['microsegmentación', 'microsegmentaci[oó]n', 'barreras internas que aíslan los equipos', false],
  ['falsos positivos', 'falsos? positivos?', 'alarmas falsas', false],
  ['riesgo residual', 'riesgo residual', 'el riesgo que queda', false],
  ['heurístico', 'heur[ií]stic[oa]s?', 'que detecta comportamientos extraños', false],
  ['hash', 'hash(es)?', 'la huella digital de un archivo', false],
  ['post-cuántico', 'post-?cu[aá]ntic[oa]s?', 'cifrado preparado para el futuro', false],
  ['Shadow IT', 'shadow it', 'herramientas que se usan sin aprobación', false],
  ['Living-off-the-Land', 'living[ -]off[ -]the[ -]land', 'ataques que usan herramientas legítimas', false],
  ['backdoor', 'backdoors?', 'una puerta trasera para el atacante', false],
  ['botnet', 'botnets?', 'una red de equipos controlados por atacantes', false],
  ['sandbox', 'sandbox', 'un espacio aislado para probar', false],
  ['hardening', 'hardening', 'reforzar la configuración', false],
  ['pentest', 'pentest(ing)?', 'una prueba de ataque controlada', false],
];
const JRX = JARGON.map(([t, p, s, cs]) => ({ t, s, rx: new RegExp(`(?<![\\p{L}\\d])(?:${p})(?![\\p{L}\\d])`, cs ? 'u' : 'iu') }));
function findJargon(text) {
  const s = txt(text);
  return s ? JRX.filter(j => j.rx.test(s)) : [];
}
const BIZ = /(operaci|ingres|client|venta|vend|factur|cost|dinero|\$|usd|hora|d[ií]a|semana|mes|crec|continuidad|reputaci|confianza|lanz|negocio|margen|flujo de caja|%|mill[oó]n|p[eé]rdida|perder|disponib|contrat|mercado|product|plazo|tiempo|meta|equipo)/iu;
const BIZ_METRIC = /(disponibilidad|ingresos?|factur|clientes?|ventas?|horas?|d[ií]as?|%|\$|usd|tiempo|continuidad|p[eé]rdida|satisfacci|experiencia|contrat|resilien)/iu;
const TECH_METRIC = /(falsos? positivos?|alertas?|hash|bloque(o|os|ados?)|vulnerabilidades?|parches?|eventos|tickets?|agentes|reglas|firmas|escaneos?|logs?)/iu;

// ---------------- Estado ----------------
const KEY = 'traductor-negocio-v1';
let store = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.drafts && s.saved) return s; } catch (e) { /* vacío */ }
  return { drafts: {}, saved: [] };
}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* sin almacenamiento */ } }

// ---------------- Las herramientas del libro ----------------
const PARTS = {
  1: ['Parte I', 'Entender el problema'],
  2: ['Parte II', 'Cambiar la forma de pensar'],
  3: ['Parte III', 'Llevarlo a la práctica'],
};

const AUDIENCES = {
  ceo: {
    name: 'CEO', icon: '🧭', title: 'El futuro y la estrategia',
    cares: 'Crecimiento, reputación, cumplimiento de metas anuales y continuidad estratégica.',
    lang: 'Visión a largo plazo y certidumbre operativa.',
    avoid: 'Acrónimos técnicos (ransomware, XDR, CVE, zero-day) y explicaciones sobre la complejidad del software.',
    steps: ['El contexto de expansión', 'El riesgo para el futuro', 'La habilitación estratégica'],
    ph: ['Estamos abriendo nuevos canales digitales para llegar a más clientes…', '…pero si no aseguramos la infraestructura de soporte, un fallo operativo comprometerá nuestra reputación ante el mercado…', '…por lo que esta inversión garantiza que alcancemos la meta de crecimiento sin sorpresas en los titulares de prensa.'],
    bad: [],
  },
  cfo: {
    name: 'CFO', icon: '💵', title: 'El flujo de caja y la continuidad financiera',
    cares: 'Presupuesto, retorno de inversión (ROI), mitigación de pérdidas financieras y optimización de costos.',
    lang: 'Continuidad financiera y protección del margen.',
    avoid: 'Hablar de “seguridad defensiva abstracta” o justificar presupuestos basados únicamente en el miedo a una multa.',
    steps: ['El impacto en el negocio', 'La cuantificación del daño', 'El costo del seguro'],
    ph: ['Si este sistema crítico sufre una interrupción no planeada…', '…dejaremos de facturar un estimado de 25.000 USD por cada hora de inactividad operativa…', '…y este proyecto representa una fracción menor de ese costo para asegurar que el flujo de caja trimestral no sufra alteraciones.'],
    bad: [[/multa|sanci[oó]n/iu, 'Evita justificar la inversión solo con el miedo a una multa: habla de ingresos protegidos.'], [/seguridad defensiva|amenazas? (avanzadas?|globales?)/iu, 'Evita la “seguridad defensiva abstracta”: pon un número.']],
    needMoney: true,
  },
  comite: {
    name: 'Comité ejecutivo', icon: '🤝', title: 'La alineación operativa',
    cares: 'Que Legal, Operaciones, Comercial y Tecnología no colisionen entre sí por culpa de controles absurdos.',
    lang: 'Consenso, eficiencia y flujos de trabajo sin cuellos de botella.',
    avoid: 'Imponer prohibiciones unilaterales sin ofrecer alternativas operativas.',
    steps: ['El reconocimiento del dolor', 'El rediseño conjunto', 'El beneficio mutuo'],
    ph: ['Sabemos que los controles actuales han generado fricción en los lanzamientos del área comercial…', '…por lo que hemos reestructurado los procesos de validación para automatizar la seguridad…', '…permitiendo que los proyectos salgan a producción a tiempo y con un monitoreo que nos cuida a todos.'],
    bad: [[/prohib|queda(n)? (bloquead|vetad)|no se permit|sancion/iu, 'Suena a prohibición unilateral: ofrece una alternativa operativa.']],
  },
  tecnico: {
    name: 'Equipo técnico', icon: '🛠️', title: 'La realidad del terreno',
    cares: 'Arquitectura limpia, herramientas funcionales, reducir la fatiga de alertas y entender el porqué detrás de las directrices.',
    lang: 'Propósito operativo, contexto y claridad de prioridades.',
    avoid: 'Exigir cumplimiento a ciegas sin explicar qué dolor del negocio estamos resolviendo.',
    steps: ['El contexto real', 'El impacto humano y de negocio', 'El foco de acción'],
    ph: ['No estamos implementando este control porque lo exija un estándar lejano…', '…sino porque protege directamente la operación de la planta y la tranquilidad de los equipos que están en el frente…', '…así que concentremos nuestros esfuerzos en blindar esta única ruta crítica en lugar de perder tiempo persiguiendo falsos positivos.'],
    bad: [[/porque (lo )?(exige|pide|dice) (la )?(norma|auditor|est[aá]ndar|pol[ií]tica)(?! lejan)|hay que cumplir|es obligatorio/iu, 'Exiges cumplimiento sin explicar el dolor del negocio que resuelve.']],
    allowJargon: true,
  },
  incidente: {
    name: 'Incidente crítico', icon: '🚨', title: 'Gestión de crisis',
    cares: 'Control inmediato, transparencia radical, protección de la marca y velocidad de respuesta.',
    lang: 'Hechos verificables, impacto contenido y plan de acción paso a paso.',
    avoid: 'Minimizar el problema, usar jerga para ocultar la falta de control o especular sin datos confirmados.',
    steps: ['El diagnóstico transparente', 'La contención en curso', 'El siguiente paso operativo'],
    ph: ['Hemos detectado una anomalía que afecta temporalmente a este segmento específico de la operación…', '…nuestro equipo de respuesta ya aisló el perímetro afectado para evitar que se propague al resto del ecosistema…', '…y estimamos restablecer los servicios principales bajo monitoreo reforzado en las próximas horas, informando avances periódicos.'],
    bad: [[/no es (nada )?grave|nada (de )?grave|sin importancia|menor importancia|no pasa nada|todo est[aá] bien/iu, 'Parece que minimizas el problema: di los hechos con transparencia.'], [/creemos que|posiblemente|quiz[aá]s|tal vez|al parecer|probablemente fue|seguramente/iu, 'Evita especular: comunica solo lo confirmado.']],
  },
};

const TOOLS = [
  // ---------- 1. Traductor Bidireccional ----------
  {
    id: 'traductor', ch: 1, part: 1, icon: '🔁',
    name: 'El Traductor Bidireccional',
    chapter: 'Dos idiomas, un mismo objetivo',
    short: 'Convierte una frase técnica en lenguaje de negocio, y al revés.',
    quote: 'La brecha que acabas de ver no se cierra con más tecnología. Se cierra con una habilidad que cualquiera puede aprender: la de traducir.',
    learn: `<p>Antes de llevar un problema técnico a una junta, hay que traducirlo al lenguaje del negocio. No se trata de esconder la complejidad ni de hacer que un riesgo parezca más pequeño: se trata de explicar <strong>por qué importa, qué puede pasar y qué necesitamos hacer</strong>.</p>
      <p>Y funciona en las dos direcciones. Cuando el CEO dice <em>“necesitamos sacar este producto en dos semanas”</em>, el CISO puede escuchar <em>“quieren saltarse controles importantes”</em>.</p>`,
    titleKey: 'dice',
    defaults: { dir: 'tec' },
    examples: [
      { label: '450 vulnerabilidades', data: { dir: 'tec', dice: 'Tenemos 450 vulnerabilidades críticas sin parchear.', escucha: 'Otra lista de problemas que va a costar dinero.', debe: 'Hay tres puntos críticos que podrían detener la operación. Necesitamos 48 horas para corregirlos.' } },
      { label: 'MFA y controles', data: { dir: 'tec', dice: 'Necesitamos MFA y controles adicionales para los accesos.', escucha: 'Van a poner más pasos para trabajar.', debe: 'Vamos a reducir el riesgo de que alguien use una identidad robada sin hacer más difícil el trabajo de quienes sí deben acceder.' } },
      { label: 'Plataforma de detección', data: { dir: 'tec', dice: 'Necesitamos una nueva plataforma para detectar y responder a amenazas.', escucha: 'Otro software costoso.', debe: 'Necesitamos detectar un ataque antes de que llegue a afectar la operación y los ingresos.' } },
      { label: 'Exposición en la nube', data: { dir: 'tec', dice: 'Nuestra exposición aumentó porque tenemos más servicios en la nube.', escucha: 'No entiendo qué significa eso.', debe: 'Al crecer nuestros canales digitales, también aumentaron los puntos que debemos proteger.' } },
      { label: 'Lanzar en dos semanas', data: { dir: 'neg', dice: 'Necesitamos sacar este producto en dos semanas.', escucha: 'Quieren saltarse controles importantes.', debe: 'Hay una oportunidad de mercado con fecha fija. Revisemos juntos qué controles mínimos necesitamos para lanzar a tiempo y cuáles podemos completar después del lanzamiento.' } },
    ],
    sections: d => [
      { title: '¿En qué dirección traduces?', fields: [
        { k: 'dir', type: 'choice', rerender: true, options: [['tec', 'Del equipo técnico al negocio', 'Riesgo y complejidad → valor y continuidad'], ['neg', 'Del negocio al equipo técnico', 'Urgencia comercial → contexto y prioridades']] },
      ] },
      { title: d.dir === 'neg' ? 'La frase tal como la dijo el negocio' : 'La frase tal como la dijo el equipo técnico', fields: [
        { k: 'dice', type: 'area', label: d.dir === 'neg' ? 'Lo que dice el negocio' : 'Lo que dice el equipo técnico', ph: d.dir === 'neg' ? 'Ej.: Necesitamos sacar este producto en dos semanas.' : 'Ej.: Tenemos 450 vulnerabilidades críticas sin parchear.', jargon: d.dir !== 'neg' },
        { k: 'escucha', type: 'area', label: d.dir === 'neg' ? 'Lo que probablemente escucha el equipo técnico' : 'Lo que probablemente escucha el negocio', help: d.dir === 'neg' ? 'Ponte en los zapatos de seguridad: ¿qué miedo despierta esa frase?' : 'Ponte en los zapatos del CEO o del CFO: ¿rechazo, gasto, confusión?', ph: d.dir === 'neg' ? 'Ej.: Quieren saltarse controles importantes.' : 'Ej.: Otra lista de problemas que va a costar dinero.' },
      ] },
      { title: 'La traducción', fields: [
        { k: 'debe', type: 'area', rows: 4, label: 'Lo que debe decir el Traductor Bidireccional', help: d.dir === 'neg' ? 'Explica el objetivo de negocio y abre la puerta a colaborar, sin que suene a “saltarse controles”.' : 'Habla de operación, ingresos, clientes o tiempo. Sin siglas.', ph: d.dir === 'neg' ? 'Ej.: Hay una oportunidad con fecha fija; definamos juntos los controles mínimos para lanzar a tiempo.' : 'Ej.: Hay tres puntos críticos que podrían detener la operación. Necesitamos 48 horas para corregirlos.', jargon: true },
      ] },
    ],
    result(d) {
      const neg = d.dir === 'neg';
      const issues = [];
      if (!txt(d.debe)) return { verdict: ['info', 'Escribe la traducción para ver el resultado.'] , blocks: [] };
      const j = findJargon(d.debe);
      if (j.length) issues.push(`La traducción todavía tiene jerga técnica: ${j.map(x => x.t).join(', ')}.`);
      if (!neg && !BIZ.test(d.debe)) issues.push('Conecta la frase con algo que el negocio mide: operación, ingresos, clientes o tiempo.');
      if (words(d.debe) > 60) issues.push(`Son ${words(d.debe)} palabras: intenta decirlo en menos de 60.`);
      return {
        verdict: issues.length ? ['warn', 'Casi lista', issues] : ['ok', 'Traducción lista', ['Sin jerga y conectada con lo que importa a la otra parte.']],
        layout: 'cols',
        title: neg ? 'Traducción: del negocio a tecnología' : 'Traducción: de tecnología al negocio',
        blocks: [
          [neg ? 'Lo que dice el negocio' : 'Lo que dice el equipo técnico', d.dice, 'muted'],
          [neg ? 'Lo que escucha tecnología' : 'Lo que escucha el negocio', d.escucha, 'bad'],
          ['Lo que debe decir el Traductor', d.debe, 'good'],
        ],
      };
    },
  },

  // ---------- 2. Los 3 filtros antes de bloquear ----------
  {
    id: 'filtros', ch: 2, part: 1, icon: '🚦',
    name: 'Los 3 filtros antes de bloquear',
    chapter: 'Cuando proteger genera más riesgo',
    short: 'Antes de prohibir una herramienta o cerrar un acceso, pásalo por tres preguntas.',
    quote: 'Antes de cerrar una puerta, pregúntate qué ventana vas a abrir sin darte cuenta.',
    learn: `<p>Un control técnicamente correcto puede ser estratégicamente desastroso. Si la puerta principal está bloqueada, <strong>la gente salta la ventana</strong>: el Shadow IT no es una enfermedad, es un síntoma del exceso de control.</p>
      <table class="mini"><thead><tr><th></th><th>Seguridad dogmática<br><small>El búnker</small></th><th>Seguridad estratégica<br><small>El facilitador</small></th></tr></thead><tbody>
      <tr><th>Objetivo</th><td>Bloquear todo lo desconocido para evitar culpas.</td><td>Permitir que el negocio opere de forma segura y veloz.</td></tr>
      <tr><th>Ante el riesgo</th><td>Prohibición absoluta y restricciones generalizadas.</td><td>Análisis de contexto, habilitación controlada y aceptación de riesgo informada.</td></tr>
      <tr><th>Percepción</th><td>Obstáculo burocrático y paranoico.</td><td>Aliado estratégico que cuida la continuidad.</td></tr>
      <tr><th>Resultado</th><td>Más Shadow IT y pérdida de agilidad.</td><td>Menos riesgo invisible y alta adopción de controles.</td></tr></tbody></table>`,
    titleKey: 'medida',
    defaults: {},
    examples: [
      { label: 'Bloquear compartir archivos', data: { medida: 'Bloquear las plataformas externas para compartir archivos con proveedores.', minutos: 15, veces: 3, personas: 120, beneficio: 'medio', alternativa: 'no', alternativaCual: '', proposito: 'auditoria', valorQue: 'La auditoría anual pidió cerrar canales no aprobados.' } },
      { label: 'Prohibir IA pública', data: { medida: 'Prohibir el uso de herramientas públicas de inteligencia artificial.', minutos: 20, veces: 4, personas: 60, beneficio: 'alto', alternativa: 'parcial', alternativaCual: 'Una versión corporativa de IA que estará lista el viernes.', proposito: 'valor', valorQue: 'Evitar que secretos industriales y datos de clientes salgan a servidores externos.' } },
    ],
    sections: () => [
      { title: 'La medida que quieres aplicar', fields: [
        { k: 'medida', type: 'area', label: '¿Qué quieres bloquear, prohibir o restringir?', ph: 'Ej.: Bloquear las memorias USB en toda la compañía.' },
      ] },
      { title: 'Filtro 1 · Impacto operativo', sub: '¿Esto detiene o acelera?', help: 'Si implementamos este bloqueo, ¿cuánto tiempo extra le tomará al empleado promedio realizar su tarea esencial?', fields: [
        { k: 'minutos', type: 'num', label: 'Minutos extra por tarea', ph: '10', half: true },
        { k: 'veces', type: 'num', label: 'Veces al día que se hace', ph: '4', half: true },
        { k: 'personas', type: 'num', label: 'Personas afectadas', ph: '50', half: true },
        { k: 'beneficio', type: 'choice', label: 'Beneficio de seguridad que aporta', options: [['alto', 'Alto'], ['medio', 'Medio'], ['bajo', 'Bajo']] },
      ] },
      { title: 'Filtro 2 · Fuga conductual', sub: '¿Obligará a usar Shadow IT?', help: 'Si lo prohibimos, ¿existe una alternativa corporativa igual de rápida y eficiente que la reemplace de inmediato?', fields: [
        { k: 'alternativa', type: 'choice', options: [['si', 'Sí, ya está lista', 'Igual de rápida y disponible hoy'], ['parcial', 'Existe, pero no es igual', 'Más lenta o aún no está lista'], ['no', 'No hay alternativa', 'La gente se quedará sin forma de trabajar']] },
        { k: 'alternativaCual', type: 'text', label: '¿Cuál es la alternativa?', ph: 'Ej.: Carpeta corporativa compartida con proveedores' },
      ] },
      { title: 'Filtro 3 · Propósito de negocio', sub: '¿Protege el valor o protege al departamento?', help: '¿Este control blinda el flujo de ingresos y la continuidad del negocio, o es solo para cumplir un checklist o trasladar la responsabilidad?', fields: [
        { k: 'proposito', type: 'choice', options: [['valor', 'Proteger ingresos y continuidad'], ['auditoria', 'Cumplir un checklist o una auditoría'], ['culpa', 'Trasladar la responsabilidad fuera del área']] },
        { k: 'valorQue', type: 'area', label: '¿Qué ingreso, proceso o activo protege exactamente?', ph: 'Ej.: Los datos de tarjetas de nuestros clientes en el canal de pagos.' },
      ] },
    ],
    result(d) {
      const hasF1 = num(d.minutos) > 0 && num(d.personas) > 0 && d.beneficio;
      const horasMes = num(d.minutos) * Math.max(num(d.veces), 1) * num(d.personas) * 21 / 60;
      const friccion = horasMes >= 100 ? 'alta' : horasMes >= 20 ? 'media' : 'baja';
      let f1 = null;
      if (hasF1) f1 = !((friccion === 'alta' && d.beneficio !== 'alto') || (friccion === 'media' && d.beneficio === 'bajo'));
      const f2 = d.alternativa ? (d.alternativa === 'si' ? true : d.alternativa === 'parcial' ? 'warn' : false) : null;
      const f3 = d.proposito ? d.proposito === 'valor' : null;
      const mark = v => v === null ? '⏳ Pendiente' : v === true ? '✅ Pasa' : v === 'warn' ? '⚠️ Con reservas' : '❌ No pasa';
      const b1 = !hasF1 ? 'Completa los minutos, las personas y el beneficio.' :
        `Esta medida le cuesta a la organización unas ${fmtNum(horasMes)} horas de trabajo al mes (fricción ${friccion}) a cambio de un beneficio de seguridad ${d.beneficio}. ` +
        (f1 ? 'La fricción es proporcional al beneficio.' : 'La fricción supera el beneficio: rechaza o rediseña la medida. La seguridad nunca debe ser un impuesto a la productividad.');
      const b2 = f2 === null ? 'Indica si existe una alternativa corporativa.' : f2 === true ? `Hay alternativa lista${txt(d.alternativaCual) ? ': ' + txt(d.alternativaCual) : ''}. El bloqueo no empujará a la gente a esconderse.` :
        f2 === 'warn' ? `La alternativa${txt(d.alternativaCual) ? ' (' + txt(d.alternativaCual) + ')' : ''} todavía no es igual de rápida. Habilítala por completo antes de bloquear, o el uso seguirá a escondidas.` :
        'Sin alternativa, prohibir no eliminará el uso: solo empujará a la gente a hacerlo a escondidas y perderás visibilidad del riesgo real.';
      const b3 = f3 === null ? 'Indica el propósito real del control.' : f3 ? `Protege valor del negocio${txt(d.valorQue) ? ': ' + txt(d.valorQue) : '.'}` :
        'Si el único propósito es curarse en salud ante una auditoría a costa de paralizar la operación, la medida carece de validez estratégica.';
      const all = [f1, f2, f3];
      let verdict;
      if (all.includes(null)) verdict = ['info', 'Responde los tres filtros para ver el veredicto.'];
      else if (all.every(v => v === true)) verdict = ['ok', 'Pasa los 3 filtros', ['Puedes aplicarla. Comunica el porqué y la alternativa antes del bloqueo.']];
      else if (all.includes(false)) verdict = ['bad', 'Rediseña antes de bloquear', ['Un control técnicamente correcto puede ser estratégicamente desastroso.']];
      else verdict = ['warn', 'Aplica solo con condiciones', ['Primero completa la alternativa corporativa.']];
      return {
        verdict, title: 'Los 3 filtros antes de bloquear',
        lead: txt(d.medida) ? 'Medida evaluada: ' + ensureEnd(d.medida) : '',
        blocks: [
          [`Impacto operativo — ${mark(f1)}`, b1],
          [`Fuga conductual — ${mark(f2)}`, b2],
          [`Propósito de negocio — ${mark(f3)}`, b3],
        ],
      };
    },
  },

  // ---------- 3. Plantilla Financiera de una Página ----------
  {
    id: 'financiera', ch: 3, part: 1, icon: '📄',
    name: 'La Plantilla Financiera de una Página',
    chapter: 'Hablarle al CFO',
    short: 'Convierte un hallazgo técnico en una cifra que el CFO pueda comparar.',
    quote: 'El CFO no te está negando el presupuesto porque no le importe la seguridad. Te lo está negando porque no le has dado la única unidad de medida en la que él puede tomar decisiones: el dinero.',
    learn: `<p>Olvídate de los informes de 40 páginas llenos de gráficos de radar y tablas de CVSS. Esta plantilla alinea la ciberseguridad con la lógica del CFO en <strong>cuatro cuadrantes</strong>:</p>
      <ol><li><strong>El riesgo operativo traducido a dinero.</strong> No “tenemos una brecha crítica en el servidor principal”, sino “8 horas de inactividad = 150.000 USD en transacciones bloqueadas”.</li>
      <li><strong>La inversión solicitada (CAPEX / OPEX):</strong> licencias, implementación y soporte.</li>
      <li><strong>El costo de la inacción:</strong> cuánto costaría el desastre frente a lo que cuesta prevenirlo.</li>
      <li><strong>El impacto en el flujo de caja y la continuidad</strong> en los momentos de mayor facturación.</li></ol>
      <p class="note">Las cifras son tus estimaciones: la app solo hace las cuentas y redacta la página.</p>`,
    titleKey: 'sistema',
    defaults: { moneda: 'USD', anios: 3 },
    examples: [
      { label: 'Pasarela de pagos', data: { sistema: 'la pasarela de pagos', moneda: 'USD', horas: 8, perdidaHora: 18750, reputacion: 60000, prob: 15, riesgoTxt: 'Un atacante podría detener los cobros durante el cierre de mes.', capex: 45000, opex: 12000, anios: 3, ingresos: 9000000, picos: 'El cierre de mes y la temporada de fin de año, cuando se concentra el 35% de la facturación.' } },
    ],
    sections: d => [
      { title: 'El sistema', fields: [
        { k: 'sistema', type: 'text', label: '¿Qué sistema o proceso protege la inversión?', ph: 'Ej.: el portal de pagos', half: true },
        { k: 'moneda', type: 'select', label: 'Moneda', options: [['USD', 'Dólar (USD)'], ['COP', 'Peso colombiano (COP)'], ['MXN', 'Peso mexicano (MXN)'], ['CLP', 'Peso chileno (CLP)'], ['PEN', 'Sol (PEN)'], ['ARS', 'Peso argentino (ARS)'], ['EUR', 'Euro (EUR)']], half: true },
      ] },
      { title: '1 · El riesgo operativo traducido a dinero', fields: [
        { k: 'horas', type: 'num', label: 'Horas de inactividad si ocurre', ph: '8', half: true },
        { k: 'perdidaHora', type: 'num', label: `Pérdida por hora (${d.moneda || 'USD'})`, ph: '18750', half: true },
        { k: 'reputacion', type: 'num', label: `Daño reputacional, multas u otros (${d.moneda || 'USD'})`, ph: '0', half: true },
        { k: 'prob', type: 'num', label: 'Probabilidad en un año (%) · opcional', ph: '15', half: true },
        { k: 'riesgoTxt', type: 'area', label: 'El riesgo en una frase de negocio', ph: 'Ej.: Un atacante podría detener los cobros durante el cierre de mes.', jargon: true },
      ] },
      { title: '2 · La inversión solicitada', fields: [
        { k: 'capex', type: 'num', label: 'CAPEX: licencias e implementación', ph: '45000', half: true },
        { k: 'opex', type: 'num', label: 'OPEX: soporte y operación por año', ph: '12000', half: true },
        { k: 'anios', type: 'num', label: 'Años para el costo total (TCO)', ph: '3', half: true },
      ] },
      { title: '4 · El impacto en el flujo de caja y la continuidad', help: 'El cuadrante 3, el costo de la inacción, se calcula solo.', fields: [
        { k: 'ingresos', type: 'num', label: `Facturación anual que protege (${d.moneda || 'USD'}) · opcional`, ph: '9000000', half: true },
        { k: 'picos', type: 'area', label: '¿Qué momentos de mayor facturación protege?', ph: 'Ej.: El cierre de mes y la temporada de fin de año.', jargon: true },
      ] },
    ],
    result(d) {
      const cur = d.moneda || 'USD';
      const m = n => money(n, cur);
      const perdida = num(d.horas) * num(d.perdidaHora);
      const impacto = perdida + num(d.reputacion);
      const anios = Math.max(num(d.anios), 1);
      const tco = num(d.capex) + num(d.opex) * anios;
      const anual = num(d.capex) / anios + num(d.opex);
      const esperado = num(d.prob) > 0 ? impacto * num(d.prob) / 100 : 0;
      const sis = txt(d.sistema) || 'este sistema';
      if (!impacto || !tco) return { verdict: ['info', 'Completa las horas, la pérdida por hora y la inversión para armar la página.'], blocks: [] };
      const ratio = tco / impacto * 100;
      const issues = [];
      const j = findJargon(d.riesgoTxt + ' ' + d.picos);
      if (j.length) issues.push(`Quita la jerga de los textos: ${j.map(x => x.t).join(', ')}.`);
      let verdict;
      if (tco < impacto) verdict = [issues.length ? 'warn' : 'ok', `La inversión equivale al ${fmtPct(ratio)} de un solo incidente`, issues.length ? issues : ['Es un seguro de bajo costo frente a una catástrofe financiera.']];
      else verdict = ['warn', 'La inversión supera el costo de un incidente', ['Revisa el alcance, suma otros impactos (clientes perdidos, multas, horas del equipo) o explica la probabilidad de que se repita.', ...issues]];
      const q1 = `Si ${sis} se ve comprometido, el tiempo estimado de inactividad es de ${fmtNum(num(d.horas))} horas, lo que representa una pérdida directa de ${m(perdida)}` +
        (num(d.reputacion) ? ` y un daño adicional estimado de ${m(num(d.reputacion))} por reputación, multas o clientes perdidos.` : '.');
      const q2 = [`Inversión inicial (CAPEX): ${m(num(d.capex))}.`, `Operación y soporte (OPEX): ${m(num(d.opex))} por año.`, `Costo total a ${fmtNum(anios)} ${anios === 1 ? 'año' : 'años'}: ${m(tco)}.`];
      const q3 = [`Un solo incidente costaría ${m(impacto)}. Prevenirlo cuesta ${m(tco)} en ${fmtNum(anios)} ${anios === 1 ? 'año' : 'años'}, es decir, el ${fmtPct(ratio)} del costo del desastre.`];
      if (esperado) q3.push(`Con una probabilidad estimada del ${fmtNum(num(d.prob))}% al año, la pérdida esperada es de ${m(esperado)} por año, frente a un costo anual de ${m(anual)}.`);
      const q4 = [];
      if (num(d.ingresos)) q4.push(`El costo anual de la protección representa el ${fmtPct(anual / num(d.ingresos) * 100)} de la facturación anual que protege (${m(num(d.ingresos))}).`);
      if (txt(d.picos)) q4.push(ensureEnd(d.picos));
      if (!q4.length) q4.push('Agrega la facturación que protege y los momentos de mayor venta.');
      return {
        verdict, layout: 'quad',
        title: `Propuesta: proteger ${sis}`,
        lead: ensureEnd(d.riesgoTxt),
        blocks: [
          ['1 · El riesgo traducido a dinero', q1],
          ['2 · La inversión solicitada', q2],
          ['3 · El costo de la inacción', q3],
          ['4 · Flujo de caja y continuidad', q4],
        ],
      };
    },
  },

  // ---------- 4. Las 3 Preguntas del CEO ----------
  {
    id: 'ceo', ch: 4, part: 1, icon: '🧭',
    name: 'Las 3 Preguntas del CEO',
    chapter: 'Hablarle al CEO',
    short: 'Si tu proyecto no responde estas tres preguntas sin jerga, no está listo para presentarse.',
    quote: 'Los CEOs no toman decisiones sobre tecnología; toman decisiones sobre el futuro.',
    learn: `<p>Cada vez que prepares una reunión con el CEO o con la junta directiva, olvídate de las diapositivas técnicas. Somete tu propuesta a estas tres preguntas. <strong>Si no puede responderlas de forma directa, clara y sin jerga técnica, no está lista.</strong></p>
      <p>Cuando dejas de vender parches y firewalls y empiezas a vender certidumbre estratégica, el CEO deja de verte como un gasto inevitable y empieza a reconocerte como un consejero indispensable.</p>`,
    titleKey: 'iniciativa',
    defaults: {},
    examples: [
      { label: 'Protección del e-commerce', data: { iniciativa: 'Actualizar la protección del portal de comercio electrónico', p1: 'Protege la campaña de cierre de año y la expansión del canal digital, que este año debe crecer 30%.', p2: 'Una caída del portal durante la campaña de cierre de año nos costaría el 20% de la facturación anual proyectada y destruiría la experiencia de los nuevos usuarios.', p3: 'Mantener el portal disponible el 99,99% del tiempo durante la temporada alta, sin una sola hora de caída no planeada.' } },
    ],
    sections: () => [
      { title: 'La iniciativa', fields: [{ k: 'iniciativa', type: 'text', label: 'Nombre del proyecto o presupuesto', ph: 'Ej.: Proteger el trabajo remoto del equipo comercial' }] },
      { title: '1 · El vínculo con la estrategia', fields: [{ k: 'p1', type: 'area', jargon: true, label: '¿Cómo protege o acelera esta iniciativa nuestra estrategia de crecimiento para este año?', ph: 'Ej.: Al expandir el equipo comercial hacia nuevos países, los datos de nuestros clientes viajan protegidos y podemos cerrar contratos más grandes.',
        compare: ['Necesitamos comprar una solución DLP para cumplir con la política interna.', 'Esta solución asegura que, al expandir nuestro equipo comercial hacia nuevos países y permitirles trabajar de forma remota, los datos confidenciales de nuestros clientes viajen protegidos, blindando la confianza que nos permite cerrar contratos de gran envergadura.'] }] },
      { title: '2 · El costo de la inacción', fields: [{ k: 'p2', type: 'area', jargon: true, label: 'Si no aprobamos esta inversión hoy, ¿qué iniciativa de negocio crítica queda expuesta o se vuelve inviable?', ph: 'Ej.: Si no actuamos este trimestre, una caída durante la campaña de fin de año nos costará el 20% de la facturación.',
        compare: ['Tenemos un riesgo alto de ataques de denegación de servicio (DDoS).', 'Si no actualizamos nuestra infraestructura este trimestre, una caída del portal durante la campaña de cierre de año nos costará el 20% de la facturación anual proyectada.'] }] },
      { title: '3 · Métricas de negocio, no de tecnología', fields: [{ k: 'p3', type: 'area', jargon: true, label: '¿Cómo mediremos el éxito en términos de continuidad y valor comercial, y no en métricas internas de nuestra área?', ph: 'Ej.: 99,99% de disponibilidad para que la logística no pare ni una hora en los próximos doce meses.',
        compare: ['Reducimos los falsos positivos en un 60% y aumentamos el bloqueo de hashes maliciosos.', 'Garantizamos el 99,99% de disponibilidad operativa para que la cadena logística no sufra ninguna hora de paralización no planeada durante los próximos doce meses.'] }] },
    ],
    result(d) {
      const qs = [['p1', 'El vínculo con la estrategia'], ['p2', 'El costo de la inacción'], ['p3', 'Métricas de negocio']];
      const answered = qs.filter(([k]) => txt(d[k])).length;
      if (!answered) return { verdict: ['info', 'Responde las tres preguntas para saber si tu proyecto está listo.'], blocks: [] };
      const issues = [];
      for (const [k, n] of qs) {
        if (!txt(d[k])) { issues.push(`Falta responder: ${n.toLowerCase()}.`); continue; }
        const j = findJargon(d[k]);
        if (j.length) issues.push(`“${n}” tiene jerga: ${j.map(x => x.t).join(', ')}.`);
      }
      if (txt(d.p3) && TECH_METRIC.test(d.p3) && !BIZ_METRIC.test(d.p3)) issues.push('La métrica de éxito suena a indicador interno de tu área. Mídela en disponibilidad, ingresos protegidos o experiencia del cliente.');
      else if (txt(d.p3) && !/\d/.test(d.p3)) issues.push('Pon un número en la métrica de éxito (por ejemplo, % de disponibilidad u horas sin interrupción).');
      if (txt(d.p2) && !BIZ.test(d.p2)) issues.push('El costo de la inacción no menciona qué negocio, ingreso o cliente queda expuesto.');
      return {
        verdict: issues.length ? ['warn', 'Todavía no está listo para la junta', issues] : ['ok', 'Listo para presentar al CEO', ['Responde las tres preguntas sin jerga y con métricas de negocio.']],
        title: txt(d.iniciativa) || 'Propuesta para el CEO',
        blocks: [
          ['¿Cómo protege o acelera nuestra estrategia de crecimiento?', d.p1],
          ['¿Qué queda expuesto si no lo aprobamos hoy?', d.p2],
          ['¿Cómo mediremos el éxito?', d.p3],
        ],
      };
    },
  },

  // ---------- 5. La conversación del "Sí, y..." ----------
  {
    id: 'siy', ch: 5, part: 2, icon: '✅',
    name: 'La conversación del “Sí, y…”',
    chapter: 'La velocidad también se protege',
    short: 'Cambia el “no” por una habilitación condicionada, en cuatro pasos.',
    quote: 'La diferencia entre un departamento de seguridad temido y uno respetado no está en cuánto sabe de tecnología. Está en si su primera palabra, frente a una solicitud incómoda, es “no” o es “sí, y…”.',
    learn: `<p>Esta técnica elimina la confrontación directa y sustituye la prohibición ciega por la <strong>habilitación condicionada y colaborativa</strong>. No es bajar la guardia: es proteger sin detener.</p>
      <table class="mini"><thead><tr><th>Seguridad dogmática</th><th>Seguridad con “Sí, y…”</th></tr></thead><tbody>
      <tr><td>“Prohibido el despliegue hasta nueva orden.”</td><td>“Salimos a producción el viernes bajo estas condiciones de monitoreo reforzado.”</td></tr>
      <tr><td>Obstáculo burocrático que paraliza la innovación.</td><td>Aliado táctico que encuentra la manera de ganar sin exponernos.</td></tr>
      <tr><td>Los equipos ocultan los proyectos para evitar a seguridad.</td><td>Los equipos acuden voluntariamente a seguridad buscando asesoría temprana.</td></tr></tbody></table>`,
    titleKey: 'solicitud',
    defaults: {},
    examples: [
      { label: 'Lanzar pagos el viernes', data: { solicitud: 'Lanzar la nueva función de pagos este viernes', fecha: 'Viernes', si: 'Entiendo perfectamente que necesitamos lanzar esta nueva función de pagos este viernes para aprovechar la campaña de marketing y asegurar los ingresos del mes.', riesgo: 'El desafío es que, tal como está configurado el inicio de sesión, una falla en el flujo expone las cuentas corporativas a un fraude automatizado durante el primer fin de semana.', y: 'Sí podemos salir a producción este viernes, y para reducir el riesgo de fraude sin retrasar el lanzamiento, reforzaremos el monitoreo de transacciones en tiempo real durante las primeras 72 horas y limitaremos temporalmente los montos máximos por operación.', respNeg: 'Gerente de producto digital', respSeg: 'Líder de seguridad', temporal: 'Monitoreo reforzado 72 horas y límite temporal de montos por operación.', definitivo: 'Corrección definitiva el próximo martes en horario de madrugada.', aceptado: 'Posible fraude de bajo monto durante el fin de semana, vigilado en tiempo real.' } },
    ],
    sections: () => [
      { title: 'La solicitud del negocio', fields: [
        { k: 'solicitud', type: 'text', label: '¿Qué pide el negocio?', ph: 'Ej.: Lanzar la nueva app de pagos', half: true },
        { k: 'fecha', type: 'text', label: '¿Para cuándo?', ph: 'Ej.: Este viernes', half: true },
      ] },
      { title: '1 · Validar el objetivo de negocio', sub: 'El “Sí”', help: 'Reconoce la validez y la urgencia del propósito comercial. Demuestra que entiendes qué busca la compañía y por qué el tiempo apremia.', fields: [
        { k: 'si', type: 'area', jargon: true, ph: 'Ej.: Entiendo que necesitamos lanzar este viernes para aprovechar la campaña y asegurar los ingresos del mes.' },
      ] },
      { title: '2 · Exponer el riesgo con honestidad', sub: 'Sin alarmismos', help: 'Comunica el riesgo sin tecnicismos alarmistas, conectado con la realidad operativa.', fields: [
        { k: 'riesgo', type: 'area', jargon: true, ph: 'Ej.: El desafío es que, tal como está hoy, una falla podría exponer las cuentas a fraude durante el primer fin de semana.' },
      ] },
      { title: '3 · Co-crear la alternativa ágil', sub: 'El “Y…”', help: 'En lugar de cerrar la puerta, ofrece un camino que permita avanzar a la velocidad requerida, con una mitigación controlada y temporal.', fields: [
        { k: 'y', type: 'area', jargon: true, rows: 4, ph: 'Ej.: Sí podemos salir el viernes, y para reducir el riesgo reforzaremos el monitoreo durante 72 horas mientras aplicamos la corrección definitiva el martes.' },
      ] },
      { title: '4 · El acuerdo de responsabilidad compartida', help: 'Fija las reglas del juego de manera transparente y documenta la aceptación del riesgo temporal.', fields: [
        { k: 'respNeg', type: 'text', label: 'Responsable del negocio', ph: 'Ej.: Gerente de producto', half: true },
        { k: 'respSeg', type: 'text', label: 'Responsable de seguridad', ph: 'Ej.: CISO', half: true },
        { k: 'temporal', type: 'area', label: 'Mitigación temporal acordada', ph: 'Ej.: Monitoreo reforzado y límite de montos durante 72 horas.' },
        { k: 'definitivo', type: 'text', label: 'Solución definitiva y fecha', ph: 'Ej.: Corrección el martes en la madrugada' },
        { k: 'aceptado', type: 'area', label: 'Riesgo temporal que se acepta', ph: 'Ej.: Posible fraude de bajo monto, vigilado en tiempo real.' },
      ] },
    ],
    result(d) {
      if (!txt(d.si) && !txt(d.riesgo) && !txt(d.y)) return { verdict: ['info', 'Escribe los tres primeros pasos para armar tu guion.'], blocks: [] };
      const issues = [];
      if (!txt(d.si)) issues.push('Falta el paso 1: valida el objetivo de negocio.');
      else if (/^\s*(no\b|lamentablemente|imposible|eso no)/iu.test(d.si) || /prohib|no se puede|no es posible/iu.test(d.si)) issues.push('El paso 1 empieza cerrando la puerta. Empieza reconociendo el objetivo de negocio.');
      if (!txt(d.riesgo)) issues.push('Falta el paso 2: explica el riesgo.');
      else if (/catastr|desastre|grav[ií]sim|inminente|nos van a (hackear|atacar)|p[aá]nico|terrible|fatal/iu.test(d.riesgo)) issues.push('El paso 2 suena alarmista. Describe el riesgo con hechos y su efecto en la operación.');
      if (!txt(d.y)) issues.push('Falta el paso 3: la alternativa ágil.');
      else if (/prohib|no se puede|hasta nueva orden|no saldr/iu.test(d.y)) issues.push('El paso 3 todavía suena a bloqueo. Ofrece un camino para avanzar.');
      const j = findJargon([d.si, d.riesgo, d.y].join(' '));
      if (j.length) issues.push(`Quita la jerga del guion: ${j.map(x => x.t).join(', ')}.`);
      const acta = [];
      if (txt(d.solicitud)) acta.push(`Solicitud: ${ensureEnd(d.solicitud)}${txt(d.fecha) ? ' Fecha: ' + ensureEnd(d.fecha) : ''}`);
      if (txt(d.temporal)) acta.push(`Mitigación temporal: ${ensureEnd(d.temporal)}`);
      if (txt(d.definitivo)) acta.push(`Solución definitiva: ${ensureEnd(d.definitivo)}`);
      if (txt(d.aceptado)) acta.push(`Riesgo aceptado temporalmente: ${ensureEnd(d.aceptado)}`);
      if (txt(d.respNeg) || txt(d.respSeg)) acta.push(`Responsables: ${[txt(d.respNeg) && txt(d.respNeg) + ' (negocio)', txt(d.respSeg) && txt(d.respSeg) + ' (seguridad)'].filter(Boolean).join(' y ')}.`);
      if (!acta.length) issues.push('Completa el paso 4: el acuerdo de responsabilidad compartida.');
      return {
        verdict: issues.length ? ['warn', 'Ajusta tu guion', issues] : ['ok', 'Guion listo', ['Validas el objetivo, explicas el riesgo sin alarmismo y ofreces un camino para avanzar.']],
        title: txt(d.solicitud) ? `Sí, y…: ${txt(d.solicitud)}` : 'Conversación del “Sí, y…”',
        blocks: [
          ['1 · Validar el objetivo (el “Sí”)', d.si],
          ['2 · El riesgo, con honestidad', d.riesgo],
          ['3 · La alternativa ágil (el “Y…”)', d.y],
          ['4 · Acuerdo de responsabilidad compartida', acta],
        ],
      };
    },
  },

  // ---------- 6. El Validador de Frameworks ----------
  {
    id: 'frameworks', ch: 6, part: 2, icon: '🧪',
    name: 'El Validador de Frameworks',
    chapter: 'Filosofías convertidas en checklists',
    short: 'Antes de firmar una orden de compra por la última gran revolución del mercado.',
    quote: 'Los frameworks orientan; las decisiones transforman.',
    learn: `<p>Nada de esto significa que Zero Trust, NIST, ISO o cualquiera que venga después carezcan de valor. Significa que <strong>el valor nunca estuvo en el framework, sino en el pensamiento crítico que exige aplicarlo bien</strong>.</p>
      <p>Un martillo no construye una casa; la construye alguien que sabe cuándo, dónde y con qué fuerza usarlo.</p>`,
    titleKey: 'nombre',
    defaults: {},
    sections: () => [
      { title: 'Lo que te están ofreciendo', fields: [{ k: 'nombre', type: 'text', label: 'Framework, metodología o producto', ph: 'Ej.: Plataforma “Zero Trust en una caja” del proveedor X' }] },
      { title: '1 · ¿Transforma un comportamiento o solo automatiza un control?', help: 'Si la solución promete seguridad absoluta solo con instalar una licencia, sin cambiar ningún hábito de la empresa, es un espejismo de checklist.', fields: [
        { k: 'q1', type: 'choice', options: [['si', 'Hay un plan real de gestión del cambio'], ['parcial', 'Hay un plan, pero incompleto'], ['no', 'Promete resolverlo todo con la licencia']] },
        { k: 'n1', type: 'area', label: 'Notas', rows: 2, ph: '¿Quién cambia qué hábito? ¿Cómo se acompaña?' },
      ] },
      { title: '2 · ¿Resuelve un problema de nuestro negocio o sigue la moda?', help: 'La adopción tecnológica debe nacer de una necesidad de supervivencia estratégica, jamás de la presión publicitaria o del miedo a quedar rezagados en una conferencia.', fields: [
        { k: 'q2', type: 'choice', options: [['si', 'Ataca nuestro riesgo más crítico'], ['parcial', 'Ayuda, pero no es nuestro riesgo principal'], ['no', 'Lo queremos porque “todos lo tienen”']] },
        { k: 'n2', type: 'area', label: 'Notas', rows: 2, ph: '¿Qué riesgo de nuestra cadena de valor ataca?' },
      ] },
      { title: '3 · ¿Nos vuelve más ágiles o más burocráticos?', help: 'Un buen marco facilita la toma de decisiones; un mal checklist comercial solo añade complejidad que entorpece la operación y empuja al Shadow IT.', fields: [
        { k: 'q3', type: 'choice', options: [['si', 'Más maniobra y visibilidad'], ['parcial', 'No está claro todavía'], ['no', 'Más capas de fricción']] },
        { k: 'n3', type: 'area', label: 'Notas', rows: 2, ph: '¿Qué proceso se vuelve más rápido o más lento?' },
      ] },
    ],
    result(d) {
      const qs = [d.q1, d.q2, d.q3];
      if (qs.some(q => !q)) return { verdict: ['info', 'Responde las tres preguntas para ver el veredicto.'], blocks: [] };
      const score = qs.reduce((s, q) => s + (q === 'si' ? 2 : q === 'parcial' ? 1 : 0), 0);
      const label = { si: '✅', parcial: '⚠️', no: '❌' };
      const ans = (q, opts) => `${label[q]} ${opts[q]}`;
      let verdict;
      if (d.q1 === 'no') verdict = ['bad', 'Espejismo de checklist', ['Promete seguridad sin cambiar ningún hábito. No firmes todavía.']];
      else if (score === 6) verdict = ['ok', 'Vale la pena evaluarlo a fondo', ['Responde a un problema real y viene con un plan para las personas.']];
      else if (score >= 4) verdict = ['warn', 'Revisa antes de firmar', ['Aclara los puntos con reservas antes de comprometer presupuesto.']];
      else verdict = ['bad', 'No resuelve un problema de tu negocio', ['Añade complejidad o sigue la moda de la industria.']];
      return {
        verdict, title: `Validador de Frameworks${txt(d.nombre) ? ': ' + txt(d.nombre) : ''}`,
        blocks: [
          ['¿Transforma un comportamiento?', [ans(d.q1, { si: 'Hay un plan real de gestión del cambio.', parcial: 'Hay un plan de cambio, pero incompleto.', no: 'Promete resolverlo todo con la licencia.' }), txt(d.n1)]],
          ['¿Resuelve un problema de nuestro negocio?', [ans(d.q2, { si: 'Ataca nuestro riesgo más crítico.', parcial: 'Ayuda, pero no es nuestro riesgo principal.', no: 'Responde a la moda de la industria.' }), txt(d.n2)]],
          ['¿Nos vuelve más ágiles?', [ans(d.q3, { si: 'Da más capacidad de maniobra y visibilidad.', parcial: 'Todavía no está claro.', no: 'Agrega capas de fricción.' }), txt(d.n3)]],
        ],
      };
    },
  },

  // ---------- 7. Las 5 preguntas iniciales ----------
  {
    id: 'cinco', ch: 7, part: 2, icon: '🎯',
    name: 'Las 5 preguntas iniciales',
    chapter: 'Empezar por el dolor, no por la arquitectura',
    short: 'Antes de escribir la primera línea de código o comprar la primera licencia.',
    quote: 'La arquitectura comienza escuchando.',
    learn: `<p>Ningún diseño técnico, por avanzado que sea, tiene valor estratégico si no fue concebido como respuesta directa a las necesidades, prioridades y <strong>dolores del negocio</strong>. La pregunta no es “¿qué tecnología necesitamos?”, sino “¿qué le está doliendo realmente a este negocio?”.</p>`,
    titleKey: 'proyecto',
    defaults: {},
    sections: () => [
      { title: 'El proyecto', fields: [{ k: 'proyecto', type: 'text', label: 'Nombre del proyecto, iniciativa o política', ph: 'Ej.: Seguridad para la red de bodegas' }] },
      { title: '1 · ¿Cuál es el dolor operativo real?', help: 'Si no implementamos esta solución, ¿qué proceso operativo exacto se rompe, se detiene o se vuelve vulnerable esta misma semana?', fields: [{ k: 'q1', type: 'area', jargon: true, ph: 'Ej.: Los camiones salen tarde porque el sistema de despacho se cae.' }] },
      { title: '2 · ¿Cómo afecta al cliente o al operador?', help: '¿Facilita la labor de quien genera ingresos o le añade una carga que lo empujará a buscar alternativas informales?', fields: [{ k: 'q2', type: 'area', jargon: true, ph: 'Ej.: Los despachadores no tendrán que escribir otra clave en cada turno.' }] },
      { title: '3 · ¿Cuánta fricción está dispuesto a tolerar el negocio?', help: 'No todo requiere el mismo nivel de blindaje. ¿Estamos dispuestos a sacrificar velocidad en este proceso a cambio de un control más robusto?', fields: [
        { k: 'friccion', type: 'choice', options: [['baja', 'Casi ninguna', 'Proceso crítico para los ingresos'], ['media', 'Algo de fricción', 'Unos pasos extra son aceptables'], ['alta', 'Bastante', 'Preferimos más control que velocidad']] },
        { k: 'q3', type: 'area', jargon: true, rows: 2, label: '¿Por qué?', ph: 'Ej.: Cada minuto de retraso en el despacho cuesta entregas.' },
      ] },
      { title: '4 · ¿Cuál es el mínimo control viable?', help: '¿Podemos lograr la misma mitigación con un control automatizado de bajo impacto en lugar de una prohibición total?', fields: [{ k: 'q4', type: 'area', ph: 'Ej.: Aislar solo la red de despacho en lugar de bloquear el acceso remoto a todos.' }] },
      { title: '5 · ¿Cómo mediremos el éxito desde el negocio?', help: '¿Cómo demostraremos en el comité ejecutivo, dentro de tres meses, que esto mejoró la resiliencia operativa y no solo cumplió un estándar?', fields: [{ k: 'q5', type: 'area', jargon: true, ph: 'Ej.: Cero despachos retrasados por fallas del sistema en el trimestre.' }] },
    ],
    result(d) {
      const ks = ['q1', 'q2', 'q3', 'q4', 'q5'];
      const done = ks.filter(k => k === 'q3' ? (d.friccion || txt(d.q3)) : txt(d[k])).length;
      if (!done) return { verdict: ['info', 'Responde las preguntas para armar el brief del proyecto.'], blocks: [] };
      const issues = [];
      if (done < 5) issues.push(`Llevas ${done} de 5 preguntas.`);
      const j = findJargon(['q1', 'q2', 'q3', 'q5'].map(k => d[k]).join(' '));
      if (j.length) issues.push(`Habla del dolor sin jerga: ${j.map(x => x.t).join(', ')}.`);
      if (txt(d.q5) && TECH_METRIC.test(d.q5) && !BIZ_METRIC.test(d.q5)) issues.push('La métrica de éxito suena técnica. Usa un indicador del negocio.');
      const fr = { baja: 'Casi ninguna: es un proceso crítico para los ingresos.', media: 'Algo de fricción es aceptable.', alta: 'Bastante: preferimos más control que velocidad.' };
      return {
        verdict: issues.length ? ['warn', 'Brief en construcción', issues] : ['ok', 'Brief listo', ['Empieza por el dolor del negocio y termina en una métrica que el comité entiende.']],
        title: `Brief: ${txt(d.proyecto) || 'nuevo proyecto'}`,
        blocks: [
          ['El dolor operativo', d.q1],
          ['Impacto en el cliente y el operador', d.q2],
          ['Fricción tolerable', [d.friccion ? fr[d.friccion] : '', txt(d.q3)]],
          ['Mínimo control viable', d.q4],
          ['Cómo mediremos el éxito', d.q5],
        ],
      };
    },
  },

  // ---------- 8. La Regla de las Tres Frases ----------
  {
    id: 'tresfrases', ch: 8, part: 2, icon: '③',
    name: 'La Regla de las Tres Frases',
    chapter: 'Saber mucho no es lo mismo que ayudar',
    short: 'El problema, la solución y el beneficio, en tres frases y sin jerga.',
    quote: 'La complejidad demuestra conocimiento; la simplicidad demuestra dominio.',
    learn: `<p>Si no eres capaz de explicar el problema, la solución y el beneficio de negocio en tres frases claras y libres de jerga, no has entendido el problema lo suficiente como para proponerlo.</p>
      <p><strong>Versión del experto inseguro:</strong> <em>“Para mitigar el riesgo de movimiento lateral en la red híbrida, debemos desplegar una estrategia de microsegmentación basada en políticas de Zero Trust utilizando agentes XDR con capacidades de análisis heurístico en el borde…”</em> El directorio se desconecta.</p>
      <p><strong>Versión del líder estratégico:</strong> tres frases. Carga el ejemplo y compara.</p>`,
    titleKey: 'tema',
    defaults: {},
    examples: [
      { label: 'Microsegmentación', data: { tema: 'Aislar los equipos de la red', original: 'Para mitigar el riesgo de movimiento lateral en la red híbrida, debemos desplegar una estrategia de microsegmentación basada en políticas de Zero Trust utilizando agentes XDR con capacidades de análisis heurístico en el borde, lo que reducirá la superficie de exposición ante ataques de ransomware del tipo Living-off-the-Land.', f1: 'Actualmente, si un atacante compromete una sola laptop de la compañía, tiene vía libre para caminar por toda nuestra red corporativa y apagar las operaciones principales.', f2: 'Vamos a instalar barreras virtuales automáticas dentro de nuestra red para que, si un equipo es vulnerado, quede completamente aislado en cuestión de segundos sin afectar al resto de la organización.', f3: 'Con esto garantizamos que la operación de nuestras plantas y la atención a clientes sigan corriendo sin interrupciones, eliminando el riesgo de una paralización generalizada.' } },
    ],
    sections: () => [
      { title: 'El tema', fields: [
        { k: 'tema', type: 'text', label: '¿Qué vas a explicar?', ph: 'Ej.: Aislar los equipos de la red' },
        { k: 'original', type: 'area', jargon: true, label: 'Tu explicación técnica actual · opcional', help: 'Pégala para comparar el antes y el después.', ph: 'Ej.: Debemos desplegar microsegmentación con agentes XDR…' },
      ] },
      { title: '1 · La frase del dolor', sub: 'El diagnóstico', help: 'La realidad actual del riesgo o el cuello de botella que el negocio ya sufre.', fields: [{ k: 'f1', type: 'area', jargon: true, sentence: true, ph: 'Ej.: Hoy, si un atacante compromete una sola laptop, puede recorrer toda la red y apagar la operación.' }] },
      { title: '2 · La frase de la solución', sub: 'El puente', help: 'Qué se va a hacer, traduciendo la tecnología a una acción comprensible.', fields: [{ k: 'f2', type: 'area', jargon: true, sentence: true, ph: 'Ej.: Vamos a instalar barreras automáticas para que un equipo vulnerado quede aislado en segundos.' }] },
      { title: '3 · La frase del beneficio', sub: 'El impacto', help: 'Qué gana la compañía en continuidad, velocidad o protección de ingresos.', fields: [{ k: 'f3', type: 'area', jargon: true, sentence: true, ph: 'Ej.: Así las plantas y la atención a clientes siguen funcionando sin interrupciones.' }] },
    ],
    result(d) {
      const fs = [['f1', 'dolor'], ['f2', 'solución'], ['f3', 'beneficio']];
      if (fs.every(([k]) => !txt(d[k]))) return { verdict: ['info', 'Escribe tus tres frases.'], blocks: [] };
      const issues = [];
      for (const [k, n] of fs) {
        if (!txt(d[k])) { issues.push(`Falta la frase del ${n}.`); continue; }
        if (sentences(d[k]) > 1) issues.push(`La frase del ${n} tiene ${sentences(d[k])} oraciones: debe ser una sola.`);
        if (words(d[k]) > 40) issues.push(`La frase del ${n} tiene ${words(d[k])} palabras: intenta bajar de 40.`);
        const j = findJargon(d[k]);
        if (j.length) issues.push(`La frase del ${n} tiene jerga: ${j.map(x => x.t).join(', ')}.`);
      }
      if (txt(d.f3) && !BIZ.test(d.f3)) issues.push('El beneficio no menciona continuidad, velocidad, clientes o ingresos.');
      const final = fs.map(([k]) => txt(d[k])).filter(Boolean).join(' ');
      const stats = [];
      if (txt(d.original)) {
        const jo = findJargon(d.original).length, jf = findJargon(final).length;
        stats.push(`Antes: ${words(d.original)} palabras y ${jo} términos técnicos. Ahora: ${words(final)} palabras y ${jf} términos técnicos.`);
      }
      return {
        verdict: issues.length ? ['warn', 'Afina tus frases', issues] : ['ok', 'Cumple la Regla de las Tres Frases', ['Dolor, solución y beneficio, claros y sin jerga.']],
        title: txt(d.tema) || 'Tres frases',
        lead: stats.join(' '),
        blocks: [['El dolor', d.f1], ['La solución', d.f2], ['El beneficio', d.f3]],
      };
    },
  },

  // ---------- 9. Guía de Bolsillo del Traductor Ejecutivo ----------
  {
    id: 'guia', ch: 10, part: 3, icon: '🧳',
    name: 'Guía de Bolsillo del Traductor Ejecutivo',
    chapter: 'El Traductor del Negocio',
    short: 'Cinco minutos antes de la reunión: cómo hablarle a quien tienes enfrente.',
    quote: 'Traducir no es una habilidad superficial de comunicación; es una competencia estratégica que define la supervivencia ejecutiva.',
    learn: `<p>No está pensada para leerse una sola vez, sino para consultarse cientos de veces, hasta que cada fórmula se convierta en la forma natural en la que hablas de seguridad.</p>
      <details class="case"><summary>Caso 1 · La vulnerabilidad crítica que no lo es tanto</summary>
      <p><strong>Antes:</strong> “¡Emergencia! El escáner detectó una vulnerabilidad de severidad 9.8 en el servidor de autenticación. Debemos apagar el sistema de inmediato.”</p>
      <p><strong>Traducido:</strong> “Tenemos una debilidad en el sistema de autenticación de clientes. Si no la corregimos esta noche durante la ventana de mantenimiento, un atacante podría simular identidades. Proponemos un parche de dos horas que no afectará la operación diurna.”</p></details>
      <details class="case"><summary>Caso 2 · El presupuesto de cifrado</summary>
      <p><strong>Antes:</strong> “Necesitamos cifrado de extremo a extremo con algoritmos post-cuánticos y gestión descentralizada de llaves.” → “Denegado.”</p>
      <p><strong>Traducido:</strong> “Vamos a manejar datos financieros sensibles de grandes clientes. Un solo incidente de fuga nos costará demandas y la pérdida de nuestros tres contratos más rentables del año. Esta inversión protege esos ingresos.”</p></details>
      <details class="case"><summary>Caso 3 · El bloqueo de una herramienta de IA</summary>
      <p><strong>Antes:</strong> “Prohibido el uso de aplicaciones de IA no aprobadas. Quien las use será sancionado.”</p>
      <p><strong>Traducido:</strong> “Entendemos que los equipos comerciales necesitan acelerar sus propuestas con IA. Como las herramientas públicas exponen datos de clientes, habilitaremos una versión corporativa segura este viernes.”</p></details>`,
    titleKey: 'tema',
    defaults: { aud: 'ceo' },
    sections: d => {
      const a = AUDIENCES[d.aud] || AUDIENCES.ceo;
      return [
        { title: '¿Con quién vas a hablar?', fields: [{ k: 'aud', type: 'choice', rerender: true, cols: 5, options: Object.entries(AUDIENCES).map(([k, v]) => [k, `${v.icon} ${v.name}`]) }] },
        { title: `${a.icon} ${a.name}: ${a.title}`, info: [['Lo que le importa', a.cares], ['Su idioma', a.lang], ['Qué prohibir en tu discurso', a.avoid]], fields: [
          { k: 'tema', type: 'text', label: '¿De qué vas a hablar?', ph: 'Ej.: Renovar la protección del portal de clientes' },
        ] },
        { title: 'Tu fórmula de tres frases', fields: a.steps.map((s, i) => ({ k: 'g' + (i + 1), type: 'area', rows: 2, label: `${i + 1} · ${s}`, ph: a.ph[i], jargon: !a.allowJargon, useph: true })) },
      ];
    },
    result(d) {
      const a = AUDIENCES[d.aud] || AUDIENCES.ceo;
      const g = ['g1', 'g2', 'g3'].map(k => txt(d[k]));
      if (g.every(x => !x)) return { verdict: ['info', 'Escribe tus tres frases, o toca “Usar el ejemplo” en cada una.'], blocks: [] };
      const issues = [];
      g.forEach((x, i) => { if (!x) issues.push(`Falta la frase ${i + 1}: ${a.steps[i].toLowerCase()}.`); });
      const all = g.join(' ');
      if (!a.allowJargon) { const j = findJargon(all); if (j.length) issues.push(`Para ${a.name === 'CEO' ? 'el CEO' : a.name === 'CFO' ? 'el CFO' : 'esta audiencia'}, quita la jerga: ${j.map(x => x.t).join(', ')}.`); }
      for (const [rx, msg] of a.bad) if (rx.test(all)) issues.push(msg);
      if (a.needMoney && !/\d/.test(all)) issues.push('El CFO decide en dinero: pon una cifra (pérdida por hora, costo del proyecto).');
      const speech = g.filter(Boolean).map(s => s.replace(/^…|…$/g, '').trim()).join(' ');
      return {
        verdict: issues.length ? ['warn', 'Revisa antes de entrar', issues] : ['ok', `Listo para hablar con ${a.name === 'Comité ejecutivo' ? 'el comité' : a.name === 'Equipo técnico' ? 'el equipo técnico' : a.name === 'Incidente crítico' ? 'la sala de crisis' : 'el ' + a.name}`, ['Respeta lo que le importa a tu audiencia y evita lo que la desconecta.']],
        title: `${a.icon} Para ${a.name}${txt(d.tema) ? ': ' + txt(d.tema) : ''}`,
        blocks: [
          ...a.steps.map((s, i) => [s, g[i]]),
          ['Tu discurso completo', ensureEnd(speech)],
        ],
      };
    },
  },
];
const TOOL = Object.fromEntries(TOOLS.map(t => [t.id, t]));

const SITUATIONS = [
  ['Tengo que explicar algo técnico en una junta', 'tresfrases'],
  ['Voy a pedir presupuesto al CFO', 'financiera'],
  ['Presento un proyecto al CEO', 'ceo'],
  ['Quieren lanzar algo que me preocupa', 'siy'],
  ['Estoy por bloquear una herramienta', 'filtros'],
  ['Un proveedor me ofrece un framework', 'frameworks'],
  ['Arranca un proyecto nuevo', 'cinco'],
  ['Una frase mía no se entendió', 'traductor'],
  ['Entro a una reunión en 5 minutos', 'guia'],
  ['Tenemos un incidente', 'guia', { aud: 'incidente' }],
];

// ---------------- Router ----------------
const app = document.getElementById('app');
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
window.addEventListener('hashchange', render);

function render() {
  const [, view, id] = location.hash.split('/');
  app.innerHTML = '';
  window.scrollTo(0, 0);
  if (view === 'h' && TOOL[id]) renderTool(TOOL[id]);
  else if (view === 'biblioteca') renderLibrary(id);
  else renderHome();
}

function topbar(back) {
  return h('header', { class: 'top' },
    back ? h('a', { class: 'back', href: '#/', 'aria-label': 'Volver al inicio' }, '←') : h('span', { class: 'logo', 'aria-hidden': 'true' }, h('img', { src: 'icons/icon.svg', alt: '' })),
    h('a', { class: 'brand', href: '#/' }, BOOK.title),
    h('a', { class: 'lib-link', href: '#/biblioteca' }, '📚 Biblioteca', store.saved.length ? h('span', { class: 'count' }, store.saved.length) : null),
  );
}

// ---------------- Inicio ----------------
function renderHome() {
  app.append(topbar(false));
  const main = h('main', { class: 'home' });
  main.append(
    h('section', { class: 'hero' },
      h('p', { class: 'eyebrow' }, `Las herramientas del libro ${BOOK.title}`),
      h('h1', null, 'Deja de vender miedo. Empieza a construir confianza.'),
      h('p', { class: 'lead' }, 'Nueve herramientas para explicar mejor lo que sabes, entender lo que necesita el negocio y conectar la seguridad con las decisiones que realmente importan.'),
      h('p', { class: 'byline' }, 'Por ', h('strong', null, BOOK.author)),
    ),
    h('section', { class: 'situations', 'aria-labelledby': 'sit-h' },
      h('h2', { id: 'sit-h' }, '¿Qué tienes hoy?'),
      h('div', { class: 'chips' }, SITUATIONS.map(([label, id, preset]) => h('button', { class: 'chip', onclick: () => {
        if (preset) store.drafts[id] = { ...(store.drafts[id] || TOOL[id].defaults), ...preset };
        persist(); go('#/h/' + id);
      } }, label))),
    ),
  );
  for (const p of [1, 2, 3]) {
    main.append(h('section', { class: 'part' },
      h('h2', null, h('span', { class: 'part-n' }, PARTS[p][0]), ' ', PARTS[p][1]),
      h('div', { class: 'grid' }, TOOLS.filter(t => t.part === p).map(t => {
        const draft = store.drafts[t.id];
        const started = draft && Object.entries(draft).some(([k, v]) => !(k in t.defaults) && txt(v));
        return h('a', { class: 'card', href: '#/h/' + t.id },
          h('span', { class: 'card-icon', 'aria-hidden': 'true' }, t.icon),
          h('span', { class: 'card-ch' }, `Capítulo ${t.ch} · ${t.chapter}`),
          h('span', { class: 'card-t' }, t.name),
          h('span', { class: 'card-d' }, t.short),
          started ? h('span', { class: 'badge' }, 'En progreso') : null,
        );
      })),
    ));
  }
  main.append(h('section', { class: 'jargon-box' },
    h('h2', null, 'Detector de jerga'),
    h('p', null, 'Pega cualquier texto (un correo, una diapositiva, un informe) y te digo qué términos van a desconectar a la sala y cómo decirlos en lenguaje de negocio.'),
    (() => {
      const out = h('div', { class: 'jargon-out', 'aria-live': 'polite' });
      const ta = h('textarea', { rows: 4, 'aria-label': 'Texto a revisar', placeholder: 'Ej.: Debemos parchear las vulnerabilidades críticas de los endpoints antes de que un ransomware explote un zero-day.', oninput: e => {
        out.innerHTML = '';
        const v = e.target.value;
        if (!txt(v)) return;
        const j = findJargon(v);
        out.append(j.length ? jargonChips(j) : h('p', { class: 'ok-line' }, '✓ No encontré jerga técnica. ¡Bien!'));
      } });
      return [ta, out];
    })(),
  ));
  main.append(h('footer', { class: 'foot' },
    h('blockquote', null, '“Si tu estrategia de seguridad requiere que el negocio se detenga para protegerse, no tienes una estrategia de seguridad; tienes un freno de mano corporativo.”'),
    h('p', { class: 'credit' }, h('cite', null, BOOK.title), ' · ', BOOK.author),
    h('p', null, 'Lo que escribes se guarda solo en este dispositivo. Funciona sin internet y se puede instalar como app.'),
  ));
  app.append(main);
}

function jargonChips(list) {
  return h('ul', { class: 'jchips' }, list.map(j => h('li', null, h('b', null, j.t), ' → ', j.s)));
}

// ---------------- Herramienta ----------------
let current = null; // { tool, d }
function renderTool(tool) {
  const d = { ...tool.defaults, ...(store.drafts[tool.id] || {}) };
  current = { tool, d };
  app.append(topbar(true));
  const main = h('main', { class: 'tool' });
  main.append(
    h('section', { class: 'tool-head' },
      h('p', { class: 'eyebrow' }, `${PARTS[tool.part][0]} · Capítulo ${tool.ch}: ${tool.chapter}`),
      h('h1', null, h('span', { 'aria-hidden': 'true' }, tool.icon + ' '), tool.name),
      h('p', { class: 'lead' }, tool.short),
      h('details', { class: 'learn' }, h('summary', null, 'Cómo funciona (del libro)'), h('div', { html: tool.learn })),
    ),
  );
  if (tool.examples) main.append(h('div', { class: 'examples' }, h('span', null, 'Cargar un ejemplo del libro:'),
    tool.examples.map(ex => h('button', { class: 'chip small', onclick: () => {
      if (hasContent(tool, d) && !confirm('¿Reemplazar lo que escribiste con el ejemplo?')) return;
      store.drafts[tool.id] = { ...tool.defaults, ...ex.data }; persist(); renderToolAgain();
    } }, ex.label))));
  const form = h('form', { class: 'form', onsubmit: e => e.preventDefault() });
  for (const s of tool.sections(d)) form.append(sectionEl(tool, s, d));
  main.append(form);
  const res = h('section', { class: 'result', id: 'result', 'aria-live': 'polite' });
  main.append(res);
  main.append(h('p', { class: 'principle' }, h('span', null, 'Principio'), '“' + tool.quote + '”'));
  app.append(main);
  updateResult();
}
function renderToolAgain() {
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
}
function hasContent(tool, d) { return Object.entries(d).some(([k, v]) => !(k in tool.defaults) && txt(v)); }

function sectionEl(tool, s, d) {
  return h('fieldset', { class: 'sec' },
    h('legend', null, s.title, s.sub ? h('span', { class: 'sub' }, ' · ' + s.sub) : null),
    s.help ? h('p', { class: 'help' }, s.help) : null,
    s.info ? h('dl', { class: 'info' }, s.info.map(([k, v]) => [h('dt', null, k), h('dd', null, v)])) : null,
    h('div', { class: 'fields' }, s.fields.map(f => fieldEl(tool, f, d))),
  );
}

function fieldEl(tool, f, d) {
  const id = 'f-' + f.k;
  const wrap = h('div', { class: 'field' + (f.half ? ' half' : '') });
  if (f.label && f.type !== 'choice') wrap.append(h('label', { for: id }, f.label));
  else if (f.label) wrap.append(h('span', { class: 'label' }, f.label));
  if (f.help) wrap.append(h('p', { class: 'fhelp' }, f.help));
  if (f.compare) wrap.append(h('div', { class: 'compare' },
    h('p', { class: 'wrong' }, h('b', null, 'Enfoque incorrecto: '), f.compare[0]),
    h('p', { class: 'right' }, h('b', null, 'Enfoque del CEO: '), f.compare[1])));
  const onVal = v => { d[f.k] = v; changed(f); };
  let input;
  if (f.type === 'choice') {
    input = h('div', { class: 'choices' + (f.cols ? ' c' + f.cols : ''), role: 'radiogroup', 'aria-label': f.label || f.k });
    const btns = f.options.map(([v, l, desc]) => {
      const b = h('button', { type: 'button', role: 'radio', class: 'choice', 'aria-checked': String(d[f.k] === v), onclick: () => {
        onVal(v);
        for (const x of btns) x.setAttribute('aria-checked', String(x === b));
      } }, h('span', { class: 'choice-l' }, l), desc ? h('span', { class: 'choice-d' }, desc) : null);
      return b;
    });
    input.append(...btns);
  } else if (f.type === 'select') {
    input = h('select', { id, onchange: e => onVal(e.target.value) }, f.options.map(([v, l]) => h('option', { value: v, selected: d[f.k] === v }, l)));
  } else if (f.type === 'area') {
    input = h('textarea', { id, rows: f.rows || 3, placeholder: f.ph || '', oninput: e => onVal(e.target.value) });
    input.value = d[f.k] || '';
  } else {
    input = h('input', { id, type: f.type === 'num' ? 'number' : 'text', inputmode: f.type === 'num' ? 'decimal' : null, min: f.type === 'num' ? '0' : null, step: f.type === 'num' ? 'any' : null, placeholder: f.ph || '', oninput: e => onVal(e.target.value) });
    input.value = d[f.k] ?? '';
  }
  wrap.append(input);
  if (f.useph) wrap.append(h('button', { type: 'button', class: 'linkbtn', onclick: () => { input.value = f.ph.replace(/^…|…$/g, '').trim(); onVal(input.value); input.focus(); } }, 'Usar el ejemplo'));
  if (f.sentence) wrap.append(h('p', { class: 'counter', id: 'c-' + f.k }));
  if (f.jargon) wrap.append(h('div', { class: 'jfield', id: 'j-' + f.k, 'aria-live': 'polite' }));
  setTimeout(() => fieldFeedback(f, d), 0);
  return wrap;
}

function fieldFeedback(f, d) {
  if (f.jargon) {
    const el = document.getElementById('j-' + f.k);
    if (el) { el.innerHTML = ''; const j = findJargon(d[f.k]); if (j.length) el.append(h('p', { class: 'jwarn' }, '⚠️ Jerga que puede desconectar a la sala:'), jargonChips(j)); }
  }
  if (f.sentence) {
    const el = document.getElementById('c-' + f.k);
    if (el) {
      const w = words(d[f.k]), s = sentences(d[f.k]);
      el.textContent = w ? `${w} palabras · ${s} ${s === 1 ? 'oración' : 'oraciones'}` : '';
      el.className = 'counter' + (w > 40 || s > 1 ? ' over' : '');
    }
  }
}

let saveTimer;
function changed(f) {
  const { tool, d } = current;
  store.drafts[tool.id] = d;
  clearTimeout(saveTimer); saveTimer = setTimeout(persist, 250);
  if (f.rerender) { persist(); renderToolAgain(); return; }
  fieldFeedback(f, d);
  updateResult();
}

function updateResult() {
  const { tool, d } = current;
  const el = document.getElementById('result');
  if (!el) return;
  const r = tool.result(d);
  el.innerHTML = '';
  el.append(h('h2', { class: 'res-h' }, 'Resultado'));
  el.append(verdictEl(r.verdict));
  if (r.blocks.length) {
    el.append(docEl(r));
    el.append(h('div', { class: 'actions' },
      h('button', { class: 'btn primary', onclick: () => saveCurrent() }, '📚 Guardar en mi biblioteca'),
      h('button', { class: 'btn', onclick: () => copyDoc(r) }, '📋 Copiar texto'),
      h('button', { class: 'btn', onclick: () => printDoc(r) }, '🖨️ Imprimir o PDF'),
    ));
  }
  el.append(h('div', { class: 'actions sub' }, h('button', { class: 'btn ghost', onclick: () => {
    if (!hasContent(tool, d) || confirm('¿Borrar todo lo que escribiste en esta herramienta?')) { delete store.drafts[tool.id]; persist(); renderToolAgain(); }
  } }, 'Empezar de nuevo')));
}

function verdictEl([tone, title, items]) {
  const icons = { ok: '✅', warn: '⚠️', bad: '⛔', info: '✏️' };
  return h('div', { class: 'verdict ' + tone, role: 'status' },
    h('p', { class: 'v-t' }, h('span', { 'aria-hidden': 'true' }, icons[tone] + ' '), title),
    items && items.length ? h('ul', null, items.map(i => h('li', null, i))) : null,
  );
}

const asLines = t => (Array.isArray(t) ? t : [t]).map(txt).filter(Boolean);
function docEl(r) {
  return h('article', { class: 'doc ' + (r.layout || 'list') },
    h('h3', { class: 'doc-t' }, r.title),
    r.lead ? h('p', { class: 'doc-lead' }, r.lead) : null,
    h('div', { class: 'doc-body' }, r.blocks.map(([head, body, tone]) => {
      const lines = asLines(body);
      return h('section', { class: 'blk' + (tone ? ' ' + tone : '') },
        h('h4', null, head),
        lines.length ? lines.map(l => h('p', null, l)) : h('p', { class: 'empty' }, 'Sin completar'));
    })),
  );
}
function docText(r) {
  const out = [r.title.toUpperCase(), ''];
  if (r.lead) out.push(r.lead, '');
  for (const [head, body] of r.blocks) { const l = asLines(body); out.push(head, ...(l.length ? l : ['—']), ''); }
  return out.join('\n').trim();
}
async function copyDoc(r) {
  const t = docText(r);
  try { await navigator.clipboard.writeText(t); toast('Copiado. Pégalo en tu correo o presentación.'); }
  catch (e) {
    const ta = h('textarea', { style: 'position:fixed;opacity:0' }); ta.value = t; document.body.append(ta); ta.select();
    try { document.execCommand('copy'); toast('Copiado.'); } catch (e2) { toast('No pude copiar. Selecciona el texto a mano.'); }
    ta.remove();
  }
}
function printDoc(r, tool = current && current.tool) {
  const p = document.getElementById('print');
  p.innerHTML = '';
  p.append(h('p', { class: 'print-tool' }, tool ? `${tool.name} · Capítulo ${tool.ch}` : ''), docEl(r), h('p', { class: 'print-foot' }, `${BOOK.title} · ${BOOK.author} · ${fmtDate(Date.now())}`));
  window.print();
}

function saveCurrent() {
  const { tool, d } = current;
  const title = txt(d[tool.titleKey]) || tool.name;
  store.saved.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), tool: tool.id, title: title.length > 90 ? title.slice(0, 88) + '…' : title, date: Date.now(), data: { ...d } });
  persist();
  toast('Guardado en tu biblioteca.');
  const c = document.querySelector('.lib-link'); if (c) c.replaceWith(topbar(true).querySelector('.lib-link'));
}

// ---------------- Biblioteca ----------------
function renderLibrary(openId) {
  app.append(topbar(true));
  const main = h('main', { class: 'library' });
  main.append(h('h1', null, '📚 Mi biblioteca'));
  const item = openId && store.saved.find(s => s.id === openId);
  if (item && TOOL[item.tool]) {
    const tool = TOOL[item.tool];
    const r = tool.result({ ...tool.defaults, ...item.data });
    main.append(
      h('p', { class: 'eyebrow' }, `${tool.icon} ${tool.name} · guardado el ${fmtDate(item.date)}`),
      verdictEl(r.verdict),
      r.blocks.length ? docEl(r) : null,
      h('div', { class: 'actions' },
        h('button', { class: 'btn primary', onclick: () => {
          if (hasContent(tool, { ...tool.defaults, ...(store.drafts[tool.id] || {}) }) && !confirm('Esto reemplaza el borrador que tienes abierto en esa herramienta. ¿Continuar?')) return;
          store.drafts[tool.id] = { ...item.data }; persist(); go('#/h/' + tool.id);
        } }, '✏️ Editar'),
        h('button', { class: 'btn', onclick: () => copyDoc(r) }, '📋 Copiar texto'),
        h('button', { class: 'btn', onclick: () => printDoc(r, tool) }, '🖨️ Imprimir o PDF'),
        h('button', { class: 'btn ghost danger', onclick: () => {
          if (!confirm('¿Eliminar este documento de tu biblioteca?')) return;
          store.saved = store.saved.filter(s => s.id !== item.id); persist(); go('#/biblioteca');
        } }, 'Eliminar'),
      ),
      h('p', null, h('a', { href: '#/biblioteca' }, '← Todos los documentos')),
    );
  } else if (!store.saved.length) {
    main.append(h('div', { class: 'empty-state' },
      h('p', null, 'Todavía no guardaste nada.'),
      h('p', null, 'Cuando termines una herramienta, toca “Guardar en mi biblioteca” y la encontrarás aquí para editarla, copiarla o imprimirla antes de tu próxima reunión.'),
      h('a', { class: 'btn primary', href: '#/' }, 'Ver las herramientas')));
  } else {
    main.append(h('ul', { class: 'saved' }, store.saved.map(s => {
      const t = TOOL[s.tool];
      return h('li', null, h('a', { href: '#/biblioteca/' + s.id },
        h('span', { class: 'card-icon', 'aria-hidden': 'true' }, t ? t.icon : '📄'),
        h('span', { class: 'saved-main' }, h('span', { class: 'saved-t' }, s.title), h('span', { class: 'saved-d' }, `${t ? t.name : ''} · ${fmtDate(s.date)}`))));
    })));
    main.append(h('div', { class: 'actions sub' },
      h('button', { class: 'btn ghost', onclick: exportAll }, '⬇️ Descargar copia de seguridad'),
      h('label', { class: 'btn ghost' }, '⬆️ Restaurar copia', h('input', { type: 'file', accept: 'application/json', class: 'sr-only', onchange: importAll }))));
  }
  app.append(main);
}
function exportAll() {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `la-brecha-invisible-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importAll(e) {
  const file = e.target.files[0]; if (!file) return;
  file.text().then(t => {
    const s = JSON.parse(t);
    if (!s || !Array.isArray(s.saved)) throw new Error('formato');
    const known = new Set(store.saved.map(x => x.id));
    const add = s.saved.filter(x => x && x.id && TOOL[x.tool] && !known.has(x.id));
    store.saved = [...add, ...store.saved].sort((a, b) => b.date - a.date);
    persist(); toast(`Restaurados ${add.length} documentos.`); render();
  }).catch(() => toast('Ese archivo no es una copia de seguridad válida.'));
}

// ---------------- Inicio ----------------
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => { /* sin modo offline */ });
}

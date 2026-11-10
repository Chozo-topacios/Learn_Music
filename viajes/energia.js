// Modelo de energía para la Chery iCAR 03 / 03T (100% eléctrica, batería LFP).
// Es una estimación física sencilla: consumo base + subidas − regeneración en bajadas.
// Todos los valores por defecto se pueden cambiar en la pantalla de ajustes.

export const ICAR_DEFAULTS = {
  nombre: 'Chery iCAR 03T (4x4, 69,77 kWh)',
  bateriaKwh: 69.77,       // capacidad útil aproximada (versión iWD vendida en Colombia)
  autonomiaWltpKm: 421,    // homologación WLTP
  consumoBase: 18.5,       // kWh/100 km a ~90 km/h en plano (uso real, no WLTP)
  masaKg: 1900,            // vehículo + 2 personas + equipaje
  regeneracion: 0.6,       // fracción de la energía potencial recuperada al bajar
  reservaPct: 15,          // nunca planear llegar por debajo de esto
  cargaDcMaxPct: 80,       // en carga rápida DC se carga hasta aquí (después es muy lenta)
  potenciaDcKw: 90,        // potencia DC promedio realista
};

const G = 9.81;
const KWH = 3.6e6;
const EFICIENCIA_MOTOR = 0.9;

// Factor de velocidad: la resistencia aerodinámica crece con v².
function factorVelocidad(v) {
  const vel = Math.max(30, Math.min(130, v || 90));
  return 0.62 + 0.38 * (vel / 90) ** 2;
}

/**
 * tramo: { nombre, km, subida_m, bajada_m, velocidad_kmh }
 * Devuelve kWh netos del tramo (puede ser negativo si es una gran bajada).
 */
export function energiaTramo(tramo, p = ICAR_DEFAULTS) {
  const km = Math.max(0, Number(tramo.km) || 0);
  const subida = Math.max(0, Number(tramo.subida_m) || 0);
  const bajada = Math.max(0, Number(tramo.bajada_m) || 0);
  const base = (p.consumoBase / 100) * km * factorVelocidad(tramo.velocidad_kmh);
  const subir = (p.masaKg * G * subida) / KWH / EFICIENCIA_MOTOR;
  const recuperar = ((p.masaKg * G * bajada) / KWH) * p.regeneracion;
  return { base, subir, recuperar, neto: base + subir - recuperar };
}

/**
 * Simula el viaje tramo a tramo y decide dónde cargar.
 * opciones: { cargaInicialPct, cargadores: [indices de tramo tras los que hay carga] }
 */
export function planificarEnergia(tramos, opciones = {}, p = ICAR_DEFAULTS) {
  const cap = p.bateriaKwh;
  const reservaKwh = (p.reservaPct / 100) * cap;
  const salida = sugerirCargaSalida(tramos, p);
  const salidaPct = opciones.cargaInicialPct ?? salida.pct;
  let soc = (salidaPct / 100) * cap;
  const filas = [];
  let totalKwh = 0, totalKm = 0, subidaTotal = 0, bajadaTotal = 0, regenPerdida = 0;

  tramos.forEach((t, i) => {
    const e = energiaTramo(t, p);
    totalKwh += e.neto;
    totalKm += Number(t.km) || 0;
    subidaTotal += Number(t.subida_m) || 0;
    bajadaTotal += Number(t.bajada_m) || 0;
    const socInicio = soc;
    soc -= e.neto;
    // Con la batería llena no se puede regenerar: esa energía se pierde.
    if (soc > cap) { regenPerdida += soc - cap; soc = cap; }
    const socFinPct = (soc / cap) * 100;
    filas.push({
      tramo: t.nombre || `Tramo ${i + 1}`,
      km: Number(t.km) || 0,
      kwh: e.neto,
      socInicioPct: (socInicio / cap) * 100,
      socFinPct,
      bajoReserva: soc < reservaKwh,
      cargaDisponible: !!t.hay_carga_al_final,
    });
  });

  const consumoMedio = totalKm ? (totalKwh / totalKm) * 100 : 0;
  const autonomiaRealKm = consumoMedio > 0 ? (cap / consumoMedio) * 100 : 0;
  const energiaPorParada = ((p.cargaDcMaxPct - p.reservaPct) / 100) * cap;
  const faltante = totalKwh + reservaKwh - (salidaPct / 100) * cap;
  const paradasNecesarias = faltante > 0 ? Math.ceil(faltante / energiaPorParada) : 0;
  const minutosPorParada = Math.round((energiaPorParada / p.potenciaDcKw) * 60);
  const llegadaPct = ((salidaPct / 100) * cap - totalKwh) / cap * 100;

  const consejos = [salida.consejo];
  if (paradasNecesarias === 0) {
    consejos.push(llegadaPct < p.reservaPct + 10
      ? `Llegarías con ~${Math.round(llegadaPct)}%: es justo. Planea una carga corta de respaldo a mitad de camino.`
      : `Te alcanza sin cargar en ruta (llegarías con ~${Math.round(llegadaPct)}%). Igual ubica un cargador de respaldo.`);
  } else {
    consejos.push(`Necesitas aprox. ${paradasNecesarias} parada(s) de carga rápida DC (de ${p.reservaPct}% a ${p.cargaDcMaxPct}%, ~${minutosPorParada} min cada una).`);
  }
  consejos.push('La iCAR 03T es 100% eléctrica: no lleva gasolina. Lleva el cable de carga lenta para hoteles sin cargador.');
  consejos.push('En subidas largas, ir a 80–90 km/h en vez de 100+ te da 10–15% más de autonomía.');

  return {
    totalKm, totalKwh, consumoMedio, autonomiaRealKm, subidaTotal, bajadaTotal,
    regenPerdidaKwh: regenPerdida, paradasNecesarias, minutosPorParada, llegadaPct, filas,
    recomendacion: { cargaSalidaPct: salidaPct, consejos },
  };
}

// Cuánto cargar antes de salir.
export function sugerirCargaSalida(tramos, p = ICAR_DEFAULTS) {
  const primero = tramos[0] || {};
  const baja = Number(primero.bajada_m) || 0, sube = Number(primero.subida_m) || 0;
  if (baja > 800 && baja > sube * 2) {
    // Si arranca bajando (p. ej. desde Bogotá a tierra caliente), dejar espacio para regenerar.
    const regen = ((p.masaKg * G * baja) / KWH) * p.regeneracion;
    const pct = Math.max(85, 100 - Math.min(15, Math.round((regen / p.bateriaKwh) * 100)));
    return { pct, consejo: `El viaje empieza con una bajada fuerte (${baja} m): sal con ~${pct}% para que la regeneración no se desperdicie con la batería llena.` };
  }
  return { pct: 100, consejo: 'Carga al 100% en casa antes de salir. La batería es LFP: cargar al 100% es seguro y Chery lo recomienda para calibrar el indicador.' };
}

/** Pure teaching calculations. SI-derived units: mm, N, MPa, seconds/minutes.
 * Source series must remain in acquisition order; no sorting or outlier removal.
 * Control rules are preliminary screening, not proof of process stability.
 */
function fail(code: string): never { throw new Error(code); }
function finite(...values: number[]) { if (values.some(v => typeof v !== 'number' || !Number.isFinite(v))) fail('non_finite'); }
function positive(...values: number[]) { finite(...values); if (values.some(v => v <= 0)) fail('positive_required'); }
function nonnegative(...values: number[]) { finite(...values); if (values.some(v => v < 0)) fail('negative_value'); }
function integer(...values: number[]) { finite(...values); if (values.some(v => !Number.isSafeInteger(v))) fail('integer_required'); }

export function calculateOee(planned: number, run: number, cycle: number, total: number, good: number) {
  positive(planned, cycle); nonnegative(run, total, good); integer(total, good);
  if (run > planned || good > total || (total > 0 && run === 0)) fail('inconsistent_production');
  if (cycle * total > run * 60 + 1e-9) fail('cycle_exceeds_runtime');
  const availability = run / planned;
  const performance = run === 0 ? null : cycle * total / (run * 60);
  const quality = total === 0 ? null : good / total;
  // A shift with no production has zero effectiveness, undefined P/Q.
  const oee = performance === null || quality === null ? 0 : availability * performance * quality;
  if (![availability, performance ?? 0, quality ?? 0, oee].every(Number.isFinite)) fail('numeric_overflow');
  return { availability, performance, quality, oee, downtimeMinutes: planned - run, rejected: total - good };
}

export function capability(values: readonly number[], lsl: number, usl: number) {
  finite(lsl, usl); if (lsl >= usl) fail('invalid_limits');
  if (!Array.isArray(values) || values.length < 3) fail('series_too_short');
  if (values.length > 10000) fail('series_too_long');
  finite(...values);
  const n = values.length, mean = values.reduce((sum, v) => sum + v, 0) / n;
  const sampleSigma = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1));
  const movingRanges = values.slice(1).map((v, i) => Math.abs(v - values[i]));
  const mrbar = movingRanges.reduce((sum, v) => sum + v, 0) / movingRanges.length;
  const withinSigma = mrbar / 1.128;
  if (!Number.isFinite(mean) || !Number.isFinite(sampleSigma) || !Number.isFinite(withinSigma)) fail('numeric_overflow');
  if (sampleSigma === 0 || withinSigma === 0) fail('zero_variation');
  const ucl = mean + 3 * withinSigma, lcl = mean - 3 * withinSigma;
  const outsideControl: number[] = [], sameSideRuns: number[] = [], trends: number[] = [];
  values.forEach((v, i) => { if (v > ucl || v < lcl) outsideControl.push(i); });
  for (let i = 7; i < n; i++) {
    const window = values.slice(i - 7, i + 1);
    if (window.every(v => v > mean) || window.every(v => v < mean)) sameSideRuns.push(i);
  }
  for (let i = 5; i < n; i++) {
    const differences = values.slice(i - 4, i + 1).map((v, j) => v - values[i - 5 + j]);
    if (differences.every(v => v > 0) || differences.every(v => v < 0)) trends.push(i);
  }
  const cp = (usl - lsl) / (6 * withinSigma);
  const cpk = Math.min(usl - mean, mean - lsl) / (3 * withinSigma);
  const pp = (usl - lsl) / (6 * sampleSigma);
  const ppk = Math.min(usl - mean, mean - lsl) / (3 * sampleSigma);
  if (![cp, cpk, pp, ppk, ucl, lcl].every(Number.isFinite)) fail('numeric_overflow');
  const outOfSpec = values.filter(v => v < lsl || v > usl).length;
  return { n, mean, mrbar, withinSigma, sampleSigma, cp, cpk, pp, ppk, ucl, lcl,
    outOfSpec, ppm: outOfSpec / n * 1e6,
    stable: outsideControl.length === 0 && sameSideRuns.length === 0 && trends.length === 0,
    preliminary: n < 30,
    timeOrderRequired: true,
    violations: { outsideControl, sameSideRuns, trends },
  };
}

export function spring(d: number, D: number, L0: number, active: number, total: number, force: number) {
  positive(d, D, L0, active, total); nonnegative(force);
  if (D <= d || total < active || L0 <= total * d) fail('invalid_spring_geometry');
  const G = 78500, densityKgPerMm3 = 7850e-9;
  const index = D / d, wahl = (4 * index - 1) / (4 * index - 4) + 0.615 / index;
  const rate = G * d ** 4 / (8 * D ** 3 * active);
  const solidHeight = total * d, availableDeflection = L0 - solidHeight;
  const deflection = force / rate, length = L0 - deflection;
  const stress = wahl * 8 * force * D / (Math.PI * d ** 3);
  const solidForce = rate * availableDeflection;
  const mass = Math.PI * (d / 2) ** 2 * Math.PI * D * active * densityKgPerMm3;
  const frequency = 0.5 / (2 * Math.PI) * Math.sqrt(rate * 1000 / mass);
  // 880 MPa is an explicit illustrative allowance, not a certified material limit.
  const illustrativeAllowance = 880;
  const overload = stress > illustrativeAllowance, solid = deflection >= availableDeflection;
  if (![index, wahl, rate, solidHeight, deflection, length, stress, solidForce, mass, frequency].every(Number.isFinite)) fail('numeric_overflow');
  return { index, wahl, rate, solidHeight, availableDeflection, deflection, length,
    stress, solidForce, mass, frequency, illustrativeAllowance,
    stressRatio: stress / illustrativeAllowance,
    safetyFactor: force === 0 ? null : illustrativeAllowance / stress,
    solid, overload,
    warnings: [solid ? 'solid_contact' : '', overload ? 'illustrative_overload' : '', index < 4 || index > 12 ? 'spring_index_outside_teaching_range' : ''].filter(Boolean),
  };
}

export function energy(start: number, end: number, tonnage: number, costPerUnit: number) {
  nonnegative(start, end, tonnage, costPerUnit); if (end < start) fail('reversed_meter');
  const consumption = end - start, cost = consumption * costPerUnit;
  const intensity = tonnage === 0 ? null : consumption / tonnage;
  if (![consumption, cost, intensity ?? 0].every(Number.isFinite)) fail('numeric_overflow');
  return { consumption, intensity, cost };
}

export function parseSeries(text: string): number[] {
  if (typeof text !== 'string' || text.length > 200000) fail('invalid_series');
  const normalized = text.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/٫/g, '.').replace(/٬/g, '').replace(/،/g, ',').trim();
  if (!normalized) fail('empty_series');
  const tokens = normalized.split(/[\s,;]+/);
  if (tokens.length > 10000) fail('series_too_long');
  const values = tokens.map(token => {
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(token)) fail('invalid_number');
    const value = Number(token); finite(value); return value;
  });
  return values;
}

export function wilson(defects: number, count: number) {
  nonnegative(defects); positive(count); integer(defects, count);
  if (defects > count) fail('defects_exceed_count');
  const z = 1.959963984540054, rate = defects / count, denominator = 1 + z * z / count;
  const center = (rate + z * z / (2 * count)) / denominator;
  const margin = z * Math.sqrt(rate * (1 - rate) / count + z * z / (4 * count * count)) / denominator;
  return { rate, lower: Math.max(0, center - margin), upper: Math.min(1, center + margin), confidence: 0.95 };
}

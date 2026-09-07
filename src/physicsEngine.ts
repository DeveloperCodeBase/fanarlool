// Industrial Spring Physics Engine based on DIN EN 13906-1 & Automotive Suspension Specifications
// For Iran Coil Spring Co. (کارخانه فنر لول ایران)

export interface SpringCalculationResult {
  springIndex_C: number;
  wahlFactor_Kw: number;
  springRate_k: number;          // N/mm
  deflection_mm: number;         // mm at given load F
  currentLength_mm: number;      // mm
  shearStress_MPa: number;       // MPa (corrected by Wahl factor)
  allowableStress_MPa: number;   // MPa (e.g., ~1050 MPa for shot-peened 54SiCr6)
  stressRatioPercent: number;    // % of allowable
  solidHeight_Hs: number;        // mm
  maxDeflectionToSolid_mm: number;
  naturalFrequency_Hz: number;   // First resonant harmonic in Hz
  estimatedFatigueCycles: number;// Projected fatigue life cycles
  safetyFactor: number;
}

/**
 * Calculates physical properties of a helical compression spring
 * @param d Wire diameter (mm)
 * @param D Mean coil diameter (mm)
 * @param L0 Free length (mm)
 * @param na Number of active coils
 * @param nt Total number of coils
 * @param F Applied vertical compressive force (N)
 * @param shotPeened Whether the spring has undergone shot peening
 */
export function calculateSpringPhysics(
  d: number,
  D: number,
  L0: number,
  na: number,
  nt: number,
  F: number,
  shotPeened: boolean = true
): SpringCalculationResult {
  const G = 78500; // Shear Modulus for spring steel (54SiCr6 / 55Cr3) in MPa (N/mm^2)
  const density = 7850e-9; // kg/mm^3
  
  // Spring index C = D / d
  const C = D / d;
  
  // Wahl stress concentration correction factor
  // Kw = (4C - 1) / (4C - 4) + 0.615 / C
  const Kw = ((4 * C - 1) / (4 * C - 4)) + (0.615 / C);
  
  // Spring rate k = (G * d^4) / (8 * D^3 * na)
  const k = (G * Math.pow(d, 4)) / (8 * Math.pow(D, 3) * na);
  
  // Deflection under load F: s = F / k
  const deflection_mm = Math.max(0, F / (k || 1));
  
  // Solid height Hs (squared and ground ends) Hs = nt * d
  const solidHeight_Hs = nt * d;
  const maxDeflectionToSolid_mm = Math.max(0, L0 - solidHeight_Hs);
  
  // Actual deflection clamped to solid height
  const actualDeflection = Math.min(deflection_mm, maxDeflectionToSolid_mm);
  const currentLength_mm = Math.max(solidHeight_Hs, L0 - actualDeflection);
  
  // Torsional shear stress: tau = Kw * (8 * F * D) / (pi * d^3)
  const shearStress_MPa = Kw * ((8 * F * D) / (Math.PI * Math.pow(d, 3)));
  
  // Allowable torsional shear stress for 54SiCr6
  // With shot peening, allowable stress increases from ~850 MPa to ~1100 MPa
  const allowableStress_MPa = shotPeened ? 1120 : 880;
  const stressRatioPercent = Math.min(100, Math.round((shearStress_MPa / allowableStress_MPa) * 100));
  const safetyFactor = Math.max(0.5, Number((allowableStress_MPa / (shearStress_MPa || 1)).toFixed(2)));
  
  // Fundamental natural frequency: f = (1 / 2) * sqrt(k / m) or 0.5 * (d / (pi * D^2 * na)) * sqrt(G / (2 * rho))
  const wireLength = Math.PI * D * na;
  const activeMass = (Math.PI * Math.pow(d / 2, 2) * wireLength) * density; // in kg
  const naturalFrequency_Hz = activeMass > 0 ? (0.5 * Math.sqrt((k * 1000) / activeMass)) / (2 * Math.PI) : 45;
  
  // Estimated fatigue cycles using modified Goodman / Basquin approximation
  // Automotive suspension requirement: usually > 300,000 to 500,000 cycles
  let estimatedCycles = 800000;
  if (stressRatioPercent > 90) {
    estimatedCycles = Math.round(150000 * Math.pow((100 / stressRatioPercent), 3));
  } else if (stressRatioPercent > 70) {
    estimatedCycles = Math.round(450000 * Math.pow((80 / stressRatioPercent), 2));
  } else {
    estimatedCycles = 1250000;
  }
  if (!shotPeened) {
    estimatedCycles = Math.round(estimatedCycles * 0.45);
  }

  return {
    springIndex_C: Number(C.toFixed(2)),
    wahlFactor_Kw: Number(Kw.toFixed(3)),
    springRate_k: Number(k.toFixed(2)),
    deflection_mm: Number(actualDeflection.toFixed(2)),
    currentLength_mm: Number(currentLength_mm.toFixed(2)),
    shearStress_MPa: Number(shearStress_MPa.toFixed(1)),
    allowableStress_MPa,
    stressRatioPercent,
    solidHeight_Hs: Number(solidHeight_Hs.toFixed(1)),
    maxDeflectionToSolid_mm: Number(maxDeflectionToSolid_mm.toFixed(1)),
    naturalFrequency_Hz: Math.round(naturalFrequency_Hz),
    estimatedFatigueCycles: estimatedCycles,
    safetyFactor,
  };
}

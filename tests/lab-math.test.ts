import { describe, expect, test } from 'bun:test';
import { calculateOee, capability, spring, energy, parseSeries, wilson } from '../src/components/labMath';

describe('engineering laboratory calculations', () => {
  test('OEE uses consistent production times and preserves undefined ratios for an empty shift', () => {
    const result = calculateOee(480, 400, 10, 1800, 1710);
    expect(result.availability).toBeCloseTo(400 / 480, 12);
    expect(result.performance).toBeCloseTo(0.75, 12);
    expect(result.quality).toBeCloseTo(0.95, 12);
    expect(result.oee).toBeCloseTo(0.59375, 12);
    expect(result.downtimeMinutes).toBe(80);
    expect(result.rejected).toBe(90);
    expect(calculateOee(480, 0, 10, 0, 0)).toMatchObject({ oee: 0, performance: null, quality: null });
    expect(calculateOee(480, 100, 10, 0, 0)).toMatchObject({ oee: 0, performance: 0, quality: null });
    expect(() => calculateOee(480, 481, 10, 1, 1)).toThrow('inconsistent_production');
    expect(() => calculateOee(480, 400, 10, 2401, 2400)).toThrow('cycle_exceeds_runtime');
    expect(() => calculateOee(480, 400, 10, 100, 101)).toThrow('inconsistent_production');
  });

  test('SPC distinguishes moving-range capability from overall performance and screens ordered trends', () => {
    const values = [0, 1, 2, 3, 4, 5];
    const result = capability(values, -1, 6);
    expect(result.mean).toBeCloseTo(2.5, 12);
    expect(result.mrbar).toBeCloseTo(1, 12);
    expect(result.withinSigma).toBeCloseTo(1 / 1.128, 12);
    expect(result.sampleSigma).toBeCloseTo(Math.sqrt(3.5), 12);
    expect(result.cp).toBeCloseTo(7 / (6 / 1.128), 12);
    expect(result.cpk).toBeCloseTo(3.5 / (3 / 1.128), 12);
    expect(result.pp).toBeCloseTo(7 / (6 * Math.sqrt(3.5)), 12);
    expect(result.ppk).toBeCloseTo(3.5 / (3 * Math.sqrt(3.5)), 12);
    expect(result.ppk).not.toBeCloseTo(result.cpk * 0.96, 5);
    expect(result.violations.trends).toEqual([5]);
    expect(result.stable).toBe(false);
    expect(result.timeOrderRequired).toBe(true);
    expect(result.preliminary).toBe(true);
    expect(() => capability([1, 1, 1], 0, 2)).toThrow('zero_variation');
    expect(() => capability([1, 2, 3], 2, 1)).toThrow('invalid_limits');
  });

  test('spring stiffness follows dimensions and reports excessive load without clipping', () => {
    const reference = spring(12, 100, 300, 6, 8, 1000);
    expect(reference.rate).toBeCloseTo(33.912, 10);
    expect(reference.solidHeight).toBe(96);
    expect(reference.deflection).toBeCloseTo(1000 / 33.912, 10);
    expect(reference.solid).toBe(false);
    const overloaded = spring(12, 100, 300, 6, 8, 100000);
    expect(overloaded.stressRatio).toBeGreaterThan(1);
    expect(overloaded.safetyFactor).toBeLessThan(0.5);
    expect(overloaded.overload).toBe(true);
    expect(overloaded.solid).toBe(true);
    expect(overloaded.warnings).toContain('solid_contact');
    expect(overloaded.warnings).toContain('illustrative_overload');
    expect(spring(12, 100, 300, 6, 8, 0).safetyFactor).toBeNull();
    expect(() => spring(0, 100, 300, 6, 8, 1000)).toThrow('positive_required');
    expect(() => spring(12, 12, 300, 6, 8, 1000)).toThrow('invalid_spring_geometry');
    expect(() => spring(12, 100, 300, 8, 6, 1000)).toThrow('invalid_spring_geometry');
  });

  test('energy costs use meter differences, and zero tonnage has no invented intensity', () => {
    expect(energy(1000, 1600, 2, 1500)).toEqual({ consumption: 600, intensity: 300, cost: 900000 });
    expect(energy(1000, 1600, 0, 1500).intensity).toBeNull();
    expect(() => energy(1000, 999, 2, 1500)).toThrow('reversed_meter');
    expect(() => energy(0, Infinity, 2, 1500)).toThrow('non_finite');
    expect(() => energy(0, 600, 2, -1500)).toThrow('negative_value');
  });

  test('series parsing accepts localized digits but rejects malformed and nonfinite measurements', () => {
    expect(parseSeries('۱٫۲; ٢٫٥\n۳٬۰۰۰, -۴.۵')).toEqual([1.2, 2.5, 3000, -4.5]);
    expect(parseSeries('1e2 2.5e-1')).toEqual([100, 0.25]);
    expect(() => parseSeries('')).toThrow('empty_series');
    expect(() => parseSeries('1;2mm;3')).toThrow('invalid_number');
    expect(() => parseSeries('1;1e999;3')).toThrow('non_finite');
  });

  test('Wilson intervals retain uncertainty for zero or all defects and validate counts', () => {
    const none = wilson(0, 100), all = wilson(100, 100);
    expect(none.rate).toBe(0);
    expect(none.lower).toBeCloseTo(0, 12);
    expect(none.upper).toBeCloseTo(0.0369934982, 9);
    expect(all.rate).toBe(1);
    expect(all.upper).toBeCloseTo(1, 12);
    expect(all.lower).toBeCloseTo(1 - none.upper, 12);
    expect(none.confidence).toBe(0.95);
    expect(() => wilson(1, 0)).toThrow('positive_required');
    expect(() => wilson(101, 100)).toThrow('defects_exceed_count');
    expect(() => wilson(0.5, 100)).toThrow('integer_required');
  });
});

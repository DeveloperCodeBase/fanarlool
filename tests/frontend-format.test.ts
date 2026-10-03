import {test,expect} from 'bun:test';
import {csvCell} from '../src/platform/csv';
import {fromJalaliDate,toJalaliDate,tehranDate} from '../src/platform/calendar';
test('CSV protects formula payloads with whitespace and preserves quoted multiline data',()=>{
 for(const value of ['=SUM(A1)','  +1','\t@SUM(1)','\r\n-1','\uFEFF=1'])expect(csvCell(value)).toBe('"\''+value+'"');
 expect(csvCell('شرح "قطعه"\nخط ۱')).toBe('"شرح ""قطعه""\nخط ۱"');
 expect(csvCell(125)).toBe('"125"');expect(csvCell(null)).toBe('""');
});
test('Jalali input round trips ISO dates and rejects invalid month and leap days',()=>{
 expect(toJalaliDate('2026-10-03')).toBe('1405/07/11');expect(fromJalaliDate('۱۴۰۵/۰۷/۱۱')).toBe('2026-10-03');expect(fromJalaliDate('١٤٠٥/٠٧/١١')).toBe('2026-10-03');
 expect(fromJalaliDate('1403/12/30')).toBe('2025-03-20');expect(fromJalaliDate('1404/12/30')).toBeNull();expect(fromJalaliDate('1405/07/31')).toBeNull();expect(fromJalaliDate('1405/13/01')).toBeNull();expect(toJalaliDate('2026-02-30')).toBe('');
 for(const iso of ['2026-03-21','2024-02-29','2026-12-31'])expect(fromJalaliDate(toJalaliDate(iso))).toBe(iso);
 expect(tehranDate(new Date('2026-10-03T22:00:00Z'))).toBe('2026-10-04');
});

/**
 * #12 (B9) hour 점수 십이신 월건 절기 기준, #16 일운 등급
 */
import { calculateSaju } from '../src/lib/saju.js';
import { analyzeIljin } from '../src/lib/iljin_analysis.js';
import { getDailyFortune } from '../src/lib/fortune.js';

const saju = calculateSaju('1998-06-09', '10:30', 'solar', false, 'male', '서울');

describe('#12 십이신(建除)은 절기 월건 기준', () => {
  test('2026-11-09 亥일, 입동 후 亥월 → 건', () => {
    expect(analyzeIljin(new Date('2026-11-09T12:00:00+09:00'), saju).twelveGods.name).toBe('건');
  });
  test('2026-11-03 巳일, 입동 전 戌월 → 위', () => {
    expect(analyzeIljin(new Date('2026-11-03T12:00:00+09:00'), saju).twelveGods.name).toBe('위');
  });
  test('2027-01-08 亥일, 소한 후 丑월 → 개', () => {
    expect(analyzeIljin(new Date('2027-01-08T12:00:00+09:00'), saju).twelveGods.name).toBe('개');
  });
});

describe('#16 일운 등급 (overallLuck 기준)', () => {
  test.each([
    ['2026-11-11', 76, '◎'],
    ['2026-11-01', 65, '○'],
    ['2026-11-12', 57, '△'],
    ['2026-11-09', 40, '×'],
  ])('%s overall %i → %s', (date, overall, grade) => {
    const f = getDailyFortune(saju, date);
    expect(f.overallLuck).toBe(overall);
    expect(f.grade).toBe(grade);
  });
});

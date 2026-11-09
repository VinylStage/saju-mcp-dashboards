/**
 * 2026-11-09 유지보수 요청 회귀 테스트 (B1, B2, B3, B4)
 *
 * 고정 입력: 1998-06-09 10:30 남성 서울 → 戊寅 戊午 丁亥 乙巳
 */

import { calculateSaju } from '../src/lib/saju.js';
import { handleGetFortuneByPeriod } from '../src/tools/get_fortune_by_period.js';
import { analyzeIljin } from '../src/lib/iljin_analysis.js';
import { getDailyFortune } from '../src/lib/fortune.js';
import { WUXING_DATA } from '../src/data/wuxing.js';

const BASE = {
  birthDate: '1998-06-09',
  birthTime: '10:30',
  birthCity: '서울',
  gender: 'male' as const,
};

const saju = calculateSaju('1998-06-09', '10:30', 'solar', false, 'male', '서울');

function monthOf(target: string) {
  return JSON.parse(handleGetFortuneByPeriod({ ...BASE, periodType: 'month', target }));
}

describe('B1 월운 간지: 양력 월 M → 그 달 절입 이후 월건', () => {
  test('사주 원국 확인', () => {
    expect(`${saju.year.stem}${saju.year.branch}`).toBe('무인');
    expect(`${saju.month.stem}${saju.month.branch}`).toBe('무오');
    expect(`${saju.day.stem}${saju.day.branch}`).toBe('정해');
    expect(`${saju.hour.stem}${saju.hour.branch}`).toBe('을사');
  });

  test('2026-11 → 기해월, 입동(11/7) 기준, 절입 전은 무술월', () => {
    const r = monthOf('2026-11');
    expect(r.ganjiName).toBe('기해월');
    expect(r.solarTerm).toBe('입동');
    expect(r.termStart.startsWith('2026-11-07')).toBe(true);
    expect(r.termEnd.startsWith('2026-12-07')).toBe(true);
    expect(r.beforeTermGanjiName).toBe('무술월');
  });

  test('2026-12 → 경자월, 대설', () => {
    const r = monthOf('2026-12');
    expect(r.ganjiName).toBe('경자월');
    expect(r.solarTerm).toBe('대설');
    expect(r.beforeTermGanjiName).toBe('기해월');
  });

  test('2027-01 → 신축월 (입춘 전이므로 丙午년 월건), 소한', () => {
    const r = monthOf('2027-01');
    expect(r.ganjiName).toBe('신축월');
    expect(r.solarTerm).toBe('소한');
    expect(r.beforeTermGanjiName).toBe('경자월');
  });

  test('2026-02 → 경인월, 입춘', () => {
    const r = monthOf('2026-02');
    expect(r.ganjiName).toBe('경인월');
    expect(r.solarTerm).toBe('입춘');
    expect(r.beforeTermGanjiName).toBe('기축월');
  });
});

describe('B4 길일/주의일: 실제 일진 기반', () => {
  test('11월과 12월 길일/주의일이 고정 템플릿이 아님', () => {
    const nov = monthOf('2026-11');
    const dec = monthOf('2026-12');
    expect(nov.luckyDays).not.toEqual([5, 10, 15, 20, 25, 30]);
    expect(nov.cautionDays).not.toEqual([7, 14, 21, 28]);
    expect(nov.luckyDays).not.toEqual(dec.luckyDays);
  });

  test('2026-11: 巳일(일지 亥와 충)은 주의일, 寅일(육합)은 길일', () => {
    const nov = monthOf('2026-11');
    expect(nov.cautionDays).toContain(3); // 11/3 辛巳
    expect(nov.cautionDays).not.toContain(9); // 11/9 丁亥
    expect(nov.luckyDays).toContain(12); // 11/12 庚寅
  });
});

describe('B2 relationWithSaju: 연·월·일·시지 전체 검사', () => {
  test('2026-11-09 丁亥: 시지 巳亥충, 연지 寅亥합, 일지 복음', () => {
    const r = analyzeIljin(new Date(2026, 10, 9, 12), saju);
    expect(r.dayPillar).toBe('정해');
    expect(r.relationWithSaju.harmony).toBe(true);
    expect(r.relationWithSaju.conflict).toBe(true);
    const rel = r.relationWithSaju.relations.map((x) => `${x.pillar}:${x.type}`);
    expect(rel).toContain('hour:충');
    expect(rel).toContain('year:육합');
    expect(rel).toContain('day:복음');
  });

  test('2026-11-10 戊子: 월지 子午충', () => {
    const r = analyzeIljin(new Date(2026, 10, 10, 12), saju);
    expect(r.dayPillar).toBe('무자');
    expect(r.relationWithSaju.conflict).toBe(true);
    const rel = r.relationWithSaju.relations.map((x) => `${x.pillar}:${x.type}`);
    expect(rel).toContain('month:충');
  });

  test('2026-11-03 辛巳: 연지 寅巳형, 일지 巳亥충', () => {
    const r = analyzeIljin(new Date(2026, 10, 3, 12), saju);
    const rel = r.relationWithSaju.relations.map((x) => `${x.pillar}:${x.type}`);
    expect(rel).toContain('year:형');
    expect(rel).toContain('day:충');
  });
});

describe('B3 get_daily_fortune: luckyColor/advice가 용신과 모순되지 않음', () => {
  const f = getDailyFortune(saju, '2026-11-09');
  const yong = saju.yongSin!.primaryYongSin;

  test('luckyColor = 용신 오행 색', () => {
    expect(f.luckyColor).toBe(WUXING_DATA[yong].color[0]);
    expect(f.luckyDirection).toBe(WUXING_DATA[yong].direction);
  });

  test('advice는 원국 일간이 아닌 당일 일진과 용신을 언급', () => {
    expect(f.advice).not.toContain('화 기운이 강한 날');
    expect(f.advice).toContain('정해');
    expect(f.advice).toContain(yong);
  });
});

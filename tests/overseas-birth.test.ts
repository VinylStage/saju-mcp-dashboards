/**
 * #11 (B8) 해외 출생: 경도·타임존(역사적 DST) 직접 입력, 자시 처리 옵션
 */
import { calculateSaju } from '../src/lib/saju.js';
import { calculateDaeUn } from '../src/lib/dae_un.js';
import { handleToolCall } from '../src/core/tool-handler.js';
import { getToolSchema } from '../src/core/tool-definitions.js';

const pillar = (p: { stem: string; branch: string }) => p.stem + p.branch;

describe('경도·타임존 직접 입력', () => {
  test('서울 좌표를 직접 넣으면 birthCity 서울과 같은 사주', () => {
    const a = calculateSaju('1998-06-09', '10:30', 'solar', false, 'male', '서울');
    const b = calculateSaju('1998-06-09', '10:30', 'solar', false, 'male', undefined, {
      longitude: 126.9784, timezone: 'Asia/Seoul',
    });
    expect([a.year, a.month, a.day, a.hour].map(pillar)).toEqual([b.year, b.month, b.day, b.hour].map(pillar));
  });

  test('뉴욕 1990-07-15 23:30 (EDT): 지방평균태양시 22:34 → 해시, 같은 날 일주', () => {
    const ny = calculateSaju('1990-07-15', '23:30', 'solar', false, 'male', undefined, {
      longitude: -74.006, timezone: 'America/New_York',
    });
    const sameDate = calculateSaju('1990-07-15', '12:00', 'solar', false, 'male', '서울');
    expect(ny.hour.branch).toBe('해');
    expect(pillar(ny.day)).toBe(pillar(sameDate.day));
  });

  test('해외 출생 대운 계산 및 시작 일자', () => {
    const ny = calculateSaju('1990-07-15', '23:30', 'solar', false, 'male', undefined, {
      longitude: -74.006, timezone: 'America/New_York',
    });
    const d = calculateDaeUn(ny);
    expect(d[0]!.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('잘못된 타임존은 한국어 오류', () => {
    expect(() =>
      calculateSaju('1990-07-15', '23:30', 'solar', false, 'male', undefined, { timezone: 'Mars/Base' })
    ).toThrow('타임존');
  });

  test('경도 범위 밖은 한국어 오류', () => {
    expect(() =>
      calculateSaju('1990-07-15', '23:30', 'solar', false, 'male', undefined, { longitude: 200 })
    ).toThrow('경도');
  });
});

describe('자시(子時) 처리 옵션', () => {
  // 서울 23:40 → 경도 보정 23:08 → 자시
  test('same-day(기본): 일주는 당일', () => {
    const r = calculateSaju('1998-06-09', '23:40', 'solar', false, 'male', '서울');
    expect(r.hour.branch).toBe('자');
    expect(pillar(r.day)).toBe('정해');
  });
  test('next-day: 일주는 다음 날', () => {
    const r = calculateSaju('1998-06-09', '23:40', 'solar', false, 'male', '서울', { ziHourMode: 'next-day' });
    expect(r.hour.branch).toBe('자');
    expect(pillar(r.day)).toBe('무자');
  });
});

describe('도구 인터페이스', () => {
  test.each(['analyze_saju', 'get_daily_fortune', 'get_dae_un', 'get_fortune_by_period'])('%s 스키마', (name) => {
    const props = getToolSchema(name)!.inputSchema.properties!;
    expect(props).toHaveProperty('birthLongitude');
    expect(props).toHaveProperty('birthTimezone');
    expect(props).toHaveProperty('ziHourMode');
  });

  test('analyze_saju basic에 해외 좌표 반영', async () => {
    const r = JSON.parse(
      await handleToolCall('analyze_saju', {
        analysisType: 'basic', birthDate: '1990-07-15', birthTime: '23:30', gender: 'male',
        birthLongitude: -74.006, birthTimezone: 'America/New_York',
      })
    );
    expect(r.hour.branch).toBe('해');
  });
});

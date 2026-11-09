/**
 * 절(節) 목록 및 대운 기산 검증 (TD-008)
 *
 * 소설(小雪)은 중기(中氣), 소한(小寒)은 절(節)이다.
 * 대운 기산은 절만 사용해야 한다.
 */

import {
  SOLAR_TERMS_JIE,
  getNextJieSolarTermByInstant,
  getPreviousJieSolarTermByInstant,
} from '../src/data/solar_terms.js';
import { calculateSaju } from '../src/lib/saju.js';
import { calculateDaeUn } from '../src/lib/dae_un.js';

describe('SOLAR_TERMS_JIE 구성', () => {
  test('12절(節)만 포함해야 함 (소한 포함, 소설 제외)', () => {
    expect([...SOLAR_TERMS_JIE].sort()).toEqual(
      ['소한', '입춘', '경칩', '청명', '입하', '망종', '소서', '입추', '백로', '한로', '입동', '대설'].sort()
    );
  });
});

describe('절(節) 탐색', () => {
  test('12월 중순 출생의 다음 절은 소한', () => {
    const term = getNextJieSolarTermByInstant(new Date('2020-12-20T12:00:00+09:00'));
    expect(term?.term).toBe('소한');
    expect(term?.datetime).toBe('2021-01-05T12:05:00+09:00');
  });

  test('11월 말 출생의 이전 절은 입동 (소설 아님)', () => {
    const term = getPreviousJieSolarTermByInstant(new Date('2021-11-28T12:00:00+09:00'));
    expect(term?.term).toBe('입동');
    expect(term?.datetime).toBe('2021-11-07T13:41:00+09:00');
  });
});

describe('대운 시작 나이', () => {
  test('경자년(양) 남성 2020-12-20 12:00 순행 → 소한(01-05 12:05)까지 약 16.0일 → 5세', () => {
    const saju = calculateSaju('2020-12-20', '12:00', 'solar', false, 'male', '서울');
    expect(saju.year.yinYang).toBe('양');
    expect(calculateDaeUn(saju)[0]?.startAge).toBe(5);
  });

  test('신축년(음) 남성 2021-11-28 12:00 역행 → 입동(11-07 13:41)부터 약 20.9일 → 6세', () => {
    const saju = calculateSaju('2021-11-28', '12:00', 'solar', false, 'male', '서울');
    expect(saju.year.yinYang).toBe('음');
    expect(calculateDaeUn(saju)[0]?.startAge).toBe(6);
  });
});

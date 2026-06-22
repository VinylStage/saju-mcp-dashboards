/**
 * 신살(神殺) 탐지 정확성 검증
 *
 * 도화살: 연지/일지 기준 삼합 그룹 → 도화지 존재 여부
 * 원진살: 원진살 쌍(자↔미, 축↔오, 인↔유, 묘↔신, 진↔해, 사↔술) 존재 여부
 */

import { calculateSaju } from '../src/lib/saju.js';

describe('도화살 (桃花殺) 탐지', () => {
  test('1998-06-09 10:30 남성 — 도화살 없어야 함 (연지 인→묘 없음, 일지 해→자 없음)', () => {
    // 사주: 戊寅 戊午 丁亥 乙巳 (지지: 인·오·해·사)
    // 연지 인(인오술 삼합) → 도화지 묘 → 묘 없음
    // 일지 해(해묘미 삼합) → 도화지 자 → 자 없음
    const result = calculateSaju('1998-06-09', '10:30', 'solar', false, 'male');
    expect(result.sinSals).not.toContain('도화살');
  });

  test('1998-03-15 06:00 남성 — 도화살 있어야 함 (연지 인→묘, 시지 묘 존재)', () => {
    // 무인년(연지 인), 묘월, 묘시 → 인오술 삼합 → 도화지 묘 → 묘 존재
    const result = calculateSaju('1998-03-15', '06:00', 'solar', false, 'male');
    expect(result.sinSals).toContain('도화살');
  });
});

describe('원진살 (元辰殺) 탐지', () => {
  test('1998-06-09 10:30 남성 — 원진살 없어야 함 (사·해는 충이지 원진살 아님)', () => {
    // 사주: 戊寅 戊午 丁亥 乙巳 (지지: 인·오·해·사)
    // 원진살 쌍: 자↔미, 축↔오, 인↔유, 묘↔신, 진↔해, 사↔술
    // 위 지지 중 원진살 쌍 없음
    const result = calculateSaju('1998-06-09', '10:30', 'solar', false, 'male');
    expect(result.sinSals).not.toContain('원진살');
  });

  test('2008-07-15 23:30 남성 — 원진살 있어야 함 (연지 자·월지 미)', () => {
    // 무자년(연지 자), 미월(소서~대서) → 자·미 원진살 쌍 존재
    const result = calculateSaju('2008-07-15', '23:30', 'solar', false, 'male');
    expect(result.sinSals).toContain('원진살');
  });
});

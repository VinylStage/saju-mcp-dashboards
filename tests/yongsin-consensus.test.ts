/**
 * #9 (B6) 용신 방법 간 합의/충돌 요약
 */
import { calculateSaju } from '../src/lib/saju.js';
import { summarizeYongSinConsensus, YongSinSelector } from '../src/lib/yongsin/selector.js';
import { handleAnalyzeSaju } from '../src/tools/analyze_saju.js';

const saju = calculateSaju('1998-06-09', '10:30', 'solar', false, 'male', '서울');
const ELEMENTS = ['목', '화', '토', '금', '수'];

describe('summarizeYongSinConsensus', () => {
  const c = summarizeYongSinConsensus(saju);

  test('4개 방법 결과 포함', () => {
    expect(Object.keys(c.methods).sort()).toEqual(['disease', 'mediation', 'seasonal', 'strength']);
  });

  test('오행은 agreedFavorable/agreedUnfavorable/conflicting/neutral 중 정확히 하나', () => {
    const all = [...c.agreedFavorable, ...c.agreedUnfavorable, ...c.conflicting, ...c.neutral].sort();
    expect(all).toEqual([...ELEMENTS].sort());
  });

  test('토는 strength 용신, seasonal 구신 → conflicting', () => {
    expect(c.methods.strength.primaryYongSin).toBe('토');
    expect(c.methods.seasonal.chouSin).toContain('토');
    expect(c.conflicting).toContain('토');
  });

  test('ranking은 신뢰도 가중 점수 내림차순, 5개 오행', () => {
    expect(c.ranking).toHaveLength(5);
    for (let i = 1; i < c.ranking.length; i++) {
      expect(c.ranking[i - 1]!.score).toBeGreaterThanOrEqual(c.ranking[i]!.score);
    }
  });
});

describe('analyze_saju(yongsin) 응답에 consensus 포함', () => {
  test('consensus 필드', async () => {
    const r = JSON.parse(
      await handleAnalyzeSaju({
        birthDate: '1998-06-09', birthTime: '10:30', birthCity: '서울', gender: 'male', analysisType: 'yongsin',
      })
    );
    expect(r.consensus.conflicting).toContain('토');
  });
});

describe('각 방법 내부 무모순: 유리(용신·보조·희신)와 불리(기신·구신)가 겹치지 않음', () => {
  const SAMPLES: [string, string, 'male' | 'female'][] = [
    ['1998-06-09', '10:30', 'male'],
    ['1985-12-20', '03:15', 'female'],
    ['2001-03-05', '18:40', 'male'],
    ['1972-08-17', '23:30', 'female'],
    ['1990-01-15', '12:00', 'male'],
  ];
  test.each(SAMPLES)('%s %s %s', (d, t, g) => {
    const results = YongSinSelector.selectAll(calculateSaju(d, t, 'solar', false, g, '서울'));
    for (const r of Object.values(results)) {
      const fav = new Set([r.primaryYongSin, ...(r.secondaryYongSin ? [r.secondaryYongSin] : []), ...r.xiSin]);
      for (const e of [...r.jiSin, ...r.chouSin]) {
        expect(`${r.method}:${e}:${fav.has(e)}`).toBe(`${r.method}:${e}:false`);
      }
    }
  });
});

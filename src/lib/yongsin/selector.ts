/**
 * 용신 선택기 통합 모듈
 * Unified YongSin Selector
 *
 * 4가지 알고리즘을 통합하고 사용자 설정에 따라 적절한 알고리즘 선택
 */

import type { SajuData, WuXing } from '../../types/index.js';
import type { YongSinMethod } from '../../types/interpretation.js';
import type { YongSinAlgorithm, YongSinResult } from './base.js';
import { StrengthYongSinAlgorithm } from './strength_algorithm.js';
import { SeasonalYongSinAlgorithm } from './seasonal_algorithm.js';
import { MediationYongSinAlgorithm } from './mediation_algorithm.js';
import { DiseaseYongSinAlgorithm } from './disease_algorithm.js';

/**
 * 용신 알고리즘 레지스트리
 */
const ALGORITHMS: Record<YongSinMethod, YongSinAlgorithm> = {
  strength: new StrengthYongSinAlgorithm(),
  seasonal: new SeasonalYongSinAlgorithm(),
  mediation: new MediationYongSinAlgorithm(),
  disease: new DiseaseYongSinAlgorithm(),
};

/**
 * 유리(용신·보조용신·희신)로 판정된 오행을 기신·구신에서 제거 (방법 내부 무모순 보장)
 */
function normalizeResult(r: YongSinResult): YongSinResult {
  const favorable = new Set<WuXing>([
    r.primaryYongSin,
    ...(r.secondaryYongSin ? [r.secondaryYongSin] : []),
    ...r.xiSin,
  ]);
  return {
    ...r,
    jiSin: r.jiSin.filter((e) => !favorable.has(e)),
    chouSin: r.chouSin.filter((e) => !favorable.has(e)),
  };
}

/**
 * 용신 선택기
 */
export class YongSinSelector {
  /**
   * 지정된 방법으로 용신 선택
   * @param sajuData 사주 데이터
   * @param method 용신 선택 방법
   * @returns 용신 선정 결과
   */
  static select(sajuData: SajuData, method: YongSinMethod): YongSinResult {
    const algorithm = ALGORITHMS[method];
    if (!algorithm) {
      throw new Error(`Unknown YongSin method: ${method}`);
    }

    return normalizeResult(algorithm.select(sajuData));
  }

  /**
   * 모든 알고리즘으로 용신 선택 (비교 분석용)
   * @param sajuData 사주 데이터
   * @returns 각 방법별 용신 결과
   */
  static selectAll(sajuData: SajuData): Record<YongSinMethod, YongSinResult> {
    const results: Partial<Record<YongSinMethod, YongSinResult>> = {};

    for (const [method, algorithm] of Object.entries(ALGORITHMS) as [YongSinMethod, YongSinAlgorithm][]) {
      try {
        results[method] = normalizeResult(algorithm.select(sajuData));
      } catch (error) {
        console.error(`Error selecting YongSin with ${method}:`, error);
      }
    }

    return results as Record<YongSinMethod, YongSinResult>;
  }

  /**
   * 자동으로 가장 적합한 알고리즘 선택
   * @param sajuData 사주 데이터
   * @returns 최적 알고리즘으로 선정한 용신
   */
  static selectAuto(sajuData: SajuData): YongSinResult & { recommendedMethod: YongSinMethod } {
    const applicabilities: [YongSinMethod, number][] = [];

    for (const [method, algorithm] of Object.entries(ALGORITHMS) as [YongSinMethod, YongSinAlgorithm][]) {
      const score = algorithm.calculateApplicability(sajuData);
      applicabilities.push([method, score]);
    }

    // 가장 높은 적합도의 알고리즘 선택
    applicabilities.sort((a, b) => b[1] - a[1]);
    const [bestMethod] = applicabilities[0] || ['strength', 0.5];

    const result = this.select(sajuData, bestMethod as YongSinMethod);

    return {
      ...result,
      recommendedMethod: bestMethod as YongSinMethod,
    };
  }

  /**
   * 각 알고리즘의 적용 적합도 평가
   * @param sajuData 사주 데이터
   * @returns 각 방법별 적합도 점수
   */
  static evaluateApplicability(sajuData: SajuData): Record<YongSinMethod, number> {
    const scores: Partial<Record<YongSinMethod, number>> = {};

    for (const [method, algorithm] of Object.entries(ALGORITHMS) as [YongSinMethod, YongSinAlgorithm][]) {
      scores[method] = algorithm.calculateApplicability(sajuData);
    }

    return scores as Record<YongSinMethod, number>;
  }

  /**
   * 알고리즘 정보 가져오기
   * @param method 용신 선택 방법
   * @returns 알고리즘 정보
   */
  static getAlgorithmInfo(method: YongSinMethod): {
    name: string;
    description: string;
  } {
    const algorithm = ALGORITHMS[method];
    if (!algorithm) {
      throw new Error(`Unknown YongSin method: ${method}`);
    }

    return {
      name: algorithm.name,
      description: algorithm.description,
    };
  }

  /**
   * 모든 알고리즘 정보
   */
  static getAllAlgorithms(): Array<{
    method: YongSinMethod;
    name: string;
    description: string;
  }> {
    return Object.entries(ALGORITHMS).map(([method, algorithm]) => ({
      method: method as YongSinMethod,
      name: algorithm.name,
      description: algorithm.description,
    }));
  }
}

/**
 * 편의 함수: 용신 선택
 */
export function selectYongSin(sajuData: SajuData, method: YongSinMethod = 'strength'): YongSinResult {
  return YongSinSelector.select(sajuData, method);
}

/**
 * 편의 함수: 자동 선택
 */
export function selectYongSinAuto(sajuData: SajuData): YongSinResult & { recommendedMethod: YongSinMethod } {
  return YongSinSelector.selectAuto(sajuData);
}

export interface YongSinConsensus {
  methods: Record<YongSinMethod, YongSinResult>;
  recommendedMethod: YongSinMethod;
  /** 1개 이상 방법에서 유리(용신·보조용신·희신), 불리 판정은 없음 */
  agreedFavorable: WuXing[];
  /** 1개 이상 방법에서 불리(기신·구신), 유리 판정은 없음 */
  agreedUnfavorable: WuXing[];
  /** 방법에 따라 유리/불리가 엇갈림 */
  conflicting: WuXing[];
  /** 어떤 방법도 판정하지 않음 */
  neutral: WuXing[];
  /** 신뢰도 가중 점수: Σ confidence × (용신 +2, 보조용신·희신 +1, 기신·구신 -1) */
  ranking: { element: WuXing; score: number; favorableIn: YongSinMethod[]; unfavorableIn: YongSinMethod[] }[];
}

const ALL_ELEMENTS: WuXing[] = ['목', '화', '토', '금', '수'];

/**
 * 4개 용신 방법의 합의/충돌 요약
 */
export function summarizeYongSinConsensus(sajuData: SajuData): YongSinConsensus {
  const methods = YongSinSelector.selectAll(sajuData);
  const recommendedMethod = YongSinSelector.selectAuto(sajuData).recommendedMethod;
  const methodList = Object.keys(methods) as YongSinMethod[];

  const ranking = ALL_ELEMENTS.map((element) => {
    const favorableIn: YongSinMethod[] = [];
    const unfavorableIn: YongSinMethod[] = [];
    let score = 0;
    for (const m of methodList) {
      const r = methods[m];
      const weight =
        r.primaryYongSin === element ? 2
          : r.secondaryYongSin === element || r.xiSin.includes(element) ? 1
            : r.jiSin.includes(element) || r.chouSin.includes(element) ? -1
              : 0;
      if (weight > 0) favorableIn.push(m);
      if (weight < 0) unfavorableIn.push(m);
      score += weight * r.confidence;
    }
    return { element, score: Math.round(score * 100) / 100, favorableIn, unfavorableIn };
  }).sort((a, b) => b.score - a.score);

  const agreedFavorable: WuXing[] = [];
  const agreedUnfavorable: WuXing[] = [];
  const conflicting: WuXing[] = [];
  const neutral: WuXing[] = [];
  for (const r of ranking) {
    if (r.favorableIn.length > 0 && r.unfavorableIn.length > 0) conflicting.push(r.element);
    else if (r.favorableIn.length > 0) agreedFavorable.push(r.element);
    else if (r.unfavorableIn.length > 0) agreedUnfavorable.push(r.element);
    else neutral.push(r.element);
  }

  return { methods, recommendedMethod, agreedFavorable, agreedUnfavorable, conflicting, neutral, ranking };
}

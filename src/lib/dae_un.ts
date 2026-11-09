/**
 * 대운(大運) 계산 시스템
 * 10년 단위의 큰 흐름 운세 분석
 */

import type { SajuData, HeavenlyStem, EarthlyBranch, WuXing } from '../types/index.js';
import { getHeavenlyStemByIndex } from '../data/heavenly_stems.js';
import { getEarthlyBranchByIndex } from '../data/earthly_branches.js';
import { getNextJieSolarTermByInstant, getPreviousJieSolarTermByInstant } from '../data/solar_terms.js';
import { daeUnCache, generateDaeUnCacheKey } from './performance_cache.js';
import { getAdjustedBirthInstantForSaju } from '../utils/date.js';
import { addYears } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export interface DaeUnPeriod {
  startAge: number;
  endAge: number;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  stemElement: WuXing;
  branchElement: WuXing;
  pillarIndex: number; // 몇 번째 대운인지 (0부터 시작)
  startDate: string; // 대운 시작 일자 (KST, YYYY-MM-DD). 절기까지 경과일 ÷ 3 = 년 (연속 환산)
}

/**
 * 대운 계산 메인 함수 (캐싱 적용)
 */
export function calculateDaeUn(
  sajuData: SajuData,
  lifespan: number = 120
): DaeUnPeriod[] {
  // 캐시 체크
  const cacheKey = generateDaeUnCacheKey(
    sajuData.birthDate,
    sajuData.birthTime,
    sajuData.birthCity,
    sajuData.year.stem,
    sajuData.month.stem,
    sajuData.gender
  );
  const cached = daeUnCache.get(cacheKey);
  if (cached) {
    return cached as DaeUnPeriod[];
  }

  const daeUnPeriods: DaeUnPeriod[] = [];

  // 1. 대운 시작 나이 계산 (간단화: 남자 양년생/여자 음년생은 순행, 그 외는 역행)
  const { startAge, firstStart } = calculateDaeUnStart(sajuData);

  // 2. 대운 순행/역행 결정
  const isForward = isDaeUnForward(sajuData);

  // 3. 월주 기준으로 대운 계산
  const monthStemIndex = getHeavenlyStemIndex(sajuData.month.stem);
  const monthBranchIndex = getEarthlyBranchIndex(sajuData.month.branch);

  // 최대 12개 대운 (120세까지)
  const maxPeriods = Math.ceil((lifespan - startAge) / 10);

  for (let i = 0; i < maxPeriods; i++) {
    let stemIndex: number;
    let branchIndex: number;

    if (isForward) {
      // 순행: 월주에서 순방향
      stemIndex = (monthStemIndex + i + 1) % 10;
      branchIndex = (monthBranchIndex + i + 1) % 12;
    } else {
      // 역행: 월주에서 역방향
      stemIndex = (monthStemIndex - i - 1 + 10) % 10;
      branchIndex = (monthBranchIndex - i - 1 + 12) % 12;
    }

    const stem = getHeavenlyStemByIndex(stemIndex);
    const branch = getEarthlyBranchByIndex(branchIndex);

    daeUnPeriods.push({
      startAge: startAge + i * 10,
      endAge: startAge + (i + 1) * 10 - 1,
      stem: stem.korean,
      branch: branch.korean,
      stemElement: stem.element,
      branchElement: branch.element,
      pillarIndex: i,
      startDate: formatInTimeZone(addYears(firstStart, i * 10), 'Asia/Seoul', 'yyyy-MM-dd'),
    });
  }

  // 캐시에 저장
  daeUnCache.set(cacheKey, daeUnPeriods);

  return daeUnPeriods;
}

/**
 * 특정 나이의 대운 조회
 */
export function getDaeUnAtAge(
  sajuData: SajuData,
  age: number
): DaeUnPeriod | null {
  const daeUnPeriods = calculateDaeUn(sajuData);

  for (const period of daeUnPeriods) {
    if (age >= period.startAge && age <= period.endAge) {
      return period;
    }
  }

  return null;
}

/**
 * 대운 시작 나이 계산 (만세력 기준 - 정통 계산법)
 * 
 * 만세력 전통 공식:
 * - 3일 = 1년 (12개월)
 * - 1일 = 4개월
 * - 1시진(2시간) = 10일
 * - 1시간 = 5일 = 20개월
 * 
 * 출처: 명리정종, 적천수 등 전통 명리서
 */
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_YEAR = 365.2425;

/**
 * 대운 시작: startAge(3일=1년 내림, 기존 규칙)와 첫 대운 시작 시각(경과일/3 년 연속 환산)
 */
function calculateDaeUnStart(sajuData: SajuData): { startAge: number; firstStart: Date } {
  const birth = getAdjustedBirthInstantForSaju(
    sajuData.birthDate,
    sajuData.birthTime,
    sajuData.birthCity
  );
  const totalDays = calculateDaeUnStartDays(sajuData, birth);
  return {
    startAge: daeUnStartAgeFromThreeDayRule(totalDays),
    firstStart: new Date(birth.getTime() + (totalDays / 3) * DAYS_PER_YEAR * MS_PER_DAY),
  };
}

/** 출생 시각과 기산 절(節) 사이 경과 일수. 절기 데이터 없으면 15일(=5세) */
function calculateDaeUnStartDays(sajuData: SajuData, birthDate: Date): number {
  const isForward = isDaeUnForward(sajuData);

  let targetSolarTerm;
  
  if (isForward) {
    // 순행: 출생 후 다음 절기까지
    targetSolarTerm = getNextJieSolarTermByInstant(birthDate);

    if (!targetSolarTerm) {
      console.warn('다음 절기 데이터를 찾을 수 없습니다. 기본값 5세를 사용합니다.');
      return 15;
    }

    const termDate = new Date(targetSolarTerm.datetime);
    // 순행: 다음 절(節)까지 경과 일수 → 3일 = 1년(세는 정수, 내림). 시·분을 개월로 넣어 반올림하면 표준 만세력과 어긋남.
    return (termDate.getTime() - birthDate.getTime()) / MS_PER_DAY;
  } else {
    // 역행: 출생 전 이전 절기까지
    targetSolarTerm = getPreviousJieSolarTermByInstant(birthDate);

    if (!targetSolarTerm) {
      console.warn('이전 절기 데이터를 찾을 수 없습니다. 기본값 5세를 사용합니다.');
      return 15;
    }

    const termDate = new Date(targetSolarTerm.datetime);
    // 역행: 이전 절(節)부터 출생까지 경과 일수 → 3일 = 1년(내림)
    return (birthDate.getTime() - termDate.getTime()) / MS_PER_DAY;
  }
}

/** 전통 3일 = 1년: 경과 일(소수 포함)을 3으로 나눈 몫(내림), 0~10세로 제한 */
function daeUnStartAgeFromThreeDayRule(totalDays: number): number {
  const years = Math.floor(totalDays / 3);
  return Math.max(0, Math.min(10, years));
}

/**
 * 대운 순행/역행 결정
 * - 양남음녀: 순행
 * - 음남양녀: 역행
 */
function isDaeUnForward(sajuData: SajuData): boolean {
  const yearStemYinYang = sajuData.year.yinYang;
  const gender = sajuData.gender;

  // 양년생 남자 또는 음년생 여자 → 순행
  if (
    (yearStemYinYang === '양' && gender === 'male') ||
    (yearStemYinYang === '음' && gender === 'female')
  ) {
    return true;
  }

  // 음년생 남자 또는 양년생 여자 → 역행
  return false;
}

/**
 * 천간 인덱스 찾기
 */
function getHeavenlyStemIndex(stem: HeavenlyStem): number {
  const stems: HeavenlyStem[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  return stems.indexOf(stem);
}

/**
 * 지지 인덱스 찾기
 */
function getEarthlyBranchIndex(branch: EarthlyBranch): number {
  const branches: EarthlyBranch[] = [
    '자',
    '축',
    '인',
    '묘',
    '진',
    '사',
    '오',
    '미',
    '신',
    '유',
    '술',
    '해',
  ];
  return branches.indexOf(branch);
}

/**
 * 대운 포맷팅
 */
export function formatDaeUn(daeUn: DaeUnPeriod): string {
  return `${daeUn.startAge}-${daeUn.endAge}세 (${daeUn.startDate}~): ${daeUn.stem}${daeUn.branch} (${daeUn.stemElement}/${daeUn.branchElement})`;
}

/**
 * 대운 목록 포맷팅
 */
export function formatDaeUnList(daeUnPeriods: DaeUnPeriod[], limit: number = 10): string {
  return daeUnPeriods
    .slice(0, limit)
    .map((period) => formatDaeUn(period))
    .join('\n');
}

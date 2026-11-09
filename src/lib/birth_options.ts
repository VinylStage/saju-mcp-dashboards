/**
 * 도구 인자 → BirthOptions 변환 (#11 해외 출생·자시 처리)
 */

import type { BirthOptions } from '../types/index.js';

export interface BirthOptionArgs {
  /** 출생지 경도 (동경 +, 서경 -) */
  birthLongitude?: number;
  /** 출생지 IANA 타임존 (예: America/New_York) */
  birthTimezone?: string;
  /** 23시대 자시 일주 처리 */
  ziHourMode?: 'same-day' | 'next-day';
}

export function birthOptionsFromArgs(args: BirthOptionArgs): BirthOptions | undefined {
  const { birthLongitude, birthTimezone, ziHourMode } = args;
  if (birthLongitude === undefined && birthTimezone === undefined && ziHourMode === undefined) {
    return undefined;
  }
  return {
    ...(birthLongitude !== undefined ? { longitude: birthLongitude } : {}),
    ...(birthTimezone !== undefined ? { timezone: birthTimezone } : {}),
    ...(ziHourMode !== undefined ? { ziHourMode } : {}),
  };
}

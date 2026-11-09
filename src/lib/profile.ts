/**
 * 기본 출생 프로필 (프로세스 메모리 전용, 디스크 미저장)
 * MCP 서버 프로세스가 종료되면 사라진다.
 */

import type { CalendarType, Gender } from '../types/index.js';
import { isValidDate, isValidTime } from './calendar.js';

export interface BirthProfile {
  name?: string;
  birthDate: string;
  birthTime: string;
  birthCity?: string;
  calendar?: CalendarType;
  isLeapMonth?: boolean;
  gender: Gender;
}

let current: BirthProfile | null = null;

export function setProfile(profile: BirthProfile): BirthProfile {
  if (!profile || !isValidDate(profile.birthDate)) {
    throw new Error(`유효하지 않은 birthDate입니다: ${profile?.birthDate}. YYYY-MM-DD 형식을 사용하세요.`);
  }
  if (!isValidTime(profile.birthTime)) {
    throw new Error(`유효하지 않은 birthTime입니다: ${profile.birthTime}. HH:mm 형식을 사용하세요.`);
  }
  if (profile.gender !== 'male' && profile.gender !== 'female') {
    throw new Error(`유효하지 않은 gender입니다: ${profile.gender}. male 또는 female을 사용하세요.`);
  }
  current = { ...profile };
  return current;
}

export function getProfile(): BirthProfile | null {
  return current;
}

export function clearProfile(): void {
  current = null;
}

/**
 * 출생 정보(birthDate·birthTime·gender)가 하나라도 없으면 프로필로 채운다.
 * 명시된 값이 프로필보다 우선한다.
 */
export function withProfile<T extends object>(args: T): T {
  const a = (args ?? {}) as Record<string, unknown>;
  if (a.birthDate !== undefined && a.birthTime !== undefined && a.gender !== undefined) {
    return args;
  }
  if (!current) {
    throw new Error(
      '출생 정보(birthDate YYYY-MM-DD, birthTime HH:mm, gender male/female)가 없고 저장된 프로필도 없습니다. ' +
        "출생 정보를 함께 보내거나 manage_settings { action: 'set_profile', profile: {...} }로 프로필을 저장하세요."
    );
  }
  const { name: _name, ...birth } = current;
  return { ...birth, ...a } as T;
}

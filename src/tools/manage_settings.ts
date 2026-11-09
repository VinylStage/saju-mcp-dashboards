/**
 * manage_settings 통합 도구
 * 설정 조회/변경을 하나로 통합
 */

import { InterpretationSettings } from '../lib/interpretation_settings.js';
import { setProfile, getProfile, clearProfile, type BirthProfile } from '../lib/profile.js';

export type SettingsAction = 'get' | 'set' | 'set_profile' | 'get_profile' | 'clear_profile';

export interface ManageSettingsArgs {
  action: SettingsAction;

  // set용
  preset?: string;
  custom?: {
    ziping?: number;
    dts?: number;
    qtbj?: number;
    modern?: number;
    shensha?: number;
  };

  // set_profile용
  profile?: BirthProfile;
}

export function handleManageSettings(args: ManageSettingsArgs): string {
  const { action, preset, profile } = args;
  const settings = InterpretationSettings.getInstance();

  switch (action) {
    case 'set_profile':
      if (!profile) {
        throw new Error('set_profile 시 profile 필수 (birthDate, birthTime, gender)');
      }
      return JSON.stringify(setProfile(profile));

    case 'get_profile':
      return JSON.stringify(getProfile());

    case 'clear_profile':
      clearProfile();
      return JSON.stringify(null);

    case 'get':
      return JSON.stringify(settings.getSettings());

    case 'set':
      if (preset) {
        settings.loadPreset(preset);
      }
      // custom은 현재 설정 구조와 맞지 않아 프리셋만 지원
      return JSON.stringify(settings.getSettings());

    default:
      throw new Error(`알 수 없는 action: ${action}`);
  }
}

/**
 * #13 (B10) 기본 프로필 (프로세스 메모리, 디스크 미저장)
 */
import { handleToolCall } from '../src/core/tool-handler.js';
import { getToolSchema } from '../src/core/tool-definitions.js';

const PROFILE = { name: '테스트', birthDate: '1998-06-09', birthTime: '10:30', birthCity: '서울', gender: 'male' };

afterEach(async () => {
  await handleToolCall('manage_settings', { action: 'clear_profile' });
});

describe('manage_settings 프로필', () => {
  test('set/get/clear', async () => {
    await handleToolCall('manage_settings', { action: 'set_profile', profile: PROFILE });
    expect(JSON.parse(await handleToolCall('manage_settings', { action: 'get_profile' })).birthDate).toBe('1998-06-09');
    await handleToolCall('manage_settings', { action: 'clear_profile' });
    expect(JSON.parse(await handleToolCall('manage_settings', { action: 'get_profile' }))).toBeNull();
  });

  test('잘못된 날짜 형식은 거부', async () => {
    await expect(
      handleToolCall('manage_settings', { action: 'set_profile', profile: { ...PROFILE, birthDate: '1998/06/09' } })
    ).rejects.toThrow('YYYY-MM-DD');
  });
});

describe('출생 정보 생략 시 프로필 사용', () => {
  test('프로필 없고 출생 정보 없으면 한국어 오류', async () => {
    await expect(handleToolCall('get_daily_fortune', { targetDate: '2026-11-09' })).rejects.toThrow('프로필');
  });

  test('프로필 저장 후 출생 정보 없이 호출', async () => {
    await handleToolCall('manage_settings', { action: 'set_profile', profile: PROFILE });
    const f = JSON.parse(await handleToolCall('get_daily_fortune', { targetDate: '2026-11-09' }));
    expect(f.overallLuck).toBe(40);
    const m = JSON.parse(await handleToolCall('get_fortune_by_period', { periodType: 'month', target: '2026-11' }));
    expect(m.ganjiName).toBe('기해월');
    expect(await handleToolCall('get_dae_un', {})).toContain('2027-11-10');
    const y = JSON.parse(await handleToolCall('analyze_saju', { analysisType: 'basic' }));
    expect(y.day.stem + y.day.branch).toBe('정해');
  });

  test('명시한 출생 정보가 프로필보다 우선', async () => {
    await handleToolCall('manage_settings', { action: 'set_profile', profile: PROFILE });
    const y = JSON.parse(
      await handleToolCall('analyze_saju', { analysisType: 'basic', birthDate: '1990-01-15', birthTime: '12:00', gender: 'female' })
    );
    expect(y.birthDate).toBe('1990-01-15');
  });
});

describe('스키마: 출생 정보 필수 해제', () => {
  test.each(['analyze_saju', 'get_daily_fortune', 'get_dae_un', 'get_fortune_by_period'])('%s', (name) => {
    const required = getToolSchema(name)!.inputSchema.required ?? [];
    expect(required).not.toContain('birthDate');
    expect(required).not.toContain('birthTime');
    expect(required).not.toContain('gender');
  });
});

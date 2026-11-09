/**
 * 캐시 자동 정리 타이머가 프로세스 종료를 막지 않아야 함 (unref)
 */

describe('performance_cache 자동 정리 타이머', () => {
  test('setInterval 타이머는 unref 되어 이벤트 루프를 유지하지 않아야 함', async () => {
    const realSetInterval = global.setInterval;
    const timers: NodeJS.Timeout[] = [];
    const spy = jest
      .spyOn(global, 'setInterval')
      .mockImplementation(((...args: Parameters<typeof setInterval>) => {
        const t = realSetInterval(...args);
        timers.push(t);
        return t;
      }) as typeof setInterval);

    try {
      await jest.isolateModulesAsync(async () => {
        await import('../src/lib/performance_cache.js');
      });
      expect(timers).toHaveLength(1);
      expect(timers[0]?.hasRef()).toBe(false);
    } finally {
      timers.forEach((t) => clearInterval(t));
      spy.mockRestore();
    }
  });
});

import {
  rollingAverage,
  isGameOver,
  ROLLING_WINDOW,
  THRESHOLD_SECONDS,
} from '@/domain/speedGame';

describe('rollingAverage', () => {
  it('returns null for no samples', () => {
    expect(rollingAverage([])).toBeNull();
  });

  it('averages all samples when fewer than the window', () => {
    expect(rollingAverage([2])).toBe(2);
    expect(rollingAverage([2, 4])).toBe(3);
    expect(rollingAverage([1, 2, 3, 4])).toBe(2.5);
  });

  it('averages exactly the window size', () => {
    expect(rollingAverage([1, 2, 3, 4, 5])).toBe(3);
  });

  it('only considers the last `window` samples', () => {
    expect(ROLLING_WINDOW).toBe(5);
    // First value (100) falls out of the window
    expect(rollingAverage([100, 1, 2, 3, 4, 5])).toBe(3);
    expect(rollingAverage([100, 100, 2, 2, 2, 2, 2])).toBe(2);
  });

  it('supports a custom window size', () => {
    expect(rollingAverage([1, 2, 3, 4], 2)).toBe(3.5);
  });
});

describe('isGameOver', () => {
  it('is false with no samples', () => {
    expect(isGameOver([])).toBe(false);
  });

  it('is false at exactly the threshold', () => {
    expect(THRESHOLD_SECONDS).toBe(5);
    expect(isGameOver([5, 5, 5, 5, 5])).toBe(false);
  });

  it('is true when the average exceeds the threshold', () => {
    expect(isGameOver([5, 5, 5, 5, 5.1])).toBe(true);
    expect(isGameOver([26])).toBe(true);
  });

  it('recovers when slow samples fall out of the window', () => {
    // One disastrous prompt followed by five fast ones
    expect(isGameOver([22, 1, 1, 1, 1])).toBe(true);
    expect(isGameOver([22, 1, 1, 1, 1, 1])).toBe(false);
  });

  it('a single wrong-tap penalty on a fresh game is fatal', () => {
    // 6s penalty alone exceeds the 5s threshold with no buffer of fast answers
    expect(isGameOver([6])).toBe(true);
  });
});

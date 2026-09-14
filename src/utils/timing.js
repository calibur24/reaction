/**
 * Calculates the median of an array of numbers.
 */
export function calculateMedian(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }
  return Math.round(sorted[middle]);
}

/**
 * Calculates the mean (average) of an array of numbers.
 */
export function calculateMean(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / numbers.length);
}

/**
 * Filters out invalid reaction times outside 100ms - 1500ms.
 */
export function filterRTOutliers(trials) {
  return trials.filter((t) => t >= 100 && t <= 1500);
}

/**
 * Filters out invalid decision times outside 250ms - 5000ms.
 */
export function filterDMTOutliers(trials) {
  return trials.filter((t) => t >= 250 && t <= 5000);
}
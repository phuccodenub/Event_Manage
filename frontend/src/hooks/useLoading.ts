import { useState, useEffect } from 'react';

/**
 * Hook để quản lý trạng thái loading cho component
 * Giúp tránh hiển thị spinner/skeleton trong thời gian quá ngắn
 * 
 * @param isLoading Trạng thái loading thực từ query
 * @param delay Thời gian tối thiểu để hiển thị trạng thái loading (ms)
 * @param minDuration Thời gian tối thiểu để hiển thị trạng thái loading một khi đã bắt đầu (ms)
 */
export const useLoading = (
  isLoading: boolean,
  delay: number = 200,
  minDuration: number = 300
) => {
  const [shouldShowLoading, setShouldShowLoading] = useState(false);
  const [loadingTimerStarted, setLoadingTimerStarted] = useState<number | null>(null);

  useEffect(() => {
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    let minDurationTimer: ReturnType<typeof setTimeout> | null = null;

    if (isLoading && !shouldShowLoading) {
      // Nếu đang loading nhưng chưa hiển thị, chờ delay trước khi hiển thị
      delayTimer = setTimeout(() => {
        setShouldShowLoading(true);
        setLoadingTimerStarted(Date.now());
      }, delay);
    } else if (!isLoading && shouldShowLoading && loadingTimerStarted) {
      // Nếu đã kết thúc loading, kiểm tra đã hiển thị đủ thời gian tối thiểu chưa
      const elapsed = Date.now() - loadingTimerStarted;
      const remainingTime = Math.max(0, minDuration - elapsed);

      minDurationTimer = setTimeout(() => {
        setShouldShowLoading(false);
        setLoadingTimerStarted(null);
      }, remainingTime);
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (minDurationTimer) clearTimeout(minDurationTimer);
    };
  }, [isLoading, shouldShowLoading, loadingTimerStarted, delay, minDuration]);

  return shouldShowLoading;
}; 
import { useState, useEffect, useRef, useCallback } from 'react';
import { utilitiesApi, VtpassOrderDetail } from '../api/utilities';

export interface UseVtpassPollingResult {
  orderDetail: VtpassOrderDetail | null;
  isPolling: boolean;
  attemptCount: number;
  maxAttemptsReached: number;
  cooldownUntil: number; // timestamp
  errorMsg: string | null;
  checkDeliveryNow: () => Promise<void>;
}

export const useVtpassPolling = (
  orderId: string | null,
  initialOrderDetail?: VtpassOrderDetail | null
): UseVtpassPollingResult => {
  const [orderDetail, setOrderDetail] = useState<VtpassOrderDetail | null>(initialOrderDetail || null);
  const [isPolling, setIsPolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);

  const orderDetailRef = useRef(orderDetail);
  orderDetailRef.current = orderDetail;

  const storageKey = orderId ? `lofix_vtpass_attempts_${orderId}` : '';
  const cooldownKey = orderId ? `lofix_vtpass_cooldown_${orderId}` : '';

  const getStoredAttempts = (): number => {
    if (!storageKey) return 0;
    const val = sessionStorage.getItem(storageKey);
    return val ? parseInt(val, 10) : 0;
  };

  const setStoredAttempts = (count: number) => {
    if (!storageKey) return;
    sessionStorage.setItem(storageKey, `${count}`);
  };

  const getStoredCooldown = (): number => {
    if (!cooldownKey) return 0;
    const val = sessionStorage.getItem(cooldownKey);
    return val ? parseInt(val, 10) : 0;
  };

  const setStoredCooldown = (ts: number) => {
    if (!cooldownKey) return;
    sessionStorage.setItem(cooldownKey, `${ts}`);
  };

  const [attemptCount, setAttemptCount] = useState<number>(getStoredAttempts);
  const inFlightRef = useRef(false);
  const timerRef = useRef<any>(null);

  const maxAttempts = 3; // at most THREE automatic follow-up attempts

  const evaluateAndScheduleNext = useCallback(
    (detail: VtpassOrderDetail, currentAttempts: number) => {
      const status = (detail.deliveryStatus || detail.status || '').toUpperCase();
      const isTerminal = status === 'SUCCESS' || status === 'FAILED' || status === 'COMPLETED' || detail.requiresSupport;

      if (isTerminal || document.hidden) {
        setIsPolling(false);
        return;
      }

      if (currentAttempts >= maxAttempts) {
        setIsPolling(false);
        return;
      }

      // Schedule next follow-up at least 15 seconds apart
      const nextAttempts = currentAttempts + 1;
      setAttemptCount(nextAttempts);
      setStoredAttempts(nextAttempts);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        executeStatusCheck(nextAttempts);
      }, 15000);
    },
    []
  );

  const executeStatusCheck = useCallback(
    async (currentAttempts: number, isManual = false) => {
      if (!orderId || inFlightRef.current) return;

      // Check 429 cooldown
      const currentCooldown = getStoredCooldown();
      if (Date.now() < currentCooldown) {
        setCooldownUntil(currentCooldown);
        setIsPolling(false);
        return;
      }

      inFlightRef.current = true;
      if (!isManual) {
        setIsPolling(true);
      }
      setErrorMsg(null);

      try {
        const detail = isManual ? await utilitiesApi.retryVtpassOrder(orderId) : await utilitiesApi.getVtpassOrderStatus(orderId);
        setOrderDetail(detail);

        const status = (detail.deliveryStatus || detail.status || '').toUpperCase();
        const isTerminal = status === 'SUCCESS' || status === 'FAILED' || status === 'COMPLETED' || detail.requiresSupport;

        if (!isManual) {
          if (!isTerminal) {
            evaluateAndScheduleNext(detail, currentAttempts);
          } else {
            setIsPolling(false);
          }
        }
      } catch (err: any) {
        const status = err.response?.status;
        if (status === 429) {
          // Stop automatic cycle immediately on 429
          setIsPolling(false);
          const retryAfterSec = err.response?.headers?.['retry-after']
            ? parseInt(err.response.headers['retry-after'], 10)
            : err.response?.data?.retryAfterSeconds || 30;
          const deadline = Date.now() + retryAfterSec * 1000;
          setCooldownUntil(deadline);
          setStoredCooldown(deadline);
          setErrorMsg(err.response?.data?.message || 'Rate limit exceeded (429). Please wait before retrying.');
        } else if (status === 400 || status === 403 || status === 404) {
          // Stop immediately on validation/permission errors
          setIsPolling(false);
          setErrorMsg(err.response?.data?.message || err.message || 'Request failed.');
        } else {
          // Transient network/5xx error
          const detailMsg = err.response?.data?.message || err.message || 'Failed to check order status.';
          setErrorMsg(detailMsg);
          if (!isManual && currentAttempts < maxAttempts) {
            evaluateAndScheduleNext(
              orderDetailRef.current || { orderId, transactionId: 0, type: '', serviceID: '', target: '', amount: 0, status: 'PENDING' },
              currentAttempts
            );
          } else {
            setIsPolling(false);
          }
        }
      } finally {
        inFlightRef.current = false;
      }
    },
    [orderId, evaluateAndScheduleNext]
  );

  // Initial fetch and polling trigger (without orderDetail in dependency array to prevent infinite loop)
  useEffect(() => {
    if (!orderId) return;

    const storedAttempts = getStoredAttempts();
    const storedCooldown = getStoredCooldown();
    if (storedCooldown > Date.now()) {
      setCooldownUntil(storedCooldown);
    }

    const currentDetail = orderDetailRef.current;
    const status = (currentDetail?.deliveryStatus || currentDetail?.status || '').toUpperCase();
    const isTerminal = status === 'SUCCESS' || status === 'FAILED' || status === 'COMPLETED' || currentDetail?.requiresSupport;

    if (!isTerminal && storedAttempts < maxAttempts && storedCooldown <= Date.now() && !document.hidden) {
      setIsPolling(true);
      executeStatusCheck(storedAttempts);
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsPolling(false);
      } else {
        // Resumed tab
        const currentAttempts = getStoredAttempts();
        const cooldown = getStoredCooldown();
        const detail = orderDetailRef.current;
        const currentStatus = (detail?.deliveryStatus || detail?.status || '').toUpperCase();
        const terminal = currentStatus === 'SUCCESS' || currentStatus === 'FAILED' || currentStatus === 'COMPLETED' || detail?.requiresSupport;
        if (!terminal && currentAttempts < maxAttempts && cooldown <= Date.now()) {
          setIsPolling(true);
          executeStatusCheck(currentAttempts);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [orderId, executeStatusCheck]);

  const checkDeliveryNow = async () => {
    const currentCooldown = getStoredCooldown();
    if (Date.now() < currentCooldown) return;
    await executeStatusCheck(attemptCount, true);
  };

  return {
    orderDetail,
    isPolling,
    attemptCount,
    maxAttemptsReached: attemptCount >= maxAttempts ? attemptCount : 0,
    cooldownUntil,
    errorMsg,
    checkDeliveryNow,
  };
};

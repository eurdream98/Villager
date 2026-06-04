import { useEffect, useState } from 'react';
import { formatCountdown } from '../lib/escrowApi';

/** deadline ISO 기준 1초마다 갱신되는 카운트다운 (예: 6일 23:59:59 / 23:59:59) */
export function useCountdown(deadlineIso) {
  const [label, setLabel] = useState(() => formatCountdown(deadlineIso));

  useEffect(() => {
    if (!deadlineIso) {
      setLabel('');
      return undefined;
    }
    const tick = () => setLabel(formatCountdown(deadlineIso));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineIso]);

  return label;
}

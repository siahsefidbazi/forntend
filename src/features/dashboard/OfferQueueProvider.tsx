import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { MatchOffer } from './mock';
import { MOCK_DASHBOARD } from './mock';

type OfferQueueValue = {
  currentOffer: MatchOffer | null;
  remainingCount: number;
  advanceOffer: (id: string) => void;
};

const OfferQueueContext = createContext<OfferQueueValue | null>(null);

export function OfferQueueProvider({ children }: { children: ReactNode }) {
  const [remainingIds, setRemainingIds] = useState(() =>
    MOCK_DASHBOARD.offers.map((offer) => offer.id),
  );

  const advanceOffer = useCallback((id: string) => {
    setRemainingIds((current) =>
      current[0] === id ? current.slice(1) : current.filter((item) => item !== id),
    );
  }, []);

  const currentOffer =
    MOCK_DASHBOARD.offers.find((offer) => offer.id === remainingIds[0]) ?? null;

  const value = useMemo(
    () => ({ currentOffer, remainingCount: remainingIds.length, advanceOffer }),
    [currentOffer, remainingIds.length, advanceOffer],
  );

  return (
    <OfferQueueContext.Provider value={value}>
      {children}
    </OfferQueueContext.Provider>
  );
}

export function useOfferQueue() {
  const context = useContext(OfferQueueContext);
  if (!context) {
    throw new Error('useOfferQueue must be used inside OfferQueueProvider.');
  }
  return context;
}

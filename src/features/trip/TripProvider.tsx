import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  type SetStateAction,
} from 'react';

import type { Place } from './places';

type Places = {
  origin: Place | null;
  destination: Place | null;
};

type TripContextValue = {
  origin: Place | null;
  destination: Place | null;
  /** Identifier of the travel plan currently offered as a ride option. */
  selectedPlanId: string | null;
  /** `sequence` of the selected leg inside the selected plan. */
  selectedLegSequence: number | null;
  setOrigin: (value: SetStateAction<Place | null>) => void;
  setDestination: (value: SetStateAction<Place | null>) => void;
  swapPlaces: () => void;
  setSelectedPlan: (id: string | null) => void;
  setSelectedLeg: (sequence: number | null) => void;
  reset: () => void;
};

const TripContext = createContext<TripContextValue | null>(null);

/**
 * Holds the passenger selection (origin, destination and the chosen leg of a
 * saved route) while the user moves between the map, the search screen and the
 * ride options sheet.
 */
export function TripProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<Places>({
    origin: null,
    destination: null,
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedLegSequence, setSelectedLegSequence] = useState<number | null>(
    null,
  );

  const setOrigin = useCallback((value: SetStateAction<Place | null>) => {
    setPlaces((current) => ({
      ...current,
      origin: typeof value === 'function' ? value(current.origin) : value,
    }));
  }, []);

  const setDestination = useCallback((value: SetStateAction<Place | null>) => {
    setPlaces((current) => ({
      ...current,
      destination:
        typeof value === 'function' ? value(current.destination) : value,
    }));
  }, []);

  const swapPlaces = useCallback(() => {
    setPlaces((current) => ({
      origin: current.destination,
      destination: current.origin,
    }));
  }, []);

  const reset = useCallback(() => {
    setPlaces({ origin: null, destination: null });
    setSelectedPlanId(null);
    setSelectedLegSequence(null);
  }, []);

  const value = useMemo<TripContextValue>(
    () => ({
      origin: places.origin,
      destination: places.destination,
      selectedPlanId,
      selectedLegSequence,
      setOrigin,
      setDestination,
      swapPlaces,
      setSelectedPlan: setSelectedPlanId,
      setSelectedLeg: setSelectedLegSequence,
      reset,
    }),
    [
      places.origin,
      places.destination,
      selectedPlanId,
      selectedLegSequence,
      setOrigin,
      setDestination,
      swapPlaces,
      reset,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripContextValue {
  const context = useContext(TripContext);

  if (!context) {
    throw new Error('useTrip must be used inside a TripProvider.');
  }

  return context;
}

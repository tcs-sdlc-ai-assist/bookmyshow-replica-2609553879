'use client';

import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

/** Describes a movie returned from the catalogue API. */
export interface Movie {
  id: number;
  title: string;
}

/** Describes a theatre returned from the catalogue API. */
export interface Theatre {
  id: number;
  name: string;
}

/** Holds the user journey fields needed by authentication and later booking selections. */
export interface JourneyState {
  mobile: string;
  verificationToken: string | null;
  movie: Movie | null;
  theatre: Theatre | null;
  seats: string[] | null;
  totalPrice: number | null;
  bookingId?: number;
}

type JourneyAction =
  | { type: 'setMobile'; mobile: string }
  | { type: 'setVerificationToken'; token: string }
  | { type: 'setMovie'; movie: Movie }
  | { type: 'setTheatre'; theatre: Theatre }
  | { type: 'setSeats'; seats: string[]; totalPrice: number }
  | { type: 'setBooking'; bookingId?: number };

interface JourneyContextValue {
  state: JourneyState;
  dispatch: React.Dispatch<JourneyAction>;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

/** Reduces journey transitions into a single typed client-side state object. */
function journeyReducer(state: JourneyState, action: JourneyAction): JourneyState {
  switch (action.type) {
    case 'setMobile':
      return { ...state, mobile: action.mobile };
    case 'setVerificationToken':
      return { ...state, verificationToken: action.token };
    case 'setMovie':
      return { ...state, movie: action.movie, theatre: null, seats: null, totalPrice: null };
    case 'setTheatre':
      return { ...state, theatre: action.theatre, seats: null, totalPrice: null };
    case 'setSeats':
      return { ...state, seats: action.seats, totalPrice: action.totalPrice };
    case 'setBooking':
      return { ...state, bookingId: action.bookingId };
  }
}

/** Supplies journey state to authentication and subsequent booking routes. */
export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(journeyReducer, {
    mobile: '',
    verificationToken: null,
    movie: null,
    theatre: null,
    seats: null,
    totalPrice: null
  });
  return <JourneyContext.Provider value={{ state, dispatch }}>{children}</JourneyContext.Provider>;
}

/** Reads the current journey context and fails fast outside its provider. */
export function useJourney(): JourneyContextValue {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourney must be used within JourneyProvider.');
  }
  return context;
}

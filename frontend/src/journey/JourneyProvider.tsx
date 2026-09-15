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
/** Describes the payment option accepted by the booking API. */
export type PaymentMethod = 'CARD' | 'UPI';

/** Describes the canonical booking confirmation returned by the API. */
export interface BookingConfirmation {
  confirmationId: string;
  booking: {
    id: number;
    movie: string;
    theatre: string;
    seats: string[];
    paymentMethod: PaymentMethod;
    totalPrice: number;
  };
}

/** Holds the user journey fields needed by authentication and booking confirmation. */
export interface JourneyState {
  mobile: string;
  verificationToken: string | null;
  movie: Movie | null;
  theatre: Theatre | null;
  seats: string[] | null;
  totalPrice: number | null;
  paymentMethod: PaymentMethod | null;
  confirmation: BookingConfirmation | null;
}

type JourneyAction =
  | { type: 'setMobile'; mobile: string }
  | { type: 'setVerificationToken'; token: string }
  | { type: 'setMovie'; movie: Movie }
  | { type: 'setTheatre'; theatre: Theatre }
  | { type: 'setSeats'; seats: string[]; totalPrice: number }
  | { type: 'setPaymentMethod'; paymentMethod: PaymentMethod }
  | { type: 'setConfirmation'; confirmation: BookingConfirmation };

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
      return { ...state, movie: action.movie, theatre: null, seats: null, totalPrice: null, paymentMethod: null, confirmation: null };
    case 'setTheatre':
      return { ...state, theatre: action.theatre, seats: null, totalPrice: null, paymentMethod: null, confirmation: null };
    case 'setSeats':
      return { ...state, seats: action.seats, totalPrice: action.totalPrice, paymentMethod: null, confirmation: null };
    case 'setPaymentMethod':
      return { ...state, paymentMethod: action.paymentMethod };
    case 'setConfirmation':
      return { ...state, confirmation: action.confirmation };
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
    totalPrice: null,
    paymentMethod: null,
    confirmation: null
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

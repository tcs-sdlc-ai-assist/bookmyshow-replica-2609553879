import type { Metadata } from 'next';
import { JourneyProvider } from '../src/journey/JourneyProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cinema Access',
  description: 'A deliberate two-step cinema booking access workflow.'
};

/** Provides global metadata, styling, and journey state for every route. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <JourneyProvider>{children}</JourneyProvider>
      </body>
    </html>
  );
}

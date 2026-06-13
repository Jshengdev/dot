import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'DOT — tell it how you feel',
  description: 'The objective mirror. Tell it how you feel; it turns your story into something a provider can read.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* brand-clean-blue → white room, trust-blue accent (design/05-NEW-BRAND) */}
      <body className="brand-clean-blue">{children}</body>
    </html>
  );
}

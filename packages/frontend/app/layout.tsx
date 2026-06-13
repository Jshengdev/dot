import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'DOT — tell it how you feel',
  description:
    'Tell it how you feel. DOT turns your story into the objective truth of it — a story your provider can understand.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* brand-clean-blue makes the whole room white + trust-blue (design/05-NEW-BRAND). */}
      <body className="brand-clean-blue">{children}</body>
    </html>
  );
}

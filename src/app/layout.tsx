import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Israeli Elections 2026',
  description: 'A sourced guide to the 2026 Knesset election.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

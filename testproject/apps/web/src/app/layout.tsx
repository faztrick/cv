import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Nav } from '@/components/nav';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-primary',
  subsets: ['latin']
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '600']
});

export const metadata: Metadata = {
  title: 'FanHouse Vertical Slice',
  description: 'Mini FanHouse MVP vertical slice for the engineering test.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${plexMono.variable} antialiased`}>
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ColorMode } from '@xyflow/react';

import { AppStoreProvider } from '@/store';
import { defaultState } from '@/store/app-store';

import './globals.css';

export const metadata: Metadata = {
  title: 'React Flow Workflow Editor',
  description:
    'A Next.js-based application designed to help you quickly create, manage, and visualize workflows.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const colorModeCookie = cookieStore.get('colorMode');

  const theme: ColorMode =
    (colorModeCookie?.value === 'dark' || colorModeCookie?.value === 'light'
      ? colorModeCookie.value
      : null) ??
    (typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light');

  return (
    <AppStoreProvider initialState={{ ...defaultState, colorMode: theme }}>
      <html lang="en" className={theme}>
        <body>{children}</body>
      </html>
    </AppStoreProvider>
  );
}

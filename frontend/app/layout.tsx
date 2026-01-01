import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Workplace Scheduler - 勤務地管理カレンダー',
  description: 'チームメンバーの勤務地（オフィス、在宅など）を月単位で管理・共有できるWebアプリケーション。リアルタイム同期機能搭載。',
  keywords: ['scheduler', 'workplace', 'calendar', '勤務地', 'スケジュール管理', 'リモートワーク'],
  authors: [{ name: 'Workplace Scheduler Team' }],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    title: 'Workplace Scheduler - 勤務地管理カレンダー',
    description: 'チームメンバーの勤務地を月単位で管理・共有できるWebアプリケーション',
    siteName: 'Workplace Scheduler',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}

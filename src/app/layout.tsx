import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import { NotificationProvider } from '@/components/Notification';
import { AiTaskProvider } from '@/components/ai-task/AiTaskContext';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: { default: 'DEV HUB: Asisten Produktivitas', template: '%s · DevHub' },
  description:
    'Otomatisasi input task Taiga dengan AI, monitoring produktivitas GitLab, dan analisis kapasitas workload dalam satu workspace terpadu.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='id' className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body>
        <NotificationProvider>
          <AiTaskProvider>
            <div className='flex min-h-screen bg-canvas max-lg:flex-col'>
              <Sidebar />
              <main className='flex-1 min-w-0 px-9 pt-7 pb-16 max-w-[1440px] mx-auto max-lg:px-4 max-lg:py-5 max-lg:pb-12'>
                {children}
              </main>
            </div>
          </AiTaskProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}

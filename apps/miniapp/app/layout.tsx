import './globals.css';
import type { Metadata } from 'next';
import { LocaleProvider } from '../lib/locale';
import { SiteSettingsProvider } from '../lib/site-settings';
import { AuthProvider } from '../lib/auth';
import { ToastProvider } from '../lib/toast';
import { BottomTabBar } from '../components/bottom-tab-bar';

export const metadata: Metadata = {
  title: 'Núi Bà Đen Mini App',
  description: 'Tourist support mini app for Núi Bà Đen',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <LocaleProvider>
          <SiteSettingsProvider>
            <AuthProvider>
              <ToastProvider>
                <div className="app-shell">
                  <main className="app-content">{children}</main>
                  <BottomTabBar />
                </div>
              </ToastProvider>
            </AuthProvider>
          </SiteSettingsProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

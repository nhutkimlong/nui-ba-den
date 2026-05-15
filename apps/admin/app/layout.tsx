import './globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '../components/sidebar';
import { AuthGate } from '../components/auth-gate';

export const metadata: Metadata = {
  title: 'Núi Bà Đen Admin',
  description: 'Admin CMS and operations console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <div className="shell">
          <Sidebar />
          <main className="main">
            <AuthGate>{children}</AuthGate>
          </main>
        </div>
      </body>
    </html>
  );
}

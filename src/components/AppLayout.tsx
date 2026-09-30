import type { ReactNode } from 'react';
import Header from '@/components/Header';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="site-shell">
      <div className="site-main">
        <Header />
        <main>{children}</main>
      </div>
      <div id="ui-layer" className="ui-layer" />
    </div>
  );
}

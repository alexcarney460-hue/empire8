'use client';

import { usePathname } from 'next/navigation';
import Nav from '@/components/NavRedesign';
import Footer from '@/components/FooterRedesign';
import ChatWidget from '@/components/ChatWidget';
import PageTracker from '@/components/PageTracker';
import AgeGate from '@/components/AgeGate';
import { DispensaryCartProvider } from '@/context/DispensaryCartContext';
import DispensaryCartDrawer from '@/components/DispensaryCartDrawer';
import InstallPrompt from '@/components/InstallPrompt';
import SmoothScroll from '@/components/SmoothScroll';

export default function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <DispensaryCartProvider>
      <AgeGate>
        <Nav />
        <SmoothScroll>
          <div>{children}</div>
        </SmoothScroll>
        <Footer />
        <ChatWidget />
        <PageTracker />
        <DispensaryCartDrawer />
        <InstallPrompt />
      </AgeGate>
    </DispensaryCartProvider>
  );
}

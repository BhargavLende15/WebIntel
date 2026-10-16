import { Outlet } from 'react-router-dom';
import Sidebar, { Header, MobileNav } from '../components/layout/Sidebar';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
        <MobileNav />
      </div>
    </div>
  );
}

export function PageWrapper({ title, subtitle, children }) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />

      <main className="w-full flex-1 px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
        <div className="mx-auto w-full max-w-[1600px]">
          {children}
        </div>
      </main>
    </>
  );
}

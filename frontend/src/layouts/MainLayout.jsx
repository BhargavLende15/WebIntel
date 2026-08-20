import { Outlet } from 'react-router-dom';
import Sidebar, { Header, MobileNav } from '../components/layout/Sidebar';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Outlet context={{ setHeader: () => {} }} />
        <MobileNav />
      </div>
    </div>
  );
}

export function PageWrapper({ title, subtitle, children }) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <main className="flex-1 p-6">{children}</main>
    </>
  );
}

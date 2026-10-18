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

/**
 * Standard page shell: sticky header, then a width-constrained content column.
 *
 * The column reserves room for the fixed-height mobile navigation bar so the
 * last card on a page is never hidden behind it, and `min-w-0` on the flex
 * parents stops long URLs and UUIDs from forcing horizontal page scroll.
 */
export function PageWrapper({ title, subtitle, children }) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />

      <main className="w-full min-w-0 flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-7 sm:pb-24 xl:px-8 lg:pb-7">
        <div className="mx-auto w-full min-w-0 max-w-[1600px]">{children}</div>
      </main>
    </>
  );
}

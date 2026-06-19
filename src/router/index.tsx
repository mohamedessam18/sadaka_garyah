import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layout/MainLayout';

const Landing = lazy(() => import('../pages/Landing').then(m => ({ default: m.Landing })));
const Home = lazy(() => import('../pages/Home').then(m => ({ default: m.Home })));
const AzkarIndex = lazy(() => import('../pages/AzkarIndex').then(m => ({ default: m.AzkarIndex })));
const AzkarFocus = lazy(() => import('../pages/AzkarFocus').then(m => ({ default: m.AzkarFocus })));
const QuranReader = lazy(() => import('../pages/QuranReader').then(m => ({ default: m.QuranReader })));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] w-full flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Landing />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: 'home',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: 'azkar',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <AzkarIndex />
          </Suspense>
        ),
      },
      {
        path: 'azkar/:type',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <AzkarFocus />
          </Suspense>
        ),
      },
      {
        path: 'quran',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <QuranReader />
          </Suspense>
        ),
      },
      {
        path: 'quran/:id',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <QuranReader />
          </Suspense>
        ),
      },
    ],
  },
], {
  basename: import.meta.env.BASE_URL
});

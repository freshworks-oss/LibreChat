import React, { Suspense, lazy } from 'react';

const AdminLayout = lazy(() => import('./components/Admin'));

export const isAdminPanelEnabled = true;

export const adminRoutes = {
  path: 'admin/*',
  element: (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-text-secondary">Loading admin panel…</p>
        </div>
      }
    >
      <AdminLayout />
    </Suspense>
  ),
};

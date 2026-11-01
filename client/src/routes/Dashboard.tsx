import { Navigate, useParams } from 'react-router-dom';
import { adminRoutes, isAdminPanelEnabled } from '~/admin-plugin';
import DashboardRoute from './Layouts/Dashboard';

function PromptsRedirect() {
  const { '*': splat } = useParams();
  /** Prompts are created from a dialog, so there is no "new" page to land on */
  const target = splat && splat !== 'new' ? `/prompts/${splat}` : '/c/new';
  return <Navigate to={target} replace={true} />;
}

const dashboardRoutes = {
  path: 'd/*',
  element: <DashboardRoute />,
  children: [
    {
      path: 'prompts/*',
      element: <PromptsRedirect />,
    },
    ...(isAdminPanelEnabled ? [adminRoutes] : []),
    {
      path: '*',
      element: <Navigate to="/c/new" replace={true} />,
    },
  ],
};

export default dashboardRoutes;

import { NavLink } from 'react-router-dom';
import { useHasCapability } from './hooks';
import { ADMIN_TABS } from './constants';

export default function AdminSidebar() {
  return (
    <nav
      className="flex h-full w-14 flex-col border-r border-border-light bg-surface-primary py-4 md:w-48"
      aria-label="Admin navigation"
    >
      {ADMIN_TABS.map((tab) => (
        <SidebarTab key={tab.id} tab={tab} />
      ))}
    </nav>
  );
}

function SidebarTab({ tab }: { tab: (typeof ADMIN_TABS)[number] }) {
  const hasCapability = useHasCapability(tab.requiredCapability);
  if (!hasCapability) {
    return null;
  }

  const Icon = tab.icon;

  return (
    <NavLink
      to={tab.path}
      end={false}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
          isActive
            ? 'bg-surface-hover font-medium text-text-primary'
            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
        }`
      }
      aria-label={tab.label}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="hidden md:inline">{tab.label}</span>
    </NavLink>
  );
}

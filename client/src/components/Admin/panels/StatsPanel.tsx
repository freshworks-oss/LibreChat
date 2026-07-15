import { useLocalize } from '~/hooks';

import UsersStatsView from './UsersStatsView';

export default function StatsPanel() {
  const localize = useLocalize();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">
        {localize('com_ui_admin_stats_title')}
      </h2>
      <UsersStatsView />
    </div>
  );
}

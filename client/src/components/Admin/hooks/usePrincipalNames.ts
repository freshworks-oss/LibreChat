import { useMemo } from 'react';
import { useAdminGroups, useAdminRoles, useAdminUsers } from './';

/**
 * Builds a lookup map from principalType+principalId → display name.
 * Returns a resolveName function that falls back to the raw ID.
 */
export function usePrincipalNames() {
  const { data: groups } = useAdminGroups();
  const { data: roles } = useAdminRoles();
  const { data: usersData } = useAdminUsers({ limit: 200 });

  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of groups ?? []) {
      map.set(`group:${g.id}`, g.name);
    }
    for (const r of roles ?? []) {
      map.set(`role:${r.name}`, r.name);
    }
    for (const u of usersData?.users ?? []) {
      map.set(`user:${u.id}`, u.name || u.email);
    }
    return map;
  }, [groups, roles, usersData]);

  const resolveName = (type: string, id: string) =>
    nameMap.get(`${type}:${id}`) || id;

  return { resolveName };
}

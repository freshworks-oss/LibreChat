/**
 * Local copy of capability constants and helpers from @librechat/data-schemas.
 *
 * We inline these to avoid importing the full data-schemas package in the
 * browser bundle — that package re-exports a winston logger which pulls in
 * Node-only dependencies (moment, fs, etc.) that crash in the browser.
 */

/* ── Implication map: manage → read ─────────────────────────────────── */

export const CapabilityImplications: Record<string, string[]> = {
  'manage:users': ['read:users'],
  'manage:groups': ['read:groups'],
  'manage:roles': ['read:roles'],
  'manage:configs': ['read:configs'],
  'manage:agents': ['read:agents'],
  'manage:prompts': ['read:prompts'],
  'manage:assistants': ['read:assistants'],
};

/** Reverse map: for a given read capability, which manage capabilities imply it? */
const impliedByMap: Record<string, string[]> = {};
for (const [manage, reads] of Object.entries(CapabilityImplications)) {
  for (const read of reads) {
    if (!impliedByMap[read]) {
      impliedByMap[read] = [];
    }
    impliedByMap[read].push(manage);
  }
}

/**
 * Check whether a set of held capabilities satisfies a required capability,
 * accounting for the manage→read implication hierarchy.
 */
export function hasImpliedCapability(held: string[], required: string): boolean {
  if (held.includes(required)) {
    return true;
  }
  const impliers = impliedByMap[required];
  if (impliers) {
    for (const cap of impliers) {
      if (held.includes(cap)) {
        return true;
      }
    }
  }
  return false;
}

/* ── Capability categories for the CapabilityEditor UI ──────────────── */

export type CapabilityCategory = {
  key: string;
  labelKey: string;
  capabilities: string[];
};

export const CAPABILITY_CATEGORIES: CapabilityCategory[] = [
  {
    key: 'users',
    labelKey: 'com_cap_cat_users',
    capabilities: ['manage:users', 'read:users'],
  },
  {
    key: 'groups',
    labelKey: 'com_cap_cat_groups',
    capabilities: ['manage:groups', 'read:groups'],
  },
  {
    key: 'roles',
    labelKey: 'com_cap_cat_roles',
    capabilities: ['manage:roles', 'read:roles'],
  },
  {
    key: 'config',
    labelKey: 'com_cap_cat_config',
    capabilities: ['manage:configs', 'read:configs', 'assign:configs'],
  },
  {
    key: 'content',
    labelKey: 'com_cap_cat_content',
    capabilities: [
      'manage:agents',
      'read:agents',
      'manage:prompts',
      'read:prompts',
      'manage:assistants',
      'read:assistants',
      'manage:mcpservers',
    ],
  },
  {
    key: 'system',
    labelKey: 'com_cap_cat_system',
    capabilities: ['access:admin', 'read:usage'],
  },
];

import React from 'react';
import { Checkbox, Label } from '@librechat/client';
import { CAPABILITY_CATEGORIES, CapabilityImplications } from '../capabilities';

type CapabilityEditorProps = {
  held: string[];
  onChange: (capability: string, checked: boolean) => void;
  readOnly?: boolean;
};

/** Build a set of capabilities that are implied by currently-held manage capabilities. */
function getImpliedSet(held: string[]): Set<string> {
  const implied = new Set<string>();
  for (const cap of held) {
    const targets = CapabilityImplications[cap];
    if (targets) {
      for (const t of targets) {
        implied.add(t);
      }
    }
  }
  return implied;
}

export default function CapabilityEditor({ held, onChange, readOnly = false }: CapabilityEditorProps) {
  const heldSet = new Set(held);
  const impliedSet = getImpliedSet(held);

  return (
    <div className="space-y-4">
      {CAPABILITY_CATEGORIES.map((category) => (
        <fieldset key={category.key}>
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {category.labelKey.replace('com_cap_cat_', '').replace(/_/g, ' ')}
          </legend>
          <div className="space-y-1">
            {category.capabilities.map((cap) => {
              const isHeld = heldSet.has(cap);
              const isImplied = !isHeld && impliedSet.has(cap);
              const checked = isHeld || isImplied;

              return (
                <div key={cap} className="flex items-center gap-2">
                  <Checkbox
                    id={`cap-${cap}`}
                    checked={checked}
                    disabled={readOnly || isImplied}
                    onCheckedChange={(val) => onChange(cap, val === true)}
                    aria-label={cap}
                  />
                  <Label
                    htmlFor={`cap-${cap}`}
                    className={`text-sm ${isImplied ? 'italic text-text-secondary' : 'text-text-primary'}`}
                  >
                    {cap}
                    {isImplied && (
                      <span className="ml-1 text-xs text-text-secondary">(implied)</span>
                    )}
                  </Label>
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

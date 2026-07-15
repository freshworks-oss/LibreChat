import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save } from 'lucide-react';
import { Button, Label, Switch } from '@librechat/client';
import type { AdminConfig, UpsertConfigRequest } from '../types';

type ConfigEditorProps = {
  config: AdminConfig | null;
  onSave: (data: UpsertConfigRequest) => void;
  onToggleActive: (isActive: boolean) => void;
  onDelete?: () => void;
};

export default function ConfigEditor({ config, onSave, onToggleActive }: ConfigEditorProps) {
  const [jsonText, setJsonText] = useState('{}');
  const [priority, setPriority] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    if (config) {
      setJsonText(JSON.stringify(config.overrides, null, 2));
      setPriority(config.priority);
    } else {
      setJsonText('{}');
      setPriority(0);
    }
    setParseError(null);
  }, [config]);

  useEffect(() => {
    autoResize();
  }, [jsonText, autoResize]);

  const handleSave = () => {
    try {
      const overrides = JSON.parse(jsonText);
      setParseError(null);
      onSave({ overrides, priority });
    } catch {
      setParseError('Invalid JSON');
    }
  };

  return (
    <div className="space-y-4">
      {/* Active toggle */}
      {config && (
        <div className="flex items-center justify-between">
          <Label htmlFor="config-active" className="text-sm text-text-primary">
            Active
          </Label>
          <Switch
            id="config-active"
            checked={config.isActive}
            onCheckedChange={onToggleActive}
            aria-label="Toggle config active"
          />
        </div>
      )}

      {/* Priority */}
      <div>
        <Label htmlFor="config-priority" className="mb-1 block text-sm text-text-primary">
          Priority
        </Label>
        <input
          id="config-priority"
          type="number"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          className="w-24 rounded-md border border-border-light bg-surface-primary px-2 py-1 text-sm text-text-primary"
          aria-label="Config priority"
        />
      </div>

      {/* JSON overrides */}
      <div>
        <Label htmlFor="config-json" className="mb-1 block text-sm text-text-primary">
          Overrides (JSON)
        </Label>
        <textarea
          ref={textareaRef}
          id="config-json"
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setParseError(null);
          }}
          className="w-full resize-none overflow-hidden rounded-md border border-border-light bg-surface-primary px-3 py-2 font-mono text-xs text-text-primary focus:border-border-heavy focus:outline-none"
          style={{ minHeight: '120px' }}
          aria-label="Config overrides JSON"
        />
        {parseError && (
          <p className="mt-1 text-xs text-red-500" role="alert">
            {parseError}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} aria-label="Save config">
          <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Save
        </Button>
      </div>
    </div>
  );
}

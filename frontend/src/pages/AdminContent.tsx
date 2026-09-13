import { useCallback, useEffect, useState } from 'react';

import { AlertIcon, RefreshIcon } from '../components/Icons';
import { CONTENT_FIELDS, CONTENT_GROUPS } from '../content/fields';
import type { ContentField } from '../content/fields';
import { defaultContent } from '../content/SiteContent';
import { ApiError, adminFetchSettings, adminResetSetting, adminSaveSettings } from '../lib/api';
import { cx } from '../lib/cx';

type Notice = { tone: 'ok' | 'error'; text: string } | null;

/** Raw text held by each input, keyed by field path. */
type Draft = Record<string, string>;

/** Reads a dotted path out of the compiled defaults. */
function readDefault(path: string): unknown {
  let cursor: unknown = defaultContent;
  for (const segment of path.split('.')) {
    if (typeof cursor !== 'object' || cursor === null) return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
}

/** Turns a value into the text an input should show. */
function toText(field: ContentField, value: unknown): string {
  if (value === undefined || value === null) return '';
  switch (field.kind) {
    case 'list':
      return Array.isArray(value) ? value.join('\n') : '';
    case 'json':
      return JSON.stringify(value, null, 2);
    default:
      return String(value);
  }
}

/**
 * Turns the input text back into a storable value.
 * Throws a human-readable message when the input cannot be parsed.
 */
function fromText(field: ContentField, text: string): unknown {
  switch (field.kind) {
    case 'number': {
      const parsed = Number(text.trim());
      if (text.trim() === '' || !Number.isFinite(parsed)) {
        throw new Error('Doit être un nombre');
      }
      return parsed;
    }
    case 'list':
      return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    case 'json':
      try {
        return JSON.parse(text) as unknown;
      } catch {
        throw new Error('JSON invalide');
      }
    default:
      return text;
  }
}

function buildDraft(settings: Record<string, unknown>): Draft {
  const draft: Draft = {};
  for (const field of CONTENT_FIELDS) {
    const stored = Object.prototype.hasOwnProperty.call(settings, field.path)
      ? settings[field.path]
      : readDefault(field.path);
    draft[field.path] = toText(field, stored);
  }
  return draft;
}

/* -------------------------------------------------------------------------- */
/*  Field                                                                     */
/* -------------------------------------------------------------------------- */

interface FieldProps {
  field: ContentField;
  value: string;
  dirty: boolean;
  overridden: boolean;
  error: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
}

function Field({
  field,
  value,
  dirty,
  overridden,
  error,
  disabled,
  onChange,
  onReset,
}: FieldProps) {
  const inputClass = cx(
    'w-full rounded-lg border bg-void/60 px-3 py-2 text-ink focus:outline-none',
    error ? 'border-rose/50 focus:border-rose' : 'border-line focus:border-acid/40',
    field.kind === 'text' || field.kind === 'number' ? 'font-mono text-sm' : 'text-sm',
  );

  const id = `field-${field.path}`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="font-mono text-[11px] tracking-wide text-muted uppercase">
          {field.label}
        </label>
        {overridden ? (
          <span className="rounded border border-acid/30 px-1.5 py-0.5 font-mono text-[10px] text-acid uppercase">
            modifié
          </span>
        ) : null}
        <button
          type="button"
          onClick={onReset}
          disabled={disabled || !overridden}
          className="ml-auto font-mono text-[10px] text-faint underline-offset-2 transition-colors hover:text-muted hover:underline disabled:opacity-40 disabled:hover:no-underline"
        >
          réinitialiser
        </button>
      </div>

      {field.kind === 'textarea' ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cx(inputClass, 'resize-y leading-relaxed')}
        />
      ) : field.kind === 'list' || field.kind === 'json' ? (
        <textarea
          id={id}
          rows={field.kind === 'json' ? 10 : 4}
          value={value}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          className={cx(inputClass, 'resize-y font-mono text-xs leading-relaxed')}
        />
      ) : (
        <input
          id={id}
          type={field.kind === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}

      {field.kind === 'list' ? (
        <p className="font-mono text-[10px] text-faint">Une entrée par ligne.</p>
      ) : null}

      {field.help ? <p className="font-mono text-[10px] text-faint">{field.help}</p> : null}

      {error ? (
        <p className="flex items-center gap-1.5 font-mono text-[11px] text-rose">
          <AlertIcon className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}

      {dirty && !error ? (
        <p className="font-mono text-[10px] text-amber">modification non enregistrée</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Editor                                                                    */
/* -------------------------------------------------------------------------- */

export function AdminContent() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [draft, setDraft] = useState<Draft>({});
  const [initial, setInitial] = useState<Draft>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [openGroup, setOpenGroup] = useState<string>(CONTENT_GROUPS[0] ?? '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await adminFetchSettings();
      const built = buildDraft(loaded);
      setSettings(loaded);
      setDraft(built);
      setInitial(built);
      setErrors({});
    } catch (caught) {
      setNotice({
        tone: 'error',
        text: caught instanceof ApiError ? caught.message : 'Chargement impossible',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isOverridden = (path: string) =>
    Object.prototype.hasOwnProperty.call(settings, path);

  const changedPaths = CONTENT_FIELDS.map((field) => field.path).filter(
    (path) => draft[path] !== initial[path],
  );

  const update = (path: string, value: string) => {
    setDraft((previous) => ({ ...previous, [path]: value }));
    setErrors((previous) => {
      if (!(path in previous)) return previous;
      const next = { ...previous };
      delete next[path];
      return next;
    });
  };

  const save = async () => {
    const patch: Record<string, unknown> = {};
    const nextErrors: Record<string, string> = {};

    for (const field of CONTENT_FIELDS) {
      if (!changedPaths.includes(field.path)) continue;
      try {
        patch[field.path] = fromText(field, draft[field.path] ?? '');
      } catch (caught) {
        nextErrors[field.path] = caught instanceof Error ? caught.message : 'Valeur invalide';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setNotice({ tone: 'error', text: 'Certains champs sont invalides. Rien n’a été enregistré.' });
      return;
    }

    if (Object.keys(patch).length === 0) {
      setNotice({ tone: 'ok', text: 'Aucune modification à enregistrer.' });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const saved = await adminSaveSettings(patch);
      const built = buildDraft(saved);
      setSettings(saved);
      setDraft(built);
      setInitial(built);
      setNotice({
        tone: 'ok',
        text: `${Object.keys(patch).length} champ(s) enregistré(s). Recharge le site pour les voir.`,
      });
    } catch (caught) {
      setNotice({
        tone: 'error',
        text: caught instanceof Error ? caught.message : 'Enregistrement impossible',
      });
    } finally {
      setBusy(false);
    }
  };

  const reset = async (path: string) => {
    setBusy(true);
    setNotice(null);
    try {
      const saved = await adminResetSetting(path);
      const built = buildDraft(saved);
      setSettings(saved);
      setDraft(built);
      setInitial(built);
      setNotice({ tone: 'ok', text: 'Champ réinitialisé à sa valeur par défaut.' });
    } catch (caught) {
      setNotice({
        tone: 'error',
        text: caught instanceof Error ? caught.message : 'Réinitialisation impossible',
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="py-16 text-center font-mono text-xs text-faint">chargement du contenu…</p>;
  }

  const overrideCount = Object.keys(settings).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-semibold text-ink">Contenu du site</h1>
          <p className="mt-1 font-mono text-[11px] text-faint">
            {CONTENT_FIELDS.length} champs · {overrideCount} modifié(s) par rapport aux valeurs par
            défaut
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={busy || changedPaths.length === 0}
            className="rounded-lg border border-acid/35 bg-acid/10 px-3 py-2 font-mono text-xs text-acid transition-colors hover:bg-acid/20 disabled:opacity-50"
          >
            {busy
              ? 'enregistrement…'
              : changedPaths.length > 0
                ? `enregistrer (${changedPaths.length})`
                : 'enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 font-mono text-xs text-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            <RefreshIcon className={cx('size-3.5', busy && 'animate-spin')} />
            recharger
          </button>
        </div>
      </div>

      {notice ? (
        <p
          role="status"
          className={cx(
            'rounded-lg border px-3 py-2 font-mono text-xs',
            notice.tone === 'ok'
              ? 'border-acid/30 bg-acid/5 text-acid'
              : 'border-rose/30 bg-rose/5 text-rose',
          )}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {CONTENT_GROUPS.map((group) => {
          const fields = CONTENT_FIELDS.filter((field) => field.group === group);
          const groupOverrides = fields.filter((field) => isOverridden(field.path)).length;
          const groupChanged = fields.filter(
            (field) => draft[field.path] !== initial[field.path],
          ).length;
          const open = openGroup === group;

          return (
            <div key={group} className="window-chrome overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenGroup(open ? '' : group)}
                aria-expanded={open}
                className="flex w-full flex-wrap items-center gap-3 border-b border-line bg-raised/50 px-4 py-2.5 text-left"
              >
                <span className="font-mono text-xs text-ink">{group}</span>
                {groupOverrides > 0 ? (
                  <span className="rounded border border-acid/30 px-1.5 py-0.5 font-mono text-[10px] text-acid">
                    {groupOverrides} modifié(s)
                  </span>
                ) : null}
                {groupChanged > 0 ? (
                  <span className="rounded border border-amber/40 px-1.5 py-0.5 font-mono text-[10px] text-amber">
                    {groupChanged} non enregistré(s)
                  </span>
                ) : null}
                <span className="ml-auto font-mono text-[11px] text-faint">
                  {open ? '−' : '+'}
                </span>
              </button>

              {open ? (
                <div className="grid gap-5 p-4 md:grid-cols-2">
                  {fields.map((field) => (
                    <div
                      key={field.path}
                      className={cx(
                        field.kind === 'json' || field.kind === 'list' || field.kind === 'textarea'
                          ? 'md:col-span-2'
                          : '',
                      )}
                    >
                      <Field
                        field={field}
                        value={draft[field.path] ?? ''}
                        dirty={draft[field.path] !== initial[field.path]}
                        overridden={isOverridden(field.path)}
                        error={errors[field.path] ?? null}
                        disabled={busy}
                        onChange={(value) => update(field.path, value)}
                        onReset={() => void reset(field.path)}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="font-mono text-[11px] leading-relaxed text-faint">
        Ces valeurs remplacent les textes compilés dans le site. « Réinitialiser » supprime la
        substitution et rétablit la valeur d'origine. Rien n'est perdu tant que tu n'as pas
        enregistré.
      </p>
    </div>
  );
}

// Settings — COPY.md §9. The notifications row is a statement, not a
// control: there are none, there never will be.

import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { SETTINGS_SCREEN, SYSTEM, WEIGHTS_SCREEN } from '../copy';
import { Button } from '../components/controls';
import { BackRow } from './Lever';
import { parseIcs } from '../calendar/ics';
import { eventsToWeeks } from '../calendar/classify';
import { buildExport, downloadJson, parseExport } from '../model/export';

export function SettingsScreen() {
  const nav = useNavigate();
  const store = useStore();
  const { settings, setSettings, weeks, weights, rules, importWeeks, wipe } = store;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [importNote, setImportNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    const text = await file.text();
    try {
      if (file.name.endsWith('.json') || text.trimStart().startsWith('{')) {
        const data = parseExport(text);
        await importWeeks(data.weeks, 'merge');
      } else {
        const events = parseIcs(text);
        const merged = eventsToWeeks(events, rules, weeks, settings.excludedCalendars);
        await importWeeks(merged, 'replace');
      }
      setImportNote(null);
    } catch {
      setImportNote(SYSTEM.badImport);
    }
  };

  return (
    <main className="screen">
      <BackRow onBack={() => nav('/')} />
      <h1 className="screen-title">{SETTINGS_SCREEN.title}</h1>

      <section className="card stack">
        <p className="row-title">{SETTINGS_SCREEN.checkInDay}</p>
        <div className="tile-grid-4" role="radiogroup" aria-label={SETTINGS_SCREEN.checkInDay}>
          {SETTINGS_SCREEN.days.map((day, i) => (
            <button
              key={day}
              type="button"
              role="radio"
              aria-checked={settings.checkInDay === i}
              className="tile day-tile"
              onClick={() => void setSettings({ ...settings, checkInDay: i })}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </section>

      <section className="card stack">
        <p className="row-title">{SETTINGS_SCREEN.theme}</p>
        <div className="btn-pair">
          <Button
            rank={settings.theme === 'light' ? 'primary' : 'secondary'}
            onClick={() => void setSettings({ ...settings, theme: 'light' })}
          >
            {SETTINGS_SCREEN.themeLight}
          </Button>
          <Button
            rank={settings.theme === 'dark' ? 'primary' : 'secondary'}
            onClick={() => void setSettings({ ...settings, theme: 'dark' })}
          >
            {SETTINGS_SCREEN.themeDark}
          </Button>
        </div>
        <p className="caption">{SETTINGS_SCREEN.themeNote}</p>
      </section>

      <section className="card stack">
        <p className="row-title">{SETTINGS_SCREEN.calendars}</p>
        <p className="caption">{SETTINGS_SCREEN.calendarsNote}</p>
        <Button rank="secondary" onClick={() => fileRef.current?.click()}>{SETTINGS_SCREEN.importIcs}</Button>
        <input
          ref={fileRef}
          type="file"
          accept=".ics,.json"
          className="visually-hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = '';
          }}
        />
        {importNote && <p className="body-text">{importNote}</p>}
      </section>

      <section className="card stack">
        <p className="row-title">{SETTINGS_SCREEN.notificationsLabel}</p>
        <p className="body-text">{SETTINGS_SCREEN.notificationsNote}</p>
      </section>

      <section className="card stack">
        <p className="row-title">{WEIGHTS_SCREEN.title}</p>
        <Button rank="secondary" onClick={() => nav('/weights')}>{WEIGHTS_SCREEN.title}</Button>
      </section>

      <section className="card stack">
        <Button rank="secondary" onClick={() => downloadJson(buildExport(weeks, weights, settings, rules))}>
          {SETTINGS_SCREEN.exportJson}
        </Button>
        <Button rank="secondary" onClick={() => nav('/summary')}>{SETTINGS_SCREEN.exportSummary}</Button>
      </section>

      <section className="card stack">
        {confirmingDelete ? (
          <>
            <p className="body-text">{SETTINGS_SCREEN.deleteConfirmBody}</p>
            <div className="btn-pair">
              <Button
                rank="secondary"
                onClick={async () => {
                  await wipe();
                  setConfirmingDelete(false);
                  nav('/onboarding');
                }}
              >
                {SETTINGS_SCREEN.deleteConfirm}
              </Button>
              <Button rank="secondary" onClick={() => setConfirmingDelete(false)}>{SETTINGS_SCREEN.keep}</Button>
            </div>
          </>
        ) : (
          <Button rank="quiet" onClick={() => setConfirmingDelete(true)}>{SETTINGS_SCREEN.deleteAll}</Button>
        )}
      </section>
    </main>
  );
}

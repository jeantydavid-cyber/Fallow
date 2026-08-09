// Minimal .ics parsing — the first-class import path (FALLOW-SPEC.md §8).
// Read-only; contents never leave the device.

export interface IcsEvent {
  uid: string;
  title: string;
  start: Date;
  end: Date | null;
  recurring: boolean;
  calendarName: string | null;
}

function unfold(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function parseIcsDate(value: string): Date | null {
  // 20260803T090000Z / 20260803T090000 / 20260803
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/);
  if (!m) return null;
  const [, y, mo, d, h = '0', mi = '0', s = '0', z] = m;
  if (z) return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  return new Date(+y, +mo - 1, +d, +h, +mi, +s);
}

function unescapeText(v: string): string {
  return v.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();
}

/** Parse VEVENTs out of an .ics file. Throws on files that are not ICS. */
export function parseIcs(text: string): IcsEvent[] {
  if (!/BEGIN:VCALENDAR/.test(text)) throw new Error('not-ics');
  const lines = unfold(text);
  const events: IcsEvent[] = [];
  let cur: Partial<IcsEvent> & { inEvent?: boolean } = {};
  let calendarName: string | null = null;

  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const left = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const prop = left.split(';')[0].toUpperCase();

    if (prop === 'X-WR-CALNAME') calendarName = unescapeText(value);
    if (prop === 'BEGIN' && value.trim() === 'VEVENT') {
      cur = { inEvent: true, recurring: false };
      continue;
    }
    if (!cur.inEvent) continue;

    switch (prop) {
      case 'UID': cur.uid = value.trim(); break;
      case 'SUMMARY': cur.title = unescapeText(value); break;
      case 'DTSTART': cur.start = parseIcsDate(value) ?? undefined; break;
      case 'DTEND': cur.end = parseIcsDate(value); break;
      case 'RRULE': cur.recurring = true; break;
      case 'END':
        if (value.trim() === 'VEVENT') {
          if (cur.title && cur.start) {
            events.push({
              uid: cur.uid ?? `${cur.title}-${cur.start.toISOString()}`,
              title: cur.title,
              start: cur.start,
              end: cur.end ?? null,
              recurring: cur.recurring ?? false,
              calendarName,
            });
          }
          cur = {};
        }
        break;
    }
  }
  return events;
}

export function eventHours(e: IcsEvent): number {
  if (!e.end) return 1;
  const h = (e.end.getTime() - e.start.getTime()) / 3600000;
  if (h <= 0 || h > 16) return 1;
  return Math.round(h * 2) / 2;
}

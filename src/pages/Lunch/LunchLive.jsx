import { useEffect } from 'react';
import SiteHeader from '../../components/SiteHeader';
import { SESSION } from '../../data/lunchSession';
import { zonedTimeToUtc, formatInTimeZone } from '../../../shared/tz';
import './LunchRegister.css';

// The stable join link: calendar invites sent a week out stay valid even if the stream URL is
// set late, because only this page (not the link itself) changes per session. See
// docs/2026-09-25-lunch-and-learn-registration-map.md, stage 5 of the attendee journey.
export default function LunchLive() {
  const startUtc = zonedTimeToUtc(SESSION.localStart, SESSION.timeZone);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = `Watch live | ${SESSION.seriesTitle}`;
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const dateLine = (() => {
    const p = formatInTimeZone(startUtc, SESSION.timeZone, { weekday: 'long', month: 'long', day: 'numeric' });
    const t = formatInTimeZone(startUtc, SESSION.timeZone, { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${p.weekday}, ${p.month} ${p.day} · ${t.hour}:${t.minute} ${(t.dayPeriod || '').toLowerCase()} MT`;
  })();

  return (
    <main className="lunch-page">
      <SiteHeader />
      <div className="ll-stage">
        <div className="ll-orb a" />
        <div className="ll-orb b" />
        <div className="ll-gridlines" />
        <div className="ll-live-wrap">
          <p className="ll-eyebrow">
            <span>{SESSION.seriesTitle}</span>
          </p>
          <h1>{SESSION.title}</h1>
          <p className="ll-session">{dateLine}</p>

          {SESSION.youtubeUrl ? (
            <div className="ll-live-player ll-glass">
              <iframe
                src={toYoutubeEmbed(SESSION.youtubeUrl)}
                title="Practical AI Lunch & Learn, live"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="ll-live-placeholder ll-glass">
              <p className="q">{dateLine}</p>
              <p className="help">The stream link appears here once it's live. No account needed to watch on YouTube.</p>
            </div>
          )}

          {SESSION.linkedinUrl && (
            <p className="ll-live-alt">
              Prefer LinkedIn?{' '}
              <a href={SESSION.linkedinUrl} target="_blank" rel="noreferrer">
                Watch on LinkedIn Live
              </a>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function toYoutubeEmbed(url) {
  try {
    const u = new URL(url);
    let id = u.searchParams.get('v');
    if (!id && u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    if (!id && u.pathname.includes('/live/')) id = u.pathname.split('/live/')[1];
    return id ? `https://www.youtube.com/embed/${id}?autoplay=0` : url;
  } catch {
    return url;
  }
}

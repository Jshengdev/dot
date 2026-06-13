import { useEffect, useState } from 'react';
import { Leva } from 'leva';
import GlassDot from './panels/GlassDot';
import GlassSlider from './panels/GlassSlider';
import GlassToggle from './panels/GlassToggle';

type Panel = { id: string; eyebrow: string; title: string; note: string; render: () => JSX.Element };

const PANELS: Panel[] = [
  {
    id: 'glass-dot',
    eyebrow: 'asset 01 · hero',
    title: 'the glass dot',
    note: 'A liquid metaball orb wearing the transmission skin — wet chrome, lit by studio streaks. It breathes; a droplet of the same liquid sags toward your cursor and merges; pressing it ignites a blue core that blooms. Ported from the slot-10 liquid-chrome reel, retinted to clean-blue.',
    render: () => <GlassDot />,
  },
  {
    id: 'glass-slider',
    eyebrow: 'asset 02 · liquid ui',
    title: 'the jelly slider',
    note: 'Drag the fill: the head follows on a lagged lerp while the trailing body lags slower — a fast drag stretches the mass into a neck that pinches off, all emergent from the metaball field. The blue strip inside the slot is what the glass refracts; it ignites on drag.',
    render: () => <GlassSlider />,
  },
  {
    id: 'glass-toggle',
    eyebrow: 'asset 03 · liquid ui',
    title: 'the glass toggle',
    note: 'Click to flip. The knob slides on a lagged follow with a trailing droplet, so it stretches a short neck mid-slide then merges. Flipping on ignites the blue fill the glass refracts — the activate beat, the only place the accent fires.',
    render: () => <GlassToggle />,
  },
];

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [ids.join(',')]);
  return active;
}

export default function App() {
  const active = useScrollSpy(PANELS.map((p) => p.id));

  return (
    <div className="lab">
      {/* one Leva panel for the whole lab — tune glass / slider live, tucked away */}
      <Leva collapsed />

      <aside className="rail">
        <div className="rail-brand">
          <span className="mark" />
          <span className="name">dot <span className="dim">· visual lab</span></span>
        </div>

        {PANELS.map((p, i) => (
          <a key={p.id} href={`#${p.id}`} className={`rail-link${active === p.id ? ' is-active' : ''}`}>
            <span className="idx">{String(i + 1).padStart(2, '0')}</span>
            <span>{p.title}</span>
          </a>
        ))}

        <div className="rail-foot">
          liquid-chrome UI<br />in clean-blue · #007AFF<br />light, not lines
        </div>
      </aside>

      <main className="main">
        {PANELS.map((p) => (
          <section key={p.id} id={p.id} className="panel">
            <div className="panel-eyebrow">{p.eyebrow}</div>
            <h2>{p.title}</h2>
            <p className="panel-note">{p.note}</p>
            {p.render()}
          </section>
        ))}
      </main>
    </div>
  );
}

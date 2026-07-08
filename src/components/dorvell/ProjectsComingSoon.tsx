import Link from "next/link";

type FuturePlate = {
  readonly index: string;
  readonly name: string;
  readonly note: string;
};

const FUTURE_PLATES: readonly FuturePlate[] = [
  {
    index: "01",
    name: "College Projects",
    note: "Journalism coursework and reported stories, from campus to Tampa.",
  },
  {
    index: "02",
    name: "Creative Tech",
    note: "Where the camera meets code — interactive pieces and small tools.",
  },
  {
    index: "03",
    name: "Research",
    note: "Longer visual studies, published with the notes left in.",
  },
  {
    index: "04",
    name: "Capstones",
    note: "Semester-defining work, documented from first pitch to final print.",
  },
  {
    index: "05",
    name: "Experiments",
    note: "Quick tests, odd angles, and unfinished ideas worth keeping.",
  },
];

const PROCESS_STEPS = [
  { index: "01", name: "Shoot & gather" },
  { index: "02", name: "Curate in the studio" },
  { index: "03", name: "Publish here" },
] as const;

function BlueprintFrame() {
  return (
    <svg className="proj-frame" viewBox="0 0 720 540" role="presentation" focusable="false">
      {/* Frame under construction — dashed outline */}
      <rect className="proj-frame__outline" x="100" y="60" width="520" height="380" />

      {/* Corner registration marks */}
      <g className="proj-frame__corners">
        <path d="M66 60H90M100 26V50" />
        <path d="M630 60h24M620 26v24" />
        <path d="M66 440h24M100 450v24" />
        <path d="M630 440h24M620 450v24" />
      </g>

      {/* Crosshair center */}
      <g className="proj-frame__crosshair">
        <line className="proj-frame__draw" x1="322" y1="250" x2="398" y2="250" pathLength={1} />
        <line
          className="proj-frame__draw proj-frame__draw--late"
          x1="360"
          y1="212"
          x2="360"
          y2="288"
          pathLength={1}
        />
        <circle
          className="proj-frame__draw proj-frame__draw--ring"
          cx="360"
          cy="250"
          r="30"
          pathLength={1}
        />
        <circle className="proj-frame__dot" cx="360" cy="250" r="2.5" />
      </g>

      {/* Dimension lines + ticks */}
      <g className="proj-frame__dims">
        <path d="M100 452v54M620 452v54" />
        <path d="M100 498h520" />
        <path d="M95 503l10-10M615 503l10-10" />
        <path d="M648 60v380" />
        <path d="M643 65l10-10M643 445l10-10" />
      </g>
      <text className="proj-frame__label proj-frame__label--dim" x="360" y="524" textAnchor="middle">
        520.0 — opening width, tbc
      </text>
      <text
        className="proj-frame__label proj-frame__label--dim"
        transform="translate(672 250) rotate(-90)"
        textAnchor="middle"
      >
        380.0 — hang height
      </text>

      {/* Annotations */}
      <g className="proj-frame__annos">
        <path className="proj-frame__leader" d="M240 100h60l52 118" />
        <text className="proj-frame__label" x="126" y="104">
          fig. 01 — forthcoming
        </text>
        <text className="proj-frame__label" x="594" y="150" textAnchor="end">
          plate reserved
        </text>
      </g>

      {/* Title block */}
      <g className="proj-frame__block">
        <rect x="448" y="372" width="172" height="68" />
        <path d="M448 394h172M448 417h172" />
        <text className="proj-frame__label" x="460" y="388">
          df — projects
        </text>
        <text className="proj-frame__label" x="460" y="410">
          plate 01 · scale 1:1
        </text>
        <text className="proj-frame__label" x="460" y="433">
          rev — · date tbc
        </text>
      </g>
    </svg>
  );
}

export function ProjectsComingSoon() {
  return (
    <>
      <section className="proj-hero" aria-labelledby="projects-title">
        <div className="proj-wrap proj-hero__layout">
          <div className="proj-hero__copy">
            <p className="proj-kicker proj-reveal proj-reveal--1">
              Projects — College &amp; Creative Research
            </p>
            <h1 id="projects-title" className="proj-hero__title proj-reveal proj-reveal--2">
              The next wing is on the drafting table.
            </h1>
            <p className="proj-hero__lede proj-reveal proj-reveal--3">
              College projects and creative-tech research are being curated in the studio right
              now. When a piece is ready to hang, it hangs here first.
            </p>
            <div className="proj-hero__actions proj-reveal proj-reveal--4">
              <Link className="button-primary" href="/work">
                See the photo archive
              </Link>
              <Link className="button-secondary" href="/contact">
                Get in touch
              </Link>
            </div>
            <p className="proj-hero__note proj-reveal proj-reveal--5">
              No date on the door yet — the work decides.
            </p>
          </div>

          <div className="proj-hero__visual proj-reveal proj-reveal--3" aria-hidden="true">
            <BlueprintFrame />
            <span className="proj-stamp">
              <span className="proj-stamp__label">In development</span>
              <span className="proj-stamp__meta">df · projects · tampa</span>
            </span>
          </div>
        </div>
      </section>

      <section className="proj-index" aria-labelledby="projects-index-title">
        <div className="proj-wrap">
          <header className="proj-section-head">
            <p className="proj-kicker">Future index</p>
            <h2 id="projects-index-title" className="proj-section-head__title">
              Five rooms, reserved.
            </h2>
            <p className="proj-section-head__note">
              Each plate below holds a wall. Nothing hangs before it is ready.
            </p>
          </header>
          <ul className="proj-index__grid">
            {FUTURE_PLATES.map((plate) => (
              <li key={plate.index} className="proj-plate">
                <div className="proj-plate__row">
                  <span className="proj-plate__index">{plate.index}</span>
                  <span className="proj-plate__tag">Soon</span>
                </div>
                <h3 className="proj-plate__name">{plate.name}</h3>
                <p className="proj-plate__note">{plate.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="proj-process" aria-labelledby="projects-process-title">
        <div className="proj-wrap proj-process__band">
          <h2 id="projects-process-title" className="proj-process__title">
            How work arrives
          </h2>
          <ol className="proj-process__steps">
            {PROCESS_STEPS.map((step) => (
              <li key={step.index} className="proj-process__step">
                <span className="proj-process__step-index">{step.index}</span>
                <span className="proj-process__step-name">{step.name}</span>
              </li>
            ))}
          </ol>
          <p className="proj-process__note">
            The Photo Curation Studio feeds this page — selects graded, sequenced, then published.
          </p>
        </div>
      </section>

      <section className="proj-closing" aria-labelledby="projects-closing-title">
        <div className="proj-wrap">
          <div className="proj-closing__frame">
            <h2 id="projects-closing-title" className="proj-closing__line">
              Want the first look when this opens?
            </h2>
            <Link className="button-primary" href="/contact">
              Contact Dorvell
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

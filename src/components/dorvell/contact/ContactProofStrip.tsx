const CREDENTIALS = [
  { role: "Freelance Professional Photographer", note: "2019 — present" },
  { role: "University Photographer", note: "Troy University" },
  { role: "Photojournalist", note: "Blue Fish" },
  { role: "Concert / photo coverage", note: "credited by Creative Loafing Tampa" },
];

/**
 * Compact credibility line — small, clean, no paragraphs. Establishes that the
 * person you are contacting has a real editorial and event track record.
 */
export function ContactProofStrip() {
  return (
    <section className="contact-proof" aria-label="Credentials">
      <ul className="contact-proof__list">
        {CREDENTIALS.map((item) => (
          <li key={item.role} className="contact-proof__item">
            <strong>{item.role}</strong>
            <span>{item.note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

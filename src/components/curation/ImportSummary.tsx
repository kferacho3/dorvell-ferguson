"use client";

import type { ImportSummaryResult } from "@/lib/curation/types";
import { StudioModal } from "@/components/curation/StudioModal";

type ImportSummaryProps = {
  result: ImportSummaryResult;
  onClose: () => void;
};

function NameList({ names, max = 12 }: { names: string[]; max?: number }) {
  if (names.length === 0) return null;
  return (
    <ul className="studio-import__names">
      {names.slice(0, max).map((name) => (
        <li key={name}>{name}</li>
      ))}
      {names.length > max ? <li>… and {(names.length - max).toLocaleString()} more</li> : null}
    </ul>
  );
}

export function ImportSummary({ result, onClose }: ImportSummaryProps) {
  return (
    <StudioModal labelledBy="studio-import-title" onClose={onClose}>
      <h2 id="studio-import-title">{result.ok ? "Progress restored" : "Import failed"}</h2>

        {result.ok ? (
          <>
            <p className="studio-import__lede">Review the import summary before continuing.</p>
            <dl className="studio-import__stats">
              <div>
                <dt>Decisions in report</dt>
                <dd>{result.totalInReport.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Restored</dt>
                <dd>{result.restored.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Matched by id</dt>
                <dd>{result.matchedById.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Matched by filename</dt>
                <dd>{result.matchedByFilename.toLocaleString()}</dd>
              </div>
            </dl>

            {result.missingFromCurrent.length > 0 ? (
              <section>
                <h3>In the report but not on this site right now ({result.missingFromCurrent.length.toLocaleString()})</h3>
                <p>Usually uploaded photos that need re-uploading — their decisions are kept.</p>
                <NameList names={result.missingFromCurrent} />
              </section>
            ) : null}

            {result.newSinceReport.length > 0 ? (
              <section>
                <h3>New photos not in the report ({result.newSinceReport.length.toLocaleString()})</h3>
                <p>These still need review.</p>
                <NameList names={result.newSinceReport} />
              </section>
            ) : null}

            {result.conflicts.length > 0 ? (
              <section>
                <h3>Conflicts ({result.conflicts.length.toLocaleString()})</h3>
                <NameList names={result.conflicts} />
              </section>
            ) : null}

            {result.validationIssues.length > 0 ? (
              <section>
                <h3>Validation notes ({result.validationIssues.length.toLocaleString()})</h3>
                <NameList names={result.validationIssues} />
              </section>
            ) : null}
          </>
        ) : (
          <>
            <p className="studio-import__error">{result.error}</p>
            {result.errorHint ? <p className="studio-import__hint">{result.errorHint}</p> : null}
            <p className="studio-import__hint">Your existing local progress was not changed.</p>
          </>
        )}

      <div className="studio-modal__actions">
        <button type="button" className="studio-button studio-button--primary" onClick={onClose}>
          {result.ok ? "Continue" : "Close"}
        </button>
      </div>
    </StudioModal>
  );
}

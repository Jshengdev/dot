'use client';
import type { ReportSO } from '@dot/backend';
import { useInView } from '../lib/hooks';

// ProviderReport — the pre-visit artifact (PROVIDER-REPORT.md). SOAP Subjective /
// Objective split ONLY — DOT NEVER authors Assessment or Plan (that boundary IS the
// guardrail). Header states it plainly: "patient-generated · not a medical record".
// Every line maps to a real Story/stat field (report.subjective / report.objective).
export function ProviderReport({ report }: { report: ReportSO }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`report reveal${inView ? ' in' : ''}`}>
      <div className="ring-panel report-sheet">
        <div className="report-header">{report.header}</div>
        <div className="report-meta">
          prepared for {report.preparedFor} · {report.date}
        </div>

        <section className="report-section">
          <h4 className="report-h">
            Subjective <span className="report-h-sub">— what they feel / report</span>
          </h4>
          <ul className="report-list">
            {report.subjective.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>

        <section className="report-section">
          <h4 className="report-h">
            Objective <span className="report-h-sub">— counted, dated, measurable</span>
          </h4>
          <ul className="report-list report-list--mono">
            {report.objective.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </section>

        {/* The line DOT must not cross — Assessment + Plan are the clinician's. */}
        <div className="report-foot">
          Assessment &amp; Plan stay with your clinician. DOT hands them a well-formed
          story — never a diagnosis.
        </div>
      </div>
    </div>
  );
}

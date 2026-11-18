'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileDown,
  FileJson,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  ShieldCheck,
  AlertTriangle,
  Play,
  Info,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { useMLNetwork } from '@/lib/ml/mlContext';
import {
  buildCsvString,
  buildReportPayload,
  generateSimplePdfBytes,
  SYSTEM_LIMITATIONS,
} from '@/lib/ml/hybridEngine';

function triggerDownload(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function MLReportsPage() {
  const {
    metadata,
    analysisOutput,
    alerts,
    incidents,
    rfArtifact,
    runCompleteDemoWorkflow,
  } = useMLNetwork();

  const [onlyAlertsCsv, setOnlyAlertsCsv] = useState(false);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const handleDownloadCsv = () => {
    if (!analysisOutput) return;
    if (onlyAlertsCsv && alerts.length > 0) {
      const csv = buildCsvString(alerts as unknown as Record<string, any>[]);
      triggerDownload(csv, `sentinelmesh_alerts_${stamp}.csv`, 'text/csv;charset=utf-8;');
    } else {
      const flat = analysisOutput.results.map(({ topDeviations: _td, ...rest }) => rest);
      const csv = buildCsvString(flat as unknown as Record<string, any>[]);
      triggerDownload(csv, `sentinelmesh_network_results_${stamp}.csv`, 'text/csv;charset=utf-8;');
    }
  };

  const handleDownloadJson = () => {
    if (!analysisOutput || !metadata) return;
    const payload = buildReportPayload({
      datasetName: metadata.filename,
      isSyntheticDemo: metadata.isSyntheticDemo,
      output: analysisOutput,
      alerts,
      incidents,
      rfArtifact: analysisOutput.usedSupervised ? rfArtifact : null,
    });
    triggerDownload(
      JSON.stringify(payload, null, 2),
      `sentinelmesh_security_report_${stamp}.json`,
      'application/json'
    );
  };

  const handleDownloadPdf = () => {
    if (!analysisOutput || !metadata) return;
    const payload = buildReportPayload({
      datasetName: metadata.filename,
      isSyntheticDemo: metadata.isSyntheticDemo,
      output: analysisOutput,
      alerts,
      incidents,
      rfArtifact: analysisOutput.usedSupervised ? rfArtifact : null,
    });
    const pdfBytes = generateSimplePdfBytes(payload);
    triggerDownload(pdfBytes as unknown as BlobPart, `sentinelmesh_executive_report_${stamp}.pdf`, 'application/pdf');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FA] text-[#172B4D]">
      <Header
        title="Security Reports & Digital Education Ecosystem"
        subtitle="Export real ML detection results, correlated incidents & analyst triage findings (CSV / JSON / PDF) and explore institutional applicability"
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* SECTION 1: REPORT EXPORT CENTER */}
        <section className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                <FileDown className="w-4 h-4 text-[#2563EB]" />
                Security Analysis Report Generation
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                All reports are generated exclusively from your live analyzed dataset, ML evaluation metrics, and persisted analyst triage statuses.
              </p>
            </div>
            {analysisOutput && (
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#172B4D]">
                <input
                  type="checkbox"
                  checked={onlyAlertsCsv}
                  onChange={(e) => setOnlyAlertsCsv(e.target.checked)}
                  className="accent-[#2563EB]"
                />
                Export only flagged alerts in CSV
              </label>
            )}
          </div>

          {!analysisOutput || !metadata ? (
            <div className="p-8 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-center space-y-3">
              <FileText className="w-8 h-8 text-[#94A3B8] mx-auto" />
              <h3 className="text-sm font-bold text-[#172B4D]">No Analysis Ready for Export</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                Run network traffic analysis first (or trigger the synthetic demo workflow below) to generate downloadable CSV, JSON, and PDF security reports.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={runCompleteDemoWorkflow}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] text-[#FFFFFF] text-xs font-bold hover:bg-[#1D4ED8]"
                >
                  <Play className="w-3.5 h-3.5" /> Run Synthetic Demo Workflow
                </button>
                <Link
                  href="/network-ml"
                  className="px-4 py-2 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] text-xs font-bold text-[#172B4D]"
                >
                  Go to Traffic Analysis
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                  <p className="text-[10px] font-bold uppercase text-[#64748B]">Dataset</p>
                  <p className="font-bold text-[#172B4D] mt-1 truncate">{metadata.filename}</p>
                  <p className="text-[11px] text-[#64748B]">
                    {metadata.isSyntheticDemo ? 'Synthetic Demo Data' : 'Uploaded CSV'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                  <p className="text-[10px] font-bold uppercase text-[#64748B]">Flows Analyzed</p>
                  <p className="text-xl font-extrabold text-[#172B4D] mt-0.5">
                    {analysisOutput.summary.totalRecords.toLocaleString()}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                  <p className="text-[10px] font-bold uppercase text-[#64748B]">Alerts / Incidents</p>
                  <p className="text-xl font-extrabold text-[#DC2626] mt-0.5">
                    {alerts.length} / {incidents.length}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                  <p className="text-[10px] font-bold uppercase text-[#64748B]">RF Test Accuracy</p>
                  <p className="text-xl font-extrabold text-[#15803D] mt-0.5">
                    {rfArtifact && analysisOutput.usedSupervised
                      ? `${(rfArtifact.metrics.accuracy * 100).toFixed(1)}%`
                      : 'Unsupervised'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="p-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] text-left transition shadow-sm flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold">Download CSV Dataset</p>
                    <p className="text-[11px] opacity-85 mt-0.5">
                      {onlyAlertsCsv ? `${alerts.length} structured alerts` : `${analysisOutput.results.length} analyzed flows`}
                    </p>
                  </div>
                  <FileSpreadsheet className="w-6 h-6 opacity-90" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="p-4 rounded-xl bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#2563EB] text-[#172B4D] text-left transition flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold">Download Structured JSON</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">Summary, models, alerts &amp; incidents</p>
                  </div>
                  <FileJson className="w-6 h-6 text-[#2563EB]" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="p-4 rounded-xl bg-[#172B4D] hover:bg-[#0F172A] text-[#FFFFFF] text-left transition shadow-sm flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold">Download Executive PDF</p>
                    <p className="text-[11px] opacity-80 mt-0.5">Concise formatted security report</p>
                  </div>
                  <FileText className="w-6 h-6 opacity-90" />
                </button>
              </div>
            </>
          )}
        </section>

        {/* SECTION 2: SECURING THE DIGITAL EDUCATION ECOSYSTEM (PRASUNEX ROUND 3) */}
        <section className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" />
              PRASUNEX Innovathon 2026 • Potential Institutional Application
            </span>
            <h2 className="text-xl font-extrabold text-[#172B4D]">
              Securing the Digital Education Ecosystem
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Modern digital education platforms connect students, parents, teachers, recruiters, and administrators
              across interconnected networks and cloud services. SENTINELMESH explores how explainable AI/ML threat
              detection can eventually help protect critical institutional infrastructure:
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#2563EB]/25 text-xs text-[#172B4D] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
            <span>
              <strong>Independence Disclosure:</strong> SENTINELMESH is an independent cybersecurity project in the
              AI/ML domain. It is <strong>not</strong> a School ERP and is <strong>not</strong> claimed to be an
              officially integrated PRASUNEX product.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {[
              {
                title: 'School ERP Infrastructure',
                desc: 'Monitor administrative & database servers for brute-force login attempts, anomalous query bursts, or unauthorized port access.',
              },
              {
                title: 'Student & Parent Portals',
                desc: 'Surface automated credential-stuffing behavior and repeated authentication failures before account takeover occurs.',
              },
              {
                title: 'Digital Learning & Exam Platforms',
                desc: 'Identify sudden packet-rate surges (DDoS-like behavior) targeting online exam portals or classroom streaming systems.',
              },
              {
                title: 'Teacher & Administrator Systems',
                desc: 'Correlate repeated suspicious flows originating from a single compromised administrative workstation.',
              },
              {
                title: 'Institutional Campus Networks',
                desc: 'Detect unauthorized internal or external port scanning probing exposed campus services (SSH, RDP, SMB, MySQL).',
              },
              {
                title: 'Sensitive Institutional Data Environments',
                desc: 'Flag highly asymmetric outbound byte transfers over non-standard ports to assist DLP and privacy investigations.',
              },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1.5">
                <h3 className="font-bold text-[#172B4D] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                  {item.title}
                </h3>
                <p className="text-[#64748B] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-[#15803D]/5 border border-[#15803D]/20 space-y-2">
              <h3 className="font-bold text-[#15803D]">Potential Operational Benefits</h3>
              <ul className="list-disc list-inside space-y-1 text-[#334155]">
                <li>Earlier identification of suspicious network behavior beyond rigid signatures.</li>
                <li>Improved visibility into institutional subnets, protocols, and destination ports.</li>
                <li>Faster security investigation via Z-score feature explanations &amp; host grouping.</li>
                <li>Better awareness of potential digital threats through readable executive reports.</li>
                <li>Support for resource-constrained institutional cybersecurity teams.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#D97706]/5 border border-[#D97706]/20 space-y-2">
              <h3 className="font-bold text-[#92400E] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Honest MVP Limitations &amp; Roadmap
              </h3>
              <ul className="list-disc list-inside space-y-1 text-[#334155]">
                {SYSTEM_LIMITATIONS.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

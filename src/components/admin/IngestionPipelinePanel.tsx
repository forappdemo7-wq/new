import React, { useState } from 'react';
import { runIngestionJob, IngestionJobConfig, IngestionSummary, IngestionResultItem } from '../../../server/services/ingestionPipeline';
import { LicenseVerificationGate } from '../../../server/services/licenseGate';
import { useLibrary } from '../../context/LibraryContext';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Layers,
  BookOpen,
  Image as ImageIcon,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Sliders,
  Check
} from 'lucide-react';

export const IngestionPipelinePanel: React.FC = () => {
  const { works, addAuditLog, createOrUpdateWork } = useLibrary();

  const [selectedSource, setSelectedSource] = useState<IngestionJobConfig['source']>('all');
  const [batchLimit, setBatchLimit] = useState<number>(10);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeJobSummary, setActiveJobSummary] = useState<IngestionSummary | null>(null);
  const [healthCheckLogs, setHealthCheckLogs] = useState<string[]>([]);
  const [isHealthChecking, setIsHealthChecking] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const handleRunIngestion = async () => {
    setIsRunning(true);
    setStatusNotification('Ingestion job started. Connecting to archival repositories...');

    try {
      const summary = await runIngestionJob({
        source: selectedSource,
        limit: batchLimit,
        dryRun: false
      });

      setActiveJobSummary(summary);
      setStatusNotification(`Job completed! Ingested ${summary.publishedCount} verified works (${summary.needsReviewCount} flagged for review).`);

      // Automatically add license audits
      summary.items.forEach((item) => {
        if (item.status === 'published') {
          addAuditLog({
            workId: item.id,
            workTitle: item.title,
            verifiedBy: `Bulk Ingestion Engine (${item.source})`,
            evidenceUrl: `Archival API Source: ${item.sourceId}`,
            jurisdictionNotes: item.reason || `Automated ingestion cleared under ${item.licenseCode} (${item.jurisdiction})`,
            status: 'verified'
          });
        }
      });
    } catch (error: any) {
      setStatusNotification(`Ingestion failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunDailyHealthAudit = async () => {
    setIsHealthChecking(true);
    setHealthCheckLogs(['[START] Initiating 24-hour copyright & source health audit across all cataloged titles...']);

    try {
      const result = await LicenseVerificationGate.runDailySourceHealthCheck(works);
      setHealthCheckLogs(result.logs);
      setStatusNotification(`Audit complete: ${result.auditedCount} works verified, ${result.unreachableCount} anomalies flagged.`);
    } catch (error: any) {
      setHealthCheckLogs((prev) => [...prev, `[ERROR] Health audit failed: ${error?.message || 'Unknown error'}`]);
    } finally {
      setIsHealthChecking(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Manifesto */}
      <div className="p-5 rounded-lg bg-stone-900 text-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
            <Database className="w-4 h-4" />
            <span>High-Throughput Archival Ingestion Engine (Part 2)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-mono border border-emerald-800">
            Workers Active
          </span>
        </div>
        <p className="text-sm text-stone-300 max-w-3xl leading-relaxed">
          The Automated Ingestion Pipeline connects to global open repositories (Project Gutenberg RDF, Internet Archive, Smithsonian Libraries, Digital Comic Museum, Comic Book Plus, xkcd API, Pepper&Carrot, and Ubunchu). Ingested items are deduplicated, license-gated, thumbnailed, and indexed into Meilisearch.
        </p>
      </div>

      {statusNotification && (
        <div className="p-3.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingestion Controller */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-[#1A1918] rounded-lg border border-[#E5E3DD] dark:border-stone-800 space-y-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#3B4CCA]" />
              <span>Job Configuration &amp; Trigger</span>
            </h3>
            <span className="text-xs font-mono text-stone-500">Queue: BullMQ / Redis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Archival Source Connector
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value as any)}
                className="w-full p-2.5 rounded border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 font-medium"
              >
                <option value="all">⚡ All Verified Repositories (Parallel Batch)</option>
                <option value="gutenberg">📚 Project Gutenberg (RDF Catalog)</option>
                <option value="internet_archive">🏛️ Internet Archive / LibriVox Audio</option>
                <option value="dcm">💥 Digital Comic Museum (Golden Age CBZ)</option>
                <option value="cbp">🦸 Comic Book Plus (Silver Age CBZ)</option>
                <option value="hokusai">🌸 Smithsonian Hokusai Manga CC0</option>
                <option value="ubunchu">🐧 Ubunchu! Manga (Creator Verified)</option>
                <option value="xkcd">🌐 xkcd Webcomic API (CC-BY-NC)</option>
                <option value="peppercarrot">🥕 Pepper &amp; Carrot (Open Anthology)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Batch Ingestion Limit (per source)
              </label>
              <select
                value={batchLimit}
                onChange={(e) => setBatchLimit(Number(e.target.value))}
                className="w-full p-2.5 rounded border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 font-medium"
              >
                <option value={5}>5 items (Quick Test)</option>
                <option value={10}>10 items (Standard Batch)</option>
                <option value={25}>25 items (Throttled Sync)</option>
                <option value={100}>100 items (Deep Archive)</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleRunIngestion}
              disabled={isRunning}
              className={`px-5 py-2.5 rounded text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-xs ${
                isRunning
                  ? 'bg-stone-400 cursor-not-allowed'
                  : 'bg-[#3B4CCA] hover:bg-[#303EAA] cursor-pointer'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Ingestion Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Live Ingestion Job</span>
                </>
              )}
            </button>

            <button
              onClick={handleRunDailyHealthAudit}
              disabled={isHealthChecking}
              className="px-4 py-2.5 rounded text-xs font-semibold border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isHealthChecking ? 'Auditing URLs...' : 'Run 24h License Health Check'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Connector Specs Card */}
        <div className="p-5 bg-stone-50 dark:bg-[#151413] rounded-lg border border-[#E5E3DD] dark:border-stone-800 space-y-4">
          <h4 className="font-serif text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
            Active Archival Feeds
          </h4>
          <ul className="space-y-2.5 text-xs text-stone-600 dark:text-stone-400 font-sans">
            <li className="flex items-center justify-between pb-1.5 border-b border-stone-200 dark:border-stone-800">
              <span className="font-medium text-stone-800 dark:text-stone-200">Project Gutenberg RDF</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 text-[11px]">Online (XML)</span>
            </li>
            <li className="flex items-center justify-between pb-1.5 border-b border-stone-200 dark:border-stone-800">
              <span className="font-medium text-stone-800 dark:text-stone-200">Internet Archive Items API</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 text-[11px]">Online (JSON)</span>
            </li>
            <li className="flex items-center justify-between pb-1.5 border-b border-stone-200 dark:border-stone-800">
              <span className="font-medium text-stone-800 dark:text-stone-200">Digital Comic Museum</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 text-[11px]">Online (CBZ)</span>
            </li>
            <li className="flex items-center justify-between pb-1.5 border-b border-stone-200 dark:border-stone-800">
              <span className="font-medium text-stone-800 dark:text-stone-200">Smithsonian Open Access</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 text-[11px]">CC0 API</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="font-medium text-stone-800 dark:text-stone-200">xkcd Webcomic Archive</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 text-[11px]">REST API</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Ingestion Results Table */}
      {activeJobSummary && (
        <div className="p-5 bg-white dark:bg-[#1A1918] rounded-lg border border-[#E5E3DD] dark:border-stone-800 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">
                Job Output: {activeJobSummary.jobId}
              </h3>
              <p className="text-xs text-stone-500 font-mono">
                Source: {activeJobSummary.source.toUpperCase()} · Completed: {new Date(activeJobSummary.completedAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                ✓ {activeJobSummary.publishedCount} Published
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">
                ⚠️ {activeJobSummary.needsReviewCount} Needs Review
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="p-3">Title &amp; Work Type</th>
                  <th className="p-3">Archival Source</th>
                  <th className="p-3">Verified License</th>
                  <th className="p-3">Jurisdiction</th>
                  <th className="p-3">Compliance Status</th>
                  <th className="p-3">Indexed Files</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800 font-sans">
                {activeJobSummary.items.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/50">
                    <td className="p-3">
                      <div className="font-serif font-bold text-stone-900 dark:text-stone-100">
                        {item.title}
                      </div>
                      <span className="text-[10px] font-mono text-stone-500 uppercase">
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3 text-stone-600 dark:text-stone-300 font-medium">
                      {item.source}
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        {item.licenseCode}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-stone-600 dark:text-stone-400">
                      {item.jurisdiction}
                    </td>
                    <td className="p-3">
                      {item.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Published</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Flagged (Review)</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        {item.filesIndexed.map((ext) => (
                          <span key={ext} className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            {ext}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Health Check Log Viewer */}
      {healthCheckLogs.length > 0 && (
        <div className="p-5 bg-stone-900 text-stone-200 rounded-lg space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="text-amber-400 font-bold">24-Hour Source URL &amp; License Audit Stream</span>
            <span className="text-stone-400 text-[10px]">{healthCheckLogs.length} events recorded</span>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1 text-[11px] text-stone-300">
            {healthCheckLogs.map((log, idx) => (
              <div key={idx} className={log.includes('[QUARANTINE]') ? 'text-rose-400' : log.includes('[WARN]') ? 'text-amber-300' : 'text-stone-300'}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

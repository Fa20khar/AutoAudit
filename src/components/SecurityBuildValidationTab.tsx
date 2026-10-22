import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, XCircle, RefreshCw, CheckCircle2, 
  Lock, KeyRound, Database, FileCode, Server, Terminal, Copy, CheckCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface SecurityCheckItem {
  id: string;
  category: 'dependencies' | 'cryptography' | 'authentication' | 'rate_limiting' | 'client_bundle' | 'database';
  name: string;
  status: 'passed' | 'failed' | 'warning';
  severity: 'critical' | 'high' | 'medium' | 'info';
  details: string;
}

interface SecurityBuildReport {
  overallStatus: 'PASSED' | 'FAILED' | 'WARNING';
  timestamp: string;
  executionTimeMs: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  checks: SecurityCheckItem[];
  environment: {
    nodeEnv: string;
    jwtConfigured: boolean;
    mongoConnected: boolean;
    nodeVersion: string;
  };
}

export const SecurityBuildValidationTab: React.FC = () => {
  const { showToast } = useToast();
  const [report, setReport] = useState<SecurityBuildReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const res = await api.getSecurityBuildReport();
      if (res.success && res.data) {
        setReport(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load security build report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleRunValidation = async () => {
    try {
      setIsRunning(true);
      const res = await api.runSecurityBuildValidation();
      if (res.success && res.data) {
        setReport(res.data);
        showToast({
          title: 'Security Build Validated',
          message: `Passed ${res.data.passedChecks} of ${res.data.totalChecks} checks in ${res.data.executionTimeMs}ms.`,
          type: res.data.overallStatus === 'FAILED' ? 'error' : 'success'
        });
      } else {
        showToast({
          title: 'Validation Error',
          message: res.error || 'Failed to complete validation pipeline.',
          type: 'error'
        });
      }
    } catch (err: any) {
      showToast({
        title: 'Validation Failed',
        message: err.message || 'Execution error during security validation.',
        type: 'error'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyCertificate = () => {
    if (!report) return;
    const cert = [
      '====================================================',
      '🔒 AutoAudit Security Build & Subsystem Certificate',
      '====================================================',
      `Overall Status:   ${report.overallStatus}`,
      `Timestamp:        ${report.timestamp}`,
      `Total Checks:     ${report.totalChecks}`,
      `Passed Checks:    ${report.passedChecks}`,
      `Warnings:         ${report.warningChecks}`,
      `Failures:         ${report.failedChecks}`,
      `Environment:      ${report.environment.nodeEnv}`,
      `JWT Configured:   ${report.environment.jwtConfigured ? 'Yes (>=32 chars)' : 'Ephemeral (Dev)'}`,
      `MongoDB Atlas:    ${report.environment.mongoConnected ? 'Connected' : 'In-Memory fallback'}`,
      '----------------------------------------------------',
      ...report.checks.map(c => `[${c.status.toUpperCase()}] ${c.name}: ${c.details}`),
      '===================================================='
    ].join('\n');

    navigator.clipboard.writeText(cert);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast({
      title: 'Certificate Copied',
      message: 'Security Build Audit Certificate copied to clipboard.',
      type: 'success'
    });
  };

  const filteredChecks = report?.checks.filter(c => {
    if (selectedCategory === 'all') return true;
    return c.category === selectedCategory;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${
              report?.overallStatus === 'PASSED' 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                : report?.overallStatus === 'WARNING'
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Security Build Validation Engine</h2>
                {report && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    report.overallStatus === 'PASSED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : report.overallStatus === 'WARNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {report.overallStatus}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Automated continuous verification of cryptographic signing, Bun dependency integrity, rate limiting, and client bundle secret isolation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyCertificate}
              disabled={!report}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Certificate'}</span>
            </button>

            <button
              onClick={handleRunValidation}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Checks...' : 'Validate Security Build'}</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        {report && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100 text-center">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-500 font-medium block">Total Checks</span>
              <span className="text-xl font-bold text-slate-900">{report.totalChecks}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-xs text-emerald-700 font-medium block">Passed</span>
              <span className="text-xl font-bold text-emerald-800">{report.passedChecks}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-xs text-amber-700 font-medium block">Warnings</span>
              <span className="text-xl font-bold text-amber-800">{report.warningChecks}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-xs text-rose-700 font-medium block">Failures</span>
              <span className="text-xl font-bold text-rose-800">{report.failedChecks}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-500 font-medium block">Latency</span>
              <span className="text-xl font-bold text-slate-900">{report.executionTimeMs}ms</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-500 font-medium block">Environment</span>
              <span className="text-xl font-bold text-slate-900 uppercase">{report.environment.nodeEnv}</span>
            </div>
          </div>
        )}
      </div>

      {/* Security Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Cryptographic Tokens</h3>
              <p className="text-xs text-slate-500">JWT HS256 / 8-Hour Session</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strict algorithm pinning, issuer & audience claim validation, and constant-time string comparison for timing attack defense.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Multi-Factor Engine</h3>
              <p className="text-xs text-slate-500">RFC 6238 TOTP Authenticator</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Time-based one-time password engine with 30s step, ±1 step clock drift tolerance, Base32 encoding, and emergency backup keys.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Bundle Secret Isolation</h3>
              <p className="text-xs text-slate-500">Vite Production Distribution</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Automated static scanning verifies zero server-side JWT secrets, bcrypt hashes, or backend dependencies are bundled into browser JS.
          </p>
        </div>
      </div>

      {/* Itemized Checks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900">Security Build Audit Items</h3>
            <p className="text-xs text-slate-500 mt-0.5">Automated validation criteria across system tiers</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'dependencies', 'cryptography', 'authentication', 'rate_limiting', 'client_bundle', 'database'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-sm font-medium">Running security build validation pipeline...</p>
          </div>
        ) : filteredChecks.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm">No checks match the selected category.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredChecks.map((check) => (
              <div key={check.id} className="p-4 sm:px-6 hover:bg-slate-50/70 transition-colors flex items-start gap-4">
                <div className="mt-0.5">
                  {check.status === 'passed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : check.status === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900 text-sm">{check.name}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 uppercase tracking-wider">
                      {check.category.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                      check.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800'
                        : check.severity === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {check.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{check.details}</p>
                </div>

                <div>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    check.status === 'passed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : check.status === 'warning'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {check.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CLI Integration Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-700" />
            <span>CLI Validation: <code className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-800 font-mono">npm run validate:security-build</code></span>
          </div>
          {report && (
            <span>Last audit executed: {new Date(report.timestamp).toLocaleTimeString()} ({new Date(report.timestamp).toLocaleDateString()})</span>
          )}
        </div>
      </div>
    </div>
  );
};

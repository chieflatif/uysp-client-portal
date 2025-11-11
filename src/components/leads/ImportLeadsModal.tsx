'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { X, Upload, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { theme } from '@/theme';
import {
  parseCSVFile,
  detectColumnMapping,
  mapLeadsData,
  validateLeads,
  generateErrorReport,
  isFileSizeAcceptable,
  isCSVFile,
  type ColumnMapping,
} from '@/lib/csv-parser';
import { useClient } from '@/contexts/ClientContext';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'preview' | 'importing' | 'results';

export function ImportLeadsModal({ isOpen, onClose, onSuccess }: ImportLeadsModalProps) {
  const { selectedClientId } = useClient();
  const [step, setStep] = useState<Step>('upload');
  const [sourceName, setSourceName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [validLeads, setValidLeads] = useState<any[]>([]);
  const [invalidLeads, setInvalidLeads] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  const resetModal = () => {
    setStep('upload');
    setSourceName('');
    setFile(null);
    setLeads([]);
    setValidLeads([]);
    setInvalidLeads([]);
    setDuplicates([]);
    setColumnMapping(null);
    setImporting(false);
    setProgress(0);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleClose = () => {
    if (importing) {
      alert('Please wait for import to complete');
      return;
    }
    resetModal();
    onClose();
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setError(null);

    if (!isCSVFile(selectedFile)) {
      setError('Please select a CSV file');
      return;
    }

    if (!isFileSizeAcceptable(selectedFile, 5)) {
      setError('File size exceeds 5MB limit. Please use a smaller file.');
      return;
    }

    setFile(selectedFile);

    const parseResult = await parseCSVFile(selectedFile);
    if (!parseResult.success) {
      setError(parseResult.error || 'Failed to parse CSV');
      return;
    }

    const mapping = detectColumnMapping(parseResult.columns || []);
    if (!mapping) {
      setError('CSV must have columns: email, firstName, lastName (or similar variations)');
      return;
    }

    setColumnMapping(mapping);

    const mappedLeads = mapLeadsData(parseResult.data || [], mapping);
    const validation = validateLeads(mappedLeads);

    setLeads(mappedLeads);
    setValidLeads(validation.validLeads);
    setInvalidLeads(validation.invalidLeads);
    setDuplicates(validation.duplicates);
    setStep('preview');
  };

  const handleImport = async () => {
    if (!selectedClientId) {
      setError('Please select a client before importing leads.');
      return;
    }

    if (!sourceName.trim()) {
      setError('Source name is required');
      return;
    }

    if (validLeads.length === 0) {
      setError('No valid leads to import');
      return;
    }

    setImporting(true);
    setStep('importing');
    setError(null);

    try {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceName: sourceName.trim(),
          leads: validLeads,
          clientId: selectedClientId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgress(100);

      setResults(result);
      setStep('results');

      if (result.success > 0) {
        onSuccess();
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Import failed');
      console.error('Import error:', error);

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setError(error.message);
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadErrorReport = () => {
    const csv = generateErrorReport(invalidLeads);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errors-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className={`text-xl font-semibold ${theme.core.white}`}>Import Leads</h2>
          <button
            onClick={handleClose}
            className={`p-1 rounded ${theme.core.bodyText} hover:text-white transition`}
            disabled={importing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-500 font-medium">Error</p>
                <p className={theme.core.bodyText}>{error}</p>
              </div>
            </div>
          )}

          {step === 'upload' && (
            <>
              <div>
                <label className={`block text-sm font-medium ${theme.core.white} mb-2`}>
                  Campaign/Source Name <span className="text-pink-700">*</span>
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g., Webinar-Nov2025"
                  className={`w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg ${theme.core.white} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                />
                <p className={`text-sm ${theme.core.bodyText} mt-1`}>
                  This creates a tag for tracking this batch
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.core.white} mb-2`}>
                  CSV File <span className="text-pink-700">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-500 transition"
                >
                  <Upload className={`w-12 h-12 ${theme.core.bodyText} mx-auto mb-3`} />
                  <p className={theme.core.white}>
                    {file ? file.name : 'Drag CSV here or click to browse'}
                  </p>
                  <p className={`text-sm ${theme.core.bodyText} mt-2`}>
                    Required columns: Email, First Name, Last Name
                  </p>
                  <p className={`text-sm ${theme.core.bodyText}`}>
                    Optional: Phone, Company, Title
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className={`font-semibold ${theme.core.white} mb-3`}>Import Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className={`text-sm ${theme.core.bodyText}`}>Total Rows</p>
                    <p className={`text-2xl font-bold ${theme.core.white}`}>{leads.length}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme.core.bodyText}`}>Valid</p>
                    <p className="text-2xl font-bold text-green-500">{validLeads.length}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme.core.bodyText}`}>Errors</p>
                    <p className="text-2xl font-bold text-red-500">
                      {invalidLeads.length + duplicates.length}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`font-semibold ${theme.core.white} mb-3`}>
                  Preview (First 5 rows)
                </h3>
                <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-900">
                        <tr>
                          <th className={`px-4 py-2 text-left text-xs font-semibold ${theme.accents.tertiary.class}`}>
                            Status
                          </th>
                          <th className={`px-4 py-2 text-left text-xs font-semibold ${theme.accents.tertiary.class}`}>
                            Email
                          </th>
                          <th className={`px-4 py-2 text-left text-xs font-semibold ${theme.accents.tertiary.class}`}>
                            Name
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {validLeads.slice(0, 5).map((lead, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </td>
                            <td className={`px-4 py-2 ${theme.core.white}`}>{lead.email}</td>
                            <td className={`px-4 py-2 ${theme.core.bodyText}`}>
                              {lead.firstName} {lead.lastName}
                            </td>
                          </tr>
                        ))}
                        {invalidLeads.slice(0, 5).map((item, idx) => (
                          <tr key={`invalid-${idx}`}>
                            <td className="px-4 py-2">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            </td>
                            <td className={`px-4 py-2 ${theme.core.white}`}>
                              {item.lead.email || 'Invalid'}
                            </td>
                            <td className="px-4 py-2 text-red-500 text-sm">
                              {item.errors[0]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {(invalidLeads.length > 0 || duplicates.length > 0) && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <p className="text-yellow-500 font-medium">Warnings</p>
                  {invalidLeads.length > 0 && (
                    <p className={theme.core.bodyText}>
                      • {invalidLeads.length} rows have errors and will be skipped
                    </p>
                  )}
                  {duplicates.length > 0 && (
                    <p className={theme.core.bodyText}>
                      • {duplicates.length} duplicate emails found within file
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {step === 'importing' && (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-700 via-indigo-600 to-cyan-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className={`text-sm ${theme.core.bodyText} mt-2`}>
                  {progress < 100 ? `Importing... ${progress}%` : 'Finalizing import...'}
                </p>
              </div>
              <p className={`text-lg ${theme.core.white}`}>Writing to Airtable...</p>
              <p className={`text-sm ${theme.core.bodyText} mt-1`}>
                Please do not close this window
              </p>
            </div>
          )}

          {step === 'results' && results && (
            <>
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-6 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className={`text-2xl font-bold ${theme.core.white} mb-2`}>
                  Import Complete!
                </h3>
                <p className={theme.core.bodyText}>
                  Successfully imported {results.success} leads
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-2">
                <div className="flex justify-between">
                  <span className={theme.core.bodyText}>Imported:</span>
                  <span className="text-green-500 font-semibold">{results.success} leads</span>
                </div>
                {results.errors.length > 0 && (
                  <div className="flex justify-between">
                    <span className={theme.core.bodyText}>Errors:</span>
                    <span className="text-red-500 font-semibold">
                      {results.errors.length} rows
                    </span>
                  </div>
                )}
                {results.duplicates.length > 0 && (
                  <div className="flex justify-between">
                    <span className={theme.core.bodyText}>Duplicates skipped:</span>
                    <span className="text-yellow-500 font-semibold">
                      {results.duplicates.length} leads
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-700">
                  <span className={theme.core.bodyText}>Source tag created:</span>
                  <span className={`${theme.accents.tertiary.class} font-semibold`}>
                    {results.sourceTag}
                  </span>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h4 className={`font-semibold ${theme.core.white} mb-2`}>Next Steps:</h4>
                <ul className={`list-disc list-inside space-y-1 ${theme.core.bodyText}`}>
                  <li>Leads are enriching via Clay (~2-5 min per lead)</li>
                  <li>Will sync to database automatically (~5 min)</li>
                  <li>Use tag "{results.sourceTag}" to create campaigns</li>
                </ul>
              </div>

              {invalidLeads.length > 0 && (
                <button
                  onClick={handleDownloadErrorReport}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition"
                >
                  <Download className="w-4 h-4" />
                  <span className={theme.core.white}>Download Error Report</span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
          {step === 'upload' && (
            <button
              onClick={handleClose}
              className={`px-4 py-2 rounded-lg ${theme.core.bodyText} hover:text-white transition`}
            >
              Cancel
            </button>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                }}
                className={`px-4 py-2 rounded-lg ${theme.core.bodyText} hover:text-white transition`}
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={validLeads.length === 0 || !sourceName.trim()}
                className="px-6 py-2 bg-gradient-to-r from-pink-700 via-indigo-600 to-cyan-400 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {validLeads.length} Leads
              </button>
            </>
          )}

          {step === 'results' && (
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gradient-to-r from-pink-700 via-indigo-600 to-cyan-400 text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

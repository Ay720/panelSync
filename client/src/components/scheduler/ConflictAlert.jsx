import React from 'react';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export const ConflictAlert = ({ warnings = [], alternativeSlots = [], onSelectAlternative }) => {
  if (warnings.length === 0 && alternativeSlots.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Warnings Banner */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-800 text-sm mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Interviewer Schedule Overrides & Notice</span>
          </div>
          <ul className="space-y-1 list-disc list-inside text-amber-700">
            {warnings.map((w, idx) => (
              <li key={idx}>
                <strong>{w.interviewerName}</strong>: {w.reason} ({w.date})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Near Miss Alternative Options */}
      {alternativeSlots.length > 0 && (
        <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900 text-xs">
          <div className="flex items-center gap-2 font-bold text-purple-900 text-sm mb-1.5">
            <RefreshCw className="w-4 h-4 text-brand-600" />
            <span>Alternative Panel Composition Slots</span>
          </div>
          <p className="text-purple-700 mb-2">
            If all interviewers cannot meet simultaneously, the following time slots are available if you substitute the blocked panelist:
          </p>
          <div className="space-y-2">
            {alternativeSlots.map((alt, idx) => (
              <div
                key={idx}
                className="p-3 bg-white rounded-lg border border-purple-100 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-slate-800 text-xs">
                    {new Date(alt.startTime).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{alt.suggestion}</p>
                </div>
                {onSelectAlternative && (
                  <button
                    onClick={() => onSelectAlternative(alt)}
                    className="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded-md border border-brand-200 text-xs shrink-0"
                  >
                    Use Alternative
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConflictAlert;


import React from 'react';
import { Clock, Calendar, Check, Star, ShieldCheck, User } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const SlotCard = ({ slot, onSelect, isSelected = false }) => {
  const isOptimal = slot.rankingCategory === 'Optimal';
  const isGood = slot.rankingCategory === 'Good';

  return (
    <div
      onClick={() => onSelect(slot)}
      className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer relative ${
        isSelected
          ? 'bg-brand-50/70 border-brand-500 shadow-md ring-2 ring-brand-500/20'
          : 'bg-white border-slate-200/90 hover:border-brand-300 hover:shadow-sm'
      }`}
    >
      {/* Top Header: Score & Category */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              isOptimal
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : isGood
                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <Star className="w-3 h-3 fill-current" />
            {slot.rankingCategory} Match
          </span>
          <span className="text-xs font-bold text-slate-700">
            {slot.score}/100 Score
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>{slot.durationMinutes} mins</span>
        </div>
      </div>

      {/* Primary Candidate Local Time */}
      <div className="mb-3">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
          Candidate Local Time ({slot.candidateLocalTime.timezone})
        </p>
        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-brand-600" />
          {slot.candidateLocalTime.formatted}
        </p>
      </div>

      {/* Interviewer Local Times Grid */}
      <div className="pt-2.5 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Interviewer Panel Local Times
        </p>
        <div className="space-y-1">
          {slot.interviewerLocalTimes.map((inv) => (
            <div
              key={inv.interviewerId}
              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 border border-slate-100"
            >
              <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                {inv.name}
              </span>
              <span className="font-mono text-slate-900 font-medium">
                {inv.formatted}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reasons & Scoring Highlights */}
      {slot.scoringReasons && slot.scoringReasons.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {slot.scoringReasons.map((reason, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100"
            >
              ✓ {reason}
            </span>
          ))}
        </div>
      )}

      {/* Selected Indicator */}
      <div className="mt-3.5 flex items-center justify-between pt-2 border-t border-slate-100/80">
        <span className="text-[11px] font-semibold text-slate-500">
          {isSelected ? 'Selected Slot' : 'Click to select this slot'}
        </span>
        <Button
          size="sm"
          variant={isSelected ? 'primary' : 'outline'}
          className={isSelected ? 'bg-brand-600 text-white' : ''}
        >
          {isSelected ? (
            <>
              <Check className="w-3.5 h-3.5" /> Selected
            </>
          ) : (
            'Choose'
          )}
        </Button>
      </div>
    </div>
  );
};

export default SlotCard;


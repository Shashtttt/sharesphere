import React, { useState } from 'react';
import { api } from '../api';
import { ExplainableRecommendation, Resource } from '../types';
import {
  Sparkles, CheckCircle2, ShieldAlert, ShieldCheck,
  Clock, MapPin, ArrowRight, Lightbulb, Search, AlertCircle
} from 'lucide-react';

interface AiMatcherViewProps {
  onOpenResourceDetail: (resource: Resource) => void;
}

export const AiMatcherView: React.FC<AiMatcherViewProps> = ({ onOpenResourceDetail }) => {
  const [purpose, setPurpose] = useState<string>('');
  const [neededHours, setNeededHours] = useState<number>(2.0);
  const [category, setCategory] = useState<string>('');
  const [locationPref, setLocationPref] = useState<string>('');
  const [results, setResults] = useState<ExplainableRecommendation[]>([]);
  const [querySummary, setQuerySummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const samplePrompts = [
    "Need high frequency digital oscilloscope to test custom PCB SPI bus signal noise",
    "Precision CO2 laser cutting on 5mm acrylic sheets for robotics chassis prototype",
    "High-resolution scanning electron microscopy (SEM) for nano-material sample imaging",
    "4K full-frame camera and wireless lavalier audio kit for engineering documentary"
  ];

  const handleSearch = async (queryText?: string) => {
    const textToSearch = queryText || purpose;
    if (!textToSearch.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await api.getAiRecommendations(
        textToSearch.trim(),
        neededHours,
        category || undefined,
        locationPref || undefined
      );
      setResults(res.recommendations);
      setQuerySummary(res.query_summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-950 to-indigo-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Explainable AI Assistant
        </div>
        <h1 className="text-2xl font-black tracking-tight">Resource Matcher & Capability Engine</h1>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
          State your experimental or creative purpose in natural language. The engine matches equipment specifications, checks your institutional safety qualifications, verifies calendar availability, and provides transparent reasons for each recommendation.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Describe Your Experimental Goal or Equipment Need
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. Solder and debug high-speed PCB hardware with multi-channel oscilloscope..."
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
            <button
              onClick={() => handleSearch()}
              disabled={isLoading || !purpose.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              {isLoading ? "Analyzing..." : "Find Matches"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Sample Prompts */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Try one of these realistic test scenarios:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPurpose(p);
                  handleSearch(p);
                }}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg transition-colors border border-slate-200 text-left"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Additional constraints row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Hours Needed</label>
            <input
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              value={neededHours}
              onChange={(e) => setNeededHours(parseFloat(e.target.value) || 2)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Category (Optional)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="">Any Category</option>
              <option value="Laboratories">Laboratories</option>
              <option value="Electronics & Testing Instruments">Electronics & Testing</option>
              <option value="Fabrication Tools">Fabrication Tools</option>
              <option value="Computers & Workstations">Computers & Workstations</option>
              <option value="Cameras & AV Equipment">Cameras & AV</option>
              <option value="Innovation & Makerspace">Innovation & Makerspace</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Campus Building</label>
            <input
              type="text"
              value={locationPref}
              onChange={(e) => setLocationPref(e.target.value)}
              placeholder="e.g. Maxwell, Foundry, Cleanroom"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Query summary */}
      {querySummary && (
        <div className="text-xs text-slate-500 flex items-center justify-between">
          <span>{querySummary}</span>
          <span className="font-semibold text-indigo-600">{results.length} explainable matches returned</span>
        </div>
      )}

      {/* Results List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-xs">No equipment matched your search constraints.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((item, idx) => {
            const res = item.resource;
            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col md:flex-row gap-5"
              >
                {/* Image preview */}
                <div className="w-full md:w-48 h-36 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                  <img
                    src={res.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758'}
                    alt={res.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                      #{idx + 1} Match
                    </span>
                  </div>
                </div>

                {/* Details & Explanation */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {res.category}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {res.building} ({res.room_location})
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{res.title}</h3>
                    </div>

                    {/* Match Score Badge */}
                    <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-black text-indigo-900">{item.match_score}% Match</span>
                    </div>
                  </div>

                  {/* Why this is recommended (Explainable AI Rationale) */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Explainable Recommendation Rationale:
                    </span>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {item.why_recommended.map((reason, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Eligibility and Availability Status Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Eligibility */}
                      <span className={`flex items-center gap-1 font-semibold ${
                        item.eligibility_status === 'eligible'
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}>
                        {item.eligibility_status === 'eligible' ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                        )}
                        {item.eligibility_details[0] || item.eligibility_status}
                      </span>

                      {/* Availability */}
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {item.availability_status === 'available_now' ? 'Instant Access' :
                         item.availability_status === 'requires_approval' ? 'Approval Required' : 'Busy / Waitlist'}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenResourceDetail(res)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      Reserve Asset <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

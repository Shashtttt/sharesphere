import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Resource } from '../types';
import {
  Search, Filter, MapPin, Clock, ShieldCheck,
  ShieldAlert, Sparkles, PlusCircle, CheckCircle2, ChevronRight
} from 'lucide-react';

interface CatalogueViewProps {
  onOpenResourceDetail: (resource: Resource) => void;
  onOpenCreateResource: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userRole?: string;
}

const CATEGORIES = [
  'All',
  'Laboratories',
  'Computers & Workstations',
  'Cameras & AV Equipment',
  'Fabrication Tools',
  'Electronics & Testing Instruments',
  'Meeting Rooms & Classrooms',
  'Innovation & Makerspace'
];

export const CatalogueView: React.FC<CatalogueViewProps> = ({
  onOpenResourceDetail,
  onOpenCreateResource,
  searchQuery,
  setSearchQuery,
  userRole,
}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchResources = () => {
    setIsLoading(true);
    api.getResources({
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      search: searchQuery.trim() || undefined,
      status_filter: statusFilter || undefined,
    })
      .then(setResources)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchResources();
  }, [selectedCategory, searchQuery, statusFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Resource Catalogue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover verified campus equipment, research laboratories, testing benches, and collaboration spaces.
          </p>
        </div>

        {(userRole === 'owner' || userRole === 'manager' || userRole === 'admin') && (
          <button
            onClick={onOpenCreateResource}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Resource Listing
          </button>
        )}
      </div>

      {/* Filter and Category Pills */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary filters & search bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, asset model, building, or room..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Operational Statuses</option>
              <option value="excellent">Excellent Condition</option>
              <option value="good">Good Condition</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Showing {resources.length} institutional resource{resources.length === 1 ? '' : 's'}</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-indigo-600 hover:underline font-medium"
          >
            Clear search filters
          </button>
        )}
      </div>

      {/* Resource Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-72 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm">No resources match your search criteria.</p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setStatusFilter(''); }}
            className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(res => (
            <div
              key={res.id}
              onClick={() => onOpenResourceDetail(res)}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col"
            >
              {/* Image Banner */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img
                  src={res.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758'}
                  alt={res.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                    {res.category}
                  </span>
                  {res.required_qualifications.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-900/80 text-rose-200 backdrop-blur-xs flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Safety Required
                    </span>
                  )}
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    res.condition_status === 'excellent' ? 'bg-emerald-500 text-white' :
                    res.condition_status === 'good' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {res.condition_status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {res.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{res.building} • {res.room_location}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {res.min_duration_hours}h - {res.max_duration_hours}h max
                    </span>
                    <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Check Availability →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

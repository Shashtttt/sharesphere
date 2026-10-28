import React, { useState, useRef } from 'react';
import { api } from '../api';
import {
  X, PlusCircle, AlertCircle, UploadCloud, Image as ImageIcon,
  Trash2, ShieldAlert, Check
} from 'lucide-react';

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResourceCreated: () => void;
}

export const CreateResourceModal: React.FC<CreateResourceModalProps> = ({
  isOpen,
  onClose,
  onResourceCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics & Testing Instruments');
  const [resourceType, setResourceType] = useState('equipment');
  const [building, setBuilding] = useState('Maxwell Hall of Electronics');
  const [roomLocation, setRoomLocation] = useState('Lab 102 - Workstation A');
  
  // Local File selection state - NO URL input!
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [minHours, setMinHours] = useState(1.0);
  const [maxHours, setMaxHours] = useState(6.0);
  const [maxFrequency, setMaxFrequency] = useState(3);
  const [usageRules, setUsageRules] = useState('');
  const [requiredQualification, setRequiredQualification] = useState('');
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local file selection from folder
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, WEBP, GIF, SVG)');
        return;
      }
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const requiredQuals = requiredQualification.trim() ? [requiredQualification.trim()] : [];

    // Fallback category images if user didn't pick a local image
    const categoryDefaults: Record<string, string> = {
      'Laboratories': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      'Electronics & Testing Instruments': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      'Fabrication Tools': 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
      'Computers & Workstations': 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
      'Cameras & AV Equipment': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      'Meeting Rooms & Classrooms': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      'Innovation & Makerspace': 'https://images.unsplash.com/photo-1631556097152-c39479cbfeab?auto=format&fit=crop&w=800&q=80',
    };

    const finalImage = imagePreview || categoryDefaults[category] || categoryDefaults['Electronics & Testing Instruments'];

    try {
      await api.createResource({
        title: title.trim(),
        description: description.trim() || `${title.trim()} available for institutional reservation.`,
        category,
        resource_type: resourceType,
        building: building.trim(),
        room_location: roomLocation.trim(),
        image_url: finalImage,
        min_duration_hours: Number(minHours),
        max_duration_hours: Number(maxHours),
        max_booking_frequency_per_week: Number(maxFrequency),
        usage_rules: usageRules.trim() || undefined,
        required_qualifications: requiredQuals,
        approval_required: approvalRequired,
        condition_status: 'excellent',
      });
      
      onResourceCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish resource listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base">List New Institutional Asset</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-1">Equipment / Space Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Keysight InfiniiVision 4-Channel 1GHz Digital Oscilloscope"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                <option value="Laboratories">Laboratories</option>
                <option value="Electronics & Testing Instruments">Electronics & Testing Instruments</option>
                <option value="Fabrication Tools">Fabrication Tools</option>
                <option value="Computers & Workstations">Computers & Workstations</option>
                <option value="Cameras & AV Equipment">Cameras & AV Equipment</option>
                <option value="Meeting Rooms & Classrooms">Meeting Rooms & Classrooms</option>
                <option value="Innovation & Makerspace">Innovation & Makerspace</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Resource Type</label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                <option value="equipment">Physical Equipment</option>
                <option value="bench">Dedicated Lab Bench</option>
                <option value="space">Room or Facility Space</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Description & Specifications</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail hardware specs, capabilities, and intended scientific or creative use cases..."
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
            ></textarea>
          </div>

          {/* LOCAL FILE IMAGE SELECTOR (NO URL INPUT) */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span>Equipment Photo (Select from folder)</span>
              {imageFileName && <span className="text-[10px] text-slate-500 font-normal truncate max-w-xs">{imageFileName}</span>}
            </label>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40 rounded-xl p-5 text-center cursor-pointer transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-2 transition-colors">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-800 text-xs">Click to browse or drop an image from your device</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Supports PNG, JPG, JPEG, WEBP, GIF, SVG</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 p-2 flex items-center gap-3">
                <img
                  src={imagePreview}
                  alt="Selected preview"
                  className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 truncate text-xs">{imageFileName || 'Selected Image'}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <Check className="w-3 h-3" /> Ready to publish
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-[11px] font-semibold"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Building</label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Room / Bench Location</label>
              <input
                type="text"
                value={roomLocation}
                onChange={(e) => setRoomLocation(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Min Duration (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={minHours}
                onChange={(e) => setMinHours(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Max Duration (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={maxHours}
                onChange={(e) => setMaxHours(parseFloat(e.target.value) || 6)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Weekly Frequency Cap</label>
              <input
                type="number"
                min="1"
                value={maxFrequency}
                onChange={(e) => setMaxFrequency(parseInt(e.target.value) || 3)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Mandatory Safety Qualification Code (Optional)
            </label>
            <input
              type="text"
              value={requiredQualification}
              onChange={(e) => setRequiredQualification(e.target.value)}
              placeholder="e.g. laser_safety_l2, cleanroom_iso6"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Leave blank for open access. When specified, only borrowers with verified training can book.
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Usage & Safety Rules</label>
            <textarea
              rows={2}
              value={usageRules}
              onChange={(e) => setUsageRules(e.target.value)}
              placeholder="Operating procedures, calibration instructions, emergency contacts..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            ></textarea>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              id="approvalRequired"
              checked={approvalRequired}
              onChange={(e) => setApprovalRequired(e.target.checked)}
              className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="approvalRequired" className="font-bold text-slate-800 cursor-pointer">
              Require Owner Review & Approval before booking is confirmed
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              {isSubmitting ? "Publishing Asset..." : "Publish Asset Listing"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

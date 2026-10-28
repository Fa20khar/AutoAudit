import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Eye, 
  X, 
  Info, 
  Check, 
  AlertCircle, 
  Tag, 
  Maximize2,
  Gauge,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { VehiclePhotoItem } from '../types';

interface VehiclePhotoUploaderProps {
  photos: VehiclePhotoItem[];
  onChange: (photos: VehiclePhotoItem[]) => void;
  maxPhotos?: number;
  label?: string;
  sublabel?: string;
}

const PHOTO_ANGLES: Array<{ id: string; label: string; icon: string; highlight?: boolean }> = [
  { id: 'odometer', label: 'Odometer (Mileage)', icon: '⏱️', highlight: true },
  { id: 'vin_plate', label: 'VIN Door Jamb / Sticker', icon: '🏷️', highlight: true },
  { id: 'front', label: 'Front Angle', icon: '🚘' },
  { id: 'rear', label: 'Rear Angle', icon: '🚗' },
  { id: 'driver_side', label: 'Driver Side', icon: '🚙' },
  { id: 'passenger_side', label: 'Passenger Side', icon: '🚙' },
  { id: 'interior', label: 'Interior / Dash', icon: '💺' },
  { id: 'engine', label: 'Engine Bay', icon: '⚙️' },
  { id: 'damage', label: 'Damage / Wear Area', icon: '⚠️' },
  { id: 'other', label: 'Other Document', icon: '📄' }
];

// Client-side image compressor using HTML Canvas
async function compressImage(file: File): Promise<{ dataUrl: string; size: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: readerEvent.target?.result as string,
            size: `${(file.size / 1024).toFixed(0)} KB`
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        // Estimate compressed size from base64 string
        const approxBytes = Math.round((compressedDataUrl.length * 3) / 4);
        const sizeStr = approxBytes > 1024 * 1024 
          ? `${(approxBytes / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(approxBytes / 1024)} KB`;

        resolve({ dataUrl: compressedDataUrl, size: sizeStr });
      };
      img.onerror = () => reject(new Error('Failed to load image for compression.'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export const VehiclePhotoUploader: React.FC<VehiclePhotoUploaderProps> = ({
  photos,
  onChange,
  maxPhotos = 8,
  label = 'Vehicle Photos & Inspection Media (Recommended)',
  sublabel = 'Attach photos of the odometer, VIN sticker, exterior, and known damages for verified review.'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<VehiclePhotoItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    setErrorMsg(null);
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select image files only (JPG, PNG, WEBP).');
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg('Each image must be under 15MB.');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    if (photos.length + validFiles.length > maxPhotos) {
      setErrorMsg(`You can upload up to ${maxPhotos} photos maximum. Only the first ${maxPhotos - photos.length} will be added.`);
    }

    const availableSlots = Math.max(0, maxPhotos - photos.length);
    const filesToUpload = validFiles.slice(0, availableSlots);

    if (filesToUpload.length === 0) return;

    setIsProcessing(true);
    try {
      const newPhotoItems: VehiclePhotoItem[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const { dataUrl, size } = await compressImage(file);
        
        // Auto-assign smart default angle based on existing items
        let defaultAngle = 'front';
        const existingAngles = photos.map(p => p.angle);
        if (!existingAngles.includes('odometer')) {
          defaultAngle = photos.length === 0 ? 'odometer' : 'vin_plate';
        } else if (!existingAngles.includes('vin_plate')) {
          defaultAngle = 'vin_plate';
        } else if (!existingAngles.includes('front')) {
          defaultAngle = 'front';
        } else if (!existingAngles.includes('rear')) {
          defaultAngle = 'rear';
        } else {
          defaultAngle = 'other';
        }

        newPhotoItems.push({
          id: `photo-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          dataUrl,
          angle: defaultAngle,
          label: PHOTO_ANGLES.find(a => a.id === defaultAngle)?.label || 'Vehicle Photo',
          size,
          uploadedAt: new Date().toISOString()
        });
      }

      onChange([...photos, ...newPhotoItems]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error processing photos. Please try again.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(photos.filter(p => p.id !== id));
    if (activeLightboxPhoto?.id === id) {
      setActiveLightboxPhoto(null);
    }
  };

  const handleAngleChange = (id: string, newAngle: string) => {
    const angleObj = PHOTO_ANGLES.find(a => a.id === newAngle);
    onChange(
      photos.map(p => {
        if (p.id === id) {
          return {
            ...p,
            angle: newAngle,
            label: angleObj?.label || newAngle
          };
        }
        return p;
      })
    );
  };

  const hasOdometerPhoto = photos.some(p => p.angle === 'odometer');
  const hasVinStickerPhoto = photos.some(p => p.angle === 'vin_plate');

  return (
    <div className="space-y-3.5">
      {/* Header & Photo Count Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{label}</span>
          </label>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{sublabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
            photos.length > 0 
              ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-300' 
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            {photos.length} / {maxPhotos} Photos Attached
          </span>
        </div>
      </div>

      {/* Helpful Guidance Callout */}
      <div className="p-3 bg-[#0B132B]/80 border border-slate-800 rounded-xl text-[11px] text-slate-300 leading-relaxed flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>
            <strong className="text-white">Why photos matter:</strong> Uploading clear photos of the{' '}
            <span className="text-emerald-300 font-semibold">Odometer mileage reading</span> and the{' '}
            <span className="text-blue-300 font-semibold">Driver Door-Jamb VIN Sticker</span> allows our certified automotive auditors to cross-examine physical odometer numerals against NMVTIS and DMV timeline records, catching rolled-back mileage and cloned VIN plates.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[10px]">
            <span className={`inline-flex items-center gap-1 font-medium ${hasOdometerPhoto ? 'text-emerald-400' : 'text-slate-400'}`}>
              {hasOdometerPhoto ? '✓' : '○'} Odometer Photo {hasOdometerPhoto ? '(Included)' : '(Recommended)'}
            </span>
            <span className={`inline-flex items-center gap-1 font-medium ${hasVinStickerPhoto ? 'text-emerald-400' : 'text-slate-400'}`}>
              {hasVinStickerPhoto ? '✓' : '○'} VIN Plate Sticker {hasVinStickerPhoto ? '(Included)' : '(Recommended)'}
            </span>
          </div>
        </div>
      </div>

      {/* Dual Upload Action Cards: 'Add Image Upload' and 'Add Drag-and-Drop Photos' */}
      {photos.length < maxPhotos && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card 1: Add Image Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative p-4 rounded-xl border border-slate-700 hover:border-blue-500/80 bg-[#0B132B]/90 hover:bg-[#0F1B38] transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-500/20 transition-all">
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                    Add Image Upload
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Select photos from your device, camera roll, or local folders.
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono text-[10px]">JPG, PNG, WEBP</span>
                <span className="inline-flex items-center gap-1 font-semibold text-blue-400 group-hover:text-blue-300">
                  <Upload className="w-3 h-3" />
                  <span>Browse Files</span>
                </span>
              </div>
            </div>

            {/* Card 2: Add Drag-and-Drop Photos */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative p-4 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs ${
                isDragging
                  ? 'border-blue-400 bg-blue-950/50 text-blue-200 scale-[1.01]'
                  : 'border-slate-700 hover:border-slate-500 bg-[#0B132B]/60 text-slate-300 hover:bg-[#0B132B]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  isDragging
                    ? 'bg-blue-500 text-white animate-bounce'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                }`}>
                  <Upload className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    Add Drag-and-Drop Photos
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {isDragging ? 'Drop your photos right here!' : 'Drag images directly from desktop or folders.'}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono text-[10px]">Multiple files allowed</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                  <span>Dropzone Active</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
            {PHOTO_ANGLES.slice(0, 5).map(angle => (
              <span
                key={angle.id}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700"
              >
                <span>{angle.icon}</span>
                <span>{angle.label}</span>
              </span>
            ))}
            <span className="text-[10px] text-slate-400">+ all other angles</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Photo Gallery Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {photos.map((photo, index) => {
            const angleMeta = PHOTO_ANGLES.find(a => a.id === photo.angle);
            const isOdometer = photo.angle === 'odometer';
            const isVinPlate = photo.angle === 'vin_plate';

            return (
              <div
                key={photo.id}
                className="group relative bg-[#0B132B] border border-slate-700/80 hover:border-slate-600 rounded-xl overflow-hidden shadow-xs flex flex-col transition-all"
              >
                {/* Image Preview with Hover Overlay */}
                <div 
                  className="relative h-32 w-full bg-slate-900 overflow-hidden cursor-pointer"
                  onClick={() => setActiveLightboxPhoto(photo)}
                >
                  {photo.dataUrl ? (
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}

                  {/* Top badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 shadow-xs ${
                      isOdometer 
                        ? 'bg-emerald-600 text-white' 
                        : isVinPlate 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-900/80 text-white border border-slate-700'
                    }`}>
                      <span>{angleMeta?.icon || '📷'}</span>
                      <span>{angleMeta?.label || 'Photo'}</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleRemovePhoto(photo.id, e)}
                      className="pointer-events-auto p-1 rounded-md bg-slate-900/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer shadow-xs"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Fullscreen Zoom Hint */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="px-2 py-1 bg-slate-900/90 rounded-md text-[11px] text-white flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      <span>View Full Size</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls (Angle Selector & Size) */}
                <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between bg-[#0F172A]/90">
                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
                    <span className="truncate max-w-[120px]" title={photo.name}>
                      #{index + 1} {photo.name}
                    </span>
                    {photo.size && <span className="font-mono text-slate-500">{photo.size}</span>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <Tag className="w-3 h-3 text-blue-400" />
                      <span>Photo Angle / Category:</span>
                    </label>
                    <select
                      value={photo.angle || 'other'}
                      onChange={(e) => handleAngleChange(photo.id, e.target.value)}
                      className="w-full text-xs py-1 px-2 bg-[#0B132B] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {PHOTO_ANGLES.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.icon} {a.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {activeLightboxPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveLightboxPhoto(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="px-4 py-3 bg-[#0B132B] border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-600 text-white">
                  {PHOTO_ANGLES.find(a => a.id === activeLightboxPhoto.angle)?.label || 'Vehicle Photo'}
                </span>
                <span className="text-xs text-slate-400 truncate max-w-md">{activeLightboxPhoto.name}</span>
                {activeLightboxPhoto.size && (
                  <span className="text-[11px] font-mono text-slate-500">({activeLightboxPhoto.size})</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveLightboxPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Image View */}
            <div className="p-2 flex items-center justify-center bg-black overflow-auto max-h-[75vh]">
              {activeLightboxPhoto.dataUrl ? (
                <img
                  src={activeLightboxPhoto.dataUrl}
                  alt={activeLightboxPhoto.name}
                  className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
                />
              ) : null}
            </div>

            {/* Lightbox Footer Actions */}
            <div className="px-4 py-2.5 bg-[#0B132B] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>AutoAudit Inspection Document Preview</span>
              <button
                type="button"
                onClick={() => setActiveLightboxPhoto(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

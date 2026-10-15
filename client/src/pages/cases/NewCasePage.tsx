import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, FileText, Calendar, MapPin,
  User, Building2, AlertCircle, Save, Sparkles,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface FormData {
  case_number: string;
  fir_number?: string;
  title: string;
  description?: string;
  crime_type?: string;
  status: string;
  priority: string;
  date_of_incident: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  location_source?: string;
  io_name?: string;
  station?: string;
}

export default function NewCasePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [locationMethod, setLocationMethod] = useState<'none' | 'user_location' | 'manual_coords' | 'manual_address'>('none');
  const [locationError, setLocationError] = useState('');
  const [geocodingAddress, setGeocodingAddress] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      status: 'open',
      priority: 'medium',
      date_of_incident: new Date().toISOString().split('T')[0],
      location_source: undefined,
    },
  });

  const watchedLatitude = watch('latitude');
  const watchedLongitude = watch('longitude');
  const watchedAddress = watch('address');
  const watchedCity = watch('city');
  const watchedState = watch('state');

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocatingUser(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('latitude', position.coords.latitude);
        setValue('longitude', position.coords.longitude);
        setValue('location_source', 'user_location');
        setLocationMethod('user_location');
        setLocatingUser(false);
        toast.success(`Location captured: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
      },
      (error) => {
        setLocatingUser(false);
        if (error.code === 1) {
          setLocationError('Location permission denied. Please enter location manually.');
        } else if (error.code === 2) {
          setLocationError('Location unavailable. Please enter location manually.');
        } else {
          setLocationError('Location request timed out. Please try again or enter manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const geocodeManualAddress = async () => {
    const address = watchedAddress;
    const city = watchedCity;
    const state = watchedState;
    
    if (!address && !city) {
      toast.error('Please enter at least an address or city to geocode');
      return;
    }

    const fullAddress = [address, city, state, 'India'].filter(Boolean).join(', ');
    
    setGeocodingAddress(true);
    setLocationError('');

    try {
      const response = await api.post('/cases/geocode-address', { address: fullAddress });
      if (response.data.latitude && response.data.longitude) {
        setValue('latitude', response.data.latitude);
        setValue('longitude', response.data.longitude);
        setValue('location_source', 'geocoded_address');
        setLocationMethod('manual_address');
        toast.success(`Address geocoded: ${response.data.display_name || fullAddress}`);
      } else {
        setLocationError('Could not geocode this address. Please enter coordinates manually.');
      }
    } catch (error) {
      setLocationError('Geocoding failed. Please enter coordinates manually.');
      console.error('Geocoding error:', error);
    } finally {
      setGeocodingAddress(false);
    }
  };

  const clearLocation = () => {
    setValue('latitude', undefined);
    setValue('longitude', undefined);
    setValue('location_source', undefined);
    setLocationMethod('none');
    setLocationError('');
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await api.post('/cases', data);
      toast.success('Case created successfully!');
      navigate(`/cases/${res.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create case');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/cases')} className="btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">New Case</h1>
          <p className="page-subtitle">Create a new investigation case</p>
        </div>
      </div>

      {/* AI Helper Banner */}
      <div className="info-panel info-panel-info">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">AI-Powered Case Creation</h3>
            <p className="text-sm text-slate-400">
              Our AI can automatically extract case details from FIR documents. Upload a PDF or paste FIR text for instant analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-navy-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-navy-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Basic Information</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="case_number" className="input-label">
                Case Number *
              </label>
              <input
                id="case_number"
                placeholder="e.g. CASE-2024-001"
                className={`input ${errors.case_number ? 'input-error' : ''}`}
                {...register('case_number', { required: 'Case number is required' })}
              />
              {errors.case_number && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.case_number.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="fir_number" className="input-label">
                FIR Number
              </label>
              <input
                id="fir_number"
                placeholder="e.g. FIR-2024-123"
                className="input"
                {...register('fir_number')}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="title" className="input-label">
                Case Title *
              </label>
              <input
                id="title"
                placeholder="Brief description of the case"
                className={`input ${errors.title ? 'input-error' : ''}`}
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="input-label">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Detailed case description..."
                className="input resize-none"
                {...register('description')}
              />
            </div>
          </div>
        </div>

        {/* Case Details */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Case Details</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="crime_type" className="input-label">
                Crime Type
              </label>
              <input
                id="crime_type"
                placeholder="e.g. Theft, Cyber Crime, Fraud"
                className="input"
                {...register('crime_type')}
              />
            </div>

            <div>
              <label htmlFor="date_of_incident" className="input-label">
                Date of Incident *
              </label>
              <input
                id="date_of_incident"
                type="date"
                className={`input ${errors.date_of_incident ? 'input-error' : ''}`}
                {...register('date_of_incident', { required: 'Date is required' })}
              />
              {errors.date_of_incident && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.date_of_incident.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="input-label">
                Status *
              </label>
              <select id="status" className="input" {...register('status')}>
                <option value="open">Open</option>
                <option value="under_investigation">Under Investigation</option>
                <option value="chargesheet_filed">Chargesheet Filed</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="input-label">
                Priority *
              </label>
              <select id="priority" className="input" {...register('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="location" className="input-label">
                Incident Location (Display Text)
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="location"
                  placeholder="Brief location description (e.g., 'Near Central Park, Mumbai')"
                  className="input pl-12"
                  {...register('location')}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">This is shown in case listings. Add detailed address below.</p>
            </div>
          </div>
        </div>

        {/* Location Details - NEW SECTION */}
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Incident Location Details</h2>
                <p className="text-xs text-slate-500">Precise location for map visualization</p>
              </div>
            </div>
            {locationMethod !== 'none' && (
              <button
                type="button"
                onClick={clearLocation}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear Location
              </button>
            )}
          </div>

          {/* Location Status */}
          {watchedLatitude && watchedLongitude && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location Captured: {watchedLatitude.toFixed(6)}, {watchedLongitude.toFixed(6)}
                {locationMethod === 'user_location' && ' (Your Current Location)'}
                {locationMethod === 'manual_address' && ' (Geocoded from Address)'}
                {locationMethod === 'manual_coords' && ' (Manual Entry)'}
              </p>
            </div>
          )}

          {locationError && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {locationError}
              </p>
            </div>
          )}

          {/* Location Method Selection */}
          {locationMethod === 'none' && (
            <div className="space-y-3 mb-6">
              <p className="text-sm text-slate-400">Choose how to specify the incident location:</p>
              <div className="grid md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locatingUser}
                  className="p-4 rounded-xl border border-base-border hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group"
                >
                  <Locate className={`w-5 h-5 text-blue-400 mb-2 ${locatingUser ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                  <h3 className="text-sm font-semibold text-white">Use My Location</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {locatingUser ? 'Requesting permission...' : 'Capture current GPS coordinates'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setLocationMethod('manual_address')}
                  className="p-4 rounded-xl border border-base-border hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left group"
                >
                  <Building2 className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-sm font-semibold text-white">Enter Address</h3>
                  <p className="text-xs text-slate-500 mt-1">Address will be geocoded automatically</p>
                </button>

                <button
                  type="button"
                  onClick={() => setLocationMethod('manual_coords')}
                  className="p-4 rounded-xl border border-base-border hover:border-green-500/50 hover:bg-green-500/5 transition-all text-left group"
                >
                  <MapPin className="w-5 h-5 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-sm font-semibold text-white">Manual Coordinates</h3>
                  <p className="text-xs text-slate-500 mt-1">Enter exact latitude/longitude</p>
                </button>
              </div>
            </div>
          )}

          {/* Manual Address Entry */}
          {locationMethod === 'manual_address' && !watchedLatitude && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="input-label">Street Address / Landmark</label>
                  <input
                    id="address"
                    placeholder="e.g., 123 Main Street, Near City Hospital"
                    className="input"
                    {...register('address')}
                  />
                </div>
                <div>
                  <label htmlFor="city" className="input-label">City</label>
                  <input
                    id="city"
                    placeholder="e.g., Mumbai"
                    className="input"
                    {...register('city')}
                  />
                </div>
                <div>
                  <label htmlFor="state" className="input-label">State</label>
                  <input
                    id="state"
                    placeholder="e.g., Maharashtra"
                    className="input"
                    {...register('state')}
                  />
                </div>
                <div>
                  <label htmlFor="pincode" className="input-label">PIN Code</label>
                  <input
                    id="pincode"
                    placeholder="e.g., 400001"
                    className="input"
                    {...register('pincode')}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={geocodeManualAddress}
                disabled={geocodingAddress || (!watchedAddress && !watchedCity)}
                className="btn-primary"
              >
                {geocodingAddress ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Geocoding...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Geocode Address
                  </>
                )}
              </button>
            </div>
          )}

          {/* Manual Coordinates Entry */}
          {locationMethod === 'manual_coords' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="input-label">
                    Latitude * <span className="text-xs text-slate-500">(India: 8° to 37°)</span>
                  </label>
                  <input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    placeholder="e.g., 19.075984"
                    className="input"
                    {...register('latitude', { 
                      required: locationMethod === 'manual_coords' ? 'Latitude is required' : false,
                      min: { value: -90, message: 'Invalid latitude' },
                      max: { value: 90, message: 'Invalid latitude' },
                      valueAsNumber: true,
                    })}
                  />
                  {errors.latitude && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.latitude.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="longitude" className="input-label">
                    Longitude * <span className="text-xs text-slate-500">(India: 68° to 97°)</span>
                  </label>
                  <input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    placeholder="e.g., 72.877426"
                    className="input"
                    {...register('longitude', { 
                      required: locationMethod === 'manual_coords' ? 'Longitude is required' : false,
                      min: { value: -180, message: 'Invalid longitude' },
                      max: { value: 180, message: 'Invalid longitude' },
                      valueAsNumber: true,
                    })}
                  />
                  {errors.longitude && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.longitude.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (watchedLatitude && watchedLongitude) {
                    setValue('location_source', 'manual_coords');
                    toast.success('Coordinates validated');
                  }
                }}
                disabled={!watchedLatitude || !watchedLongitude}
                className="btn-primary"
              >
                <MapPin className="w-4 h-4" />
                Validate Coordinates
              </button>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-lg bg-base-elevated border border-base-border">
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-white">Important:</strong> The incident location should be where the crime occurred, 
              not where it was reported. If you're reporting from your current location, use "Enter Address" or "Manual Coordinates" 
              to specify the actual incident location.
            </p>
          </div>
        </div>

        {/* Officer Information */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <User className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Officer Information</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="io_name" className="input-label">
                Investigating Officer
              </label>
              <input
                id="io_name"
                placeholder="Officer name"
                className="input"
                {...register('io_name')}
              />
            </div>

            <div>
              <label htmlFor="station" className="input-label">
                Police Station
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="station"
                  placeholder="Station name"
                  className="input pl-12"
                  {...register('station')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary group">
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Case
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

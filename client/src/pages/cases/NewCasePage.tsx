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
  io_name?: string;
  station?: string;
}

export default function NewCasePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      status: 'open',
      priority: 'medium',
      date_of_incident: new Date().toISOString().split('T')[0],
    },
  });

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
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="location"
                  placeholder="City, District, State"
                  className="input pl-12"
                  {...register('location')}
                />
              </div>
            </div>
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

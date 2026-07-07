import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, type Variants, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Plus, ArrowLeft, Search, RefreshCw,
  User, Phone, MapPin, Hash, Edit, Trash2, Eye,
  Shield, FileText, Clock, Info, Fingerprint, UserX,
  Sparkles, ChevronRight, Archive, Car, Scale,
  CheckCircle2, XCircle, Activity, Building2,
} from 'lucide-react';
import api from '../lib/api';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface CriminalRecord {
  id: string;
  case_number: string;
  offence: string;
  court: string;
  year: string;
  outcome: string;
  sentence?: string;
  notes?: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  performed_by: string;
  createdAt: string;
}

interface Suspect {
  id: string;
  full_name: string;
  aliases: string[];
  age?: number;
  gender?: string;
  nationality?: string;
  occupation?: string;
  address?: string;
  phone?: string;
  email?: string;
  vehicle_numbers: string[];
  national_id?: string;
  pan_number?: string;
  voter_id?: string;
  driving_license?: string;
  description?: string;
  photo_url?: string;
  arrest_status: string;
  arrest_date?: string;
  arresting_officer?: string;
  bail_status?: string;
  court_next_date?: string;
  criminal_history: CriminalRecord[];
  has_prior_record: boolean;
  linked_evidence: Array<{ _id: string; title: string; evidence_type: string }>;
  linked_cases: Array<{ _id: string; case_number: string; title: string }>;
  risk_level?: string;
  risk_summary?: string;
  risk_indicators: string[];
  flight_risk?: boolean;
  notes?: string;
  known_associates: string[];
  activity_log: Activity[];
  createdAt: string;
}

interface Case { id: string; case_number: string; title: string; }

/* ─── Constants ──────────────────────────────────────────────────────────── */
const ARREST_CONFIG: Record<string, { label: string; badge: string; border: string }> = {
  not_arrested:     { label: 'Not Arrested',    badge: 'badge-yellow', border: 'border-yellow-500/40' },
  arrested:         { label: 'Arrested',         badge: 'badge-red',    border: 'border-red-500/50'    },
  released_on_bail: { label: 'Released on Bail', badge: 'badge-blue',   border: 'border-blue-500/40'   },
  absconding:       { label: 'Absconding',        badge: 'badge-red',    border: 'border-red-500/70'    },
  chargesheeted:    { label: 'Chargesheeted',     badge: 'badge-purple', border: 'border-purple-500/40' },
  acquitted:        { label: 'Acquitted',         badge: 'badge-green',  border: 'border-green-500/40'  },
};

const RISK_CONFIG: Record<string, { label: string; badge: string; icon: React.ElementType; color: string }> = {
  low:      { label: 'Low Risk',      badge: 'badge-green',  icon: Shield,        color: 'text-green-400'  },
  medium:   { label: 'Medium Risk',   badge: 'badge-yellow', icon: AlertTriangle, color: 'text-yellow-400' },
  high:     { label: 'High Risk',     badge: 'badge-red',    icon: AlertTriangle, color: 'text-red-400'    },
  critical: { label: 'Critical Risk', badge: 'badge-red',    icon: AlertTriangle, color: 'text-red-500'    },
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  created: Plus, status_changed: Scale, evidence_linked: Archive,
  note_added: FileText, arrested: Fingerprint, released: CheckCircle2,
  ai_analysis: Sparkles, case_linked: ChevronRight, photo_uploaded: User,
};

const OUTCOME_COLORS: Record<string, string> = {
  acquitted: 'text-green-400', convicted: 'text-red-400',
  pending: 'text-yellow-400', charge_dropped: 'text-slate-400',
};

const fade: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4,0,0.2,1] } } };
const stagger: Variants = { show: { transition: { staggerChildren: 0.06 } } };

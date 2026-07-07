/**
 * In-memory data store for demo mode (no PostgreSQL required).
 * All data is seeded at startup and lives in RAM.
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  badge_number?: string;
  department?: string;
  station?: string;
  phone?: string;
  is_active: boolean;
  two_factor_enabled: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  status: string;
  crime_type?: string;
  incident_date?: string;
  incident_location?: string;
  fir_number?: string;
  fir_date?: string;
  police_station?: string;
  assigned_io?: string;
  assigned_sho?: string;
  prosecutor_id?: string;
  priority: string;
  tags: string[];
  ai_summary?: string;
  ai_extracted_facts?: object;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  case_id: string;
  evidence_number: string;
  title: string;
  description?: string;
  evidence_type: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  collected_by?: string;
  collected_at?: string;
  location_found?: string;
  tags: string[];
  is_verified: boolean;
  ai_summary?: string;
  chain_of_custody: object[];
  created_at: string;
  updated_at: string;
}

export interface Witness {
  id: string;
  case_id: string;
  full_name: string;
  alias?: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  occupation?: string;
  relationship_to_case?: string;
  court_appearance_status?: string;
  protection_required: boolean;
  statements: object[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Victim {
  id: string;
  case_id: string;
  full_name: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  injury_description?: string;
  compensation_status?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Suspect {
  id: string;
  case_id: string;
  full_name: string;
  aliases: string[];
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  national_id?: string;
  description?: string;
  arrest_status: string;
  arrest_date?: string;
  bail_status?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  case_id: string;
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
  performed_by?: string;
  performed_by_name?: string;
  is_milestone: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  case_id?: string;
  type: string;
  title: string;
  message?: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface Document {
  id: string;
  case_id: string;
  document_type: string;
  title: string;
  content?: string;
  status: string;
  generated_by_ai: boolean;
  created_by?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LegalProvision {
  id: string;
  act_name: string;
  section: string;
  title: string;
  description: string;
  plain_language: string;
  typical_evidence: string[];
  offense_category: string;
  punishment: string;
  is_bailable: boolean;
  is_cognizable: boolean;
  keywords: string[];
}

export interface CaseLegalProvision {
  id: string;
  case_id: string;
  provision_id: string;
  confidence_score: number;
  ai_reasoning?: string;
  status: string;
  reviewed_by?: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  case_id?: string;
  user_id: string;
  title: string;
  messages: object[];
  created_at: string;
  updated_at: string;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  full_name?: string;
  email?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  created_at: string;
}

// ── The store ─────────────────────────────────────────────────────────────────

class MemoryStore {
  users: User[] = [];
  cases: Case[] = [];
  evidence: Evidence[] = [];
  witnesses: Witness[] = [];
  victims: Victim[] = [];
  suspects: Suspect[] = [];
  timeline_events: TimelineEvent[] = [];
  notifications: Notification[] = [];
  documents: Document[] = [];
  legal_provisions: LegalProvision[] = [];
  case_legal_provisions: CaseLegalProvision[] = [];
  chat_sessions: ChatSession[] = [];
  refresh_tokens: RefreshToken[] = [];
  audit_logs: AuditLog[] = [];

  async seed() {
    // Seed admin user
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('Admin@1234', salt);
    const officerHash = await bcrypt.hash('Officer@1234', salt);

    const adminId = uuidv4();
    const officerId = uuidv4();
    const now = new Date().toISOString();

    this.users = [
      {
        id: adminId,
        email: 'admin@justiceai.gov',
        password_hash: adminHash,
        full_name: 'System Administrator',
        role: 'admin',
        badge_number: 'ADM-001',
        department: 'IT Administration',
        station: 'HQ',
        is_active: true,
        two_factor_enabled: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: officerId,
        email: 'io@justiceai.gov',
        password_hash: officerHash,
        full_name: 'Investigating Officer Sharma',
        role: 'investigating_officer',
        badge_number: 'IO-2024',
        department: 'Crime Branch',
        station: 'MG Road PS',
        is_active: true,
        two_factor_enabled: false,
        created_at: now,
        updated_at: now,
      },
    ];

    // Seed legal provisions
    this.legal_provisions = [
      {
        id: uuidv4(),
        act_name: 'Indian Penal Code',
        section: '302',
        title: 'Punishment for murder',
        description: 'Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.',
        plain_language: 'This section deals with the punishment for committing murder.',
        typical_evidence: ['Post-mortem report', 'Eyewitness statements', 'CCTV footage', 'Weapon used', 'Forensic report'],
        offense_category: 'Violent Crime',
        punishment: 'Death or life imprisonment with fine',
        is_bailable: false,
        is_cognizable: true,
        keywords: ['murder', 'homicide', 'killing', 'death'],
      },
      {
        id: uuidv4(),
        act_name: 'Indian Penal Code',
        section: '379',
        title: 'Punishment for theft',
        description: 'Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.',
        plain_language: 'This section punishes anyone who steals movable property.',
        typical_evidence: ['CCTV footage', 'Witness statements', 'Recovery of stolen property', 'Fingerprints'],
        offense_category: 'Property Crime',
        punishment: 'Up to 3 years imprisonment or fine or both',
        is_bailable: true,
        is_cognizable: true,
        keywords: ['theft', 'stolen', 'property', 'burglary'],
      },
      {
        id: uuidv4(),
        act_name: 'Indian Penal Code',
        section: '420',
        title: 'Cheating and dishonestly inducing delivery of property',
        description: 'Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person.',
        plain_language: 'Covers fraud, cheating and deception for financial gain.',
        typical_evidence: ['Bank records', 'Communication records', 'Witness statements', 'Documentary evidence'],
        offense_category: 'Financial Crime',
        punishment: 'Up to 7 years imprisonment with fine',
        is_bailable: false,
        is_cognizable: true,
        keywords: ['fraud', 'cheating', 'deception', 'property', 'financial'],
      },
      {
        id: uuidv4(),
        act_name: 'Indian Penal Code',
        section: '354',
        title: 'Assault or criminal force to woman with intent to outrage her modesty',
        description: 'Whoever assaults or uses criminal force to any woman, intending to outrage or knowing it to be likely that he will thereby outrage her modesty.',
        plain_language: 'Protects women from physical assault with intent to harm dignity.',
        typical_evidence: ['Medical examination report', 'Victim statement', 'Witness accounts', 'CCTV footage'],
        offense_category: 'Crime Against Women',
        punishment: 'Up to 5 years imprisonment with fine',
        is_bailable: false,
        is_cognizable: true,
        keywords: ['assault', 'woman', 'modesty', 'force'],
      },
      {
        id: uuidv4(),
        act_name: 'Indian Penal Code',
        section: '392',
        title: 'Punishment for robbery',
        description: 'Whoever commits robbery shall be punished with rigorous imprisonment for a term which may extend to ten years.',
        plain_language: 'Robbery is theft with force or threat of force.',
        typical_evidence: ['Victim statement', 'CCTV footage', 'Witness accounts', 'Recovery of stolen items', 'Forensic evidence'],
        offense_category: 'Violent Property Crime',
        punishment: 'Up to 10 years rigorous imprisonment with fine',
        is_bailable: false,
        is_cognizable: true,
        keywords: ['robbery', 'dacoity', 'force', 'theft', 'armed'],
      },
      {
        id: uuidv4(),
        act_name: 'Information Technology Act',
        section: '66',
        title: 'Computer related offences',
        description: 'If any person, dishonestly or fraudulently, does any act referred to in section 43, he shall be punishable.',
        plain_language: 'Covers hacking, data theft, and unauthorized computer access.',
        typical_evidence: ['Digital forensics report', 'Server logs', 'IP records', 'Email trails'],
        offense_category: 'Cybercrime',
        punishment: 'Up to 3 years imprisonment or fine up to 5 lakhs or both',
        is_bailable: true,
        is_cognizable: true,
        keywords: ['cyber', 'hacking', 'computer', 'digital', 'online', 'fraud'],
      },
      {
        id: uuidv4(),
        act_name: 'Indian Penal Code',
        section: '363',
        title: 'Punishment for kidnapping',
        description: 'Whoever kidnaps any person from India or from lawful guardianship shall be punished with imprisonment of either description for a term which may extend to seven years.',
        plain_language: 'Kidnapping involves taking a person without consent from legal guardianship.',
        typical_evidence: ['Witness statements', 'CCTV footage', 'Communication records', 'Ransom demands'],
        offense_category: 'Person Crime',
        punishment: 'Up to 7 years imprisonment with fine',
        is_bailable: false,
        is_cognizable: true,
        keywords: ['kidnapping', 'abduction', 'missing person'],
      },
    ];

    // Seed sample cases
    const case1Id = uuidv4();
    const case2Id = uuidv4();
    const case3Id = uuidv4();

    this.cases = [
      {
        id: case1Id,
        case_number: 'JAI-2024-00001',
        title: 'Vehicle Theft at MG Road Parking',
        description: 'A Honda Activa scooter (KA-01-AB-1234) was reported stolen from the basement parking of MG Road Mall. The vehicle was parked at 7 PM and found missing at 10 PM. CCTV footage shows a suspect in a hoodie near the vehicle.',
        status: 'under_investigation',
        crime_type: 'Vehicle Theft',
        incident_date: '2024-11-15T19:00:00.000Z',
        incident_location: 'MG Road Mall, Basement Parking, Bengaluru',
        fir_number: 'FIR-2024-1234',
        fir_date: '2024-11-15',
        police_station: 'MG Road PS',
        assigned_io: officerId,
        priority: 'medium',
        tags: ['vehicle', 'theft', 'cctv'],
        ai_summary: 'Vehicle theft case involving a scooter stolen from a mall parking lot. CCTV evidence available. One suspect identified from footage wearing a hoodie.',
        created_by: officerId,
        created_at: '2024-11-15T22:00:00.000Z',
        updated_at: '2024-11-20T10:00:00.000Z',
      },
      {
        id: case2Id,
        case_number: 'JAI-2024-00002',
        title: 'Online Fraud - UPI Scam',
        description: 'Complainant Ramesh Kumar received a call from someone impersonating a bank official. He was tricked into sharing his OTP and lost Rs. 85,000 from his account via multiple UPI transactions.',
        status: 'open',
        crime_type: 'Cybercrime',
        incident_date: '2024-12-01T14:30:00.000Z',
        incident_location: '45 Koramangala, Bengaluru',
        fir_number: 'FIR-2024-5678',
        fir_date: '2024-12-01',
        police_station: 'Koramangala PS',
        assigned_io: officerId,
        priority: 'high',
        tags: ['cybercrime', 'upi', 'fraud', 'banking'],
        created_by: officerId,
        created_at: '2024-12-01T16:00:00.000Z',
        updated_at: '2024-12-02T09:00:00.000Z',
      },
      {
        id: case3Id,
        case_number: 'JAI-2024-00003',
        title: 'Robbery at Jewellery Shop',
        description: 'Two armed men robbed a jewellery shop at gunpoint. They took gold ornaments worth approximately Rs. 12 lakhs and fled on a motorcycle. One shop employee was injured during the incident.',
        status: 'under_investigation',
        crime_type: 'Robbery',
        incident_date: '2024-12-10T11:00:00.000Z',
        incident_location: 'Commercial Street, Bengaluru',
        fir_number: 'FIR-2024-9012',
        fir_date: '2024-12-10',
        police_station: 'Commercial Street PS',
        assigned_io: officerId,
        priority: 'critical',
        tags: ['robbery', 'armed', 'jewellery', 'injury'],
        created_by: officerId,
        created_at: '2024-12-10T12:00:00.000Z',
        updated_at: '2024-12-12T15:00:00.000Z',
      },
    ];

    // Seed evidence
    this.evidence = [
      {
        id: uuidv4(),
        case_id: case1Id,
        evidence_number: 'EVI-001',
        title: 'CCTV Footage - Parking Level B2',
        description: 'CCTV recording showing suspect near vehicle at 9:45 PM.',
        evidence_type: 'video',
        collected_by: officerId,
        collected_at: '2024-11-16T09:00:00.000Z',
        location_found: 'MG Road Mall Security Office',
        tags: ['cctv', 'video', 'suspect'],
        is_verified: true,
        chain_of_custody: [
          { timestamp: '2024-11-16T09:00:00.000Z', action: 'Evidence collected from mall security', officer: 'IO Sharma', officer_id: officerId },
        ],
        created_at: '2024-11-16T09:00:00.000Z',
        updated_at: '2024-11-16T09:00:00.000Z',
      },
      {
        id: uuidv4(),
        case_id: case1Id,
        evidence_number: 'EVI-002',
        title: 'Vehicle Registration Documents',
        description: 'Original RC book and insurance papers of the stolen vehicle provided by owner.',
        evidence_type: 'document',
        collected_by: officerId,
        collected_at: '2024-11-15T23:00:00.000Z',
        tags: ['document', 'vehicle'],
        is_verified: true,
        chain_of_custody: [
          { timestamp: '2024-11-15T23:00:00.000Z', action: 'Received from vehicle owner', officer: 'IO Sharma', officer_id: officerId },
        ],
        created_at: '2024-11-15T23:00:00.000Z',
        updated_at: '2024-11-15T23:00:00.000Z',
      },
      {
        id: uuidv4(),
        case_id: case3Id,
        evidence_number: 'EVI-003',
        title: 'Shop CCTV - Robbery Footage',
        description: 'Full recording of the robbery showing both accused from entrance to exit.',
        evidence_type: 'video',
        collected_by: officerId,
        collected_at: '2024-12-10T13:00:00.000Z',
        location_found: 'Jewellery Shop DVR',
        tags: ['cctv', 'robbery', 'accused'],
        is_verified: true,
        chain_of_custody: [
          { timestamp: '2024-12-10T13:00:00.000Z', action: 'Seized from shop DVR system', officer: 'IO Sharma', officer_id: officerId },
        ],
        created_at: '2024-12-10T13:00:00.000Z',
        updated_at: '2024-12-10T13:00:00.000Z',
      },
    ];

    // Seed witnesses
    this.witnesses = [
      {
        id: uuidv4(),
        case_id: case1Id,
        full_name: 'Suresh Patil',
        age: 45,
        gender: 'Male',
        phone: '9876543210',
        occupation: 'Security Guard',
        relationship_to_case: 'Eyewitness - was on duty at parking',
        court_appearance_status: 'Willing to testify',
        protection_required: false,
        statements: [
          {
            id: uuidv4(),
            content: 'I saw a man in a black hoodie near the scooter around 9:40 PM. He looked around nervously and appeared to use some tool on the lock.',
            statement_date: '2024-11-16T10:00:00.000Z',
            recorded_by: 'IO Sharma',
          },
        ],
        created_at: '2024-11-16T10:00:00.000Z',
        updated_at: '2024-11-16T10:00:00.000Z',
      },
      {
        id: uuidv4(),
        case_id: case3Id,
        full_name: 'Priya Mehta',
        age: 28,
        gender: 'Female',
        phone: '9988776655',
        occupation: 'Shop Employee',
        relationship_to_case: 'Employee present during robbery, also victim of assault',
        court_appearance_status: 'Willing to testify',
        protection_required: true,
        statements: [
          {
            id: uuidv4(),
            content: 'Two men entered at 11 AM. One had a pistol. They shouted at us to lie down. They took all the gold from the showcase and fled within 3-4 minutes on a motorcycle parked outside.',
            statement_date: '2024-12-10T15:00:00.000Z',
            recorded_by: 'IO Sharma',
          },
        ],
        created_at: '2024-12-10T15:00:00.000Z',
        updated_at: '2024-12-10T15:00:00.000Z',
      },
    ];

    // Seed victims
    this.victims = [
      {
        id: uuidv4(),
        case_id: case1Id,
        full_name: 'Ramesh Kumar',
        age: 32,
        gender: 'Male',
        phone: '9123456789',
        address: '12 Indiranagar, Bengaluru',
        injury_description: 'No physical injury',
        compensation_status: 'Claim filed with insurance',
        created_at: '2024-11-15T23:00:00.000Z',
        updated_at: '2024-11-15T23:00:00.000Z',
      },
      {
        id: uuidv4(),
        case_id: case2Id,
        full_name: 'Ramesh Kumar',
        age: 52,
        gender: 'Male',
        phone: '9876501234',
        address: '45 Koramangala, Bengaluru',
        injury_description: 'No physical injury — financial loss of Rs. 85,000',
        compensation_status: 'Bank dispute filed',
        created_at: '2024-12-01T16:00:00.000Z',
        updated_at: '2024-12-01T16:00:00.000Z',
      },
    ];

    // Seed suspects
    this.suspects = [
      {
        id: uuidv4(),
        case_id: case1Id,
        full_name: 'Unknown Male Suspect',
        aliases: ['Hoodie Man'],
        gender: 'Male',
        description: 'Approx 5\'8", slim build, wearing black hoodie and jeans. Visible tattoo on right forearm.',
        arrest_status: 'not_arrested',
        created_at: '2024-11-17T09:00:00.000Z',
        updated_at: '2024-11-17T09:00:00.000Z',
      },
      {
        id: uuidv4(),
        case_id: case3Id,
        full_name: 'Accused 1 - Partial ID from CCTV',
        aliases: [],
        gender: 'Male',
        description: 'Approx 5\'10", medium build. Wore blue shirt during robbery. Face partially visible on CCTV.',
        arrest_status: 'not_arrested',
        created_at: '2024-12-11T10:00:00.000Z',
        updated_at: '2024-12-11T10:00:00.000Z',
      },
    ];

    // Seed timeline events
    this.timeline_events = [
      { id: uuidv4(), case_id: case1Id, event_type: 'case_created', title: 'Case Registered', description: 'FIR registered at MG Road PS', event_date: '2024-11-15T22:00:00.000Z', performed_by: officerId, performed_by_name: 'IO Sharma', is_milestone: true, created_at: now },
      { id: uuidv4(), case_id: case1Id, event_type: 'evidence_uploaded', title: 'CCTV Footage Collected', description: 'Obtained CCTV recording from mall security', event_date: '2024-11-16T09:00:00.000Z', performed_by: officerId, performed_by_name: 'IO Sharma', is_milestone: false, created_at: now },
      { id: uuidv4(), case_id: case1Id, event_type: 'witness_interviewed', title: 'Witness Statement Recorded', description: 'Statement of security guard Suresh Patil recorded', event_date: '2024-11-16T10:00:00.000Z', performed_by: officerId, performed_by_name: 'IO Sharma', is_milestone: false, created_at: now },
      { id: uuidv4(), case_id: case1Id, event_type: 'investigation_update', title: 'Toll Booth Records Requested', description: 'Requested toll records for vehicles exiting city on NH-44', event_date: '2024-11-18T11:00:00.000Z', performed_by: officerId, performed_by_name: 'IO Sharma', is_milestone: false, created_at: now },
      { id: uuidv4(), case_id: case2Id, event_type: 'case_created', title: 'Case Registered', description: 'Cybercrime FIR registered', event_date: '2024-12-01T16:00:00.000Z', performed_by: officerId, performed_by_name: 'IO Sharma', is_milestone: true, created_at: now },
      { id: uuidv4(), case_id: case3Id, event_type: 'case_created', title: 'Case Registered', description: 'FIR registered at Commercial Street PS', event_date: '2024-12-10T12:00:00.000Z', performed_by: officerId, performed_by_name: 'IO Sharma', is_milestone: true, created_at: now },
      { id: uuidv4(), case_id: case3Id, event_type: 'evidence_uploaded', title: 'CCTV Evidence Seized', description: 'DVR from jewellery shop seized as evidence', event_date: '2024-12-10T13:00:00.000Z', performed_by: officerId, performed_by_name: 'IO Sharma', is_milestone: false, created_at: now },
    ];

    // Seed notifications
    this.notifications = [
      {
        id: uuidv4(),
        user_id: officerId,
        case_id: case3Id,
        type: 'case_update',
        title: 'High Priority Case Requires Attention',
        message: 'Case JAI-2024-00003 (Robbery) is marked CRITICAL and has pending evidence verification.',
        is_read: false,
        action_url: `/cases/${case3Id}`,
        created_at: now,
      },
      {
        id: uuidv4(),
        user_id: officerId,
        case_id: case1Id,
        type: 'evidence_uploaded',
        title: 'Evidence Verified',
        message: 'CCTV footage for case JAI-2024-00001 has been verified.',
        is_read: false,
        action_url: `/cases/${case1Id}/evidence`,
        created_at: '2024-11-16T09:30:00.000Z',
      },
      {
        id: uuidv4(),
        user_id: adminId,
        type: 'system',
        title: 'Welcome to JusticeAI',
        message: 'System is running in demo mode. All data is in-memory.',
        is_read: false,
        created_at: now,
      },
    ];

    console.log('✅ Demo data seeded successfully');
    console.log(`   Users: ${this.users.length} (admin@justiceai.gov / Admin@1234)`);
    console.log(`   Cases: ${this.cases.length}`);
    console.log(`   Evidence: ${this.evidence.length}`);
    console.log(`   Legal Provisions: ${this.legal_provisions.length}`);
  }
}

export const db = new MemoryStore();

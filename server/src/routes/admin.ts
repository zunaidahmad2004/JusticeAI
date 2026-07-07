import { Router, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Case from '../models/Case';
import Evidence from '../models/Evidence';
import Witness from '../models/Witness';
import Suspect from '../models/Suspect';
import AuditLog from '../models/AuditLog';
import LegalProvision from '../models/LegalProvision';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(authorize('admin', 'super_admin'));

// GET /api/admin/users
router.get('/users', async (_req: AuthRequest, res: Response): Promise<void> => {
  const users = await User.find()
    .select('-password_hash -two_factor_secret')
    .sort({ createdAt: -1 })
    .lean();
  res.json(users.map((u) => ({ ...u, id: u._id })));
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const { role, is_active, department, station } = req.body;
  const update: Record<string, unknown> = {};
  if (role !== undefined) update.role = role;
  if (is_active !== undefined) update.is_active = is_active;
  if (department !== undefined) update.department = department;
  if (station !== undefined) update.station = station;

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
    .select('-password_hash -two_factor_secret')
    .lean();
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ ...user, id: user._id });
});

// DELETE /api/admin/users/:id  (soft-deactivate)
router.delete('/users/:id', async (_req: AuthRequest, res: Response): Promise<void> => {
  await User.findByIdAndUpdate(_req.params.id, { is_active: false });
  res.json({ message: 'User deactivated' });
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req: AuthRequest, res: Response): Promise<void> => {
  const { user_id, resource_type, page = '1', limit = '50' } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter: Record<string, unknown> = {};
  if (user_id) filter.user_id = user_id;
  if (resource_type) filter.resource_type = resource_type;

  const logs = await AuditLog.find(filter)
    .populate('user_id', 'full_name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  res.json(logs.map((l) => {
    const u = l.user_id as { full_name?: string; email?: string } | null;
    return { ...l, id: l._id, full_name: u?.full_name, email: u?.email };
  }));
});

// GET /api/admin/stats
router.get('/stats', async (_req: AuthRequest, res: Response): Promise<void> => {
  const [users, cases, evidence, witnesses, suspects] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }, { $project: { role: '$_id', count: 1, _id: 0 } }]),
    Case.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $project: { status: '$_id', count: 1, _id: 0 } }]),
    Evidence.aggregate([{ $group: { _id: '$evidence_type', count: { $sum: 1 } } }, { $project: { evidence_type: '$_id', count: 1, _id: 0 } }]),
    Witness.countDocuments(),
    Suspect.countDocuments(),
  ]);

  res.json({ users, cases, evidence, total_witnesses: witnesses, total_suspects: suspects });
});

// POST /api/admin/legal-provisions
router.post('/legal-provisions', async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await LegalProvision.create(req.body);
  res.status(201).json({ ...doc.toObject(), id: doc._id });
});

export default router;

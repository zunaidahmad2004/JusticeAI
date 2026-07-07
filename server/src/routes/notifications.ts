import { Router, Response } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { unread } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { user_id: req.user!.id };
  if (unread === 'true') filter.is_read = false;

  const docs = await Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  res.json(docs.map((d) => ({ ...d, id: d._id })));
});

router.put('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user!.id },
    { is_read: true }
  );
  res.json({ message: 'Marked as read' });
});

router.put('/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  await Notification.updateMany({ user_id: req.user!.id }, { is_read: true });
  res.json({ message: 'All notifications marked as read' });
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await Notification.findOneAndDelete({ _id: req.params.id, user_id: req.user!.id });
  res.json({ message: 'Notification deleted' });
});

// Exported helper used by other routes
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  caseId?: string,
  actionUrl?: string
): Promise<void> => {
  await Notification.create({
    user_id: userId,
    case_id: caseId || undefined,
    type, title, message,
    action_url: actionUrl || undefined,
  });
};

export default router;

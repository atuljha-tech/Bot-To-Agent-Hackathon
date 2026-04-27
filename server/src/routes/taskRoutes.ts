import { Router } from 'express';
import {
  generateTasks,
  addTasksBulk,
  getTasks,
  updateTask,
  deleteTask,
  reorderTasks,
  replanDay,
  getActiveMission,
} from '../controllers/taskController';

const router = Router();

router.post('/generate-tasks', generateTasks);
router.post('/tasks/bulk', addTasksBulk);
router.get('/tasks/:userId', getTasks);
router.put('/tasks/reorder', reorderTasks);
router.put('/tasks/:taskId', updateTask);
router.delete('/tasks/:taskId', deleteTask);
router.post('/tasks/replan/:userId', replanDay);
router.get('/tasks/active/:userId', getActiveMission);

export default router;

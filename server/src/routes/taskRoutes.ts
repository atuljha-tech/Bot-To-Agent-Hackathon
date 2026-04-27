import { Router } from 'express';
import { generateTasks, getTasks, updateTask, deleteTask } from '../controllers/taskController';

const router = Router();

router.post('/generate-tasks', generateTasks);
router.get('/tasks/:userId', getTasks);
router.put('/tasks/:taskId', updateTask);
router.delete('/tasks/:taskId', deleteTask);

export default router;

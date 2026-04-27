import { Request, Response } from 'express';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { generateWithFallback } from '../config/gemini';
import { buildTaskPrompt } from '../config/promptBuilder';

export const generateTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, request } = req.body;

    if (!userId || !request) {
      res.status(400).json({ error: 'userId and request are required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const prompt = buildTaskPrompt(user, request);

    const rawResponse = await generateWithFallback(prompt);

    // Parse tasks from response
    const tasks = parseTasksFromResponse(rawResponse, userId);

    // Save tasks to DB
    if (tasks.length > 0) {
      await Task.insertMany(tasks);
    }

    // Store in history
    user.history.push({
      timestamp: new Date(),
      type: 'action',
      input: request,
      output: rawResponse,
      mode: 'action',
    });

    // Boost productivity score for taking action
    user.productivityScore = Math.min(100, user.productivityScore + 3);

    // Track planning behavior
    const existing = user.behaviorPatterns.find((p: any) => p.pattern === 'Actively plans and organizes');
    if (existing) {
      existing.frequency += 1;
      existing.lastOccurrence = new Date();
    } else {
      user.behaviorPatterns.push({
        pattern: 'Actively plans and organizes',
        frequency: 1,
        lastOccurrence: new Date(),
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      rawResponse,
      tasks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Task generation error:', error);
    res.status(500).json({
      error: 'Failed to generate tasks',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const tasks = await Task.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tasks,
      total: tasks.length,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { completed } = req.body;

    const task = await Task.findByIdAndUpdate(
      taskId,
      { completed, completedAt: completed ? new Date() : null },
      { new: true }
    );

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Update user productivity score when task completed
    if (completed) {
      const user = await User.findById(task.userId);
      if (user) {
        user.productivityScore = Math.min(100, user.productivityScore + 5);

        // Track task completion behavior
        const existing = user.behaviorPatterns.find((p: any) => p.pattern === 'Completes planned tasks');
        if (existing) {
          existing.frequency += 1;
          existing.lastOccurrence = new Date();
        } else {
          user.behaviorPatterns.push({
            pattern: 'Completes planned tasks',
            frequency: 1,
            lastOccurrence: new Date(),
          });
        }

        await user.save();
      }
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    await Task.findByIdAndDelete(taskId);

    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

function parseTasksFromResponse(text: string, userId: string) {
  try {
    const jsonMatch = text.match(/TASKS_JSON:\s*(\[[\s\S]*?\])/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[1]);

    return parsed.map((t: any) => ({
      userId,
      title: t.title || 'Untitled Task',
      description: t.description || '',
      priority: t.priority || 'medium',
      timeEstimate: t.timeEstimate || '',
      completed: false,
    }));
  } catch {
    return [];
  }
}

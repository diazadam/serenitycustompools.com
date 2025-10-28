import type { Request, Response } from "express";
import { blogScheduler } from "../services/scheduler";
import { blogAIWriter } from "../services/blog-ai-writer";

// Get scheduler status
export async function getSchedulerStatus(req: Request, res: Response) {
  try {
    const status = blogScheduler.getStatus();
    res.json(status);
  } catch (error) {
    console.error("Error getting scheduler status:", error);
    res.status(500).json({ error: "Failed to get scheduler status" });
  }
}

// Enable auto-publishing
export async function enableAutoPublishing(req: Request, res: Response) {
  try {
    blogScheduler.enable();
    res.json({ 
      success: true, 
      message: "Auto-publishing enabled",
      status: blogScheduler.getStatus() 
    });
  } catch (error) {
    console.error("Error enabling auto-publishing:", error);
    res.status(500).json({ error: "Failed to enable auto-publishing" });
  }
}

// Disable auto-publishing
export async function disableAutoPublishing(req: Request, res: Response) {
  try {
    blogScheduler.disable();
    res.json({ 
      success: true, 
      message: "Auto-publishing disabled",
      status: blogScheduler.getStatus() 
    });
  } catch (error) {
    console.error("Error disabling auto-publishing:", error);
    res.status(500).json({ error: "Failed to disable auto-publishing" });
  }
}

// Update scheduler configuration
export async function updateSchedulerConfig(req: Request, res: Response) {
  try {
    const { dayOfWeek, hour, minute } = req.body;
    
    const config: any = {};
    if (dayOfWeek !== undefined) config.dayOfWeek = dayOfWeek;
    if (hour !== undefined) config.hour = hour;
    if (minute !== undefined) config.minute = minute;
    
    blogScheduler.updateConfig(config);
    
    res.json({ 
      success: true, 
      message: "Scheduler configuration updated",
      status: blogScheduler.getStatus() 
    });
  } catch (error) {
    console.error("Error updating scheduler config:", error);
    res.status(500).json({ error: "Failed to update configuration" });
  }
}

// Manually generate a blog post now
export async function generateBlogNow(req: Request, res: Response) {
  try {
    console.log("Manual blog generation requested");
    
    // Generate the blog post
    const blogPost = await blogAIWriter.generateAndPublish();
    
    if (blogPost) {
      res.json({ 
        success: true, 
        message: "Blog post generated and published successfully"
      });
    } else {
      res.status(500).json({ 
        error: "Failed to generate blog post" 
      });
    }
  } catch (error) {
    console.error("Error generating blog:", error);
    res.status(500).json({ error: "Failed to generate blog post" });
  }
}
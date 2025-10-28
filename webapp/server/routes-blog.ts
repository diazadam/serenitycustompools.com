import { Request, Response, Router } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { insertBlogPostSchema } from "@shared/schema";

const router = Router();

// Get all blog posts (with optional category filter)
router.get("/posts", async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const posts = await storage.getBlogPosts(category);
    res.json(posts);
  } catch (error) {
    console.error("Get blog posts error:", error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// Get featured posts
router.get("/posts/featured", async (req: Request, res: Response) => {
  try {
    const posts = await storage.getFeaturedPosts();
    res.json(posts);
  } catch (error) {
    console.error("Get featured posts error:", error);
    res.status(500).json({ error: "Failed to fetch featured posts" });
  }
});

// Get single blog post by slug
router.get("/posts/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const post = await storage.getBlogPostBySlug(slug);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    // Update view count
    await storage.updateBlogPostViews(post.id);
    
    res.json(post);
  } catch (error) {
    console.error("Get blog post error:", error);
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

// Like a blog post
router.post("/posts/:id/like", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await storage.likeBlogPost(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Like blog post error:", error);
    res.status(500).json({ error: "Failed to like post" });
  }
});

// Create a new blog post (for admin)
router.post("/posts", async (req: Request, res: Response) => {
  try {
    const validatedData = insertBlogPostSchema.parse(req.body);
    const post = await storage.createBlogPost(validatedData);
    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid post data", details: error.errors });
    }
    console.error("Create blog post error:", error);
    res.status(500).json({ error: "Failed to create blog post" });
  }
});

export default router;
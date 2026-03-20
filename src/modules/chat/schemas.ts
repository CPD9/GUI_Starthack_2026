import { z } from "zod";

export const chatHistoryInsertSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export const chatHistoryUpdateSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
});

export const chatMessageInsertSchema = z.object({
  chatId: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, "Content is required"),
});

export const createChatWithMessagesSchema = z.object({
  title: z.string().min(1, "Title is required"),
  messages: z.array(chatMessageInsertSchema.omit({ chatId: true })),
});

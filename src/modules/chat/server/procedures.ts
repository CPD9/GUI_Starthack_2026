import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, count } from "drizzle-orm";

import { db } from "@/db";
import { chatHistory, chatMessages } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";

import { chatHistoryInsertSchema, chatHistoryUpdateSchema, chatMessageInsertSchema, createChatWithMessagesSchema } from "../schemas";

export const chatRouter = createTRPCRouter({
  // Create a new chat session
  create: protectedProcedure
    .input(chatHistoryInsertSchema)
    .mutation(async ({ ctx, input }) => {
      const [newChat] = await db
        .insert(chatHistory)
        .values({
          title: input.title,
          userId: ctx.auth.user.id,
        })
        .returning();

      return newChat;
    }),

  // Create a chat with messages in one transaction
  createWithMessages: protectedProcedure
    .input(createChatWithMessagesSchema)
    .mutation(async ({ ctx, input }) => {
      return await db.transaction(async (tx) => {
        const [newChat] = await tx
          .insert(chatHistory)
          .values({
            title: input.title,
            userId: ctx.auth.user.id,
          })
          .returning();

        if (input.messages.length > 0) {
          await tx.insert(chatMessages).values(
            input.messages.map((msg) => ({
              chatId: newChat.id,
              role: msg.role,
              content: msg.content,
            }))
          );
        }

        return newChat;
      });
    }),

  // Update chat title
  update: protectedProcedure
    .input(chatHistoryUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const [updatedChat] = await db
        .update(chatHistory)
        .set({ 
          title: input.title,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(chatHistory.id, input.id),
            eq(chatHistory.userId, ctx.auth.user.id),
          )
        )
        .returning();

      if (!updatedChat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      return updatedChat;
    }),

  // Delete a chat and its messages
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [removedChat] = await db
        .delete(chatHistory)
        .where(
          and(
            eq(chatHistory.id, input.id),
            eq(chatHistory.userId, ctx.auth.user.id),
          )
        )
        .returning();

      if (!removedChat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      return removedChat;
    }),

  // Get a single chat with its messages
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [existingChat] = await db
        .select()
        .from(chatHistory)
        .where(
          and(
            eq(chatHistory.id, input.id),
            eq(chatHistory.userId, ctx.auth.user.id),
          )
        );

      if (!existingChat) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      }

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatId, existingChat.id))
        .orderBy(chatMessages.createdAt);

      return {
        ...existingChat,
        messages,
      };
    }),

  // Get all chats for the user (paginated)
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input;

      const data = await db
        .select()
        .from(chatHistory)
        .where(eq(chatHistory.userId, ctx.auth.user.id))
        .orderBy(desc(chatHistory.updatedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [{ total }] = await db
        .select({ total: count() })
        .from(chatHistory)
        .where(eq(chatHistory.userId, ctx.auth.user.id));

      const totalPages = Math.ceil(total / pageSize);

      return {
        items: data,
        total,
        totalPages,
      };
    }),

  // Add a message to an existing chat
  addMessage: protectedProcedure
    .input(chatMessageInsertSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify the chat belongs to the user
      const [existingChat] = await db
        .select()
        .from(chatHistory)
        .where(
          and(
            eq(chatHistory.id, input.chatId),
            eq(chatHistory.userId, ctx.auth.user.id),
          )
        );

      if (!existingChat) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      }

      const [newMessage] = await db
        .insert(chatMessages)
        .values({
          chatId: input.chatId,
          role: input.role,
          content: input.content,
        })
        .returning();

      // Update chat's updatedAt timestamp
      await db
        .update(chatHistory)
        .set({ updatedAt: new Date() })
        .where(eq(chatHistory.id, input.chatId));

      return newMessage;
    }),

  // Get messages for a specific chat
  getMessages: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify the chat belongs to the user
      const [existingChat] = await db
        .select()
        .from(chatHistory)
        .where(
          and(
            eq(chatHistory.id, input.chatId),
            eq(chatHistory.userId, ctx.auth.user.id),
          )
        );

      if (!existingChat) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      }

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatId, input.chatId))
        .orderBy(chatMessages.createdAt);

      return messages;
    }),
});

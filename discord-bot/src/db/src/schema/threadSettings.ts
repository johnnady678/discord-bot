import { pgTable, text, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const threadSettingsTable = pgTable("thread_settings", {
  threadId: text("thread_id").primaryKey(),
  channelId: text("channel_id").notNull(),
  guildId: text("guild_id").notNull(),
  reminderHour: integer("reminder_hour").notNull().default(9),
  reminderMinute: integer("reminder_minute").notNull().default(0),
  reminderEnabled: boolean("reminder_enabled").notNull().default(true),
});

export const insertThreadSettingsSchema = createInsertSchema(threadSettingsTable);
export type InsertThreadSettings = z.infer<typeof insertThreadSettingsSchema>;
export type ThreadSettings = typeof threadSettingsTable.$inferSelect;

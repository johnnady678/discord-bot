import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, active, paused
  nodes: jsonb("nodes").notNull().default([]),
  connections: jsonb("connections").notNull().default([]),
  config: jsonb("config").notNull().default({}),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const workflowExecutions = pgTable("workflow_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull(),
  status: text("status").notNull(), // running, completed, failed
  startedAt: timestamp("started_at").notNull().default(sql`now()`),
  completedAt: timestamp("completed_at"),
  logs: jsonb("logs").notNull().default([]),
  data: jsonb("data").notNull().default({}),
});

export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // zendesk, slack, gmail, trello
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  connected: boolean("connected").notNull().default(false),
  config: jsonb("config").notNull().default({}),
});

export const workflowTemplates = pgTable("workflow_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  nodes: jsonb("nodes").notNull().default([]),
  connections: jsonb("connections").notNull().default([]),
});

// Schemas
export const insertWorkflowSchema = createInsertSchema(workflows).pick({
  name: true,
  description: true,
  status: true,
  nodes: true,
  connections: true,
  config: true,
});

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).pick({
  workflowId: true,
  status: true,
  logs: true,
  data: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).pick({
  name: true,
  type: true,
  icon: true,
  color: true,
  connected: true,
  config: true,
});

export const insertWorkflowTemplateSchema = createInsertSchema(workflowTemplates).pick({
  name: true,
  description: true,
  category: true,
  nodes: true,
  connections: true,
});

// Types
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

export type InsertWorkflowTemplate = z.infer<typeof insertWorkflowTemplateSchema>;
export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;

// Workflow node types
export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'transform';
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, any>;
    integration?: string;
    privacy?: {
      maskEmails: boolean;
      encryptData: boolean;
      logAccess: boolean;
    };
    errorHandling?: {
      retries: number;
      onFailure: 'continue' | 'stop' | 'notify';
    };
  };
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

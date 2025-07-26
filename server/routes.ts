import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkflowSchema, insertWorkflowExecutionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Workflows
  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(validatedData);
      res.status(201).json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid workflow data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create workflow" });
    }
  });

  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.partial().parse(req.body);
      const workflow = await storage.updateWorkflow(req.params.id, validatedData);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid workflow data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkflow(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workflow" });
    }
  });

  // Workflow Executions
  app.get("/api/workflows/:id/executions", async (req, res) => {
    try {
      const executions = await storage.getWorkflowExecutions(req.params.id);
      res.json(executions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch executions" });
    }
  });

  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      const execution = await storage.createWorkflowExecution({
        workflowId: req.params.id,
        status: "running",
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: "info",
            message: "Workflow execution started",
            nodeId: null
          }
        ],
        data: req.body.data || {}
      });

      // Simulate workflow execution
      setTimeout(async () => {
        const logs = [
          {
            timestamp: new Date().toISOString(),
            level: "info",
            message: "Processing trigger node",
            nodeId: workflow.nodes[0]?.id || null
          },
          {
            timestamp: new Date().toISOString(),
            level: "info",
            message: "Evaluating condition",
            nodeId: workflow.nodes[1]?.id || null
          },
          {
            timestamp: new Date().toISOString(),
            level: "success",
            message: "Workflow executed successfully",
            nodeId: null
          }
        ];

        await storage.updateWorkflowExecution(execution.id, {
          status: "completed",
          logs: [...execution.logs, ...logs]
        });
      }, 2000);

      res.status(201).json(execution);
    } catch (error) {
      res.status(500).json({ message: "Failed to execute workflow" });
    }
  });

  // Integrations
  app.get("/api/integrations", async (req, res) => {
    try {
      const integrations = await storage.getIntegrations();
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.put("/api/integrations/:id", async (req, res) => {
    try {
      const integration = await storage.updateIntegration(req.params.id, req.body);
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }
      res.json(integration);
    } catch (error) {
      res.status(500).json({ message: "Failed to update integration" });
    }
  });

  // Templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getWorkflowTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/workflows/from-template/:templateId", async (req, res) => {
    try {
      const template = await storage.getWorkflowTemplate(req.params.templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const workflow = await storage.createWorkflow({
        name: `${template.name} - Copy`,
        description: template.description,
        status: "draft",
        nodes: template.nodes,
        connections: template.connections,
        config: {}
      });

      res.status(201).json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to create workflow from template" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { 
  type Workflow, 
  type InsertWorkflow,
  type WorkflowExecution,
  type InsertWorkflowExecution,
  type Integration,
  type InsertIntegration,
  type WorkflowTemplate,
  type InsertWorkflowTemplate,
  type WorkflowNode,
  type WorkflowConnection
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Workflows
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<boolean>;

  // Workflow Executions
  getWorkflowExecutions(workflowId: string): Promise<WorkflowExecution[]>;
  createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution>;
  updateWorkflowExecution(id: string, execution: Partial<InsertWorkflowExecution>): Promise<WorkflowExecution | undefined>;

  // Integrations
  getIntegrations(): Promise<Integration[]>;
  getIntegration(id: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, integration: Partial<InsertIntegration>): Promise<Integration | undefined>;

  // Templates
  getWorkflowTemplates(): Promise<WorkflowTemplate[]>;
  getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined>;
  createWorkflowTemplate(template: InsertWorkflowTemplate): Promise<WorkflowTemplate>;
}

export class MemStorage implements IStorage {
  private workflows: Map<string, Workflow>;
  private workflowExecutions: Map<string, WorkflowExecution>;
  private integrations: Map<string, Integration>;
  private workflowTemplates: Map<string, WorkflowTemplate>;

  constructor() {
    this.workflows = new Map();
    this.workflowExecutions = new Map();
    this.integrations = new Map();
    this.workflowTemplates = new Map();
    
    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Default integrations
    const defaultIntegrations = [
      {
        id: "zendesk-1",
        name: "Zendesk",
        type: "zendesk",
        icon: "fas fa-headset",
        color: "green",
        connected: true,
        config: {}
      },
      {
        id: "slack-1",
        name: "Slack",
        type: "slack",
        icon: "fab fa-slack",
        color: "purple",
        connected: true,
        config: {}
      },
      {
        id: "gmail-1",
        name: "Gmail",
        type: "gmail",
        icon: "far fa-envelope",
        color: "red",
        connected: true,
        config: {}
      },
      {
        id: "trello-1",
        name: "Trello",
        type: "trello",
        icon: "fab fa-trello",
        color: "blue",
        connected: false,
        config: {}
      }
    ];

    defaultIntegrations.forEach(integration => {
      this.integrations.set(integration.id, integration as Integration);
    });

    // Default templates
    const defaultTemplates = [
      {
        id: "template-1",
        name: "Ticket Escalation",
        description: "Auto-escalate high priority tickets to Slack",
        category: "support",
        nodes: [],
        connections: []
      },
      {
        id: "template-2",
        name: "Email Follow-up",
        description: "Send follow-up emails for resolved tickets",
        category: "communication",
        nodes: [],
        connections: []
      },
      {
        id: "template-3",
        name: "Task Creation",
        description: "Create Trello cards from new support tickets",
        category: "project-management",
        nodes: [],
        connections: []
      }
    ];

    defaultTemplates.forEach(template => {
      this.workflowTemplates.set(template.id, template as WorkflowTemplate);
    });

    // Default workflow
    const defaultWorkflow: Workflow = {
      id: "workflow-1",
      name: "Customer Escalation Workflow",
      description: "Automatically escalate urgent customer tickets",
      status: "active",
      nodes: [
        {
          id: "node-1",
          type: "trigger",
          position: { x: 120, y: 80 },
          data: {
            label: "New Zendesk Ticket",
            config: { priority: "high" },
            integration: "zendesk-1"
          }
        },
        {
          id: "node-2",
          type: "condition",
          position: { x: 420, y: 180 },
          data: {
            label: "Check Priority",
            config: { condition: "priority = 'Urgent'" }
          }
        },
        {
          id: "node-3",
          type: "action",
          position: { x: 720, y: 280 },
          data: {
            label: "Send to Slack",
            config: { channel: "#urgent-support" },
            integration: "slack-1",
            privacy: {
              maskEmails: true,
              encryptData: true,
              logAccess: false
            },
            errorHandling: {
              retries: 3,
              onFailure: "continue"
            }
          }
        },
        {
          id: "node-4",
          type: "action",
          position: { x: 1020, y: 380 },
          data: {
            label: "Email Manager",
            config: { template: "escalation-notice" },
            integration: "gmail-1"
          }
        }
      ],
      connections: [
        { id: "edge-1", source: "node-1", target: "node-2" },
        { id: "edge-2", source: "node-2", target: "node-3" },
        { id: "edge-3", source: "node-3", target: "node-4" }
      ],
      config: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(defaultWorkflow.id, defaultWorkflow);
  }

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const workflow: Workflow = {
      ...insertWorkflow,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, updateData: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;

    const updatedWorkflow: Workflow = {
      ...workflow,
      ...updateData,
      updatedAt: new Date()
    };
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  // Workflow Executions
  async getWorkflowExecutions(workflowId: string): Promise<WorkflowExecution[]> {
    return Array.from(this.workflowExecutions.values())
      .filter(execution => execution.workflowId === workflowId);
  }

  async createWorkflowExecution(insertExecution: InsertWorkflowExecution): Promise<WorkflowExecution> {
    const id = randomUUID();
    const execution: WorkflowExecution = {
      ...insertExecution,
      id,
      startedAt: new Date(),
      completedAt: null
    };
    this.workflowExecutions.set(id, execution);
    return execution;
  }

  async updateWorkflowExecution(id: string, updateData: Partial<InsertWorkflowExecution>): Promise<WorkflowExecution | undefined> {
    const execution = this.workflowExecutions.get(id);
    if (!execution) return undefined;

    const updatedExecution: WorkflowExecution = {
      ...execution,
      ...updateData,
      completedAt: updateData.status === 'completed' || updateData.status === 'failed' ? new Date() : execution.completedAt
    };
    this.workflowExecutions.set(id, updatedExecution);
    return updatedExecution;
  }

  // Integrations
  async getIntegrations(): Promise<Integration[]> {
    return Array.from(this.integrations.values());
  }

  async getIntegration(id: string): Promise<Integration | undefined> {
    return this.integrations.get(id);
  }

  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    const id = randomUUID();
    const integration: Integration = { ...insertIntegration, id };
    this.integrations.set(id, integration);
    return integration;
  }

  async updateIntegration(id: string, updateData: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const integration = this.integrations.get(id);
    if (!integration) return undefined;

    const updatedIntegration: Integration = { ...integration, ...updateData };
    this.integrations.set(id, updatedIntegration);
    return updatedIntegration;
  }

  // Templates
  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    return Array.from(this.workflowTemplates.values());
  }

  async getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined> {
    return this.workflowTemplates.get(id);
  }

  async createWorkflowTemplate(insertTemplate: InsertWorkflowTemplate): Promise<WorkflowTemplate> {
    const id = randomUUID();
    const template: WorkflowTemplate = { ...insertTemplate, id };
    this.workflowTemplates.set(id, template);
    return template;
  }
}

export const storage = new MemStorage();

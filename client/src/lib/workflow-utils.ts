import type { WorkflowNode, WorkflowConnection } from "@shared/schema";

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateWorkflow(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): WorkflowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for at least one trigger node
  const triggerNodes = nodes.filter((node) => node.type === "trigger");
  if (triggerNodes.length === 0) {
    errors.push("Workflow must have at least one trigger node");
  }

  // Check for orphaned nodes (nodes with no connections)
  const connectedNodeIds = new Set();
  connections.forEach((connection) => {
    connectedNodeIds.add(connection.source);
    connectedNodeIds.add(connection.target);
  });

  const orphanedNodes = nodes.filter((node) => !connectedNodeIds.has(node.id));
  if (orphanedNodes.length > 0 && nodes.length > 1) {
    warnings.push(
      `${orphanedNodes.length} node(s) are not connected to the workflow`
    );
  }

  // Check for circular dependencies
  const hasCircularDependency = detectCircularDependency(nodes, connections);
  if (hasCircularDependency) {
    errors.push("Workflow contains circular dependencies");
  }

  // Check for required node configurations
  nodes.forEach((node) => {
    if (node.type === "condition" && !node.data.config?.condition) {
      errors.push(`Condition node "${node.data.label}" is missing condition logic`);
    }
    if (node.type === "action" && !node.data.integration) {
      warnings.push(`Action node "${node.data.label}" has no integration configured`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function detectCircularDependency(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): boolean {
  const adjacencyList: Record<string, string[]> = {};
  const visited: Set<string> = new Set();
  const recursionStack: Set<string> = new Set();

  // Build adjacency list
  nodes.forEach((node) => {
    adjacencyList[node.id] = [];
  });

  connections.forEach((connection) => {
    if (adjacencyList[connection.source]) {
      adjacencyList[connection.source].push(connection.target);
    }
  });

  // DFS to detect cycle
  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacencyList[nodeId] || [];
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check for cycles starting from each unvisited node
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        return true;
      }
    }
  }

  return false;
}

export function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateConnectionId(): string {
  return `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function exportWorkflowAsJSON(workflow: {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}) {
  const exportData = {
    version: "1.0",
    workflow,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "workflow.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function calculateWorkflowMetrics(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
) {
  const triggerCount = nodes.filter((n) => n.type === "trigger").length;
  const actionCount = nodes.filter((n) => n.type === "action").length;
  const conditionCount = nodes.filter((n) => n.type === "condition").length;
  const transformCount = nodes.filter((n) => n.type === "transform").length;

  const complexity = connections.length + conditionCount * 2; // Conditions add complexity

  return {
    totalNodes: nodes.length,
    totalConnections: connections.length,
    triggerCount,
    actionCount,
    conditionCount,
    transformCount,
    complexity,
  };
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import WorkflowCanvas from "@/components/workflow/workflow-canvas";
import WorkflowSidebar from "@/components/workflow/workflow-sidebar";
import WorkflowProperties from "@/components/workflow/workflow-properties";
import ExecutionMonitor from "@/components/workflow/execution-monitor";
import { apiRequest } from "@/lib/queryClient";
import type { Workflow, WorkflowNode, WorkflowConnection } from "@shared/schema";

export default function WorkflowBuilder() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("workflow-1");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workflows
  const { data: workflows = [], isLoading: workflowsLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"]
  });

  // Fetch current workflow
  const { data: currentWorkflow, isLoading: workflowLoading } = useQuery<Workflow>({
    queryKey: ["/api/workflows", selectedWorkflowId],
    enabled: !!selectedWorkflowId
  });

  // Fetch integrations
  const { data: integrations = [] } = useQuery({
    queryKey: ["/api/integrations"]
  });

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/templates"]
  });

  // Update workflow mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: async (updates: { nodes?: WorkflowNode[]; connections?: WorkflowConnection[] }) => {
      const response = await apiRequest("PUT", `/api/workflows/${selectedWorkflowId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows", selectedWorkflowId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workflow",
        variant: "destructive"
      });
    }
  });

  // Execute workflow mutation
  const executeWorkflowMutation = useMutation({
    mutationFn: async (data: any = {}) => {
      const response = await apiRequest("POST", `/api/workflows/${selectedWorkflowId}/execute`, { data });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workflow execution started",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workflows", selectedWorkflowId, "executions"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to execute workflow",
        variant: "destructive"
      });
    }
  });

  const handleNodesChange = (nodes: WorkflowNode[]) => {
    if (currentWorkflow) {
      updateWorkflowMutation.mutate({ nodes });
    }
  };

  const handleConnectionsChange = (connections: WorkflowConnection[]) => {
    if (currentWorkflow) {
      updateWorkflowMutation.mutate({ connections });
    }
  };

  const handleSaveWorkflow = () => {
    if (currentWorkflow) {
      updateWorkflowMutation.mutate({
        nodes: currentWorkflow.nodes,
        connections: currentWorkflow.connections
      });
      toast({
        title: "Success",
        description: "Workflow saved successfully",
      });
    }
  };

  const handleTestWorkflow = () => {
    executeWorkflowMutation.mutate({ test: true });
  };

  const handlePublishWorkflow = async () => {
    if (currentWorkflow && currentWorkflow.status !== "active") {
      try {
        await apiRequest("PUT", `/api/workflows/${selectedWorkflowId}`, { status: "active" });
        queryClient.invalidateQueries({ queryKey: ["/api/workflows", selectedWorkflowId] });
        toast({
          title: "Success",
          description: "Workflow published successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to publish workflow",
          variant: "destructive"
        });
      }
    }
  };

  if (workflowsLoading || workflowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  const selectedNode = currentWorkflow?.nodes.find(node => node.id === selectedNodeId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-sitemap text-white text-sm"></i>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">FlowForge</h1>
            </div>
            <nav className="hidden md:flex space-x-6 ml-8">
              <a href="#" className="text-primary font-medium border-b-2 border-primary pb-4">Workflows</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 pb-4">Templates</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 pb-4">Integrations</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 pb-4">Analytics</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Sarah Johnson</span>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">SJ</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Sidebar */}
        <WorkflowSidebar 
          integrations={integrations}
          templates={templates}
          onTemplateSelect={(templateId) => {
            // Handle template selection
            console.log("Template selected:", templateId);
          }}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Workflow Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentWorkflow?.name || "Untitled Workflow"}
                </h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  currentWorkflow?.status === "active" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {currentWorkflow?.status || "Draft"}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleSaveWorkflow}
                  disabled={updateWorkflowMutation.isPending}
                >
                  <i className="fas fa-save mr-2"></i>
                  Save
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleTestWorkflow}
                  disabled={executeWorkflowMutation.isPending}
                >
                  <i className="fas fa-play mr-2"></i>
                  Test Workflow
                </Button>
                <Button 
                  onClick={handlePublishWorkflow}
                  disabled={currentWorkflow?.status === "active"}
                >
                  <i className="fas fa-rocket mr-2"></i>
                  Publish
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-1">
            {/* Canvas */}
            <div className="flex-1">
              {currentWorkflow && (
                <WorkflowCanvas
                  workflow={currentWorkflow}
                  onNodesChange={handleNodesChange}
                  onConnectionsChange={handleConnectionsChange}
                  onNodeSelect={setSelectedNodeId}
                  selectedNodeId={selectedNodeId}
                />
              )}
            </div>

            {/* Properties Panel */}
            <WorkflowProperties
              selectedNode={selectedNode}
              onNodeUpdate={(nodeId, updates) => {
                if (currentWorkflow) {
                  const updatedNodes = currentWorkflow.nodes.map(node =>
                    node.id === nodeId ? { ...node, ...updates } : node
                  );
                  handleNodesChange(updatedNodes);
                }
              }}
            />
          </div>
        </main>
      </div>

      {/* Execution Monitor */}
      <ExecutionMonitor workflowId={selectedWorkflowId} />
    </div>
  );
}

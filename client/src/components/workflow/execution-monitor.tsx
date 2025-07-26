import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import type { WorkflowExecution } from "@shared/schema";

interface ExecutionMonitorProps {
  workflowId: string;
}

export default function ExecutionMonitor({ workflowId }: ExecutionMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: executions = [] } = useQuery<WorkflowExecution[]>({
    queryKey: ["/api/workflows", workflowId, "executions"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700";
      case "running":
        return "bg-blue-50 text-blue-700";
      case "failed":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "fas fa-check-circle text-green-500";
      case "running":
        return "fas fa-spinner fa-spin text-blue-500";
      case "failed":
        return "fas fa-exclamation-circle text-red-500";
      default:
        return "fas fa-clock text-gray-500";
    }
  };

  const formatTime = (date: string | Date) => {
    const now = new Date();
    const execDate = new Date(date);
    const diffMs = now.getTime() - execDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return execDate.toLocaleDateString();
  };

  const successRate = executions.length > 0 
    ? Math.round((executions.filter(e => e.status === "completed").length / executions.length) * 100)
    : 0;

  const avgExecutionTime = executions.length > 0
    ? executions
        .filter(e => e.status === "completed" && e.completedAt)
        .reduce((acc, e) => {
          const duration = new Date(e.completedAt!).getTime() - new Date(e.startedAt).getTime();
          return acc + duration;
        }, 0) / executions.filter(e => e.status === "completed").length / 1000
    : 0;

  // Mock execution logs for display
  const mockLogs = [
    {
      id: "1",
      level: "success",
      message: "Workflow executed successfully",
      detail: "Ticket #12345 escalated to Slack",
      timestamp: new Date(Date.now() - 2 * 60000),
    },
    {
      id: "2", 
      level: "info",
      message: "Processing trigger",
      detail: "New high priority ticket received",
      timestamp: new Date(Date.now() - 5 * 60000),
    },
    {
      id: "3",
      level: "warning",
      message: "Retry attempt",
      detail: "Slack API timeout, retrying...",
      timestamp: new Date(Date.now() - 8 * 60000),
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 w-80 max-h-96 overflow-hidden z-40">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <TrendingUp className="text-primary mr-2 h-4 w-4" />
          Execution Monitor
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="p-4 overflow-y-auto max-h-80">
          <div className="space-y-3 mb-4">
            {mockLogs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start space-x-3 p-3 rounded-lg ${
                  log.level === "success"
                    ? "bg-green-50"
                    : log.level === "warning"
                    ? "bg-yellow-50"
                    : "bg-blue-50"
                }`}
              >
                <div className="w-2 h-2 rounded-full mt-2">
                  <i
                    className={
                      log.level === "success"
                        ? "fas fa-check text-green-500"
                        : log.level === "warning"
                        ? "fas fa-exclamation-triangle text-yellow-500"
                        : "fas fa-info-circle text-blue-500"
                    }
                  ></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{log.message}</p>
                  <p className="text-xs text-gray-500">{log.detail}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(log.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Success rate: {successRate}%</span>
              <span>Avg. execution: {avgExecutionTime.toFixed(1)}s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

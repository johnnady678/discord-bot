import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Shield, ArrowRightLeft, AlertTriangle, Plus } from "lucide-react";
import type { WorkflowNode } from "@shared/schema";

interface WorkflowPropertiesProps {
  selectedNode: WorkflowNode | undefined;
  onNodeUpdate: (nodeId: string, updates: Partial<WorkflowNode>) => void;
}

export default function WorkflowProperties({
  selectedNode,
  onNodeUpdate,
}: WorkflowPropertiesProps) {
  const [localConfig, setLocalConfig] = useState(selectedNode?.data.config || {});

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="text-center text-gray-500 mt-20">
          <i className="fas fa-mouse-pointer text-3xl mb-2"></i>
          <p className="text-sm">Select a node to configure its properties</p>
        </div>
      </div>
    );
  }

  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onNodeUpdate(selectedNode.id, {
      data: { ...selectedNode.data, config: newConfig },
    });
  };

  const handlePrivacyUpdate = (key: string, value: boolean) => {
    const newPrivacy = { ...selectedNode.data.privacy, [key]: value };
    onNodeUpdate(selectedNode.id, {
      data: { ...selectedNode.data, privacy: newPrivacy },
    });
  };

  const handleErrorHandlingUpdate = (key: string, value: any) => {
    const newErrorHandling = { ...selectedNode.data.errorHandling, [key]: value };
    onNodeUpdate(selectedNode.id, {
      data: { ...selectedNode.data, errorHandling: newErrorHandling },
    });
  };

  const handleNameUpdate = (name: string) => {
    onNodeUpdate(selectedNode.id, {
      data: { ...selectedNode.data, label: name },
    });
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case "trigger":
        return "text-blue-600";
      case "condition":
        return "text-yellow-600";
      case "action":
        return "text-green-600";
      case "transform":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case "trigger":
        return "fas fa-play";
      case "condition":
        return "fas fa-code-branch";
      case "action":
        return "fas fa-cog";
      case "transform":
        return "fas fa-exchange-alt";
      default:
        return "fas fa-square";
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
      {/* Node Info */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <i className={`${getNodeTypeIcon(selectedNode.type)} ${getNodeTypeColor(selectedNode.type)} mr-2`}></i>
          <h3 className="text-lg font-semibold text-gray-900">Node Properties</h3>
        </div>
        
        {/* Node Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="node-name">Node Name</Label>
            <Input
              id="node-name"
              value={selectedNode.data.label}
              onChange={(e) => handleNameUpdate(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Type-specific configuration */}
          {selectedNode.type === "action" && selectedNode.data.integration === "slack-1" && (
            <>
              <div>
                <Label htmlFor="slack-channel">Slack Channel</Label>
                <Select
                  value={localConfig.channel || "#urgent-support"}
                  onValueChange={(value) => handleConfigUpdate("channel", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="#urgent-support">#urgent-support</SelectItem>
                    <SelectItem value="#general-support">#general-support</SelectItem>
                    <SelectItem value="#escalations">#escalations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message-template">Message Template</Label>
                <Textarea
                  id="message-template"
                  value={localConfig.template || "🚨 Urgent ticket escalation\nTicket ID: {{ticket.id}}\nCustomer: {{ticket.customer}}\nPriority: {{ticket.priority}}"}
                  onChange={(e) => handleConfigUpdate("template", e.target.value)}
                  className="mt-1 h-24"
                />
              </div>
            </>
          )}

          {selectedNode.type === "condition" && (
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Input
                id="condition"
                value={localConfig.condition || "priority = 'Urgent'"}
                onChange={(e) => handleConfigUpdate("condition", e.target.value)}
                className="mt-1"
                placeholder="e.g., priority = 'High'"
              />
            </div>
          )}

          {selectedNode.type === "trigger" && (
            <div>
              <Label htmlFor="trigger-event">Trigger Event</Label>
              <Select
                value={localConfig.event || "new_ticket"}
                onValueChange={(value) => handleConfigUpdate("event", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_ticket">New Ticket</SelectItem>
                  <SelectItem value="ticket_updated">Ticket Updated</SelectItem>
                  <SelectItem value="ticket_resolved">Ticket Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Privacy Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <Shield className="text-primary mr-2 h-4 w-4" />
          Privacy Controls
        </h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mask-emails"
              checked={selectedNode.data.privacy?.maskEmails || false}
              onCheckedChange={(checked) => handlePrivacyUpdate("maskEmails", !!checked)}
            />
            <Label htmlFor="mask-emails" className="text-sm">
              Mask customer emails
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="encrypt-data"
              checked={selectedNode.data.privacy?.encryptData || false}
              onCheckedChange={(checked) => handlePrivacyUpdate("encryptData", !!checked)}
            />
            <Label htmlFor="encrypt-data" className="text-sm">
              Encrypt sensitive data
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="log-access"
              checked={selectedNode.data.privacy?.logAccess || false}
              onCheckedChange={(checked) => handlePrivacyUpdate("logAccess", !!checked)}
            />
            <Label htmlFor="log-access" className="text-sm">
              Log data access
            </Label>
          </div>
        </div>
      </div>

      {/* Data Mapping */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <ArrowRightLeft className="text-orange-500 mr-2 h-4 w-4" />
          Data Mapping
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">ticket.id</span>
            <i className="fas fa-arrow-right text-gray-400"></i>
            <span className="text-sm text-gray-900">{"{{ticket_id}}"}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">ticket.customer</span>
            <i className="fas fa-arrow-right text-gray-400"></i>
            <span className="text-sm text-gray-900">{"{{customer}}"}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">ticket.priority</span>
            <i className="fas fa-arrow-right text-gray-400"></i>
            <span className="text-sm text-gray-900">{"{{priority}}"}</span>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="mr-1 h-3 w-3" />
            Add Mapping
          </Button>
        </div>
      </div>

      {/* Error Handling */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <AlertTriangle className="text-yellow-500 mr-2 h-4 w-4" />
          Error Handling
        </h4>
        <div className="space-y-3">
          <div>
            <Label htmlFor="retry-attempts" className="text-sm">
              Retry attempts
            </Label>
            <Select
              value={String(selectedNode.data.errorHandling?.retries || 3)}
              onValueChange={(value) => handleErrorHandlingUpdate("retries", parseInt(value))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="on-failure" className="text-sm">
              On failure
            </Label>
            <Select
              value={selectedNode.data.errorHandling?.onFailure || "continue"}
              onValueChange={(value) => handleErrorHandlingUpdate("onFailure", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continue">Continue workflow</SelectItem>
                <SelectItem value="stop">Stop workflow</SelectItem>
                <SelectItem value="notify">Send notification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

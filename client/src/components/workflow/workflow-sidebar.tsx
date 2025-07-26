import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Integration, WorkflowTemplate } from "@shared/schema";

interface WorkflowSidebarProps {
  integrations: Integration[];
  templates: WorkflowTemplate[];
  onTemplateSelect: (templateId: string) => void;
}

export default function WorkflowSidebar({
  integrations,
  templates,
  onTemplateSelect,
}: WorkflowSidebarProps) {
  const handleDragStart = (
    event: React.DragEvent,
    type: string,
    label: string,
    integration?: string
  ) => {
    const dragData = {
      type,
      label,
      integration,
    };
    event.dataTransfer.setData("application/json", JSON.stringify(dragData));
  };

  const actionTypes = [
    { type: "trigger", label: "Trigger", icon: "fas fa-play", color: "blue" },
    { type: "condition", label: "Condition", icon: "fas fa-code-branch", color: "yellow" },
    { type: "transform", label: "Transform Data", icon: "fas fa-exchange-alt", color: "orange" },
    { type: "action", label: "Action", icon: "fas fa-cog", color: "purple" },
  ];

  const getStatusIndicator = (connected: boolean) => (
    <div
      className={`w-2 h-2 rounded-full ${
        connected ? "bg-green-500" : "bg-yellow-500"
      }`}
      title={connected ? "Connected" : "Setup required"}
    />
  );

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <ScrollArea className="flex-1">
        {/* Integrations Section */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Available Integrations
          </h2>
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center p-3 bg-gray-50 rounded-lg cursor-grab hover:bg-gray-100 transition-colors"
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, "action", integration.name, integration.id)
                }
              >
                <div
                  className={`w-8 h-8 bg-${integration.color}-100 rounded-lg flex items-center justify-center mr-3`}
                >
                  <i className={`${integration.icon} text-${integration.color}-600`}></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {integration.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {integration.type === "zendesk" && "Customer support"}
                    {integration.type === "slack" && "Team communication"}
                    {integration.type === "gmail" && "Email service"}
                    {integration.type === "trello" && "Project management"}
                  </p>
                </div>
                {getStatusIndicator(integration.connected)}
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Actions */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Workflow Actions
          </h2>
          <div className="space-y-2">
            {actionTypes.map((action) => (
              <div
                key={action.type}
                className={`flex items-center p-2 bg-${action.color}-50 rounded-lg cursor-grab hover:bg-${action.color}-100 transition-colors`}
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, action.type, action.label)
                }
              >
                <i className={`${action.icon} text-${action.color}-600 mr-3`}></i>
                <span className="text-sm font-medium text-gray-900">
                  {action.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Templates
          </h2>
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-3 border border-gray-200 rounded-lg hover:border-primary cursor-pointer transition-colors"
                onClick={() => onTemplateSelect(template.id)}
              >
                <h3 className="text-sm font-medium text-gray-900">
                  {template.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {template.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}

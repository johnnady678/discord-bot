import { memo } from "react";
import { Handle, Position } from "reactflow";

interface WorkflowNodeProps {
  data: {
    label: string;
    nodeType: string;
    config?: Record<string, any>;
    integration?: string;
    isSelected?: boolean;
  };
  selected?: boolean;
}

const WorkflowNode = memo(({ data, selected }: WorkflowNodeProps) => {
  const getNodeColor = (type: string) => {
    switch (type) {
      case "trigger":
        return "bg-blue-500 text-white";
      case "condition":
        return "bg-yellow-500 text-white";
      case "action":
        return "bg-green-500 text-white";
      case "transform":
        return "bg-orange-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getNodeIcon = (type: string) => {
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

  const getIntegrationIcon = (integration?: string) => {
    switch (integration) {
      case "slack-1":
        return "fab fa-slack";
      case "zendesk-1":
        return "fas fa-headset";
      case "gmail-1":
        return "far fa-envelope";
      case "trello-1":
        return "fab fa-trello";
      default:
        return getNodeIcon(data.nodeType);
    }
  };

  const getConfigText = () => {
    if (data.nodeType === "condition" && data.config?.condition) {
      return data.config.condition;
    }
    if (data.nodeType === "action" && data.config?.channel) {
      return data.config.channel;
    }
    if (data.nodeType === "trigger" && data.config?.priority) {
      return `Priority: ${data.config.priority}`;
    }
    return "";
  };

  return (
    <div
      className={`
        relative rounded-lg p-4 shadow-lg min-w-[160px] workflow-node
        ${getNodeColor(data.nodeType)}
        ${selected ? "ring-4 ring-blue-200" : ""}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white !border-2 !border-current"
      />
      
      <div className="flex items-center mb-2">
        <i className={`${getIntegrationIcon(data.integration)} mr-2`}></i>
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      
      {getConfigText() && (
        <div className="text-xs opacity-90">{getConfigText()}</div>
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-white !border-2 !border-current"
      />
    </div>
  );
});

WorkflowNode.displayName = "WorkflowNode";

export default WorkflowNode;

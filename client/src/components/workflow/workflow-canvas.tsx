import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import WorkflowNode from "./workflow-node";
import type { Workflow, WorkflowNode as WFNode, WorkflowConnection } from "@shared/schema";

interface WorkflowCanvasProps {
  workflow: Workflow;
  onNodesChange: (nodes: WFNode[]) => void;
  onConnectionsChange: (connections: WorkflowConnection[]) => void;
  onNodeSelect: (nodeId: string | null) => void;
  selectedNodeId: string | null;
}

const nodeTypes = {
  custom: WorkflowNode,
};

export default function WorkflowCanvas({
  workflow,
  onNodesChange,
  onConnectionsChange,
  onNodeSelect,
  selectedNodeId,
}: WorkflowCanvasProps) {
  // Convert workflow nodes to ReactFlow nodes
  const initialNodes: Node[] = useMemo(() => {
    return workflow.nodes.map((node) => ({
      id: node.id,
      type: "custom",
      position: node.position,
      data: {
        ...node.data,
        nodeType: node.type,
        isSelected: node.id === selectedNodeId,
      },
      selected: node.id === selectedNodeId,
    }));
  }, [workflow.nodes, selectedNodeId]);

  // Convert workflow connections to ReactFlow edges
  const initialEdges: Edge[] = useMemo(() => {
    return workflow.connections.map((connection) => ({
      id: connection.id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: "smoothstep",
      animated: true,
    }));
  }, [workflow.connections]);

  const [nodes, setNodes, onNodesChangeHandler] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeHandler] = useEdgesState(initialEdges);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = addEdge(params, edges);
      setEdges(newEdge);
      
      // Convert back to workflow connections
      const newConnections: WorkflowConnection[] = newEdge.map((edge) => ({
        id: edge.id,
        source: edge.source!,
        target: edge.target!,
        sourceHandle: edge.sourceHandle || undefined,
        targetHandle: edge.targetHandle || undefined,
      }));
      
      onConnectionsChange(newConnections);
    },
    [edges, setEdges, onConnectionsChange]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  // Handle node position changes
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeHandler(changes);
      
      // Update workflow nodes with new positions
      const updatedNodes: WFNode[] = nodes.map((node) => {
        const workflowNode = workflow.nodes.find((wfNode) => wfNode.id === node.id);
        if (workflowNode) {
          return {
            ...workflowNode,
            position: node.position,
          };
        }
        return workflowNode!;
      });
      
      onNodesChange(updatedNodes);
    },
    [nodes, workflow.nodes, onNodesChange, onNodesChangeHandler]
  );

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeHandler(changes);
      
      // Convert edges to workflow connections
      const updatedConnections: WorkflowConnection[] = edges.map((edge) => ({
        id: edge.id,
        source: edge.source!,
        target: edge.target!,
        sourceHandle: edge.sourceHandle || undefined,
        targetHandle: edge.targetHandle || undefined,
      }));
      
      onConnectionsChange(updatedConnections);
    },
    [edges, onConnectionsChange, onEdgesChangeHandler]
  );

  // Handle canvas click (deselect nodes)
  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  // Handle drop from sidebar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const data = event.dataTransfer.getData("application/json");
      
      if (!data) return;
      
      try {
        const dragData = JSON.parse(data);
        const position = {
          x: event.clientX - reactFlowBounds.left - 80,
          y: event.clientY - reactFlowBounds.top - 40,
        };
        
        const newNode: WFNode = {
          id: `node-${Date.now()}`,
          type: dragData.type || "action",
          position,
          data: {
            label: dragData.label || "New Node",
            config: {},
            integration: dragData.integration,
          },
        };
        
        const updatedNodes = [...workflow.nodes, newNode];
        onNodesChange(updatedNodes);
      } catch (error) {
        console.error("Failed to parse drag data:", error);
      }
    },
    [workflow.nodes, onNodesChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div className="flex-1 h-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data?.nodeType) {
              case "trigger":
                return "#3b82f6";
              case "condition":
                return "#f59e0b";
              case "action":
                return "#10b981";
              case "transform":
                return "#f97316";
              default:
                return "#6b7280";
            }
          }}
          className="!bg-white !border-gray-300"
        />
      </ReactFlow>
      
      {workflow.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-400">
            <i className="fas fa-mouse-pointer text-3xl mb-2"></i>
            <p className="text-sm">Drag integrations and actions here to build your workflow</p>
          </div>
        </div>
      )}
    </div>
  );
}

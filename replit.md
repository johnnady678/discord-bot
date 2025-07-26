# FlowForge Workflow Builder

## Overview

FlowForge is a visual workflow automation platform that allows users to create, manage, and execute automated workflows through a drag-and-drop interface. The application enables users to connect various integrations (like Slack, Zendesk, Gmail, Trello) and build complex automation workflows with triggers, conditions, and actions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state, React state for local UI state
- **Routing**: Wouter for lightweight client-side routing
- **Flow Editor**: ReactFlow for the visual workflow canvas

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-based sessions with connect-pg-simple

### Data Storage Solutions
- **Primary Database**: PostgreSQL using Drizzle ORM
- **Schema**: Strongly typed with Drizzle-Zod integration
- **Migrations**: Managed through Drizzle Kit
- **In-Memory Fallback**: MemStorage class for development/testing

## Key Components

### Core Data Models
1. **Workflows**: Main workflow definitions with nodes and connections
2. **Workflow Executions**: Runtime execution tracking and logging
3. **Integrations**: Third-party service connections (Slack, Zendesk, etc.)
4. **Workflow Templates**: Pre-built workflow blueprints
5. **Workflow Nodes**: Individual workflow steps (triggers, actions, conditions)
6. **Workflow Connections**: Links between workflow nodes

### Frontend Components
- **WorkflowCanvas**: ReactFlow-based visual editor for building workflows
- **WorkflowSidebar**: Component palette and integration browser
- **WorkflowProperties**: Node configuration panel
- **ExecutionMonitor**: Real-time workflow execution tracking
- **WorkflowNode**: Custom node components for the visual editor

### API Structure
- **REST Endpoints**: CRUD operations for workflows, executions, integrations, and templates
- **Request Validation**: Zod schemas for type-safe API validation
- **Error Handling**: Centralized error handling with proper HTTP status codes

## Data Flow

1. **Workflow Creation**: Users drag components from sidebar to canvas, creating nodes and connections
2. **Configuration**: Node properties are configured through the properties panel
3. **Persistence**: Workflow definitions are stored as JSON in PostgreSQL
4. **Execution**: Workflows are triggered and executed with real-time monitoring
5. **Logging**: Execution results and logs are stored for debugging and analytics

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL provider
- **Connection**: Uses `@neondatabase/serverless` driver
- **Environment**: Requires `DATABASE_URL` environment variable

### UI Framework
- **Radix UI**: Comprehensive component primitives
- **Tailwind CSS**: Utility-first styling framework
- **shadcn/ui**: Pre-built component library

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **ESM**: Modern module system throughout
- **Vite**: Fast development server and build tool

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds the React app to `dist/public`
2. **Backend**: ESBuild bundles the Express server to `dist/index.js`
3. **Database**: Drizzle migrations are applied via `db:push`

### Environment Setup
- **Development**: Uses `tsx` for TypeScript execution with hot reload
- **Production**: Compiled JavaScript with Node.js
- **Database**: PostgreSQL connection via environment variable

### Replit Integration
- Custom Vite plugins for Replit development environment
- Runtime error modal for debugging
- Cartographer plugin for enhanced development experience

The architecture follows a modern full-stack pattern with strong typing, component reusability, and clear separation of concerns between the visual workflow editor, data persistence, and execution engine.
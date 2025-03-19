# Workflow Editor

The Workflow Editor is a Next.js-based application designed to help you quickly create, manage, and visualize workflows. Built with [React Flow Components](https://reactflow.dev/components) and styled using [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/), this project provides a highly customizable foundation for building and extending workflow editors.

## Table of Contents

- [Getting Started](#getting-started)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [What's Inside](#whats-inside)
- [Usage](#usage)
- [Working with Custom Nodes](#working-with-custom-nodes)
- [Contact Us](#contact-us)

## Getting Started

To get started, follow these steps:

1. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

2. **Run the development server**:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

3. Open your browser and navigate to `http://localhost:3000`.

## Tech Stack

- **React Flow Components**: The project uses [React Flow Components](https://reactflow.dev/components) to build nodes. These components are designed to help you quickly get up to speed on projects.

- **shadcn CLI**: The project uses the [shadcn CLI](https://ui.shadcn.com/docs/cli) to manage UI components. This tool builds on top of [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) components, making it easy to add and customize UI elements.

- **State Management with Zustand**: The application uses Zustand for state management, providing a simple and efficient way to manage the state of nodes, edges, and other workflow-related data.

## Features

- **Automatic Layouting**: Utilizes the [ELKjs](https://github.com/kieler/elkjs) layout engine to automatically arrange nodes and edges.
- **Drag-and-Drop Sidebar**: Add and arrange nodes using a drag-and-drop mechanism.
- **Customizable Components**: Uses React Flow Components and the shadcn library to create highly-customizable nodes and edges.
- **Dark Mode**: Toggles between light and dark themes, managed through the Zustand store.
- **Runner Functionality**: Executes and monitors nodes sequentially with a workflow runner.

## What's Inside?

Here’s a comprehensive overview of the src folder structure and its contents:

- **`app`**: This directory contains the main application layout and routing logic. It’s where the Next.js pages and layouts are defined.

- **`components`**: This is where all the components live.

  - `ui`: Shadcn components are stored under this folder.
  - All other custom components (including nodes, edges, and other UI elements) are stored elsewhere. The `workflow` component is the core of the application, powering all the nodes and edges you see.

- **`data`**: This folder contains data-related files, such as:

  - `workflow-data.ts`, which defines the initial nodes and edges for the workflow. You can modify this file to preload your workflow with custom nodes and connections.

- **`hooks`**: Custom React hooks are stored here.

  - `use-workflow-runner.tsx` provides a basic implementation of a workflow runner. It is a great starting point for building your own workflow execution logic.

- **`store`**: This folder contains the Zustand store for managing application state. Key files include:
  - `layout.ts`: Handles the auto-layout functionality for the application.
  - `app-store.ts`: Manages the state of the workflow builder, including nodes, edges, layout, color mode, and potential connections. It also provides actions for manipulating these states and handling events like node dragging and connecting.

## Adding New React Flow Components

Find a component you like and run the command to add it to your project.

```bash
npx shadcn@latest add https://ui.reactflow.dev/component-name
```

- This command copies the component code inside your components folder.
- It automatically installs all necessary dependencies.
- It utilizes previously added and even modified components or asks you if you’d like to overwrite them.
- It uses your existing Tailwind configuration.
- The components are not black-boxes and can be modified and extended to fit your needs.

# How are some of these features implemented?

## Drag-and-Drop Sidebar

To achieve a good user experience for dragging and dropping nodes we implemented following features:

- **Highlighting Connection Points:** As a user drags a node from the sidebar and moves into the vicinity of either a handle without a connected edge or an edge button, the '+' buttons light up if a connection is possible at that point.

- **Simplified Node Insertion:** When a node is dropped onto a highlighted potential connection point, the system automatically inserts the new node between the existing nodes or connects it to the free handle. This involves:

  - Removing the original edge (if inserting between two nodes).
  - Creating new edges to connect the new node to the existing nodes.

### How it Works

1.  **Connection Site Updates:** The `connectionSites` Map is dynamically updated by the `EdgeButton` and `ConnectionIndicator` components. These components, rendered for each edge and node handle respectively, use a `useEffect` hook to:

    - **Add Connection Sites:** When the component mounts (or when relevant props change), a new entry is added to the `connectionSites` Map, representing a potential connection point. This entry includes the position, source/target information (node and handle IDs), and a unique ID.
    - **Remove Connection Sites:** When the component unmounts, the corresponding entry is removed from the `connectionSites` Map, ensuring that only valid connection points are considered.

2.  **`checkForPotentialConnection` Action:** This action is triggered when a node is dragged from the sidebar (see `app-sidebar.tsx`) It performs the following steps:

    - **Query Connection Sites:** It iterates over the `connectionSites` Map to find the closest connection point to the dragged node's current position.
    - **Calculate Distance:** It calculates the distance between the dragged node's position and each connection site's position.
    - **Determine Potential Connection:** The closest connection site within a defined radius (150px in this case) is considered the `potentialConnection`. The `type` of the connection site (source or target) is also considered, allowing for filtering of compatible connection points.

3.  **`addNodeInBetween` Action:** This action is responsible for inserting a new node at the `potentialConnection`. It performs the following steps:

    - Creates a new node of the specified type at the `potentialConnection`'s position.
    - Removes the existing edge (if applicable).
    - Creates new edges to connect the new node to the source and target nodes, using the appropriate handles.

4.  **`resetPotentialConnection` Action:** This action clears the `potentialConnection` state, removing the visual highlight from the connection point. It's called when a drag operation ends.

Here's a concise documentation of how `nodesConfig` serves as a powerful abstraction layer:

## Extended Nodes Config

The `nodesConfig` object serves as a single source of truth on what node types are available throughout the application. It serves as a precursor for the `nodeTypes` passed to React Flow but also holds information on the icons to be used and especially handle positions, as they are kept consistent in between instances of each custom node.

```typescript
const nodesConfig: Record<AppNodeType, NodeConfig> = {
  'transform-node': {
    id: 'transform-node',
    title: 'Transform Node',
    handles: [
      {
        type: 'source',
        position: Position.Bottom,
        x: NODE_SIZE.width * 0.5,
        y: NODE_SIZE.height,
      },
      {
        type: 'target',
        position: Position.Top,
        x: NODE_SIZE.width * 0.5,
        y: 0,
      },
    ],
    icon: 'Spline',
    component: CustomNode,
  },
  // ... other node configurations
};
```

### What this approach simplifies

1. **Adding nodes through the sidebar and context menu**: We have easy access to all available node types and we can add new nodes independantely from the sidebar and the context menu

2. **Providing abstraction for the custom nodes implementations**: We took a very extreme approach by having a single custom node component. In real-world applications this might not be applicable but it showcases a way to extract shared functionality across different node types.

3. **Layouting nodes**: Because we don't have to wait until the nodes are mounted, measured and handle positions determined, we can run layouting algorithms right after adding new nodes.

## State Management

By implementing our own [Zustand](https://github.com/pmndrs/zustand) application store, we were able to streamline state updates and accesses across the project. Additionally, we were able to prevent conflicts that might arise when mixing your own update functions with React Flows helper functions (like `setNodes` from `useReactFlow`). If you are interested in more information about the ins and outs of state management in React Flow [head over to our website](https://reactflow.dev/learn/advanced-use/state-management).

## Contact Us

We’re here to help! If you have any questions, feedback, or just want to share your projects with us, feel free to reach out:

- **Contact Form**: Use the contact form on our [website](https://xyflow.com/contact).
- **Email**: Drop us an email at [info@xyflow.com](mailto:info@xyflow.com).
- **Discord**: Join our [Discord server](https://discord.com/invite/RVmnytFmGW) to connect with the community and get support.

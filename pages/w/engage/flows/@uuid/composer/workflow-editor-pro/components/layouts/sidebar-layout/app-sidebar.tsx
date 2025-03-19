'use client';

import { useState, useCallback, type ComponentProps, useRef } from 'react';
import { Command, GripVertical, Plus } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from '../../ui/sidebar.jsx';
import { SettingsDialog } from '../../settings-dialog.jsx';
import nodesConfig, {
  type AppNode,
  createNodeByType,
  type NodeConfig,
} from '../../nodes/index.jsx';
import { cn } from '../../../lib/utils.js';
import { useAppStore } from '../../../store/index.jsx';
import { useShallow } from 'zustand/react/shallow';
import type { AppStore } from '../../../store/app-store.js';
import { iconMapping } from '@/pages/w/engage/flows/@uuid/composer/workflow-editor-pro/data/icon-mapping.js';

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="py-0">
        <div className="flex gap-2 px-1 h-14 items-center ">
          <div className="flex aspect-square size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Command className="size-3" />
          </div>
          <span className="truncate font-semibold">Workflow Editor</span>
        </div>
        <SidebarMenu>
          {Object.values(nodesConfig).map((item) => (
            <DraggableItem key={item.title} {...item} />
          ))}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <SettingsDialog />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

const selector = (state: AppStore) => ({
  addNode: state.addNode,
  checkForPotentialConnection: state.checkForPotentialConnection,
  resetPotentialConnection: state.resetPotentialConnection,
});

function DraggableItem(props: NodeConfig) {
  const { screenToFlowPosition } = useReactFlow();
  const { addNode, checkForPotentialConnection, resetPotentialConnection } =
    useAppStore(useShallow(selector));
  const [isDragging, setIsDragging] = useState(false);

  const onClick = useCallback(() => {
    const newNode: AppNode = createNodeByType({
      type: props.id,
      position: screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }),
    });

    addNode(newNode);
  }, [props, addNode, screenToFlowPosition]);

  const onDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('application/reactflow', JSON.stringify(props));
      setIsDragging(true);
    },
    [props]
  );

  const lastDragPos = useRef({ x: 0, y: 0 });
  const onDrag = useCallback(
    (e: React.DragEvent) => {
      const lastPos = lastDragPos.current;
      // we need to keep track of the last drag position to avoid unnecessary calculations
      // the drag api constantly fires events even if the mouse is not moving
      if (lastPos.x === e.clientX && lastPos.y === e.clientY) {
        return;
      }
      lastDragPos.current = { x: e.clientX, y: e.clientY };

      const flowPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      const handles = nodesConfig[props.id].handles.map(
        (handle) => handle.type
      );
      const handleType = handles.reduce((acc, type) => {
        if (acc === 'none') return type;
        if (acc !== 'both' && acc !== type) return 'both';
        return acc;
      }, 'none' as 'both' | 'none' | 'source' | 'target');

      if (handleType === 'none') return;

      checkForPotentialConnection(flowPosition, {
        type: handleType === 'both' ? undefined : handleType,
      });
    },
    [screenToFlowPosition, checkForPotentialConnection, props.id]
  );

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
    resetPotentialConnection();
  }, [resetPotentialConnection]);

  const IconComponent = props?.icon ? iconMapping[props.icon as string] : undefined;

  return (
    <SidebarMenuItem
      className={cn(
        'relative border-2 active:scale-[.99] rounded-md',
        isDragging ? 'border-green-500' : 'border-gray-100'
      )}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onClick={onClick}
      draggable
      key={props.title}
    >
      {isDragging && (
        <span
          role="presentation"
          className="absolute -top-3 -right-3 rounded-md border-2 border-green-500 bg-card"
        >
          <Plus className="size-4" />
        </span>
      )}
      <SidebarMenuButton className="bg-card cursor-grab active:cursor-grabbing">
        {IconComponent ? <IconComponent aria-label={props?.icon as string} /> : null}
        <span>{props.title}</span>
        <GripVertical className="ml-auto" />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

'use client';

import type { ReactNode } from 'react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './ui/context-menu.jsx';
import nodesConfig, { type AppNodeType } from './nodes/index.jsx';
import { iconMapping } from '../data/icon-mapping.js';
import { useClientPosition } from '../hooks/use-client-position.jsx';
import { useAppStore } from '../store/index.jsx';

export default function AppContextMenu({ children }: { children: ReactNode }) {
  const [position, setPosition] = useClientPosition();
  const addNodeByType = useAppStore((s) => s.addNodeByType);

  const onItemClick = (nodeType: AppNodeType) => {
    if (!position) {
      return;
    }

    addNodeByType(nodeType, position);
  };

  return (
    <div className="h-full w-full bg-gray-100" onContextMenu={setPosition}>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          {Object.values(nodesConfig).map((item) => {
            const IconComponent = item?.icon
              ? iconMapping[item.icon as string]
              : undefined;
            return (
              // biome-ignore lint/a11y/useValidAnchor: <explanation>
              <a key={item.title} onClick={() => onItemClick(item.id)}>
                <ContextMenuItem className="flex items-center space-x-2">
                  {IconComponent ? (
                    <IconComponent aria-label={item?.icon as string} />
                  ) : null}
                  <span>New {item.title}</span>
                </ContextMenuItem>
              </a>
            );
          })}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.jsx';
import nodesConfig, { type AppNodeType, type NodeConfig } from './nodes/index.jsx';
import { iconMapping } from '../data/icon-mapping.js';

export function AppDropdownMenu({
  onAddNode,
  filterNodes = () => true,
}: {
  onAddNode: (type: AppNodeType) => void;
  filterNodes?: (node: NodeConfig) => boolean;
}) {
  return (
    <DropdownMenu open>
      <DropdownMenuTrigger />
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Nodes</DropdownMenuLabel>
        {Object.values(nodesConfig)
          .filter(filterNodes)
          .map((item) => {
            const IconComponent = item?.icon
              ? iconMapping[item.icon as string]
              : undefined;
            return (
              // biome-ignore lint/a11y/useValidAnchor: <explanation>
              <a key={item.title} onClick={() => onAddNode(item.id)}>
                <DropdownMenuItem className="flex items-center space-x-2">
                  {IconComponent ? (
                    <IconComponent aria-label={item?.icon as string} />
                  ) : null}
                  <span>New {item.title}</span>
                </DropdownMenuItem>
              </a>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

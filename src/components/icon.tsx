import * as Icons from "lucide-react";

export function ToolIcon({
  name,
  size = 20,
  strokeWidth = 1.8,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
}) {
  const iconMap = Icons as unknown as Record<
    string,
    React.ComponentType<{ size?: number; strokeWidth?: number }>
  >;
  const Icon = iconMap[name] ?? Icons.Wrench;
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

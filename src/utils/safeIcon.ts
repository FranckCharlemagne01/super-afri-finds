import type { ElementType } from 'react';
import { AlertCircle } from 'lucide-react';

type IconMapEntry = {
  icon?: ElementType | null;
  [key: string]: unknown;
};

type IconMap<T extends IconMapEntry = IconMapEntry> = Record<string, T | undefined>;

export const DefaultIcon: ElementType = AlertCircle;

export function safeIcon<T extends IconMapEntry>(
  map: Record<string, T | undefined> | null | undefined,
  key: string | null | undefined,
  source = 'safeIcon',
): ElementType {
  const resolvedEntry = key ? map?.[key] : undefined;
  const resolvedIcon = resolvedEntry?.icon ?? DefaultIcon;

  if (!resolvedEntry?.icon) {
    console.log('DEBUG ICON FINAL:', {
      source,
      key,
      resolvedEntry,
      fallbackIcon: 'AlertCircle',
    });
  }

  return resolvedIcon;
}

export function safeMappedConfig<T extends IconMapEntry>(
  map: Record<string, Partial<T> | undefined> | null | undefined,
  key: string | null | undefined,
  fallback: T,
  source = 'safeMappedConfig',
): T & { icon: ElementType } {
  const resolvedEntry = key ? map?.[key] : undefined;

  return {
    ...fallback,
    ...(resolvedEntry ?? {}),
    icon: safeIcon(map as Record<string, IconMapEntry | undefined>, key, source),
  } as T & { icon: ElementType };
}
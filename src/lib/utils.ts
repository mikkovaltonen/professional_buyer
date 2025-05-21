import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTruncatedListString(
  items: string[],
  itemTypeNameSingular: string,
  itemTypeNamePlural: string,
  maxItemsToShow: number = 3,
  joinSeparator: string = ", "
): string {
  if (!items || items.length === 0) {
    return "";
  }

  if (items.length <= maxItemsToShow) {
    return items.join(joinSeparator);
  }

  const firstItems = items.slice(0, maxItemsToShow).join(joinSeparator);
  const remainingCount = items.length - maxItemsToShow;
  const itemTypeName = remainingCount === 1 ? itemTypeNameSingular : itemTypeNamePlural;

  return `${firstItems}... ja ${remainingCount} muuta ${itemTypeName}`;
}

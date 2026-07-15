export type DragListItemBounds = {
  id: string;
  top: number;
  height: number;
};

export const sameOrder = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

export function getReorderedIdsForDrag(
  currentOrder: string[],
  draggedId: string,
  draggedCenterY: number,
  itemBounds: DragListItemBounds[],
) {
  const orderWithoutDragged = currentOrder.filter((id) => id !== draggedId);
  let insertionIndex = orderWithoutDragged.length;

  for (let index = 0; index < orderWithoutDragged.length; index += 1) {
    const bounds = itemBounds.find((item) => item.id === orderWithoutDragged[index]);
    if (!bounds) continue;

    if (draggedCenterY < bounds.top + bounds.height / 2) {
      insertionIndex = index;
      break;
    }
  }

  const nextOrder = [...orderWithoutDragged];
  nextOrder.splice(insertionIndex, 0, draggedId);
  return nextOrder;
}
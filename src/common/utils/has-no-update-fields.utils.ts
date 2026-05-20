export function hasNoUpdateFields(updateFields: object): boolean {
  return (
    Object.keys(updateFields).length === 0 ||
    Object.values(updateFields).filter(Boolean).length === 0
  );
}

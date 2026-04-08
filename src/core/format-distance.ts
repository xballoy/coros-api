export const formatDistance = (distanceInCm: number): string => {
  const kilometers = distanceInCm / 100000;
  const rounded = Number.isInteger(kilometers) ? kilometers.toFixed(0) : kilometers.toFixed(1);
  return `${rounded} km`;
};

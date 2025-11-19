// Lightweight data service that mutates the slices array; keeps responsibilities separate
export function addSlice(slices, label, value, color) {
  slices.push({ label, value: Number(value), color });
}

export function removeSlice(slices, index) {
  if (index >= 0 && index < slices.length) slices.splice(index, 1);
}

export function updateSliceValue(slices, index, value) {
  if (index >= 0 && index < slices.length) slices[index].value = Number(value);
}

export function totalValue(slices) {
  return slices.reduce((acc, s) => acc + s.value, 0);
}

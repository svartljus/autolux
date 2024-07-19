export function hex2(val) {
  const t = Math.round(val).toString(16);
  return t.length < 2 ? "0" + t : t;
}

export function hexColorFromArray(color) {
  return "#" + hex2(color[0]) + hex2(color[1]) + hex2(color[2]);
}

export function fixColorDisplayGamma(color) {
  if (!color) {
    return [0, 0, 0]
  }

  return [
    Math.min(255, color[0] * 3),
    Math.min(255, color[1] * 3),
    Math.min(255, color[2] * 3),
  ];
}

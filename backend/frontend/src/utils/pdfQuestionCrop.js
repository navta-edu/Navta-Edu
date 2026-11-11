export async function getQuestionCropLayers(pdf) {
  const config = await pdf.getOptionalContentConfig();
  const groups = typeof config[Symbol.iterator] === "function"
    ? config
    : Object.entries(config.getGroups() ?? {});

  for (const [id, group] of groups) {
    if (typeof group.name !== "string") continue;
    if (/\bwater\s*marks?\b/i.test(group.name.replace(/[_-]/g, " "))) {
      config.setVisibility(id, false, false);
    }
  }

  return config;
}

export function removeLightGrayWatermark({ data }, threshold = 220) {
  const fadeStart = threshold - 20;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const darkest = Math.min(red, green, blue);
    const lightest = Math.max(red, green, blue);

    // Preserve dark ink and colored details. Feather the transition at the cutoff.
    if (darkest <= fadeStart || lightest - darkest > 12 || darkest === 255) continue;

    const amount = Math.min(1, (darkest - fadeStart) / (threshold - fadeStart));
    data[index] = red + (255 - red) * amount;
    data[index + 1] = green + (255 - green) * amount;
    data[index + 2] = blue + (255 - blue) * amount;
  }
}

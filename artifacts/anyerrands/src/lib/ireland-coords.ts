export type Coords = [number, number];

const TOWN_COORDS: Record<string, Coords> = {
  "nenagh": [52.8647, -8.1985],
  "roscrea": [52.9530, -7.7960],
  "thurles": [52.6810, -7.8030],
  "tipperary": [52.4742, -8.1563],
  "clonmel": [52.3555, -7.7006],
  "borrisokane": [52.9875, -8.1289],
  "portroe": [52.8970, -8.2700],
  "cloughjordan": [52.9369, -8.0275],
  "ballina": [52.8200, -8.4400],
  "killaloe": [52.8040, -8.4430],
  "borrisoleigh": [52.7630, -7.9580],
  "templemore": [52.7953, -7.8350],
  "cashel": [52.5160, -7.8896],
  "cahir": [52.3758, -7.9247],
  "birr": [53.0970, -7.9130],
  "roscrea": [52.9530, -7.7960],
  "limerick": [52.6638, -8.6267],
  "galway": [53.2707, -9.0568],
  "dublin": [53.3498, -6.2603],
  "cork": [51.8985, -8.4756],
  "portumna": [53.0955, -8.2203],
  "lorrha": [53.0620, -8.1590],
  "terryglass": [53.0070, -8.2200],
  "puckaun": [52.9440, -8.2730],
  "silvermines": [52.8190, -8.2350],
  "toomevara": [52.8800, -8.0800],
  "moneygall": [52.8710, -7.9670],
  "shinrone": [52.9460, -7.9540],
};

const COUNTY_FALLBACKS: Record<string, Coords> = {
  "tipperary": [52.6638, -7.9869],
  "offaly": [53.2742, -7.7198],
  "limerick": [52.6638, -8.6267],
  "clare": [52.9045, -8.9813],
  "galway": [53.2707, -9.0568],
  "kilkenny": [52.6541, -7.2448],
};

export function getCoords(location: string): Coords | null {
  const lower = location.toLowerCase();

  for (const [town, coords] of Object.entries(TOWN_COORDS)) {
    if (lower.includes(town)) return coords;
  }

  for (const [county, coords] of Object.entries(COUNTY_FALLBACKS)) {
    if (lower.includes(county)) {
      const jitter: Coords = [
        coords[0] + (Math.random() - 0.5) * 0.08,
        coords[1] + (Math.random() - 0.5) * 0.12,
      ];
      return jitter;
    }
  }

  return null;
}

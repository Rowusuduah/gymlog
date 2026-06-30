// Muscle group metadata. `key` is used throughout exercises + the muscle map.
export const MUSCLES = {
  chest:      { name: "Chest",          region: "front" },
  shoulders:  { name: "Shoulders",      region: "both"  },
  biceps:     { name: "Biceps",         region: "front" },
  triceps:    { name: "Triceps",        region: "back"  },
  forearms:   { name: "Forearms",       region: "both"  },
  abs:        { name: "Abs / Core",     region: "front" },
  obliques:   { name: "Obliques",       region: "front" },
  traps:      { name: "Traps",          region: "back"  },
  lats:       { name: "Lats",           region: "back"  },
  upperback:  { name: "Upper back",     region: "back"  },
  lowerback:  { name: "Lower back",     region: "back"  },
  glutes:     { name: "Glutes",         region: "back"  },
  quads:      { name: "Quads",          region: "front" },
  hamstrings: { name: "Hamstrings",     region: "back"  },
  glutemed:   { name: "Glutes (side)",  region: "back"  },
  adductors:  { name: "Inner thigh",    region: "front" },
  calves:     { name: "Calves",         region: "both"  },
};

// Coarse grouping used for filters + weekly-volume rollups.
export const MUSCLE_GROUPS = {
  Chest:      ["chest"],
  Back:       ["lats", "upperback", "traps", "lowerback"],
  Shoulders:  ["shoulders"],
  Arms:       ["biceps", "triceps", "forearms"],
  Legs:       ["quads", "hamstrings", "glutes", "glutemed", "adductors", "calves"],
  Core:       ["abs", "obliques"],
};

export function groupOf(muscleKey) {
  for (const [g, keys] of Object.entries(MUSCLE_GROUPS)) {
    if (keys.includes(muscleKey)) return g;
  }
  return "Other";
}

export const muscleName = (k) => (MUSCLES[k] ? MUSCLES[k].name : k);

/**
 * Lightweight genre inference for Geetdle songs that arrive without one
 * (e.g. the JioSaavn-crawled catalog). Word-boundary keyword matching over the
 * song title, movie, and singers — the same spirit as the original base tagging,
 * emitting the SAME genre vocabulary so inferred values sit beside tagged ones.
 * Returns "General" when nothing matches.
 *
 * Matching is word-boundary (not substring) so short tokens like "om" or "ram"
 * don't match inside "from"/"program", and JioSaavn's "(From "Movie")" suffix is
 * stripped first. This is a heuristic: a sensible clue, not ground truth.
 */

// Checked in order; first match wins, so specific genres precede Romantic.
const RULES = [
  ["Devotional", ["bhajan", "aarti", "mantra", "chalisa", "shiv", "shiva", "ram", "raam", "siya ram", "jai shri", "jai mata", "jai jai", "krishna", "krsna", "hanuman", "ganesh", "ganpati", "durga", "bhagwan", "ishwar", "waheguru", "satnam", "govind", "radhe", "prabhu", "bhakti", "simran", "gurbani", "shabad", "bhajo", "kirtan"]],
  ["Qawwali/Sufi", ["qawwali", "qawalli", "sufi", "khwaja", "dargah", "maula", "kun faya", "dama dam", "mast qalandar", "bhar do jholi", "tajdar", "chaap tilak", "piya re"]],
  ["Patriotic", ["desh", "bharat", "vande mataram", "hindustan", "watan", "tiranga", "jai hind", "sarfaroshi", "ae watan", "qaum", "shaheed", "border", "fauj"]],
  ["Wedding/Celebration", ["shaadi", "shadi", "dulhan", "dulha", "doli", "mehndi", "mehendi", "sehra", "baraat", "vivah", "sagai", "banno", "bidaai", "bidai", "sangeet", "wedding"]],
  ["Item/Cabaret", ["item", "cabaret", "sheila", "munni", "chikni", "fevicol", "chamma", "beedi", "halkat", "jalebi", "kamariya", "nagada", "babydoll", "baby doll"]],
  ["Dance/Party", ["dance", "party", "naach", "nach", "disco", "beat", "jhoom", "thumka", "dhinka", "dhoom", "nachde", "nachle", "jhoome", "club", "boogie", "shake", "garmi"]],
  ["Rap/Hip-Hop", ["rap", "hip hop", "gully", "apna time", "machayenge"]],
  ["Sad/Emotional", ["bewafa", "judaai", "judai", "gham", "dard", "aansu", "rula", "rote", "tanha", "tanhai", "akela", "intezaar", "intizaar", "khamoshi", "zakhm", "bichhad", "alvida", "channa mereya", "humdard"]],
  ["Classical/Ghazal", ["ghazal", "raag", "thumri", "classical", "ustad", "sitar", "tabla", "bandish", "ghungroo", "ghunghroo"]],
  ["Children", ["lori", "lullaby", "bachpan", "chanda mama", "lakdi ki kaathi", "nani teri"]],
  ["Motivational", ["zindagi", "jeena", "jeene", "sapna", "sapne", "udaan", "himmat", "hausla", "manzil", "chak de", "lakshya", "zinda", "jee le", "roobaroo"]],
  ["Folk/Regional", ["folk", "pind", "gaon", "lavani", "bhangra", "dhol", "banjara", "jugni", "heer", "sohni", "koyal", "panghat"]],
  ["Romantic", ["pyar", "pyaar", "ishq", "love", "mohabbat", "dil", "sanam", "jaaneman", "chahat", "deewana", "deewani", "saathiya", "saajan", "sajna", "humsafar", "haseen", "husn", "nazar", "khwab", "dilbar", "soniye", "sohneya", "rabba", "mahiya", "bahon", "baahon", "ishqaan"]],
];

const strip = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/\(from[^)]*\)/g, " ") // JioSaavn "(From "Movie")" noise
    .replace(/[^a-z0-9\s]/g, " ");

// Precompile one word-boundary regex per genre.
const COMPILED = RULES.map(([genre, kws]) => [
  genre,
  new RegExp(`\\b(${kws.map((k) => k.replace(/\s+/g, "\\s+")).join("|")})\\b`),
]);

export function inferGenre(title, { singers = "", movie = "" } = {}) {
  const hay = `${strip(title)} ${strip(movie)} ${strip(singers)}`;
  for (const [genre, re] of COMPILED) {
    if (re.test(hay)) return genre;
  }
  return "General";
}

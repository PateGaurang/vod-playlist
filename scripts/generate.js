const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const publicDir = path.join(root, "public");

fs.mkdirSync(publicDir, { recursive: true });

function readJSON(filename) {
  const file = path.join(dataDir, filename);

  if (!fs.existsSync(file)) {
    console.error(`Missing file: ${file}`);
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function escape(value = "") {
  return String(value).replace(/"/g, "&quot;");
}

// -------------------------
// MOVIES
// -------------------------

const movies = readJSON("movies.json");

let moviesM3U = "#EXTM3U\n\n";

for (const movie of movies) {
  const genres = (movie.genres || []).join(", ");

  for (const source of movie.sources || []) {
    moviesM3U +=
      `#EXTINF:-1 ` +
      `tvg-id="${escape(movie.id)}" ` +
      `tvg-name="${escape(movie.title)}" ` +
      `tvg-logo="${escape(movie.poster || "")}" ` +
      `group-title="${escape(genres)}"`;
    
    moviesM3U += `,${movie.title}\n`;
    moviesM3U += `${source.url}\n\n`;
  }
}

fs.writeFileSync(
  path.join(publicDir, "movies.m3u"),
  moviesM3U
);

// -------------------------
// SERIES
// -------------------------

const series = readJSON("series.json");

let seriesM3U = "#EXTM3U\n\n";

for (const show of series) {
  for (const season of show.seasons || []) {
    for (const episode of season.episodes || []) {
      for (const source of episode.sources || []) {

        const seasonNumber = String(season.number).padStart(2, "0");
        const episodeNumber = String(episode.number).padStart(2, "0");

        const id =
          `${show.id}-s${seasonNumber}e${episodeNumber}`;

        const name =
          `${show.title} S${seasonNumber}E${episodeNumber} - ${episode.title}`;

        seriesM3U +=
          `#EXTINF:-1 ` +
          `tvg-id="${escape(id)}" ` +
          `tvg-name="${escape(name)}" ` +
          `tvg-logo="${escape(show.poster || "")}" ` +
          `group-title="${escape(show.title)} | Season ${season.number}"`;

        seriesM3U += `,${name}\n`;
        seriesM3U += `${source.url}\n\n`;
      }
    }
  }
}

fs.writeFileSync(
  path.join(publicDir, "series.m3u"),
  seriesM3U
);

console.log("");
console.log("================================");
console.log("VOD PLAYLIST GENERATION COMPLETE");
console.log("================================");
console.log("");
console.log("Generated:");
console.log("  public/movies.m3u");
console.log("  public/series.m3u");
console.log("");
console.log(`Movies: ${movies.length}`);
console.log(`Series: ${series.length}`);
console.log("");

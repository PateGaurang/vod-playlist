const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

function escape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function readJSON(file) {
  return JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, file), "utf8")
  );
}

function moviePlaylist(movies) {
  let output = "#EXTM3U\n\n";

  for (const movie of movies) {
    const genres = (movie.genres || []).join(", ");

    for (const source of movie.sources || []) {
      output += `#EXTINF:-1`;
      output += ` tvg-id="${escape(movie.id)}"`;
      output += ` tvg-name="${escape(movie.title)}"`;
      output += ` tvg-logo="${escape(movie.poster || "")}"`;
      output += ` group-title="${escape(genres)}"`;
      output += ` type="movie"`;
      output += ` year="${escape(movie.year || "")}"`;
      output += ` quality="${escape(source.quality || "")}"`;
      output += `,${movie.title}`;

      output += `\n${source.url}\n\n`;
    }
  }

  return output;
}

function seriesPlaylist(series) {
  let output = "#EXTM3U\n\n";

  for (const show of series) {
    const genres = (show.genres || []).join(", ");

    for (const season of show.seasons || []) {
      for (const episode of season.episodes || []) {
        for (const source of episode.sources || []) {
          const episodeId =
            `${show.id}-s${String(season.number).padStart(2, "0")}` +
            `e${String(episode.number).padStart(2, "0")}`;

          const episodeName =
            `${show.title} S${String(season.number).padStart(2, "0")}` +
            `E${String(episode.number).padStart(2, "0")} - ${episode.title}`;

          output += `#EXTINF:-1`;
          output += ` tvg-id="${escape(episodeId)}"`;
          output += ` tvg-name="${escape(episodeName)}"`;
          output += ` tvg-logo="${escape(show.poster || "")}"`;
          output += ` group-title="${escape(show.title)} | Season ${season.number}"`;
          output += ` type="series"`;
          output += ` series-id="${escape(show.id)}"`;
          output += ` season="${season.number}"`;
          output += ` episode="${episode.number}"`;
          output += ` quality="${escape(source.quality || "")}"`;
          output += `,${episodeName}`;

          output += `\n${source.url}\n\n`;
        }
      }
    }
  }

  return output;
}

const movies = readJSON("movies.json");
const series = readJSON("series.json");

fs.writeFileSync(
  path.join(PUBLIC_DIR, "movies.m3u"),
  moviePlaylist(movies)
);

fs.writeFileSync(
  path.join(PUBLIC_DIR, "series.m3u"),
  seriesPlaylist(series)
);

console.log("Generated:");
console.log("  public/movies.m3u");
console.log("  public/series.m3u");


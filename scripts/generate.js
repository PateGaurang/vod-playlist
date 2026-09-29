const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");
const PUBLIC = path.join(ROOT, "docs");

if (!fs.existsSync(PUBLIC)) {
    fs.mkdirSync(PUBLIC, { recursive: true });
}

function loadJSON(filename) {
    const file = path.join(DATA, filename);
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function clean(value) {
    return String(value ?? "")
        .replace(/[\r\n]/g, " ")
        .trim();
}

function escapeAttribute(value) {
    return clean(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;");
}

function createExtInf(name, group, logo) {
    let attributes = [];

    if (group) {
        attributes.push(`group-title="${escapeAttribute(group)}"`);
    }

    if (logo) {
        attributes.push(`tvg-logo="${escapeAttribute(logo)}"`);
    }

    if (attributes.length > 0) {
        return `#EXTINF:-1 ${attributes.join(" ")},${clean(name)}`;
    }

    return `#EXTINF:-1,${clean(name)}`;
}

function generateMovies() {
    const movies = loadJSON("movies.json");

    let output = "#EXTM3U\n\n";

    let generated = 0;

    for (const movie of movies) {
        if (!movie.sources || !Array.isArray(movie.sources)) {
            continue;
        }

        for (const source of movie.sources) {
            if (!source.url) {
                continue;
            }

            const title = movie.title || "Unknown Movie";

            const group = movie.genres && movie.genres.length
                ? movie.genres.join(", ")
                : "Movies";

            const logo = movie.poster || "";

            let displayName = title;

            if (movie.year) {
                displayName += ` (${movie.year})`;
            }

            if (source.quality) {
                displayName += ` [${source.quality}]`;
            }

            output += createExtInf(
                displayName,
                group,
                logo
            );

            output += `${source.url.trim()}\n\n`;

            generated++;
        }
    }

    fs.writeFileSync(
        path.join(PUBLIC, "movies.m3u"),
        output,
        "utf8"
    );

    console.log(`Generated movies.m3u: ${generated} sources from ${movies.length} movies`);
}

function generateSeries() {
    const series = loadJSON("series.json");

    let output = "#EXTM3U\n\n";

    let generated = 0;

    for (const seriesItem of series) {
        const name = seriesItem.title || "Unknown Series";
        const logo = seriesItem.poster || "";

        if (!Array.isArray(seriesItem.seasons)) {
            continue;
        }

        for (const season of seriesItem.seasons) {
            const seasonNumber = Number(season.number || 1);

            if (!Array.isArray(season.episodes)) {
                continue;
            }

            for (const episode of season.episodes) {
                const episodeNumber = Number(episode.number || 1);
                const episodeTitle = episode.title || "";

                if (!Array.isArray(episode.sources)) {
                    continue;
                }

                for (const source of episode.sources) {
                    if (!source.url) {
                        continue;
                    }

                    let displayName =
                        `${name} S${String(seasonNumber).padStart(2, "0")}E${String(episodeNumber).padStart(2, "0")}`;

                    if (episodeTitle) {
                        displayName += ` - ${episodeTitle}`;
                    }

                    if (source.quality) {
                        displayName += ` [${source.quality}]`;
                    }

                    output += createExtInf(
                        displayName,
                        name,
                        logo
                    );

                    output += `${source.url.trim()}\n\n`;

                    generated++;
                }
            }
        }
    }

    fs.writeFileSync(
        path.join(PUBLIC, "series.m3u"),
        output,
        "utf8"
    );

    console.log(`Generated series.m3u: ${generated} sources from ${series.length} series`);
}

generateMovies();
generateSeries();

console.log("All playlists generated successfully.");

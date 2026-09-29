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

    for (const item of series) {
        if (!item.url) {
            continue;
        }

        const season = Number(item.season || 1);
        const episode = Number(item.episode || 1);

        const name = item.name || "Unknown Series";

        const displayName =
            `${name} S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;

        output += createExtInf(
            displayName,
            name,
            item.logo || ""
        );

        output += `\n${item.url.trim()}\n\n`;
    }

    fs.writeFileSync(
        path.join(PUBLIC, "series.m3u"),
        output,
        "utf8"
    );

    console.log(`Generated series.m3u: ${series.length} entries`);
}

generateMovies();
generateSeries();

console.log("All playlists generated successfully.");

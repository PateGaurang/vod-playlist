const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");
const PUBLIC = path.join(ROOT, "docs");

// Create docs directory if it doesn't exist
fs.mkdirSync(PUBLIC, { recursive: true });

/**
 * Load JSON file
 */
function loadJSON(filename) {
    const file = path.join(DATA, filename);

    if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${file}`);
    }

    const content = fs.readFileSync(file, "utf8");

    try {
        return JSON.parse(content);
    } catch (error) {
        throw new Error(`Invalid JSON in ${filename}: ${error.message}`);
    }
}

/**
 * Clean text without changing URLs unnecessarily
 */
function clean(value) {
    return String(value ?? "")
        .replace(/[\r\n]+/g, " ")
        .trim();
}

/**
 * Escape values used inside M3U attributes.
 *
 * IMPORTANT:
 * Do NOT replace & with &amp;.
 * M3U URLs need the original & characters.
 */
function escapeAttribute(value) {
    return clean(value).replace(/"/g, '\\"');
}

/**
 * Create the #EXTINF line
 */
function createExtInf(name, group, logo) {
    const attributes = [];

    if (group) {
        attributes.push(
            `group-title="${escapeAttribute(group)}"`
        );
    }

    if (logo) {
        attributes.push(
            `tvg-logo="${escapeAttribute(logo)}"`
        );
    }

    if (attributes.length > 0) {
        return `#EXTINF:-1 ${attributes.join(" ")},${clean(name)}`;
    }

    return `#EXTINF:-1,${clean(name)}`;
}

/**
 * Add one M3U item.
 *
 * IMPORTANT:
 * EXTINF and URL are deliberately separate array elements,
 * guaranteeing a newline between them.
 */
function addEntry(lines, name, group, logo, url) {
    const cleanUrl = String(url ?? "").trim();

    if (!cleanUrl) {
        return false;
    }

    lines.push(
        createExtInf(name, group, logo)
    );

    // URL is ALWAYS on its own line
    lines.push(cleanUrl);

    // Blank line between entries
    lines.push("");

    return true;
}

/**
 * Generate movies.m3u
 */
function generateMovies() {
    const movies = loadJSON("movies.json");

    if (!Array.isArray(movies)) {
        throw new Error("movies.json must contain an array");
    }

    const lines = [
        "#EXTM3U",
        ""
    ];

    let generated = 0;

    for (const movie of movies) {
        if (!movie || !Array.isArray(movie.sources)) {
            continue;
        }

        const title =
            clean(movie.title) || "Unknown Movie";

        const group =
            Array.isArray(movie.genres) && movie.genres.length > 0
                ? movie.genres
                    .map(clean)
                    .filter(Boolean)
                    .join(", ")
                : "Movies";

        const logo = clean(movie.poster);

        let baseName = title;

        if (movie.year) {
            baseName += ` (${clean(movie.year)})`;
        }

        for (const source of movie.sources) {
            if (!source || !source.url) {
                continue;
            }

            let displayName = baseName;

            if (source.quality) {
                displayName += ` [${clean(source.quality)}]`;
            }

            const added = addEntry(
                lines,
                displayName,
                group,
                logo,
                source.url
            );

            if (added) {
                generated++;
            }
        }
    }

    const output = lines.join("\n");

    const file = path.join(
        PUBLIC,
        "movies.m3u"
    );

    fs.writeFileSync(
        file,
        output,
        "utf8"
    );

    console.log("");
    console.log("Movies playlist generated");
    console.log("-------------------------");
    console.log(`Movies:  ${movies.length}`);
    console.log(`Sources: ${generated}`);
    console.log(`File:    ${file}`);
}

/**
 * Generate series.m3u
 */
function generateSeries() {
    const series = loadJSON("series.json");

    if (!Array.isArray(series)) {
        throw new Error("series.json must contain an array");
    }

    const lines = [
        "#EXTM3U",
        ""
    ];

    let generated = 0;

    for (const seriesItem of series) {
        if (!seriesItem) {
            continue;
        }

        const name =
            clean(seriesItem.title) || "Unknown Series";

        const logo =
            clean(seriesItem.poster);

        if (!Array.isArray(seriesItem.seasons)) {
            continue;
        }

        for (const season of seriesItem.seasons) {
            if (!season || !Array.isArray(season.episodes)) {
                continue;
            }

            const seasonNumber =
                Number(season.number) || 1;

            for (const episode of season.episodes) {
                if (
                    !episode ||
                    !Array.isArray(episode.sources)
                ) {
                    continue;
                }

                const episodeNumber =
                    Number(episode.number) || 1;

                const episodeTitle =
                    clean(episode.title);

                for (const source of episode.sources) {
                    if (!source || !source.url) {
                        continue;
                    }

                    let displayName =
                        `${name} S${String(seasonNumber).padStart(2, "0")}E${String(episodeNumber).padStart(2, "0")}`;

                    if (episodeTitle) {
                        displayName += ` - ${episodeTitle}`;
                    }

                    if (source.quality) {
                        displayName += ` [${clean(source.quality)}]`;
                    }

                    const added = addEntry(
                        lines,
                        displayName,
                        name,
                        logo,
                        source.url
                    );

                    if (added) {
                        generated++;
                    }
                }
            }
        }
    }

    const output = lines.join("\n");

    const file = path.join(
        PUBLIC,
        "series.m3u"
    );

    fs.writeFileSync(
        file,
        output,
        "utf8"
    );

    console.log("");
    console.log("Series playlist generated");
    console.log("-------------------------");
    console.log(`Series:  ${series.length}`);
    console.log(`Sources: ${generated}`);
    console.log(`File:    ${file}`);
}

/**
 * Main
 */
try {
    generateMovies();
    generateSeries();

    console.log("");
    console.log("All playlists generated successfully.");
} catch (error) {
    console.error("");
    console.error("Playlist generation failed:");
    console.error(error.message);

    process.exit(1);
}

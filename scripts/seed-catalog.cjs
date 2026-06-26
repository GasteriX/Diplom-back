/**
 * Seed the catalog with sample vinyl records.
 * - Idempotent: skips a product if its `title` already exists.
 * - Generates a distinct offline SVG cover per product into /uploads,
 *   served by the existing static handler at /uploads/*.
 * - Inserts artist/genre/label (get-or-create) and links them, plus tracks.
 *
 * Run from the backend root:  node scripts/seed-catalog.cjs
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const ROOT = path.join(__dirname, '..');
const DB_PATH = process.env.DB_PATH
  ? path.resolve(ROOT, process.env.DB_PATH)
  : path.join(ROOT, 'data', 'app.sqlite');
const UPLOADS_DIR = path.join(ROOT, 'uploads');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Write a simple gradient SVG cover with the title, return its public path. */
function makeCover(slug, title, c1, c2) {
  const file = `seed-${slug}.svg`;
  const words = String(title).toUpperCase().split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 16) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  const tspans = lines
    .slice(0, 4)
    .map(
      (l, i) =>
        `<tspan x="50%" dy="${i === 0 ? 0 : 34}">${esc(l)}</tspan>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="600" height="600" fill="url(#g)"/>
  <rect x="20" y="20" width="560" height="560" fill="none" stroke="rgba(255,255,255,0.25)"/>
  <circle cx="300" cy="300" r="120" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
  <circle cx="300" cy="300" r="34" fill="rgba(0,0,0,0.55)"/>
  <text x="50%" y="${300 - (lines.length - 1) * 17}" fill="#f4f4f8" font-family="monospace"
    font-size="30" font-weight="700" text-anchor="middle" dominant-baseline="middle"
    style="letter-spacing:1px">${tspans}</text>
</svg>`;
  fs.writeFileSync(path.join(UPLOADS_DIR, file), svg, 'utf8');
  return `/uploads/${file}`;
}

const getArtist = db.prepare('SELECT id FROM artists WHERE name = ?');
const insArtist = db.prepare('INSERT INTO artists (name, bio) VALUES (?, NULL)');
const getGenre = db.prepare('SELECT id FROM genres WHERE name = ?');
const insGenre = db.prepare('INSERT INTO genres (name) VALUES (?)');
const getLabel = db.prepare('SELECT id FROM labels WHERE name = ?');
const insLabel = db.prepare('INSERT INTO labels (name) VALUES (?)');

function getOrCreate(getStmt, insStmt, name) {
  const row = getStmt.get(name);
  if (row) return row.id;
  return insStmt.run(name).lastInsertRowid;
}

const productExists = db.prepare('SELECT id FROM products WHERE title = ?');
const insProduct = db.prepare(`
  INSERT INTO products
    (title, record_title, media_type, price, stock, country, barcode, article,
     genre_title, styles, label_title, vinyl_count, performers, color_features,
     release_year, image_url, artistId, genreId, label_id)
  VALUES
    (@title, @record_title, @media_type, @price, @stock, @country, @barcode, @article,
     @genre_title, @styles, @label_title, @vinyl_count, @performers, @color_features,
     @release_year, @image_url, @artistId, @genreId, @label_id)
`);
const insTrack = db.prepare(
  'INSERT INTO tracks (number, title, duration, product_id) VALUES (?, ?, ?, ?)',
);

// title, artist, genre, label, country, year, price(UAH), mediaType, vinylCount,
// styles[], colors[], grad[c1,c2], tracks[[title,duration]]
const DATA = [
  ['The Dark Side Of The Moon', 'Pink Floyd', 'Progressive Rock', 'Harvest Records', 'UK', 1973, 2450, 'Vinyl', 1,
    ['Progressive Rock', 'Psychedelic Rock'], ['Black', 'Gatefold'], ['#2b1055', '#7597de'],
    [['Speak to Me', '00:01:30'], ['Breathe (In the Air)', '00:02:43'], ['Time', '00:06:53'], ['Money', '00:06:22'], ['Us and Them', '00:07:49']]],
  ['Kind Of Blue', 'Miles Davis', 'Jazz', 'Columbia', 'USA', 1959, 1890, 'Vinyl', 1,
    ['Modal Jazz', 'Cool Jazz'], ['Black', '180g'], ['#0f2027', '#2c5364'],
    [['So What', '00:09:22'], ['Freddie Freeloader', '00:09:46'], ['Blue in Green', '00:05:37'], ['All Blues', '00:11:33']]],
  ['Random Access Memories', 'Daft Punk', 'Electronic', 'Columbia', 'France', 2013, 2990, 'Vinyl', 2,
    ['Disco', 'Synth-pop'], ['Black', 'Gatefold', '2LP'], ['#16222a', '#3a6073'],
    [['Give Life Back to Music', '00:04:34'], ['The Game of Love', '00:05:21'], ['Giorgio by Moroder', '00:09:04'], ['Get Lucky', '00:06:07'], ['Instant Crush', '00:05:37']]],
  ['OK Computer', 'Radiohead', 'Alternative Rock', 'Parlophone', 'UK', 1997, 2350, 'Vinyl', 2,
    ['Alternative Rock', 'Art Rock'], ['Black', '2LP'], ['#232526', '#414345'],
    [['Airbag', '00:04:44'], ['Paranoid Android', '00:06:23'], ['Karma Police', '00:04:21'], ['No Surprises', '00:03:48']]],
  ['Nevermind', 'Nirvana', 'Grunge', 'DGC', 'USA', 1991, 1990, 'Vinyl', 1,
    ['Grunge', 'Alternative Rock'], ['Black'], ['#1a2980', '#26d0ce'],
    [['Smells Like Teen Spirit', '00:05:01'], ['In Bloom', '00:04:14'], ['Come as You Are', '00:03:39'], ['Lithium', '00:04:17']]],
  ['To Pimp A Butterfly', 'Kendrick Lamar', 'Hip-Hop', 'Top Dawg Entertainment', 'USA', 2015, 2790, 'Vinyl', 2,
    ['Conscious Hip-Hop', 'Jazz Rap'], ['Black', '2LP'], ['#41295a', '#2f0743'],
    [['Wesleys Theory', '00:04:47'], ['King Kunta', '00:03:54'], ['Alright', '00:03:39'], ['These Walls', '00:05:00']]],
  ['Currents', 'Tame Impala', 'Psychedelic', 'Modular Recordings', 'Australia', 2015, 2550, 'Vinyl', 2,
    ['Psychedelic Pop', 'Synth-pop'], ['Black', '2LP'], ['#ff512f', '#dd2476'],
    [['Let It Happen', '00:07:47'], ['The Less I Know the Better', '00:03:36'], ['Eventually', '00:05:18'], ['New Person, Same Old Mistakes', '00:06:00']]],
  ['Fortitude', 'Gojira', 'Metal', 'Roadrunner Records', 'France', 2021, 2190, 'Vinyl', 1,
    ['Progressive Metal', 'Death Metal'], ['Black', 'Gatefold'], ['#350000', '#7a1f1f'],
    [['Born for One Thing', '00:03:53'], ['Amazonia', '00:04:28'], ['Another World', '00:03:32'], ['Fortitude', '00:01:33']]],
  ['Selected Ambient Works 85-92', 'Aphex Twin', 'Electronic', 'R&S Records', 'UK', 1992, 2680, 'Vinyl', 2,
    ['Ambient Techno', 'IDM'], ['Black', '2LP'], ['#0b486b', '#f56217'],
    [['Xtal', '00:04:51'], ['Tha', '00:09:01'], ['Pulsewidth', '00:03:47'], ['Ageispolis', '00:05:21']]],
  ['Unknown Pleasures', 'Joy Division', 'Post-Punk', 'Factory Records', 'UK', 1979, 2090, 'Vinyl', 1,
    ['Post-Punk', 'Gothic Rock'], ['Black', 'Textured Sleeve'], ['#000000', '#434343'],
    [['Disorder', '00:03:29'], ['Day of the Lords', '00:04:48'], ['Candidate', '00:03:03'], ['She’s Lost Control', '00:03:57']]],
  ['Rumours', 'Fleetwood Mac', 'Soft Rock', 'Warner Records', 'USA', 1977, 2280, 'Vinyl', 1,
    ['Soft Rock', 'Pop Rock'], ['Black'], ['#642b73', '#c6426e'],
    [['Second Hand News', '00:02:43'], ['Dreams', '00:04:14'], ['Go Your Own Way', '00:03:38'], ['The Chain', '00:04:28']]],
];

let added = 0;
const seedAll = db.transaction(() => {
  DATA.forEach((row, idx) => {
    const [title, artist, genre, label, country, year, price, mediaType, vinylCount, styles, colors, grad, tracks] = row;
    if (productExists.get(title)) {
      console.log(`skip (exists): ${title}`);
      return;
    }
    const artistId = getOrCreate(getArtist, insArtist, artist);
    const genreId = getOrCreate(getGenre, insGenre, genre);
    const labelId = getOrCreate(getLabel, insLabel, label);
    const slug = String(idx + 1).padStart(2, '0');
    const image_url = makeCover(slug, title, grad[0], grad[1]);

    const info = insProduct.run({
      title,
      record_title: title,
      media_type: mediaType,
      price,
      stock: 5 + ((idx * 3) % 12),
      country,
      barcode: String(4600000000000 + idx * 137).slice(0, 13),
      article: `SPV${10000 + idx}`,
      genre_title: genre,
      styles: styles.join(','),
      label_title: label,
      vinyl_count: vinylCount,
      performers: artist,
      color_features: colors.join(','),
      release_year: year,
      image_url,
      artistId,
      genreId,
      label_id: labelId,
    });
    const productId = info.lastInsertRowid;
    tracks.forEach(([t, d], i) => insTrack.run(i + 1, t, d, productId));
    added += 1;
    console.log(`added: ${title} (id=${productId}, ${tracks.length} tracks)`);
  });
});

seedAll();
console.log(`\nDone. Added ${added} products. Total now: ${db.prepare('SELECT COUNT(*) FROM products').get()['COUNT(*)']}`);
db.close();

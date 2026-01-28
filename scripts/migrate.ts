import fs from 'fs';
import path from 'path';

const sourcePath = path.join(process.cwd(), '_source', 'README.md');
const outputDir = path.join(process.cwd(), 'src', 'content', 'games');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const content = fs.readFileSync(sourcePath, 'utf-8');
const lines = content.split('\n');

let currentCategory = '';
let currentGame: any = null;

function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

function saveGame(game: any) {
  if (!game) return;

  const slug = slugify(game.title);
  const filePath = path.join(outputDir, `${slug}.md`);

  const frontmatter = [
    '---',
    `title: "${game.title.replace(/"/g, '\\"')}"`,
    `url: "${game.url}"`,
    `category: "${game.category}"`,
    `authors: ${JSON.stringify(game.authors || ["Unknown"])}`,
    `year: ${game.year || 0}`,
    `sub_topics: ${JSON.stringify(game.sub_topics)}`,
    `genres: ${JSON.stringify(game.genres)}`,
    `platforms: ${JSON.stringify(game.platforms)}`,
    `pricing: ${JSON.stringify(game.pricing)}`,
    `description: "${(game.description || '').replace(/"/g, '\\"')}"`,
    `image: "${game.image || '/placeholder.png'}"`,
    `repo_url: "${game.repo_url || ''}"`,
    `license: "${game.license || 'proprietary'}"`,
    '---',
    ''
  ].join('\n');

  fs.writeFileSync(filePath, frontmatter);
  console.log(`Saved ${game.title}`);
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.startsWith('## Meta')) {
    break;
  }

  if (line.startsWith('### ')) {
    currentCategory = line.substring(4).trim();
    continue;
  }

  if (line.startsWith('#### ')) {
    if (currentGame) {
      saveGame(currentGame);
    }

    let title = line.substring(5).trim();
    let year = 0;
    const yearMatch = title.match(/\((\d{4})\)/);
    if (yearMatch) {
      year = parseInt(yearMatch[1]);
      title = title.replace(/\(\d{4}\)/, '').trim();
    }

    currentGame = {
      title,
      year,
      category: currentCategory,
      sub_topics: [],
      genres: [],
      platforms: [],
      pricing: ["free"], // Default to free as per schema default, but will override
      description: '',
      authors: ["Unknown"],
      url: ''
    };
    continue;
  }

  if (currentGame && line.trim().startsWith('*')) {
    const content = line.trim().substring(1).trim();
    
    // First link is usually the URL
    if (!currentGame.url && content.includes('http')) {
      const urlMatch = content.match(/\((https?:\/\/[^\)]+)\)/) || content.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        currentGame.url = urlMatch[1];
      } else {
         // Fallback for lines that are just urls without markdown
         const simpleUrl = content.match(/^(https?:\/\/\S+)/);
         if (simpleUrl) currentGame.url = simpleUrl[1];
      }
    }

    // Parse attributes
    const lower = content.toLowerCase();
    
    // Platforms
    if (lower.includes('windows')) currentGame.platforms.push('Windows');
    if (lower.includes('linux') || lower.includes('gnu/linux')) currentGame.platforms.push('Linux');
    if (lower.includes('mac') || lower.includes('os x') || lower.includes('macos')) currentGame.platforms.push('macOS');
    if (lower.includes('android')) currentGame.platforms.push('Android');
    if (lower.includes('ios') || lower.includes('iphone') || lower.includes('ipad')) currentGame.platforms.push('iOS');
    if (lower.includes('web') || lower.includes('flash') || lower.includes('browser')) currentGame.platforms.push('Web');

    // Pricing
    if (content.includes('($)')) {
        if (!currentGame.pricing.includes('paid')) currentGame.pricing.push('paid');
        // Remove free if it was default and we found paid, unless it's both? 
        // Logic: if ($) is present, it's paid. If (free) is present, it's free.
        // If we only see ($), we should probably clear 'free' if it was just a default.
        // But let's be additive.
    }
    if (content.includes('free')) {
        if (!currentGame.pricing.includes('free')) currentGame.pricing.push('free');
    }
    
    // If we added paid, and free was default, we might want to ensure 'paid' is primary or sole if no 'free' mention.
    // For now, I'll rely on the text.
    // Actually, if I detect ($), I should check if I should remove 'free'.
    // Let's refine:
    // Start empty, if empty at end, set to free.
    
    // License
    if (lower.includes('license') || lower.includes('gpl') || lower.includes('mit') || lower.includes('cc0')) {
        const licenseMatch = content.match(/(MIT|GPL|CC0|Apache|CC BY-NC-SA)/i);
        if (licenseMatch) {
            currentGame.license = licenseMatch[0];
        } else {
            // grab the whole line or part of it?
            // simpler: if it mentions license, try to extract specific ones, or just generic 'Open Source' if repo found?
            // Schema has default "proprietary".
        }
    }

    // Repo
    if (content.includes('github.com') || content.includes('gitlab.com')) {
       const repoMatch = content.match(/(https?:\/\/(github\.com|gitlab\.com)[^\s\)]+)/);
       if (repoMatch) currentGame.repo_url = repoMatch[1];
    }

    // Genres (heuristics)
    if (lower.includes('puzzle')) currentGame.genres.push('Puzzle');
    if (lower.includes('strategy') || lower.includes('rts')) currentGame.genres.push('Strategy');
    if (lower.includes('rpg') || lower.includes('role-playing')) currentGame.genres.push('RPG');
    if (lower.includes('arcade') || lower.includes('platformer')) currentGame.genres.push('Arcade');
    if (lower.includes('simulation') || lower.includes('simulator')) currentGame.genres.push('Simulation');
    if (lower.includes('board game')) currentGame.genres.push('Board Game');
    if (lower.includes('card game')) currentGame.genres.push('Card Game');
    
    // Sub-topics are often indented bullets, but here they are just lines starting with *
    // We can treat lines that aren't meta-data as descriptions or sub-topics.
    // Simple heuristic: if it's not a url, not a platform list, not a genre list, maybe it's a sub-topic?
    // Or just put everything else in description.
    
    if (!content.includes('http') && !lower.includes('windows') && !lower.includes('license')) {
         if (currentGame.description) currentGame.description += ' ';
         currentGame.description += content;
    }
  }
}

// Save last game
if (currentGame) {
  saveGame(currentGame);
}

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface Game {
  title: string;
  url: string;
  category: string;
  topics: string[];
  type: string[];
  platforms: string[];
  free: boolean;
  source?: string;
  description: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractUrl(line: string): string | null {
  const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
  return match ? match[2] : null;
}

function parseGames(content: string): Game[] {
  const games: Game[] = [];
  const lines = content.split('\n');

  let currentCategory = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Category headers (### Physics, ### Chemistry, etc.)
    if (line.startsWith('### ') && !line.includes('#')) {
      currentCategory = line.replace('### ', '').toLowerCase();
      i++;
      continue;
    }

    // Game headers (#### Game Name)
    if (line.startsWith('#### ')) {
      const title = line.replace('#### ', '').trim();
      i++;

      // Extract game data from following lines
      let url = '';
      const topics: string[] = [];
      const type: string[] = [];
      const platforms: string[] = [];
      let free = true;
      let source: string | undefined;
      let description = '';
      let collectingTopics = false;

      while (i < lines.length && !lines[i].startsWith('####')) {
        const contentLine = lines[i].trim();

        if (!contentLine || contentLine.startsWith('###')) break;

        // URL line (first bullet with link)
        if (contentLine.startsWith('*') && contentLine.includes('](') && !url) {
          const extractedUrl = extractUrl(contentLine);
          if (extractedUrl) {
            url = extractedUrl;
          }
        }
        // Scientific topics (bullets without links, or just text)
        else if (contentLine.startsWith('*') && !contentLine.includes('](')) {
          const text = contentLine.replace(/^\*\s*/, '').trim();

          // Check if it's a type/genre line
          if (text.includes('puzzle') || text.includes('strategy') ||
              text.includes('simulation') || text.includes('platformer') ||
              text.includes('arcade') || text.includes('RTS') ||
              text.includes('roguelike') || text.includes('board') ||
              text.includes('game') || text.includes('visual novel')) {
            type.push(text);
            collectingTopics = false;
          }
          // Check if it's a platform/pricing line
          else if (text.match(/\b(web|Windows|MacOS|GNU\/Linux|Android|iOS|board game|Java|free|charge|\$)\b/i)) {
            // Parse platforms
            const platformMatches = text.match(/\b(web|Windows|MacOS|GNU\/Linux|Android|iOS|board game|Java|Linux|macOS)\b/gi);
            if (platformMatches) {
              platforms.push(...platformMatches.map(p => p.toLowerCase().replace('macos', 'mac').replace('gnu/linux', 'linux')));
            }
            // Check if it's paid or free
            if (text.includes('$') || text.includes('paid')) {
              free = false;
            }
            collectingTopics = false;
          }
          // License/source lines
          else if (text.includes('license') && contentLine.includes('](')) {
            const extractedUrl = extractUrl(contentLine);
            if (extractedUrl && extractedUrl.includes('github')) {
              source = extractedUrl;
            }
          }
          // Otherwise it's a scientific topic
          else {
            topics.push(text);
            collectingTopics = true;
          }
        }
        // Sub-bullets (nested topics)
        else if (contentLine.match(/^\s+\*/) && collectingTopics) {
          const text = contentLine.replace(/^\s+\*\s*/, '').trim();
          if (text && !text.includes('](')) {
            topics.push(text);
          }
        }
        // Collect description from plain text
        else if (contentLine && !contentLine.startsWith('*') && !contentLine.startsWith('#')) {
          if (description) description += ' ';
          description += contentLine;
        }

        i++;
      }

      // Only add if we have minimum data
      if (title && url && currentCategory) {
        games.push({
          title,
          url,
          category: currentCategory,
          topics: topics.length > 0 ? topics : ['science'],
          type: type.length > 0 ? type : ['game'],
          platforms: platforms.length > 0 ? platforms : ['unknown'],
          free,
          source,
          description: description || `A science-based game about ${topics.join(', ') || 'learning'}.`,
        });
      }

      continue;
    }

    i++;
  }

  return games;
}

function generateMarkdown(game: Game): string {
  const frontmatter = `---
title: "${game.title.replace(/"/g, '\\"')}"
url: "${game.url}"
category: "${game.category}"
topics: ${JSON.stringify(game.topics)}
type: ${JSON.stringify(game.type)}
platforms: ${JSON.stringify(game.platforms)}
free: ${game.free}${game.source ? `\nsource: "${game.source}"` : ''}
---

${game.description}
`;

  return frontmatter;
}

// Main execution
const readmePath = join(process.cwd(), '..', 'README.md');
const outputDir = join(process.cwd(), 'src', 'content', 'games');

console.log('Reading README.md...');
const content = readFileSync(readmePath, 'utf-8');

console.log('Parsing games...');
const games = parseGames(content);

console.log(`Found ${games.length} games`);

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

// Generate markdown files
games.forEach((game) => {
  const slug = slugify(game.title);
  const markdown = generateMarkdown(game);
  const filePath = join(outputDir, `${slug}.md`);

  writeFileSync(filePath, markdown, 'utf-8');
  console.log(`Created: ${slug}.md`);
});

console.log('\nMigration complete!');
console.log(`Generated ${games.length} game files in ${outputDir}`);

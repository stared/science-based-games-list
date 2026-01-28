import fs from 'fs';
import path from 'path';

const gamesDir = path.join(process.cwd(), 'src', 'content', 'games');
const validCategories = [
  "Physics",
  "Chemistry",
  "Biology",
  "Computer science",
  "Health",
  "Mathematics",
  "Sociology and economy",
  "Humanities",
  "Design",
  "Life experience games"
];

function runValidation() {
  const files = fs.readdirSync(gamesDir);
  let hasError = false;

  console.log(`Validating ${files.length} game files...`);

  files.forEach(file => {
    if (!file.endsWith('.md')) return;

    const filePath = path.join(gamesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Simple frontmatter parsing
    const categoryMatch = content.match(/category: "(.*?)"/);
    if (categoryMatch) {
      const category = categoryMatch[1];
      if (!validCategories.includes(category)) {
        console.error(`❌ Error in ${file}: Invalid category "${category}"`);
        hasError = true;
      }
    } else {
      console.error(`❌ Error in ${file}: Category missing`);
      hasError = true;
    }
  });

  if (!hasError) {
    console.log("✅ All validations passed!");
  } else {
    process.exit(1);
  }
}

runValidation();

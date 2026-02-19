import { readFileSync } from 'fs';

const content = readFileSync('app/admin/client.tsx', 'utf8');
const lines = content.split('\n');

// Find the return statement
let returnLineIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'return (') {
    returnLineIdx = i;
    break;
  }
}

if (returnLineIdx === -1) {
  console.log('Could not find return statement');
  process.exit(1);
}

console.log(`Found return statement at line ${returnLineIdx + 1}`);

// Simple JSX tag balance checker
const stack = [];
const tagRegex = /<\/?([A-Za-z][A-Za-z0-9.]*)/g;
const selfClosingRegex = /\/>\s*$/;

for (let i = returnLineIdx; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // Skip comment lines
  if (line.trim().startsWith('//') || line.trim().startsWith('{/*')) continue;
  
  // Find all tags on this line
  let match;
  const tagsOnLine = [];
  
  // Reset regex
  tagRegex.lastIndex = 0;
  while ((match = tagRegex.exec(line)) !== null) {
    const fullMatch = match[0];
    const tagName = match[1];
    const isClosing = fullMatch.startsWith('</');
    const matchIdx = match.index;
    
    // Check if this is inside a string/expression
    // Simple heuristic: skip if inside quotes or template literal
    const beforeMatch = line.substring(0, matchIdx);
    const singleQuotes = (beforeMatch.match(/'/g) || []).length;
    const doubleQuotes = (beforeMatch.match(/"/g) || []).length;
    const backticks = (beforeMatch.match(/`/g) || []).length;
    
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
      continue; // Inside a string
    }
    
    tagsOnLine.push({ tagName, isClosing, matchIdx, lineNum });
  }
  
  for (const tag of tagsOnLine) {
    if (tag.isClosing) {
      // Find matching opening tag
      let found = false;
      for (let j = stack.length - 1; j >= 0; j--) {
        if (stack[j].tagName === tag.tagName) {
          stack.splice(j, 1);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log(`Line ${tag.lineNum}: Extra closing tag </${tag.tagName}> with no matching open`);
      }
    } else {
      // Check if self-closing on this line
      // Look for /> after this tag on the same line
      const afterTag = line.substring(tag.matchIdx);
      
      // Count < and > to determine if self-closing
      // Simple: check if there's a /> before the next < on this line
      const nextTagIdx = afterTag.indexOf('<', 1);
      const selfCloseIdx = afterTag.indexOf('/>');
      
      if (selfCloseIdx !== -1 && (nextTagIdx === -1 || selfCloseIdx < nextTagIdx)) {
        // Self-closing, don't push
        continue;
      }
      
      // Check for common self-closing HTML tags
      const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
      if (voidElements.includes(tag.tagName.toLowerCase())) {
        continue;
      }
      
      stack.push(tag);
    }
  }
}

console.log(`\n=== Unclosed tags (${stack.length}) ===`);
for (const tag of stack) {
  console.log(`  Line ${tag.lineNum}: <${tag.tagName}>`);
}

if (stack.length === 0) {
  console.log('All tags are balanced!');
}

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function stripComments(source) {
  const sourceFile = ts.createSourceFile('temp.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const printer = ts.createPrinter({ removeComments: true });
  const result = printer.printFile(sourceFile);
  return result;
}

function processFile(filePath) {
  const c = fs.readFileSync(filePath, 'utf8');
  const result = stripComments(c);
  fs.writeFileSync(filePath, result);
  console.log(filePath);
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      processFile(fullPath);
    }
  }
}

walk(path.join(__dirname, 'src'));
console.log('Done!');
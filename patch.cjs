const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('const SetupPage = () => {'));
const end = lines.findIndex((l, i) => i > start && l.startsWith('export default function App() {'));
lines.splice(start, end - start);
lines.splice(6, 0, 'import SetupPage from "./SetupPage";');
fs.writeFileSync('src/App.tsx', lines.join('\n'));

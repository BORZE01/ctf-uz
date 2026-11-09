const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const model = fs.readFileSync(path.join(root, 'models/ArenaLabSession.js'), 'utf8');
const solveModel = fs.readFileSync(path.join(root, 'models/ArenaLabSolve.js'), 'utf8');
const route = fs.readFileSync(path.join(root, 'routes/arenaLabs.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'public/arena-lab.html'), 'utf8');

assert.match(model, /terminalHistory:\s*\{\s*type:\s*\[terminalEntrySchema\]/, 'Mongo model must persist terminal history');
assert.match(model, /remainingMs:\s*\{\s*type:\s*Number/, 'Mongo model must persist paused remaining time');
assert.match(model, /objectivesCompleted:\s*\{\s*type:\s*\[Boolean\]/, 'Mongo model must persist objective progress');
assert.match(route, /router\.get\('\/:slug\/active'/, 'API must provide active-session restore endpoint');
assert.match(route, /userId:\s*req\.currentUser\._id/, 'Session lookup must be scoped to authenticated owner');
assert.match(route, /appendHistory\(session/, 'Commands must be appended to server-side session history');
assert.match(page, /api\(`\/api\/arena-labs\/\$\{encodeURIComponent\(slug\)\}\/active`\)/, 'Browser must restore active session from server');
assert.match(page, /function renderTerminalHistory/, 'Browser must reconstruct terminal output from server history');
assert.doesNotMatch(page, /localStorage\.(?:clear|removeItem)\(/, 'Session progress must not depend on destructive localStorage behavior');
console.log('Arena Labs persistence structure smoke tests: PASS (Mongo-backed history/state, owner-scoped restore, browser replay).');

assert.match(model, /codenest:\s*\{[\s\S]*?targetDiscovered:\s*\{\s*type:\s*Boolean/, 'CodeNest state must be persisted in MongoDB');
assert.match(model, /codenest-linux-privesc/, 'Session model must accept the CodeNest lab slug');
assert.match(solveModel, /codenest-linux-privesc/, 'Solve model must accept the CodeNest lab slug for points and completion history');
assert.match(route, /isCodenestPasswordInput/, 'su password input must be redacted from server-side terminal history');
assert.match(page, /isPasswordInput \? '\*\*\*\*\*\*\*\*'/, 'su password input must be masked in browser terminal output');
assert.match(page, /if \(!isPasswordInput\)/, 'password input must not enter browser command history');
console.log('CodeNest persistence/security smoke tests: PASS (state persistence and password-history redaction).');

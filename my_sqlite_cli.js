const readline = require('readline');
const fs = require('fs');
const MySqliteRequest = require('./my_sqlite_request');

//Remove surrounding quotes from a value
function stripQuotes(str) {
  str = str.trim();
  if (
    (str.startsWith("'") && str.endsWith("'")) ||
    (str.startsWith('"') && str.endsWith('"'))
  ) {
    return str.slice(1, -1);
  }
  return str;
}

// Print SELECT result as col1|col2|...
function printSelectResult(rows) {
  if (!rows || rows.length === 0) return;

  const columns = Object.keys(rows[0]).filter(c => c !== 'id');
  rows.forEach(r => {
    console.log(columns.map(c => r[c] ?? '').join('|'));
  });
}

// Handle one SQL-like command
function handleCommand(line) {
  line = line.trim().replace(/;$/, '');
  if (!line) return;

  const upper = line.toUpperCase();

  // SELECT
  if (upper.startsWith('SELECT')) {
    const match = line.match(/^SELECT\s+(.+)\s+FROM\s+(\S+)(.*)$/i);
    if (!match) throw new Error('Invalid SELECT syntax');

    const cols = match[1].trim();
    const table = match[2].trim();
    const rest = match[3];

    let req = new MySqliteRequest().from(table);

    req = cols === '*' ? req.select('*') : req.select(cols.split(',').map(c => c.trim()));

    const join = rest.match(/JOIN\s+(\S+)\s+ON\s+(\S+)\s*=\s*(\S+)/i);
    if (join) req = req.join(join[2], join[1], join[3]);

    const where = rest.match(/WHERE\s+(\w+)\s*=\s*('[^']*'|"[^"]*"|\S+)/i);
    if (where) req = req.where(where[1], stripQuotes(where[2]));

    const order = rest.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (order) req = req.order((order[2] || 'asc').toLowerCase(), order[1]);

    printSelectResult(req.run());
    return;
  }

  //INSERT
  if (upper.startsWith('INSERT')) {
    const match = line.match(/^INSERT\s+INTO\s+(\S+)\s+VALUES\s*\((.*)\)$/i);
    if (!match) throw new Error('Invalid INSERT syntax');

    const table = match[1];
    const values = match[2].split(',').map(v => stripQuotes(v));

    const headers = fs.readFileSync(table, 'utf8').split('\n')[0].split(',');
    const data = {};
    headers.forEach((h, i) => data[h] = values[i] ?? '');

    new MySqliteRequest().insert(table).values(data).run();
    return;
  }

  // UPDATE
  if (upper.startsWith('UPDATE')) {
    const match = line.match(/^UPDATE\s+(\S+)\s+SET\s+(.+)$/i);
    if (!match) throw new Error('Invalid UPDATE syntax');

    const table = match[1];
    let setPart = match[2];
    let wherePart = null;

    if (setPart.toUpperCase().includes(' WHERE ')) {
      const parts = setPart.split(/ WHERE /i);
      setPart = parts[0];
      wherePart = parts[1];
    }

    const data = {};
    setPart.split(',').forEach(p => {
      const [k, v] = p.split('=');
      data[k.trim()] = stripQuotes(v);
    });

    let req = new MySqliteRequest().update(table).set(data);

    if (wherePart) {
      const w = wherePart.match(/(\w+)\s*=\s*(.+)/);
      req = req.where(w[1], stripQuotes(w[2]));
    }

    req.run();
    return;
  }

  // DELETE
  if (upper.startsWith('DELETE')) {
    const match = line.match(/^DELETE\s+FROM\s+(\S+)(?:\s+WHERE\s+(.+))?/i);
    if (!match) throw new Error('Invalid DELETE syntax');

    let req = new MySqliteRequest().from(match[1]).delete();
    if (match[2]) {
      const w = match[2].match(/(\w+)\s*=\s*(.+)/);
      req = req.where(w[1], stripQuotes(w[2]));
    }

    req.run();
    return;
  }

  console.log('Unrecognized command');
}

//CLI
console.log('MySQLite version 0.1 20XX-XX-XX');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'my_sqlite_cli> '
});

rl.prompt();

rl.on('line', line => {
  if (['quit', 'exit'].includes(line.trim().toLowerCase())) {
    rl.close();
    return;
  }

  try {
    handleCommand(line);
  } catch (e) {
    console.error('Error:', e.message);
  }

  rl.prompt();
});
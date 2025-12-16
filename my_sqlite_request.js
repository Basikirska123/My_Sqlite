const fs = require('fs');

// Parse a CSV line correctly (quote-aware).
// Handles commas inside double quotes
// Handles escaped quotes inside quoted fields: "" -> "

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // If we are inside quotes and the next char is also a quote, it's an escaped quote.
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  result.push(current);
  return result.map(v => v.trim());
}

// Convert a JS value into a CSV-safe field.
// - Quotes the field if it contains comma, quote, or newline
// - Escapes quotes by doubling them

function toCsvField(value) {
  const s = value === undefined || value === null ? '' : String(value);

  // Quote if needed
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }

  return s;
}

//Normalize column names like "table.col" -> "col"
function normalizeColumnName(name) {
  return String(name).trim().split('.').pop();
}

class MySqliteRequest {
  constructor() {
    // Query state
    this.tableName = null;
    this.queryType = 'select';

    // SELECT
    this.selectedColumns = null;
    this.whereColumn = null;
    this.whereValue = null;
    this.orderColumn = null;
    this.orderDirection = 'asc';

    // JOIN (only one allowed)
    this.joinTableNameB = null;
    this.joinColumnA = null;
    this.joinColumnB = null;

    // INSERT / UPDATE
    this.insertData = null;
    this.updateData = null;
  }

  from(tableName) {
    this.tableName = tableName;
    this.queryType = 'select';
    return this;
  }

  select(columns) {
    if (columns === '*') {
      this.selectedColumns = ['*'];
    } else if (Array.isArray(columns)) {
      // Normalize "table.col" projections
      this.selectedColumns = columns.map(normalizeColumnName);
    } else {
      this.selectedColumns = [normalizeColumnName(columns)];
    }
    return this;
  }

  where(columnName, value) {
    this.whereColumn = normalizeColumnName(columnName);
    this.whereValue = value;
    return this;
  }

  join(columnOnDbA, filenameDbB, columnOnDbB) {
    // Support table.column syntax
    this.joinColumnA = normalizeColumnName(columnOnDbA);
    this.joinColumnB = normalizeColumnName(columnOnDbB);
    this.joinTableNameB = filenameDbB;
    return this;
  }

  order(direction, columnName) {
    this.orderDirection = direction === 'desc' ? 'desc' : 'asc';
    this.orderColumn = normalizeColumnName(columnName);
    return this;
  }

  insert(tableName) {
    this.tableName = tableName;
    this.queryType = 'insert';
    return this;
  }

  values(data) {
    this.insertData = data;
    return this;
  }

  update(tableName) {
    this.tableName = tableName;
    this.queryType = 'update';
    return this;
  }

  set(data) {
    // Normalize update keys like "table.col" -> "col"
    this.updateData = {};
    for (const [k, v] of Object.entries(data || {})) {
      this.updateData[normalizeColumnName(k)] = v;
    }
    return this;
  }

  delete() {
    this.queryType = 'delete';
    return this;
  }

//Load CSV file and return { headers, rows }

  loadTable(filename) {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = parseCsvLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      const row = { id: i };

      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? '';
      });

      rows.push(row);
    }

    return { headers, rows };
  }

//Write a table back to CSV safely (quotes fields when needed).

  writeTable(filename, headers, rows) {
    const outLines = [];
    outLines.push(headers.map(toCsvField).join(','));
    for (const r of rows) {
      outLines.push(headers.map(h => toCsvField(r[h] ?? '')).join(','));
    }
    fs.writeFileSync(filename, outLines.join('\n') + '\n', 'utf8');
  }

  run() {
    if (!this.tableName) throw new Error('No table selected');

    // SELECT
    if (this.queryType === 'select') {
      let { rows } = this.loadTable(this.tableName);

      // JOIN
      if (this.joinTableNameB) {
        const tableB = this.loadTable(this.joinTableNameB).rows;
        const joined = [];

        rows.forEach(a => {
          tableB.forEach(b => {
            if (a[this.joinColumnA] === b[this.joinColumnB]) {
              joined.push({ ...a, ...b });
            }
          });
        });

        rows = joined;
      }

      // WHERE
      if (this.whereColumn !== null) {
        rows = rows.filter(r => r[this.whereColumn] === this.whereValue);
      }

      // ORDER
      if (this.orderColumn) {
        rows.sort((a, b) => {
          const av = a[this.orderColumn];
          const bv = b[this.orderColumn];
          if (av < bv) return this.orderDirection === 'asc' ? -1 : 1;
          if (av > bv) return this.orderDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }

      // SELECT columns
      if (!this.selectedColumns || this.selectedColumns[0] === '*') {
        return rows;
      }

      return rows.map(r => {
        const obj = { id: r.id };
        this.selectedColumns.forEach(c => {
          obj[c] = r[c];
        });
        return obj;
      });
    }

    // INSERT
    if (this.queryType === 'insert') {
      if (!this.insertData) throw new Error('No data to insert. Use values(data).');

      const { headers } = this.loadTable(this.tableName);
      if (headers.length === 0) throw new Error('Cannot insert into empty table without header.');

      // Build a row in header order, and write CSV-safe fields
      const newRowLine = headers.map(h => toCsvField(this.insertData[h] ?? '')).join(',');

      // Ensure we append on a new line correctly
      const existing = fs.readFileSync(this.tableName, 'utf8');
      const prefix = existing.endsWith('\n') || existing.length === 0 ? '' : '\n';
      fs.appendFileSync(this.tableName, prefix + newRowLine + '\n', 'utf8');

      return [];
    }

    // UPDATE
    if (this.queryType === 'update') {
      if (!this.updateData) throw new Error('No data to update. Use set(data).');

      const { headers, rows } = this.loadTable(this.tableName);

      rows.forEach(r => {
        const match = this.whereColumn ? (r[this.whereColumn] === this.whereValue) : true;
        if (!match) return;

        for (const key of Object.keys(this.updateData)) {
          if (headers.includes(key)) {
            r[key] = this.updateData[key];
          }
        }
      });

      this.writeTable(this.tableName, headers, rows);
      return [];
    }

    // DELETE
    if (this.queryType === 'delete') {
      const { headers, rows } = this.loadTable(this.tableName);

      const remaining = this.whereColumn
        ? rows.filter(r => r[this.whereColumn] !== this.whereValue)
        : [];

      this.writeTable(this.tableName, headers, remaining);
      return [];
    }

    throw new Error('Unknown query type');
  }
}

module.exports = MySqliteRequest;
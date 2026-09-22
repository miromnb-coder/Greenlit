import { leadInput } from "./validation";

export type CsvImportError = { row: number; message: string };

export type CsvLead = ReturnType<typeof leadInput>;

export type CsvParseResult = {
  rows: Record<string, string>[];
  errors: CsvImportError[];
};

const MAX_CSV_BYTES = 1_000_000;
const MAX_CSV_ROWS = 5_000;

/**
 * Parses RFC 4180-style CSV, including commas, newlines and escaped quotes in
 * quoted fields. Import code must never split rows or cells on commas.
 */
export function parseCsv(text: string): CsvParseResult {
  if (Buffer.byteLength(text, "utf8") > MAX_CSV_BYTES) {
    return { rows: [], errors: [{ row: 0, message: "CSV is larger than 1 MB" }] };
  }

  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
      continue;
    }
    if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) records.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) return { rows: [], errors: [{ row: records.length + 1, message: "Unclosed quoted field" }] };
  row.push(cell);
  if (row.some((value) => value.length > 0)) records.push(row);
  if (records.length === 0) return { rows: [], errors: [{ row: 0, message: "CSV is empty" }] };
  if (records.length > MAX_CSV_ROWS + 1) return { rows: [], errors: [{ row: 0, message: "CSV has more than 5,000 data rows" }] };

  const headers = records[0].map((header) => header.replace(/^\uFEFF/, "").trim().toLowerCase());
  if (headers.some((header) => !header)) return { rows: [], errors: [{ row: 1, message: "Every column needs a header" }] };
  if (new Set(headers).size !== headers.length) return { rows: [], errors: [{ row: 1, message: "Column headers must be unique" }] };

  const errors: CsvImportError[] = [];
  const rows = records.slice(1).flatMap((values, offset) => {
    const rowNumber = offset + 2;
    if (values.length !== headers.length) {
      errors.push({ row: rowNumber, message: `Expected ${headers.length} columns, received ${values.length}` });
      return [];
    }
    return [Object.fromEntries(headers.map((header, column) => [header, values[column].trim()]))];
  });
  return { rows, errors };
}

function matchingColumn(row: Record<string, string>, names: string[]) {
  const key = Object.keys(row).find((column) => names.some((name) => column === name || column.includes(name)));
  return key ? row[key] : "";
}

export function validateCsvLeads(text: string, existingEmails: Iterable<string> = []) {
  const parsed = parseCsv(text);
  const errors = [...parsed.errors];
  const knownEmails = new Set([...existingEmails].map((email) => email.trim().toLowerCase()));
  const leads: CsvLead[] = [];

  parsed.rows.forEach((row, index) => {
    const rowNumber = index + 2;
    try {
      const lead = leadInput({
        name: matchingColumn(row, ["name"]),
        email: matchingColumn(row, ["email"]),
        company: matchingColumn(row, ["company"]),
        title: matchingColumn(row, ["title", "role"]),
        message: matchingColumn(row, ["message", "note"]),
      });
      if (knownEmails.has(lead.email)) {
        errors.push({ row: rowNumber, message: "Duplicate email in this workspace or file" });
        return;
      }
      knownEmails.add(lead.email);
      leads.push(lead);
    } catch (error) {
      errors.push({ row: rowNumber, message: error instanceof Error ? error.message : "Invalid row" });
    }
  });
  return { leads, errors };
}

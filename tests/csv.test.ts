import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv, validateCsvLeads } from "../lib/csv";

test("CSV parser supports quoted commas, newlines, escaped quotes, and CRLF", () => {
  const result = parseCsv('name,email,company,message\r\n"Ada, Inc.",ada@example.com,Firma,"Needs help, \""urgently\""\nthis week"\r\n');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.rows, [{ name: "Ada, Inc.", email: "ada@example.com", company: "Firma", message: 'Needs help, "urgently"\nthis week' }]);
});

test("CSV lead validation rejects invalid and duplicate rows while retaining valid rows", () => {
  const result = validateCsvLeads("name,email,company\nAda,ada@example.com,Firma\nDuplicate,ADA@example.com,Firma\nBroken,not-an-email,Firma", ["existing@example.com"]);
  assert.equal(result.leads.length, 1);
  assert.equal(result.leads[0].email, "ada@example.com");
  assert.deepEqual(result.errors.map((error) => error.row), [3, 4]);
});

export {};

const url = process.env.SMOKE_URL;
if (!url) throw new Error('SMOKE_URL is required');

const response = await fetch(url);
const body = await response.text();
if (!response.ok || !body.includes('2026 Knesset election') || !body.includes('Methodology and non-affiliation')) {
  throw new Error(`Smoke check failed (${response.status})`);
}
console.log(`Smoke check passed: ${url}`);

/**
 * Parse the `PROXIMA_REGION_ENDPOINTS` env into a clean `regionId → https URL` map.
 * Tolerates every mis-configuration: absent, malformed JSON, or valid JSON that isn't a
 * plain object (`null`, a number, an array) all yield `{}` rather than throwing — a config
 * typo must never 500 the endpoints route. Non-string or non-https values are dropped so
 * the browser is never handed a mixed-content (http) target.
 */
export function parseEndpoints(rawEnv: string | undefined): Record<string, string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawEnv ?? "{}");
  } catch {
    parsed = {};
  }
  const map =
    parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};

  const endpoints: Record<string, string> = {};
  for (const [id, url] of Object.entries(map)) {
    if (typeof url === "string" && url.startsWith("https://")) endpoints[id] = url;
  }
  return endpoints;
}

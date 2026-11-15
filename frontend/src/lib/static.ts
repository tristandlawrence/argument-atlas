/** Read-only snapshot mode (GitHub Pages). See next.config.ts. */
export const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** Where the browser fetches snapshot JSON from in static mode. */
export const DATA_URL = `${BASE_PATH}/data`;

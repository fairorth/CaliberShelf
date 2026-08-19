import "server-only"

/**
 * Selecting `watch_photos` dimension columns that may not exist yet.
 *
 * Migrations here are applied BY HAND in the Supabase SQL editor (see
 * `supabase/CLAUDE.md`), so a window where the code knows about a column the
 * database has not got is a NORMAL state, not an exceptional one. PostgREST
 * fails the ENTIRE select on one unknown column, so without this the home page
 * empties and every collection tile loses its photograph — a blank app while
 * someone gets round to pasting the SQL.
 *
 * Resolved once per server process: one failed request, then the answer sticks.
 */

/** The 00048 columns, appended to a caller's own column list. */
const DIMENSION_COLUMNS = "image_width, image_height"

/** Postgres `undefined_column`. */
const UNDEFINED_COLUMN = "42703"

let available: boolean | null = null

interface QueryResult<T> {
  data: T[] | null
  error: { code?: string; message?: string } | null
}

/** What the Supabase builder hands back for a dynamically-built column list:
 *  it cannot infer row shapes from a runtime string, so the caller names the
 *  type and this casts once, here, instead of at every call site. */
interface LooseResult {
  data: unknown
  error: { code?: string; message?: string } | null
}

/**
 * Run `select` with the dimension columns appended, falling back to the base
 * columns alone if the database has not got them yet.
 *
 * Any error other than `undefined_column` is returned untouched — a real
 * failure must never be masked by a retry that happens to succeed.
 */
export async function selectWithPhotoDimensions<T>(
  baseColumns: string,
  select: (columns: string) => PromiseLike<LooseResult>
): Promise<QueryResult<T>> {
  const cast = (r: LooseResult): QueryResult<T> => ({
    data: (r.data ?? null) as T[] | null,
    error: r.error,
  })
  if (available !== false) {
    const res = await select(`${baseColumns}, ${DIMENSION_COLUMNS}`)
    if (!res.error) {
      available = true
      return cast(res)
    }
    if (res.error.code !== UNDEFINED_COLUMN) return cast(res)
    available = false
    console.warn(
      "watch_photos has no image_width/image_height — apply migration " +
        "00048_add_photo_dimensions.sql, then run `npm run backfill-photo-dimensions`. " +
        "Until then every frame uses the 3:2 fallback box and sits out aspect comparison."
    )
  }
  return cast(await select(baseColumns))
}

/** Aspect distance from square, or null when the photo is unmeasured. */
export function squareness(
  width: number | null | undefined,
  height: number | null | undefined
): number | null {
  if (!width || !height) return null
  return Math.abs(width / height - 1)
}

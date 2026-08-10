import { z } from "zod"

export const INSPIRATION_NOTE_MAX = 80

/** The short note attached to an inspiration image. */
export const inspirationNoteSchema = z
  .string()
  .trim()
  .max(INSPIRATION_NOTE_MAX, `Note must be ${INSPIRATION_NOTE_MAX} characters or fewer`)

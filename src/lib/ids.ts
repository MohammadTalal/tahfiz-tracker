import { z } from "zod";

/** Any UUID-shaped id (z.guid also accepts non-RFC ids such as seeded fixtures). */
export const idSchema = z.guid();

export function isId(value: unknown): value is string {
  return idSchema.safeParse(value).success;
}

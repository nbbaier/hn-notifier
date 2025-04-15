import { z } from "zod";

export const idSchema = z.object({
	id: z
		.string()
		.regex(/^[0-9]+$/)
		.transform((v) => Number(v)),
});

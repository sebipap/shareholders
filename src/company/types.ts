import { z } from "zod";

export const shareholderSchema = z.object({
	name: z.string(),
	percentage: z.number(),
});

export const metadataSchema = z.object({
	client: z.string(),
	shareholders: z.array(shareholderSchema).nullable(),
	missing_docs: z.boolean(),
});

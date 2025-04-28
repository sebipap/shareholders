import { z } from "zod";

export const shareholderSchema = z.object({
	name: z.string(),
	percentage: z.number(),
});

export const shareholderWithExplanationSchema = shareholderSchema.extend({
	explanation: z.string(),
});

export const metadataSchema = z.object({
	client: z.string(),
	shareholders: z.array(shareholderSchema).nullable(),
	missing_docs: z.boolean(),
});

export type Shareholder = z.infer<typeof shareholderSchema>;
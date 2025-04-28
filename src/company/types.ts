import { z } from 'zod';

export const shareholderSchema = z.object({
  name: z.string(),
  percentage: z.number().nullable(),
});

export const shareholderWithExplanationSchema = shareholderSchema.extend({
  explanation: z.string(),
});

export const metadataSchema = z.object({
  client: z.string(),
  shareholders: z.array(shareholderSchema).nullable(),
  missing_docs: z.boolean(),
});

export const companyEquitySchema = z.object({
  company: z.string(),
  shareholders: z.array(shareholderSchema),
});

export const companiesWithConfidenceSchema = z.object({
  companies: z.array(companyEquitySchema),
  confidence: z
    .number()
    .describe('The confidence score of the answer, between 0 and 1'),
});

export type CompaniesWithConfidence = z.infer<
  typeof companiesWithConfidenceSchema
>;

export type Shareholder = z.infer<typeof shareholderSchema>;

export type CompanyEquity = z.infer<typeof companyEquitySchema>;

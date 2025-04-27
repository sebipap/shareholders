import { z } from "zod";
import { askPdfs } from "../lib/ai";
import { directoryContent, fileToObject } from "../lib/file";
import { average } from "../lib/math";
import { metadataSchema, shareholderSchema } from "./types";

export default async function analyzeAllCompanies() {
	const companies = directoryContent(['data']);
	const accuracies = await Promise.all([companies[0]].map(shareholderDetectionAccuracy))
	return average(accuracies)
}

async function shareholderDetectionAccuracy(company: string) {
	const { client, shareholders } = fileToObject(['data', company, "metadata.json"], metadataSchema);
	const docs = directoryContent(['data', company, "docs"]);
	const shareholdersFromDocs = await inferShareholders(docs, company);

	console.log(JSON.stringify(shareholdersFromDocs, null, 2))

	// TODO: add recursive equity holders logic
	// 3. Compare your extracted shareholders and percentages with the `shareholders` in `metadata.json`.
	// 4. Calculate an accuracy score for each company (e.g., percentage of correct shareholders).
	// 5. Output the average accuracy score across all companies.

	const accuracy = 0 // TODO

	return accuracy
}

async function inferShareholders(docs: string[], company: string) {
	return askPdfs({
		question: `Read the documents in to find shareholder information for the company ${company}. Extract shareholders who are people (not companies). The sum of the percentages should not exceed 100% and can be lower, given that we are only counting human shareholders.`,
		schema: z.object({
			shareholders: z.array(shareholderSchema),
			confidence: z.number().describe('The confidence score of the answer, between 0 and 1'),
		}),
		docs,
		company,
	});
}

import { askPdfs } from "../lib/ai";
import { directoryContent, fileToObject } from "../lib/file";
import { average } from "../lib/math";
import { metadataSchema, shareholderSchema } from "./types";

export default async function analyzeAllCompanies() {
	const companies = directoryContent(['data']);
	const accuracies = await Promise.all(companies.map(shareholderDetectionAccuracy))
	return average(accuracies)
}

async function shareholderDetectionAccuracy(company: string) {
	const { client, shareholders } = fileToObject(['data', company, "metadata.json"], metadataSchema);
	const docs = directoryContent(['data', company, "docs"]);
	const shareHoldersFromDocs = await inferShareholders(docs, company);

	// TODO: add recursive equity holders logic
	// 3. Compare your extracted shareholders and percentages with the `shareholders` in `metadata.json`.
	// 4. Calculate an accuracy score for each company (e.g., percentage of correct shareholders).
	// 5. Output the average accuracy score across all companies.

	const accuracy = 0 // TODO

	return accuracy
}

async function inferShareholders(docs: string[], company: string) {
	return askPdfs({
		question: 'Read the documents in to find shareholder information. Extract shareholders who are people (not companies)',
		schema: shareholderSchema,
		docs,
		company,
	});
}

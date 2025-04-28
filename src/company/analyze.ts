import { z } from "zod";
import { askPdf } from "../lib/ai";
import { directoryContent, fileToObject } from "../lib/file";
import { average } from "../lib/math";
import { metadataSchema, shareholderSchema, shareholderWithExplanationSchema, type Shareholder } from "./types";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

const MIN_SHAREHOLDER_PERCENTAGE = 25;

export default async function analyzeAllCompanies() {
	const companies = directoryContent(['data']);
	const accuracies = await Promise.all([companies[2]].map(shareholderDetectionAccuracy))
	return average(accuracies)
}

async function shareholderDetectionAccuracy(companyFolderName: string) {
	const { client, shareholders } = fileToObject(['data', companyFolderName, "metadata.json"], metadataSchema);
	const docs = directoryContent(['data', companyFolderName, "docs"]);
	const shareholdersFromDocs = await inferShareholders(docs, companyFolderName, client);

	const bigShareholders = shareholdersFromDocs.filter(({ percentage }) => percentage > MIN_SHAREHOLDER_PERCENTAGE);

	console.log(`_____${companyFolderName.toUpperCase()}_____`)
	console.log(JSON.stringify({ bigShareholders, shareholders }, null, 2))

	// TODO: add recursive equity holders logic
	// 3. Compare your extracted shareholders and percentages with the `shareholders` in `metadata.json`.
	// 4. Calculate an accuracy score for each company (e.g., percentage of correct shareholders).
	// 5. Output the average accuracy score across all companies.

	const accuracy = calculateAccuracy(shareholders ?? [], bigShareholders)

	console.log(`Accuracy: ${accuracy}`)

	return accuracy
}

async function inferShareholders(docs: string[], companyFolderName: string, client: string) {
	const results = await Promise.all(docs.map(document => askPdf({
		question: `Your goal is to identify every company named in the documents and, for each one, list every shareholder—whether a natural person or another legal entity—together with that shareholder's direct equity percentage.`,
		schema: z.object({
			companies: z.array(z.object({
				company: z.string(),
				shareholders: z.array(shareholderSchema),
			})),
			confidence: z.number().describe('The confidence score of the answer, between 0 and 1'),
		}), document,
		companyFolderName
	})));

	// console.log(JSON.stringify(results, null, 2))



	const { object } = await generateObject({
		model: openai('gpt-4.1'),
		schema: z.object({
			shareholders: z.array(shareholderWithExplanationSchema),
		}),
		system: `
		Given a list of objects with companies (including their shareholders and their percentages) and a confidence score,
		return the closest match to the actual equity holders for the company ${client}.
		Only return values for people shareholders, not companies.
		Have in mind that you may find multiple companies in the documents, and that each company may have multiple shareholders.
		You need to calculate the percentage of the company that each shareholder owns given the recursive equity holders logic.
		If Person A owns 50% of Company B, and Company B owns 50% of Company C, then Person A owns 25% of Company C.
		Also add an explanation of how you came to the conclusion that this is the correct shareholder and percentage.
		`,
		messages: [
			{
				role: 'user',
				content: JSON.stringify(results, null, 2)
			}
		]
	})
	return object.shareholders
}

function normalizeName(name: string) {
	return name.trim().toLowerCase();
}

function calculateAccuracy(truth: Shareholder[], guess: Shareholder[]) {
	// Create a set of unique shareholder names (case-insensitive) present in either list
	const names = new Set<string>([...truth.map(t => normalizeName(t.name)), ...guess.map(g => normalizeName(g.name))]);

	if (names.size === 0) return 1; // No shareholders in either list → perfect match

	let correct = 0;
	const PERCENTAGE_TOLERANCE = 0.5; // percentage points

	for (const name of names) {
		const truthHolder = truth.find(t => normalizeName(t.name) === name);
		const guessHolder = guess.find(g => normalizeName(g.name) === name);

		if (truthHolder && guessHolder) {
			const percentageDiff = Math.abs(truthHolder.percentage - guessHolder.percentage);
			if (percentageDiff <= PERCENTAGE_TOLERANCE) {
				correct++;
			}
		}
	}

	return correct / names.size;
}
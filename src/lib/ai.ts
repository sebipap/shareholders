import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { readFileBase64 } from "./file";

async function askPdf<T extends z.ZodSchema>({ question, schema, document, company }: { question: string, schema: T, document: string, company: string }): Promise<z.infer<T>> {
	console.log({ document, company })
	const { object } = await generateObject({
		model: openai('gpt-4o-mini'),
		schema,
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: question,
					},
					{
						type: 'file',
						filename: document,
						data: `data:application/pdf;base64,${readFileBase64(['data', company, 'docs', document])}`,
						mimeType: 'application/pdf',
					}
				],
			},
		],
	});
	return object;
}

export async function askPdfs<T extends z.ZodSchema>({ question, schema, docs, company }: { question: string, schema: T, docs: string[], company: string }): Promise<z.infer<T>> {



	const results = await Promise.all(docs.map(document => askPdf({ question: `${question}. Also set the confidence score of the answer, between 0 and 1`, schema, document, company })));

	console.log(JSON.stringify(results, null, 2))

	const { object } = await generateObject({
		model: openai('gpt-4o-mini'),
		schema,
		system: `
		You are an expert equity analyst.
		You are given a list of shareholder percentages with different confidence scores.
		You need to extract the equity holders and their percentages, returning the closest match to the actual equity holders.
		`,
		messages: [
			{
				role: 'user',
				content: results.map(result => JSON.stringify(result, null, 2)).join('\n'),
			}
		]
	})
	return object
}
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { readFile } from "./file";

export async function askPdfs({ question, schema, docs, company }: { question: string, schema: z.ZodSchema, docs: string[], company: string }) {
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
					...docs.map(doc => ({
						type: 'file' as const,
						data: readFile(['data', company, 'docs', doc]), // TODO: find a more clever way to read a pdf (raw text is not good enough)
						mimeType: 'application/pdf',
					})),
				],
			},
		],
	});
	return object;
}
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { askPdf } from '../lib/ai';
import { directoryContent, fileToObject } from '../lib/file';
import { average } from '../lib/math';
import { normalizeName } from '../lib/utils';
import {
  accuracyToString,
  actualVsPredictedToString,
  companyEquityToString,
  documentsShareholdersToString,
} from './log';
import {
  companiesShareholdersFromDocumentSchema,
  metadataSchema,
  shareholderWithExplanationSchema,
  type CompaniesShareholdersFromDocument,
  type Shareholder,
} from './types';

const MIN_SHAREHOLDER_PERCENTAGE = 25;

export default async function analyzeAllCompanies() {
  console.log('🔍 Reading companies...');
  const companies = directoryContent(['data']);
  console.log(`🌟Found:\n\t${companies.join('\n\t')}`);
  const accuracies = await Promise.all(
    companies.map(shareholderDetectionAccuracy)
  );
  const averageAccuracy = average(accuracies);
  console.log(accuracyToString(averageAccuracy));
}

async function shareholderDetectionAccuracy(folder: string) {
  console.log(`🔍 Reading company ${folder}...`);

  const companyDirectory = ['data', folder];
  const docs = directoryContent([...companyDirectory, 'docs']);
  const metadata = fileToObject(
    [...companyDirectory, 'metadata.json'],
    metadataSchema
  );
  const shareholders = await shareholdersFromDocs(
    docs,
    folder,
    metadata.client
  );

  const bigShareholders = shareholders.filter(
    ({ percentage }) => percentage && percentage > MIN_SHAREHOLDER_PERCENTAGE
  );

  console.log(
    companyEquityToString({ company: metadata.client, shareholders })
  );

  const accuracy = calculateAccuracy(
    metadata.shareholders ?? [],
    bigShareholders
  );

  console.log(accuracyToString(accuracy));

  return accuracy;
}

function getShareholderFromFile(document: string, companyFolderName: string) {
  return askPdf({
    question: `Your goal is to identify every company named in the documents and, for each one, list every shareholder—whether a natural person or another legal entity—together with that shareholder's direct equity percentage.`,
    schema: companiesShareholdersFromDocumentSchema,
    document,
    companyFolderName,
  });
}

async function ultimateShareholders(
  shareholdersFromDocuments: CompaniesShareholdersFromDocument[],
  client: string
) {
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
        content: JSON.stringify(shareholdersFromDocuments, null, 2),
      },
    ],
  });
  return object.shareholders;
}

async function shareholdersFromDocs(
  docs: string[],
  companyFolderName: string,
  client: string
) {
  const documentsShareholders = await Promise.all(
    docs.map(document => getShareholderFromFile(document, companyFolderName))
  );

  console.log(documentsShareholdersToString(docs, documentsShareholders));
  return ultimateShareholders(documentsShareholders, client);
}

function calculateAccuracy(actual: Shareholder[], predicted: Shareholder[]) {
  // Create a set of unique shareholder names (case-insensitive) present in either list
  const names = new Set<string>([
    ...actual.map(t => normalizeName(t.name)),
    ...predicted.map(g => normalizeName(g.name)),
  ]);

  if (names.size === 0) return 1; // No shareholders in either list → perfect match

  let correct = 0;
  const PERCENTAGE_TOLERANCE = 0.5; // percentage points

  for (const name of names) {
    const actualHolder = actual.find(t => normalizeName(t.name) === name);
    const predictedHolder = predicted.find(g => normalizeName(g.name) === name);

    if (actualHolder?.percentage && predictedHolder?.percentage) {
      const percentageDiff = Math.abs(
        actualHolder.percentage - predictedHolder.percentage
      );
      if (percentageDiff <= PERCENTAGE_TOLERANCE) {
        correct++;
      }
      console.log(actualVsPredictedToString(predictedHolder, actualHolder));
    }
  }

  return correct / names.size;
}

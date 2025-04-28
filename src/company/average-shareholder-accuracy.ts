import { z } from 'zod';
import { askObject, askPdf } from '../lib/ai';
import { directoryContent, fileToObject } from '../lib/file';
import { average } from '../lib/math';
import { normalizeName } from '../lib/utils';
import {
  accuracyToString,
  actualVsPredictedToString,
  companyEquityToString,
  docsShareholdersToString,
} from './log';
import {
  companiesWithConfidenceSchema,
  metadataSchema,
  shareholderWithExplanationSchema,
  type CompaniesWithConfidence,
  type Shareholder,
} from './types';

const MIN_SHAREHOLDER_PERCENTAGE = 25;

export default async function averageShareholderAccuracy() {
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
  const documents = directoryContent([...companyDirectory, 'docs']);
  const metadata = fileToObject(
    [...companyDirectory, 'metadata.json'],
    metadataSchema
  );
  const { shareholders } = await shareholdersFromDocs(
    documents,
    folder,
    metadata.client
  );

  const relevantShareholders = shareholders.filter(
    ({ percentage }) => percentage && percentage > MIN_SHAREHOLDER_PERCENTAGE
  );

  console.log(
    companyEquityToString({ company: metadata.client, shareholders })
  );

  const accuracy = calculateAccuracy(
    metadata.shareholders ?? [],
    relevantShareholders
  );

  console.log(accuracyToString(accuracy));

  return accuracy;
}

function shareholdersFromFile(document: string, companyFolderName: string) {
  return askPdf({
    question: `Your goal is to identify every company named in the documents and, for each one, list every shareholder—whether a natural person or another legal entity—together with that shareholder's direct equity percentage.`,
    schema: companiesWithConfidenceSchema,
    document,
    companyFolderName,
  });
}

async function ultimateShareholders(
  shareholdersFromDocuments: CompaniesWithConfidence[],
  client: string
) {
  return askObject({
    object: shareholdersFromDocuments,
    question: `
		Given a list of objects with companies (including their shareholders and their percentages) and a confidence score,
		return the closest match to the actual equity holders for the company ${client}.
		  Only return values for people shareholders, not companies.
		Have in mind that you may find multiple companies in the documents, and that each company may have multiple shareholders.
		You need to calculate the percentage of the company that each shareholder owns given the recursive equity holders logic.
		If Person A owns 50% of Company B, and Company B owns 50% of Company C, then Person A owns 25% of Company C.
		`,
    schema: z.object({
      shareholders: z.array(shareholderWithExplanationSchema),
    }),
  });
}

async function shareholdersFromDocs(
  documents: string[],
  companyFolderName: string,
  client: string
) {
  // const documentsShareholders = await Promise.all(
  //   documents.map(document => shareholdersFromFile(document, companyFolderName))
  // );

  let documentsShareholders: CompaniesWithConfidence[] = [];

  for (const document of documents) {
    const fromFile = await shareholdersFromFile(document, companyFolderName);
    documentsShareholders.push(fromFile);
  }

  console.log(docsShareholdersToString(documents, documentsShareholders));

  return ultimateShareholders(documentsShareholders, client);
}

function calculateAccuracy(actual: Shareholder[], predicted: Shareholder[]) {
  const names = new Set<string>([
    ...actual.map(t => normalizeName(t.name)),
    ...predicted.map(g => normalizeName(g.name)),
  ]);

  if (names.size === 0) return 1;

  let correct = 0;
  const PERCENTAGE_TOLERANCE = 0.5;

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

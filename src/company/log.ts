import type { CompaniesShareholdersFromDocument, Shareholder } from './types';

import type { CompanyEquity } from './types';

export function companyEquityToString(c: CompanyEquity) {
  return `🏛️ - ${c.company}:\n\t\t${c.shareholders
    .map(s => `👤${s.name}: ${s.percentage}%`)
    .join('\n\t\t')}`;
}

export function documentsShareholdersToString(
  docs: string[],
  shareholdersFromDocuments: CompaniesShareholdersFromDocument[]
) {
  return shareholdersFromDocuments
    .map(
      (r, i) =>
        `📁${docs[i]}:\n\t${r.companies
          .map(companyEquityToString)
          .join('\n\t')}`
    )
    .join('\n\n');
}

export function accuracyToString(accuracy: number) {
  // render a bar made of emojis
  const bar = '🟩'.repeat(Math.floor(accuracy * 10));
  const empty = '⬜'.repeat(10 - Math.floor(accuracy * 10));
  return `
  Accuracy: ${accuracy * 100}%
  ${bar}${empty}`;
}

export function actualVsPredictedToString(a: Shareholder, b: Shareholder) {
  return `✅ ${a.name}:${a.percentage}% (predicted) - ${
    b.percentage
  }% (actual) = ${Math.abs(a.percentage - b.percentage)}%`;
}

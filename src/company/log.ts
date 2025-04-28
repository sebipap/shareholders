import type { CompaniesWithConfidence, Shareholder } from './types';
import type { CompanyEquity } from './types';

export function companyEquityToString(c: CompanyEquity) {
  return `🏛️ - ${c.company}:\n\t\t${c.shareholders
    .map(s => `👤${s.name}: ${s.percentage}%`)
    .join('\n\t\t')}`;
}

export function docsShareholdersToString(
  documents: string[],
  companiesWithConfidence: CompaniesWithConfidence[]
) {
  return companiesWithConfidence
    .map(
      ({ companies }, index) =>
        `📁${documents[index]}:\n\t${companies
          .map(companyEquityToString)
          .join('\n\t')}`
    )
    .join('\n\n');
}

export function accuracyToString(accuracy: number) {
  const bar = '🟩'.repeat(Math.floor(accuracy * 10));
  const empty = '⬜'.repeat(10 - Math.floor(accuracy * 10));
  return `
  Accuracy: ${accuracy * 100}%
  ${bar}${empty}`;
}

export function actualVsPredictedToString(a: Shareholder, b: Shareholder) {
  return `✅ ${a.name}:${a.percentage}% (predicted) - ${
    b.percentage
  }% (actual) = ${Math.abs((a.percentage || 0) - (b.percentage || 0))}%`;
}

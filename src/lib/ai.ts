import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { readFileBase64 } from './file';

export async function askPdf<T extends z.ZodSchema>({
  question,
  schema,
  document,
  companyFolderName,
}: {
  question: string;
  schema: T;
  document: string;
  companyFolderName: string;
}): Promise<z.infer<T>> {
  console.log(`📁🔍 Reading ${document}...`);
  const { object } = await generateObject({
    model: openai('gpt-4.1'),
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
            data: `data:application/pdf;base64,${readFileBase64([
              'data',
              companyFolderName,
              'docs',
              document,
            ])}`,
            mimeType: 'application/pdf',
          },
        ],
      },
    ],
  });
  console.log(`✅📁 Done reading ${document}`);
  return object;
}

export async function askObject<T extends z.ZodSchema>({
  object,
  question,
  schema,
}: {
  object: any;
  question: string;
  schema: T;
}): Promise<z.infer<T>> {
  const result = await generateObject({
    model: openai('gpt-4.1'),
    schema,
    system: question,
    messages: [
      {
        role: 'user',
        content: JSON.stringify(object, null, 2),
      },
    ],
  });
  return result.object;
}

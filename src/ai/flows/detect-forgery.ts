// src/ai/flows/detect-forgery.ts
'use server';
/**
 * @fileOverview Detects forgery in documents by analyzing structure, text, and image components.
 *
 * - detectForgery - Analyzes a document for potential forgeries.
 * - DetectForgeryInput - The input type for the detectForgery function.
 * - DetectForgeryOutput - The return type for the detectForgery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectForgeryInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectForgeryInput = z.infer<typeof DetectForgeryInputSchema>;

const DetectForgeryOutputSchema = z.object({
  isForged: z.boolean().describe('Whether the document is likely a forgery.'),
  anomalies: z
    .array(z.string())
    .describe('A list of anomalies detected in the document.'),
  confidence: z
    .number()
    .describe(
      'A confidence score (0-1) indicating the likelihood of forgery.'
    ),
});
export type DetectForgeryOutput = z.infer<typeof DetectForgeryOutputSchema>;

export async function detectForgery(input: DetectForgeryInput): Promise<DetectForgeryOutput> {
  return detectForgeryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectForgeryPrompt',
  input: {schema: DetectForgeryInputSchema},
  output: {schema: DetectForgeryOutputSchema},
  prompt: `You are an expert in document forgery detection. Analyze the provided document for inconsistencies and signs of forgery.

Document: {{media url=documentDataUri}}

Consider the document's structure, text, and image components. Identify any anomalies that suggest potential manipulation or fraud.

Output your findings in JSON format, including a boolean indicating whether the document is likely a forgery, a list of detected anomalies, and a confidence score (0-1).`,
});

const detectForgeryFlow = ai.defineFlow(
  {
    name: 'detectForgeryFlow',
    inputSchema: DetectForgeryInputSchema,
    outputSchema: DetectForgeryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

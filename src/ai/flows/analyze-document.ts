'use server';

/**
 * @fileOverview Document analysis AI agent.
 *
 * - analyzeDocument - A function that handles the document analysis process.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentType: z.string().describe('The type of the document being analyzed.'),
  description: z.string().optional().describe('Optional description of the document.'),
});
export type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;

const AnomalySchema = z.object({
  anomalyType: z.string().describe('The type of anomaly detected.'),
  description: z.string().describe('A detailed description of the anomaly.'),
  location: z.string().optional().describe('The location of the anomaly in the document, if applicable.'),
  severity: z.enum(['low', 'medium', 'high']).describe('The severity of the anomaly.'),
});

const AnalyzeDocumentOutputSchema = z.object({
  isAuthentic: z.boolean().describe('Whether the document is likely authentic.'),
  anomalies: z.array(AnomalySchema).describe('A list of anomalies detected in the document.'),
  summary: z.string().describe('A summary of the analysis.'),
});
export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

export async function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentOutput> {
  return analyzeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an expert in document verification and forgery detection. Analyze the provided document to identify any potential anomalies or signs of forgery.

  Document Type: {{{documentType}}}
  Description: {{{description}}}
  Document: {{media url=documentDataUri}}

  Based on your analysis, determine if the document is likely authentic and provide a list of any anomalies detected. Each anomaly should include a type, description, location (if applicable), and severity.
  Finally, provide a summary of your analysis.
  Ensure that the anomalies list conforms to the schema, providing a description of the anomaly, the anomalyType, and the severity (low, medium, or high). If location is applicable, that should also be included.

  Output in JSON format.`, 
});

const analyzeDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

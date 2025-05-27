
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
  anomalyType: z.string().describe('The type of anomaly detected (e.g., "Signature Mismatch", "Altered Text", "Font Inconsistency", "Image Manipulation", "Unusual Layout").'),
  description: z.string().describe('A detailed description of the anomaly and why it is suspicious.'),
  location: z.string().optional().describe('The specific location or section of the anomaly in the document, if applicable (e.g., "Page 2, Signature Area", "Header Section").'),
  severity: z.enum(['low', 'medium', 'high']).describe('The assessed severity of the anomaly, indicating its likelihood of being part of a forgery.'),
});

const AnalyzeDocumentOutputSchema = z.object({
  isAuthentic: z.boolean().describe('A boolean indicating whether the document is likely authentic. This should be false if significant anomalies are found.'),
  anomalies: z.array(AnomalySchema).describe('A list of anomalies detected in the document. Even if the document is deemed authentic, list any minor irregularities.'),
  summary: z.string().describe('A concise summary of the analysis, highlighting key findings and the overall authenticity assessment.'),
});
export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

export async function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentOutput> {
  return analyzeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an expert forensic document examiner with a specialization in detecting highly sophisticated forgeries. Your task is to perform a meticulous analysis of the provided document.

  Document Type: {{{documentType}}}
  Description: {{{description}}}
  Document: {{media url=documentDataUri}}

  Instructions for Analysis:
  1.  **Scrutinize with Extreme Detail:** Assume that forgeries can be very subtle. Look for minute inconsistencies that might be overlooked by a standard review.
  2.  **Authenticity Assessment:** Based on your comprehensive analysis, determine if the document is likely authentic. Set 'isAuthentic' to false if there are any medium or high severity anomalies.
  3.  **Anomaly Detection:** Identify and list ALL anomalies, even minor ones. For each anomaly, provide:
      *   \\\`anomalyType\\\`: A specific category (e.g., "Signature Mismatch", "Altered Text", "Font Inconsistency", "Image Manipulation", "Watermark Irregularity", "Unusual Layout", "Metadata Discrepancy" if applicable and detectable from image).
      *   \\\`description\\\`: A detailed explanation of what the anomaly is and why it raises suspicion.
      *   \\\`location\\\`: The precise area in the document where the anomaly is found.
      *   \\\`severity\\\`: Classify the severity as 'low', 'medium', or 'high'. High severity indicates a strong likelihood of forgery.
  4.  **Consider Advanced Techniques:** Be aware of advanced forgery methods, including digital manipulation, pixel-level alterations, font recreation, and subtle background tampering.
  5.  **Cross-Verification (Conceptual):** Although you cannot access external databases, think about what elements would ideally be cross-verified (e.g., official seals, serial numbers, signatures against known exemplars). Mention if an anomaly pertains to such an element.
  6.  **Summary:** Provide a concise summary of your findings, highlighting the most critical observations and your overall conclusion on the document's authenticity.

  Even if a document seems legitimate, your role is to find any indication, however small, that could point to manipulation. Maintain a critical and investigative mindset.
  Output in JSON format according to the defined schema.`,
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

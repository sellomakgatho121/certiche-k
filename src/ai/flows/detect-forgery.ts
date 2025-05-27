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
  isForged: z.boolean().describe('A boolean indicating whether the document is highly likely to be a forgery. This should be true if significant evidence of manipulation is found.'),
  anomalies: z
    .array(z.string())
    .describe('A detailed list of specific anomalies, inconsistencies, or signs of manipulation detected in the document. Each anomaly should be clearly described.'),
  confidence: z
    .number()
    .min(0).max(1)
    .describe(
      'A confidence score (0.0 to 1.0) indicating the likelihood of forgery. A score closer to 1.0 suggests a higher probability of forgery. This should be directly correlated with the severity and number of anomalies found.'
    ),
  forgeryTechniquesSuspected: z
    .array(z.string())
    .optional()
    .describe('A list of potential forgery techniques suspected (e.g., "Digital text alteration", "Signature lifting", "Pixel manipulation", "Font mismatch", "Artificial aging").'),
});
export type DetectForgeryOutput = z.infer<typeof DetectForgeryOutputSchema>;

export async function detectForgery(input: DetectForgeryInput): Promise<DetectForgeryOutput> {
  return detectForgeryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectForgeryPrompt',
  input: {schema: DetectForgeryInputSchema},
  output: {schema: DetectForgeryOutputSchema},
  prompt: `You are a world-renowned forensic document examiner with unparalleled expertise in identifying even the most sophisticated forgeries. Your task is to conduct an exhaustive analysis of the provided document to uncover any signs of forgery or manipulation. Adopt a highly critical and investigative stance.

Document: {{media url=documentDataUri}}

Analysis Instructions:
1.  **Assume Sophistication:** Do not assume the forgery is amateur. Look for signs of advanced techniques, including:
    *   Digital alteration: Pixel inconsistencies, cloning artifacts, compression differences, unnatural edges.
    *   Text manipulation: Inconsistent kerning, baseline shifts, font mismatches (even subtle), superimposed text.
    *   Signature/Handwriting issues: Tremors (unnatural), patched or overwritten strokes, lifted signatures, unnatural pen pressure (if discernible).
    *   Image/Seal tampering: Distortions, blurring around official seals or logos, inconsistent lighting.
    *   Structural anomalies: Misalignments, unusual spacing, deviations from expected document templates.
2.  **Identify Anomalies:** Detail every suspicious element or inconsistency. For each anomaly, explain why it is indicative of potential forgery.
3.  **Assess Forgery Likelihood:** Based on the evidence, determine if the document is 'isForged'. This should be true if compelling evidence of manipulation is found.
4.  **Confidence Score:** Provide a 'confidence' score from 0.0 (no evidence of forgery) to 1.0 (conclusive evidence of forgery). This score must reflect the strength and number of detected anomalies. A document with several medium-to-high severity anomalies should have a high confidence score.
5.  **Suspected Techniques:** If forgery is suspected, list potential 'forgeryTechniquesSuspected' based on the observed anomalies.

Your goal is to be exceptionally thorough. Do not dismiss minor irregularities, as they can be part of a larger deceptive pattern.
Output your findings strictly in JSON format, adhering to the defined schema.
`,
});

const detectForgeryFlow = ai.defineFlow(
  {
    name: 'detectForgeryFlow',
    inputSchema: DetectForgeryInputSchema,
    outputSchema: DetectForgeryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure confidence is within 0-1 range, default to 0 if undefined
    if (output && typeof output.confidence !== 'number') {
        output.confidence = 0;
    } else if (output && output.confidence < 0) {
        output.confidence = 0;
    } else if (output && output.confidence > 1) {
        output.confidence = 1;
    }
    return output!;
  }
);


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
  isForged: z.boolean().describe('A boolean indicating whether the document is highly likely to be a forgery. This should be true if significant evidence of manipulation is found, or if critical areas cannot be verified due to severe image quality issues.'),
  anomalies: z
    .array(z.string())
    .describe('A detailed list of specific anomalies, inconsistencies, or signs of manipulation detected in the document. Each anomaly should be clearly described. Note if an anomaly is likely a benign scan artifact or if multiple documents are present.'),
  confidence: z
    .number()
    .min(0).max(1)
    .describe(
      'A confidence score (0.0 to 1.0) indicating the likelihood of forgery. A score closer to 1.0 suggests a higher probability of forgery. This should be directly correlated with the severity and number of anomalies found, and potentially lowered if image quality hinders full analysis.'
    ),
  forgeryTechniquesSuspected: z
    .array(z.string())
    .optional()
    .describe('A list of potential forgery techniques suspected (e.g., "Digital text alteration", "Signature lifting", "Pixel manipulation", "Font mismatch", "Artificial aging"). Include "Poor scan quality obscuring details" if applicable.'),
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
2.  **Identify Anomalies:** Detail every suspicious element or inconsistency. For each anomaly, explain why it is indicative of potential forgery. If an observation is likely a benign scan artifact (e.g., dust, slight skew), note it as such but still assess its potential to obscure information.
3.  **Assess Forgery Likelihood:** Based on the evidence, determine if the document 'isForged'. This should be true if compelling evidence of manipulation is found. If critical areas are unverifiable due to extremely poor image quality, this may also lead to an 'isForged' conclusion (or very low confidence in authenticity).
4.  **Confidence Score:** Provide a 'confidence' score from 0.0 (no evidence of forgery) to 1.0 (conclusive evidence of forgery). This score must reflect the strength and number of detected anomalies. A document with several medium-to-high severity anomalies should have a high confidence score. If image quality or other factors limit your analysis, this should temper your confidence.
5.  **Suspected Techniques:** If forgery is suspected, list potential 'forgeryTechniquesSuspected' based on the observed anomalies. If poor image quality is a major factor, include "Poor image quality obscuring details" or similar.

Specific Considerations for Scanned Documents and Image Quality:
6.  **Scanned Document Artifacts:** Distinguish between common scanning artifacts (e.g., Moiré patterns, slight skew, scanner bed dust, typical scan resolution, uneven illumination from scanner light) and deliberate manipulation. A document being a scan does not automatically make it forged. Focus on inconsistencies *within* the document content itself that cannot be attributed to the scanning process. List these as anomalies, but clarify if they are likely benign artifacts.
7.  **Multiple Documents in One Image:** If the image appears to contain multiple distinct documents (e.g., an ID card and a driver's license on one scan), note this in your 'anomalies' list or as a general observation. Attempt to assess if anomalies pertain to specific sub-documents or the way they are presented together. Your overall 'isForged' and 'confidence' should reflect the entire image provided.
8.  **Impact of Image Quality:** If aspects like poor lighting, blur, obstructions, low resolution, or extreme angles significantly limit your ability to assess certain features, this *must* be reflected in your 'confidence' score and explicitly mentioned in the 'anomalies' list (e.g., "Details in photo area obscured by glare"). If the quality is too poor to make a reliable judgment on critical elements, state this clearly. Do not jump to a "forged" conclusion if the evidence is simply obscured by poor image quality, but acknowledge that authenticity cannot be confirmed.
9.  **Angle and Lighting:** Specifically address if the angle of the scan/photo or poor/uneven lighting introduces distortions, shadows, or reflections that could be misinterpreted as tampering or could obscure genuine features. Explain how these factors affect your analysis.

Your goal is to be exceptionally thorough. Do not dismiss minor irregularities without consideration, as they can be part of a larger deceptive pattern. Clearly articulate the reasons for your assessment.
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
    // Ensure confidence is within 0-1 range, default to 0 if undefined or invalid
    if (output && (typeof output.confidence !== 'number' || isNaN(output.confidence))) {
        output.confidence = 0;
    } else if (output && output.confidence < 0) {
        output.confidence = 0;
    } else if (output && output.confidence > 1) {
        output.confidence = 1;
    }
    return output!;
  }
);


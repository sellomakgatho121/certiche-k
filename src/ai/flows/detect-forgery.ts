
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
  isForged: z.boolean().describe('A boolean indicating whether the document is highly likely to be a forgery. This should be true ONLY if specific, significant evidence of manipulation is found. It should NOT be true solely due to scan artifacts or poor image quality preventing verification.'),
  anomalies: z
    .array(z.string())
    .describe('A detailed list of specific anomalies, inconsistencies, or signs of manipulation detected in the document. Each anomaly should be clearly described. Differentiate between benign scan artifacts and actual suspicious findings. Note if multiple documents are present or if quality issues limit analysis.'),
  confidence: z
    .number()
    .min(0).max(1)
    .describe(
      'A confidence score (0.0 to 1.0) indicating the likelihood OF THE DOCUMENT BEING FORGED. A score closer to 1.0 suggests high probability of forgery based on strong, direct evidence of manipulation. Common scan artifacts or poor image quality alone (without other indicators of tampering) should result in a LOW confidence score for forgery (e.g., 0.0-0.3). If analysis is limited by quality, confidence in any assessment will be low; reflect this by keeping forgery confidence low unless manipulation is evident.'
    ),
  forgeryTechniquesSuspected: z
    .array(z.string())
    .optional()
    .describe('A list of potential forgery techniques suspected (e.g., "Digital text alteration", "Signature lifting"). Include "Poor image quality obscuring details" if applicable, but this alone should not imply forgery.'),
});
export type DetectForgeryOutput = z.infer<typeof DetectForgeryOutputSchema>;

export async function detectForgery(input: DetectForgeryInput): Promise<DetectForgeryOutput> {
  return detectForgeryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectForgeryPrompt',
  input: {schema: DetectForgeryInputSchema},
  output: {schema: DetectForgeryOutputSchema},
  prompt: `You are a world-renowned forensic document examiner with unparalleled expertise in identifying even the most sophisticated forgeries. Your task is to conduct an exhaustive analysis of the provided document to uncover any signs of forgery or manipulation. Adopt a highly critical and investigative stance, but be precise in distinguishing between capture artifacts and deliberate forgery.

Document: {{media url=documentDataUri}}

Analysis Instructions:
1.  **Assume Sophistication:** Do not assume the forgery is amateur. Look for signs of advanced techniques related to the document's content and structure.
2.  **Identify Anomalies:** Detail every suspicious element or inconsistency. For each anomaly, explain why it is indicative of potential forgery. If an observation is likely a benign scan artifact (see point 6), note it as such and clarify it does NOT, on its own, indicate forgery.
3.  **Assess Forgery Likelihood:** Based on concrete evidence of manipulation, determine if the document \`isForged\`. **\`isForged\` should ONLY be true if there are specific, identifiable signs of forgery related to the document's content or structure.** If critical areas are unverifiable due to extremely poor image quality *without other direct evidence of forgery*, \`isForged\` should be \`false\`, and the \`confidence\` score should reflect low certainty in *either* authenticity or forgery (e.g., a confidence score closer to 0.5 or lower if assessing forgery likelihood). The \`anomalies\` list must detail the quality issues preventing verification.
4.  **Confidence Score:** Provide a \`confidence\` score (0.0 to 1.0) indicating the likelihood OF THE DOCUMENT BEING FORGED. A score closer to 1.0 suggests a high probability of forgery, based on *strong, direct evidence of manipulation*. A score closer to 0.0 suggests no direct evidence of forgery was found. **Common scan artifacts or poor image quality alone (without other specific indicators of tampering) should result in a LOW confidence score for forgery (e.g., 0.0-0.3).** If analysis is severely limited by quality, the confidence in *any* assessment (forged or not) will be low; reflect this by keeping the forgery confidence score low unless active manipulation is evident. The primary driver for a high confidence score must be the severity and number of *content-based* anomalies, not just scan issues.
5.  **Suspected Techniques:** If forgery is suspected based on content manipulation, list potential \`forgeryTechniquesSuspected\`. If poor image quality is a major factor obscuring details, this can be noted, but it does not equate to a suspected forgery technique on its own.

Specific Considerations for Scanned Documents and Image Quality:
6.  **Scanned Document Artifacts:** It is imperative to distinguish between common, benign scanning artifacts and deliberate manipulation. Common artifacts include Moiré patterns, slight skew, scanner bed dust, typical scan resolution limitations, and uneven illumination. **These artifacts, in isolation, are NOT signs of forgery and should not contribute to an \`isForged\` conclusion or a high \`confidence\` score for forgery.** Focus your analysis on inconsistencies *within the document's content itself* that cannot be reasonably attributed to a standard scanning process. If you list scan artifacts, clearly state they are likely benign characteristics of scanning unless there's specific evidence to the contrary (e.g., obscuring information in a way that suggests intent).
7.  **Multiple Documents in One Image:** If the image appears to contain multiple distinct documents, note this. Attempt to assess if anomalies pertain to specific sub-documents or the way they are presented together. Your overall \`isForged\` and \`confidence\` should reflect the entire image, focusing on evidence of tampering in any part.
8.  **Impact of Image Quality:** If aspects like poor lighting, blur, obstructions, low resolution, or extreme angles significantly limit your ability to assess critical features, this *must* be documented in the \`anomalies\` list and significantly lower your \`confidence\` score for forgery. **Do NOT conclude \`isForged\` simply because image quality is poor.** Instead, report that authenticity of certain features (or the document overall) cannot be reliably confirmed due to these issues. The \`forgeryTechniquesSuspected\` field can include "Poor image quality obscuring details," but this should not be the sole basis for a high forgery confidence. Your primary goal is to detect active manipulation, not to penalize for imperfect image capture if no such manipulation is evident.
9.  **Angle and Lighting:** Specifically address if the angle of the scan/photo or poor/uneven lighting introduces distortions, shadows, or reflections. Explain if these are typical for casual capture or if they seem to deliberately obscure, and how they affect your analysis. Benign capture issues should not lead to a high forgery score.

Your goal is to be exceptionally thorough in finding *actual manipulation*. Do not dismiss minor content irregularities, but clearly differentiate them from benign capture/scan artifacts. Articulate the reasons for your assessment very clearly.
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


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
      "The document image to analyze (may contain multiple documents), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentType: z.string().optional().describe('The type of the document(s) as specified by the user, if any. This helps focus the analysis. If multiple document types are present, this might be a general category or one of the primary types.')
});
export type DetectForgeryInput = z.infer<typeof DetectForgeryInputSchema>;

const DetectForgeryOutputSchema = z.object({
  isForged: z.boolean().describe('A boolean indicating whether any document in the image is highly likely to be a forgery. This should be true ONLY if specific, significant evidence of manipulation is found on any document. It should NOT be true solely due to scan artifacts or poor image quality preventing verification.'),
  anomalies: z
    .array(z.string())
    .describe('A detailed list of specific anomalies, inconsistencies, or signs of manipulation detected in any document(s) within the image. Each anomaly should be clearly described. Differentiate between benign scan artifacts and actual suspicious findings. If multiple documents are present, specify WHICH document the anomaly pertains to (e.g., "Altered text on the ID card", "Irregular signature on the Driver\'s License"). Note if quality issues limit analysis for any specific document.'),
  confidence: z
    .number()
    .min(0).max(1)
    .describe(
      'A confidence score (0.0 to 1.0) indicating the likelihood OF ANY DOCUMENT IN THE IMAGE BEING FORGED. A score closer to 1.0 suggests high probability of forgery based on strong, direct evidence of manipulation on at least one document. Common scan artifacts or poor image quality alone (without other indicators of tampering) should result in a LOW confidence score for forgery (e.g., 0.0-0.3). If analysis is limited by quality, confidence in any assessment will be low; reflect this by keeping forgery confidence low unless manipulation is evident on a document.'
    ),
  forgeryTechniquesSuspected: z
    .array(z.string())
    .optional()
    .describe('A list of potential forgery techniques suspected for any document (e.g., "Digital text alteration on Driver\'s License", "Signature lifting on contract"). Include "Poor image quality obscuring details on ID card" if applicable, but this alone should not imply forgery.'),
  identifiedOrConfirmedDocumentType: z.string().describe('The document type(s) identified or confirmed by the AI. If a single document type was provided by the user and confirmed, list that. If the user did not provide a type, or if multiple documents are detected in the image, list all identified types (e.g., "Driver\'s License, Utility Bill, Passport", or "Unknown Document Type(s)" if identification is not possible).'),
});
export type DetectForgeryOutput = z.infer<typeof DetectForgeryOutputSchema>;

export async function detectForgery(input: DetectForgeryInput): Promise<DetectForgeryOutput> {
  return detectForgeryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectForgeryPrompt',
  input: {schema: DetectForgeryInputSchema},
  output: {schema: DetectForgeryOutputSchema},
  prompt: `You are a world-renowned forensic document examiner with unparalleled expertise in identifying even the most sophisticated forgeries. Your task is to conduct an exhaustive analysis of all provided document(s) in the image to uncover any signs of forgery or manipulation. Adopt a highly critical and investigative stance, but be precise in distinguishing between capture artifacts and deliberate forgery for each document.

Document Image (may contain one or more documents): {{media url=documentDataUri}}
{{#if documentType}}
User-Provided Document Type (may refer to one or all documents if multiple are present): {{{documentType}}}
{{/if}}

Analysis Instructions:

1.  **Document Type Context and Identification (Crucial for Multiple Documents):**
    *   **Multiple Documents Scenario:** If the image appears to contain multiple distinct documents (e.g., an ID card, a driver's license, and a utility bill on the same scan), **your first priority is to try to identify each of these document types.** Populate the \`identifiedOrConfirmedDocumentType\` field with a comma-separated list of all clearly identified types (e.g., "ID Card, Driver's License, Utility Bill"). If exact identification is challenging for some, you can use general terms.
    *   {{#if documentType}}
        **User-Provided Type (Guidance):** The user specified \`{{{documentType}}}\`. If multiple documents are present, this might refer to one primary document or a general category. Use this as guidance, but independently identify all documents. Your \`identifiedOrConfirmedDocumentType\` field should reflect all documents seen.
    *   {{else}}
        **AI Identification Required (Primary Task):** The user has NOT provided a document type. Your first step is to carefully examine the document image and attempt to identify all distinct document types present. Populate the \`identifiedOrConfirmedDocumentType\` field accordingly. If you cannot reliably identify any types, state "Unknown Document Type(s)".
    *   {{/if}}
    *   **Tailor Analysis:** For each document identified (as listed in \`identifiedOrConfirmedDocumentType\`), tailor your subsequent forgery detection steps. Leverage your knowledge of typical layouts, security features, and common forgery techniques specific to *each document type*.

2.  **Forgery Detection Principles (Applied to Each Document):**
    *   **Assume Sophistication:** Do not assume forgery is amateur on any document.
    *   **Identify Anomalies (Link to Specific Document):** Detail every suspicious element or inconsistency. For each anomaly, explain why it is indicative of potential forgery, especially in the context of its identified document type. **Crucially, if multiple documents are present, specify WHICH document the anomaly pertains to in the anomaly description string itself.** If an observation is likely a benign scan artifact, note it as such and clarify it does NOT, on its own, indicate forgery.
    *   **Assess Forgery Likelihood (\`isForged\` - Overall):** Based on concrete evidence of manipulation on *any* document, determine if the submission \`isForged\`. \`isForged\` should ONLY be true if there are specific, identifiable signs of forgery on at least one document. If critical areas are unverifiable due to extremely poor image quality *without other direct evidence of forgery on any document*, \`isForged\` should be \`false\`.
    *   **Confidence Score (\`confidence\` - Overall):** Provide a \`confidence\` score (0.0 to 1.0) indicating the likelihood OF ANY DOCUMENT BEING FORGED. A score closer to 1.0 suggests a high probability of forgery, based on *strong, direct evidence of manipulation on at least one document*. A score closer to 0.0 suggests no direct evidence of forgery was found on any document. Scan artifacts or poor image quality alone (without tampering indicators) should result in a LOW confidence score.
    *   **Suspected Techniques (\`forgeryTechniquesSuspected\` - Link to Specific Document):** If forgery is suspected on any document, list potential \`forgeryTechniquesSuspected\`, specifying the document if possible (e.g., "Digital text alteration on Driver's License").

3.  **Specific Considerations for Scanned Documents and Image Quality (Applied per Document Context):**
    *   **Scanned Document Artifacts:** Distinguish common scanning artifacts (Moiré, skew, dust, resolution limits, uneven illumination) from deliberate manipulation. These artifacts, in isolation, are NOT signs of forgery and should not contribute to an \`isForged\` conclusion or a high \`confidence\` score. Focus on inconsistencies *within each document's content itself*.
    *   **Impact of Image Quality (Per Document):** If poor lighting, blur, obstructions, etc., limit your ability to assess critical features on *any specific document*, document this in the \`anomalies\` list (e.g., "ID Card: Blur obscures microprinting") and significantly lower your \`confidence\` score for forgery if this prevents verification. **Do NOT conclude \`isForged\` simply because image quality is poor for a document.** Report that authenticity of certain features (or the document) cannot be reliably confirmed.
    *   **Angle and Lighting:** Address if angle/lighting introduces distortions or shadows. Explain if these are typical for casual capture or seem to deliberately obscure, and how they affect analysis for each document.

Your goal is to be exceptionally thorough in finding *actual manipulation* on any document present. Do not dismiss minor content irregularities, but clearly differentiate them from benign capture/scan artifacts. Articulate the reasons for your assessment very clearly, referencing specific documents when multiple are involved.
Output your findings strictly in JSON format, adhering to the defined schema. Ensure \`identifiedOrConfirmedDocumentType\` accurately reflects all identified document types in the image.
`,
});

const detectForgeryFlow = ai.defineFlow(
  {
    name: 'detectForgeryFlow',
    inputSchema: DetectForgeryInputSchema,
    outputSchema: DetectForgeryOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    
    if (output && (typeof output.confidence !== 'number' || isNaN(output.confidence))) {
        output.confidence = 0;
    } else if (output && output.confidence < 0) {
        output.confidence = 0;
    } else if (output && output.confidence > 1) {
        output.confidence = 1;
    }

    if (output && typeof output.identifiedOrConfirmedDocumentType !== 'string' || !output.identifiedOrConfirmedDocumentType.trim()) {
        if (input.documentType) {
            output.identifiedOrConfirmedDocumentType = `User specified: ${input.documentType} (AI did not confirm/specify further)`;
        } else {
            output.identifiedOrConfirmedDocumentType = 'Unknown Document Type(s) (AI failed to specify)';
        }
    }
    return output!;
  }
);

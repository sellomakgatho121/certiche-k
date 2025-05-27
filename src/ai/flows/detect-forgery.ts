
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
  isForged: z.boolean().describe('A boolean indicating whether any document in the image is highly likely to be a forgery *based on its content*. This should be true ONLY if specific, significant evidence of *content manipulation* is found on any document. It should NOT be true solely due to scan artifacts or poor image quality preventing *content verification*.'),
  anomalies: z
    .array(z.string())
    .describe('A detailed list of specific anomalies, inconsistencies, or signs of *content manipulation* detected in any document(s) within the image. Each anomaly should be clearly described. Differentiate between benign scan artifacts (which do not affect content integrity) and actual suspicious findings related to *content*. If multiple documents are present, specify WHICH document the anomaly pertains to (e.g., "Altered text on the ID card", "Irregular signature on the Driver\'s License"). Note if quality issues limit *content analysis* for any specific document.'),
  confidence: z
    .number()
    .min(0).max(1)
    .describe(
      'A confidence score (0.0 to 1.0) indicating the likelihood OF ANY DOCUMENT IN THE IMAGE BEING FORGED *based on its content*. A score closer to 1.0 suggests high probability of *content forgery* based on strong, direct evidence of *content manipulation* on at least one document. Common scan artifacts or poor image quality alone (without other indicators of *content tampering*) should result in a LOW confidence score for forgery (e.g., 0.0-0.3). If *content analysis* is limited by quality, confidence in any assessment will be low; reflect this by keeping forgery confidence low unless *content manipulation* is evident on a document.'
    ),
  forgeryTechniquesSuspected: z
    .array(z.string())
    .optional()
    .describe('A list of potential *content forgery techniques* suspected for any document (e.g., "Digital text alteration on Driver\'s License", "Signature lifting on contract"). Include "Poor image quality obscuring *content details* on ID card" if applicable, but this alone should not imply *content forgery*.'),
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
  prompt: `You are a world-renowned forensic document examiner with unparalleled expertise in identifying even the most sophisticated forgeries. Your task is to conduct an exhaustive analysis of all provided document(s) in the image to uncover any signs of *content forgery or manipulation*. Adopt a highly critical and investigative stance, but be precise in distinguishing between capture artifacts and deliberate *content forgery* for each document. **Your primary focus is the integrity of the document's content.**

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
    *   **Tailor Analysis:** For each document identified (as listed in \`identifiedOrConfirmedDocumentType\`), tailor your subsequent *content forgery detection* steps. Leverage your knowledge of typical layouts, security features, and common *content forgery techniques* specific to *each document type*.

2.  **Content Forgery Detection Principles (Applied to Each Document):**
    *   **Assume Sophisticated Content Manipulation:** Do not assume forgery is amateur on any document.
    *   **Identify Anomalies in Content (Link to Specific Document):** Detail every suspicious *content element* or inconsistency. For each anomaly, explain why it is indicative of potential *content forgery*, especially in the context of its identified document type. **Crucially, if multiple documents are present, specify WHICH document the *content anomaly* pertains to in the anomaly description string itself.** If an observation is likely a benign scan artifact that *does not alter or obscure content*, note it as such and clarify it does NOT, on its own, indicate *content forgery*.
    *   **Assess Forgery Likelihood (\`isForged\` - Overall, Based on Content):** Based on concrete evidence of *content manipulation* on *any* document, determine if the submission \`isForged\`. \`isForged\` should ONLY be true if there are specific, identifiable signs of *content forgery* on at least one document. If critical *content areas* are unverifiable due to extremely poor image quality *without other direct evidence of content forgery on any document*, \`isForged\` should be \`false\`. **Base this decision on the presence of manipulated content.**
    *   **Confidence Score (\`confidence\` - Overall, Based on Content):** Provide a \`confidence\` score (0.0 to 1.0) indicating the likelihood OF ANY DOCUMENT BEING FORGED *due to content manipulation*. A score closer to 1.0 suggests a high probability of *content forgery*, based on *strong, direct evidence of content manipulation on at least one document*. A score closer to 0.0 suggests no direct evidence of *content forgery* was found on any document. Scan artifacts or poor image quality alone (without *content tampering* indicators) should result in a LOW confidence score.
    *   **Suspected Content Forgery Techniques (\`forgeryTechniquesSuspected\` - Link to Specific Document):** If *content forgery* is suspected on any document, list potential \`forgeryTechniquesSuspected\`, specifying the document if possible (e.g., "Digital text alteration on Driver's License's content").

3.  **Specific Considerations for Scanned Documents and Image Quality (Relative to Content Verification):**
    *   **Scanned Document Artifacts vs. Content Issues:** Distinguish common scanning artifacts (Moiré, skew, dust, resolution limits, uneven illumination) from deliberate *content manipulation*. These artifacts, in isolation, are NOT signs of *content forgery* and should not contribute to an \`isForged\` conclusion or a high \`confidence\` score if the underlying *content* is legible and appears intact. Focus on inconsistencies *within each document's content itself*.
    *   **Impact of Image Quality on Content Analysis (Per Document):** If poor lighting, blur, obstructions, etc., limit your ability to assess critical *content features* on *any specific document*, document this in the \`anomalies\` list (e.g., "ID Card: Blur obscures microprinted *content*") and significantly lower your \`confidence\` score for forgery if this prevents *content verification*. **Do NOT conclude \`isForged\` simply because image quality is poor for a document if the visible content does not show manipulation.** Report that authenticity of certain *content features* (or the document's *content*) cannot be reliably confirmed.
    *   **Angle and Lighting:** Address if angle/lighting introduces distortions or shadows. Explain if these are typical for casual capture or seem to deliberately obscure *content*, and how they affect *content analysis* for each document.

Your goal is to be exceptionally thorough in finding *actual content manipulation* on any document present. Do not dismiss minor *content irregularities*, but clearly differentiate them from benign capture/scan artifacts. Articulate the reasons for your assessment very clearly, referencing specific documents when multiple are involved, and always prioritizing the *document's content*.
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

    if (output && (typeof output.identifiedOrConfirmedDocumentType !== 'string' || !output.identifiedOrConfirmedDocumentType.trim())) {
        if (input.documentType && input.documentType !== '__AI_IDENTIFY__') {
            output.identifiedOrConfirmedDocumentType = `User specified: ${input.documentType} (AI did not confirm/specify further)`;
        } else {
            output.identifiedOrConfirmedDocumentType = 'Unknown Document Type(s) (AI failed to specify)';
        }
    }
    return output!;
  }
);


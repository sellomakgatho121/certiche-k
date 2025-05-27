
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
  documentType: z.string().optional().describe('The type of the document as specified by the user, if any. This helps focus the analysis.')
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
  identifiedOrConfirmedDocumentType: z.string().describe('The document type identified by the AI if not provided by the user, or the user-provided document type if it was supplied. If identification is not possible or reliable, this can state "Unknown", "Unclear", or "Multiple document types detected".'),
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
{{#if documentType}}
User-Provided Document Type: {{{documentType}}}
{{/if}}

Analysis Instructions:

1.  **Document Type Context and Identification:**
    *   {{#if documentType}}
        **User-Provided Type:** The user has specified the document type as \`{{{documentType}}}\`. You MUST use this information as a primary guide. Leverage your knowledge of \`{{{documentType}}}\` documents, including their typical layouts, security features (e.g., watermarks, holograms, special inks, microprinting for IDs; official letterheads, specific fonts for official letters), common paper types (appearance), expected font styles, and known forgery techniques specific to this type. For example, for a passport, you'd scrutinize MRZ codes, visa stamps, and photo integration. For an invoice, you'd check for consistent branding, plausible line items, and calculations. Populate the \`identifiedOrConfirmedDocumentType\` field in your output with this user-provided type: \`{{{documentType}}}\`.
    *   {{else}}
        **AI Identification Required:** The user has NOT provided a document type. Your first step is to carefully examine the document image and attempt to identify its type (e.g., "Driver's License," "Passport," "Utility Bill," "Invoice," "ID Card," "Contract," "Academic Transcript," "Bank Statement," "Letter," "Receipt," "Other"). Populate the \`identifiedOrConfirmedDocumentType\` field in your output with the type you identify. If you cannot reliably identify a single, clear type (e.g., it's very generic, or multiple distinct documents are present), state "Unknown Document Type", "Unclear Document Type", or "Multiple document types detected" in this field.
    *   {{/if}}
    *   **Tailor Analysis:** Regardless of how the type was determined (user-provided or AI-identified), tailor your subsequent forgery detection steps based on this document type context.

2.  **Forgery Detection Principles:**
    *   **Assume Sophistication:** Do not assume the forgery is amateur. Look for signs of advanced techniques related to the document's content, structure, and (if applicable to the type) security features.
    *   **Identify Anomalies:** Detail every suspicious element or inconsistency. For each anomaly, explain why it is indicative of potential forgery, especially in the context of the identified or provided document type. If an observation is likely a benign scan artifact (see point 7), note it as such and clarify it does NOT, on its own, indicate forgery.
    *   **Assess Forgery Likelihood (\`isForged\`):** Based on concrete evidence of manipulation, determine if the document \`isForged\`. **\`isForged\` should ONLY be true if there are specific, identifiable signs of forgery related to the document's content or structure.** If critical areas are unverifiable due to extremely poor image quality *without other direct evidence of forgery*, \`isForged\` should be \`false\`, and the \`confidence\` score should reflect low certainty. The \`anomalies\` list must detail the quality issues preventing verification.
    *   **Confidence Score (\`confidence\`):** Provide a \`confidence\` score (0.0 to 1.0) indicating the likelihood OF THE DOCUMENT BEING FORGED. A score closer to 1.0 suggests a high probability of forgery, based on *strong, direct evidence of manipulation*. A score closer to 0.0 suggests no direct evidence of forgery was found. **Common scan artifacts or poor image quality alone (without other specific indicators of tampering) should result in a LOW confidence score for forgery (e.g., 0.0-0.3).** If analysis is severely limited by quality, the confidence in *any* assessment (forged or not) will be low; reflect this by keeping the forgery confidence score low unless active manipulation is evident. The primary driver for a high confidence score must be the severity and number of *content-based* anomalies, not just scan issues.
    *   **Suspected Techniques (\`forgeryTechniquesSuspected\`):** If forgery is suspected based on content manipulation, list potential \`forgeryTechniquesSuspected\`. If poor image quality is a major factor obscuring details, this can be noted (e.g., in anomalies), but it does not equate to a suspected forgery technique on its own.

3.  **Specific Considerations for Scanned Documents and Image Quality:**
    *   **Scanned Document Artifacts:** It is imperative to distinguish between common, benign scanning artifacts and deliberate manipulation. Common artifacts include Moiré patterns, slight skew, scanner bed dust, typical scan resolution limitations, and uneven illumination. **These artifacts, in isolation, are NOT signs of forgery and should not contribute to an \`isForged\` conclusion or a high \`confidence\` score for forgery.** Focus your analysis on inconsistencies *within the document's content itself* that cannot be reasonably attributed to a standard scanning process. If you list scan artifacts, clearly state they are likely benign characteristics of scanning unless there's specific evidence to the contrary (e.g., obscuring information in a way that suggests intent).
    *   **Multiple Documents in One Image:** If the image appears to contain multiple distinct documents (e.g., an ID card next to a utility bill), acknowledge this in your \`identifiedOrConfirmedDocumentType\` field (e.g., "Multiple document types detected: ID Card and Utility Bill") and attempt to assess if anomalies pertain to specific sub-documents or the way they are presented together. Your overall \`isForged\` and \`confidence\` should reflect the entire image, focusing on evidence of tampering in any part. If one document appears forged, this may cast doubt on the entire submission.
    *   **Impact of Image Quality:** If aspects like poor lighting, blur, obstructions, low resolution, or extreme angles significantly limit your ability to assess critical features, this *must* be documented in the \`anomalies\` list and significantly lower your \`confidence\` score for forgery. **Do NOT conclude \`isForged\` simply because image quality is poor.** Instead, report that authenticity of certain features (or the document overall) cannot be reliably confirmed due to these issues.
    *   **Angle and Lighting:** Specifically address if the angle of the scan/photo or poor/uneven lighting introduces distortions, shadows, or reflections. Explain if these are typical for casual capture or if they seem to deliberately obscure, and how they affect your analysis. Benign capture issues should not lead to a high forgery score.

Your goal is to be exceptionally thorough in finding *actual manipulation*. Do not dismiss minor content irregularities, but clearly differentiate them from benign capture/scan artifacts. Articulate the reasons for your assessment very clearly.
Output your findings strictly in JSON format, adhering to the defined schema. Ensure \`identifiedOrConfirmedDocumentType\` is populated based on the logic described in point 1.
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
    // Ensure confidence is within 0-1 range, default to 0 if undefined or invalid
    if (output && (typeof output.confidence !== 'number' || isNaN(output.confidence))) {
        output.confidence = 0;
    } else if (output && output.confidence < 0) {
        output.confidence = 0;
    } else if (output && output.confidence > 1) {
        output.confidence = 1;
    }

    // Ensure identifiedOrConfirmedDocumentType is present
    if (output && typeof output.identifiedOrConfirmedDocumentType !== 'string') {
        output.identifiedOrConfirmedDocumentType = input.documentType || 'Unknown Document Type (AI failed to specify)';
    } else if (output && !output.identifiedOrConfirmedDocumentType && input.documentType) {
        output.identifiedOrConfirmedDocumentType = input.documentType;
    }


    return output!;
  }
);

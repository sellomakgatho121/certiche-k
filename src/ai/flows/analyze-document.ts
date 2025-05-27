
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
  documentType: z.string().optional().describe('The type of the document being analyzed, if specified by the user. If multiple document types are present in the image, this might be a general category or one of the primary types. If "None / Let AI Identify" is chosen or left blank, the AI should attempt to identify the document type(s).'),
  description: z.string().optional().describe('Optional description of the document or the set of documents.'),
});
export type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;

const AnomalySchema = z.object({
  anomalyType: z.string().describe('The type of anomaly detected (e.g., "Signature Mismatch", "Altered Text", "Font Inconsistency", "Image Manipulation", "Unusual Layout", "Scan Artifact").'),
  description: z.string().describe('A detailed description of the anomaly and why it is suspicious, or if it is a benign artifact. If an artifact obscures content, specify that verification of that content is hindered.'),
  location: z.string().optional().describe('The specific location or section of the anomaly in the document. If multiple documents are present in the image, specify which document this anomaly pertains to (e.g., "Page 2, Signature Area of Contract", "Driver\'s License: Photo ID area", "Utility Bill: Address Block").'),
  severity: z.enum(['low', 'medium', 'high']).describe('The assessed severity of the anomaly. Benign scan artifacts that DO NOT obscure critical content must be \'low\'. Severity should increase if artifacts *prevent content verification*.'),
});

const AnalyzeDocumentOutputSchema = z.object({
  isAuthentic: z.boolean().describe('A boolean indicating whether the document (or set of documents) is likely authentic. This should be false if significant anomalies are found *in the content* of any of the documents OR if analysis of critical *content* is severely hindered by image quality or *obscuring scan artifacts*, making verification impossible (state this reason clearly in summary). Benign scan artifacts that do not obscure content should NOT lead to `isAuthentic = false`.'),
  anomalies: z.array(AnomalySchema).describe('A list of anomalies detected in the document(s). Even if the document(s) are deemed authentic, list any minor irregularities or benign scan artifacts (as low severity if they don\'t obscure content). If multiple documents are present, ensure anomalies clearly state which document they pertain to.'),
  summary: z.string().describe('A concise summary of the analysis, highlighting key findings for each document if multiple are present, overall authenticity assessment, and crucially, any limitations due to image quality or *obscuring scan artifacts* impacting *content verification*. Explicitly state if low quality or severe artifacts prevent full *content verification* rather than implying content forgery.'),
  identifiedOrConfirmedDocumentType: z.string().describe('The document type(s) identified or confirmed by the AI. If a single document type was provided by the user and confirmed, list that. If the user did not provide a type, or if multiple documents are detected in the image, list all identified types (e.g., "Driver\'s License, Utility Bill, Passport", or "Unknown Document Type" if identification is not possible).'),
});
export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

export async function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentOutput> {
  return analyzeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an expert forensic document examiner with a specialization in detecting highly sophisticated forgeries. Your task is to perform a meticulous analysis of the provided document(s) in the image, **focusing primarily on the document's content and structure.**

  {{#if documentType}}
  User-Provided Document Type (may refer to one or all documents if multiple are present): {{{documentType}}}
  {{else}}
  User-Provided Document Type: None (AI to identify all document types present)
  {{/if}}
  Description: {{{description}}}
  Document Image (may contain one or more documents): {{media url=documentDataUri}}

  Instructions for Analysis:

  1.  **Document Type Context and Identification (Crucial for Multiple Documents):**
      *   **Multiple Documents Scenario:** If the image appears to contain multiple distinct documents (e.g., an ID card, a driver's license, and a utility bill on the same scan), **your first priority is to try to identify each of these document types.** Populate the \`identifiedOrConfirmedDocumentType\` field with a comma-separated list of all clearly identified types (e.g., "ID Card, Driver's License, Utility Bill"). If exact identification is challenging for some, you can use general terms like "Multiple Identification Documents" or "Set of Personal Documents" while still listing specific ones if possible.
      *   {{#if documentType}}
          **User-Provided Type (Guidance):** The user specified \`{{{documentType}}}\`. If multiple documents are present, this might refer to one primary document or a general category. Use this as guidance, but independently identify all documents. Your \`identifiedOrConfirmedDocumentType\` field should reflect all documents seen and confirmed.
      *   {{else}}
          **AI Identification Required (Primary Task):** The user has NOT provided a document type. Your first step is to carefully examine the document image and attempt to identify all distinct document types present. Populate the \`identifiedOrConfirmedDocumentType\` field accordingly. If you cannot reliably identify any types, state "Unknown Document Type(s)".
      *   {{/if}}

  2.  **Leverage Identified/Confirmed Document Type(s):** For each document identified (as listed in \`identifiedOrConfirmedDocumentType\`), you MUST tailor your analysis. Consider specific expected *content*, features, layouts, security elements (if applicable, like holograms for IDs), common content, typical paper/font styles, and known areas of scrutiny for *each specific document type*.
      *   For example, if you identify a "Passport," a "Driver's License," AND a "Utility Bill":
          *   Passport/Driver's License: Scrutinize photo integration, holographic overlays, MRZ codes, microprinting, data consistency (birth date vs. issue/expiry).
          *   Utility Bill: Check company branding, consistent layouts for addresses/account numbers, font usage for alterations of *content*.
      *   If \`identifiedOrConfirmedDocumentType\` lists multiple types, your analysis must address each.

  3.  **Scrutinize Content with Extreme Detail:** Assume that forgeries can be very subtle. Look for minute inconsistencies in *each document's content and structure*.

  4.  **Authenticity Assessment (\`isAuthentic\` - Overall and Per Document if Possible):** Based on your comprehensive analysis of all documents, determine overall authenticity. Set \`isAuthentic\` to \`false\` if any document has medium/high severity anomalies *indicative of content forgery or significant content discrepancies*. If image quality OR **severe scan artifacts** severely hinders analysis of critical *content features* on *any* document, making content verification impossible, set \`isAuthentic\` to \`false\` and clearly state in the summary that this is due to *inability to verify that specific document's content due to obstruction/quality*, not a confirmed content forgery. **Your primary basis for \`isAuthentic\` should be the integrity of the document's content. Benign scan artifacts that DO NOT obscure content should NOT lead to \`isAuthentic = false\`.**

  5.  **Anomaly Detection (Link to Specific Document):** Identify and list ALL anomalies for ALL documents, focusing on those related to *content and structure*. For each anomaly:
      *   \`anomalyType\`: Specific category (e.g., "Signature Mismatch", "Altered Text", "Font Inconsistency", "Image Manipulation", "Scan Artifact").
      *   \`description\`: Detailed explanation. If it's a common scan artifact that *does not obscure or alter content*, explain its benign nature and confirm it does not prevent content verification. If an artifact *does* obscure content, state what content is obscured and that its verification is hindered.
      *   \`location\`: **Crucially, if multiple documents are present, specify WHICH document the anomaly pertains to** (e.g., "Driver's License: Signature Area", "Utility Bill: Date Field", "Top-left Document: Watermark").
      *   \`severity\`: 'low', 'medium', or 'high'. Benign scan artifacts *not impacting content assessment or obscuring critical content* **must** be 'low'. Severity should only increase if the artifact significantly obscures critical content, preventing its verification.

  6.  **Consider Advanced Content Manipulation Techniques:** Be aware of advanced forgery methods relevant to the identified document types and their *content*.

  7.  **Cross-Verification (Conceptual):** Note *content elements* that would ideally be cross-verified for each document.

  Specific Considerations for Scanned Documents and Image Quality (Relative to Content):
  8.  **Scanned Document Artifacts vs. Content Issues:** Differentiate benign scanning artifacts (skew, dust, minor shadows, moiré patterns, resolution limits, uneven lighting) from actual *content manipulation*. **These common artifacts, by themselves, are NOT indicators of forgery and should NOT lead to an \`isAuthentic = false\` conclusion if the underlying *content* is clear and consistent and can be verified.** Focus analysis on inconsistencies *within each document's content itself* not attributable to scanning. Prioritize looking for inconsistencies *within the document's content itself* rather than over-penalizing the medium (the scan). Only flag scan-related issues as anomalies if they are unusually pronounced and **actively obscure critical *content information***, or are combined with *content-based suspicions*. Categorize pure scan artifacts that do not obscure content as "Scan Artifact" with 'low' severity. If an artifact *does* obscure content, its severity may be higher, and the description should note the verification limitation.

  9.  **Image Quality Impact on Content Verification (Per Document):** If image quality (poor lighting, angle, blur, low resolution) significantly hinders analysis of critical *content features* of *any specific document*, state this in your summary and anomaly descriptions (linking the quality issue to the affected document). Detail obscured *content areas*. Do NOT conclude a document is inauthentic solely due to poor image quality preventing *content verification*. If *content analysis* of a document is severely hindered by quality, this contributes to overall \`isAuthentic\` being \`false\` due to inability to verify its *content*.

  10. **Summary (Address All Documents and Content Focus):** Provide a concise summary. If multiple documents were analyzed, briefly summarize *content findings* for each. Highlight critical *content observations*, your overall authenticity conclusion (considering all \`identifiedOrConfirmedDocumentType\`s), and explicitly mention limitations regarding *content verification* due to image quality or **severe, obscuring scan artifacts**. If authenticity of any document's *content* cannot be confirmed due to quality or obstruction, state this clearly.

  Even if documents seem legitimate, find any indication of *content manipulation*. Maintain a critical mindset but differentiate clearly between capture artifacts (especially scan artifacts that don't obscure content) and deliberate *content forgery* for each document.
  Output in JSON format. Ensure \`identifiedOrConfirmedDocumentType\` accurately reflects all identified document types in the image.`,
});

const analyzeDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);

    if (output && (typeof output.identifiedOrConfirmedDocumentType !== 'string' || !output.identifiedOrConfirmedDocumentType.trim())) {
      // If AI fails to specify, or returns empty, use user input or mark as unknown
      if (input.documentType && input.documentType !== '__AI_IDENTIFY__') {
        output.identifiedOrConfirmedDocumentType = `User specified: ${input.documentType} (AI did not confirm/specify further)`;
      } else {
        output.identifiedOrConfirmedDocumentType = 'Unknown Document Type(s) (AI failed to specify)';
      }
    }
    return output!;
  }
);


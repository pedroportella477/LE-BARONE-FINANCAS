'use server';
/**
 * @fileOverview Suggests a financial category based on payee name, transaction type, and available categories.
 *
 * - suggestCategory - A function that handles the category suggestion.
 * - SuggestCategoryInput - The input type for the suggestCategory function.
 * - SuggestCategoryOutput - The return type for the suggestCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCategoryInputSchema = z.object({
  payeeName: z.string().describe('The name of the payee or payer for the transaction.'),
  transactionType: z.enum(['expense', 'income']).describe('The type of the transaction (expense or income).'),
  availableCategories: z.array(z.string()).describe('A list of available categories for the given transaction type.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
  suggestedCategory: z.string().nullable().describe('The suggested category from the available list, or null if no suitable suggestion is found.'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

export async function suggestCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
  return suggestCategoryFlow(input);
}

const suggestCategoryPrompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: {schema: SuggestCategoryInputSchema},
  output: {schema: SuggestCategoryOutputSchema},
  prompt: `You are a helpful assistant that categorizes financial transactions.
Given the payee/payer name, the transaction type (expense or income), and a list of available categories, suggest the most appropriate category from the list.

Payee/Payer Name: {{{payeeName}}}
Transaction Type: {{{transactionType}}}
Available Categories:
{{#if availableCategories}}
{{#each availableCategories}}
- {{{this}}}
{{/each}}
{{else}}
No categories provided.
{{/if}}

Analyze the Payee/Payer Name. If it clearly matches the purpose of one of the "Available Categories", return that category in the "suggestedCategory" field.
If the Payee/Payer Name is too generic (e.g., "Friend", "Cash", "Payment"), or if no category from the list seems appropriate, or if no available categories are provided, return null in the "suggestedCategory" field.
Only return one of the provided "Available Categories" or null. Do not invent new categories.
Consider the transaction type: if it's an income, suggest an income category; if it's an expense, suggest an expense category if discernible from the name and list.
`,
});

const suggestCategoryFlow = ai.defineFlow(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async (input: SuggestCategoryInput) => {
    if (input.availableCategories.length === 0) {
      return { suggestedCategory: null };
    }
    const {output} = await suggestCategoryPrompt(input);
    // Ensure the suggested category is valid or null
    if (output?.suggestedCategory && !input.availableCategories.includes(output.suggestedCategory)) {
        return { suggestedCategory: null };
    }
    return output || { suggestedCategory: null };
  }
);

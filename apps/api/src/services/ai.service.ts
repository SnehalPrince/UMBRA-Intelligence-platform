import Anthropic from '@anthropic-ai/sdk';
import { redis } from '../lib/redis';
import crypto from 'crypto';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy',
});

export interface AIEnrichmentResult {
  summary: string;
  severityReasoning: string;
  remediation: string[];
  mitreTechniques: string[];
}

export const enrichFinding = async (findingContext: string): Promise<AIEnrichmentResult | null> => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY is not set. Returning mock AI data.');
    return {
      summary: 'Mock AI Summary: This breach exposes critical credentials.',
      severityReasoning: 'Passwords were leaked in plaintext.',
      remediation: ['Force password reset', 'Enable MFA'],
      mitreTechniques: ['T1078 - Valid Accounts'],
    };
  }

  const cacheKey = `ai-enrichment:${crypto.createHash('md5').update(findingContext).digest('hex')}`;
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as AIEnrichmentResult;
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      system: 'You are a cybersecurity analyst. Analyze the following breach context and provide a structured JSON response with summary, severityReasoning, remediation (array of strings), and mitreTechniques (array of strings). Return ONLY valid JSON.',
      messages: [{ role: 'user', content: findingContext }],
    });

    const rawContent = response.content[0];
    let jsonStr = '';

    if ('text' in rawContent) {
      jsonStr = rawContent.text;
    } else {
      throw new Error('Unexpected Anthropic response format');
    }

    // Try to extract JSON if Claude wrapped it in markdown
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const result = JSON.parse(jsonStr) as AIEnrichmentResult;

    // Cache for 30 days
    await redis.setex(cacheKey, 30 * 24 * 60 * 60, JSON.stringify(result));

    return result;
  } catch (error) {
    console.error('AI Enrichment failed:', error);
    return null;
  }
};

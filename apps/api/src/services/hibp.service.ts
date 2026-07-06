import axios from 'axios';

const HIBP_API_KEY = process.env.HIBP_API_KEY;
const HIBP_BASE_URL = 'https://haveibeenpwned.com/api/v3';

export interface HibpBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  AddedDate: string;
  ModifiedDate: string;
  PwnCount: number;
  Description: string;
  LogoPath: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsFabricated: boolean;
  IsSpamList: boolean;
  IsRetired: boolean;
}

export const searchHibpByDomain = async (domain: string): Promise<HibpBreach[]> => {
  if (!HIBP_API_KEY) {
    console.warn('HIBP_API_KEY is not set. Returning mock data.');
    return [
      {
        Name: 'MockBreach',
        Title: 'Mock Data Breach',
        Domain: domain,
        BreachDate: '2023-01-01',
        AddedDate: '2023-01-10T00:00:00Z',
        ModifiedDate: '2023-01-10T00:00:00Z',
        PwnCount: 1500000,
        Description: 'This is a mock breach because the HIBP API key is missing.',
        LogoPath: '',
        DataClasses: ['Email addresses', 'Passwords', 'Names'],
        IsVerified: true,
        IsFabricated: false,
        IsSpamList: false,
        IsRetired: false,
      },
    ];
  }

  try {
    const response = await axios.get<HibpBreach[]>(`${HIBP_BASE_URL}/breaches?domain=${domain}`, {
      headers: {
        'hibp-api-key': HIBP_API_KEY,
        'user-agent': 'UMBRA-Threat-Intel',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`HIBP lookup failed for domain ${domain}:`, error);
    return [];
  }
};

export const calculateRiskScore = (breach: HibpBreach): { score: number; severity: string } => {
  let score = 0;
  
  if (breach.PwnCount > 1000000) score += 40;
  else if (breach.PwnCount > 100000) score += 20;
  else score += 10;

  if (breach.DataClasses.includes('Passwords') || breach.DataClasses.includes('Credit cards')) {
    score += 50;
  } else if (breach.DataClasses.includes('Email addresses')) {
    score += 20;
  }

  // Cap at 100
  score = Math.min(score, 100);

  let severity = 'low';
  if (score >= 75) severity = 'critical';
  else if (score >= 50) severity = 'high';
  else if (score >= 25) severity = 'medium';

  return { score, severity };
};

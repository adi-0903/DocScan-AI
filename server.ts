import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import pg from 'pg';

const app = express();
const PORT = 3000;

// Middleware to parse large JSON payloads (base64 document images)
app.use(express.json({ limit: '25mb' }));

// PostgreSQL / Neon Database Pool Initialization
let dbPool: pg.Pool | null = null;

function getDbPool(): pg.Pool | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbPool && dbUrl) {
    try {
      dbPool = new pg.Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
      });
      console.log('PostgreSQL / Neon pool created.');
    } catch (err) {
      console.error('Failed to initialize PostgreSQL pool:', err);
    }
  }
  return dbPool;
}

// Automatically create tables on startup if DATABASE_URL is set
async function initDbTables() {
  const pool = getDbPool();
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        plan VARCHAR(50) DEFAULT 'free',
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        file_name VARCHAR(255),
        image_url TEXT,
        is_shared_with_team BOOLEAN DEFAULT FALSE,
        extracted_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('PostgreSQL / Neon database schema verified successfully.');
  } catch (err) {
    console.error('Error creating PostgreSQL tables:', err);
  }
}

// API Endpoint: Check DB Connection Status
app.get('/api/db/status', async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ connected: false, message: 'DATABASE_URL not set in environment.' });
  }
  try {
    await pool.query('SELECT 1');
    return res.json({ connected: true, provider: 'Neon PostgreSQL' });
  } catch (err: any) {
    return res.json({ connected: false, error: err.message });
  }
});

// API Endpoint: Sync Documents with PostgreSQL
app.get('/api/db/documents', async (req, res) => {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, error: 'userId query parameter is required.' });
  }
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, connected: false, documents: [] });
  }
  try {
    const result = await pool.query(
      'SELECT id, user_id as "userId", file_name as "fileName", image_url as "imageUrl", is_shared_with_team as "isSharedWithTeam", extracted_data as "data", created_at as "timestamp" FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.json({ success: true, connected: true, documents: result.rows });
  } catch (err: any) {
    console.error('Error fetching documents from PostgreSQL:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/db/documents', async (req, res) => {
  const { id, userId, fileName, imageUrl, isSharedWithTeam, data } = req.body;
  if (!id || !userId || !data) {
    return res.status(400).json({ success: false, error: 'id, userId, and data are required.' });
  }
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, connected: false, message: 'Saved locally (DB not connected).' });
  }
  try {
    await pool.query(
      `INSERT INTO documents (id, user_id, file_name, image_url, is_shared_with_team, extracted_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         file_name = EXCLUDED.file_name,
         image_url = EXCLUDED.image_url,
         is_shared_with_team = EXCLUDED.is_shared_with_team,
         extracted_data = EXCLUDED.extracted_data`,
      [id, userId, fileName || 'Document', imageUrl || '', isSharedWithTeam || false, JSON.stringify(data)]
    );
    return res.json({ success: true, connected: true });
  } catch (err: any) {
    console.error('Error saving document to PostgreSQL:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/db/documents/:id', async (req, res) => {
  const { id } = req.params;
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, connected: false });
  }
  try {
    await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    return res.json({ success: true, connected: true });
  } catch (err: any) {
    console.error('Error deleting document from PostgreSQL:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/db/documents', async (req, res) => {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, error: 'userId is required.' });
  }
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, connected: false });
  }
  try {
    await pool.query('DELETE FROM documents WHERE user_id = $1', [userId]);
    return res.json({ success: true, connected: true });
  } catch (err: any) {
    console.error('Error clearing documents from PostgreSQL:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/db/reset', async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: true, connected: false, message: 'No remote DB connected. Backend state clean.' });
  }
  try {
    await pool.query('TRUNCATE TABLE documents, users CASCADE');
    console.log('Database tables users and documents reset and truncated successfully.');
    return res.json({ success: true, connected: true, message: 'All backend data and users permanently cleared.' });
  } catch (err: any) {
    console.error('Error resetting PostgreSQL tables:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/db/documents/:id/share', async (req, res) => {
  const { id } = req.params;
  const { isSharedWithTeam } = req.body;
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, connected: false });
  }
  try {
    await pool.query('UPDATE documents SET is_shared_with_team = $1 WHERE id = $2', [isSharedWithTeam, id]);
    return res.json({ success: true, connected: true });
  } catch (err: any) {
    console.error('Error updating sharing status in PostgreSQL:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Lazy initialize GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

const DOCUMENT_EXTRACTION_PROMPT = `You are a document extraction assistant. You will be shown a photo of a physical document (receipt, bill, invoice, business card, or handwritten note).

Your job:
1. Identify the document type: one of ["receipt", "bill", "business_card", "handwritten_note", "other"]
2. Extract the relevant fields based on that type
3. Return ONLY valid JSON — no markdown, no explanation, no extra text

Use this exact schema:

{
  "document_type": "receipt | bill | business_card | handwritten_note | other",
  "vendor_or_sender": "string or null",
  "date": "YYYY-MM-DD or null",
  "amount": "number or null",
  "currency": "string or null (e.g. USD, INR)",
  "due_date": "YYYY-MM-DD or null (only for bills)",
  "category": "string or null (e.g. groceries, utilities, dining, travel, other)",
  "contact_name": "string or null (only for business cards)",
  "contact_phone": "string or null (only for business cards)",
  "contact_email": "string or null (only for business cards)",
  "note_summary": "string or null (only for handwritten notes — a 1 sentence summary)",
  "raw_text": "string (all text you can read from the image, verbatim)",
  "confidence": "high | medium | low"
}

Rules:
- If a field doesn't apply to this document type, set it to null. Don't omit it.
- If the image is blurry or a field is unreadable, set confidence to "low" and null the uncertain fields rather than guessing.
- Dates must be in YYYY-MM-DD format. If the year is missing on the document, infer the most likely year based on context, or use null if you can't tell.
- amount should be a plain number (no currency symbols, no commas) — e.g. 1250.50 not "$1,250.50"
- Return ONLY the JSON object. Nothing before it, nothing after it.`;

const extractionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    document_type: {
      type: Type.STRING,
      enum: ['receipt', 'bill', 'business_card', 'handwritten_note', 'other'],
      description: 'The classified type of document'
    },
    vendor_or_sender: {
      type: Type.STRING,
      nullable: true,
      description: 'Vendor or sender name, or null'
    },
    date: {
      type: Type.STRING,
      nullable: true,
      description: 'Date in YYYY-MM-DD format or null'
    },
    amount: {
      type: Type.NUMBER,
      nullable: true,
      description: 'Plain total amount number or null'
    },
    currency: {
      type: Type.STRING,
      nullable: true,
      description: 'Currency symbol or string (e.g. USD, EUR, INR) or null'
    },
    due_date: {
      type: Type.STRING,
      nullable: true,
      description: 'Due date in YYYY-MM-DD format (only for bills) or null'
    },
    category: {
      type: Type.STRING,
      nullable: true,
      description: 'Category (e.g. groceries, utilities, dining, travel, other) or null'
    },
    contact_name: {
      type: Type.STRING,
      nullable: true,
      description: 'Full contact name (only for business cards) or null'
    },
    contact_phone: {
      type: Type.STRING,
      nullable: true,
      description: 'Contact phone number (only for business cards) or null'
    },
    contact_email: {
      type: Type.STRING,
      nullable: true,
      description: 'Contact email address (only for business cards) or null'
    },
    note_summary: {
      type: Type.STRING,
      nullable: true,
      description: '1 sentence summary (only for handwritten notes) or null'
    },
    raw_text: {
      type: Type.STRING,
      description: 'All text read from the image verbatim'
    },
    confidence: {
      type: Type.STRING,
      enum: ['high', 'medium', 'low'],
      description: 'Confidence level of extraction'
    }
  },
  required: [
    'document_type',
    'vendor_or_sender',
    'date',
    'amount',
    'currency',
    'due_date',
    'category',
    'contact_name',
    'contact_phone',
    'contact_email',
    'note_summary',
    'raw_text',
    'confidence'
  ]
};

// API Endpoint: Document Extraction
app.post('/api/extract', async (req, res) => {
  try {
    const { image, hint } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data URL or base64 string is required.' });
    }

    // Extract base64 and mime type from Data URI
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const parts = image.split(';base64,');
      if (parts.length === 2) {
        mimeType = parts[0].replace('data:', '');
        base64Data = parts[1];
      }
    }

    // Handle SVG mime type if needed or default to image/png for SVG
    if (mimeType.includes('svg')) {
      mimeType = 'image/svg+xml';
    }

    const ai = getGeminiClient();

    let userPrompt = DOCUMENT_EXTRACTION_PROMPT;
    if (hint && typeof hint === 'string' && hint.trim()) {
      userPrompt += `\n\nAdditional user hint/context: ${hint.trim()}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          },
          {
            text: userPrompt
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: extractionResponseSchema,
        temperature: 0.1
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini API returned empty text response.');
    }

    const parsedJson = JSON.parse(textOutput);
    return res.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.error('Error during document extraction:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during document extraction.'
    });
  }
});

// API Endpoint: Refine extraction with user feedback
app.post('/api/refine', async (req, res) => {
  try {
    const { image, currentData, feedback } = req.body;

    if (!feedback || typeof feedback !== 'string') {
      return res.status(400).json({ error: 'Feedback string is required.' });
    }

    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image && image.startsWith('data:')) {
      const parts = image.split(';base64,');
      if (parts.length === 2) {
        mimeType = parts[0].replace('data:', '');
        base64Data = parts[1];
      }
    }

    const ai = getGeminiClient();

    const promptText = `${DOCUMENT_EXTRACTION_PROMPT}

Current extracted JSON:
${JSON.stringify(currentData, null, 2)}

User feedback / correction instructions:
"${feedback}"

Please re-evaluate the document and incorporate the correction into the returned JSON object while preserving all schema rules.`;

    const parts: any[] = [];
    if (base64Data) {
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: extractionResponseSchema,
        temperature: 0.1
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini API returned empty text response.');
    }

    const parsedJson = JSON.parse(textOutput);
    return res.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.error('Error during refine:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to refine document data.'
    });
  }
});

// API Endpoint: Send automated team invite (Direct Link Mode)
app.post('/api/send-invite', async (req, res) => {
  try {
    const { inviteEmail, inviteLink } = req.body;

    if (!inviteEmail) {
      return res.status(400).json({ success: false, error: 'inviteEmail is required.' });
    }

    return res.json({
      success: true,
      provider: 'Direct Link Mode',
      message: 'Direct invite link generated successfully.',
      inviteLink
    });
  } catch (err: any) {
    console.error('Error generating invite link:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to generate invite link' });
  }
});

// Start Express Server with Vite Dev or Static Production
async function startServer() {
  await initDbTables();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Document Extraction Assistant server running on http://localhost:${PORT}`);
  });
}

startServer();

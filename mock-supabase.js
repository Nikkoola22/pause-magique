/**
 * Mock Supabase Server - Simule Supabase localement
 * Pour développement quand pas de connexion Internet
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.SUPABASE_MOCK_PORT || 3001;

// Root route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: system-ui; padding: 2rem; text-align: center;">
        <h1>🎯 Mock Supabase Server</h1>
        <p>Le serveur API fonctionne correctement.</p>
        <p>👉 <strong>L'application principale est sur le port 8080</strong></p>
        <p><a href="http://localhost:8080">Ouvrir l'application</a></p>
      </body>
    </html>
  `);
});

// Mock data storage
const db = {
  profiles: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      username: 'admin',
      full_name: 'Administrator',
      email: 'admin@example.com',
      role: 'admin',
      service: 'Management',
      created_at: new Date().toISOString(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      username: 'john_doe',
      full_name: 'John Doe',
      email: 'john@example.com',
      role: 'employe',
      service: 'IT',
      created_at: new Date().toISOString(),
    },
  ],
  agent_plannings: [],
  leave_requests: []
};

// Helper to get table from URL
const getTable = (req) => {
  const pathParts = req.path.split('/');
  // /rest/v1/tablename -> tablename is at index 3
  return pathParts[3];
};

// Routes REST Supabase
app.get('/rest/v1/', (req, res) => {
  res.json({ version: '1.0', message: 'Supabase Mock API' });
});

// Generic GET handler for tables
app.get('/rest/v1/:table', (req, res) => {
  const tableName = req.params.table;
  
  // Handle specific ID request (e.g. /profiles?id=eq.123)
  // Supabase client sends query params like: id=eq.123
  
  if (!db[tableName]) {
    // Auto-create table if not exists
    db[tableName] = [];
  }

  let results = [...db[tableName]];

  // Simple filtering (very basic implementation of PostgREST syntax)
  Object.keys(req.query).forEach(key => {
    if (key === 'select' || key === 'limit' || key === 'order') return;
    
    const value = req.query[key];
    // Handle "eq." prefix
    if (typeof value === 'string' && value.startsWith('eq.')) {
      const cleanValue = value.substring(3);
      results = results.filter(item => String(item[key]) === cleanValue);
    }
  });

  // Handle single result request (usually client handles this, but good to know)
  
  res.json(results);
});

// Generic POST handler
app.post('/rest/v1/:table', (req, res) => {
  const tableName = req.params.table;
  if (!db[tableName]) db[tableName] = [];
  
  const newItem = {
    id: Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString(),
    ...req.body
  };
  
  db[tableName].push(newItem);
  res.status(201).json([newItem]);
});

// Generic PATCH (Update) handler
app.patch('/rest/v1/:table', (req, res) => {
  const tableName = req.params.table;
  if (!db[tableName]) return res.status(404).json({ error: 'Table not found' });

  // Find item to update based on query params (usually id=eq.XYZ)
  let updatedCount = 0;
  let updatedItems = [];

  const idParam = req.query.id;
  if (idParam && idParam.startsWith('eq.')) {
    const id = idParam.substring(3);
    
    db[tableName] = db[tableName].map(item => {
      if (item.id === id) {
        updatedCount++;
        const updated = { ...item, ...req.body };
        updatedItems.push(updated);
        return updated;
      }
      return item;
    });
  }

  res.json(updatedItems);
});

// Generic DELETE handler
app.delete('/rest/v1/:table', (req, res) => {
  const tableName = req.params.table;
  if (!db[tableName]) return res.status(404).json({ error: 'Table not found' });

  const idParam = req.query.id;
  if (idParam && idParam.startsWith('eq.')) {
    const id = idParam.substring(3);
    const initialLength = db[tableName].length;
    db[tableName] = db[tableName].filter(item => item.id !== id);
    
    if (db[tableName].length < initialLength) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } else {
    res.status(400).json({ error: 'Delete requires ID' });
  }
});

// Auth endpoints
app.post('/auth/v1/token', (req, res) => {
  res.json({
    access_token: 'mock_token_' + Math.random().toString(36).substr(2, 9),
    refresh_token: 'mock_refresh_' + Math.random().toString(36).substr(2, 9),
    user: { id: 'mock_user_id', email: 'test@example.com' },
  });
});

app.post('/auth/v1/signup', (req, res) => {
  res.json({
    user: {
      id: 'mock_user_' + Math.random().toString(36).substr(2, 9),
      email: req.body.email,
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Supabase Mock' });
});

app.listen(PORT, () => {
  console.log(`🎯 Mock Supabase Server running on http://localhost:${PORT}`);
  console.log('   Available endpoints:');
  console.log('   GET  /rest/v1/');
  console.log('   GET  /rest/v1/profiles');
  console.log('   POST /rest/v1/profiles');
  console.log('   POST /auth/v1/token');
  console.log('   GET  /health');
});

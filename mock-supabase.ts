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

// Mock data
const mockProfiles = [
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
];

// Routes REST Supabase
app.get('/rest/v1/', (req, res) => {
  res.json({ version: '1.0', message: 'Supabase Mock API' });
});

// GET profiles
app.get('/rest/v1/profiles', (req, res) => {
  const select = req.query.select as string;
  const limit = parseInt(req.query.limit as string) || mockProfiles.length;

  if (select === 'count()') {
    res.json([{ count: mockProfiles.length }]);
  } else {
    res.json(mockProfiles.slice(0, limit));
  }
});

// GET profiles by ID
app.get('/rest/v1/profiles/:id', (req, res) => {
  const profile = mockProfiles.find(p => p.id === req.params.id);
  if (profile) {
    res.json([profile]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// POST profiles
app.post('/rest/v1/profiles', (req, res) => {
  const newProfile = {
    ...req.body,
    id: Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString(),
  };
  mockProfiles.push(newProfile);
  res.status(201).json([newProfile]);
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

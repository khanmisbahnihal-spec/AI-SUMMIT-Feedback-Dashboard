const session = require('express-session');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '20kb' }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 60 * 1000
  }
}));


const auth = new google.auth.GoogleAuth({
   keyFile:
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, 'credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({
  version: 'v4',
  auth
});

// 1. Check whether the backend is running

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Admin login required.'
  });
}

app.post('/api/admin/login', (req, res, next) => {
  const { password } = req.body;

  if (
    typeof password !== 'string' ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect admin password.'
    });
  }

  req.session.regenerate((err) => {
    if (err) {
      return next(err);
    }

    req.session.isAdmin = true;

    req.session.save((saveError) => {
      if (saveError) {
        return next(saveError);
      }

      res.json({
        success: true,
        message: 'Admin login successful.'
      });
    });
  });
});

app.get('/api/admin/session', (req, res) => {
  res.json({
    authenticated: req.session?.isAdmin === true
  });
});

app.post('/api/admin/logout', (req, res) => {
  if (!req.session) {
    return res.json({ success: true });
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Could not log out.'
      });
    }

    
res.clearCookie('connect.sid', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});


    res.json({ success: true });
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI-SUMMIT backend is running!'
  });
});

// 2. GET: Fetch all feedback for the admin dashboard
app.get('/api/feedback', requireAdmin, async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "'Feedback'!A:E"
    });

    const rows = response.data.values || [];
   

    // Skip the first row because it contains column headings
    const feedback = rows.slice(1).map((row) => ({
      timestamp: row[0] || '',
      name: row[1] || '',
      branch: row[2] || '',
      rating: Number(row[3]) || 0,
      suggestions: row[4] || ''
    }));

    res.json({
      success: true,
      total: feedback.length,
      feedback
    });
  } catch (error) {
    console.error('Feedback fetch failed:', error.message);

    res.status(500).json({
      success: false,
      message: 'Could not load feedback.'
    });
  }
});

// 3. POST: Save new feedback to Google Sheets
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, branch, rating, suggestions } = req.body;

    const allowedBranches = [
      'CS',
      'IT',
      'AI&DS',
      'ENTC',
      'Instru',
      'Electrical'
    ];

    const numericRating = Number(rating);

    if (
      typeof name !== 'string' ||
       name.trim().length === 0 ||
      name.trim().length > 100 ||
      typeof branch !== 'string' ||
      !allowedBranches.includes(branch) ||
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5 ||
      typeof suggestions !== 'string' ||
      suggestions.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please check your feedback details.'
      });
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "'Feedback'!A:E",
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          new Date().toISOString(),
          name.trim(),
          branch,
          numericRating,
          suggestions.trim()
        ]]
      }
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully!'
    });
  } catch (error) {
    console.error('Feedback save failed:', error.message);

    res.status(500).json({
      success: false,
      message: 'Feedback could not be saved. Please try again.'
    });
  }
});

// 4. Start the backend server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});

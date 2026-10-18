
import { useEffect, useState } from 'react';
import './AdminDashboard.css';


const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';


function AdminDashboard() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  async function loadFeedback() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/api/feedback`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        setAuthenticated(false);
        setFeedback([]);
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Could not load feedback.');
      }

      setFeedback(result.feedback || []);
    } catch {
      setError('Feedback load nahi hua. Backend check karo.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch(`${API}/api/admin/session`, {
          credentials: 'include',
        });

        const result = await response.json();

        if (result.authenticated) {
          setAuthenticated(true);
        }
      } catch {
        setError('Backend connect nahi ho raha. Please check it.');
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadFeedback();
    }
  }, [authenticated]);

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    setLoggingIn(true);

    try {
      const response = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed.');
      }

      setPassword('');
      setAuthenticated(true);
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Backend connect nahi ho raha.'
          : err.message
      );
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${API}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setAuthenticated(false);
      setFeedback([]);
      setPassword('');
      setError('');
    }
  }

  if (checkingSession) {
    return (
      <main className="admin-page">
        <section className="login-card">
          <h1>AI-SUMMIT</h1>
          <p>Checking admin session...</p>
        </section>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="admin-page login-page">
        <section className="login-card">
          <div className="login-logo">✦</div>
          <p className="admin-eyebrow">AI-SUMMIT / RESTRICTED ACCESS</p>
          <h1>Admin Login</h1>
          <p className="admin-subtitle">
            Enter your admin password to access feedback analytics.
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="adminPassword">Admin password</label>
            <input
              id="adminPassword"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter admin password"
              required
            />

            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="refresh-btn login-btn"
              type="submit"
              disabled={loggingIn}
            >
              {loggingIn ? 'Signing in...' : 'Sign in securely'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const total = feedback.length;

  const averageRating = total
    ? (
        feedback.reduce((sum, item) => sum + item.rating, 0) / total
      ).toFixed(1)
    : '0.0';

  const branches = ['CS', 'IT', 'AI&DS', 'ENTC', 'Instru', 'Electrical'];

  const branchCounts = branches.map((branch) => ({
    branch,
    count: feedback.filter((item) => item.branch === branch).length,
  }));

  const ratingCounts = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: feedback.filter((item) => item.rating === rating).length,
  }));

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">AI-SUMMIT / ANALYTICS</p>
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">
            Understand your attendees' event experience.
          </p>
        </div>

        <div className="admin-actions">
          <button
            className="refresh-btn"
            onClick={loadFeedback}
            disabled={loading}
          >
            {loading ? 'Loading...' : '↻ Refresh data'}
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {error && <p className="admin-error" role="alert">{error}</p>}

      <section className="kpi-grid">
        <article className="kpi-card">
          <p>Total Responses</p>
          <h2>{loading ? '—' : total}</h2>
          <span>Feedback submissions</span>
        </article>

        <article className="kpi-card">
          <p>Average Rating</p>
          <h2>{loading ? '—' : `${averageRating} / 5`}</h2>
          <span>Overall event rating</span>
        </article>

        <article className="kpi-card">
          <p>Branches Represented</p>
          <h2>
            {loading
              ? '—'
              : branchCounts.filter((item) => item.count > 0).length}
          </h2>
          <span>Branches with responses</span>
        </article>
      </section>

      <section className="analytics-grid">
        <article className="analytics-card">
          <h2>Branch-wise Responses</h2>

          {branchCounts.map((item) => (
            <div className="bar-item" key={item.branch}>
              <div className="bar-label">
                <span>{item.branch}</span>
                <span>{loading ? '—' : item.count}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${total ? (item.count / total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </article>

        <article className="analytics-card">
          <h2>Rating Distribution</h2>

          {ratingCounts.map((item) => (
            <div className="bar-item" key={item.rating}>
              <div className="bar-label">
                <span>{'★'.repeat(item.rating)}</span>
                <span>{loading ? '—' : item.count}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill rating-fill"
                  style={{
                    width: `${
                      total ? (item.count / total) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </article>
      </section>

      <section className="analytics-card recent-card">
        <h2>Recent Feedback</h2>

        {loading ? (
          <p>Loading feedback...</p>
        ) : feedback.length === 0 ? (
          <p>No feedback received yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Branch</th>
                  <th>Rating</th>
                  <th>Suggestions</th>
                </tr>
              </thead>
              <tbody>
                {[...feedback].reverse().map((item, index) => (
                  <tr key={`${item.timestamp}-${index}`}>
                    <td>
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>{item.name || 'Anonymous'}</td>
                    <td>{item.branch}</td>
                    <td>{'★'.repeat(item.rating)}</td>
                    <td>{item.suggestions || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="admin-footer">AI-SUMMIT · Feedback Analytics</p>
    </main>
  );
}

export default AdminDashboard;

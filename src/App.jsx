
import { useState } from 'react';
import './App.css';

function App() {
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [rating, setRating] = useState(0);
  const [suggestions, setSuggestions] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select an event rating.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        'http://localhost:5000/api/feedback',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            branch,
            rating,
            suggestions,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'Feedback could not be saved.'
        );
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Backend connect nahi ho raha. Please check if it is running.'
          : err.message
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setName('');
    setBranch('');
    setRating(0);
    setSuggestions('');
    setError('');
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <main className="page">
        <section className="feedback-card success-card">
          <div className="logo">✦</div>
          <h1>Thank you!</h1>
          <p>Your feedback has been saved successfully.</p>
          <button type="button" onClick={resetForm}>
            Submit another response
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand-icon">✦</div>
        <div>
          <h2>AI-SUMMIT</h2>
          <p>ARTIFICIAL INTELLIGENCE CONFERENCE</p>
        </div>
      </header>

      <section className="feedback-card">
        <span className="eyebrow">EVENT FEEDBACK</span>
        <h1>Share your experience.</h1>
        <p className="intro">
          Help us make our next AI-SUMMIT even better.
          Tell us what you think about the event.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="studentName">
             Your name <span className="required-star">*</span>
          </label>
          <input
            id="studentName"
            type="text"
            placeholder="Enter your name"
            value={name}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
          />

          <label htmlFor="branch">Branch</label>
          <select
            id="branch"
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            required
          >
            <option value="" disabled>
              Select your branch
            </option>
            <option value="CS">CS</option>
            <option value="IT">IT</option>
            <option value="AI&DS">AI&DS</option>
            <option value="ENTC">ENTC</option>
            <option value="Instru">Instru</option>
            <option value="Electrical">Electrical</option>
          </select>

          <label>How would you rate the event?</label>
          <div className="stars" role="group" aria-label="Event rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={star <= rating ? 'star active' : 'star'}
                aria-label={`${star} stars`}
                aria-pressed={rating === star}
                onClick={() => {
                  setRating(star);
                  setError('');
                }}
              >
                ★
              </button>
            ))}
          </div>

          <p className="rating-hint">
            {rating === 0
              ? 'Select a rating from 1 to 5'
              : `${rating} out of 5 stars`}
          </p>

          <label htmlFor="suggestions">Your suggestions</label>
          <textarea
            id="suggestions"
            placeholder="What did you like? What can we improve?"
            rows="4"
            maxLength={2000}
            value={suggestions}
            onChange={(event) =>
              setSuggestions(event.target.value)
            }
          />

          {error && (
            <p role="alert" style={{ color: '#ff7777' }}>
              {error}
            </p>
          )}

          <button
            className="submit-btn"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Saving feedback...' : 'Submit feedback'}
            {!submitting && <span> →</span>}
          </button>
        </form>

        <p className="privacy-note">
          Your feedback helps us build better AI experiences.
        </p>
      </section>
    </main>
  );
}

export default App;

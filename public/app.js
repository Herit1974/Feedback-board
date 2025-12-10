const API_BASE = window.location.origin; // same host

const feedbackListEl = document.getElementById('feedback-list');
const formEl = document.getElementById('feedback-form');
const nameEl = document.getElementById('name');
const messageEl = document.getElementById('message');
const statusEl = document.getElementById('form-status');

async function fetchFeedback() {
  try {
    const res = await fetch(`${API_BASE}/api/feedback`);
    const data = await res.json();
    renderFeedback(data.feedback || []);
  } catch (err) {
    console.error('Failed to load feedback', err);
    statusEl.textContent = 'Failed to load feedback.';
    statusEl.classList.add('error');
  }
}

function renderFeedback(items) {
  feedbackListEl.innerHTML = '';
  if (!items.length) {
    feedbackListEl.innerHTML = '<li class="empty">No feedback yet. Be the first!</li>';
    return;
  }
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'feedback-item';
    li.innerHTML = `
      <div class="feedback-name">${item.name}</div>
      <div class="feedback-message">${item.message}</div>
    `;
    feedbackListEl.appendChild(li);
  });
}

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameEl.value.trim();
  const message = messageEl.value.trim();
  if (!name || !message) return;

  statusEl.textContent = 'Submitting...';
  statusEl.className = 'status';

  try {
    const res = await fetch(`${API_BASE}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message })
    });

    if (!res.ok) {
      throw new Error('Request failed');
    }

    const newItem = await res.json();
    // Add to top
    const li = document.createElement('li');
    li.className = 'feedback-item';
    li.innerHTML = `
      <div class="feedback-name">${newItem.name}</div>
      <div class="feedback-message">${newItem.message}</div>
    `;
    feedbackListEl.insertBefore(li, feedbackListEl.firstChild);

    formEl.reset();
    statusEl.textContent = 'Thank you for your feedback!';
    statusEl.className = 'status success';
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Failed to submit feedback.';
    statusEl.className = 'status error';
  }
});

// Initial load
fetchFeedback();

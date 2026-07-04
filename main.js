// NAV SCROLL
window.addEventListener('scroll', () => {
  const nav = document.getElementById('main-nav');
  if (window.scrollY > 10) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

// MOBILE MENU
function toggleMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

// SCROLL ANIMATIONS
function initAnimations() {
  const elements = document.querySelectorAll('.anim');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  elements.forEach((el) => {
    if (!el.classList.contains('visible')) {
      observer.observe(el);
    }
  });
}

// INIT
initAnimations();
initReviews();

// REVIEWS SYSTEM
function initReviews() {
  const reviewsContainer = document.getElementById('reviews-container');
  const reviewForm = document.getElementById('review-submission-form');
  if (!reviewsContainer || !reviewForm) return;

  const starBtns = document.querySelectorAll('.star-input-btn');
  const ratingInput = document.getElementById('review-rating-val');
  const ratingDisplay = document.getElementById('rating-value-display');
  let selectedRating = 0;

  // Star Rating Interactive Logic
  starBtns.forEach((btn) => {
    const val = parseInt(btn.getAttribute('data-value'), 10);

    // Mouse enter / hover effect
    btn.addEventListener('mouseenter', () => {
      starBtns.forEach((s, idx) => {
        if (idx < val) s.classList.add('hovered');
        else s.classList.remove('hovered');
      });
    });

    // Mouse click / selection
    btn.addEventListener('click', () => {
      selectedRating = val;
      ratingInput.value = val;
      ratingDisplay.textContent = `${val} out of 5 stars`;

      starBtns.forEach((s, idx) => {
        if (idx < val) s.classList.add('selected');
        else s.classList.remove('selected');
      });
    });
  });

  // Clear hover state when mouse leaves container
  const starsContainer = document.getElementById('rating-stars-input');
  starsContainer.addEventListener('mouseleave', () => {
    starBtns.forEach((s) => s.classList.remove('hovered'));
  });

  // Fetch and Render Reviews
  const defaultReviews = [];

  let loadedReviews = [];

  function renderReviews() {
    reviewsContainer.innerHTML = '';

    // Combine fetched / default reviews with any local-only storage reviews
    const localReviews = JSON.parse(
      localStorage.getItem('onyx_local_reviews') || '[]',
    );
    const allReviews = [...loadedReviews, ...localReviews];

    if (allReviews.length === 0) {
      reviewsContainer.innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--text-light);">No reviews yet. Be the first to leave one!</div>';
      return;
    }

    allReviews.forEach((review) => {
      const card = document.createElement('div');
      card.className = `testimonial-card ${review.newlyAdded ? 'newly-added' : ''}`;

      // Build stars SVG string
      let starsHTML = '';
      for (let i = 1; i <= 5; i++) {
        const fillType = i <= review.rating ? 'currentColor' : 'none';
        const strokeType = i <= review.rating ? 'none' : 'currentColor';
        starsHTML += `
          <svg fill="${fillType}" stroke="${strokeType}" stroke-width="1.5" height="14" viewBox="0 0 24 24" width="14">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        `;
      }

      // Initial / Avatar letter
      const initial = review.name
        ? review.name.trim().charAt(0).toUpperCase()
        : 'U';

      card.innerHTML = `
        <div class="stars">${starsHTML}</div>
        <blockquote>"${review.text}"</blockquote>
        <div class="testimonial-author">
          <div class="author-avatar">${initial}</div>
          <div class="author-info">
            <span>${review.name}</span>
            <span>${review.location}</span>
          </div>
        </div>
      `;
      reviewsContainer.appendChild(card);
    });

    // Initialize animations for newly added dynamic elements
    if (typeof initAnimations === 'function') {
      initAnimations();
    }
  }

  async function loadReviews() {
    try {
      // Step 1: Try server API endpoint
      const response = await fetch('reviews.php');
      if (!response.ok) throw new Error('API not available');
      loadedReviews = await response.json();
    } catch (apiError) {
      console.warn(
        'API fetch failed, falling back to static reviews.json file.',
        apiError,
      );
      try {
        // Step 2: Try fetching reviews.json file directly
        const fileResponse = await fetch('reviews.json');
        if (!fileResponse.ok) throw new Error('reviews.json file not found');
        loadedReviews = await fileResponse.json();
      } catch (fileError) {
        console.error(
          'Static JSON file fetch failed, falling back to built-in default reviews.',
          fileError,
        );
        // Step 3: Use hardcoded default reviews
        loadedReviews = defaultReviews;
      }
    }
    renderReviews();
  }

  // Handle Review Submission
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('review-name').value.trim();
    const location = document.getElementById('review-location').value.trim();
    const text = document.getElementById('review-text').value.trim();

    if (!selectedRating) {
      alert('Please select a star rating.');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-review');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      'Submitting... <span style="display:inline-block; width:12px; height:12px; border:2px solid #fff; border-radius:50%; border-top-color:transparent; animation: spin 0.8s linear infinite;"></span>';

    const reviewData = {
      name,
      location,
      rating: selectedRating,
      text,
      date: new Date().toISOString().split('T')[0],
    };

    let submittedOnServer = false;

    try {
      const postResponse = await fetch('reviews.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (postResponse.ok) {
        submittedOnServer = true;
        const newReviewFromServer = await postResponse.json();
        // Add to main memory list with animation flag
        newReviewFromServer.newlyAdded = true;
        loadedReviews.push(newReviewFromServer);
      }
    } catch (err) {
      console.warn(
        'Could not post review to server. Falling back to local storage saving.',
        err,
      );
    }

    if (!submittedOnServer) {
      // Fallback: Save to LocalStorage
      const localReviews = JSON.parse(
        localStorage.getItem('onyx_local_reviews') || '[]',
      );
      const localReviewItem = { ...reviewData, newlyAdded: true };
      localReviews.push(localReviewItem);
      localStorage.setItem('onyx_local_reviews', JSON.stringify(localReviews));
    }

    // Refresh UI list
    renderReviews();

    // Show nice confirmation UI in place of form
    const formCard = document.querySelector('.review-form-container');
    const originalCardHTML = formCard.innerHTML;

    formCard.innerHTML = `
      <div class="form-success-message">
        <div class="success-icon-wrap">
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h4>Thank you for your review!</h4>
        <p>
          Your experience has been successfully recorded ${!submittedOnServer ? '<strong>locally in your browser session</strong> (server offline)' : 'and saved to the server'}. 
          It is now displayed at the top of the reviews grid.
        </p>
        <button class="btn-reset-form" id="btn-reset-form">Submit Another Review</button>
      </div>
    `;

    document.getElementById('btn-reset-form').addEventListener('click', () => {
      formCard.innerHTML = originalCardHTML;
      // Re-initialize the review events
      initReviews();
    });

    // Smooth scroll reviews grid into view
    reviewsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Load reviews on initial call
  loadReviews();
}

// Add simple CSS animation for the button loader spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

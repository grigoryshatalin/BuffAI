document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profSearchForm");
  const input = document.getElementById("profNameInput");
  const resultDiv = document.getElementById("profResult");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = input.value.trim();
    if (!name) {
      resultDiv.innerHTML = `<p class="error">Please enter a professor name.</p>`;
      return;
    }

    resultDiv.innerHTML = `<p class="loading">Searching...</p>`;

    try {
      const response = await fetch(`http://localhost:5001/professor?name=${encodeURIComponent(name)}`);
      const data = await response.json();

      if (data.error) {
        resultDiv.innerHTML = `<p class="error">${data.error}</p>`;
      } else {
        resultDiv.innerHTML = `
          <div class="prof-card">
            <h2>${data.name || 'N/A'}</h2>
            <p class="subtitle">${data.department || 'N/A'}</p>
            <div class="rating">
              ${renderStars(data.rating)}
              <span class="rating-text">${data.rating || 'N/A'} / 5</span>
            </div>
            <p><strong>Ratings Count:</strong> ${data.numRatings || 'N/A'}</p>
          </div>
        `;
      }
    } catch (err) {
      resultDiv.innerHTML = `<p class="error">Server error. Please try again later.</p>`;
      console.error("Fetch error:", err);
    }
  });

  function renderStars(rating) {
    if (!rating || isNaN(rating)) return '';
    const percent = (Math.min(rating, 5) / 5) * 100;

    return `
      <div class="stars-outer">
        <div class="stars-inner" style="width: ${percent}%;"></div>
      </div>
    `;
  }
});

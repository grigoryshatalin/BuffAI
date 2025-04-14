document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("profSearchForm");
    const input = document.getElementById("profNameInput");
    const resultDiv = document.getElementById("profResult");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const name = input.value.trim();
      if (!name) {
        resultDiv.innerHTML = `<p style="color: red;">Please enter a professor name.</p>`;
        return;
      }
  
      resultDiv.innerHTML = "Searching...";
  
      try {
        const response = await fetch(`http://localhost:5001/professor?name=${encodeURIComponent(name)}`);
        const data = await response.json();
        console.log(data);
  
        if (data.error) {
          resultDiv.innerHTML = `<p style="color: red;">${data.error}</p>`;
        } else {
          resultDiv.innerHTML = `
            <h3>${data.name || 'N/A'}</h3>
            <p><strong>Department:</strong> ${data.department || 'N/A'}</p>
            <p><strong>Rating:</strong> ${data.rating || 'N/A'}</p>
            <p><strong># of Ratings:</strong> ${data.numRatings || 'N/A'}</p>
          `;

        }
      } catch (err) {
        resultDiv.innerHTML = `<p style="color: red;">Server error. Please try again later.</p>`;
        console.error("Fetch error:", err);
      }
    });
  });  
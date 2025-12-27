
// Helper to shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const APP = {
  data: [],
  currentIndex: 0,
  selections: {
    "mistral": 0,
    "llama3.1:8b": 0,
    "gpt-oss:20b": 0
  },

  init() {
    if (!window.APP_DATA) {
      console.error("APP_DATA not loaded");
      return;
    }
    this.data = window.APP_DATA;
    this.totalQuestions = this.data.length;
    this.cacheImages();
    this.renderScreen();
  },

  cacheImages() {
    // Preload next images to ensure smooth transition
    // Implementation: just let browser handle it for now, or could iterate and new Image().
  },

  renderScreen() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    if (this.currentIndex >= this.totalQuestions) {
      this.renderSummary(app);
      return;
    }

    const currentItem = this.data[this.currentIndex];

    // Header
    const header = document.createElement('header');
    header.innerHTML = `
      <h2>Question ${this.currentIndex + 1} / ${this.totalQuestions}</h2>
      <h1>Which image best depicts <strong>${currentItem.word}</strong>?</h1>
    `;

    // Progress
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-bar-container';
    const progress = (this.currentIndex / this.totalQuestions) * 100;
    progressContainer.innerHTML = `<div class="progress-bar" style="width: ${progress}%"></div>`;

    // Grid
    const grid = document.createElement('div');
    grid.className = 'grid-container';

    // Shuffle images for display to avoid positional bias
    // We clone to avoid modifying the original order in data if needed (though we don't really rely on it)
    const imagesToDisplay = [...currentItem.images];
    shuffleArray(imagesToDisplay);

    imagesToDisplay.forEach(imgData => {
      const card = document.createElement('div');
      card.className = 'image-card';

      const img = document.createElement('img');
      img.src = `artifacts/${imgData.filename}`;
      img.alt = `${currentItem.word} by ${imgData.model}`;
      img.loading = "eager"; // Load immediately

      card.appendChild(img);
      card.onclick = () => this.handleSelection(imgData.model);

      grid.appendChild(card);
    });

    app.appendChild(header);
    app.appendChild(progressContainer);
    app.appendChild(grid);
  },

  handleSelection(model) {
    if (this.selections[model] !== undefined) {
      this.selections[model]++;
    } else {
      // Handle potential model name mismatch if data differs
      this.selections[model] = 1;
    }

    this.currentIndex++;

    // Simple fade out effect could be added here, but direct render is faster
    this.renderScreen();
  },

  renderSummary(container) {
    container.innerHTML = '';

    const total = this.totalQuestions;
    const header = document.createElement('header');
    header.innerHTML = `
      <h1>Survey Complete</h1>
      <h2>Here is how the models performed based on your choices.</h2>
    `;

    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'summary-container';

    const statsContainer = document.createElement('div');
    statsContainer.className = 'summary-stats';

    // Sort models by score (descending)
    const sortedModels = Object.keys(this.selections).sort((a, b) => this.selections[b] - this.selections[a]);

    sortedModels.forEach(model => {
      const count = this.selections[model];
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

      const row = document.createElement('div');
      row.className = 'stat-row';

      row.innerHTML = `
        <div class="model-name">${model}</div>
        <div class="bar-container">
          <div class="bar-fill" style="width: 0%">
            <span class="percentage-text">${percentage}% (${count})</span>
          </div>
        </div>
      `;

      statsContainer.appendChild(row);

      // Animate bar width after render
      setTimeout(() => {
        row.querySelector('.bar-fill').style.width = `${percentage}%`;
      }, 100);
    });

    summaryContainer.appendChild(statsContainer);
    container.appendChild(header);
    container.appendChild(summaryContainer);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  APP.init();
});

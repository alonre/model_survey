const fs = require('fs');
const path = require('path');

const planPath = path.join(__dirname, 'plan_0.json');
const artifactsDir = path.join(__dirname, 'artifacts');
const outputJsPath = path.join(__dirname, 'data.js');

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

// Group jobs by english_word
const grouped = {};

plan.jobs.forEach(job => {
  // Only processed successfully finished jobs
  if (job.status !== 'done') return;

  const word = job.english_word;
  if (!grouped[word]) {
    grouped[word] = {};
  }
  grouped[word][job.model] = job;
});

const triplets = [];

const models = ["mistral", "llama3.1:8b", "gpt-oss:20b"];

Object.keys(grouped).forEach(word => {
  const variants = grouped[word];

  // Check if we have all 3 models

  const triplet = {
    word: word,
    images: []
  };

  let complete = true;

  for (const model of models) {
    if (!variants[model]) {
      console.log(`Missing model ${model} for word ${word}`);
      complete = false;
      break;
    }

    const job = variants[model];

    // Construct expected filename
    // Rule: {english_word}_{model_sanitized}_0 Small.jpeg

    let safeWord = word.replace(/\//g, '_'); // Replace / with _
    let safeModel = model.replace(/:/g, '_'); // Replace : with _

    const filename = `${safeWord}_${safeModel}_0 Small.jpeg`;
    const filePath = path.join(artifactsDir, filename);

    if (fs.existsSync(filePath)) {
      triplet.images.push({
        model: model, // Original model name
        filename: filename,
        prompt: job.prompt
      });
    } else {
      console.log(`File not found: ${filename} for word ${word}, model ${model}`);
      complete = false;
      break;
    }
  }

  if (complete) {
    triplets.push(triplet);
  }
});

console.log(`Found ${triplets.length} complete triplets.`);

const scriptContent = `window.APP_DATA = ${JSON.stringify(triplets, null, 2)};`;
fs.writeFileSync(outputJsPath, scriptContent);
console.log(`Wrote data to ${outputJsPath}`);

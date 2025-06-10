# Ahasis Sentiment Analysis Pipeline

> **A Gemini-Based Model for Arabic Sentiment Analysis of Multi-Dialect Hotel Reviews**  
> Mohammed A. H. Lubbad, RANLP 2025 :contentReference[oaicite:0]{index=0}

This repository contains a Google Apps Script that performs batch sentiment analysis on Arabic hotel reviews—specifically Saudi and Moroccan Darija—using Google’s Gemini Pro 1.5 API.

---

## 🚀 Features

- Multi-dialect sentiment classification (Positive, Neutral, Negative).  
- Batch processing with time-based triggers.  
- Dialect-aware few-shot JSON prompts.  
- Preprocessing: cleaning, normalization, dialect tagging, sarcasm flagging.  
- Token estimation & inference-time logging.  
- Cumulative metrics across runs.

---

## 📋 Table of Contents

1. [Installation](#%EF%B8%8F-installation)  
2. [Configuration](#configuration)  
3. [Usage](#usage)  
4. [Code Structure](#-code-structure)  
5. [Methodology](#-methodology)  
6. [Results](#-results)  
7. [Deployment](#-deployment)  
8. [License](#-license)  

---

## 🛠️ Installation

1. Clone or download this repo.  
2. Open your Google Sheet → **Extensions → Apps Script**.  
3. Create a new script file `Code.gs` and paste the contents of `sentimentAnalyse.gs`.  
4. Save and authorize the script’s access.

---

## ⚙️ Configuration

1. In Apps Script, open **Project Settings → Script Properties**.  
2. Add the following keys:  
   - `MODEL_ID` = `gemini-1.5-pro-latest`  
   - `GEMINI_API_KEY` = *your Gemini API key*  
3. (Optional) Modify sheet/column settings in the script:  
    ```javascript
    const sheetName   = "train";  // Sheet with reviews
    const captionCol  = "C";      // Column for review text
    const flagCol     = "D";      // Column marking rows to process
    const resultCol   = "E";      // Column for sentiment output
    ```  
4. Save and deploy.

---

## ▶️ Usage

1. Populate **Sheet “train”**:  
   - Column C: Arabic review text  
   - Column D: Flag to trigger processing (e.g. “✓”)  
2. Run **`sentimentAnalyse()`** in the Apps Script editor.  
3. The script:  
   - Schedules `processNextBatch` via trigger.  
   - Processes rows in batches.  
   - Calls Gemini API with dialect-aware prompt.  
   - Writes labels (Positive/Neutral/Negative) to Column E.  
   - Logs tokens & timings.

---

## 📂 Code Structure

- **`sentimentAnalyse()`** – Sets the initial trigger.  
- **`processNextBatch()`** – Core loop: reads rows, calls API, writes results, manages triggers & metrics.  
- **Helpers**:  
  - `buildPrompt()` – Constructs the few-shot JSON prompt.  
  - `estimateTokenCount()` – Approximates token usage.  
  - `callGeminiAPI()` & `parseResponse()` – API integration.  
  - Metric utilities: `updateCumulativeMetrics()`, `logFinalMetrics()`.  
  - Trigger utilities: `isTriggerSet()`, `deleteTrigger()`.

---

## 🧪 Methodology

**Dataset**: Ahasis Shared Task dataset (860 training reviews) :contentReference[oaicite:1]{index=1}; internal benchmark (577 YouTube comments, augmented to 700) :contentReference[oaicite:2]{index=2}.  

**Preprocessing**: cleaning (links, emojis), normalization, dialect tagging, sarcasm flagging, manual review :contentReference[oaicite:3]{index=3}.  

**Prompt Engineering**: 20-shot JSON prompt with dialect-balanced examples; deterministic decoding (`temperature=0`, `topP=0.95`, `maxOutputTokens=8192`).  

---

## 📊 Results

**Ahasis Test Set** (3,000 reviews):  
- F1-score = 0.7361; Accuracy = 0.7361; Balanced Accuracy = 0.7229 :contentReference[oaicite:4]{index=4}.  

**Internal Benchmark** (700 samples):  
- Accuracy = 81.46%; Macro-F1 = 0.801 :contentReference[oaicite:5]{index=5}.  

---

## 🚀 Deployment

Integrated into AJ360’s media monitoring dashboard (TikTok, YouTube, X, Facebook, Instagram) via REST API for real-time tracking :contentReference[oaicite:6]{index=6}.

---

## 📜 License

MIT © Mohammed A. H. Lubbad  

# Ahasis Sentiment Analysis Pipeline

> **A Gemini-Based Model for Arabic Sentiment Analysis of Multi-Dialect Hotel Reviews**  
> Mohammed A. H. Lubbad, RANLP 2025 :contentReference[oaicite:0]{index=0}

This repository contains a Google Apps Script that performs batch sentiment analysis on Arabic hotel reviews—specifically Saudi and Moroccan (Darija) dialects—using Google’s Gemini 1.5 Pro API. It was developed for the Ahasis Shared Task and demonstrates dialect-aware prompt engineering, real-time batch inference, and comprehensive metric tracking.

---

## 🚀 Features

- **Multi-dialect support**  
  Classifies reviews into **Positive**, **Neutral**, or **Negative** for both Saudi and Darija dialects.
- **Batch processing**  
  Processes rows in configurable batches via time-based triggers to avoid execution time limits.
- **Prompt engineering**  
  Few-shot JSON prompts with dialect-balanced examples, guided by domain-specific instructions.
- **Token & time metrics**  
  Estimates prompt tokens, measures inference latency, and logs average metrics per batch.
- **Cumulative analytics**  
  Persists total reviews processed, total tokens, and total inference time across runs.

---

## 📋 Table of Contents

1. [Installation](#installation)  
2. [Configuration](#configuration)  
3. [Usage](#usage)  
4. [Code Structure](#code-structure)  
5. [Methodology](#methodology)  
6. [Results](#results)  
7. [License](#license)  

---

## 🛠️ Installation

1. **Clone this repository** (or copy contents) into your local machine.  
2. Open your target **Google Sheet**, then **Extensions → Apps Script**.  
3. Replace the default `Code.gs` content with the script in `sentimentAnalyse.gs`.  
4. Save and authorize the script’s access to your spreadsheet and triggers.

---

## ⚙️ Configuration

1. Go to **Apps Script → Project Settings**.  
2. Under **Script Properties**, add:
   - `MODEL_ID` = `gemini-1.5-pro-latest`
   - `GEMINI_API_KEY` = your Gemini API key  
3. In the script, adjust (if needed):
   ```js
   const sheetName  = "train";   // Sheet with reviews
   const captionCol = "C";       // Column holding the review text
   const flagCol    = "D";       // Column marking rows to process
   const resultCol  = "E";       // Column for sentiment output

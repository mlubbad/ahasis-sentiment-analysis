// Configuration constants
// Replace MODEL_ID and GEMINI_API_KEY values via Script Properties for security instead of hard-coding
const MODEL_ID = "gemini-1.5-pro-latest";
const GEMINI_API_KEY = "AIzaSyA6Pxxxxxxxxxxxxx";
const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`;

// Sheet and column configuration
const sheetName = "train";           // Name of the sheet containing input and output
const captionCol = "C";              // Column with text captions/reviews
const commentCol = "D";              // Column where we track which rows need processing
const resultCol = "E";               // Column to write the model's sentiment output

/**
 * Entry point: schedules processing batches via time-based trigger
 */
function sentimentAnalyse() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();

  // Read all captions and comments to determine work to be done
  const captions = sheet.getRange(`${captionCol}2:${captionCol}${lastRow}`).getValues();
  const commentFlags = sheet.getRange(`${commentCol}2:${commentCol}${lastRow}`).getValues();

  // Only proceed if there are comment flags to process
  if (commentFlags.length > 0) {
    // If no trigger exists, set one to call processNextBatch after 1 second
    if (!isTriggerSet('processNextBatch')) {
      ScriptApp.newTrigger('processNextBatch')
        .timeBased()
        .after(1000)
        .create();

      processNextBatch();
      Logger.log('Processing started. Trigger set for the next batch.');
    } else {
      Logger.log('A trigger is already set for the next batch.');
    }
  } else {
    Logger.log('No comment flags found; nothing to process.');
  }
}

/**
 * Processes a batch of rows: calls the Gemini API, writes results, and reschedules
 */
function processNextBatch() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();

  // Fetch ranges: captions, flags, and existing results
  const captions = sheet.getRange(`${captionCol}2:${captionCol}${lastRow}`).getValues();
  const commentFlags = sheet.getRange(`${commentCol}2:${commentCol}${lastRow}`).getValues();
  const existingResults = sheet.getRange(`${resultCol}2:${resultCol}${lastRow}`).getValues();

  // Track where we left off last time (persisted in ScriptProperties)
  let startIndex = parseInt(PropertiesService.getScriptProperties().getProperty('lastProcessedIndex') || '0', 10);
  const batchSize = 3;
  const endIndex = Math.min(startIndex + batchSize, commentFlags.length);

  // Metrics for logging
  let totalInferenceTime = 0;
  let processedCount = 0;
  let tokenCounts = [];

  // Loop through this batch
  for (let i = startIndex; i < endIndex; i++) {
    const caption = captions[i][0];
    const flag = commentFlags[i][0];
    const existing = existingResults[i][0];

    // Skip rows already processed or without flag
    if (flag && !existing) {
      // Build prompt with examples and the target review
      const contents = buildPrompt(caption);
      const promptText = JSON.stringify(contents);
      const tokenCount = estimateTokenCount(promptText);
      tokenCounts.push(tokenCount);

      // Prepare request payload
      const body = {
        contents,
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0,
          topP: 0.95,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
        ],
      };

      // Make API call and measure time
      const startTime = Date.now();
      const response = callGeminiAPI(body);
      const inferenceTime = Date.now() - startTime;
      totalInferenceTime += inferenceTime;
      processedCount++;

      // Parse and write the model's sentiment label
      const label = parseResponse(response);
      if (label) {
        sheet.getRange(`${resultCol}${i + 2}`).setValue(label);
        Logger.log(`Row ${i + 2} sentiment: ${label} (tokens: ${tokenCount}, time: ${inferenceTime}ms)`);
      }
    }
  }

  // After batch: log summary metrics
  if (processedCount > 0) {
    const avgTime = (totalInferenceTime / processedCount).toFixed(2);
    const avgTokens = Math.round(tokenCounts.reduce((a,b) => a+b, 0) / tokenCounts.length);
    Logger.log(`Batch complete: ${processedCount} reviews processed. Avg time ${avgTime}ms, Avg tokens ${avgTokens}.`);
    updateCumulativeMetrics(processedCount, totalInferenceTime, tokenCounts);
  }

  // Remove existing trigger to prevent duplicates
  deleteTrigger('processNextBatch');

  // Persist progress and schedule next batch if needed
  PropertiesService.getScriptProperties().setProperty('lastProcessedIndex', endIndex.toString());
  if (endIndex < commentFlags.length) {
    ScriptApp.newTrigger('processNextBatch').timeBased().after(20000).create();
    Logger.log(`Scheduled next batch starting at index ${endIndex}.`);
  } else {
    Logger.log('All rows processed.');
    logFinalMetrics();
  }
}

/**
 * Helper: builds the prompt array using examples and the target review
 */
function buildPrompt(reviewText) {
  // Pre-defined examples to illustrate classification
  const examples = [
    // ... (omitted for brevity; include your preset examples here) ...
  ];
  // Append the target review
  examples.push({ role: 'user', parts: [{ text: `Dialect: ${reviewText}` }] });
  return examples;
}

/**
 * Helper: performs the URLFetch call to Gemini API
 */
function callGeminiAPI(payload) {
  const options = {
    contentType: 'application/json',
    method: 'post',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };
  return UrlFetchApp.fetch(baseUrl, options).getContentText();
}

/**
 * Helper: extracts the sentiment label from the API response text
 */
function parseResponse(rawText) {
  try {
    const data = JSON.parse(rawText);
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
  } catch(e) {
    Logger.log('Failed to parse response: ' + e);
  }
  return null;
}

/**
 * Estimates token count: ~3 chars/token for Arabic, ~4 for others
 */
function estimateTokenCount(text) {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/g;
  const arabicChars = (text.match(arabicPattern) || []).length;
  const englishChars = text.length - arabicChars;
  return Math.ceil(arabicChars / 3) + Math.ceil(englishChars / 4);
}

/**
 * Updates cumulative metrics in Script Properties
 */
function updateCumulativeMetrics(batchReviews, batchTime, batchTokens) {
  const props = PropertiesService.getScriptProperties();
  const totalReviews = +props.getProperty('totalReviews') || 0;
  const totalTime = +props.getProperty('totalInferenceTime') || 0;
  const totalTokens = +props.getProperty('totalTokens') || 0;
  props.setProperties({
    totalReviews: totalReviews + batchReviews,
    totalInferenceTime: totalTime + batchTime,
    totalTokens: totalTokens + batchTokens.reduce((a,b) => a+b, 0)
  });
}

/**
 * Logs final cumulative metrics after all processing
 */
function logFinalMetrics() {
  const props = PropertiesService.getScriptProperties();
  const totalReviews = +props.getProperty('totalReviews') || 0;
  const totalTime = +props.getProperty('totalInferenceTime') || 0;
  const totalTokens = +props.getProperty('totalTokens') || 0;
  if (totalReviews > 0) {
    Logger.log(`=== FINAL METRICS ===`);
    Logger.log(`Reviews: ${totalReviews}, Total time: ${totalTime}ms, Avg time: ${(totalTime/totalReviews).toFixed(2)}ms, Tokens: ${totalTokens}, Avg tokens: ${Math.round(totalTokens/totalReviews)}`);
  }
}

/**
 * Utility: checks if a trigger for the given function exists
 */
function isTriggerSet(handlerName) {
  return ScriptApp.getProjectTriggers().some(trigger => trigger.getHandlerFunction() === handlerName);
}

/**
 * Utility: deletes all triggers for the given function
 */
function deleteTrigger(handlerName) {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === handlerName)
    .forEach(t => ScriptApp.deleteTrigger(t));
}

/**
 * Optional: reset metrics if you need to start fresh
 */
function resetMetrics() {
  PropertiesService.getScriptProperties().deleteAllProperties();
  Logger.log('All metrics reset.');
}

/**
 * Optional: view current metrics in Logs
 */
function getCurrentMetrics() {
  const props = PropertiesService.getScriptProperties();
  Logger.log({
    totalReviews: props.getProperty('totalReviews'),
    totalInferenceTime: props.getProperty('totalInferenceTime'),
    totalTokens: props.getProperty('totalTokens')
  });
}

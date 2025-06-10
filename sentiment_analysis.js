// Enhanced version with token counting and timing measurements

function sentimentAnalyse() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetname);
  const lastRow = sheet.getLastRow();
  const captions = sheet.getRange(`${captionCol}2:${captionCol}${lastRow}`).getValues();
  const searchTerms = sheet.getRange(`${commentCol}2:${commentCol}${lastRow}`).getValues();

  if (searchTerms.length > 0) {
    let startIndex = 0;

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
    Logger.log('No search terms found.');
  }
}

function processNextBatch() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetname);
  const lastRow = sheet.getLastRow();
  const captions = sheet.getRange(`${captionCol}2:${captionCol}${lastRow}`).getValues();
  const searchTerms = sheet.getRange(`${commentCol}2:${commentCol}${lastRow}`).getValues();
  const existingQuestions = sheet.getRange(`${modelCol}2:${modelCol}${lastRow}`).getValues();

  let startIndex = PropertiesService.getScriptProperties().getProperty('lastProcessedIndex');
  startIndex = startIndex ? parseInt(startIndex, 10) : 0;
  
  const batchSize = 3;
  let endIndex = Math.min(startIndex + batchSize, searchTerms.length);

  // Initialize timing metrics
  let totalInferenceTime = 0;
  let processedReviews = 0;
  let promptTokenCounts = [];

  for (let i = startIndex; i < endIndex; i++) {
    const searchTerm = searchTerms[i][0];
    const caption = captions[i][0];
    
    if (!existingQuestions[i][0]) {
      const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
      };

      const contents = [
        {
          "role": "user",
          "parts": [{
            "text": `You are a professional data scientist and NLP specialist with extensive experience in sentiment analysis, particularly in Arabic dialects. Your primary task is to classify the **overall sentiment** of **Arabic hotel reviews** into one of three categories: **positive**, **neutral**, or **negative**.

            Arabic presents unique challenges due to its rich variety of dialects beyond Modern Standard Arabic (MSA). Each dialect—such as Saudi Arabic and Darija—can significantly differ in vocabulary, syntax, and idiomatic expression, especially in informal reviews. Your analysis must handle these linguistic variances accurately.

            ## 🎯 Task Definition

            **Classify the sentiment of Arabic hotel review texts** into:
            - 'positive
            - 'neutral'
            - 'negative'

            ## 🗂️ Dataset Structure

            Each review is labeled with:
            - **Text**: The Arabic review text.
            - **Sentiment**: The ground-truth sentiment label (positive, negative, or neutral).
            - **Dialect**: The regional variant of Arabic (e.g., 'Saudi', 'Darija').

            ## ⚠️ Guidelines

            - Strict to trained data first while classifying not to your knowledge.
            - Focus exclusively on the **overall sentiment** expressed by the reviewer, not isolated phrases.
            - Prioritize dialect-specific nuances and idiomatic expressions (e.g., sarcasm, exaggeration).
            - **Do not** infer sentiment from commands or meta-commentary in the review (e.g., "please fix the air conditioning" ≠ Negative unless frustration is clearly implied).
            - If an example is available and matches the pattern, use that **as a benchmark**.
            - Avoid literal translation or relying on formal Arabic sentiment if dialectal cues suggest a different tone.
            - Output **only the sentiment label**: Positive, Neutral, or Negative.
            - **Do not** explain your answer or add any commentary.
            Let us start
            Dialect: Saudi, Text: الشاطئ ممتاز لكن ماهو نظيف`
          }]
        },
        {
          "role": "model",
          "parts": [{
            "text": "neutral"
          }]
        },
        {
          "role": "user",
          "parts": [{
            "text": `Dialect: Darija, Text: فندق خايب بزاف، هاد الفندق من أسوأ الفنادق اللي جربتهم. كيقولوا باللي هو نجوم، ولكن ما كيستاهل حتى نجمة وحدة.`
          }]
        },
        {
          "role": "model",
          "parts": [{
            "text": "negative"
          }]
        },
        {
          "role": "user",
          "parts": [{
            "text": `Dialect: Darija, Text: رابعا، ما كينش فراشات زايدين فالبيوت، وحتى فاش تطلب مخدة  خاصك تتسنا يوماين باش يوصلوها ليك.`
          }]
        },
        {
          "role": "model",
          "parts": [{
            "text": "negative"
          }]
        },
        {
          "role": "user",
          "parts": [{
            "text": `Dialect: Saudi, Text: قرية سيئة مره حجزت في جراند بلازا و الرية خايسة مره من ناحية المعاملة والاكل و كثرة الاعطال في الاجهزة و الغرف و الاستجابة لشكاوي النزلاء`
          }]
        },
        {
          "role": "model",
          "parts": [{
            "text": "negative"
          }]
        },
        {
          "role": "user",
          "parts": [{
            "text": `Dialect: Saudi, Text: اما المطعم مافيه مويا للشرب غير قوارير مياه معدنية ، والقارورة بجنيه مصري`
          }]
        },
        {
          "role": "model",
          "parts": [{
            "text": "neutral"
          }]
        },
        {
          "role": "user",
          "parts": [{
            "text": `Dialect: Darija, Text: هو بطبيعة الحال ماشي أحسن أوطيل لا من ناحية التجهيز ولا من ناحية الموقع ولكن كتاخد على قد داكشي اللي خلصتي. مايمكنش تدير ما حسن من هاد البلاصة العملية وفنفس الوقت كاين ترحاب.`
          }]
        },
        {
          "role": "model",
          "parts": [{
            "text": "neutral"
          }]
        },
        {
          "role": "user",
          "parts": [{
            "text": `Dialect: Saudi, Text: انا نزلت في هذا الفندق مرتين و كلها كانت مريحة`
          }]
        },
        {
          "role": "model",
          "parts": [{
            "text": "positive"
          }]
        },
        {
          "role": "user",
          "parts": [{
            "text": `Dialect: Darija, Text: كان كلشي مزيان، خاصة الغرف اللي كايطلعو على الكعبة.`
          }]
        },
        {
          "role": "model",
          "parts": [{
            "text": "positive"
          }]
        },
        {
          "role": "user",
          "parts": [{
            "text": `Dialect: Saudi, Text: فندق جيد تنزل فيه لو عندك ترانزيت حجزت في هذا الفندق لما كان عندي ترانزيت في رحلة العودة من المدينة الى جدة انتظر رحلة الصباح الى بريطانيا موظفين الاستقبال لطيفين`
          }]
        },
        {
          "role": "model",
          "parts": [{
            "text": "positive"
          }]
        },
        {
          "role": "user",
          "parts": [{
            "text": "Dialect: Saudi, Text: حاول تحجز غرفة ببلكونه في الدور الثالث الجلوس فيها حلو مره و الموظفين يتكلمون التركية و الانجليزية و بعظهم يفهمون عربي الفطور كان زين بس الاصناف المطبوخة قليلة"
          }]
        },
        {
          "role": "model",
          "parts": [{ "text": "neutral" }]
        },
        {
          "role": "user",
          "parts": [{
            "text": "Dialect: Saudi, Text: مو مناسب للعمل ابد رحت هذا المكان عشان عندي اجتماع عمل المكان ما عليه و التجهيزات جيده الى حد ما لكن الخدمات تحتاج تحسين قله عدد الموظفين له تأثير يحتاج اهتمام و اداره افضل عشان يحسن المستوى و لكن بشكل عام ما انصح فيه للاجتماعات و ما ادري عن الاقامة ما جربتها"
          }]
        },
        {
          "role": "model",
          "parts": [{ "text": "neutral" }]
        },
        {
          "role": "user",
          "parts": [{
            "text": "Dialect: Darija, Text: فندق قريب من المستشفى الأمريكي بلنوغراد الشهير و قريب من كتير من الفنادق، والمطاعم العربية، ومحلات السوبرماركت، و المحلات اللي كايعرضو التدليك، و خاص بكمبايه ديال الغرف و نوعية الخدمة اللي كايعرضو من التنظيف اليومي و تغيير الأسرة والمناديل يوميا، بصراحة حاسيت بالفطرة خلال إقامتي فيه."
          }]
        },
        {
          "role": "model",
          "parts": [{ "text": "neutral" }]
        },
        {
          "role": "user",
          "parts": [{
            "text": "Dialect: Darija, Text: الفطور كان معقول، ما جربتش شي وجبات اخرى، و الموظفين كانو مزيان بزاف."
          }]
        },
        {
          "role": "model",
          "parts": [{ "text": "neutral" }]
        },
        {
          "role": "user",
          "parts": [{
            "text": "Dialect: Saudi, Text: الاكل جيد و مرات يتقدم حار"
          }]
        },
        {
          "role": "model",
          "parts": [{ "text": "neutral" }]
        },
        {
          "role": "user",
          "parts": [{
            "text": "Dialect: Saudi, Text: قديم و متهالك ماخذ درجة نجوم لكن الاكثر فضلوا نجوم"
          }]
        },
        {
          "role": "model",
          "parts": [{ "text": "neutral" }]
        },
        {
          "role": "user",
          "parts": [{
            "text": "Dialect: Darija, Text: حتا هاد البلاصة خاصة بالشيوخ."
          }]
        },
        {
          "role": "model",
          "parts": [{ "text": "negative" }]
        },
        {
          "role": "user",
          "parts": [{
            "text": "Dialect: Saudi, Text: الاكوا بارك حلوه الغرف نظيفة و الشاطئ كبير عيبه ان المراكب موجودة في منطقة السباحة و كمية الشباب الموجودين في الفندق خصوصا الخليجيين"
          }]
        },
        {
          "role": "model",
          "parts": [{ "text": "positive" }]
        },
        {
          "role": "user",
          "parts": [{
            "text": `Dialect: ${caption}, Text:${searchTerm}`
          }]
        }
      ];

      // Calculate token count for the prompt
      const promptText = JSON.stringify(contents);
      const tokenCount = estimateTokenCount(promptText);
      promptTokenCounts.push(tokenCount);

      const body = {
        "contents": contents,
        "generationConfig": {
          "maxOutputTokens": 8192,
          "temperature": 0,
          "topP": 0.95,
        },
        "safetySettings": [
          {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_NONE"
          }
        ],
      }

      try {
        const options = {
          headers,
          method: "POST",
          muteHttpExceptions: true,
          payload: JSON.stringify(body)
        };

        // Start timing the API call
        const startTime = new Date().getTime();
        
        Logger.log(`#${i} time ${time()}`);
        Logger.log(`Estimated prompt tokens: ${tokenCount}`);
        
        const response = UrlFetchApp.fetch(baseUrl, options);
        
        // End timing the API call
        const endTime = new Date().getTime();
        const inferenceTime = endTime - startTime;
        totalInferenceTime += inferenceTime;
        processedReviews++;
        
        Logger.log(`Inference time for review ${i + 1}: ${inferenceTime}ms`);
        
        const responseData = JSON.parse(response.getContentText());
        
        if (responseData.candidates && Array.isArray(responseData.candidates)) {
          const generatedQuestions = responseData.candidates.map(candidate => candidate.content.parts.map(part => part.text.trim()));

          for (let j = 0; j < generatedQuestions.length; j++) {
            const generatedQuestion = generatedQuestions[j];
            if (generatedQuestion && !existingQuestions[i + j][0]) {
              sheet.getRange(`${modelCol}${i + j + 2}`).setValue(generatedQuestion);

              Logger.log(`comment (${i + 1}): ${searchTerm}`);
              Logger.log(`Sentiment Analysis (${i + 1}): ${generatedQuestion}`);
            } else {
              Logger.log(`Generated question (${j + 1}) is undefined or already exists for search term: ${searchTerm}`);
            }
          }

          Logger.log(`Iteration ${i + 1} completed`);
        } else {
          Logger.log('Error: Unable to retrieve choices from API response.');
          Logger.log(`Error: ${responseData.error.message}`);
          Logger.log(responseData);

          if (responseData.error.code == 401.0) {
            break;
          }
        }
      } catch (error) {
        Logger.log(`Error: ${error.message}`);

        if (error.code == 401.0) {
          break;
        }
      }
    }
  }

  // Log metrics summary
  if (processedReviews > 0) {
    const averageInferenceTime = totalInferenceTime / processedReviews;
    const averageTokenCount = promptTokenCounts.reduce((a, b) => a + b, 0) / promptTokenCounts.length;
    
    Logger.log(`\n=== BATCH METRICS SUMMARY ===`);
    Logger.log(`Total reviews processed: ${processedReviews}`);
    Logger.log(`Total inference time: ${totalInferenceTime}ms`);
    Logger.log(`Average inference time per review: ${averageInferenceTime.toFixed(2)}ms`);
    Logger.log(`Average prompt token count: ${averageTokenCount.toFixed(0)} tokens`);
    Logger.log(`Token counts: ${promptTokenCounts.join(', ')}`);
    
    // Store cumulative metrics
    updateCumulativeMetrics(processedReviews, totalInferenceTime, promptTokenCounts);
  }

  // Clean up trigger
  const triggerToDelete = ScriptApp.getProjectTriggers().find(trigger => trigger.getHandlerFunction() === 'processNextBatch');
  if (triggerToDelete) {
    ScriptApp.deleteTrigger(triggerToDelete);
    Logger.log('Trigger deleted after processing.');
  }

  PropertiesService.getScriptProperties().setProperty('lastProcessedIndex', endIndex.toString());

  if (endIndex < searchTerms.length) {
    if (!isTriggerSet('processNextBatch')) {
      ScriptApp.newTrigger('processNextBatch')
        .timeBased()
        .after(20000)
        .create();
      Logger.log(`Trigger set for the next batch (startIndex: ${endIndex}).`);
    } else {
      Logger.log('A trigger is already set for the next batch.');
    }
  } else {
    Logger.log('Processing completed. No more search terms to process.');
    logFinalMetrics();
  }
}

// Function to estimate token count (approximation)
function estimateTokenCount(text) {
  // Rough estimation: 1 token ≈ 4 characters for English, 
  // For Arabic text, we'll use a more conservative estimate
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/g;
  const arabicChars = (text.match(arabicPattern) || []).length;
  const englishChars = text.length - arabicChars;
  
  // Arabic: ~3 chars per token, English: ~4 chars per token
  const estimatedTokens = Math.ceil(arabicChars / 3) + Math.ceil(englishChars / 4);
  
  return estimatedTokens;
}

// Function to update cumulative metrics
function updateCumulativeMetrics(batchReviews, batchTime, batchTokens) {
  const properties = PropertiesService.getScriptProperties();
  
  // Get existing metrics
  const totalReviews = parseInt(properties.getProperty('totalReviews') || '0');
  const totalTime = parseInt(properties.getProperty('totalInferenceTime') || '0');
  const totalTokens = parseInt(properties.getProperty('totalTokens') || '0');
  
  // Update cumulative metrics
  const newTotalReviews = totalReviews + batchReviews;
  const newTotalTime = totalTime + batchTime;
  const newTotalTokens = totalTokens + batchTokens.reduce((a, b) => a + b, 0);
  
  // Store updated metrics
  properties.setProperties({
    'totalReviews': newTotalReviews.toString(),
    'totalInferenceTime': newTotalTime.toString(),
    'totalTokens': newTotalTokens.toString()
  });
}

// Function to log final metrics
function logFinalMetrics() {
  const properties = PropertiesService.getScriptProperties();
  
  const totalReviews = parseInt(properties.getProperty('totalReviews') || '0');
  const totalTime = parseInt(properties.getProperty('totalInferenceTime') || '0');
  const totalTokens = parseInt(properties.getProperty('totalTokens') || '0');
  
  if (totalReviews > 0) {
    const averageTime = totalTime / totalReviews;
    const averageTokens = totalTokens / totalReviews;
    
    Logger.log(`\n=== FINAL PROCESSING METRICS ===`);
    Logger.log(`Total reviews processed: ${totalReviews}`);
    Logger.log(`Total processing time: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
    Logger.log(`Average inference time per review: ${averageTime.toFixed(2)}ms`);
    Logger.log(`Average prompt tokens per review: ${averageTokens.toFixed(0)} tokens`);
    Logger.log(`Total tokens processed: ${totalTokens} tokens`);
  }
}

// Function to reset metrics (call this to start fresh)
function resetMetrics() {
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty('totalReviews');
  properties.deleteProperty('totalInferenceTime');
  properties.deleteProperty('totalTokens');
  Logger.log('Metrics reset successfully.');
}

// Function to get current metrics
function getCurrentMetrics() {
  const properties = PropertiesService.getScriptProperties();
  
  const totalReviews = parseInt(properties.getProperty('totalReviews') || '0');
  const totalTime = parseInt(properties.getProperty('totalInferenceTime') || '0');
  const totalTokens = parseInt(properties.getProperty('totalTokens') || '0');
  
  const metrics = {
    totalReviews: totalReviews,
    totalInferenceTime: totalTime,
    averageInferenceTime: totalReviews > 0 ? totalTime / totalReviews : 0,
    totalTokens: totalTokens,
    averageTokensPerReview: totalReviews > 0 ? totalTokens / totalReviews : 0
  };
  
  Logger.log('Current Metrics:', metrics);
  return metrics;
}
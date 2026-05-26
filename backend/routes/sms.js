const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Regex-based SMS parser (fast, no AI needed for common patterns)
function parseWithRegex(smsText) {
  const text = smsText.toLowerCase();
  const result = { amount: null, merchant: null, mode: null, raw: smsText };

  // Amount patterns
  const amountPatterns = [
    /(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /debited\s+(?:by|for|with)\s+(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs|inr|₹)/i,
    /amount\s*(?:of|:)?\s*(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i
  ];
  for (const p of amountPatterns) {
    const m = text.match(p);
    if (m) { result.amount = parseFloat(m[1].replace(/,/g, '')); break; }
  }

  // Merchant patterns
  const merchantPatterns = [
    /(?:at|to|for|merchant:?)\s+([a-z0-9\s&.'-]{2,30})(?:\s*(?:on|via|using|\.|\n|$))/i,
    /(?:paid to|transfer to|sent to)\s+([a-z0-9\s&.'-]{2,30})/i,
  ];
  for (const p of merchantPatterns) {
    const m = smsText.match(p);
    if (m) { result.merchant = m[1].trim(); break; }
  }

  // Payment mode
  if (/upi|gpay|phonepe|paytm|bhim/i.test(text)) result.mode = 'upi';
  else if (/credit card|debit card|card ending|card no/i.test(text)) result.mode = 'card';
  else if (/neft|imps|rtgs|net banking/i.test(text)) result.mode = 'netbanking';
  else if (/wallet/i.test(text)) result.mode = 'wallet';
  else result.mode = 'upi';

  return result;
}

// POST /api/sms/parse
router.post('/parse', auth, async (req, res) => {
  try {
    const { smsText } = req.body;
    if (!smsText) return res.status(400).json({ error: 'SMS text required' });

    // First try fast regex
    const regexResult = parseWithRegex(smsText);

    // If regex got amount, use AI only for category + clean merchant name
    if (regexResult.amount) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const aiResponse = await model.generateContent(
  `Extract expense data from this bank SMS. Respond ONLY with raw JSON, no backticks:
  {"category": "food|transport|shopping|health|bills|entertainment|other", "merchant": "clean name", "description": "short description"}
  
  SMS: "${smsText}"
  Amount detected: ₹${regexResult.amount}`
);
const text = aiResponse.response.text().replace(/```json|```/g, '').trim();
        const aiData = JSON.parse(text);
        return res.json({
          success: true,
          parsed: {
            amount: regexResult.amount,
            category: aiData.category || 'other',
            merchant: aiData.merchant || regexResult.merchant || 'Unknown',
            description: aiData.description || aiData.merchant || 'Transaction',
            paymentMode: regexResult.mode,
            rawSmsText: smsText,
            isAutoDetected: true
          }
        });
      } catch (aiErr) {
        // Fall back to regex result
        return res.json({
          success: true,
          parsed: {
            amount: regexResult.amount,
            category: 'other',
            merchant: regexResult.merchant || 'Unknown',
            description: regexResult.merchant || 'Transaction',
            paymentMode: regexResult.mode,
            rawSmsText: smsText,
            isAutoDetected: true
          }
        });
      }
    }

    // Full AI parse if regex failed
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent(
  `Parse this bank SMS and extract expense details.
  Respond ONLY with raw JSON, no markdown, no backticks:
  {"amount": number, "category": "food|transport|shopping|health|bills|entertainment|other", "merchant": "name", "description": "short", "paymentMode": "upi|card|cash|netbanking|wallet"}
  If this is not a debit/expense SMS, set amount to null.
  
  SMS: "${smsText}"`
);
const text = response.response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);

    if (!parsed.amount) return res.json({ success: false, message: 'Not a debit transaction' });
    res.json({ success: true, parsed: { ...parsed, rawSmsText: smsText, isAutoDetected: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

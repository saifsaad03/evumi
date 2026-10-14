const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer transporter based on environment variables.
 * Returns null if SMTP is not configured — caller falls back to simulation.
 */
const getTransporter = () => {
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || '').trim();

  if (!emailUser || !emailPass || emailUser === 'your_email@gmail.com') {
    return null;
  }

  // Custom SMTP host
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: { user: emailUser, pass: emailPass }
    });
  }

  // Standard Gmail via App Password
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: emailUser, pass: emailPass }
  });
};

/**
 * Build the "from" address safely — avoids crashes from malformed EMAIL_FROM.
 */
const buildFromAddress = () => {
  const raw = (process.env.EMAIL_FROM || '').trim();
  const user = (process.env.EMAIL_USER || '').trim();
  if (raw && raw.includes('@')) return raw;
  if (user) return `"e-ভূমি বাংলাদেশ" <${user}>`;
  return '"e-ভূমি বাংলাদেশ" <no-reply@evhumi.gov.bd>';
};

/**
 * Send an OTP Email to a recipient.
 * NEVER throws — always returns a result object.
 *
 * @param {string} toEmail      - Recipient email address
 * @param {string} otp          - 6-digit OTP code
 * @param {string} purpose      - 'ACCOUNT_REGISTRATION' | 'LAND_ASSIGNMENT'
 * @param {object} extraDetails - { citizen_name, dag_no, mouza }
 * @returns {{ success: boolean, simulated?: boolean, error?: string, messageId?: string }}
 */
const sendOtpEmail = async (toEmail, otp, purpose, extraDetails = {}) => {
  try {
    const isRegistration = purpose === 'ACCOUNT_REGISTRATION';

    const title = isRegistration
      ? 'e-ভূমি নাগরিক অ্যাকাউন্ট ভেরিফিকেশন কোড'
      : 'e-ভূমি জমি হস্তান্তর ও সাব-রেজিস্ট্রি সম্মতি ওটিপি';

    const subtitle = isRegistration
      ? 'আপনার নাগরিক অ্যাকাউন্ট সক্রিয় করতে নিচের ওটিপি কোডটি ব্যবহার করুন।'
      : `সাব-রেজিস্ট্রি অফিস থেকে জমি বরাদ্দ আবেদন (দাগ নং: ${extraDetails.dag_no || 'N/A'}, মৌজা: ${extraDetails.mouza || 'N/A'}) যাচাইয়ের জন্য আপনার সম্মতি কোড।`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #064e3b, #059669); color: #ffffff; padding: 30px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
          .header p  { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
          .body { padding: 32px 28px; color: #334155; }
          .otp-box { background: #f8fafc; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 38px; font-weight: 800; color: #047857; letter-spacing: 8px; font-family: monospace; }
          .notice { font-size: 13px; color: #64748b; line-height: 1.6; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</h1>
            <p>ভূমি মন্ত্রণালয় · e-ভূমি ডিজিটাল ভূমি ব্যবস্থাপনা প্ল্যাটফর্ম</p>
          </div>
          <div class="body">
            <h2 style="color:#0f172a;font-size:18px;margin-top:0;">${title}</h2>
            <p style="font-size:14px;line-height:1.6;color:#475569;">
              ${extraDetails.citizen_name ? `প্রিয় <strong>${extraDetails.citizen_name}</strong>,<br/>` : ''}
              ${subtitle}
            </p>
            <div class="otp-box">
              <div style="font-size:12px;color:#059669;font-weight:600;text-transform:uppercase;margin-bottom:6px;">আপনার ওটিপি (OTP) ভেরিফিকেশন কোড</div>
              <div class="otp-code">${otp}</div>
              <div style="font-size:12px;color:#64748b;margin-top:6px;">মেয়াদ: পরবর্তী ১০ মিনিট</div>
            </div>
            <p class="notice">
              🔒 <strong>সতর্কতা:</strong> এই কোডটি গোপনীয়। এটি কারো সাথে শেয়ার করবেন না।
            </p>
          </div>
          <div class="footer">
            এটি একটি স্বয়ংক্রিয় বার্তা। অনুগ্রহ করে এই ইমেইলে উত্তর দেবেন না।<br/>
            © ২০২৬ e-ভূমি · সর্বস্বত্ব সংরক্ষিত
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = getTransporter();

    // ── Simulation mode (SMTP not configured) ──────────────────────────
    if (!transporter) {
      console.log('\n======================================================');
      console.log('📧 [EMAIL SIMULATION MODE — SMTP NOT CONFIGURED]');
      console.log(`📨 To     : ${toEmail}`);
      console.log(`🎯 Purpose: ${purpose}`);
      console.log(`🔑 OTP    : ${otp}`);
      console.log('======================================================\n');
      return { success: true, simulated: true };
    }

    // ── Real send ──────────────────────────────────────────────────────
    const fromAddress = buildFromAddress();
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `[e-ভূমি] ${title} — ${otp}`,
      html: htmlContent
    });

    console.log(`✅ [EMAIL SENT] To: ${toEmail} | MessageId: ${info.messageId}`);
    return { success: true, simulated: false, messageId: info.messageId };

  } catch (error) {
    // ── SMTP failure → graceful fallback (log OTP, never throw) ────────
    console.error('❌ [EMAIL SEND ERROR]:', error.message);
    console.log(`🔑 [FALLBACK OTP for ${toEmail}]: ${otp}`);
    // Return success:true with simulated flag so the OTP flow can continue.
    // The OTP is already saved in DB — user can proceed if they have the code
    // (e.g. shown on screen in dev/staging or retrieved by admin from logs).
    return {
      success: true,
      simulated: true,
      emailError: error.message
    };
  }
};

module.exports = { sendOtpEmail };

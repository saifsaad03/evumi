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
  if (user) return `"e-ভূমি ডিজিটাল ভূমি সেবা" <${user}>`;
  return '"e-ভূমি ডিজিটাল ভূমি সেবা" <no-reply@evhumi.gov.bd>';
};

/**
 * Generates a modern, responsive, and visually stunning Government of Bangladesh
 * e-Vhumi branded HTML email template.
 */
const generateTemplateHtml = ({
  title,
  badgeText,
  badgeColor = '#059669',
  badgeBg = '#ecfdf5',
  citizenName,
  subtitle,
  otp,
  validityMinutes = 10,
  details = [],
  warningText
}) => {
  const formattedOtp = (otp || '').toString().trim();

  // Build key-value details table rows if present
  let detailsRowsHtml = '';
  if (details && details.length > 0) {
    const rows = details
      .filter(d => d.value && d.value !== 'N/A')
      .map(d => `
        <tr>
          <td style="padding: 9px 14px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9; width: 38%; background-color: #f8fafc;">
            ${d.label}
          </td>
          <td style="padding: 9px 14px; font-size: 13px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9;">
            ${d.value}
          </td>
        </tr>
      `)
      .join('');

    if (rows) {
      detailsRowsHtml = `
        <div style="margin: 22px 0 24px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; text-transform: uppercase;">
            📋 সংশ্লিষ্ট জমির রেকর্ড ও দলিলের বিবরণ:
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container-table { width: 100% !important; border-radius: 0 !important; }
      .content-padding { padding: 24px 18px !important; }
      .otp-display { font-size: 32px !important; letter-spacing: 8px !important; }
      .header-padding { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f1f5f9; font-family: 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <center style="width: 100%; background-color: #f1f5f9;">
    <!-- Main Email Container Wrapper -->
    <table role="presentation" class="container-table" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">

      <!-- Top National Header Banner -->
      <tr>
        <td class="header-padding" style="background: linear-gradient(135deg, #064e3b 0%, #0f5132 50%, #047857 100%); padding: 32px 28px; text-align: center; position: relative;">
          <!-- Top gold ornamental strip -->
          <div style="height: 4px; background: linear-gradient(90deg, #b8912f, #f59e0b, #fbbf24, #b8912f); margin: -32px -28px 24px -28px;"></div>
          
          <!-- Government Crest / Title -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center">
                <div style="width: 52px; height: 52px; background: rgba(255, 255, 255, 0.15); border: 1.5px solid rgba(251, 191, 36, 0.6); border-radius: 50%; line-height: 52px; font-size: 26px; margin: 0 auto 12px auto; box-shadow: 0 4px 14px rgba(0,0,0,0.2);">
                  🏛️
                </div>
                <h1 style="margin: 0; color: #ffffff; font-size: 21px; font-weight: 800; letter-spacing: 0.3px; line-height: 1.3;">
                  গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
                </h1>
                <p style="margin: 5px 0 0 0; color: #a7f3d0; font-size: 13px; font-weight: 600; letter-spacing: 0.2px;">
                  ভূমি মন্ত্রণালয় · ভূমি ডিজিটালাইজেশন ও ই-নামজারি বিভাগ
                </p>
                <div style="display: inline-block; margin-top: 10px; padding: 3px 12px; background: rgba(255, 255, 255, 0.12); border-radius: 20px; font-size: 11px; color: #fef08a; font-weight: 700; letter-spacing: 0.5px;">
                  ✨ e-ভূমি জাতীয় পোর্টাল — স্মার্ট ভূমি সেবা
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Main Body Content -->
      <tr>
        <td class="content-padding" style="padding: 34px 32px 28px; background-color: #ffffff;">

          <!-- Category Badge -->
          <div style="text-align: center; margin-bottom: 18px;">
            <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; border: 1.5px solid ${badgeColor}33; padding: 6px 16px; border-radius: 30px; font-size: 12px; font-weight: 800; letter-spacing: 0.4px;">
              ${badgeText}
            </span>
          </div>

          <!-- Title -->
          <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 20px; font-weight: 800; text-align: center; line-height: 1.4;">
            ${title}
          </h2>

          <!-- Subtitle / Greeting -->
          <div style="font-size: 14px; line-height: 1.7; color: #334155; text-align: center; margin-bottom: 22px;">
            ${citizenName ? `<p style="margin: 0 0 6px 0; font-size: 15px; color: #0f172a;">শ্রদ্ধেয় <strong>${citizenName}</strong>,</p>` : ''}
            <p style="margin: 0; color: #475569;">${subtitle}</p>
          </div>

          <!-- Specific Transaction / Land Details Table (if any) -->
          ${detailsRowsHtml}

          <!-- High-Contrast OTP Card -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 26px 0;">
            <tr>
              <td align="center" style="background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px dashed #059669; border-radius: 16px; padding: 26px 20px; text-align: center; box-shadow: 0 6px 18px rgba(16, 185, 129, 0.12);">
                <div style="font-size: 12px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                  🔐 আপনার গোপন ওটিপি (OTP) ভেরিফিকেশন কোড
                </div>
                
                <!-- Stylized Monospace OTP Display -->
                <div class="otp-display" style="display: inline-block; background: #ffffff; color: #064e3b; font-family: 'SF Pro Display', Consolas, Monaco, 'Courier New', Courier, monospace; font-size: 40px; font-weight: 800; letter-spacing: 12px; padding: 12px 28px 12px 38px; border-radius: 12px; border: 1.5px solid #a7f3d0; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.18);">
                  ${formattedOtp}
                </div>

                <!-- Validity Timer Pill -->
                <div style="margin-top: 14px;">
                  <span style="display: inline-block; background-color: #ffffff; color: #d97706; border: 1px solid #fde68a; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;">
                    ⏱️ মেয়াদ: পরবর্তী ${validityMinutes} মিনিট পর্যন্ত কার্যকর
                  </span>
                </div>
              </td>
            </tr>
          </table>

          <!-- Security Warning Alert Box -->
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 18px; margin: 24px 0 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="vertical-align: top; width: 24px; font-size: 18px; line-height: 1.2;">
                  🛡️
                </td>
                <td style="padding-left: 8px; font-size: 13px; color: #991b1b; line-height: 1.5;">
                  <strong>সাইবার নিরাপত্তা ও সতর্কতা:</strong> ${warningText || 'এই ওটিপি কোডটি অত্যন্ত সংবেদনশীল ও গোপনীয়। ভূমি মন্ত্রণালয়ের কোনো কর্মকর্তা বা অন্য কাউকে এই কোড শেয়ার করবেন না। শুধুমাত্র সিস্টেমের অফিশিয়াল ভেরিফিকেশন বক্সে এটি ইনপুট দিন।'}
                </td>
              </tr>
            </table>
          </div>

          <!-- Helpdesk Support Strip -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 18px; text-align: center; margin-top: 20px; font-size: 12px; color: #64748b;">
            📞 ভূমি সেবা হেল্পলাইন: <strong>১৬১২২</strong> (টোল ফ্রি) | ২৪/৭ নাগরিক সহায়তা
          </div>

        </td>
      </tr>

      <!-- Footer Section -->
      <tr>
        <td style="background-color: #0f172a; padding: 24px 28px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.7; border-top: 1px solid #1e293b;">
          <p style="margin: 0 0 6px 0; color: #cbd5e1; font-weight: 700;">
            ভূমি মন্ত্রণালয় · গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
          </p>
          <p style="margin: 0 0 10px 0; font-size: 11px; color: #64748b;">
            এটি একটি সিস্টেম-জেনারেটেড স্বয়ংক্রিয় ডিজিটাল নিরাপত্তা বার্তা। এই ইমেইলে রিপ্লাই দেওয়ার প্রয়োজন নেই।
          </p>
          <div style="height: 1px; background: #1e293b; margin: 12px auto; max-width: 400px;"></div>
          <p style="margin: 0; font-size: 11px; color: #475569;">
            © ২০২৬ e-ভূমি প্ল্যাটফর্ম | সর্বস্বত্ব সংরক্ষিত
          </p>
        </td>
      </tr>

    </table>
  </center>

</body>
</html>
  `;
};

/**
 * Send an OTP Email to a recipient with an ultra-polished government-grade template.
 * NEVER throws — always returns a result object.
 *
 * @param {string} toEmail      - Recipient email address
 * @param {string} otp          - 6-digit OTP code
 * @param {string} purpose      - 'ACCOUNT_REGISTRATION' | 'LAND_ASSIGNMENT' | 'DEED_REGISTRATION'
 * @param {object} extraDetails - { citizen_name, dag_no, mouza, khatian_no, deed_no }
 * @returns {{ success: boolean, simulated?: boolean, error?: string, messageId?: string }}
 */
const sendOtpEmail = async (toEmail, otp, purpose, extraDetails = {}) => {
  try {
    let title = 'জমি বরাদ্দ ও নাগরিক সম্মতি ওটিপি';
    let badgeText = '🏛️ সাব-রেজিস্ট্রি সম্মতি যাচাই';
    let badgeColor = '#0d9488';
    let badgeBg = '#f0fdfa';
    let subtitle = `সাব-রেজিস্ট্রি অফিস থেকে আপনার অনুকূলে জমি বরাদ্দের আবেদন যাচাইয়ের জন্য এই ওটিপি কোডটি প্রদান করা হয়েছে।`;
    let warningText = 'এই ওটিপি কোডটি প্রদান করলে সাব-রেজিস্ট্রি অফিসে উল্লিখিত জমিটি আপনার অনুকূলে রেকর্ডভুক্ত করার সরকারি সম্মতি হিসেবে গণ্য হবে। আপনি সম্মতি না দিলে কোডটি কারো সাথে শেয়ার করবেন না।';

    const details = [];

    if (purpose === 'ACCOUNT_REGISTRATION') {
      title = 'নাগরিক অ্যাকাউন্ট সক্রিয়করণ ওটিপি কোড';
      badgeText = '👤 নতুন নাগরিক নিবন্ধন';
      badgeColor = '#059669';
      badgeBg = '#ecfdf5';
      subtitle = 'e-ভূমি ডিজিটাল ভূমি সেবা প্ল্যাটফর্মে আপনার নাগরিক অ্যাকাউন্ট নিরাপদভাবে সক্রিয় করতে নিচের ৬ ডিজিটের ওটিপি কোডটি ব্যবহার করুন।';
      warningText = 'নিবন্ধন সম্পন্ন করতে এই ওটিপি কোডটি রেজিস্ট্রেশন পেজের নির্দিষ্ট ঘরে লিখুন। কোনো তৃতীয় পক্ষের সাথে এটি শেয়ার করবেন না।';
    } else if (purpose === 'LAND_ASSIGNMENT') {
      title = 'জমি বরাদ্দ ও সাব-রেজিস্ট্রি সম্মতি কোড';
      badgeText = '📑 ভূমি বরাদ্দ ও রেকর্ড সম্পাদন';
      badgeColor = '#0284c7';
      badgeBg = '#f0f9ff';
      subtitle = `সাব-রেজিস্ট্রি অফিস কর্তৃক জমি বরাদ্দ প্রক্রিয়া চূড়ান্ত করতে আপনার সম্মতি ওটিপি প্রয়োজন।`;
      if (extraDetails.mouza) details.push({ label: 'মৌজার নাম', value: extraDetails.mouza });
      if (extraDetails.dag_no) details.push({ label: 'দাগ নম্বর', value: extraDetails.dag_no });
      if (extraDetails.khatian_no) details.push({ label: 'খতিয়ান নম্বর', value: extraDetails.khatian_no });
    } else if (purpose === 'DEED_REGISTRATION') {
      title = 'সাব-রেজিস্ট্রি দলিল নিবন্ধন সম্মতি ওটিপি';
      badgeText = '⚖️ সাব-রেজিস্ট্রি দলিল সম্পাদন (বাধ্যতামূলক)';
      badgeColor = '#d97706';
      badgeBg = '#fffbeb';
      subtitle = `সাব-রেজিস্ট্রি অফিসে দলিল নিবন্ধনের ক্ষেত্রে আপনার ডিজিটাল সম্মতি নিশ্চিতে এই ওটিপি কোডটি প্রেরণ করা হয়েছে।`;
      warningText = 'সাব-রেজিস্ট্রি অফিসে দলিল নিবন্ধনের ক্ষেত্রে ওটিপি প্রদান বাধ্যতামূলক। আপনি দলিল নিবন্ধনে পুরোপুরি একমত না হলে এই ওটিপি প্রদান করবেন না।';
      if (extraDetails.deed_no) details.push({ label: 'দলিল নম্বর', value: extraDetails.deed_no });
      if (extraDetails.mouza) details.push({ label: 'মৌজা', value: extraDetails.mouza });
      if (extraDetails.khatian_no) details.push({ label: 'খতিয়ান নম্বর', value: extraDetails.khatian_no });
      if (extraDetails.dag_no) details.push({ label: 'দাগ নম্বর', value: extraDetails.dag_no });
    }

    const htmlContent = generateTemplateHtml({
      title,
      badgeText,
      badgeColor,
      badgeBg,
      citizenName: extraDetails.citizen_name,
      subtitle,
      otp,
      validityMinutes: 10,
      details,
      warningText
    });

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
      subject: `[e-ভূমি] ${title} — কোড: ${otp}`,
      html: htmlContent
    });

    console.log(`✅ [EMAIL SENT] To: ${toEmail} | MessageId: ${info.messageId}`);
    return { success: true, simulated: false, messageId: info.messageId };

  } catch (error) {
    // ── SMTP failure → graceful fallback (log OTP, never throw) ────────
    console.error('❌ [EMAIL SEND ERROR]:', error.message);
    console.log(`🔑 [FALLBACK OTP for ${toEmail}]: ${otp}`);
    return {
      success: true,
      simulated: true,
      emailError: error.message
    };
  }
};

module.exports = {
  sendOtpEmail,
  generateTemplateHtml
};

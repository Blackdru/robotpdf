const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_LOGIN || process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, type = 'verification') => {
  try {
    const transporter = createTransporter();

    const subject = type === 'verification' 
      ? 'Verify Your Email - RobotPDF' 
      : 'Password Reset OTP - RobotPDF';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background-color: #3B82F6;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .otp-box {
            background-color: #f0f7ff;
            border: 2px dashed #3B82F6;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            border-radius: 5px;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #3B82F6;
            letter-spacing: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RobotPDF</h1>
          </div>
          <div class="content">
            <h2>${type === 'verification' ? 'Verify Your Email' : 'Reset Your Password'}</h2>
            <p>Hello,</p>
            <p>${type === 'verification' 
              ? 'Thank you for registering with RobotPDF. Please use the following OTP to verify your email address:' 
              : 'You requested to reset your password. Please use the following OTP:'}</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't request this, please ignore this email.</p>
            
            <p>Best regards,<br>The RobotPDF Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"RobotPDF" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: html,
      replyTo: process.env.SMTP_USER
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ OTP Email sent successfully');
    console.log('  To:', email);
    console.log('  Message ID:', info.messageId);
    console.log('  Response:', info.response);
    console.log('  OTP Code:', otp);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Error sending OTP email:', error.message);
    console.error('  Full error:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background-color: #3B82F6;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #3B82F6;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to RobotPDF!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Welcome to RobotPDF - Your Beautiful PDF Tools Platform!</p>
            <p>Your email has been successfully verified and your account is now active.</p>
            
            <p>With RobotPDF, you can:</p>
            <ul>
              <li>Merge, split, and compress PDF files</li>
              <li>Convert documents to and from PDF</li>
              <li>Extract text with OCR</li>
              <li>AI-powered PDF analysis</li>
              <li>And much more!</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
                Get Started
              </a>
            </div>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Best regards,<br>The RobotPDF Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"RobotPDF" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to RobotPDF!',
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Send subscription upgrade email
const sendSubscriptionUpgradeEmail = async (email, name, plan, details) => {
  try {
    const transporter = createTransporter();
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
    const price = plan === 'basic' ? '₹99' : '₹499';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
          .plan-box { background: linear-gradient(135deg, #f0f7ff 0%, #f3e8ff 100%); border: 2px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 10px; }
          .feature { padding: 8px 0; border-bottom: 1px solid #eee; }
          .feature:last-child { border-bottom: none; }
          .button { display: inline-block; padding: 12px 30px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ${planName} Plan!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for upgrading to the <strong>${planName} Plan</strong>! Your subscription is now active.</p>
            
            <div class="plan-box">
              <h3 style="margin-top: 0; color: #3B82F6;">${planName} Plan Details</h3>
              <p><strong>Price:</strong> ${price}/month</p>
              <p><strong>Billing Period:</strong> ${new Date(details.current_period_start).toLocaleDateString()} - ${new Date(details.current_period_end).toLocaleDateString()}</p>
              <p><strong>Next Billing Date:</strong> ${new Date(details.current_period_end).toLocaleDateString()}</p>
            </div>
            
            <h3>Your ${planName} Features:</h3>
            <div>
              ${plan === 'basic' ? `
                <div class="feature">✓ 50 files per month</div>
                <div class="feature">✓ 50MB max file size</div>
                <div class="feature">✓ 500MB storage</div>
                <div class="feature">✓ 25 Advanced OCR pages</div>
                <div class="feature">✓ 25 AI chat messages</div>
                <div class="feature">✓ 25 AI summaries</div>
                <div class="feature">✓ Advanced tools access</div>
                <div class="feature">✓ Ad-free experience</div>
              ` : `
                <div class="feature">✓ Unlimited files</div>
                <div class="feature">✓ 200MB max file size</div>
                <div class="feature">✓ Unlimited storage</div>
                <div class="feature">✓ Unlimited OCR</div>
                <div class="feature">✓ Unlimited AI chat</div>
                <div class="feature">✓ Unlimited AI summaries</div>
                <div class="feature">✓ All advanced tools</div>
                <div class="feature">✓ Priority support</div>
                <div class="feature">✓ API access</div>
              `}
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
                Start Using Your Plan
              </a>
            </div>
            
            <p>Need help? Contact us anytime at support@robotpdf.com</p>
            <p>Best regards,<br>The RobotPDF Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"RobotPDF" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Welcome to ${planName} Plan - RobotPDF`,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Subscription upgrade email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Error sending subscription upgrade email:', error);
    return { success: false, error: error.message };
  }
};

// Send subscription expiry email
const sendSubscriptionExpiryEmail = async (email, name, plan) => {
  try {
    const transporter = createTransporter();
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background-color: #EF4444; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
          .notice-box { background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Subscription Has Expired</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your <strong>${planName} Plan</strong> subscription has expired and your account has been downgraded to the Free plan.</p>
            
            <div class="notice-box">
              <strong>What this means:</strong>
              <ul style="margin: 10px 0;">
                <li>You now have access to free plan features only</li>
                <li>Limited file processing (10MB max)</li>
                <li>No AI features or advanced tools</li>
                <li>Your files are safe and accessible</li>
              </ul>
            </div>
            
            <h3>Want to Continue with ${planName} Features?</h3>
            <p>Renew your subscription now and get back all your premium features instantly!</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing" class="button">
                Renew Subscription
              </a>
            </div>
            
            <p>Questions? We're here to help at support@robotpdf.com</p>
            <p>Best regards,<br>The RobotPDF Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"RobotPDF" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Subscription Has Expired - RobotPDF',
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Subscription expiry email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Error sending subscription expiry email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendSubscriptionUpgradeEmail,
  sendSubscriptionExpiryEmail,
};

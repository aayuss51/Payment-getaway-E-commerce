import nodemailer from "nodemailer";

const gmailUser = (process.env.GMAIL_USER && process.env.GMAIL_USER.trim() !== "") 
  ? process.env.GMAIL_USER.trim() 
  : "supportbazaar@gmail.com";

const gmailPass = (process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_APP_PASSWORD.trim() !== "")
  ? process.env.GMAIL_APP_PASSWORD.trim()
  : null;

export const sendEmail = async (options: { to: string; subject: string; html: string }) => {
  const forceSimulation = process.env.FORCE_EMAIL_SIMULATION === "true";

  try {
    let transporter;
    let fromAddress;

    if (!gmailPass || forceSimulation) {
      console.warn(`[Email] No Gmail password configured. Generating Ethereal test email account...`);
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      fromAddress = `"BazaarNepal Test" <${testAccount.user}>`;
    } else {
      const sanitizedPass = gmailPass.replace(/\s/g, "");
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: gmailUser,
          pass: sanitizedPass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      fromAddress = `"BazaarNepal Support" <${gmailUser}>`;
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      ...options,
    });

    if (!gmailPass || forceSimulation) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Email] Test email sent successfully! Preview URL: ${previewUrl}`);
      console.info(`[Email] The OTP code sent was: ${options.html.match(/\d{6}/)?.[0] || 'Unknown'}`);
      return { success: true, simulated: true, previewUrl };
    }

    return { success: true };
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    console.error(`[Email] Failed to send to ${options.to}:`, errorMessage);
    
    if (errorMessage.includes('535') || errorMessage.includes('Invalid login')) {
      console.warn(`[Email] SMTP Auth failed for ${gmailUser}.`);
      return { success: true, simulated: true, warning: 'SMTP Auth Failed' };
    }

    return { success: false, error: errorMessage };
  }
};

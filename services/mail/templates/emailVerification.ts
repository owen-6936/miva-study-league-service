/**
 * Generates the HTML for the Verification Email
 * @param {string} name - The student's name
 * @param {string} verificationCode - The 6-digit code (e.g., "492015")
 */
const getVerificationEmailTemplate = (name: string, verificationCode: string) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Verify your Account</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0;">
    
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      
      <!-- Header -->
      <tr>
        <td style="background-color: #ef4444; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">MIVA Study League</h1>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="color: #18181b; margin-top: 0; font-size: 20px;">Welcome to the League!</h2>
          <p style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
            Hello <strong>${name}</strong>,<br><br>
            You are almost ready to join the arena. Please use the verification code below to confirm your school email address and activate your account.
          </p>

          <!-- Verification Code Box -->
          <div style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0; color: #71717a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Verification Code</p>
            <h1 style="margin: 0; color: #18181b; font-size: 42px; font-weight: 800; letter-spacing: 6px;">${verificationCode}</h1>
          </div>

          <p style="color: #71717a; font-size: 14px; line-height: 20px;">
            <em>This code will expire in 15 minutes. If you did not request this email, you can safely ignore it.</em>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f4f4f5; border-top: 1px solid #e4e4e7; padding: 20px; text-align: center;">
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} MIVA Study League. All rights reserved.
          </p>
        </td>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
      </tr>

    </table>
    
  </body>
  </html>
  `;
};

const verificationEmailSubject = 'Verify Your Email Address';
const verificationEmailFrom = 'MIVA Study League <noreply@mivastudyleague.org>';

export default getVerificationEmailTemplate;
export { verificationEmailSubject, verificationEmailFrom };
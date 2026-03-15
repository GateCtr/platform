import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeWaitlistEmail(
  email: string,
  name: string | null,
  position: number
) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'GateCtr <noreply@gatectr.io>',
      to: email,
      subject: "You're on the GateCtr waitlist!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to GateCtr!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; margin-bottom: 20px;">
                ${name ? `Hi ${name},` : 'Hi there,'}
              </p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thanks for joining the GateCtr waitlist! We're excited to have you on board.
              </p>
              
              <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #4a5568;">
                  <strong style="font-size: 18px; color: #2d3748;">You're #${position} in line</strong><br>
                  We're onboarding users in batches to ensure the best experience.
                </p>
              </div>
              
              <h2 style="color: #2d3748; font-size: 20px; margin-top: 30px;">What's Next?</h2>
              
              <ul style="color: #4a5568; font-size: 15px; line-height: 1.8;">
                <li>We'll notify you when it's your turn</li>
                <li>Get early access to exclusive features</li>
                <li>Join our community of LLM cost optimizers</li>
              </ul>
              
              <h2 style="color: #2d3748; font-size: 20px; margin-top: 30px;">Why GateCtr?</h2>
              
              <div style="margin: 20px 0;">
                <div style="margin-bottom: 15px;">
                  <strong style="color: #667eea;">💰 Budget Firewall</strong>
                  <p style="margin: 5px 0 0 0; color: #4a5568; font-size: 14px;">Set hard limits and soft alerts to control LLM costs</p>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <strong style="color: #667eea;">⚡ Context Optimizer</strong>
                  <p style="margin: 5px 0 0 0; color: #4a5568; font-size: 14px;">Reduce token usage by up to 40% with intelligent compression</p>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <strong style="color: #667eea;">🎯 Model Router</strong>
                  <p style="margin: 5px 0 0 0; color: #4a5568; font-size: 14px;">Automatically select the optimal LLM for each request</p>
                </div>
              </div>
              
              <p style="font-size: 14px; color: #718096; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                Questions? Reply to this email or visit our <a href="https://gatectr.io" style="color: #667eea; text-decoration: none;">website</a>.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #a0aec0; font-size: 12px;">
              <p>GateCtr - Control Your LLM Costs</p>
              <p>© ${new Date().getFullYear()} GateCtr. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send waitlist email:', error);
    return { success: false, error };
  }
}

export async function sendInviteEmail(
  email: string,
  name: string | null,
  inviteCode: string
) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'GateCtr <noreply@gatectr.io>',
      to: email,
      subject: "Your GateCtr invite is ready!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; margin-bottom: 20px;">
                ${name ? `Hi ${name},` : 'Hi there,'}
              </p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Great news! Your spot in GateCtr is ready. Click the button below to get started.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/sign-up?invite=${inviteCode}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                  Create Your Account
                </a>
              </div>
              
              <p style="font-size: 14px; color: #718096; text-align: center;">
                Or copy this invite code: <strong style="color: #667eea;">${inviteCode}</strong>
              </p>
              
              <div style="background: #f7fafc; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #2d3748;">Get Started in 5 Minutes</h3>
                <ol style="color: #4a5568; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Create your account</li>
                  <li>Add your LLM API keys</li>
                  <li>Get your GateCtr API key</li>
                  <li>Replace your endpoint URL</li>
                  <li>Start saving on LLM costs!</li>
                </ol>
              </div>
              
              <p style="font-size: 14px; color: #718096; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                This invite link expires in 7 days. Questions? Reply to this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #a0aec0; font-size: 12px;">
              <p>GateCtr - Control Your LLM Costs</p>
              <p>© ${new Date().getFullYear()} GateCtr. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send invite email:', error);
    return { success: false, error };
  }
}

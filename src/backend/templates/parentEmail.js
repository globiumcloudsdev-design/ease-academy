/**
 * Email Templates for Parent Management
 * Returns HTML email body based on template type
 */

export const getParentEmailTemplate = (type, parent, schoolName = 'Ease Academy') => {
  const baseStyles = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
    line-height: 1.6;
  `;

  const headerStyles = `
    background: linear-gradient(135deg, #2b7a78 0%, #1f8a70 100%);
    color: white;
    padding: 28px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  `;

  const containerStyles = `
    max-width: 600px;
    margin: 0 auto;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  `;

  const contentStyles = `
    padding: 26px;
    background: #f9f9f9;
  `;

  const detailsStyles = `
    background: white;
    padding: 18px;
    border-radius: 4px;
    margin: 16px 0;
    border-left: 4px solid #2b7a78;
  `;

  const footerStyles = `
    background: #f0f0f0;
    padding: 18px;
    text-align: center;
    font-size: 12px;
    color: #666;
    border-top: 1px solid #ddd;
  `;

  const parentInfo = `
    <div style="${detailsStyles}">
      <h4 style="margin-top: 0; color: #2b7a78;">Parent Information</h4>
      <table style="width:100%; font-size:14px;">
        <tr>
          <td style="padding:6px 0; font-weight:bold; width:40%;">Name:</td>
          <td style="padding:6px 0;">${parent.fullName || `${parent.firstName || ''} ${parent.lastName || ''}`.trim()}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; font-weight:bold;">Email:</td>
          <td style="padding:6px 0;">${parent.email || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; font-weight:bold;">Phone:</td>
          <td style="padding:6px 0;">${parent.phone || 'N/A'}</td>
        </tr>
      </table>
    </div>
  `;

  if (type === 'PARENT_APPROVED') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { ${baseStyles} }
          .container { ${containerStyles} }
          .header { ${headerStyles} }
          .content { ${contentStyles} }
          .details { ${detailsStyles} }
          .footer { ${footerStyles} }
          .success { background:#e6fffa; color:#065f46; padding:10px 14px; border-radius:4px; margin:12px 0; border:1px solid #b7f5e6; font-weight:600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0; font-size:26px;">🛡️ ${schoolName}</h2>
            <p style="margin:8px 0 0 0; font-size:14px;">Account Approved</p>
          </div>
          <div class="content">
            <p style="margin-top:0; font-size:16px; font-weight:500;">Dear ${parent.firstName || parent.fullName || ''},</p>
            <div class="success">✅ Your account has been approved successfully!</div>

            ${parentInfo}

            <p style="margin:18px 0 0 0; color:#666; font-size:14px;">You can now access your parent dashboard to view your children's academic progress, attendance, announcements, and more.</p>

            <div style="${detailsStyles}">
              <h4 style="margin-top:0; color:#2b7a78;">Getting Started</h4>
              <ul style="margin:8px 0; padding-left:20px;">
                <li>Login to your account using your email and password</li>
                <li>View your children's profiles and academic records</li>
                <li>Check attendance and performance reports</li>
                <li>Receive important announcements and notifications</li>
                <li>Communicate with teachers and school administration</li>
              </ul>
            </div>

            <p style="margin:20px 0 0 0;">Welcome to the ${schoolName} family!</p>
            <p style="margin:8px 0 0 0;">Best regards,<br><strong>${schoolName} Administration</strong></p>
          </div>
          <div class="footer">
            <p style="margin:0;">This is an automated email. Please do not reply to this message.</p>
            <p style="margin:6px 0 0 0;">&copy; ${new Date().getFullYear()} ${schoolName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Default template
  return `<html><body><p>Hello ${parent.firstName || parent.fullName || ''},</p><p>Your parent account has been updated.</p></body></html>`;
};

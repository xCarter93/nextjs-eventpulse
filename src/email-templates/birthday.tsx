interface BirthdayEmailProps {
	subject: string;
	message: string;
	animationUrl: string;
	colorScheme?: {
		primary: string;
		secondary: string;
		accent: string;
		background: string;
	};
}

export const getBirthdayEmailHtml = ({
	subject,
	message,
	animationUrl,
	colorScheme = {
		primary: "#111827",
		secondary: "#374151",
		accent: "#e5e7eb",
		background: "#ffffff",
	},
}: BirthdayEmailProps): string => {
	return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="background-color: #f9fafb; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
        <div style="max-width: 600px; margin: 20px auto; padding: 24px; background-color: ${colorScheme.background}; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <h1 style="color: ${colorScheme.primary}; font-size: 30px; font-weight: 700; line-height: 1.3; margin: 0 0 32px 0; text-align: center;">
            ${subject}
          </h1>
          <div style="margin: 32px 0; text-align: center;">
            <img src="${animationUrl}" alt="Animation" style="max-width: 400px; width: 100%; height: auto; margin: 0 auto; display: block;">
          </div>
          <p style="color: ${colorScheme.secondary}; font-size: 18px; line-height: 1.6; margin: 32px 0; text-align: center;">
            ${message}
          </p>
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid ${colorScheme.accent}; text-align: center;">
            <p style="color: ${colorScheme.secondary}; font-size: 14px; margin: 16px 0 0; text-align: center;">
              Sent with ❤️ from <a href="https://eventpulse.com" style="color: ${colorScheme.primary}; text-decoration: none;">EventPulse</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

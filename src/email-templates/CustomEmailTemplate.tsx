import { type EmailComponent } from "../types/email-components";

interface ColorScheme {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
}

interface CustomEmailTemplateProps {
	components: EmailComponent[];
	colorScheme?: ColorScheme;
}

const defaultColorScheme: ColorScheme = {
	primary: "#0F172A",
	secondary: "#334155",
	accent: "#2563EB",
	background: "#F8FAFC",
};

function renderComponent(component: EmailComponent, colorScheme: ColorScheme) {
	switch (component.type) {
		case "heading":
			return `<h2 style="color: ${colorScheme.primary}; margin: 0 0 24px;">${component.content}</h2>`;
		case "text":
			return `<p style="color: ${colorScheme.secondary}; margin: 0 0 16px; line-height: 1.5;">${component.content}</p>`;
		case "button":
			return `<a href="${component.url}" style="display: inline-block; padding: 12px 24px; background-color: ${colorScheme.accent}; color: white; text-decoration: none; border-radius: 6px; margin: 0 0 24px;">${component.content}</a>`;
		case "image":
			return `<img src="${component.url}" alt="${component.alt}" style="max-width: 100%; height: auto; margin: 0 0 24px;" />`;
		default:
			return "";
	}
}

export function getCustomEmailHtml({
	components,
	colorScheme = defaultColorScheme,
}: CustomEmailTemplateProps): string {
	const emailBody = components
		.map((component) => renderComponent(component, colorScheme))
		.join("");

	return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EventPulse Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background-color: ${colorScheme.background};">
        <table width="100%" cellpadding="0" cellspacing="0" style="min-width: 100%; background-color: ${colorScheme.background};">
          <tr>
            <td align="center" style="padding: 45px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px;">
                    ${emailBody}
                  </td>
                </tr>
              </table>
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <p style="margin: 0; color: ${colorScheme.secondary}; font-size: 14px;">
                      Powered by <a href="https://eventpulse.tech" style="color: ${colorScheme.accent}; text-decoration: none;">EventPulse</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

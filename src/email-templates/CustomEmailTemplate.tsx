import { type EmailComponent } from "../types/email-components";
import { emailIcons } from "../lib/email-icons";

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
			return `<h2 style="color: ${colorScheme.primary}; margin: 0 0 24px; text-align: center; font-size: 24px; font-weight: 600;">${component.content}</h2>`;
		case "text":
			return `<div style="text-align: center;"><p style="color: ${colorScheme.secondary}; margin: 0 0 16px; line-height: 1.5; display: inline-block; max-width: 600px;">${component.content}</p></div>`;
		case "button":
			const buttonUrl = component.url || "https://www.eventpulse.tech";
			return `
				<div style="text-align: center; margin: 0 0 24px;">
					<a href="${buttonUrl}" 
						style="display: inline-block; padding: 12px 24px; background-color: ${colorScheme.accent}; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; cursor: pointer;"
					>
						${component.content}
					</a>
				</div>
			`;
		case "image":
			return `<div style="text-align: center; margin: 0 0 24px;"><img src="${component.url}" alt="${component.alt}" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>`;
		case "event":
			return `
				<table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
					<tr>
						<td style="vertical-align: middle; padding-right: 24px; width: 48px;">
							<div style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
								${emailIcons.calendar(colorScheme.accent)}
							</div>
						</td>
						<td style="vertical-align: middle;">
							<p style="color: ${colorScheme.primary}; margin: 0; font-size: 20px; font-weight: 600;">${component.placeholderTitle}</p>
							<p style="color: ${colorScheme.secondary}; margin: 8px 0 0; font-size: 16px;">
								${new Date(component.placeholderDate).toLocaleDateString(undefined, {
									weekday: "long",
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						</td>
					</tr>
				</table>
			`;
		case "divider":
			return `<hr style="border: none; border-top: 1px solid ${colorScheme.accent}; margin: 24px 0;" />`;
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
      <body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="min-width: 100%; background-color: #f3f4f6;">
          <tr>
            <td align="center" style="padding: 45px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: ${colorScheme.background}; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px;">
                    ${emailBody}
                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid ${colorScheme.accent}; text-align: center;">
                      <p style="margin: 0; font-size: 14px;">
                        <span style="color: ${colorScheme.secondary};">Sent with ❤️ from </span>
                        <a href="https://www.eventpulse.tech" style="color: ${colorScheme.primary}; text-decoration: none; font-weight: 500;">EventPulse</a>
                      </p>
                    </div>
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

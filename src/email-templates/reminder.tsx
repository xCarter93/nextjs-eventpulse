interface Event {
	type: "birthday" | "event" | "holiday";
	name: string;
	date: Date;
	description?: string;
}

interface ReminderEmailProps {
	userName: string;
	events: Event[];
}

const formatDate = (date: Date): string => {
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	});
};

export const getReminderEmailHtml = ({
	userName,
	events,
}: ReminderEmailProps): string => {
	const eventsList = events
		.map(
			(event) => `
    <div style="margin-bottom: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h3 style="color: #111827; margin: 0 0 8px 0; font-size: 18px;">
        ${event.name} - ${event.type.charAt(0).toUpperCase() + event.type.slice(1)}
      </h3>
      <p style="color: #374151; margin: 0; font-size: 16px;">
        ${formatDate(event.date)}
      </p>
      ${
				event.description
					? `
        <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 14px;">
          ${event.description}
        </p>
      `
					: ""
			}
    </div>
  `
		)
		.join("");

	return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Upcoming Events Reminder</title>
      </head>
      <body style="background-color: #f9fafb; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
        <div style="max-width: 600px; margin: 20px auto; padding: 24px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3; margin: 0 0 24px 0;">
            Hello ${userName},
          </h1>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Here are your upcoming events:
          </p>
          <div style="margin: 24px 0;">
            ${eventsList}
          </div>
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 16px 0 0; text-align: center;">
              Sent with ❤️ from <a href="https://eventpulse.com" style="color: #3B82F6; text-decoration: none;">EventPulse</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

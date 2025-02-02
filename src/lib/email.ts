import { render } from "@react-email/render";
import { EmailTemplate } from "@/email-templates/EmailTemplate";
import { type EmailComponent } from "@/types/email-components";
import { type ColorScheme } from "@/types";

export async function renderEmailToHtml(
	components: EmailComponent[],
	colorScheme?: ColorScheme
): Promise<string> {
	return render(EmailTemplate({ components, colorScheme }));
}

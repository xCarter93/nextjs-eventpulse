import RecipientsForm from "./forms/RecipientsForm";
import EmailContentForm from "./forms/EmailContentForm";
import ColorSchemeForm from "./forms/ColorSchemeForm";
import {
	recipientsSchema,
	emailContentSchema,
	colorSchemeSchema,
} from "@/lib/validation";
import * as z from "zod";

type FormData = z.infer<
	typeof recipientsSchema & typeof emailContentSchema & typeof colorSchemeSchema
>;

export type EditorFormProps = {
	defaultValues?: FormData;
	onFormChange: (data: Partial<FormData>) => void;
};

export const steps: {
	title: string;
	component: React.ComponentType<EditorFormProps>;
	key: string;
}[] = [
	{
		title: "Who",
		component: RecipientsForm,
		key: "recipients",
	},
	{
		title: "When",
		component: EmailContentForm,
		key: "email-content",
	},
	{
		title: "What",
		component: ColorSchemeForm,
		key: "color-scheme",
	},
];

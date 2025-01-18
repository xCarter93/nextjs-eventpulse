import RecipientsAnimationForm from "./forms/RecipientsAnimationForm";
import EmailContentForm from "./forms/EmailContentForm";
import ColorSchemeForm from "./forms/ColorSchemeForm";
import {
	recipientsAnimationSchema,
	emailContentSchema,
	colorSchemeSchema,
} from "@/lib/validation";
import * as z from "zod";

type FormData = z.infer<
	typeof recipientsAnimationSchema &
		typeof emailContentSchema &
		typeof colorSchemeSchema
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
		title: "Recipients & Animation",
		component: RecipientsAnimationForm,
		key: "recipients-animation",
	},
	{
		title: "Email Content",
		component: EmailContentForm,
		key: "email-content",
	},
	{
		title: "Color Scheme",
		component: ColorSchemeForm,
		key: "color-scheme",
	},
];

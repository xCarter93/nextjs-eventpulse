"use client";

import { Button } from "@heroui/react";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody } from "@heroui/react";
import { HelpCircle } from "lucide-react";
import { useState } from "react";

export function HelpDrawer() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button
				isIconOnly
				variant="light"
				radius="full"
				aria-label="Need help?"
				onPress={() => setIsOpen(true)}
			>
				<HelpCircle className="h-5 w-5" />
			</Button>

			<Drawer
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				placement="right"
			>
				<DrawerContent>
					<DrawerHeader>How to Schedule an Email</DrawerHeader>
					<DrawerBody className="space-y-4">
						<div>
							<h3 className="font-semibold mb-2">1. Recipients & Animation</h3>
							<p className="text-sm text-default-500">
								Select one or more recipients from your list and choose an
								animation or image to include in your email. You can either use
								one of your uploaded animations or provide a URL to an image.
							</p>
						</div>

						<div>
							<h3 className="font-semibold mb-2">2. Email Content</h3>
							<p className="text-sm text-default-500">
								Fill in the email subject, heading, and message. The heading
								will appear above your animation, and the message will appear
								below it. Choose when to send the email using the date picker.
							</p>
						</div>

						<div>
							<h3 className="font-semibold mb-2">3. Color Scheme</h3>
							<p className="text-sm text-default-500">
								Customize the colors of your email to match your style. You can
								preview how your email will look in the preview panel on the
								right.
							</p>
						</div>

						<div className="pt-4">
							<p className="text-sm text-default-500">
								💡 Tip: You can always go back to previous steps using the
								breadcrumb navigation at the top. Your progress will be saved.
							</p>
						</div>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</>
	);
}

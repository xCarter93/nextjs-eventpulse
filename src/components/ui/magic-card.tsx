"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function MagicCard({
	children,
	className,
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"w-full [background:linear-gradient(45deg,hsl(var(--muted)),hsl(var(--background))_50%,hsl(var(--muted)))_padding-box,conic-gradient(from_var(--border-angle),hsl(var(--muted-foreground)/.7)_40%,_hsl(var(--primary))_50%,_hsl(var(--primary))_60%,_hsl(var(--primary))_70%,_hsl(var(--muted-foreground)/.7))_border-box] rounded-xl border border-transparent animate-border",
				className
			)}
		>
			<div className="relative z-30">{children}</div>
		</div>
	);
}

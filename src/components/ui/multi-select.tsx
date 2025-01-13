"use client";

import * as React from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface Option {
	label: string;
	value: string;
}

interface MultiSelectProps {
	options: Option[];
	selected: string[];
	onChange: (values: string[]) => void;
	placeholder?: string;
	maxCount?: number;
}

export function MultiSelect({
	options,
	selected,
	onChange,
	maxCount = 3,
}: MultiSelectProps) {
	const [open, setOpen] = React.useState(false);

	const handleUnselect = (value: string) => {
		onChange(selected.filter((s) => s !== value));
	};

	const handleClear = () => {
		onChange([]);
	};

	const handleSelectAll = () => {
		onChange(options.map((option) => option.value));
	};

	const selectedDisplayed = selected.slice(0, maxCount);
	const extraSelected = selected.length - maxCount;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					className={cn(
						"w-full justify-between",
						selected.length > 0 ? "h-full" : "h-10"
					)}
				>
					<div className="flex gap-1 flex-wrap">
						{selectedDisplayed.map((value) => {
							const option = options.find((opt) => opt.value === value);
							return (
								<Badge
									key={value}
									variant="secondary"
									className="rounded-sm px-1 font-normal"
								>
									{option?.label}
									<span
										role="button"
										tabIndex={0}
										className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleUnselect(value);
											}
										}}
										onMouseDown={(e) => {
											e.preventDefault();
											e.stopPropagation();
										}}
										onClick={(e) => {
											e.stopPropagation();
											handleUnselect(value);
										}}
									>
										<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
									</span>
								</Badge>
							);
						})}
						{extraSelected > 0 && (
							<Badge
								variant="secondary"
								className="rounded-sm px-1 font-normal"
							>
								+{extraSelected} more
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-2 ml-2">
						{selected.length > 0 && (
							<>
								<X
									className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
									onClick={(e) => {
										e.stopPropagation();
										handleClear();
									}}
								/>
								<Separator orientation="vertical" className="h-4" />
							</>
						)}
						<ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command>
					<CommandInput placeholder="Search..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup>
							<CommandItem
								onSelect={handleSelectAll}
								className="cursor-pointer"
							>
								<div
									className={cn(
										"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
										selected.length === options.length
											? "bg-primary text-primary-foreground"
											: "opacity-50 [&_svg]:invisible"
									)}
								>
									<Check className="h-4 w-4" />
								</div>
								<span>(Select All)</span>
							</CommandItem>
							{options.map((option) => {
								const isSelected = selected.includes(option.value);
								return (
									<CommandItem
										key={option.value}
										onSelect={() => {
											if (isSelected) {
												handleUnselect(option.value);
											} else {
												onChange([...selected, option.value]);
											}
										}}
										className="cursor-pointer"
									>
										<div
											className={cn(
												"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
												isSelected
													? "bg-primary text-primary-foreground"
													: "opacity-50 [&_svg]:invisible"
											)}
										>
											<Check className="h-4 w-4" />
										</div>
										<span>{option.label}</span>
									</CommandItem>
								);
							})}
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup>
							<div className="flex items-center justify-between">
								{selected.length > 0 && (
									<>
										<CommandItem
											onSelect={handleClear}
											className="flex-1 justify-center cursor-pointer"
										>
											Clear
										</CommandItem>
										<Separator orientation="vertical" className="h-6" />
									</>
								)}
								<CommandItem
									onSelect={() => setOpen(false)}
									className="flex-1 justify-center cursor-pointer"
								>
									Close
								</CommandItem>
							</div>
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

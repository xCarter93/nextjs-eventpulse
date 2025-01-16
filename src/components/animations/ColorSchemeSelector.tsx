import { type ColorScheme } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface ColorSchemeSelectorProps {
	value: ColorScheme;
	onChange: (scheme: ColorScheme) => void;
}

const presetSchemes: ColorScheme[] = [
	{
		primary: "#3B82F6",
		secondary: "#60A5FA",
		accent: "#F59E0B",
		background: "#F3F4F6",
	},
	{
		primary: "#EC4899",
		secondary: "#F472B6",
		accent: "#8B5CF6",
		background: "#FDF2F8",
	},
	{
		primary: "#10B981",
		secondary: "#34D399",
		accent: "#F59E0B",
		background: "#ECFDF5",
	},
];

export function ColorSchemeSelector({
	value,
	onChange,
}: ColorSchemeSelectorProps) {
	const [activeColor, setActiveColor] = useState<keyof ColorScheme | null>(
		null
	);

	const handleColorChange = (color: string) => {
		if (activeColor) {
			onChange({ ...value, [activeColor]: color });
		}
	};

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-4 gap-4">
				{Object.entries(value).map(([key, color]) => (
					<div key={key} className="space-y-2">
						<Label className="capitalize">{key}</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="w-full h-10"
									onClick={() => setActiveColor(key as keyof ColorScheme)}
									style={{ backgroundColor: color }}
									type="button"
								>
									<span className="sr-only">Pick a {key} color</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-3" align="start">
								<div className="space-y-3">
									<HexColorPicker color={color} onChange={handleColorChange} />
									<div className="flex items-center space-x-2">
										<span className="text-sm text-muted-foreground">#</span>
										<HexColorInput
											color={color}
											onChange={handleColorChange}
											className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
										/>
									</div>
								</div>
							</PopoverContent>
						</Popover>
					</div>
				))}
			</div>

			<Separator />

			<div>
				<Label>Preset Schemes</Label>
				<div className="grid grid-cols-3 gap-2 mt-2">
					{presetSchemes.map((scheme, index) => (
						<Button
							key={index}
							variant="outline"
							className="p-2 h-auto hover:bg-accent"
							onClick={() => onChange(scheme)}
							type="button"
						>
							<div className="grid grid-cols-4 gap-1 w-full h-6">
								{Object.values(scheme).map((color, colorIndex) => (
									<div
										key={colorIndex}
										className="rounded-sm"
										style={{ backgroundColor: color }}
									/>
								))}
							</div>
						</Button>
					))}
				</div>
			</div>
		</div>
	);
}

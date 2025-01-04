import { type ColorScheme } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-4 gap-4">
				{Object.entries(value).map(([key, color]) => (
					<div key={key} className="space-y-2">
						<Label className="capitalize">{key}</Label>
						<Input
							type="color"
							value={color}
							onChange={(e) => onChange({ ...value, [key]: e.target.value })}
							className="h-10 cursor-pointer"
						/>
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

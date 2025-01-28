declare module "@mapbox/search-js-react" {
	import { ReactNode } from "react";

	interface AddressAutofillProps {
		accessToken: string;
		onRetrieve?: (response: {
			features: Array<{
				properties: {
					address_line1?: string;
					place?: string;
					region?: string;
					postcode?: string;
					country?: string;
					country_code?: string;
				};
				geometry: {
					coordinates: [number, number];
				};
			}>;
		}) => void;
		children: ReactNode;
	}

	export const AddressAutofill: React.FC<AddressAutofillProps>;
}

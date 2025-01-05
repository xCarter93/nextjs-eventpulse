"use client";

import React, { useLayoutEffect, useState } from "react";
import "./pink-flowers.css";

interface FlowerProps {
	isPreview?: boolean;
}

const PinkFlowers: React.FC<FlowerProps> = ({ isPreview = false }) => {
	// Use null as initial state to indicate not-yet-mounted state
	const [isMounted, setIsMounted] = useState<boolean | null>(null);

	// Use useLayoutEffect to set mounted state before paint
	useLayoutEffect(() => {
		setIsMounted(true);
	}, []);

	// Don't render anything until after first mount
	if (isMounted === null) {
		return null;
	}

	return (
		<div
			className={`flowers-container ${isPreview ? "preview" : ""} ${
				isMounted ? "loaded" : ""
			}`}
		>
			<div className="night"></div>
			<div className="flowers">
				<div className="flower flower--1">
					<div className="flower__leafs flower__leafs--1">
						<div className="flower__leaf flower__leaf--1"></div>
						<div className="flower__leaf flower__leaf--2"></div>
						<div className="flower__leaf flower__leaf--3"></div>
						<div className="flower__leaf flower__leaf--4"></div>
						<div className="flower__white-circle"></div>
						<div className="flower__light flower__light--1"></div>
						<div className="flower__light flower__light--2"></div>
						<div className="flower__light flower__light--3"></div>
						<div className="flower__light flower__light--4"></div>
						<div className="flower__light flower__light--5"></div>
						<div className="flower__light flower__light--6"></div>
						<div className="flower__light flower__light--7"></div>
						<div className="flower__light flower__light--8"></div>
					</div>
					<div className="flower__line">
						<div className="flower__line__leaf flower__line__leaf--1"></div>
						<div className="flower__line__leaf flower__line__leaf--2"></div>
						<div className="flower__line__leaf flower__line__leaf--3"></div>
						<div className="flower__line__leaf flower__line__leaf--4"></div>
						<div className="flower__line__leaf flower__line__leaf--5"></div>
						<div className="flower__line__leaf flower__line__leaf--6"></div>
					</div>
				</div>

				<div className="flower flower--2">
					<div className="flower__leafs flower__leafs--2">
						<div className="flower__leaf flower__leaf--1"></div>
						<div className="flower__leaf flower__leaf--2"></div>
						<div className="flower__leaf flower__leaf--3"></div>
						<div className="flower__leaf flower__leaf--4"></div>
						<div className="flower__white-circle"></div>
						<div className="flower__light flower__light--1"></div>
						<div className="flower__light flower__light--2"></div>
						<div className="flower__light flower__light--3"></div>
						<div className="flower__light flower__light--4"></div>
						<div className="flower__light flower__light--5"></div>
						<div className="flower__light flower__light--6"></div>
						<div className="flower__light flower__light--7"></div>
						<div className="flower__light flower__light--8"></div>
					</div>
					<div className="flower__line">
						<div className="flower__line__leaf flower__line__leaf--1"></div>
						<div className="flower__line__leaf flower__line__leaf--2"></div>
						<div className="flower__line__leaf flower__line__leaf--3"></div>
						<div className="flower__line__leaf flower__line__leaf--4"></div>
					</div>
				</div>

				<div className="flower flower--3">
					<div className="flower__leafs flower__leafs--3">
						<div className="flower__leaf flower__leaf--1"></div>
						<div className="flower__leaf flower__leaf--2"></div>
						<div className="flower__leaf flower__leaf--3"></div>
						<div className="flower__leaf flower__leaf--4"></div>
						<div className="flower__white-circle"></div>
						<div className="flower__light flower__light--1"></div>
						<div className="flower__light flower__light--2"></div>
						<div className="flower__light flower__light--3"></div>
						<div className="flower__light flower__light--4"></div>
						<div className="flower__light flower__light--5"></div>
						<div className="flower__light flower__light--6"></div>
						<div className="flower__light flower__light--7"></div>
						<div className="flower__light flower__light--8"></div>
					</div>
					<div className="flower__line">
						<div className="flower__line__leaf flower__line__leaf--1"></div>
						<div className="flower__line__leaf flower__line__leaf--2"></div>
						<div className="flower__line__leaf flower__line__leaf--3"></div>
						<div className="flower__line__leaf flower__line__leaf--4"></div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PinkFlowers;

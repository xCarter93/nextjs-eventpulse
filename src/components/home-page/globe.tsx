"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { RefObject } from "react";
import { Color, Scene, Fog, Vector3 } from "three";
import ThreeGlobe from "three-globe";
import { useThree, Canvas, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "./data/globe.json";

declare module "@react-three/fiber" {
	interface ThreeElements {
		threeGlobe: JSX.IntrinsicAttributes & {
			ref?: RefObject<ThreeGlobe | null>;
		};
	}
}

extend({ ThreeGlobe });

const RING_PROPAGATION_SPEED = 3;
const cameraZ = 200;

type Position = {
	order: number;
	startLat: number;
	startLng: number;
	endLat: number;
	endLng: number;
	arcAlt: number;
	color: string;
};

export type GlobeConfig = {
	pointSize?: number;
	globeColor?: string;
	showAtmosphere?: boolean;
	atmosphereColor?: string;
	atmosphereAltitude?: number;
	emissive?: string;
	emissiveIntensity?: number;
	shininess?: number;
	polygonColor?: string;
	ambientLight?: string;
	directionalLeftLight?: string;
	directionalTopLight?: string;
	pointLight?: string;
	arcTime?: number;
	arcLength?: number;
	rings?: number;
	maxRings?: number;
	initialPosition?: {
		lat: number;
		lng: number;
	};
	autoRotate?: boolean;
	autoRotateSpeed?: number;
};

interface WorldProps {
	globeConfig: GlobeConfig;
	data: Position[];
}

let numbersOfRings = [0];

export function Globe({ globeConfig, data }: WorldProps) {
	const [globeData, setGlobeData] = useState<
		| {
				size: number;
				order: number;
				color: (t: number) => string;
				lat: number;
				lng: number;
		  }[]
		| null
	>(null);

	const globeRef = useRef<ThreeGlobe | null>(null);

	const defaultProps = useMemo(
		() => ({
			pointSize: 1,
			atmosphereColor: "#ffffff",
			showAtmosphere: true,
			atmosphereAltitude: 0.1,
			polygonColor: "rgba(255,255,255,0.7)",
			globeColor: "#1d072e",
			emissive: "#000000",
			emissiveIntensity: 0.1,
			shininess: 0.9,
			arcTime: 2000,
			arcLength: 0.9,
			rings: 1,
			maxRings: 3,
			...globeConfig,
		}),
		[globeConfig]
	);

	const _buildMaterial = useCallback(() => {
		if (!globeRef.current) return;

		const globeMaterial = globeRef.current.globeMaterial() as unknown as {
			color: Color;
			emissive: Color;
			emissiveIntensity: number;
			shininess: number;
		};
		globeMaterial.color = new Color(globeConfig.globeColor);
		globeMaterial.emissive = new Color(globeConfig.emissive);
		globeMaterial.emissiveIntensity = globeConfig.emissiveIntensity || 0.1;
		globeMaterial.shininess = globeConfig.shininess || 0.9;
	}, [globeConfig]);

	const _buildData = useCallback(() => {
		const arcs = data;
		const points = [];
		for (let i = 0; i < arcs.length; i++) {
			const arc = arcs[i];
			const rgb = hexToRgb(arc.color) as { r: number; g: number; b: number };
			points.push({
				size: defaultProps.pointSize,
				order: arc.order,
				color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
				lat: arc.startLat,
				lng: arc.startLng,
			});
			points.push({
				size: defaultProps.pointSize,
				order: arc.order,
				color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
				lat: arc.endLat,
				lng: arc.endLng,
			});
		}

		const filteredPoints = points.filter(
			(v, i, a) =>
				a.findIndex((v2) =>
					["lat", "lng"].every(
						(k) => v2[k as "lat" | "lng"] === v[k as "lat" | "lng"]
					)
				) === i
		);

		setGlobeData(filteredPoints);
	}, [data, defaultProps.pointSize]);

	useEffect(() => {
		if (globeRef.current) {
			_buildData();
			_buildMaterial();
		}
	}, [globeRef, _buildData, _buildMaterial]);

	const startAnimation = useCallback(() => {
		if (!globeRef.current || !globeData) return;

		// Configure arcs first
		globeRef.current
			.arcsData(data)
			.arcStartLat((d) => (d as { startLat: number }).startLat * 1)
			.arcStartLng((d) => (d as { startLng: number }).startLng * 1)
			.arcEndLat((d) => (d as { endLat: number }).endLat * 1)
			.arcEndLng((d) => (d as { endLng: number }).endLng * 1)
			.arcColor((e: unknown) => (e as Position).color)
			.arcAltitude((e) => {
				return (e as { arcAlt: number }).arcAlt * 1;
			})
			.arcStroke(() => {
				return [0.32, 0.28, 0.3][Math.round(Math.random() * 2)];
			})
			.arcDashLength(defaultProps.arcLength)
			.arcDashInitialGap((e) => (e as { order: number }).order * 1)
			.arcDashGap(15)
			.arcDashAnimateTime(() => defaultProps.arcTime);

		// Configure points to be nearly invisible
		globeRef.current
			.pointsData([])
			.pointColor(() => "rgba(255,255,255,0.05)")
			.pointAltitude(0)
			.pointRadius(0.1)
			.pointsMerge(true);

		// Configure rings with animation
		globeRef.current
			.ringsData(globeData)
			.ringColor(
				(e: unknown) => (t: number) =>
					(e as { color: (t: number) => string }).color(t)
			)
			.ringMaxRadius(defaultProps.maxRings)
			.ringPropagationSpeed(RING_PROPAGATION_SPEED)
			.ringRepeatPeriod(
				(defaultProps.arcTime * defaultProps.arcLength) / defaultProps.rings
			);
	}, [data, globeData, defaultProps]);

	useEffect(() => {
		if (globeRef.current && globeData) {
			globeRef.current
				.hexPolygonsData(countries.features)
				.hexPolygonResolution(3)
				.hexPolygonMargin(0.7)
				.showAtmosphere(defaultProps.showAtmosphere)
				.atmosphereColor(defaultProps.atmosphereColor)
				.atmosphereAltitude(defaultProps.atmosphereAltitude)
				.hexPolygonColor(() => {
					return defaultProps.polygonColor;
				});
			startAnimation();
		}
	}, [globeData, defaultProps, startAnimation]);

	useEffect(() => {
		if (!globeRef.current || !globeData) return;

		const interval = setInterval(() => {
			if (!globeRef.current || !globeData) return;
			numbersOfRings = genRandomNumbers(
				0,
				data.length,
				Math.floor((data.length * 4) / 5)
			);

			globeRef.current.ringsData(
				globeData.filter((d, i) => numbersOfRings.includes(i))
			);
		}, 2000);

		return () => {
			clearInterval(interval);
		};
	}, [globeRef, globeData, data.length]);

	return (
		<>
			<threeGlobe ref={globeRef} />
		</>
	);
}

export function WebGLRendererConfig() {
	const { gl, size } = useThree();

	useEffect(() => {
		gl.setPixelRatio(window.devicePixelRatio);
		gl.setSize(size.width, size.height);
		gl.setClearColor(0xffaaff, 0);
	}, [gl, size.width, size.height]);

	return null;
}

function GlobeCamera() {
	const { size } = useThree();
	const aspect = useMemo(
		() => Math.min(size.width / size.height, 1.2),
		[size.width, size.height]
	);

	return (
		<perspectiveCamera
			args={[45, aspect, 180, 1800]}
			position={[0, 0, cameraZ]}
		/>
	);
}

export function World(props: WorldProps) {
	const { globeConfig } = props;
	const scene = new Scene();
	scene.fog = new Fog(0xffffff, 400, 2000);

	return (
		<Canvas
			scene={scene}
			style={{
				height: "100%",
				width: "100%",
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				contain: "layout size paint",
				willChange: "transform",
				transformStyle: "preserve-3d",
				isolation: "isolate",
			}}
			gl={{
				antialias: true,
				alpha: true,
				preserveDrawingBuffer: true,
			}}
			resize={{
				scroll: false,
			}}
		>
			<GlobeCamera />
			<WebGLRendererConfig />
			<ambientLight color={globeConfig.ambientLight} intensity={0.6} />
			<directionalLight
				color={globeConfig.directionalLeftLight}
				position={new Vector3(-400, 100, 400)}
			/>
			<directionalLight
				color={globeConfig.directionalTopLight}
				position={new Vector3(-200, 500, 200)}
			/>
			<pointLight
				color={globeConfig.pointLight}
				position={new Vector3(-200, 500, 200)}
				intensity={0.8}
			/>
			<Globe {...props} />
			<OrbitControls
				enablePan={false}
				enableZoom={false}
				minDistance={cameraZ}
				maxDistance={cameraZ}
				autoRotateSpeed={1}
				autoRotate={true}
				minPolarAngle={Math.PI / 3.5}
				maxPolarAngle={Math.PI - Math.PI / 3}
			/>
		</Canvas>
	);
}

export function hexToRgb(hex: string) {
	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	const newHex = hex.replace(shorthandRegex, function (m, r, g, b) {
		return r + r + g + g + b + b;
	});

	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(newHex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
			}
		: null;
}

export function genRandomNumbers(min: number, max: number, count: number) {
	const arr = [];
	while (arr.length < count) {
		const r = Math.floor(Math.random() * (max - min)) + min;
		if (arr.indexOf(r) === -1) arr.push(r);
	}

	return arr;
}

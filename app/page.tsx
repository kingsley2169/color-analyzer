"use client";

import { useRef, useState, useMemo, ChangeEvent, useEffect, useCallback } from "react";
import {
	ColorWithLab,
	getColorListWithLab,
	rgbToLab,
	deltaE76,
	deltaE94,
	deltaE2000,
} from "@a.r.i_eze/color-matcher";

type MatchCount = Record<string, number>;
type RGB = { r: number; g: number; b: number };

const deltaMethods = {
	CIE76: deltaE76,
	CIE94: deltaE94,
	CIE2000: deltaE2000,
} as const;

type DeltaMethodKey = keyof typeof deltaMethods;

const TOP_COLORS_DEFAULT = 5;
const KMEANS_CLUSTERS = 5;
const SAMPLE_SIZE = 80;

export default function ColorAnalyzer() {
	const imgRef = useRef<HTMLImageElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const overlayRef = useRef<HTMLCanvasElement | null>(null);

	const [result, setResult] = useState<MatchCount>({});
	const [dominantColors, setDominantColors] = useState<RGB[]>([]);
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [deltaMethod, setDeltaMethod] = useState<DeltaMethodKey>("CIE2000");
	const [showFullList, setShowFullList] = useState(false);
	const [hoveredColorName, setHoveredColorName] = useState<string | null>(null);

	const palette = useMemo<ColorWithLab[]>(() => getColorListWithLab(), []);
	const paletteMap = useMemo(() => {
		const map = new Map<string, string>();
		palette.forEach(c => map.set(c.name, c.hex));
		return map;
	}, [palette]);

	const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => { 
			if (typeof reader.result === "string") setImageSrc(reader.result); 
		};
		reader.readAsDataURL(file);
	};

	const kMeans = (pixels: RGB[], k: number, iterations = 6): RGB[] => {
		if (pixels.length === 0) return [];

		const actualK = Math.min(k, pixels.length);
		const centroids: RGB[] = pixels
			.slice(0, actualK)
			.map(p => ({ ...p }));

		for (let iter = 0; iter < iterations; iter++) {
			const clusters: RGB[][] = Array.from({ length: actualK }, () => []);

			for (const p of pixels) {
				let minDist = Infinity;
				let index = 0;

				for (let i = 0; i < centroids.length; i++) {
					const c = centroids[i];
					const dist = (p.r - c.r) ** 2 + (p.g - c.g) ** 2 + (p.b - c.b) ** 2;

					if (dist < minDist) {
						minDist = dist;
						index = i;
					}
				}

				clusters[index].push(p);
			}

			clusters.forEach((cluster, i) => {
				if (cluster.length === 0) return;

				const avg = cluster.reduce(
					(acc, p) => ({
					r: acc.r + p.r,
					g: acc.g + p.g,
					b: acc.b + p.b,
					}),
					{ r: 0, g: 0, b: 0 }
				);

				centroids[i] = {
					r: Math.round(avg.r / cluster.length),
					g: Math.round(avg.g / cluster.length),
					b: Math.round(avg.b / cluster.length),
				};
			});
		}
		return centroids;
	};


	const analyzeImage = useCallback(() => {
		const img = imgRef.current;
		const canvas = canvasRef.current;
		const overlay = overlayRef.current;
		if (!img || !canvas || !overlay) return;
		
		// Set internal canvas resolutions to match display size for sharpness
		const dpr = window.devicePixelRatio || 1;

		overlay.width = img.clientWidth * dpr;
		overlay.height = img.clientHeight * dpr;

		overlay.style.width = `${img.clientWidth}px`;
		overlay.style.height = `${img.clientHeight}px`;

		const octx = overlay.getContext("2d");
		if (octx) {
			octx.setTransform(1, 0, 0, 1, 0, 0);
			octx.scale(dpr, dpr);
		}

		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		canvas.width = SAMPLE_SIZE;
		canvas.height = SAMPLE_SIZE;
		ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
		const pixels = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
		const counts: MatchCount = {};
		const deltaFunc = deltaMethods[deltaMethod];
		const rgbSamples: RGB[] = [];
		for (let i = 0; i < pixels.length; i += 16) {
			const r = pixels[i]; const g = pixels[i + 1]; const b = pixels[i + 2];
			rgbSamples.push({ r, g, b });
			const sampleLab = rgbToLab({ r, g, b });
			let closest: ColorWithLab | null = null;
			let minDistance = Infinity;
			for (const color of palette) {
				const distance = deltaFunc(sampleLab, color.lab);
				if (distance < minDistance) { 
					minDistance = distance; closest = color; 
				}
			}
			if (closest) counts[closest.name] = (counts[closest.name] ?? 0) + 1;
		}
		setResult(counts);
		setDominantColors(kMeans(rgbSamples, KMEANS_CLUSTERS));
	}, [deltaMethod, palette]);

	useEffect(() => {
		if (imageSrc) analyzeImage();
	}, [deltaMethod, imageSrc, analyzeImage]);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout;

		const handleResize = () => {
			// Clear the previous timer if the user is still resizing
			clearTimeout(timeoutId);

			// Timer to run the heavy math after 250ms of no resize events, preventing excessive calculations during continuous resizing
			timeoutId = setTimeout(() => {
				if (imgRef.current) analyzeImage();
			}, 250);
		};

		window.addEventListener("resize", handleResize);
		
		return () => {
			window.removeEventListener("resize", handleResize);
			clearTimeout(timeoutId); 
		};
	}, [analyzeImage]);

	const resultPercent = useMemo(() => {
		const total = Object.values(result).reduce((sum, v) => sum + v, 0);
		if (total === 0) return {};
		return Object.fromEntries(Object.entries(result).map(([k, v]) => [k, ((v / total) * 100).toFixed(1),])) as Record<string, string>;
	}, [result]);

	const sortedColors = useMemo(() => {
		return Object.entries(resultPercent).sort((a, b) => parseFloat(b[1]) - parseFloat(a[1])).filter(([_, p]) => showFullList ? true : parseFloat(p) > 0).slice(0, showFullList ? undefined : TOP_COLORS_DEFAULT);
	}, [resultPercent, showFullList]);

	const exportJSON = () => {
		const userInput = window.prompt("Enter file name", "color-analysis");
		// If user clicks Cancel, userInput is null. We stop here.
		if (userInput === null) return;
		
		const fileName = userInput || "color-analysis";
		const blob = new Blob([JSON.stringify(resultPercent, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a"); a.href = url; a.download = `${fileName}.json`; a.click(); URL.revokeObjectURL(url);
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
		const img = imgRef.current; const canvas = canvasRef.current; const overlay = overlayRef.current;
		if (!img || !canvas || !overlay) return;
		const ctx = canvas.getContext("2d"); const octx = overlay.getContext("2d");
		if (!ctx || !octx) return;

		const rect = img.getBoundingClientRect();
		const xOnImage = e.clientX - rect.left;
		const yOnImage = e.clientY - rect.top;

		// Map mouse position to the 80x80 processing canvas
		const xSample = (xOnImage * canvas.width) / rect.width;
		const ySample = (yOnImage * canvas.height) / rect.height;

		const pixel = ctx.getImageData(Math.floor(xSample), Math.floor(ySample), 1, 1).data;
		const sampleLab = rgbToLab({ r: pixel[0], g: pixel[1], b: pixel[2] });
		
		let closest: ColorWithLab | null = null; let minDistance = Infinity;
		const deltaFunc = deltaMethods[deltaMethod];

		for (const color of palette) {
			const distance = deltaFunc(sampleLab, color.lab);
			if (distance < minDistance) { 
				minDistance = distance; closest = color; 
			}
		}
		
		setHoveredColorName(closest?.name ?? null);
		
		// Draw on overlay at 1:1 screen resolution for sharpness
		octx.clearRect(0, 0, overlay.width, overlay.height);
		if (closest) {
			octx.beginPath(); 
			octx.arc(xOnImage, yOnImage, 6, 0, Math.PI * 2);
			octx.strokeStyle = "white";
			octx.lineWidth = 2;
			octx.stroke();
			octx.beginPath();
			octx.arc(xOnImage, yOnImage, 7, 0, Math.PI * 2);
			octx.strokeStyle = "black";
			octx.lineWidth = 1;
			octx.stroke();
		}
	};

	const handleMouseLeave = () => {
		setHoveredColorName(null);
		const overlay = overlayRef.current;
		if (overlay) overlay.getContext("2d")?.clearRect(0, 0, overlay.width, overlay.height);
	};

	return (
		<div className="flex h-screen bg-neutral-950 text-neutral-200 overflow-hidden font-sans">
			<aside className="w-80 border-r border-neutral-800 bg-neutral-900 p-6 flex flex-col gap-8 overflow-y-auto">
				<header>
					<h1 className="text-xl font-bold text-white tracking-tight">DeltaE Vision</h1>
					<p className="text-xs text-neutral-500">Perceptual Color Analyzer</p>
				</header>

				<div>
					<label className="block text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">Upload Image</label>
					<input 
						type="file" 
						accept="image/*" 
						onChange={handleImage}
						className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
					/>
				</div>

				<div>
					<label className="block text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">Formula</label>
					<select 
						value={deltaMethod} 
						onChange={(e) => setDeltaMethod(e.target.value as DeltaMethodKey)}
						className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
					>
						{(Object.keys(deltaMethods) as DeltaMethodKey[]).map(m => <option key={m} value={m}>{m}</option>)}
					</select>
				</div>

				{Object.keys(result).length > 0 && (
					<div className="flex-1">
						<label className="block text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">Color Distribution</label>
						<div className="space-y-2">
							{sortedColors.map(([name, percent]) => {
								const hex = paletteMap.get(name) ?? "#000";
								const isHovered = hoveredColorName === name;
								return (
									<div key={name} className={`flex items-center gap-3 p-2 rounded-md transition-all ${isHovered ? 'bg-neutral-800 ring-1 ring-blue-500 shadow-lg' : 'bg-transparent opacity-80'}`}>
										<div className="w-10 h-10 rounded shadow-inner border border-white/10" style={{ backgroundColor: hex }} />
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium text-white truncate">{name}</div>
											<div className="text-xs text-neutral-500">{percent}%</div>
										</div>
									</div>
								);
							})}
						</div>
						<button 
							onClick={() => setShowFullList(!showFullList)}
							className="mt-4 text-xs text-blue-400 hover:text-blue-300 transition underline underline-offset-4"
						>
							{showFullList ? "Show Less" : "Show All Colors"}
						</button>
					</div>
				)}

				<button 
					onClick={exportJSON}
					disabled={Object.keys(result).length === 0}
					className="w-full py-2.5 bg-neutral-100 text-neutral-900 text-sm font-bold rounded hover:bg-white transition flex items-center justify-center gap-2"
				>
					Export Data (.JSON)
				</button>
			</aside>

			<main className="flex-1 relative flex items-center justify-center bg-neutral-950 p-12">
				{!imageSrc ? (
					<div className="text-center">
						<div className="w-16 h-16 border-2 border-dashed border-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-700">
							+
						</div>
						<p className="text-neutral-500 text-sm italic tracking-wide">Upload an image to start analysis</p>
					</div>
				) : (
					<div className="relative group max-h-full">
						<img
							ref={imgRef}
							src={imageSrc}
							alt="Uploaded Preview"
							onLoad={analyzeImage}
							onMouseMove={handleMouseMove}
							onMouseLeave={handleMouseLeave}
							className="max-w-full max-h-[80vh] rounded-lg shadow-2xl cursor-crosshair border border-neutral-800 select-none"
						/>
						<canvas ref={canvasRef} className="hidden" />
						
						<canvas
							ref={overlayRef}
							className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg"
						/>

						{hoveredColorName && (
							<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-2 ring-4 ring-black/10">
								{hoveredColorName}
							</div>
						)}
					</div>
				)}

				{dominantColors.length > 0 && (
					<div className="absolute bottom-8 right-8 flex gap-3 p-4 bg-neutral-900/90 backdrop-blur-md rounded-xl border border-neutral-800 shadow-2xl">
						{dominantColors.map((c, i) => (
							<div 
								key={i} 
								className="w-12 h-12 rounded-lg border border-white/20 hover:scale-110 transition-transform cursor-pointer shadow-lg"
								title={`rgb(${c.r}, ${c.g}, ${c.b})`}
								style={{ backgroundColor: `rgb(${c.r},${c.g},${c.b})` }} 
							/>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
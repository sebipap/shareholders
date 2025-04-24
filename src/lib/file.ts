import fs from "fs";
import type { z, ZodSchema } from "zod";

export function pathString(path: string[]) {
	return `./${path.join("/")}`;
}

export function directoryContent(path: string[]) {
	return fs.readdirSync(pathString(path));
}

export function readFile(path: string[], options?: { encoding?: BufferEncoding }) {
	return fs.readFileSync(pathString(path), { encoding: 'utf-8' });
}

export function fileToObject<T extends ZodSchema>(path: string[], schema: T): z.infer<T> {
	const data = JSON.parse(readFile(path))
	return schema.parse(data)
};
import * as fs from "fs";
import * as path from "path";
export function findProjectRoot(cwd) {
    const start = cwd ? path.resolve(cwd) : process.cwd();
    let current = start;
    while (current !== path.parse(current).root) {
        const markers = [
            ".git",
            "package.json",
            "pyproject.toml",
            "Cargo.toml",
            "go.mod",
            "composer.json",
            "pom.xml",
            "build.gradle",
            "CMakeLists.txt",
        ];
        for (const marker of markers) {
            if (fs.existsSync(path.join(current, marker))) {
                return current;
            }
        }
        current = path.dirname(current);
    }
    return null;
}
export function resolveProjectRoot(providedRoot, cwd) {
    if (providedRoot) {
        const resolved = path.resolve(cwd ?? process.cwd(), providedRoot);
        if (fs.existsSync(resolved)) {
            return resolved;
        }
        return null;
    }
    return findProjectRoot(cwd);
}

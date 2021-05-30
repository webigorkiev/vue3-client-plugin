import * as crypto from "crypto";
import type * as webpack from "webpack";

const isJS = (file: string): boolean => /\.js(\?[^.]+)?$/.test(file);
const isCSS = (file: string): boolean => /\.css(\?[^.]+)?$/.test(file);
const uniq = (arr: Array<any>) => Array.from(new Set(arr));
const hash = (value: string) => crypto.createHash('md5').update(value).digest('hex');

export default class Vue3SSRServerPlugin {
    options: Record<string, any>;

    constructor (options = {}) {
        this.options = Object.assign({
            filename: 'vue-ssr-client-manifest.json'
        }, options)
    }

    apply(compiler: webpack.Compiler) {
        compiler.hooks.compilation.tap('vue-server-plugin', (compilation: webpack.Compilation) => {
            compilation.hooks.afterProcessAssets.tap('HelloCompilationPlugin', (ass) => {
                const stats = compilation.getStats().toJson();

                stats.assets = stats.assets || [];
                const allFiles = uniq(stats.assets.map(a => a.name));

                stats.entrypoints = stats.entrypoints || {};
                const entryPointAssets: Array<any> = Object.keys(stats.entrypoints)
                    .map(name => stats.entrypoints?.[name].assets);
                const initialFiles = uniq(entryPointAssets
                    .reduce((assets, all) => all.concat(assets), [])
                    .filter((file: Record<string, any>) => isJS(file.name) || isCSS(file.name))
                    .map((file: Record<string, any>) => file.name)
                );
                const asyncFiles = allFiles
                    .filter((file) => isJS(file) || isCSS(file))
                    .filter(file => initialFiles.indexOf(file) < 0);
                const manifest = {
                    publicPath: stats.publicPath,
                    all: allFiles,
                    initial: initialFiles,
                    async: asyncFiles,
                    modules: { /* [identifier: string]: Array<index: number> */ }
                }
                stats.modules = stats.modules || [];
                const assetModules = stats.modules.filter((m: Record<string, any>) => m.assets.length)
                const fileToIndex = (file: string) => manifest.all.indexOf(file)
                stats.modules.forEach((m: Record<string, any>) => {

                    if (m.chunks.length === 1) {
                        const cid = m.chunks[0]
                        const chunk = stats?.chunks?.find(c => c.id === cid);

                        if (!chunk || !chunk.files) {
                            return
                        }
                        const id: string = m.identifier.replace(/\s\w+$/, '');

                        // @ts-ignore
                        const files = manifest.modules[hash(id)] = chunk.files.map(fileToIndex);

                        // find all asset modules associated with the same chunk
                        assetModules.forEach((m: Record<string, any>) => {
                            if (m.chunks.some((id: string) => id === cid)) {
                                files.push.apply(files, m.assets.map(fileToIndex))
                            }
                        })
                    }
                });

                const json = JSON.stringify(manifest, null, 4);
                const filename = this.options.filename;

                compilation.assets[filename] = {
                    source: () => json,
                    size: () => json.length,
                    map: () => ({}),
                    sourceAndMap: () => ({source: json, map: {}}),
                    updateHash: () => {},
                    buffer: () => Buffer.from(json)
                }
            });
        });
    }
};

module.exports = Vue3SSRServerPlugin;
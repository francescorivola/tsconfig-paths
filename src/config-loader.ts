import * as TsConfigLoader from "./tsconfig-loader";
import * as path from "path";
import { options } from "./options";

export interface ExplicitParams {
  baseUrl: string;
  paths: { [key: string]: Array<string> };
  mainFields?: Array<string>;
  addMatchAll?: boolean;
  matchAfterOriginal?: boolean;
}

export type TsConfigLoader = (
  params: TsConfigLoader.TsConfigLoaderParams
) => TsConfigLoader.TsConfigLoaderResult;

export interface ConfigLoaderParams {
  cwd: string;
  explicitParams?: ExplicitParams;
  tsConfigLoader?: TsConfigLoader;
}

export interface ConfigLoaderSuccessResult {
  resultType: "success";
  configFileAbsolutePath: string;
  baseUrl: string;
  absoluteBaseUrl: string;
  paths: { [key: string]: Array<string> };
  mainFields?: Array<string>;
  addMatchAll?: boolean;
  matchAfterOriginal?: boolean;
}

export interface ConfigLoaderFailResult {
  resultType: "failed";
  message: string;
}

export type ConfigLoaderResult =
  | ConfigLoaderSuccessResult
  | ConfigLoaderFailResult;

export function loadConfig(cwd: string = options.cwd): ConfigLoaderResult {
  return configLoader({ cwd: cwd });
}

export function configLoader({
  cwd,
  explicitParams,
  tsConfigLoader = TsConfigLoader.tsConfigLoader
}: ConfigLoaderParams): ConfigLoaderResult {
  if (explicitParams) {
    // tslint:disable-next-line:no-shadowed-variable
    const absoluteBaseUrl = path.isAbsolute(explicitParams.baseUrl)
      ? explicitParams.baseUrl
      : path.join(cwd, explicitParams.baseUrl);

    return {
      resultType: "success",
      configFileAbsolutePath: "",
      baseUrl: explicitParams.baseUrl,
      absoluteBaseUrl,
      paths: explicitParams.paths,
      mainFields: explicitParams.mainFields,
      addMatchAll: explicitParams.addMatchAll,
      matchAfterOriginal: explicitParams.matchAfterOriginal
    };
  }

  // Load tsconfig and create path matching function
  const loadResult = tsConfigLoader({
    cwd,
    getEnv: (key: string) => process.env[key]
  });

  if (!loadResult.tsConfigPath) {
    return {
      resultType: "failed",
      message: "Couldn't find tsconfig.json"
    };
  }

  if (!loadResult.baseUrl) {
    return {
      resultType: "failed",
      message: "Missing baseUrl in compilerOptions"
    };
  }

  const tsConfigDir = path.dirname(loadResult.tsConfigPath);
  const absoluteBaseUrl = path.join(tsConfigDir, loadResult.baseUrl);

  return {
    resultType: "success",
    configFileAbsolutePath: loadResult.tsConfigPath,
    baseUrl: loadResult.baseUrl,
    absoluteBaseUrl,
    paths: loadResult.paths || {}
  };
}

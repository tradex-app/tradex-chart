import { ChartType, IConfig, IIndicators, Indicator } from '../../../../types';
import { ChartResolutionEnum } from './enums';

export interface IChartOption {
  id: number;
  label: string;
  value: ChartType;
  info?: string;
  icon?: any;
}

export interface ITradeX extends HTMLElement {
  Indicators?: { [key: string]: unknown }[];
  theme?: { setProperty: (property: string, value: any) => void };
  start?: (config: object) => void;
  setIndicators?: (indicators: Indicator[]) => void;
  mergeData?: (data: { ohlcv: number[] }) => void;
  on?: (eventName: string, callback: (e: unknown) => void) => void;
}

export interface IIndicatorOption {
  id: number;
  name: string;
  value: string;
  isCustom?: boolean;
  data?: number[];
}

export interface IInterval {
  id: ChartResolutionEnum;
  value: ChartResolutionEnum;
}

export interface ITechnicalIndicator {
  indicator: string;
  values: { [resolution: string]: number };
}

export interface ILevelIndicator extends ITechnicalIndicator {
  sup_or_res: 'S' | 'R';
}

export interface ITokenChartProps extends IConfig {
  toolbar?: ToolbarConfig;
  defaults?: {
    timeframe?: string;
    chartType?: IChartOption;
    showTradeData?: boolean;
  };
}

export interface IIndicatorToolbar {
  label: string;
  value: string;
  tooltip: string;
}

export interface ToolbarConfig {
  intervals: string[];
  timeframe: boolean;
  indicators: boolean;
  typeSelector: boolean;
  fullscreenButton: boolean;
  themeSwitcher: boolean;
}

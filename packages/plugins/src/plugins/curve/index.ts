import { Platform } from '@sonarwatch/portfolio-core';
import { Fetcher } from '../../Fetcher';
import { Job } from '../../Job';
import { fooPlatform } from './constants';
import marketsJob from './marketsJob';
import positionFetcher from './positionFetcher';

export const platforms: Platform[] = [fooPlatform];
export const jobs: Job[] = [marketsJob];
export const fetchers: Fetcher[] = [positionFetcher];
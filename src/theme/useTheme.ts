import {ThemeMode} from '../types/models';
import {darkPalette, lightPalette} from './palette';

export const getPalette = (mode: ThemeMode) => {
  return mode === 'dark' ? darkPalette : lightPalette;
};

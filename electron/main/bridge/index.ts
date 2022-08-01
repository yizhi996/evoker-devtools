import { getLocalImage } from './media'
import { navigateTo, navigateBack } from './route'

export const apis: { [x: string]: Function } = {
  getLocalImage,
  navigateTo,
  navigateBack
}

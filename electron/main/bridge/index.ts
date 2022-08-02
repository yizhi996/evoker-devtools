import { Bridge, InvokeArgs } from '../center'
import { getLocalImage } from './media'
import { navigateTo, navigateBack } from './route'

type ApiInvokeFunction = (appId: string, bridge: Bridge, args: InvokeArgs) => void
export const apis: { [x: string]: ApiInvokeFunction } = {
  getLocalImage,
  navigateTo,
  navigateBack
}

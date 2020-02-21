import { ApiPromise, WsProvider } from '@polkadot/api';
import { registerSubsocialTypes } from '../types';
import { api as polkadotApi } from '@polkadot/ui-api';

let api: (ApiPromise | undefined);

export { api };
export class SubstrateApi {
  protected api!: ApiPromise;

  public setup = async () => {
    await this.connectToApi();
    api = this.api;
    return this.api;
  }

  public destroy = () => {
    const { api } = this;
    if (api && api.isReady) {
      api.disconnect();
      console.log(`Disconnected from Substrate API.`);
    }
  }

  private connectToApi = async () => {
    const rpcEndpoint = process.env.SUBSTRATE_URL || `ws://127.0.0.1:9944/`;
    const provider = new WsProvider(rpcEndpoint);

    // Register types before creating the API:
    registerSubsocialTypes();

    // Create the API and wait until ready:
    console.log(`Connecting to Substrate API at ${rpcEndpoint}`);
    this.api = await ApiPromise.create(provider);

    // Retrieve the chain & node information information via rpc calls
    const system = this.api.rpc.system;

    const [ chain, nodeName, nodeVersion ] = await Promise.all(
      [ system.chain(), system.name(), system.version() ]);

    console.log(`Connected to chain '${chain}' (${nodeName} v${nodeVersion})`);
  }
}

export const Api = new SubstrateApi();
export default Api;

export const getApi = async () => {
  if (polkadotApi) {
    console.warn(' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> api = polkadotApi');
    return polkadotApi.isReady;
  } else if (api) {
    console.warn('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> api = api');
    return api;
  } else {
    console.warn('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> api = Api.setup');
    api = await Api.setup();
    setTimeout(() => {
      console.warn('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Disconection our Api')
      return Api.destroy
    }, 10000);
    return api;
  }
}

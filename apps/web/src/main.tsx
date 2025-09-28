import * as Comlink from 'comlink';
import { createRoot } from 'react-dom/client';

import { eventBus } from '@colanode/client/lib';
import { BrowserNotSupported } from '@colanode/web/components/browser-not-supported';
import { MobileNotSupported } from '@colanode/web/components/mobile-not-supported';
import { ColanodeWorkerApi, ColanodeWindowApi } from '@colanode/web/lib/types';
import { isMobileDevice, isOpfsSupported } from '@colanode/web/lib/utils';
import { Root } from '@colanode/web/root';
import DedicatedWorker from '@colanode/web/workers/dedicated?worker';

const initializeApp = async () => {
  const isMobile = isMobileDevice();
  if (isMobile) {
    const root = createRoot(document.getElementById('root') as HTMLElement);
    root.render(<MobileNotSupported />);
    return;
  }

  const hasOpfsSupport = await isOpfsSupported();
  if (!hasOpfsSupport) {
    const root = createRoot(document.getElementById('root') as HTMLElement);
    root.render(<BrowserNotSupported />);
    return;
  }

  const worker = new DedicatedWorker();
  const workerApi = Comlink.wrap<ColanodeWorkerApi>(worker);

  type MutationInput = Parameters<ColanodeWorkerApi['executeMutation']>[0];
  type QueryInput = Parameters<ColanodeWorkerApi['executeQuery']>[0];
  type QueryKey = Parameters<ColanodeWorkerApi['executeQueryAndSubscribe']>[0];
  type QueryAndSubscribeInput = Parameters<ColanodeWorkerApi['executeQueryAndSubscribe']>[1];
  type TempFileInput = Parameters<ColanodeWorkerApi['saveTempFile']>[0];
  type UnsubscribeKey = Parameters<ColanodeWorkerApi['unsubscribeQuery']>[0];
  type SubscribeCallback = Parameters<ColanodeWorkerApi['subscribe']>[0];

  const colanodeApi: ColanodeWindowApi = {
    init: async () => {
      await workerApi.init();
    },
    executeMutation: async (input: MutationInput) => {
      return workerApi.executeMutation(input);
    },
    executeQuery: async (input: QueryInput) => {
      return workerApi.executeQuery(input);
    },
    executeQueryAndSubscribe: async (
      key: QueryKey,
      input: QueryAndSubscribeInput
    ) => {
      return workerApi.executeQueryAndSubscribe(key, input);
    },
    saveTempFile: async (file: TempFileInput) => {
      return workerApi.saveTempFile(file);
    },
    unsubscribeQuery: async (queryId: UnsubscribeKey) => {
      return workerApi.unsubscribeQuery(queryId);
    },
    openExternalUrl: async (url: string) => {
      window.open(url, '_blank');
    },
    showItemInFolder: async (_path: string) => {
      // No-op on web
    },
    showFileSaveDialog: async (_options: Parameters<ColanodeWindowApi['showFileSaveDialog']>[0]) =>
      undefined,
  };

  window.colanode = colanodeApi;

  window.eventBus = eventBus;

  workerApi.subscribe(
    Comlink.proxy((event: Parameters<SubscribeCallback>[0]) => {
      eventBus.publish(event);
    })
  );

  const root = createRoot(document.getElementById('root') as HTMLElement);
  root.render(<Root />);
};

initializeApp().catch(() => {
  const root = createRoot(document.getElementById('root') as HTMLElement);
  root.render(<BrowserNotSupported />);
});

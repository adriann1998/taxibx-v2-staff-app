import { AuthenticationContext, adalFetch, withAdalLogin, AdalConfig } from 'react-adal';

export const adalConfig: AdalConfig = {
  tenant: 'f8cce299-6d24-442e-96c9-0ce020238a51',
  clientId: 'dc5d1f20-7d4f-4e76-8df6-b67553e2194d',
  endpoints: {
    api: 'dc5d1f20-7d4f-4e76-8df6-b67553e2194d',
  },
  cacheLocation: 'localStorage',
};

export const authContext = new AuthenticationContext(adalConfig);

export const adalApiFetch = (
  fetch: (input: string, init: any) => Promise<any>,
  url: string,
  options: any
): Promise<any> => adalFetch(authContext, adalConfig.endpoints?.api as string, fetch, url, options);

export const withAdalLoginApi = withAdalLogin(authContext, adalConfig.endpoints?.api as string);
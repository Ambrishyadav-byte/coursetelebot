declare module '@woocommerce/woocommerce-rest-api' {
  interface WooCommerceRestApiOptions {
    url: string;
    consumerKey: string;
    consumerSecret: string;
    version?: string;
    wpAPIPrefix?: string;
    queryStringAuth?: boolean;
    timeout?: number;
    axiosConfig?: Record<string, any>;
  }

  interface WooCommerceRestApiResponse<T = any> {
    data: T;
    status: number;
    headers: Record<string, any>;
  }

  class WooCommerceRestApi {
    constructor(options: WooCommerceRestApiOptions);
    get<T = any>(endpoint: string, params?: Record<string, any>): Promise<WooCommerceRestApiResponse<T>>;
    post<T = any>(endpoint: string, data: any, params?: Record<string, any>): Promise<WooCommerceRestApiResponse<T>>;
    put<T = any>(endpoint: string, data: any, params?: Record<string, any>): Promise<WooCommerceRestApiResponse<T>>;
    delete<T = any>(endpoint: string, params?: Record<string, any>): Promise<WooCommerceRestApiResponse<T>>;
    options<T = any>(endpoint: string, params?: Record<string, any>): Promise<WooCommerceRestApiResponse<T>>;
  }

  export default WooCommerceRestApi;
}
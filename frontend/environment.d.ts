declare namespace NodeJS {
  export interface ProcessEnv {
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    AWS_OPEN_SEARCH_ENDPOINT: string;
  }
}

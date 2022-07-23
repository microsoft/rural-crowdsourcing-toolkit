export type TransactionRequest = {
  workerId: string;
  amount: number;
};

export interface ErrorMeta {
  source: String;
  name: String;
  message: String;
}

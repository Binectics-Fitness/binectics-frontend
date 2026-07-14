declare module "@paystack/inline-js" {
  interface ResumeCallbacks {
    onSuccess?: (transaction: { reference?: string }) => void;
    onCancel?: () => void;
    onError?: (error: unknown) => void;
    onLoad?: (response: unknown) => void;
  }
  export default class PaystackPop {
    resumeTransaction(accessCode: string, callbacks?: ResumeCallbacks): void;
  }
}

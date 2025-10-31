import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaymentSectionProps {
  paymentMethod: string;
  installments: number;
  onPaymentMethodChange: (method: string) => void;
  onInstallmentsChange: (installments: number) => void;
}

export const PaymentSection = ({
  paymentMethod,
  installments,
  onPaymentMethodChange,
  onInstallmentsChange,
}: PaymentSectionProps) => {
  return (
    <div className="space-y-2 mb-4">
      <div className="text-sm font-medium text-gray-800">Forma de pagamento</div>
      <Select
        value={paymentMethod}
        onValueChange={(v) => {
          onPaymentMethodChange(v);
          if (v !== "parcelado") {
            onInstallmentsChange(1);
          }
        }}
      >
        <SelectTrigger className="h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="avista">À vista</SelectItem>
          <SelectItem value="pix">Pix</SelectItem>
          <SelectItem value="debito">Cartão débito</SelectItem>
          <SelectItem value="credito">Cartão crédito</SelectItem>
          <SelectItem value="dinheiro">Dinheiro</SelectItem>
          <SelectItem value="parcelado">Parcelado</SelectItem>
        </SelectContent>
      </Select>
      {paymentMethod === "parcelado" && (
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700">Quantidade de parcelas</div>
          <Select value={String(installments)} onValueChange={(v) => onInstallmentsChange(Number(v))}>
            <SelectTrigger className="h-9 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}x
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};


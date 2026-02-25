import { CreditCard, Smartphone, CheckCircle2, Copy, ExternalLink, Loader2, Wallet, Upload, Image as ImageIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import telebirrQr from "@assets/image_1772002240311.png";

interface PaymentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: "SEASON" | "EPISODE";
  itemId: number;
  amount: string;
  onConfirm: (transactionRef: string, paymentProofUrl?: string) => void;
  isPending: boolean;
}

export function PaymentPanel({ 
  isOpen, 
  onClose, 
  itemType, 
  itemId, 
  amount, 
  onConfirm,
  isPending 
}: PaymentPanelProps) {
  const [step, setStep] = useState<"select" | "pay" | "confirm">("select");
  const [provider, setProvider] = useState<"TELEBIRR" | "CBE_BIRR" | "HELLOCASH" | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Reset state when dialog closes/opens
  useEffect(() => {
    if (!isOpen) {
      setStep("select");
      setProvider(null);
      setTransactionRef("");
      setPreviewUrl(null);
    }
  }, [isOpen]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Payment details copied to clipboard",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const providers = [
    { 
      id: "TELEBIRR" as const, 
      name: "Telebirr", 
      icon: Wallet, 
      color: "text-[#005CAB]",
      number: "0911223344",
      merchantId: "M12345",
      qrImage: telebirrQr
    },
    { 
      id: "CBE_BIRR" as const, 
      name: "CBE Birr", 
      icon: Smartphone, 
      color: "text-[#6B2D91]",
      number: "0922334455",
      merchantId: "CBE-9876"
    },
    { 
      id: "HELLOCASH" as const, 
      name: "HelloCash", 
      icon: CreditCard, 
      color: "text-[#E31E24]",
      number: "0933445566",
      merchantId: "HC-5432"
    }
  ];

  const selectedProviderData = providers.find(p => p.id === provider);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {step === "select" && "Choose Payment Method"}
            {step === "pay" && `Pay with ${selectedProviderData?.name}`}
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Select your preferred payment provider to continue."}
            {step === "pay" && `Send the exact amount to the merchant details below. Then enter your transaction reference and upload a screenshot to complete the purchase.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === "select" && (
            <div className="grid gap-3">
              {providers.map((p) => (
                <Button
                  key={p.id}
                  variant="outline"
                  className="h-16 justify-start gap-4 px-4 hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => {
                    setProvider(p.id);
                    setStep("pay");
                  }}
                >
                  <p.icon className={`h-8 w-8 ${p.color}`} />
                  <div className="text-left">
                    <p className="font-semibold text-lg">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Instant verification</p>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {step === "pay" && selectedProviderData && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-xl p-6 text-center space-y-2 border border-dashed">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Amount</p>
                <p className="text-4xl font-bold text-primary">{amount} <span className="text-lg font-normal">ETB</span></p>
              </div>

              {selectedProviderData.qrImage && (
                <div className="flex justify-center">
                  <div className="relative group">
                    <img 
                      src={selectedProviderData.qrImage} 
                      alt="Payment QR" 
                      className="w-48 h-48 rounded-lg shadow-sm border border-border"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <Button size="sm" variant="secondary" onClick={() => window.open(selectedProviderData.qrImage, '_blank')}>
                        <ExternalLink className="h-3 w-3 mr-2" />
                        View Full
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Merchant Number</p>
                    <p className="font-mono font-bold">{selectedProviderData.number}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleCopy(selectedProviderData.number)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Merchant ID</p>
                    <p className="font-mono font-bold">{selectedProviderData.merchantId}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleCopy(selectedProviderData.merchantId)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transaction Reference / ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 1234567890"
                    className="w-full p-3 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Screenshot</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  
                  {!previewUrl ? (
                    <Button 
                      variant="outline" 
                      className="w-full h-32 border-dashed flex flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload screenshot</span>
                    </Button>
                  ) : (
                    <div className="relative group aspect-video bg-muted rounded-lg overflow-hidden border">
                      <img src={previewUrl} alt="Screenshot preview" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                          Change
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setPreviewUrl(null)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-sm leading-relaxed">
                  After payment, enter your 10-digit transaction ID and upload the screenshot above to complete the purchase.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
          {step === "pay" && (
            <>
              <Button variant="ghost" className="flex-1" onClick={() => setStep("select")}>Back</Button>
              <Button 
                className="flex-1" 
                disabled={!transactionRef || !previewUrl || isPending}
                onClick={() => onConfirm(transactionRef, previewUrl || undefined)}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Proof"}
              </Button>
            </>
          )}
          {step === "select" && (
            <Button variant="outline" className="w-full" onClick={onClose}>Cancel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

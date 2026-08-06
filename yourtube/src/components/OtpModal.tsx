import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useUser } from "@/lib/AuthContext";
import { toast } from "sonner";

export default function OtpModal() {
  const { otpData, verifyOtp } = useUser();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    
    setLoading(true);
    const success = await verifyOtp(otp);
    setLoading(false);
    
    if (success) {
      toast.success("Login successful!");
      setOtp("");
    } else {
      toast.error("Invalid or expired OTP. Please try again.");
    }
  };

  return (
    <Dialog open={otpData?.showModal} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Security Verification</DialogTitle>
          <DialogDescription>
            We've detected a login from a new device or location{otpData?.locationString ? `: ${otpData.locationString}` : ""}. 
            A 6-digit verification code has been sent to <b>{otpData?.email}</b>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit OTP"
            className="text-center text-2xl tracking-[0.5em] h-14"
            required
            autoFocus
          />
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={loading || otp.length !== 6} 
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Verifying..." : "Verify & Login"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

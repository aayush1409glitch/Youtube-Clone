import React, { useState } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, Shield, Zap, Medal } from "lucide-react";
import { useRouter } from "next/router";
import Script from "next/script";
import { toast } from "sonner";

const plans = [
  {
    name: "bronze",
    price: 99,
    features: [
      "5 Video Downloads / day",
      "Standard Quality",
      "Community Access",
    ],
    color: "text-amber-600",
    bg: "bg-amber-600",
    hover: "hover:bg-amber-700",
    icon: Medal,
  },
  {
    name: "silver",
    price: 299,
    features: [
      "20 Video Downloads / day",
      "High Quality 1080p",
      "Ad-Free Experience",
    ],
    color: "text-slate-400",
    bg: "bg-slate-500",
    hover: "hover:bg-slate-600",
    icon: Shield,
    popular: true,
  },
  {
    name: "gold",
    price: 599,
    features: [
      "Unlimited Downloads",
      "4K Ultra HD Quality",
      "Exclusive Watch Party",
    ],
    color: "text-yellow-500",
    bg: "bg-yellow-500",
    hover: "hover:bg-yellow-600",
    icon: Crown,
  },
];

const PremiumPage = () => {
  const { user, login, activeChannel } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  const handleUpgrade = async (plan: any) => {
    if (!user) {
      toast.error("Please log in to upgrade to Premium.");
      return;
    }

    if (!activeChannel) {
      toast.error("Please create or select a channel first to upgrade it!");
      return;
    }

    setLoadingPlan(plan.name);
    try {
      // 1. Create order on backend
      const orderRes = await axiosInstance.post("/payment/create-order", {
        amount: plan.price,
        plan: plan.name,
      });

      const order = orderRes.data.order;

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key_id",
        amount: order.amount,
        currency: order.currency,
        name: "YourTube",
        description: `${plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} Plan Upgrade for ${activeChannel.channelname}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on backend
            const verifyRes = await axiosInstance.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user._id,
              channelId: activeChannel._id,
              plan: plan.name,
              amount: plan.price,
            });

            if (verifyRes.data.success) {
              login(user); // Reload user and channels
              toast.success(`Welcome to ${plan.name.toUpperCase()} for channel ${activeChannel.channelname}! Check your email for the invoice.`);
              router.push("/");
            }
          } catch (error) {
            console.error("Verification error:", error);
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: user.name || "User",
          email: user.email || "test@example.com",
        },
        theme: {
          color: "#eab308",
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        toast.error("Payment failed. Please try again.");
      });
      rzp1.open();

    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Could not initiate checkout.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <main className="flex-1 p-6 bg-gray-50 dark:bg-background min-h-[calc(100vh-64px)] pb-20">
        <div className="max-w-6xl mx-auto text-center space-y-4 mb-16 pt-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Choose Your <span className="text-yellow-600">Premium</span> Tier
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Upgrade your experience. Enjoy ad-free viewing, higher download limits, and support your favorite creators.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`bg-card text-card-foreground rounded-2xl p-8 shadow-lg border relative flex flex-col ${plan.popular ? 'border-yellow-400 scale-105' : 'border-border'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6 border-b dark:border-zinc-800 pb-6">
                <plan.icon className={`w-12 h-12 mx-auto mb-4 ${plan.color}`} />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize mb-2">{plan.name}</h3>
                <div className="flex justify-center items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">₹{plan.price}</span>
                  <span className="text-lg text-gray-500 dark:text-gray-400 font-medium">/mo</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className={`w-5 h-5 shrink-0 ${plan.color}`} />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              {activeChannel?.plan === plan.name ? (
                <Button className="w-full text-lg py-6 bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-gray-400 cursor-not-allowed" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button 
                  className={`w-full text-lg py-6 text-white shadow-md transition-transform hover:scale-105 ${plan.bg} ${plan.hover}`}
                  onClick={() => handleUpgrade(plan)}
                  disabled={loadingPlan === plan.name}
                >
                  {loadingPlan === plan.name ? "Processing..." : `Get ${plan.name}`}
                </Button>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
};

export default PremiumPage;

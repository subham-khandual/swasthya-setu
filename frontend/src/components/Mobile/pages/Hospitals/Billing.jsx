import API_BASE_URL from '../../../../apiConfig';
import React, { useEffect, useState } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DollarSign, Loader2, Download } from "lucide-react";
import styles from "./Hospital.module.css";
import { QRCodeCanvas } from 'qrcode.react';
import logo from "../../../assets/SwasthyaSetuLogo.png";
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51T5PkUFMm1x5WhjXk2Yzr2ptCbg6m1kZ9FVnVNHztsYlgjNwaON1fM4cSHMhu3MTe124JBugZ4s0LHQ4rfV85e7G00nefAf8Vo'); // Using valid test public key

const PATIENT_ID = "67ccc44c671f5aa635f458e1"; // same as EHRHealthData

const CheckoutForm = ({ bill, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    // Simulate payment processing since we don't have a backend to generate a real clientSecret for hospital bills here
    setTimeout(() => {
        setProcessing(false);
        onSuccess(bill.id);
    }, 2000); // Wait 2 seconds
    
    // In a real scenario with backend:
    // const result = await stripe.confirmCardPayment('{CLIENT_SECRET}', {
    //   payment_method: {
    //     card: elements.getElement(CardElement),
    //   }
    // });
    // if (result.error) { setError(result.error.message); setProcessing(false); } else { onSuccess(bill.id); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '15px', background: '#f8f9fa', padding: '15px', borderRadius: '10px' }}>
        <h4 style={{ fontSize: '1rem', marginBottom: '10px', color: '#2c3e50' }}>Enter Card Details</h4>
      <div style={{ padding: '10px', border: '1px solid #ced4da', borderRadius: '5px', background: 'white', marginBottom: '10px' }}>
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' },
            },
            invalid: { color: '#9e2146' },
          },
        }}/>
      </div>
      {error && <div style={{ color: '#e74c3c', fontSize: '0.85rem', marginBottom: '10px' }}>{error}</div>}
      <button 
        disabled={processing || !stripe} 
        type="submit"
        className="btn"
        style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "8px", width: "100%", marginBottom: '10px' }}
      >
        {processing ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Loader2 className="spinner" size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...
          </span>
        ) : (
          `Pay ₹${bill.amount}`
        )}
      </button>
      <button 
        type="button" 
        onClick={onCancel}
        disabled={processing}
        className="btn"
        style={{ background: "#e74c3c", color: "#fff", borderRadius: "10px", padding: "8px", width: "100%" }}
      >
          Cancel
      </button>
      <style>
          {`
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
          `}
      </style>
    </form>
  );
};

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState({});
  const [payingBillId, setPayingBillId] = useState(null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/billing/patient/${PATIENT_ID}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to load bills");
        }
        const data = await res.json();
        setBills(data);
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Failed to load bills");
      }
    };
    fetchBills();
  }, []);

  const paymentOptions = [
    { value: "card", label: "Credit/Debit Card" },
    { value: "upi", label: "UPI" },
    { value: "netbanking", label: "Net Banking" },
    { value: "insurance", label: "Insurance" },
  ];

  const selectStyles = {
    container: base => ({ ...base, width: "100%", zIndex: 1050 }),
    control: base => ({ ...base, borderRadius: "10px", border: "1px solid #ced4da" }),
    menu: base => ({ ...base, zIndex: 1050, borderRadius: "10px" }),
  };
  
  const handlePaymentMethodChange = (billId, selectedOption) => {
      setSelectedPaymentMethods(prev => ({
          ...prev,
          [billId]: selectedOption
      }));
  };

  const handlePayInitiate = (billId) => {
    const method = selectedPaymentMethods[billId];
    if (!method) {
      toast.error("Please select a payment method!");
      return;
    }
    
    if (method.value === "card") {
        setPayingBillId(billId); // Open Stripe Checkout
    } else {
        // Other dummy payments
        toast.success(`Payment of ₹${bills.find(b => b.id === billId).amount} completed via ${method.label}!`);
        markBillAsPaid(billId);
    }
  };
  
  const markBillAsPaid = (billId) => {
      setBills(prevBills =>
          prevBills.map(bill =>
              bill._id === billId ? { ...bill, status: "Paid" } : bill
          )
      );
      setPayingBillId(null);
  };

  const handleStripeSuccess = (billId) => {
      const bill = bills.find(b => b._id === billId);
      toast.success(`Payment of ₹${bill?.amount} completed successfully via Stripe!`);
      // Update backend status
      fetch(`${API_BASE_URL}/api/billing/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Paid", paymentMethod: "card" }),
      }).catch(console.error);
      markBillAsPaid(billId);
  };

  const handleStripeCancel = () => {
      setPayingBillId(null);
  };

  const downloadInvoice = (bill) => {
    // Generate QR code data URL from hidden canvas
    const qrCanvas = document.getElementById(`qr-gen-${bill._id}`);
    const qrDataUrl = qrCanvas ? qrCanvas.toDataURL("image/png") : null;

    Promise.all([
      import("jspdf"),
      import("jspdf-autotable")
    ]).then(([jsPDFModule, autoTableModule]) => {
      try {
        const { jsPDF } = jsPDFModule;
        const doc = new jsPDF();
        
        // Header with Logo
        const img = new Image();
        img.src = logo;
        doc.addImage(img, 'PNG', 10, 10, 30, 30);
        
        doc.setFontSize(22);
        doc.setTextColor(27, 85, 139);
        doc.text("MEDICAL INVOICE", 105, 25, { align: "center" });
        
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text(bill.hospital || "Hospital", 105, 35, { align: "center" });
        
        doc.setFontSize(10);
        doc.setTextColor(127, 140, 141);
        doc.text(`Invoice ID: ${bill._id}`, 14, 55);
        doc.text(`Date: ${bill.date?.slice(0, 10)}`, 14, 62);
        doc.text(`Status: ${bill.status}`, 14, 69);

        // Add QR Code if available
        if (qrDataUrl) {
            doc.addImage(qrDataUrl, 'PNG', 160, 45, 35, 35);
            doc.setFontSize(8);
            doc.text("Scan to Verify", 177, 83, { align: "center" });
        }
  
        // Bill Details Table
        const autoTable = autoTableModule.default || autoTableModule;
        autoTable(doc, {
          startY: 90,
          head: [['Description', 'Amount']],
          body: [
            [bill.service || 'Medical Service', `Rs. ${bill.amount}`],
          ],
          foot: [['Total Paid', `Rs. ${bill.amount}`]],
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          footStyles: { fillColor: [46, 204, 113] }
        });
  
        // Footer
        doc.setFontSize(10);
        doc.setTextColor(149, 165, 166);
        const finalY = (doc.previousAutoTable && doc.previousAutoTable.finalY) || (doc.lastAutoTable && doc.lastAutoTable.finalY) || 120;
        doc.text("Thank you for your payment. Wishing you a speedy recovery!", 105, finalY + 20, { align: "center" });
  
        // Download PDF
        doc.save(`Invoice_${bill._id}.pdf`);
        toast.success("Invoice downloaded!");
      } catch (internalErr) {
        console.error("PDF generation error:", internalErr);
        toast.error(`PDF generation failed: ${internalErr.message}`);
      }
    }).catch(err => {
      console.error("Failed to load PDF libraries:", err);
      toast.error(`Module loading failed: ${err.message}`);
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Billing & Payments</h1>
      </div>

      <div className={styles.labsSection}>
        <h2 className={styles.sectionTitle}>Your Bills</h2>
        <div className={styles.labsGrid}>
          {bills.map((bill) => (
            <div key={bill._id} className={styles.labCard}>
              <div className={styles.iconContainer}>
                <DollarSign className={styles.greenIcon} />
              </div>
              <h3 className={styles.labName}>{bill.hospital}</h3>
              <p className={styles.labDistance}>Date: {bill.date?.slice(0,10) || ""}</p>
              <p style={{ color: "#3498db", fontSize: "0.8rem", textAlign: "center" }}>
                Service: {bill.service}
              </p>
              <p style={{ fontSize: "0.8rem", textAlign: "center" }}>
                Amount: ₹{bill.amount}
              </p>
              <p style={{ fontSize: "0.8rem", textAlign: "center", color: bill.status === "Paid" ? "#27ae60" : "#e74c3c" }}>
                Status: {bill.status}
              </p>
              
              {bill.status === "Paid" && (
                <button
                  className="btn d-flex justify-content-center align-items-center gap-2 mt-2"
                  style={{ background: "#3498db", color: "#fff", borderRadius: "10px", padding: "6px", width: "100%", fontSize: "0.9rem" }}
                  onClick={() => downloadInvoice(bill)}
                >
                  <Download size={16} /> Download Invoice
                </button>
              )}
              <div style={{ display: 'none' }}>
                <QRCodeCanvas 
                    id={`qr-gen-${bill._id}`} 
                    value={JSON.stringify({ id: bill._id, amount: bill.amount, hospital: bill.hospital })} 
                />
              </div>
              
              {bill.status === "Pending" && payingBillId !== bill._id && (
                <>
                  <Select
                    options={paymentOptions}
                    value={selectedPaymentMethods[bill._id] || null}
                    onChange={(option) => handlePaymentMethodChange(bill._id, option)}
                    placeholder="Select Payment Method"
                    styles={selectStyles}
                    className="mt-2"
                  />
                  <button
                    className="btn"
                    style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "8px", width: "100%", marginTop: "10px" }}
                    onClick={() => handlePayInitiate(bill._id)}
                  >
                    Pay Now
                  </button>
                </>
              )}
              
              {bill.status === "Pending" && payingBillId === bill._id && (
                  <Elements stripe={stripePromise}>
                      <CheckoutForm 
                          bill={bill} 
                          onSuccess={handleStripeSuccess} 
                          onCancel={handleStripeCancel} 
                      />
                  </Elements>
              )}
            </div>
          ))}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Billing;

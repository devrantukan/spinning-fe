"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import AuthModal from "../components/AuthModal";

interface Package {
  id: string;
  code: string;
  name: string;
  nameTr?: string;
  type: string;
  price: number;
  credits?: number;
  pricePerCredit?: number;
  basePrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  description?: string;
  descriptionTr?: string;
  benefits?: string[];
  isActive: boolean;
}

interface Coupon {
  id: string;
  code: string;
  couponType: string;
  discountType?: string;
  discountValue?: number;
  applicablePackageIds?: string[];
  customPrice?: number;
}

export default function Pricing() {
  const { t, language } = useLanguage();
  const { user, session } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState<{
    amount: number;
    finalPrice: number;
  } | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "CREDIT_CARD" | "BANK_TRANSFER"
  >("BANK_TRANSFER");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingPackage, setPendingPackage] = useState<Package | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  // Handle successful login - open purchase modal if there was a pending package
  const handleLoginSuccess = useCallback(() => {
    // Use a small delay to ensure auth state is fully updated
    setTimeout(() => {
      setPendingPackage((currentPending) => {
        if (currentPending) {
          setSelectedPackage(currentPending);
          setShowModal(true);
          setCouponCode("");
          setCouponDiscount(null);
          setPaymentMethod("BANK_TRANSFER");
          setMessage(null);
          setIsAuthModalOpen(false);
          return null; // Clear pending package
        }
        return currentPending;
      });
    }, 300);
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      // Include auth token if available (for better backend access)
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/packages", {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setPackages(
          Array.isArray(data) ? data.filter((p: Package) => p.isActive) : []
        );
      } else {
        console.error(
          "Error fetching packages:",
          response.status,
          response.statusText
        );
        // Still set empty array so UI can render
        setPackages([]);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const validateCoupon = async (code: string, packageId: string) => {
    if (!code.trim()) {
      setCouponDiscount(null);
      return;
    }

    if (!session?.access_token) {
      setMessage({
        type: "error",
        text: t("pricing.loginRequired") || "Please log in to use coupons",
      });
      return;
    }

    setValidatingCoupon(true);
    try {
      const response = await fetch(`/api/coupons/code/${code}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        setCouponDiscount(null);
        setMessage({
          type: "error",
          text: t("pricing.invalidCoupon") || "Invalid coupon code",
        });
        return;
      }

      const coupon: Coupon = await response.json();

      // Check if coupon applies to this package
      if (
        coupon.couponType === "DISCOUNT" &&
        coupon.applicablePackageIds &&
        !coupon.applicablePackageIds.includes(packageId)
      ) {
        setCouponDiscount(null);
        setMessage({
          type: "error",
          text:
            t("pricing.couponNotApplicable") ||
            "Coupon does not apply to this package",
        });
        return;
      }

      // Calculate discount
      const selectedPkg = packages.find((p) => p.id === packageId);
      if (!selectedPkg) return;

      let discountAmount = 0;
      if (coupon.couponType === "DISCOUNT") {
        if (coupon.discountType === "PERCENTAGE" && coupon.discountValue) {
          discountAmount = (selectedPkg.price * coupon.discountValue) / 100;
        } else if (
          coupon.discountType === "FIXED_AMOUNT" &&
          coupon.discountValue
        ) {
          discountAmount = coupon.discountValue;
        }
      } else if (coupon.couponType === "PACKAGE" && coupon.customPrice) {
        discountAmount = selectedPkg.price - coupon.customPrice;
      }

      const finalPrice = Math.max(0, selectedPkg.price - discountAmount);
      setCouponDiscount({ amount: discountAmount, finalPrice });
      setMessage({
        type: "success",
        text: t("pricing.couponApplied") || "Coupon applied successfully",
      });
    } catch (err) {
      setCouponDiscount(null);
      setMessage({
        type: "error",
        text: t("pricing.couponError") || "Failed to validate coupon",
      });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handlePurchase = async () => {
    if (!user || !session?.access_token) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!selectedPackage) return;

    // Get member ID
    const membersResponse = await fetch("/api/members", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    let memberId: string | null = null;
    if (membersResponse.ok) {
      const members = await membersResponse.json();
      if (Array.isArray(members) && members.length > 0) {
        memberId = members[0].id;
      }
    }

    if (!memberId) {
      setMessage({
        type: "error",
        text:
          t("pricing.memberNotFound") ||
          "Member account not found. Please contact support.",
      });
      return;
    }

    setPurchasing(true);
    try {
      const response = await fetch("/api/packages/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          memberId,
          packageId: selectedPackage.id,
          couponCode: couponCode.trim() || undefined,
          paymentType: paymentMethod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show different message for bank transfer
        if (paymentMethod === "BANK_TRANSFER") {
          setMessage({
            type: "success",
            text:
              t("pricing.bankTransferCheckEmail") ||
              "Package order placed successfully! Please check your email for bank transfer details.",
          });
        } else {
          setMessage({
            type: "success",
            text:
              t("pricing.purchaseSuccess") || "Package purchased successfully!",
          });
        }
        setShowModal(false);
        setSelectedPackage(null);
        setCouponCode("");
        setCouponDiscount(null);
        setPaymentMethod("BANK_TRANSFER");
        // Refresh packages and redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000); // Increased timeout to give user time to read the message
      } else {
        setMessage({
          type: "error",
          text:
            data.error || t("pricing.purchaseError") || "Failed to purchase",
        });
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error.message || t("pricing.purchaseError") || "Failed to purchase",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getPackageTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      SINGLE_RIDE: t("pricing.types.singleRide") || "Single Ride",
      CREDIT_PACK: t("pricing.types.creditPack") || "Credit Pack",
      ELITE_30: t("pricing.types.elite30") || "Elite 30",
      ALL_ACCESS: t("pricing.types.allAccess") || "All Access",
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t("auth.loading") || "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen section-bg-primary pt-20 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
            }`}
          >
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold !text-gray-900 dark:!text-white mb-4">
            {t("pricing.title") || "Our Packages"}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t("pricing.subtitle") ||
              "Choose the perfect package for your fitness journey"}
          </p>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-700 dark:text-gray-400 text-lg">
              {t("pricing.noPackages") || "No packages available at the moment"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="!bg-white dark:!bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="text-center mb-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {pkg.code}
                  </div>
                  <h3 className="text-2xl font-bold !text-gray-900 dark:!text-white mb-2">
                    {language === "tr" && pkg.nameTr ? pkg.nameTr : pkg.name}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {getPackageTypeName(pkg.type)}
                  </div>
                </div>

                {pkg.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm text-center min-h-12">
                    {language === "tr" && pkg.descriptionTr
                      ? pkg.descriptionTr
                      : pkg.description}
                  </p>
                )}

                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                    {formatPrice(pkg.price)}
                  </div>
                  {pkg.discountPercentage && pkg.discountPercentage > 0 && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {t("pricing.save") || "Save"}{" "}
                      {formatPrice(pkg.discountAmount || 0)} (
                      {pkg.discountPercentage.toFixed(1)}%)
                    </div>
                  )}
                  {pkg.credits && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {pkg.credits} {t("pricing.credits") || "credits"} •{" "}
                      {formatPrice(pkg.pricePerCredit || 0)} /{" "}
                      {t("pricing.perCredit") || "credit"}
                    </div>
                  )}
                </div>

                {pkg.benefits && pkg.benefits.length > 0 && (
                  <div className="mb-6">
                    <ul className="space-y-2">
                      {pkg.benefits.map((benefit, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-green-600 dark:text-green-400 flex items-center"
                        >
                          <span className="mr-2">✓</span>
                          {benefit
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (!user || !session?.access_token) {
                      setPendingPackage(pkg);
                      setIsAuthModalOpen(true);
                      return;
                    }
                    setSelectedPackage(pkg);
                    setShowModal(true);
                    setCouponCode("");
                    setCouponDiscount(null);
                    setPaymentMethod("BANK_TRANSFER");
                    setMessage(null);
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  {t("pricing.purchase") || "Purchase"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Purchase Modal */}
        {showModal && selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t("pricing.purchasePackage") || "Purchase Package"}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPackage(null);
                    setCouponCode("");
                    setCouponDiscount(null);
                    setPaymentMethod("BANK_TRANSFER");
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {language === "tr" && selectedPackage.nameTr
                    ? selectedPackage.nameTr
                    : selectedPackage.name}
                </h4>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {couponDiscount
                    ? formatPrice(couponDiscount.finalPrice)
                    : formatPrice(selectedPackage.price)}
                </div>
                {couponDiscount && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t("pricing.originalPrice") || "Original"}:{" "}
                    {formatPrice(selectedPackage.price)} •{" "}
                    {t("pricing.discount") || "Discount"}:{" "}
                    {formatPrice(couponDiscount.amount)}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("pricing.couponCode") || "Coupon Code"} (
                  {t("pricing.optional") || "Optional"})
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      if (e.target.value.trim() && session?.access_token) {
                        validateCoupon(e.target.value, selectedPackage.id);
                      } else {
                        setCouponDiscount(null);
                      }
                    }}
                    placeholder="SUMMER2024"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg !bg-white dark:!bg-gray-700 !text-gray-900 dark:!text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {validatingCoupon && (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("pricing.paymentMethod") || "Payment Method"}
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-center p-3 border-2 rounded-lg transition-colors ${"border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed"}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CREDIT_CARD"
                      disabled
                      className="mr-3 h-4 w-4 text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                          {t("pricing.creditCard") || "Credit Card"}
                        </span>
                        <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded">
                          {t("pricing.comingSoon") || "Coming Soon"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 dark:text-gray-500">
                        {t("pricing.creditCardDescription") ||
                          "Pay instantly with your credit card"}
                      </div>
                    </div>
                  </label>
                  <label
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "BANK_TRANSFER"
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                        : "border-gray-300 dark:border-gray-600 !bg-white dark:!bg-gray-700 hover:border-orange-500 dark:hover:border-orange-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK_TRANSFER"
                      checked={paymentMethod === "BANK_TRANSFER"}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value as "CREDIT_CARD" | "BANK_TRANSFER"
                        )
                      }
                      className="mr-3 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-gray-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {t("pricing.bankTransfer") || "Bank Transfer"}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t("pricing.bankTransferDescription") ||
                          "Transfer funds directly from your bank account"}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPackage(null);
                    setCouponCode("");
                    setCouponDiscount(null);
                    setPaymentMethod("BANK_TRANSFER");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t("pricing.cancel") || "Cancel"}
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {purchasing
                    ? t("pricing.processing") || "Processing..."
                    : t("pricing.purchase") || "Purchase"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            setIsAuthModalOpen(false);
            setPendingPackage(null);
          }}
          onLoginSuccess={handleLoginSuccess}
          redirectAfterLogin={false}
        />
      </div>
    </div>
  );
}

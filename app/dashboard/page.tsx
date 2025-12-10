"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface MemberData {
  id: string;
  creditBalance?: number;
  credit_balance?: number;
  status: string;
  _count?: {
    bookings: number;
  };
}

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description?: string;
  createdAt?: string;
  created_at?: string;
}

export default function Dashboard() {
  const { user, loading, session } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && session) {
      fetchMemberData();
    }
  }, [user, session]);

  // Debug: Log memberData changes
  useEffect(() => {
    console.log("memberData state changed:", memberData);
  }, [memberData]);

  const fetchMemberData = async () => {
    if (!session?.access_token) {
      setLoadingMember(false);
      return;
    }

    try {
      // First, get user info to find member ID
      const userRes = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!userRes.ok) {
        setLoadingMember(false);
        return;
      }

      const userData = await userRes.json();

      // Fetch all members and find the one for this user
      const membersRes = await fetch("/api/members", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (membersRes.ok) {
        const members = await membersRes.json();
        console.log("Members API response:", members);
        console.log("User ID from auth:", userData.id);

        // API already filters by the correct user, so just use the first member
        // (or the member if it's a single object)
        const member =
          Array.isArray(members) && members.length > 0
            ? members[0]
            : members && typeof members === "object" && !Array.isArray(members)
            ? members
            : null;

        console.log("Found member:", member);
        console.log("Member type:", typeof member);
        console.log("Is array:", Array.isArray(members));
        console.log(
          "Members length:",
          Array.isArray(members) ? members.length : "not array"
        );

        if (member) {
          // Normalize credit balance
          const normalizedMember = {
            ...member,
            creditBalance:
              member.creditBalance !== undefined &&
              member.creditBalance !== null
                ? Number(member.creditBalance)
                : 0,
          };

          console.log("Normalized member data:", normalizedMember);
          console.log("Credit balance value:", normalizedMember.creditBalance);
          console.log("Setting memberData with:", normalizedMember);

          setMemberData(normalizedMember);
          console.log("memberData state should be updated");
          // Fetch credit history
          if (normalizedMember.id) {
            fetchCreditHistory(normalizedMember.id);
          }
        } else {
          console.warn("No member found for user:", userData.id);
          console.warn("Members array:", members);
        }
      } else {
        const errorText = await membersRes.text();
        console.error("Members API error:", membersRes.status, errorText);
      }
    } catch (error) {
      console.error("Error fetching member data:", error);
    } finally {
      setLoadingMember(false);
    }
  };

  const fetchCreditHistory = async (memberId: string) => {
    if (!session?.access_token) {
      return;
    }

    setLoadingHistory(true);
    try {
      console.log("Fetching credit history for member:", memberId);
      const historyRes = await fetch(`/api/members/${memberId}/credits`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (historyRes.ok) {
        const history = await historyRes.json();
        console.log("Credit history response:", history);
        setCreditHistory(Array.isArray(history) ? history : []);
      } else {
        const errorText = await historyRes.text();
        console.error(
          "Credit history API error:",
          historyRes.status,
          errorText
        );
        setCreditHistory([]);
      }
    } catch (error) {
      console.error("Error fetching credit history:", error);
      setCreditHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Calculate actual credit balance from member data
  const getCreditBalance = () => {
    if (!memberData) {
      console.log("getCreditBalance: memberData is null");
      return 0;
    }
    const balance = memberData.creditBalance ?? memberData.credit_balance ?? 0;
    console.log(
      "getCreditBalance: returning",
      balance,
      "from memberData:",
      memberData
    );
    return balance;
  };

  if (loading || loadingMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t("auth.loading") || "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t("dashboard.welcome") || "Welcome"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                {user.user_metadata?.name && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {user.user_metadata.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t("dashboard.creditBalance") || "Credit Balance"}
                  </h3>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {getCreditBalance().toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t("dashboard.creditBalanceInfo") ||
                      "Available credits for booking classes"}
                  </p>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t("dashboard.membership") || "Membership"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {memberData?.status
                      ? t(
                          `dashboard.status.${memberData.status.toLowerCase()}`
                        ) || memberData.status
                      : t("dashboard.membershipInfo") ||
                        "Your membership information will appear here."}
                  </p>
                  {memberData?._count?.bookings !== undefined && (
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      {t("dashboard.totalBookings") || "Total Bookings"}:{" "}
                      {memberData._count.bookings}
                    </p>
                  )}
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t("dashboard.classes") || "Classes"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("dashboard.classesInfo") ||
                      "Your class schedule will appear here."}
                  </p>
                </div>
              </div>

              {/* Credit History Section */}
              {memberData && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {t("dashboard.creditHistory.title") || "Credit History"}
                  </h3>
                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                      <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                        {t("auth.loading") || "Loading..."}
                      </p>
                    </div>
                  ) : creditHistory.length > 0 ? (
                    <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {t("dashboard.creditHistory.date") || "Date"}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {t("dashboard.creditHistory.type") || "Type"}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {t("dashboard.creditHistory.amount") ||
                                  "Amount"}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {t("dashboard.creditHistory.description") ||
                                  "Description"}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                            {creditHistory.map((transaction) => (
                              <tr key={transaction.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                  {transaction.createdAt
                                    ? new Date(
                                        transaction.createdAt
                                      ).toLocaleDateString()
                                    : transaction.created_at
                                    ? new Date(
                                        transaction.created_at
                                      ).toLocaleDateString()
                                    : "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      transaction.type === "credit" ||
                                      transaction.type === "add" ||
                                      transaction.amount > 0
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                    }`}
                                  >
                                    {transaction.type === "credit" ||
                                    transaction.type === "add" ||
                                    transaction.amount > 0
                                      ? t("dashboard.creditHistory.credit") ||
                                        "Credit"
                                      : t("dashboard.creditHistory.debit") ||
                                        "Debit"}
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                    transaction.amount > 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {transaction.amount > 0 ? "+" : ""}
                                  {Number(transaction.amount).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                  {transaction.description || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        {t("dashboard.creditHistory.empty") ||
                          "No credit history available."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

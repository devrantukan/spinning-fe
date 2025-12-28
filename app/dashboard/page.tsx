"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface MemberData {
  id: string;
  creditBalance?: number;
  credit_balance?: number;
  status: string;
  hasAllAccess?: boolean;
  allAccessExpiresAt?: string;
  isEliteMember?: boolean;
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

interface Booking {
  id: string;
  sessionId: string;
  status: string;
  session?: {
    id: string;
    startTime: string;
    class?: {
      name?: string;
      nameTr?: string;
    };
    location?: {
      name?: string;
    };
    instructor?: {
      user?: {
        name?: string;
      };
    };
  };
  seat?: {
    seatNumber?: string;
  };
}

export default function Dashboard() {
  const { user, loading, session } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const fetchingRef = useRef(false);
  const fetchedMemberIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const fetchCreditHistory = useCallback(
    async (memberId: string) => {
      if (!session?.access_token || !memberId) {
        return;
      }

      // Prevent fetching if already fetched for this member
      if (fetchedMemberIdRef.current === memberId) {
        return;
      }

      setLoadingHistory(true);
      try {
        const historyRes = await fetch(`/api/members/${memberId}/credits`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (historyRes.ok) {
          const history = await historyRes.json();
          setCreditHistory(Array.isArray(history) ? history : []);
          fetchedMemberIdRef.current = memberId;
        } else {
          setCreditHistory([]);
        }
      } catch (error) {
        console.error("Error fetching credit history:", error);
        setCreditHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    },
    [session?.access_token]
  );

  const fetchBookings = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    setLoadingBookings(true);
    try {
      // Fetch all bookings for the user (without sessionId filter)
      const response = await fetch("/api/bookings", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const bookingsData = Array.isArray(data) ? data : data.bookings || [];
        // Filter to only include bookings with session data
        const bookingsWithSessions = bookingsData.filter(
          (booking: any) => booking.session
        );
        setBookings(bookingsWithSessions);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [session?.access_token]);

  const fetchMemberData = useCallback(async () => {
    if (!session?.access_token || fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    setLoadingMember(true);

    try {
      // First, get user info to find member ID
      const userRes = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!userRes.ok) {
        setLoadingMember(false);
        fetchingRef.current = false;
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

        // API already filters by the correct user, so just use the first member
        const member =
          Array.isArray(members) && members.length > 0
            ? members[0]
            : members && typeof members === "object" && !Array.isArray(members)
            ? members
            : null;

        if (member) {
          // Normalize credit balance and include package system fields
          const normalizedMember = {
            ...member,
            creditBalance:
              member.creditBalance !== undefined &&
              member.creditBalance !== null
                ? Number(member.creditBalance)
                : 0,
            hasAllAccess: member.hasAllAccess || false,
            allAccessExpiresAt: member.allAccessExpiresAt || null,
            isEliteMember: member.isEliteMember || false,
          };

          setMemberData(normalizedMember);
          // Fetch credit history only if member ID changed
          if (
            normalizedMember.id &&
            fetchedMemberIdRef.current !== normalizedMember.id
          ) {
            fetchCreditHistory(normalizedMember.id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching member data:", error);
    } finally {
      setLoadingMember(false);
      fetchingRef.current = false;
    }
  }, [session?.access_token, fetchCreditHistory]);

  useEffect(() => {
    if (user && session?.access_token) {
      fetchBookings();
    }
  }, [user, session?.access_token, fetchBookings]);

  useEffect(() => {
    if (user && session?.access_token && !fetchingRef.current) {
      fetchMemberData();
    }
  }, [user, session?.access_token, fetchMemberData]);

  // Calculate actual credit balance from member data
  const getCreditBalance = () => {
    if (!memberData) {
      return 0;
    }
    const balance = memberData.creditBalance ?? memberData.credit_balance ?? 0;
    // Return as integer (rounded)
    return Math.round(Number(balance));
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t("dashboard.creditBalance") || "Credit Balance"}
                  </h3>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(getCreditBalance())}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t("dashboard.creditBalanceInfo") ||
                      "Available credits for booking classes"}
                  </p>
                </div>

                {memberData?.hasAllAccess && memberData?.allAccessExpiresAt && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t("dashboard.allAccess") || "All Access"}
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {new Date(memberData.allAccessExpiresAt) > new Date()
                        ? t("dashboard.active") || "Active"
                        : t("dashboard.expired") || "Expired"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(
                        memberData.allAccessExpiresAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {memberData?.isEliteMember && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t("dashboard.eliteMember") || "Elite Member"}
                    </h3>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      ⭐
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t("dashboard.eliteMemberInfo") ||
                        "Priority booking & exclusive benefits"}
                    </p>
                  </div>
                )}

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
              </div>

              {/* Upcoming and Past Sessions Section */}
              {memberData && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {t("dashboard.sessions.title") || "My Sessions"}
                  </h3>

                  {loadingBookings ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                      <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                        {t("auth.loading") || "Loading..."}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Upcoming Sessions */}
                      {(() => {
                        const now = new Date();
                        const upcoming = bookings
                          .filter((booking) => {
                            if (!booking.session?.startTime) return false;
                            const startTime = new Date(
                              booking.session.startTime
                            );
                            return (
                              startTime > now && booking.status !== "CANCELLED"
                            );
                          })
                          .sort((a, b) => {
                            const timeA = new Date(
                              a.session?.startTime || 0
                            ).getTime();
                            const timeB = new Date(
                              b.session?.startTime || 0
                            ).getTime();
                            return timeA - timeB;
                          });

                        return upcoming.length > 0 ? (
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                              {t("dashboard.sessions.upcoming") ||
                                "Upcoming Sessions"}
                            </h4>
                            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                                {upcoming.map((booking) => {
                                  const startTime = booking.session?.startTime
                                    ? new Date(booking.session.startTime)
                                    : null;
                                  const className =
                                    booking.session?.class?.nameTr ||
                                    booking.session?.class?.name ||
                                    "-";
                                  const location =
                                    booking.session?.location?.name || "-";
                                  const instructor =
                                    booking.session?.instructor?.user?.name ||
                                    "-";
                                  const seat = booking.seat?.seatNumber || "-";

                                  return (
                                    <div
                                      key={booking.id}
                                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                            {className}
                                          </p>
                                          {startTime && (
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                              {startTime.toLocaleDateString()}{" "}
                                              {t("dashboard.sessions.at") ||
                                                "at"}{" "}
                                              {startTime.toLocaleTimeString(
                                                [],
                                                {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                }
                                              )}
                                            </p>
                                          )}
                                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
                                            <span>{location}</span>
                                            {instructor !== "-" && (
                                              <span>• {instructor}</span>
                                            )}
                                            {seat !== "-" && (
                                              <span>
                                                •{" "}
                                                {t(
                                                  "dashboard.sessions.bicycle"
                                                ) || "Bicycle"}
                                                : {seat}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <span
                                          className={`px-2 py-1 text-xs font-semibold rounded ${
                                            booking.status === "CONFIRMED"
                                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                                              : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                                          }`}
                                        >
                                          {t(
                                            `dashboard.sessions.status.${booking.status}`
                                          ) || booking.status}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Past Sessions */}
                      {(() => {
                        const now = new Date();
                        const past = bookings
                          .filter((booking) => {
                            if (!booking.session?.startTime) return false;
                            const startTime = new Date(
                              booking.session.startTime
                            );
                            return (
                              startTime <= now || booking.status === "CANCELLED"
                            );
                          })
                          .sort((a, b) => {
                            const timeA = new Date(
                              a.session?.startTime || 0
                            ).getTime();
                            const timeB = new Date(
                              b.session?.startTime || 0
                            ).getTime();
                            return timeB - timeA; // Most recent first
                          });

                        return past.length > 0 ? (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                              {t("dashboard.sessions.past") || "Past Sessions"}
                            </h4>
                            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                                {past.slice(0, 10).map((booking) => {
                                  const startTime = booking.session?.startTime
                                    ? new Date(booking.session.startTime)
                                    : null;
                                  const className =
                                    booking.session?.class?.nameTr ||
                                    booking.session?.class?.name ||
                                    "-";
                                  const location =
                                    booking.session?.location?.name || "-";
                                  const instructor =
                                    booking.session?.instructor?.user?.name ||
                                    "-";
                                  const seat = booking.seat?.seatNumber || "-";

                                  return (
                                    <div
                                      key={booking.id}
                                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                            {className}
                                          </p>
                                          {startTime && (
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                              {startTime.toLocaleDateString()}{" "}
                                              {t("dashboard.sessions.at") ||
                                                "at"}{" "}
                                              {startTime.toLocaleTimeString(
                                                [],
                                                {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                }
                                              )}
                                            </p>
                                          )}
                                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
                                            <span>{location}</span>
                                            {instructor !== "-" && (
                                              <span>• {instructor}</span>
                                            )}
                                            {seat !== "-" && (
                                              <span>
                                                •{" "}
                                                {t(
                                                  "dashboard.sessions.bicycle"
                                                ) || "Bicycle"}
                                                : {seat}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <span
                                          className={`px-2 py-1 text-xs font-semibold rounded ${
                                            booking.status === "CANCELLED"
                                              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                                              : booking.status === "CONFIRMED"
                                              ? "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                                              : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                                          }`}
                                        >
                                          {t(
                                            `dashboard.sessions.status.${booking.status}`
                                          ) || booking.status}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {bookings.length === 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {t("dashboard.sessions.empty") ||
                              "No sessions found."}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

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
                    <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                          <thead className="bg-gray-300 dark:bg-gray-800 border-b-2 border-gray-400 dark:border-gray-600">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-gray-300 uppercase tracking-wider">
                                {t("dashboard.creditHistory.date") || "Date"}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-gray-300 uppercase tracking-wider">
                                {t("dashboard.creditHistory.type") || "Type"}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-gray-300 uppercase tracking-wider">
                                {t("dashboard.creditHistory.amount") ||
                                  "Amount"}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-gray-300 uppercase tracking-wider">
                                {t("dashboard.creditHistory.description") ||
                                  "Description"}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                            {creditHistory.map((transaction, index) => (
                              <tr
                                key={transaction.id}
                                className={`hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                                  index % 2 === 0
                                    ? "bg-white dark:bg-gray-700"
                                    : "bg-gray-50 dark:bg-gray-600/50"
                                }`}
                              >
                                <td
                                  className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black dark:text-gray-100"
                                  style={{ color: "#000000" }}
                                >
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
                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      transaction.type === "credit" ||
                                      transaction.type === "add" ||
                                      transaction.amount > 0
                                        ? "bg-green-600 text-white dark:bg-green-900 dark:text-green-200"
                                        : "bg-red-600 text-white dark:bg-red-900 dark:text-red-200"
                                    }`}
                                  >
                                    {transaction.type === "credit" ||
                                    transaction.type === "add" ||
                                    transaction.amount > 0
                                      ? t(
                                          "dashboard.creditHistory.creditDescription"
                                        ) || "Credit addition"
                                      : t(
                                          "dashboard.creditHistory.debitDescription"
                                        ) || "Class booking"}
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                                    transaction.amount > 0
                                      ? "text-green-700 dark:text-green-400"
                                      : "text-red-700 dark:text-red-400"
                                  }`}
                                >
                                  {transaction.amount > 0 ? "+" : ""}
                                  {Math.round(Number(transaction.amount))}
                                </td>
                                <td
                                  className="px-6 py-4 text-sm font-semibold text-black dark:text-gray-300"
                                  style={{ color: "#000000" }}
                                >
                                  {(() => {
                                    const desc = transaction.description || "";

                                    // Handle "Package redemption approved: [Package Name]"
                                    if (
                                      desc.includes(
                                        "Package redemption approved:"
                                      )
                                    ) {
                                      const packageName = desc
                                        .replace(
                                          "Package redemption approved:",
                                          ""
                                        )
                                        .trim();
                                      return `${
                                        t(
                                          "dashboard.creditHistory.packageRedemption"
                                        ) || "Package redemption approved"
                                      }: ${packageName}`;
                                    }

                                    // Handle "Payment for booking [ID]"
                                    if (desc.includes("Payment for booking")) {
                                      return (
                                        t(
                                          "dashboard.creditHistory.paymentForBooking"
                                        ) || "Class booking"
                                      );
                                    }

                                    // Handle "Credit added manually"
                                    if (
                                      desc.includes("Credit added manually") ||
                                      desc.includes("Manual") ||
                                      desc.includes("manually")
                                    ) {
                                      return (
                                        t(
                                          "dashboard.creditHistory.creditAddedManually"
                                        ) || "Credit added manually"
                                      );
                                    }

                                    // Return original description if no match
                                    return desc || "-";
                                  })()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
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

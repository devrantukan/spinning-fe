"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

interface Session {
  id: string;
  title: string;
  instructor:
    | string
    | { id?: string; name?: string; user?: { name?: string; email?: string } };
  time: string;
  date: string;
  duration: number;
  location: string;
  studio: string;
  musicGenre?: string;
  workoutType?: string;
}

// Helper function to extract instructor name
function getInstructorName(
  instructor:
    | string
    | { id?: string; name?: string; user?: { name?: string; email?: string } }
    | null
    | undefined,
  unknownText: string = "Unknown Instructor"
): string {
  if (!instructor) {
    return unknownText;
  }
  if (typeof instructor === "string") {
    return instructor;
  }
  if (instructor?.name) {
    return instructor.name;
  }
  if (instructor?.user?.name) {
    return instructor.user.name;
  }
  if (instructor?.user?.email) {
    return instructor.user.email;
  }
  return unknownText;
}

export default function Classes() {
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSessionId, setBookingSessionId] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<"all" | "am" | "pm">("all");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(today.setDate(diff));
  });

  // Fetch sessions from API
  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        // Build query parameters for backend filtering
        const params = new URLSearchParams();
        if (selectedInstructor) params.append("instructor", selectedInstructor);
        if (selectedWorkoutType)
          params.append("workoutType", selectedWorkoutType);
        if (searchQuery) params.append("search", searchQuery);
        if (timeFilter !== "all") params.append("timeFilter", timeFilter);

        // Always use first 3 days from current week
        const weekDates = getWeekDates(currentWeekStart);
        const firstThreeDays = weekDates
          .slice(0, 3)
          .sort((a, b) => a.getTime() - b.getTime());
        if (firstThreeDays.length > 0) {
          params.append(
            "startDate",
            firstThreeDays[0].toISOString().split("T")[0]
          );
          params.append(
            "endDate",
            firstThreeDays[firstThreeDays.length - 1]
              .toISOString()
              .split("T")[0]
          );
        }

        const response = await fetch(`/api/sessions?${params.toString()}`);
        const data = await response.json();
        const rawSessions = Array.isArray(data) ? data : [];

        console.log("Raw sessions from API:", rawSessions);

        // Transform backend session format to frontend format
        interface LocationObject {
          name?: string;
          address?: string;
          id?: string;
          description?: string;
          organizationId?: string;
          isDefault?: boolean;
          createdAt?: string;
          updatedAt?: string;
        }

        interface RawSession {
          id?: string;
          _id?: string;
          startTime?: string | Date;
          date?: string | Date;
          startDate?: string | Date;
          time?: string;
          title?: string;
          name?: string;
          instructor?: unknown;
          instructorId?: unknown;
          duration?: number | string;
          location?: string | LocationObject;
          studio?: string | { name?: string; address?: string };
          workoutType?: string;
          musicGenre?: string;
          class?: {
            date?: string | Date;
            time?: string;
            name?: string;
            instructor?: unknown;
            duration?: number | string;
            location?: string | LocationObject;
            studio?: string | { name?: string };
            workoutType?: string;
            musicGenre?: string;
          };
        }

        const transformedSessions = rawSessions.map((session: RawSession) => {
          // Extract date from various possible fields (prioritize startTime for date)
          let sessionDate: string | Date | null = null;
          if (session.startTime) {
            sessionDate = session.startTime as string | Date;
          } else if (session.date) {
            sessionDate = session.date as string | Date;
          } else if (session.startDate) {
            sessionDate = session.startDate as string | Date;
          } else if (session.class?.date) {
            sessionDate = session.class.date as string | Date;
          }

          // Extract time from startTime (if it's a datetime, extract just the time part)
          let sessionTime: string = "";
          if (session.startTime) {
            const startTimeDate = new Date(session.startTime);
            if (!isNaN(startTimeDate.getTime())) {
              // Format as HH:mm
              const hours = startTimeDate.getHours();
              const minutes = startTimeDate.getMinutes();
              sessionTime = `${hours.toString().padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}`;
            } else {
              sessionTime = String(session.startTime);
            }
          } else if (session.time) {
            sessionTime = String(session.time);
          } else if (session.class?.time) {
            sessionTime = String(session.class.time);
          }

          // Extract title from various possible fields
          const sessionTitle =
            session.title ||
            session.name ||
            session.class?.name ||
            "Untitled Session";

          // Extract instructor
          const sessionInstructor =
            session.instructor ||
            session.class?.instructor ||
            session.instructorId ||
            "Unknown Instructor";

          // Extract duration
          const sessionDuration =
            session.duration || session.class?.duration || 50;

          // Extract location
          let sessionLocation: string = "";
          if (typeof session.location === "string") {
            sessionLocation = session.location;
          } else if (session.location && typeof session.location === "object") {
            // Handle location object (extract name or address property)
            const locationObj = session.location as LocationObject;
            sessionLocation = locationObj?.name || locationObj?.address || "";
          } else if (session.class?.location) {
            if (typeof session.class.location === "string") {
              sessionLocation = session.class.location;
            } else if (
              session.class.location &&
              typeof session.class.location === "object"
            ) {
              const locationObj = session.class.location as LocationObject;
              sessionLocation = locationObj?.name || locationObj?.address || "";
            }
          } else if (
            typeof session.studio === "object" &&
            session.studio?.address
          ) {
            sessionLocation = session.studio.address;
          }

          // Extract studio
          let sessionStudio: string = "";
          if (typeof session.studio === "string") {
            sessionStudio = session.studio;
          } else if (session.studio?.name) {
            sessionStudio = session.studio.name;
          } else if (session.class?.studio) {
            sessionStudio =
              typeof session.class.studio === "string"
                ? session.class.studio
                : session.class.studio?.name || "";
          }

          // Extract workout type
          const sessionWorkoutType =
            session.workoutType || session.class?.workoutType;

          // Extract music genre
          const sessionMusicGenre =
            session.musicGenre || session.class?.musicGenre;

          // Ensure date is a valid ISO string
          let finalDate: string;
          if (sessionDate) {
            try {
              const dateObj =
                typeof sessionDate === "string"
                  ? new Date(sessionDate)
                  : sessionDate;
              if (!isNaN(dateObj.getTime())) {
                finalDate = dateObj.toISOString();
              } else {
                console.warn(
                  "Invalid date for session:",
                  sessionDate,
                  "using current date"
                );
                finalDate = new Date().toISOString();
              }
            } catch (e) {
              console.warn("Error parsing date:", sessionDate, e);
              finalDate = new Date().toISOString();
            }
          } else {
            console.warn("No date found for session:", session);
            finalDate = new Date().toISOString();
          }

          const transformed: Session = {
            id: (session.id || session._id || String(Math.random())) as string,
            title: sessionTitle,
            instructor: sessionInstructor as
              | string
              | {
                  id?: string;
                  name?: string;
                  user?: { name?: string; email?: string };
                },
            time: sessionTime,
            date: finalDate,
            duration:
              typeof sessionDuration === "number"
                ? sessionDuration
                : parseInt(String(sessionDuration)) || 50,
            location: sessionLocation,
            studio: sessionStudio,
            musicGenre: sessionMusicGenre,
            workoutType: sessionWorkoutType,
          };

          console.log("Transformed session:", transformed);
          return transformed;
        });

        console.log(`Transformed ${transformedSessions.length} sessions`);
        setSessions(transformedSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [
    selectedInstructor,
    selectedWorkoutType,
    searchQuery,
    timeFilter,
    currentWeekStart,
  ]);

  // Get unique instructors and workout types from sessions
  const instructors = useMemo(() => {
    const unique = Array.from(
      new Set(
        sessions.map((s) => getInstructorName(s.instructor)).filter(Boolean)
      )
    );
    return unique.sort();
  }, [sessions]);

  const workoutTypes = useMemo(() => {
    const unique = Array.from(
      new Set(sessions.map((s) => s.workoutType).filter(Boolean))
    );
    return unique.sort();
  }, [sessions]);

  // Get first 3 days from current week (for sessions)
  const firstThreeDays = useMemo(() => {
    const weekDates = getWeekDates(currentWeekStart);
    return weekDates.slice(0, 3).sort((a, b) => a.getTime() - b.getTime());
  }, [currentWeekStart]);

  // Get 7 days from current week (for display - 7th day shown as half)
  const sevenDays = useMemo(() => {
    const weekDates = getWeekDates(currentWeekStart);
    return weekDates.slice(0, 7).sort((a, b) => a.getTime() - b.getTime());
  }, [currentWeekStart]);

  // Group sessions by date - only for first 3 days
  const sessionsByDate = useMemo(() => {
    const grouped: Record<string, Session[]> = {};
    const firstThreeDayKeys = firstThreeDays.map((d) => formatDateKey(d));

    sessions.forEach((session) => {
      try {
        // Parse date string and create a local date to avoid timezone issues
        let date: Date;
        if (typeof session.date === "string") {
          // If it's a date string like "2024-12-27", parse it as local date
          const dateParts = session.date.split("T")[0].split("-");
          if (dateParts.length === 3) {
            date = new Date(
              parseInt(dateParts[0]),
              parseInt(dateParts[1]) - 1,
              parseInt(dateParts[2])
            );
          } else {
            date = new Date(session.date);
          }
        } else {
          date = new Date(session.date);
        }

        if (isNaN(date.getTime())) {
          console.warn("Invalid date for session:", session.date);
          return;
        }
        const dateKey = formatDateKey(date);

        // Only include sessions from first 3 days
        if (firstThreeDayKeys.includes(dateKey)) {
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(session);
        }
      } catch (error) {
        console.warn("Error parsing date for session:", session.date, error);
      }
    });
    return grouped;
  }, [sessions, firstThreeDays]);

  // Helper functions
  function formatDateKey(date: Date): string {
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getWeekDates(startDate: Date): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  function formatDayHeader(date: Date): string {
    const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const monthKeys = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const day = t(`classes.days.${dayKeys[date.getDay()]}`).toUpperCase();
    const month = t(
      `classes.months.short.${monthKeys[date.getMonth()]}`
    ).toUpperCase();
    return `${day} ${date.getDate()} ${month}`;
  }

  function formatDateButton(date: Date): string {
    const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const monthKeys = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const day = t(`classes.days.${dayKeys[date.getDay()]}`);
    const month = t(`classes.months.short.${monthKeys[date.getMonth()]}`);
    return `${date.getDate()} ${month} ${day}`;
  }

  function formatTime(timeString: string): string {
    // Handle various time formats
    if (!timeString) return t("classes.session.timeTbd");

    // Try to parse as ISO time string first
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      if (!isNaN(time.getTime())) {
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const period =
          hours >= 12
            ? t("classes.filters.pm").toLowerCase()
            : t("classes.filters.am").toLowerCase();
        const displayHours = hours % 12 || 12;
        return `${t("classes.session.time")} ${displayHours}:${minutes
          .toString()
          .padStart(2, "0")} ${period}`;
      }
    } catch {
      // Continue to regex parsing
    }

    // Try to extract time from string using regex
    const match = timeString.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] || "00";
      const period = match[3]?.toLowerCase();
      if (period === "pm" && hours !== 12) hours += 12;
      if (period === "am" && hours === 12) hours = 0;
      const displayHours = hours % 12 || 12;
      const periodText =
        period ||
        (hours >= 12
          ? t("classes.filters.pm").toLowerCase()
          : t("classes.filters.am").toLowerCase());
      return `${t("classes.session.time")} ${displayHours}:${minutes.padStart(
        2,
        "0"
      )} ${periodText}`;
    }

    // If all parsing fails, return as-is with "Time" prefix
    return `${t("classes.session.time")} ${timeString}`;
  }

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSessionForBooking, setSelectedSessionForBooking] =
    useState<Session | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "CREDITS" | "ALL_ACCESS" | "FRIEND_PASS"
  >("CREDITS");
  const [memberData, setMemberData] = useState<any>(null);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [allAccessUsages, setAllAccessUsages] = useState<any[]>([]);

  useEffect(() => {
    if (user && session?.access_token) {
      fetchMemberAndRedemptions();
    }
  }, [user, session?.access_token]);

  const fetchMemberAndRedemptions = async () => {
    if (!session?.access_token) return;

    try {
      // Fetch member
      const membersRes = await fetch("/api/members", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (membersRes.ok) {
        const members = await membersRes.json();
        const member =
          Array.isArray(members) && members.length > 0 ? members[0] : null;
        if (member) {
          setMemberData(member);

          // Fetch redemptions
          const redemptionsRes = await fetch(
            `/api/members/${member.id}/redemptions`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );
          if (redemptionsRes.ok) {
            const redemptionsData = await redemptionsRes.json();
            const redemptionsList = Array.isArray(redemptionsData)
              ? redemptionsData
              : [];
            setRedemptions(redemptionsList);

            // Fetch All Access usage
            const allAccessRedemptions = redemptionsList.filter(
              (r: any) =>
                r.status === "ACTIVE" &&
                r.allAccessExpiresAt &&
                new Date(r.allAccessExpiresAt) > new Date()
            );

            if (allAccessRedemptions.length > 0) {
              const usagePromises = allAccessRedemptions.map((r: any) =>
                fetch(`/api/redemptions/${r.id}/all-access-usage`, {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                  },
                }).then((res) => (res.ok ? res.json() : []))
              );

              const usageResults = await Promise.all(usagePromises);
              const allUsages = usageResults.flat();
              setAllAccessUsages(Array.isArray(allUsages) ? allUsages : []);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching member data:", error);
    }
  };

  const getAvailablePaymentMethods = (): Array<
    "CREDITS" | "ALL_ACCESS" | "FRIEND_PASS"
  > => {
    const methods: Array<"CREDITS" | "ALL_ACCESS" | "FRIEND_PASS"> = [];

    if (!memberData) return methods;

    // Check credits (assuming 1 credit per session)
    const sessionCredits = 1;
    if (memberData.creditBalance >= sessionCredits) {
      methods.push("CREDITS");
    }

    // Check All Access
    if (memberData.hasAllAccess && memberData.allAccessExpiresAt) {
      const activeRedemption = redemptions.find(
        (r: any) =>
          r.status === "ACTIVE" &&
          r.allAccessExpiresAt &&
          new Date(r.allAccessExpiresAt) > new Date()
      );
      if (activeRedemption) {
        const todayStr = new Date().toISOString().split("T")[0];
        const usedToday = allAccessUsages.some(
          (usage: any) => usage.usageDate === todayStr && !usage.wasNoShow
        );
        if (!usedToday) {
          methods.push("ALL_ACCESS");
        }
      }
    }

    // Check friend pass
    const friendPassRedemption = redemptions.find(
      (r: any) =>
        r.friendPassAvailable &&
        !r.friendPassUsed &&
        r.friendPassExpiresAt &&
        new Date(r.friendPassExpiresAt) > new Date()
    );
    if (friendPassRedemption) {
      methods.push("FRIEND_PASS");
    }

    return methods;
  };

  async function handleBookNow(session: Session) {
    // Redirect to session detail page - public access, no login required
    router.push(`/classes/${session.id}`);
  }

  async function proceedWithBooking(
    sessionToBook: Session,
    paymentType: "CREDITS" | "ALL_ACCESS" | "FRIEND_PASS"
  ) {
    setBookingSessionId(sessionToBook.id);
    setBookingMessage(null);
    setShowPaymentModal(false);

    try {
      // First, get the member ID for the current user
      const membersResponse = await fetch("/api/members", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
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
        setBookingMessage({
          type: "error",
          text:
            t("classes.booking.noMember") ||
            "Member account not found. Please contact support.",
        });
        setBookingSessionId(null);
        setTimeout(() => setBookingMessage(null), 5000);
        return;
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          sessionId: sessionToBook.id,
          memberId: memberId,
          paymentType: paymentType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBookingMessage({
          type: "success",
          text: t("classes.booking.success") || "Booking successful!",
        });
        // Refresh sessions and member data
        await fetchMemberAndRedemptions();
        setTimeout(() => {
          setBookingSessionId(null);
          setBookingMessage(null);
          setSelectedSessionForBooking(null);
          // Trigger a refresh by updating a dependency
          setCurrentWeekStart((prev) => new Date(prev));
        }, 2000);
      } else {
        setBookingMessage({
          type: "error",
          text:
            data.error ||
            t("classes.booking.error") ||
            "Failed to book session. Please try again.",
        });
        setBookingSessionId(null);
        setTimeout(() => setBookingMessage(null), 5000);
      }
    } catch (error: any) {
      console.error("Error booking session:", error);
      setBookingMessage({
        type: "error",
        text:
          t("classes.booking.error") || "An error occurred. Please try again.",
      });
      setBookingSessionId(null);
      setTimeout(() => setBookingMessage(null), 5000);
    }
  }

  // Check if left arrow should be disabled (can't go to past dates)
  const isLeftArrowDisabled = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(currentWeekStart);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart <= today;
  })();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Booking Message */}
        {bookingMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              bookingMessage.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
            }`}
          >
            <p className="font-medium">{bookingMessage.text}</p>
          </div>
        )}

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 tracking-wide uppercase">
            {t("classes.title")}
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {t("classes.timetable")}
          </h2>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex flex-col min-w-[160px]">
            <label
              htmlFor="instructor-select"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              {t("classes.filters.instructors")}
            </label>
            <select
              id="instructor-select"
              value={selectedInstructor}
              onChange={(e) => setSelectedInstructor(e.target.value)}
              className={`h-10 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                selectedInstructor
                  ? "text-gray-900 dark:text-white border-orange-500 dark:border-orange-400 bg-orange-100 dark:bg-orange-900/30 font-medium"
                  : "text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}
            >
              <option value="" className="text-gray-600 dark:text-gray-400">
                {t("classes.filters.allInstructors")}
              </option>
              {instructors.map((instructor) => (
                <option
                  key={instructor}
                  value={instructor}
                  className="text-gray-900 dark:text-white"
                >
                  {instructor}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col min-w-[160px]">
            <label
              htmlFor="workout-type-select"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              {t("classes.filters.workoutType")}
            </label>
            <select
              id="workout-type-select"
              value={selectedWorkoutType}
              onChange={(e) => setSelectedWorkoutType(e.target.value)}
              className={`h-10 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                selectedWorkoutType
                  ? "text-gray-900 dark:text-white border-orange-500 dark:border-orange-400 bg-orange-100 dark:bg-orange-900/30 font-medium"
                  : "text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}
            >
              <option value="" className="text-gray-600 dark:text-gray-400">
                {t("classes.filters.allTypes")}
              </option>
              {workoutTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                  className="text-gray-900 dark:text-white"
                >
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col min-w-[200px] flex-1">
            <label
              htmlFor="search-input"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              {t("classes.filters.search")}
            </label>
            <input
              id="search-input"
              type="text"
              placeholder={t("classes.filters.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 px-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:border-orange-500 placeholder:text-gray-500 dark:placeholder:text-gray-400 placeholder:italic"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 invisible">
              Time Filter
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeFilter("all")}
                className={`h-10 px-4 rounded-lg font-medium transition-colors ${
                  timeFilter === "all"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-900 dark:bg-gray-800 text-gray-200 dark:text-white hover:bg-gray-800 dark:hover:bg-gray-700"
                }`}
              >
                {t("classes.filters.allDay")}
              </button>
              <button
                onClick={() => setTimeFilter("am")}
                className={`h-10 px-4 rounded-lg font-medium transition-colors ${
                  timeFilter === "am"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-900 dark:bg-gray-800 text-gray-200 dark:text-white hover:bg-gray-800 dark:hover:bg-gray-700"
                }`}
              >
                {t("classes.filters.am")}
              </button>
              <button
                onClick={() => setTimeFilter("pm")}
                className={`h-10 px-4 rounded-lg font-medium transition-colors ${
                  timeFilter === "pm"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-900 dark:bg-gray-800 text-gray-200 dark:text-white hover:bg-gray-800 dark:hover:bg-gray-700"
                }`}
              >
                {t("classes.filters.pm")}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Date Selection */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t("classes.quickDateSelection")}
          </p>
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-1 flex-1 w-full">
              {sevenDays.map((date, index) => {
                const isFirstThree = index < 3;
                const isSeventh = index === 6;
                const dayKeys = [
                  "sun",
                  "mon",
                  "tue",
                  "wed",
                  "thu",
                  "fri",
                  "sat",
                ];
                const monthKeys = [
                  "jan",
                  "feb",
                  "mar",
                  "apr",
                  "may",
                  "jun",
                  "jul",
                  "aug",
                  "sep",
                  "oct",
                  "nov",
                  "dec",
                ];
                const day = t(`classes.days.${dayKeys[date.getDay()]}`);
                const month = t(
                  `classes.months.short.${monthKeys[date.getMonth()]}`
                );
                return (
                  <button
                    key={index}
                    onClick={() => {
                      // Set the clicked date as the new week start
                      // This will make it the first of the 3 active dates
                      const newStartDate = new Date(date);
                      // Reset to start of day
                      newStartDate.setHours(0, 0, 0, 0);
                      setCurrentWeekStart(newStartDate);
                    }}
                    className={`flex flex-col items-center justify-center rounded-lg font-medium whitespace-nowrap shadow-md transition-all cursor-pointer py-3 flex-1 ${
                      isFirstThree
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    style={
                      isSeventh
                        ? {
                            clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)",
                          }
                        : {}
                    }
                  >
                    <span
                      className={`text-2xl font-bold ${
                        isFirstThree
                          ? "text-white"
                          : "text-gray-900 dark:text-gray-200"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    <span
                      className={`text-xs ${
                        isFirstThree
                          ? "text-white"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {month} {day}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (isLeftArrowDisabled) return;
                  setCurrentWeekStart((prev) => {
                    const newDate = new Date(prev);
                    newDate.setDate(prev.getDate() - 3);
                    return newDate;
                  });
                }}
                disabled={isLeftArrowDisabled}
                className={`px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg transition-all font-bold text-lg shadow-sm shrink-0 ${
                  isLeftArrowDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-orange-400 dark:hover:border-orange-600 hover:text-orange-600 dark:hover:text-orange-400"
                }`}
                aria-label={t("classes.previousWeek")}
              >
                ←
              </button>
              <button
                onClick={() => {
                  setCurrentWeekStart((prev) => {
                    const newDate = new Date(prev);
                    newDate.setDate(prev.getDate() + 3);
                    return newDate;
                  });
                }}
                className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-orange-400 dark:hover:border-orange-600 hover:text-orange-600 dark:hover:text-orange-400 transition-all font-bold text-lg shadow-sm hover:shadow-md shrink-0"
                aria-label={t("classes.nextWeek")}
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Display */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {firstThreeDays.map((date) => {
              const dateKey = formatDateKey(date);
              const daySessions = sessionsByDate[dateKey] || [];
              return (
                <div key={dateKey} className="flex flex-col">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 tracking-wider uppercase">
                    {formatDayHeader(date)}
                  </h3>
                  <div className="space-y-4 flex-1">
                    {daySessions.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {t("classes.noSessions")}
                      </p>
                    ) : (
                      daySessions.map((session) => {
                        // Format date for display - use local date parsing to avoid timezone issues
                        let sessionDate: Date;
                        if (typeof session.date === "string") {
                          // If it's a date string like "2024-12-27", parse it as local date
                          const dateParts = session.date
                            .split("T")[0]
                            .split("-");
                          if (dateParts.length === 3) {
                            sessionDate = new Date(
                              parseInt(dateParts[0]),
                              parseInt(dateParts[1]) - 1,
                              parseInt(dateParts[2])
                            );
                          } else {
                            sessionDate = new Date(session.date);
                          }
                        } else {
                          sessionDate = new Date(session.date);
                        }

                        const dayKeys = [
                          "sun",
                          "mon",
                          "tue",
                          "wed",
                          "thu",
                          "fri",
                          "sat",
                        ];
                        const monthKeys = [
                          "jan",
                          "feb",
                          "mar",
                          "apr",
                          "may",
                          "jun",
                          "jul",
                          "aug",
                          "sep",
                          "oct",
                          "nov",
                          "dec",
                        ];
                        const monthKeysLong = [
                          "january",
                          "february",
                          "march",
                          "april",
                          "may",
                          "june",
                          "july",
                          "august",
                          "september",
                          "october",
                          "november",
                          "december",
                        ];
                        const dayNum = sessionDate.getDate();
                        // Get day suffix - 11th, 12th, 13th are special cases
                        let daySuffix;
                        const lastTwoDigits = dayNum % 100;
                        const lastDigit = dayNum % 10;

                        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
                          daySuffix = t("classes.daySuffix.th") || "th";
                        } else if (lastDigit === 1) {
                          daySuffix = t("classes.daySuffix.st") || "st";
                        } else if (lastDigit === 2) {
                          daySuffix = t("classes.daySuffix.nd") || "nd";
                        } else if (lastDigit === 3) {
                          daySuffix = t("classes.daySuffix.rd") || "rd";
                        } else {
                          daySuffix = t("classes.daySuffix.th") || "th";
                        }

                        const formattedDate = `${t(
                          `classes.days.${dayKeys[sessionDate.getDay()]}`
                        )} ${dayNum}${daySuffix} ${t(
                          `classes.months.long.${
                            monthKeysLong[sessionDate.getMonth()]
                          }`
                        )} ${sessionDate.getFullYear()}`;

                        // Format time
                        const timeMatch = session.time.match(
                          /(\d{1,2}):?(\d{2})?\s*(am|pm)?/i
                        );
                        let formattedTime = session.time;
                        if (timeMatch) {
                          let hours = parseInt(timeMatch[1]);
                          const minutes = timeMatch[2] || "00";
                          const period = timeMatch[3]?.toLowerCase();
                          if (period === "pm" && hours !== 12) hours += 12;
                          if (period === "am" && hours === 12) hours = 0;
                          const displayHours = hours % 12 || 12;
                          const periodText =
                            period ||
                            (hours >= 12
                              ? t("classes.filters.pm").toLowerCase()
                              : t("classes.filters.am").toLowerCase());
                          formattedTime = `${displayHours}:${minutes.padStart(
                            2,
                            "0"
                          )} ${periodText}`;
                        }

                        return (
                          <div
                            key={session.id}
                            className="bg-[#222222] dark:bg-[#222222] text-gray-100 dark:text-gray-100 rounded-lg p-5 shadow-lg hover:shadow-xl transition-shadow"
                          >
                            <h4 className="text-lg font-bold mb-3 text-gray-100 dark:text-gray-100 uppercase tracking-wide">
                              {session.title}
                            </h4>
                            <div className="space-y-2 text-sm text-gray-200 dark:text-gray-200 mb-4">
                              <p className="text-gray-300 dark:text-gray-300">
                                {t("classes.session.with")}{" "}
                                <span className="font-semibold">
                                  {getInstructorName(
                                    session.instructor as
                                      | string
                                      | {
                                          id?: string;
                                          name?: string;
                                          user?: {
                                            name?: string;
                                            email?: string;
                                          };
                                        }
                                      | null
                                      | undefined,
                                    t("classes.session.unknownInstructor")
                                  ).toUpperCase()}
                                </span>
                              </p>
                              <p>
                                {t("classes.session.time")} {formattedTime}
                              </p>
                              <p>
                                {t("classes.session.date")} {formattedDate}
                              </p>
                              <p>
                                {t("classes.session.duration")}{" "}
                                {session.duration}{" "}
                                {t("classes.session.minutes")}
                              </p>
                              {session.location && (
                                <p>
                                  {t("classes.session.location")}{" "}
                                  {session.location}
                                </p>
                              )}
                              {session.studio && (
                                <p>
                                  {t("classes.session.studio")} {session.studio}
                                </p>
                              )}
                              {session.musicGenre && (
                                <p>
                                  {t("classes.session.musicGenre")}{" "}
                                  {session.musicGenre}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleBookNow(session)}
                              disabled={bookingSessionId === session.id}
                              className={`mt-3 w-full px-4 py-3 text-sm font-bold rounded-lg transition-colors uppercase tracking-wide ${
                                bookingSessionId === session.id
                                  ? "bg-gray-600 text-white cursor-not-allowed"
                                  : "bg-orange-500 text-white hover:bg-orange-600"
                              }`}
                            >
                              {bookingSessionId === session.id
                                ? t("classes.session.booking")
                                : t("classes.session.bookNow") || "BOOK NOW"}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment Method Selection Modal */}
        {showPaymentModal && selectedSessionForBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t("classes.booking.selectPaymentMethod") ||
                    "Select Payment Method"}
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedSessionForBooking(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t("classes.booking.selectPaymentMethodDescription") ||
                    "Choose how you want to pay for this session:"}
                </p>

                {getAvailablePaymentMethods().map((method) => (
                  <label
                    key={method}
                    className="flex items-center gap-3 p-3 mb-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value as
                            | "CREDITS"
                            | "ALL_ACCESS"
                            | "FRIEND_PASS"
                        )
                      }
                      className="w-4 h-4 text-orange-500"
                    />
                    <span className="text-gray-900 dark:text-white">
                      {method === "CREDITS"
                        ? `${t("classes.booking.credits") || "Credits"} (${
                            memberData?.creditBalance || 0
                          } ${t("classes.booking.available") || "available"})`
                        : method === "ALL_ACCESS"
                        ? t("classes.booking.allAccess") || "All Access"
                        : t("classes.booking.friendPass") || "Friend Pass"}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedSessionForBooking(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t("classes.booking.cancel") || "Cancel"}
                </button>
                <button
                  onClick={() =>
                    proceedWithBooking(selectedSessionForBooking, paymentMethod)
                  }
                  disabled={bookingSessionId === selectedSessionForBooking.id}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {bookingSessionId === selectedSessionForBooking.id
                    ? t("classes.session.booking")
                    : t("classes.booking.confirm") || "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

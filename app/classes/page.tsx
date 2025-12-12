"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";

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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<"all" | "am" | "pm">("all");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
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

        // Add date range for selected dates or current week
        const datesToUse =
          selectedDates.length > 0
            ? selectedDates
            : getWeekDates(currentWeekStart);
        if (datesToUse.length > 0) {
          const sortedDates = [...datesToUse].sort(
            (a, b) => a.getTime() - b.getTime()
          );
          params.append(
            "startDate",
            sortedDates[0].toISOString().split("T")[0]
          );
          params.append(
            "endDate",
            sortedDates[sortedDates.length - 1].toISOString().split("T")[0]
          );
        }

        const response = await fetch(`/api/sessions?${params.toString()}`);
        const data = await response.json();
        const rawSessions = Array.isArray(data) ? data : [];

        console.log("Raw sessions from API:", rawSessions);

        // Transform backend session format to frontend format
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
          location?: string;
          studio?: string | { name?: string; address?: string };
          workoutType?: string;
          musicGenre?: string;
          class?: {
            date?: string | Date;
            time?: string;
            name?: string;
            instructor?: unknown;
            duration?: number | string;
            location?: string;
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
          const sessionLocation =
            session.location ||
            session.class?.location ||
            (typeof session.studio === "object" && session.studio?.address) ||
            "";

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
    selectedDates,
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

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped: Record<string, Session[]> = {};
    sessions.forEach((session) => {
      try {
        const date = new Date(session.date);
        if (isNaN(date.getTime())) {
          console.warn("Invalid date for session:", session.date);
          return;
        }
        const dateKey = formatDateKey(date);
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(session);
      } catch (error) {
        console.warn("Error parsing date for session:", session.date, error);
      }
    });
    return grouped;
  }, [sessions]);

  // Helper functions
  function formatDateKey(date: Date): string {
    return date.toISOString().split("T")[0];
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

  function formatSessionDate(dateString: string): string {
    const date = new Date(dateString);
    const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const monthKeys = [
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
    const day = t(`classes.days.${dayKeys[date.getDay()]}`);
    const dayNum = date.getDate();
    const month = t(`classes.months.long.${monthKeys[date.getMonth()]}`);
    const year = date.getFullYear();
    const suffix = getDaySuffix(dayNum);
    return `${t(
      "classes.session.date"
    )} ${day} ${dayNum}${suffix} ${month} ${year}`;
  }

  function getDaySuffix(day: number): string {
    if (day > 3 && day < 21) return t("classes.daySuffix.th");
    switch (day % 10) {
      case 1:
        return t("classes.daySuffix.st");
      case 2:
        return t("classes.daySuffix.nd");
      case 3:
        return t("classes.daySuffix.rd");
      default:
        return t("classes.daySuffix.th");
    }
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

  function isDateSelected(date: Date): boolean {
    if (selectedDates.length === 0) {
      // If no dates selected, show all dates in current week
      const weekDates = getWeekDates(currentWeekStart);
      return weekDates.some((d) => d.toDateString() === date.toDateString());
    }
    return selectedDates.some((d) => d.toDateString() === date.toDateString());
  }

  function toggleDateSelection(date: Date) {
    setSelectedDates((prev) => {
      const dateStr = date.toDateString();
      const exists = prev.some((d) => d.toDateString() === dateStr);
      if (exists) {
        return prev.filter((d) => d.toDateString() !== dateStr);
      } else {
        return [...prev, date];
      }
    });
  }

  function navigateWeek(direction: "prev" | "next") {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
      return newDate;
    });
    setSelectedDates([]); // Reset selected dates when navigating
  }

  const weekDates = getWeekDates(currentWeekStart);
  const sortedDateKeys = Object.keys(sessionsByDate).sort();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
          {t("classes.title")}
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-6">
          {t("classes.timetable")}
        </h2>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex flex-col min-w-[180px]">
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

          <div className="flex flex-col min-w-[180px]">
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

          <div className="flex flex-col min-w-[200px] flex-1 max-w-md">
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
                    : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {t("classes.filters.allDay")}
              </button>
              <button
                onClick={() => setTimeFilter("am")}
                className={`h-10 px-4 rounded-lg font-medium transition-colors ${
                  timeFilter === "am"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {t("classes.filters.am")}
              </button>
              <button
                onClick={() => setTimeFilter("pm")}
                className={`h-10 px-4 rounded-lg font-medium transition-colors ${
                  timeFilter === "pm"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {t("classes.filters.pm")}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Date Selection */}
        <div className="mb-8">
          <p className="text-gray-800 dark:text-white font-semibold mb-3">
            {t("classes.quickDateSelection")}
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {weekDates.map((date, index) => {
              const isSelected = isDateSelected(date);
              return (
                <button
                  key={index}
                  onClick={() => toggleDateSelection(date)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {formatDateButton(date)}
                </button>
              );
            })}
            <div className="flex gap-2 ml-2">
              <button
                onClick={() => navigateWeek("prev")}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-orange-400 dark:hover:border-orange-600 hover:text-orange-600 dark:hover:text-orange-400 transition-all font-bold text-lg shadow-sm hover:shadow-md"
                aria-label={t("classes.previousWeek")}
              >
                ←
              </button>
              <button
                onClick={() => navigateWeek("next")}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-orange-400 dark:hover:border-orange-600 hover:text-orange-600 dark:hover:text-orange-400 transition-all font-bold text-lg shadow-sm hover:shadow-md"
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
        ) : sortedDateKeys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-700 dark:text-gray-400 text-lg">
              {t("classes.noSessions")}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDateKeys.map((dateKey) => {
              const date = new Date(dateKey);
              const daySessions = sessionsByDate[dateKey];
              return (
                <div key={dateKey}>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {formatDayHeader(date)}
                  </h3>
                  <div className="space-y-4">
                    {daySessions.map((session) => (
                      <div
                        key={session.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
                      >
                        <h4 className="text-xl md:text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                          {session.title}
                        </h4>
                        <div className="space-y-2 text-gray-700 dark:text-gray-300">
                          <p>
                            {t("classes.session.with")}{" "}
                            {getInstructorName(
                              session.instructor as
                                | string
                                | {
                                    id?: string;
                                    name?: string;
                                    user?: { name?: string; email?: string };
                                  }
                                | null
                                | undefined,
                              t("classes.session.unknownInstructor")
                            )}
                          </p>
                          <p>{formatTime(session.time)}</p>
                          <p>{formatSessionDate(session.date)}</p>
                          <p>
                            {t("classes.session.duration")} {session.duration}{" "}
                            {t("classes.session.minutes")}
                          </p>
                          <p>
                            {t("classes.session.location")} {session.location}
                          </p>
                          <p>
                            {t("classes.session.studio")} {session.studio}
                          </p>
                          {session.musicGenre && (
                            <p>
                              {t("classes.session.musicGenre")}{" "}
                              {session.musicGenre}
                            </p>
                          )}
                        </div>
                        <button className="mt-4 w-full md:w-auto px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors">
                          {t("classes.session.bookNow")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

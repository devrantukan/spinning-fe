"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import AuthModal from "../../components/AuthModal";

interface LocationObject {
  id?: string;
  locationId?: string;
  name?: string;
  address?: string;
  capacity?: number;
  rows?: number;
  seatsPerRow?: number;
  seatLayout?: {
    rows: string[];
    seatsPerRow: number;
  };
  [key: string]: unknown;
}

interface SeatLayout {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  gridRows: number;
  gridColumns: number;
  seats?: Array<{
    id: string;
    seatNumber?: number;
    row: string;
    column?: number;
    number?: number;
    type?: "normal" | "podium" | "column" | "instructor" | "exclusive";
    label?: string;
    status?: "available" | "occupied" | "active" | "inactive";
    creditCost?: number;
  }>;
  capacity?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Session {
  id: string;
  title: string;
  titleTr?: string;
  instructor:
    | string
    | { id?: string; name?: string; user?: { name?: string; email?: string } };
  time: string;
  date: string;
  duration: number;
  location: string | LocationObject;
  studio: string;
  musicGenre?: string;
  musicGenreTr?: string;
  workoutType?: string;
  maxCapacity?: number;
  currentBookings?: number;
}

interface Seat {
  id: string;
  row: string;
  number: number;
  column?: number;
  status: "available" | "occupied" | "selected" | "unavailable";
  type?: "normal" | "podium" | "column" | "instructor" | "exclusive";
  label?: string; // For special seats like "P", "C", etc.
  creditCost?: number;
}

// Helper function to convert text to uppercase based on locale
function toUpperCaseLocale(text: string, language: string): string {
  if (!text) return text;
  const locale = language === "tr" ? "tr-TR" : "en-US";
  return text.toLocaleUpperCase(locale);
}

// Helper function to normalize title (applies Turkish uppercase rules)
function normalizeTitle(title: string, language: string): string {
  if (!title) return title;
  return toUpperCaseLocale(title, language);
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
  if (!instructor) return unknownText;
  if (typeof instructor === "string") return instructor;
  if (instructor.name) return instructor.name;
  if (instructor.user?.name) return instructor.user.name;
  if (instructor.user?.email) return instructor.user.email;
  return unknownText;
}

// Generate seat layout from seat layout data
function generateSeatLayoutFromData(seatLayoutData: SeatLayout | null): Seat[] {
  // Default layout if no data provided
  let gridRows = 5;
  let gridColumns = 10;

  if (seatLayoutData && seatLayoutData.isActive) {
    gridRows = seatLayoutData.gridRows || gridRows;
    gridColumns = seatLayoutData.gridColumns || gridColumns;
  }

  const seats: Seat[] = [];

  // Generate row labels (A, B, C, etc.)
  const rows = Array.from({ length: gridRows }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  // Helper function to normalize row (convert numeric to letter or vice versa)
  const normalizeRow = (row: string | number, gridRows: number): string => {
    const rowStr = row.toString().toUpperCase();
    // If row is a number (1, 2, 3), convert to letter (A, B, C)
    if (/^\d+$/.test(rowStr)) {
      const rowNum = parseInt(rowStr, 10);
      if (rowNum >= 1 && rowNum <= gridRows) {
        return String.fromCharCode(64 + rowNum); // 65 = 'A', 66 = 'B', etc.
      }
    }
    // If row is a letter, return uppercase
    return rowStr;
  };

  // Helper function to normalize seat type (convert uppercase to lowercase)
  const normalizeSeatType = (
    type: string | undefined
  ): "normal" | "podium" | "column" | "instructor" | "exclusive" => {
    if (!type) return "normal";
    const typeLower = type.toLowerCase();
    if (
      typeLower === "instructor" ||
      typeLower === "podium" ||
      typeLower === "column" ||
      typeLower === "exclusive"
    ) {
      return typeLower as
        | "normal"
        | "podium"
        | "column"
        | "instructor"
        | "exclusive";
    }
    return "normal";
  };

  // Helper function to normalize seat status to valid literal types
  const normalizeSeatStatus = (
    status: string | undefined
  ): "available" | "occupied" | "selected" | "unavailable" => {
    if (!status) return "available";
    const statusLower = status.toLowerCase();
    if (statusLower === "active" || statusLower === "available") {
      return "available";
    }
    if (statusLower === "inactive" || statusLower === "occupied") {
      return "occupied";
    }
    if (statusLower === "selected") {
      return "selected";
    }
    if (statusLower === "unavailable") {
      return "unavailable";
    }
    return "available";
  };

  // Create a map of seats from API by position
  const seatMapByPosition = new Map<string, any>();
  if (seatLayoutData?.seats && Array.isArray(seatLayoutData.seats)) {
    seatLayoutData.seats.forEach((seatData) => {
      const originalRow = (seatData.row || "").toString();
      const normalizedRow = normalizeRow(originalRow, gridRows);
      const column = seatData.column || seatData.number || 0;
      const key = `${normalizedRow}-${column}`;
      seatMapByPosition.set(key, seatData);
    });
  }

  // Generate full grid and mark empty positions as unavailable
  rows.forEach((row) => {
    for (let col = 1; col <= gridColumns; col++) {
      const key = `${row}-${col}`;
      const seatData = seatMapByPosition.get(key);

      if (seatData) {
        // Use seat data from API
        const seatNumber = seatData.seatNumber || seatData.number || col;
        const originalRow = (seatData.row || "").toString();
        const normalizedRow = normalizeRow(originalRow, gridRows);

        seats.push({
          id: seatData.id || `${normalizedRow}${seatNumber}`,
          row: normalizedRow,
          number:
            typeof seatNumber === "string"
              ? parseInt(seatNumber, 10) || col
              : seatNumber,
          column: col,
          status: normalizeSeatStatus(seatData.status),
          type: normalizeSeatType(seatData.type),
          label: seatData.label,
          creditCost: seatData.creditCost,
        });
      } else {
        // Mark empty positions as unavailable
        seats.push({
          id: `${row}${col}`,
          row: row,
          number: col,
          column: col,
          status: "unavailable",
          type: "normal",
        });
      }
    }
  });

  // Add any seats from API that weren't placed in the grid (outside grid bounds)
  if (seatLayoutData?.seats && Array.isArray(seatLayoutData.seats)) {
    seatLayoutData.seats.forEach((seatData) => {
      const originalRow = (seatData.row || "").toString();
      const normalizedRow = normalizeRow(originalRow, gridRows);
      const column = seatData.column || seatData.number || 0;
      const key = `${normalizedRow}-${column}`;

      // Check if this seat is already in the seats array
      const existingSeat = seats.find(
        (s) =>
          s.id ===
            (seatData.id ||
              `${normalizedRow}${seatData.seatNumber || seatData.number}`) ||
          (s.row === normalizedRow && (s.column || s.number) === column)
      );

      if (!existingSeat) {
        // Add seat that wasn't placed in the grid (might be outside grid bounds)
        const seatNumber = seatData.seatNumber || seatData.number || column;
        const seatId = seatData.id || `${normalizedRow}${seatNumber}`;
        seats.push({
          id: seatId,
          row: normalizedRow,
          number:
            typeof seatNumber === "string"
              ? parseInt(seatNumber, 10) || column
              : seatNumber,
          column: column,
          status: normalizeSeatStatus(seatData.status),
          type: normalizeSeatType(seatData.type),
          label: seatData.label,
          creditCost: seatData.creditCost,
        });
      }
    });
  }

  return seats;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user, session: authSession } = useAuth();
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">(
    "login"
  );
  const [seatLayoutData, setSeatLayoutData] = useState<SeatLayout | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const sessionId = params?.sessionId as string;

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Debug: Log session ID
  useEffect(() => {
    if (sessionId) {
      console.log("Session ID from URL:", sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    // Reset state when sessionId changes
    setSessionData(null);
    setSeats([]);
    setSelectedSeats([]);
    setSeatLayoutData(null);
    setLoading(true);

    async function fetchSession() {
      try {
        // Fetch session data - public access, no auth required
        // Use the specific session endpoint to ensure we get the correct session
        const response = await fetch(`/api/sessions/${sessionId}`);

        if (!response.ok) {
          // Handle error responses
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = {
              error: response.statusText || "Failed to fetch session",
            };
          }
          console.error("Failed to fetch session:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data && !data.error) {
          // Transform backend session format to frontend format
          // The endpoint /api/sessions/[id] returns a single session object, not an array
          const rawSession = Array.isArray(data) ? data[0] : data;

          // CRITICAL: Validate that the returned session matches the requested sessionId
          const returnedSessionId = rawSession.id || rawSession._id;
          if (!returnedSessionId) {
            console.error(
              `CRITICAL: Session response missing ID! URL sessionId: ${sessionId}, Response:`,
              rawSession
            );
            setLoading(false);
            return;
          }

          if (returnedSessionId !== sessionId) {
            console.error(
              `CRITICAL: Session ID mismatch! URL sessionId: ${sessionId}, API returned sessionId: ${returnedSessionId}`
            );
            // Don't proceed with wrong session data
            setLoading(false);
            return;
          }

          console.log(
            `Session ID validation: URL=${sessionId}, API=${returnedSessionId}, Match=${
              returnedSessionId === sessionId
            }`
          );

          const transformedSession: Session = {
            id: rawSession.id || rawSession._id || "",
            title:
              rawSession.title ||
              rawSession.name ||
              rawSession.class?.name ||
              "",
            titleTr:
              rawSession.titleTr ||
              rawSession.class?.nameTr ||
              rawSession.class?.titleTr,
            instructor:
              rawSession.instructor ||
              rawSession.instructorId ||
              rawSession.class?.instructor ||
              "",
            time:
              rawSession.time ||
              rawSession.startTime ||
              rawSession.class?.time ||
              "",
            date:
              rawSession.date ||
              rawSession.startDate ||
              rawSession.class?.date ||
              "",
            duration:
              typeof rawSession.duration === "string"
                ? parseInt(rawSession.duration)
                : rawSession.duration || rawSession.class?.duration || 45,
            location:
              typeof rawSession.location === "string"
                ? rawSession.location
                : (rawSession.location as LocationObject) ||
                  rawSession.class?.location ||
                  "",
            studio:
              typeof rawSession.studio === "string"
                ? rawSession.studio
                : rawSession.studio?.name || rawSession.class?.studio || "",
            musicGenre: rawSession.musicGenre || rawSession.class?.musicGenre,
            musicGenreTr:
              rawSession.musicGenreTr || rawSession.class?.musicGenreTr,
            workoutType:
              rawSession.workoutType || rawSession.class?.workoutType,
            maxCapacity: rawSession.maxCapacity,
            currentBookings:
              rawSession.currentBookings || rawSession._count?.bookings || 0,
          };

          setSessionData(transformedSession);

          // Get locationId from the session to fetch seat layout
          let locationId: string | null = null;

          // Check various possible locations for locationId
          if (rawSession.locationId) {
            locationId = rawSession.locationId;
          } else if (
            typeof rawSession.location === "object" &&
            rawSession.location !== null
          ) {
            locationId =
              (rawSession.location as LocationObject).id ||
              (rawSession.location as LocationObject).locationId ||
              null;
          } else if (rawSession.class?.locationId) {
            locationId = rawSession.class.locationId;
          } else if (
            rawSession.class?.location &&
            typeof rawSession.class.location === "object"
          ) {
            locationId =
              (rawSession.class.location as LocationObject).id ||
              (rawSession.class.location as LocationObject).locationId ||
              null;
          }

          // Fetch seat layout if locationId is available
          if (locationId) {
            try {
              const seatLayoutResponse = await fetch(
                `/api/seat-layouts?locationId=${locationId}`
              );
              if (seatLayoutResponse.ok) {
                let seatLayout = await seatLayoutResponse.json();
                if (seatLayout && seatLayout.isActive) {
                  // If seats are not included, try to fetch them separately
                  if (
                    !seatLayout.seats ||
                    !Array.isArray(seatLayout.seats) ||
                    seatLayout.seats.length === 0
                  ) {
                    try {
                      const seatsResponse = await fetch(
                        `/api/seat-layouts?seatLayoutId=${seatLayout.id}&includeSeats=true`
                      );
                      if (seatsResponse.ok) {
                        const seatsData = await seatsResponse.json();
                        if (seatsData.seats && Array.isArray(seatsData.seats)) {
                          seatLayout.seats = seatsData.seats;
                        }
                      }
                    } catch (seatsError) {
                      console.error(
                        "Error fetching seats separately:",
                        seatsError
                      );
                    }
                  }

                  // Log seat data for debugging
                  if (seatLayout.seats && Array.isArray(seatLayout.seats)) {
                    console.log(
                      "Seat layout seats from API:",
                      seatLayout.seats
                    );
                    console.log(
                      "Seat types found:",
                      seatLayout.seats.map((s: any) => ({
                        id: s.id,
                        row: s.row,
                        column: s.column,
                        type: s.type,
                        label: s.label,
                      }))
                    );
                  } else {
                    console.log(
                      "No seats found in seat layout, will generate grid"
                    );
                  }

                  setSeatLayoutData(seatLayout);
                  let generatedSeats = generateSeatLayoutFromData(seatLayout);

                  // Log generated seats for debugging
                  console.log("Generated seats count:", generatedSeats.length);
                  console.log(
                    "Seat types in generated seats:",
                    generatedSeats
                      .filter((s) => s.type && s.type !== "normal")
                      .map((s) => ({
                        id: s.id,
                        row: s.row,
                        column: s.column,
                        type: s.type,
                        label: s.label,
                      }))
                  );

                  // Fetch bookings for this session to get occupied seats
                  try {
                    // Always use sessionId from URL params, not from API response
                    // The URL is the source of truth for which session we're viewing
                    const currentSessionId = sessionId;
                    console.log(
                      `Fetching bookings for URL sessionId: ${currentSessionId}, API session id: ${rawSession.id}`
                    );
                    const bookingsResponse = await fetch(
                      `/api/bookings?sessionId=${currentSessionId}`
                    );
                    if (bookingsResponse.ok) {
                      const bookingsData = await bookingsResponse.json();
                      const bookings = Array.isArray(bookingsData)
                        ? bookingsData
                        : bookingsData.bookings || [];

                      console.log(
                        `Fetched ${bookings.length} bookings for session ${currentSessionId}`
                      );

                      if (bookings.length > 0) {
                        const bookedSeatIds = new Set<string>();
                        let skippedCount = 0;

                        bookings.forEach((booking: any) => {
                          // IMPORTANT: Only process bookings for the current session
                          if (
                            booking.sessionId &&
                            booking.sessionId !== currentSessionId
                          ) {
                            skippedCount++;
                            console.warn(
                              `Skipping booking ${booking.id} - sessionId mismatch: ${booking.sessionId} !== ${currentSessionId}`
                            );
                            return; // Skip bookings for other sessions
                          }

                          // Log booking details for debugging
                          if (!booking.sessionId) {
                            console.warn(
                              `Booking ${booking.id} missing sessionId field`,
                              booking
                            );
                          }

                          // Check various possible seat ID formats
                          if (booking.seatId) {
                            bookedSeatIds.add(booking.seatId);
                          }
                          if (booking.seat && booking.seat.id) {
                            bookedSeatIds.add(booking.seat.id);
                          }
                          if (booking.seats && Array.isArray(booking.seats)) {
                            booking.seats.forEach((seat: any) => {
                              if (typeof seat === "string") {
                                bookedSeatIds.add(seat);
                              } else if (seat.id) {
                                bookedSeatIds.add(seat.id);
                              } else if (seat.seatId) {
                                bookedSeatIds.add(seat.seatId);
                              }
                            });
                          }
                          // Also check by row and column if available
                          if (booking.row && booking.column) {
                            const seatKey = `${booking.row}-${booking.column}`;
                            // Find seat by row and column
                            generatedSeats.forEach((seat) => {
                              if (
                                seat.row === booking.row &&
                                (seat.column || seat.number) === booking.column
                              ) {
                                bookedSeatIds.add(seat.id);
                              }
                            });
                          }
                        });

                        if (skippedCount > 0) {
                          console.warn(
                            `Skipped ${skippedCount} bookings from other sessions`
                          );
                        }

                        console.log(
                          `Marking ${bookedSeatIds.size} seats as occupied for session ${currentSessionId}`
                        );

                        // Mark booked seats as occupied
                        generatedSeats = generatedSeats.map((seat) => {
                          if (bookedSeatIds.has(seat.id)) {
                            return { ...seat, status: "occupied" };
                          }
                          return seat;
                        });
                      }
                    }
                  } catch (bookingsError) {
                    console.error("Error fetching bookings:", bookingsError);
                    // Fallback to session bookings if available
                    // Always use sessionId from URL params, not from API response
                    const currentSessionId = sessionId;

                    if (
                      rawSession.bookings &&
                      Array.isArray(rawSession.bookings)
                    ) {
                      const bookedSeatIds = new Set<string>();
                      rawSession.bookings.forEach((booking: any) => {
                        // IMPORTANT: Only process bookings for the current session
                        if (
                          booking.sessionId &&
                          booking.sessionId !== currentSessionId
                        ) {
                          return; // Skip bookings for other sessions
                        }

                        if (booking.seatId) {
                          bookedSeatIds.add(booking.seatId);
                        }
                        if (booking.seats && Array.isArray(booking.seats)) {
                          booking.seats.forEach((seatId: string) => {
                            bookedSeatIds.add(seatId);
                          });
                        }
                      });

                      generatedSeats = generatedSeats.map((seat) => {
                        if (bookedSeatIds.has(seat.id)) {
                          return { ...seat, status: "occupied" };
                        }
                        return seat;
                      });
                    } else if (
                      rawSession.bookedSeats &&
                      Array.isArray(rawSession.bookedSeats)
                    ) {
                      // Note: bookedSeats array doesn't have sessionId info,
                      // but this is a fallback only and should be used with caution
                      const bookedSeatIds = new Set(rawSession.bookedSeats);
                      generatedSeats = generatedSeats.map((seat) => {
                        if (bookedSeatIds.has(seat.id)) {
                          return { ...seat, status: "occupied" };
                        }
                        return seat;
                      });
                    }
                  }

                  setSeats(generatedSeats);
                } else {
                  // Use default layout if no active seat layout found
                  setSeatLayoutData(null);
                  const defaultSeats = generateSeatLayoutFromData(null);
                  setSeats(defaultSeats);
                }
              } else {
                // Use default layout if fetch fails
                setSeatLayoutData(null);
                const defaultSeats = generateSeatLayoutFromData(null);
                setSeats(defaultSeats);
              }
            } catch (error) {
              console.error("Error fetching seat layout:", error);
              // Use default layout on error
              const defaultSeats = generateSeatLayoutFromData(null);
              setSeats(defaultSeats);
            }
          } else {
            // Use default layout if no locationId
            const defaultSeats = generateSeatLayoutFromData(null);
            setSeats(defaultSeats);
          }

          // Restore selected seat from sessionStorage if user was redirected from login
          // Only restore the first seat (one seat per member)
          if (typeof window !== "undefined") {
            const storedSeats = sessionStorage.getItem("selectedSeats");
            const storedSessionId = sessionStorage.getItem("sessionId");
            if (storedSeats && storedSessionId === sessionId) {
              try {
                const parsedSeats = JSON.parse(storedSeats);
                if (Array.isArray(parsedSeats) && parsedSeats.length > 0) {
                  // Only take the first seat (one seat per member)
                  const firstSeat = parsedSeats[0];
                  setSelectedSeats([firstSeat]);
                  // Update seat status to selected
                  setSeats((prev) =>
                    prev.map((seat) => {
                      if (seat.id === firstSeat) {
                        return { ...seat, status: "selected" };
                      } else if (seat.status === "selected") {
                        // Deselect any other selected seats
                        return { ...seat, status: "available" };
                      }
                      return seat;
                    })
                  );
                }
              } catch (e) {
                console.error("Error parsing stored seats:", e);
              }
            }
          }
        } else {
          console.error("Failed to fetch session:", data);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  function formatTime(timeString: string): string {
    if (!timeString) return "";
    try {
      // Handle ISO date strings that include time
      if (timeString.includes("T")) {
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString(
            language === "tr" ? "tr-TR" : "en-US",
            {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }
          );
        }
      }
      // Handle time-only strings
      const time = new Date(`2000-01-01T${timeString}`);
      if (isNaN(time.getTime())) {
        return timeString;
      }
      return time.toLocaleTimeString(language === "tr" ? "tr-TR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeString;
    }
  }

  function formatDate(dateString: string): string {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }

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

      const dayNum = date.getDate();
      const monthName = t(
        `classes.months.long.${monthKeys[date.getMonth()]}`
      );
      const dayName = t(`classes.days.${dayKeys[date.getDay()]}`);
      const year = date.getFullYear();

      if (language === "tr") {
        // Turkish format: "25 Aralık 2026 Cumartesi"
        return `${dayNum} ${monthName} ${year} ${dayName}`;
      } else {
        // English format: "Saturday, December 25, 2026"
        return `${dayName}, ${monthName} ${dayNum}, ${year}`;
      }
    } catch {
      return dateString;
    }
  }

  function formatDateTime(dateString: string, timeString: string): string {
    if (!dateString && !timeString) return "";

    // If dateString is an ISO string with time, extract both
    if (dateString && dateString.includes("T")) {
      try {
        const dateTime = new Date(dateString);
        if (!isNaN(dateTime.getTime())) {
          const date = formatDate(dateString);
          const time = dateTime.toLocaleTimeString(
            language === "tr" ? "tr-TR" : "en-US",
            {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }
          );
          return `${date} - ${time}`;
        }
      } catch (e) {
        // Fall through to separate formatting
      }
    }

    // Format separately
    const date = formatDate(dateString);
    const time = formatTime(timeString || dateString);

    if (date && time && date !== time) {
      return `${date} - ${time}`;
    }
    return date || time || "";
  }

  function handleSeatClick(seatId: string) {
    // Only allow seat selection for authenticated users
    if (!user) {
      // Open auth modal instead of redirecting
      setIsAuthModalOpen(true);
      return;
    }

    setSeats((prev): Seat[] => {
      const clickedSeat = prev.find((seat) => seat.id === seatId);

      // Only allow selection of normal and exclusive seats
      if (clickedSeat?.type !== "normal" && clickedSeat?.type !== "exclusive") {
        return prev; // Don't allow selection of instructor, podium, or column seats
      }

      // If clicking on an already selected seat, deselect it
      if (clickedSeat?.status === "selected") {
        setSelectedSeats([]);
        return prev.map((seat): Seat => {
          if (seat.id === seatId) {
            return { ...seat, status: "available" as "available" };
          }
          return seat;
        });
      }

      // If clicking on an available seat
      if (clickedSeat?.status === "available") {
        // Deselect any previously selected seat (only one seat allowed)
        const updatedSeats: Seat[] = prev.map((seat): Seat => {
          if (seat.id === seatId) {
            // Select the clicked seat
            return { ...seat, status: "selected" as "selected" };
          } else if (seat.status === "selected") {
            // Deselect any previously selected seat
            return { ...seat, status: "available" as "available" };
          }
          return seat;
        });

        // Update selected seats array to only contain the new selection
        setSelectedSeats([seatId]);
        return updatedSeats;
      }

      return prev;
    });
  }

  async function handleBooking() {
    // Check if user is logged in
    if (!user) {
      // Store selected seats in sessionStorage and open auth modal
      if (selectedSeats.length > 0 && typeof window !== "undefined") {
        sessionStorage.setItem("selectedSeats", JSON.stringify(selectedSeats));
        sessionStorage.setItem("sessionId", sessionId);
      }
      setIsAuthModalOpen(true);
      return;
    }

    if (!sessionData || selectedSeats.length === 0) return;

    setBooking(true);
    try {
      // Get member ID
      const membersResponse = await fetch("/api/members", {
        headers: {
          Authorization: `Bearer ${authSession?.access_token}`,
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
        setToast({
          message: t("classes.booking.noMember") || "Member account not found.",
          type: "error",
        });
        setBooking(false);
        return;
      }

      // Check if user already has an active booking for this session
      const existingBookingsResponse = await fetch(
        `/api/bookings?sessionId=${sessionData.id}`,
        {
          headers: {
            Authorization: `Bearer ${authSession?.access_token}`,
          },
        }
      );

      if (existingBookingsResponse.ok) {
        const existingBookings = await existingBookingsResponse.json();
        const activeBooking = Array.isArray(existingBookings)
          ? existingBookings.find(
              (b: any) => b.memberId === memberId && b.status !== "CANCELLED"
            )
          : null;

        if (activeBooking) {
          setToast({
            message:
              t("classes.booking.alreadyBooked") ||
              "You already have a booking for this session. Only one booking per session is allowed.",
            type: "error",
          });
          setBooking(false);
          return;
        }
      }

      // Verify the selected seat is still available before booking
      const selectedSeat = seats.find((s) => s.id === selectedSeats[0]);
      if (!selectedSeat) {
        alert(t("classes.booking.error") || "Selected seat not found.");
        setBooking(false);
        return;
      }

      if (
        selectedSeat.status !== "available" &&
        selectedSeat.status !== "selected"
      ) {
        alert(
          t("classes.seatLayout.taken") || "This seat is no longer available."
        );
        // Clear selection
        setSelectedSeats([]);
        setSeats((prev) =>
          prev.map((seat) =>
            seat.id === selectedSeats[0] && seat.status === "selected"
              ? { ...seat, status: "available" }
              : seat
          )
        );
        setBooking(false);
        return;
      }

      // Create booking
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession?.access_token}`,
        },
        body: JSON.stringify({
          sessionId: sessionData.id,
          memberId: memberId,
          paymentType: "CREDITS", // Default, can be made selectable
          seatId: selectedSeats[0], // Send single seat ID
          seats: selectedSeats.length > 0 ? [selectedSeats[0]] : [],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear stored seats
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("selectedSeats");
          sessionStorage.removeItem("sessionId");
        }

        // Show success toast
        setToast({
          message: t("classes.booking.success") || "Booking successful!",
          type: "success",
        });

        // Refresh session data to show updated seat status
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // Better error handling
        const errorMessage =
          data.error ||
          data.message ||
          t("classes.booking.error") ||
          "Booking failed.";
        console.error("Booking error:", data);

        // Show error toast
        setToast({
          message: errorMessage,
          type: "error",
        });

        // If seat is already booked, refresh the seat status
        if (
          errorMessage.toLowerCase().includes("already booked") ||
          errorMessage.toLowerCase().includes("taken")
        ) {
          // Refresh session data to get updated seat statuses
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error booking session:", error);
      alert(
        t("classes.booking.error") || "An error occurred. Please try again."
      );
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t("classes.session.notFound") || "Session not found"}
            </h1>
            <button
              onClick={() => router.push("/classes")}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              {t("classes.backToClasses") || "Back to Classes"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Group seats by row
  const seatsByRow: Record<string, Seat[]> = {};
  seats.forEach((seat) => {
    if (!seatsByRow[seat.row]) {
      seatsByRow[seat.row] = [];
    }
    seatsByRow[seat.row].push(seat);
  });

  const instructorName = getInstructorName(
    sessionData.instructor,
    t("classes.session.unknownInstructor") || "Unknown Instructor"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-0">
      <div className="bg-white dark:bg-gray-900 w-full h-full shadow-xl flex overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={() => {
            router.push("/classes#quick-date-selection");
          }}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Left Column - Instructor Portrait */}
        <div className="hidden lg:block w-1/3 bg-gray-900 dark:bg-black relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Instructor Image Placeholder - You can replace this with actual instructor image */}
            <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-gray-700 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {instructorName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
                  {toUpperCaseLocale(instructorName, language)}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Session Details and Seat Selection */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl px-4 py-8 lg:max-w-full lg:px-6 lg:py-24 h-full flex flex-col lg:flex-col">
            {/* Top Half - Session Details (Desktop) / Full (Mobile) */}
            <div className="flex-shrink-0 lg:h-1/2 lg:overflow-y-auto">
              {/* Session Title */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-10">
                {normalizeTitle(
                  language === "tr" && sessionData.titleTr
                    ? sessionData.titleTr
                    : sessionData.title,
                  language
                )}
              </h1>

              {/* Instructor Name (visible on mobile) */}
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6 lg:hidden">
                {toUpperCaseLocale(instructorName, language)}
              </p>

              {/* Session Details */}
              <div className="mb-8 space-y-3 text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <span className="font-medium">
                    {t("classes.session.workoutType") || "Workout Type"}:
                  </span>
                  <span>
                    {sessionData.workoutType ||
                      t("classes.session.cycling") ||
                      "Cycling"}
                  </span>
                </div>
                {instructorName && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="font-medium">
                      {t("classes.session.instructor") || "Instructor"}:
                    </span>
                    <span>{toUpperCaseLocale(instructorName, language)}</span>
                  </div>
                )}
                {sessionData.musicGenre && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                      />
                    </svg>
                    <span className="font-medium">
                      {t("classes.session.musicGenre") || "Music Genre"}:
                    </span>
                    <span>
                      {language === "tr" && sessionData.musicGenreTr
                        ? toUpperCaseLocale(sessionData.musicGenreTr, language)
                        : toUpperCaseLocale(sessionData.musicGenre, language)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="font-medium">
                    {t("classes.session.location") || "Location"}:
                  </span>
                  <span>
                    {typeof sessionData.location === "string"
                      ? sessionData.location
                      : sessionData.location?.name ||
                        sessionData.location?.address ||
                        sessionData.studio ||
                        ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium">
                    {formatDateTime(sessionData.date, sessionData.time)} -{" "}
                    {sessionData.duration}{" "}
                    {t("classes.session.minutes") || "minutes"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="font-medium">
                    {(() => {
                      // Use maxCapacity and currentBookings from session if available
                      if (sessionData.maxCapacity !== undefined) {
                        const available =
                          (sessionData.maxCapacity || 0) -
                          (sessionData.currentBookings || 0);
                        return `${available}`;
                      }

                      // Fallback to seat layout capacity
                      if (seatLayoutData?.capacity) {
                        const occupiedCount = seats.filter(
                          (s) => s.status === "occupied"
                        ).length;
                        return `${seatLayoutData.capacity - occupiedCount}`;
                      }

                      // Last resort: calculate from available seats (exclusive seats are bookable)
                      const availableSeats = seats.filter(
                        (s) =>
                          s.status === "available" &&
                          s.type !== "instructor" &&
                          s.type !== "podium" &&
                          s.type !== "column"
                      ).length;
                      return `${availableSeats}`;
                    })()}{" "}
                    {t("classes.session.spacesLeft") || "spaces left"}
                  </span>
                </div>
              </div>

              {/* Login Box - Display below spaces left for guest users */}
              {!user && (
                <div className="flex justify-center mt-4 mb-4">
                  <div className="bg-gray-700 dark:bg-gray-800 p-8 rounded-lg max-w-md w-full">
                    <p className="text-lg font-medium text-white mb-6">
                      {t("classes.booking.loginRequired") ||
                        "Login to see event details"}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setAuthModalMode("login");
                          setIsAuthModalOpen(true);
                        }}
                        className="flex-1 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors uppercase"
                      >
                        {t("auth.login.title") || "LOGIN"}
                      </button>
                      <button
                        onClick={() => {
                          setAuthModalMode("register");
                          setIsAuthModalOpen(true);
                        }}
                        className="flex-1 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors uppercase"
                      >
                        {t("auth.register.title") || "REGISTER"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Half - Seat Layout (Desktop) / Below Details (Mobile) */}
            <div className="flex-1 lg:h-1/2 lg:overflow-y-auto lg:mt-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg lg:px-6 flex flex-col">
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-800 dark:bg-gray-700 rounded-lg px-4 py-3 flex items-center gap-2 w-auto">
                    <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                      <span className="text-xs lg:text-sm font-semibold text-gray-800">
                        i
                      </span>
                    </div>
                    <p className="text-sm lg:text-base text-white lowercase whitespace-nowrap">
                      {t("classes.seatLayout.clickToBook") ||
                        "Click a slot to book into the event"}
                    </p>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-between lg:justify-between gap-4 lg:gap-6 mb-6 text-sm lg:text-base">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 lg:w-5 lg:h-5 bg-gray-700 dark:bg-gray-700 rounded-full border-2 border-transparent"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {t("classes.seatLayout.available") || "Available"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 lg:w-5 lg:h-5 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {t("classes.seatLayout.yourBooking") || "Your booking(s)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 lg:w-5 lg:h-5 bg-red-500 dark:bg-red-600 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {t("classes.seatLayout.taken") || "Taken"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 lg:w-5 lg:h-5 bg-gray-600 dark:bg-gray-800 rounded flex items-center justify-center">
                      <span className="text-xs lg:text-sm text-white font-bold">
                        P
                      </span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {t("classes.seatLayout.podium") || "Podium"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 lg:w-5 lg:h-5 bg-gray-600 dark:bg-gray-800 rounded flex items-center justify-center">
                      <span className="text-xs lg:text-sm text-white font-bold">
                        {t("classes.seatLayout.columnLabel") || "C"}
                      </span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {t("classes.seatLayout.column") || "Column"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 lg:w-5 lg:h-5 bg-gray-800 dark:bg-black rounded flex items-center justify-center">
                      <span className="text-xs lg:text-sm text-white font-bold">
                        {t("classes.seatLayout.instructorLabel") || "I"}
                      </span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {t("classes.seatLayout.instructor") || "Instructor"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 lg:w-5 lg:h-5 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {t("classes.seatLayout.exclusive") || "Exclusive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 lg:w-5 lg:h-5 bg-gray-400 dark:bg-gray-500 rounded-full opacity-40 border-2 border-gray-500 dark:border-gray-400"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {t("classes.seatLayout.unavailable") || "Unavailable"}
                    </span>
                  </div>
                </div>

                {/* Seats Grid */}
                <div className="space-y-3 mb-6 flex flex-col items-center">
                  {Object.keys(seatsByRow).length > 0 ? (
                    Object.keys(seatsByRow)
                      .sort()
                      .map((row) => (
                        <div key={row} className="flex items-center gap-3">
                          <div className="flex gap-2 flex-wrap justify-center">
                            {seatsByRow[row]
                              .sort(
                                (a, b) =>
                                  (a.column || a.number) -
                                  (b.column || b.number)
                              )
                              .map((seat) => (
                                <button
                                  key={seat.id}
                                  onClick={() => handleSeatClick(seat.id)}
                                  disabled={
                                    seat.status === "occupied" ||
                                    seat.status === "unavailable" ||
                                    seat.type === "instructor" ||
                                    seat.type === "podium" ||
                                    seat.type === "column" ||
                                    (seat.type !== "normal" &&
                                      seat.type !== "exclusive")
                                  }
                                  className={`min-w-10 min-h-10 lg:min-w-12 lg:min-h-12 w-auto h-auto px-2 py-2 lg:px-3 lg:py-3 transition-all flex items-center justify-center ${
                                    seat.type === "podium" ||
                                    seat.type === "column"
                                      ? "bg-gray-600 dark:bg-gray-800 rounded cursor-not-allowed opacity-60"
                                      : seat.type === "instructor"
                                      ? "bg-gray-800 dark:bg-black rounded cursor-not-allowed opacity-60"
                                      : seat.type === "exclusive"
                                      ? seat.status === "available"
                                        ? user
                                          ? "bg-purple-500 hover:bg-purple-600 cursor-pointer border-2 border-transparent hover:border-purple-600 rounded-full"
                                          : "bg-purple-500 hover:bg-purple-600 cursor-pointer border-2 border-transparent hover:border-purple-600 opacity-75 rounded-full"
                                        : seat.status === "selected"
                                        ? "bg-orange-500 hover:bg-orange-600 cursor-pointer border-2 border-orange-600 rounded-full"
                                        : seat.status === "occupied"
                                        ? "bg-red-500 dark:bg-red-600 cursor-not-allowed opacity-50 rounded-full"
                                        : "bg-gray-500 dark:bg-gray-700 cursor-not-allowed opacity-50 rounded-full"
                                      : seat.status === "unavailable"
                                      ? "bg-gray-400 dark:bg-gray-500 rounded-full cursor-not-allowed opacity-40 border-2 border-gray-500 dark:border-gray-400"
                                      : seat.status === "available"
                                      ? user
                                        ? "bg-gray-700 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 cursor-pointer border-2 border-transparent hover:border-gray-500 rounded-full"
                                        : "bg-gray-700 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 cursor-pointer border-2 border-transparent hover:border-gray-500 opacity-75 rounded-full"
                                      : seat.status === "selected"
                                      ? "bg-orange-500 hover:bg-orange-600 cursor-pointer border-2 border-orange-600 rounded-full"
                                      : seat.status === "occupied"
                                      ? "bg-red-500 dark:bg-red-600 cursor-not-allowed opacity-50 rounded-full"
                                      : "bg-gray-500 dark:bg-gray-700 cursor-not-allowed opacity-50 rounded-full"
                                  }`}
                                  title={
                                    seat.status === "occupied"
                                      ? t("classes.seatLayout.taken") || "Taken"
                                      : seat.status === "unavailable"
                                      ? t("classes.seatLayout.unavailable") ||
                                        "Unavailable"
                                      : seat.status === "selected"
                                      ? t("classes.seatLayout.selected") ||
                                        "Selected"
                                      : seat.type === "instructor"
                                      ? t("classes.seatLayout.instructor") ||
                                        "Instructor"
                                      : seat.type === "podium"
                                      ? t("classes.seatLayout.podium") ||
                                        "Podium"
                                      : seat.type === "column"
                                      ? t("classes.seatLayout.column") ||
                                        "Column"
                                      : seat.type === "exclusive"
                                      ? `${
                                          t("classes.seatLayout.exclusive") ||
                                          "Exclusive"
                                        }${
                                          seat.creditCost
                                            ? ` - ${seat.creditCost} ${
                                                t("classes.session.credits") ||
                                                "Credits"
                                              }`
                                            : ""
                                        }`
                                      : seat.status === "available"
                                      ? user
                                        ? t("classes.seatLayout.available") ||
                                          "Available - Click to select"
                                        : t("classes.booking.loginRequired") ||
                                          "Please log in to select seats"
                                      : seat.id
                                  }
                                >
                                  {seat.type === "podium" ||
                                  seat.type === "column" ||
                                  seat.type === "instructor" ? (
                                    <span className="text-xs lg:text-sm text-white font-bold">
                                      {seat.label ||
                                        (seat.type === "podium"
                                          ? t("classes.seatLayout.podiumLabel") || "P"
                                          : seat.type === "column"
                                          ? t("classes.seatLayout.columnLabel") || "C"
                                          : seat.type === "instructor"
                                          ? t("classes.seatLayout.instructorLabel") || "I"
                                          : "")}
                                    </span>
                                  ) : (
                                    <span
                                      className={`text-xs lg:text-sm font-semibold ${
                                        seat.type === "exclusive" ||
                                        seat.status === "selected" ||
                                        seat.status === "occupied" ||
                                        seat.status === "available"
                                          ? "text-white"
                                          : "text-white"
                                      }`}
                                    >
                                      {seat.number}
                                    </span>
                                  )}
                                </button>
                              ))}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>
                        {t("classes.seatLayout.noSeatsAvailable") ||
                          "No seat layout available for this session."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Selected Seat Summary and Book Button Container - Fixed layout */}
                <div className="flex flex-col flex-1 min-h-[200px]">
                  {/* Selected Seat Summary */}
                  {selectedSeats.length > 0 && (
                    <div className="mb-4 overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-orange-200 dark:border-orange-800/50">
                      <div className="bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 px-6 py-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg"></div>
                              <div className="absolute -top-1 -right-1 w-6 h-6 border-2 border-white rounded-full bg-transparent"></div>
                            </div>
                            <div>
                              <p className="text-white/90 text-xs font-semibold uppercase tracking-wider mb-1">
                                {t("classes.seatLayout.selectedSeat") ||
                                  "Selected Seat"}
                              </p>
                              {(() => {
                                const selectedSeat = seats.find(
                                  (s) => s.id === selectedSeats[0]
                                );
                                const seatLabel = selectedSeat
                                  ? selectedSeat.type === "exclusive"
                                    ? `${
                                        t("classes.seatLayout.exclusive") ||
                                        "Exclusive"
                                      } ${selectedSeat.row}${
                                        selectedSeat.number ||
                                        selectedSeat.column ||
                                        ""
                                      }`
                                    : selectedSeat.label
                                    ? `${selectedSeat.row}${selectedSeat.label}`
                                    : `${selectedSeat.row}${
                                        selectedSeat.number ||
                                        selectedSeat.column ||
                                        ""
                                      }`
                                  : selectedSeats[0];
                                return (
                                  <p className="text-white text-3xl font-extrabold leading-tight">
                                    {seatLabel}
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                          {(() => {
                            const selectedSeat = seats.find(
                              (s) => s.id === selectedSeats[0]
                            );
                            const creditCost = selectedSeat?.creditCost || 1;
                            return (
                              <div className="text-right bg-white rounded-lg px-5 py-4 shadow-md border border-gray-200">
                                <p className="text-gray-800 dark:text-gray-800 text-xs font-bold uppercase tracking-wider mb-1.5">
                                  {t("classes.session.credits") || "Credits"}
                                </p>
                                <div className="flex items-baseline justify-end gap-1.5">
                                  <span className="text-gray-900 dark:text-gray-900 text-2xl font-black">
                                    {creditCost}
                                  </span>
                                  <span className="text-gray-700 dark:text-gray-700 text-sm font-semibold">
                                    {t("classes.session.required") ||
                                      "Required"}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Book Button - Always in same position at bottom */}
                  {user && (
                    <div className="flex justify-center mt-auto">
                      <button
                        onClick={handleBooking}
                        disabled={selectedSeats.length === 0 || booking}
                        className={`min-w-[200px] px-8 py-3 font-semibold rounded-lg transition-colors text-center ${
                          selectedSeats.length === 0 || booking
                            ? "bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed"
                            : "bg-orange-500 text-white hover:bg-orange-600"
                        }`}
                      >
                        {booking
                          ? t("classes.session.booking") || "Booking..."
                          : (() => {
                              const selectedSeat = seats.find(
                                (s) => s.id === selectedSeats[0]
                              );
                              const creditCost = selectedSeat?.creditCost || 1;
                              return `${
                                t("classes.session.bookNow") || "Book Now"
                              } (${creditCost} ${
                                t("classes.session.credits") || "Credits"
                              })`;
                            })()}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectAfterLogin={false}
        initialMode={authModalMode}
        onLoginSuccess={() => {
          setIsAuthModalOpen(false);
          // After login, user can proceed with booking
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-[500px] ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === "success" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

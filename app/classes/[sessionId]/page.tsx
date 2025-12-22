"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";

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
  createdAt?: string;
  updatedAt?: string;
}

interface Session {
  id: string;
  title: string;
  instructor:
    | string
    | { id?: string; name?: string; user?: { name?: string; email?: string } };
  time: string;
  date: string;
  duration: number;
  location: string | LocationObject;
  studio: string;
  musicGenre?: string;
  workoutType?: string;
}

interface Seat {
  id: string;
  row: string;
  number: number;
  status: "available" | "occupied" | "selected";
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
  const rows = Array.from({ length: gridRows }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  rows.forEach((row) => {
    for (let i = 1; i <= gridColumns; i++) {
      seats.push({
        id: `${row}${i}`,
        row: row,
        number: i,
        status: "available", // In a real app, this would come from the API
      });
    }
  });

  return seats;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { user, session: authSession } = useAuth();
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);

  const sessionId = params?.sessionId as string;

  useEffect(() => {
    if (!sessionId) return;

    async function fetchSession() {
      try {
        setLoading(true);
        // Fetch session data - public access, no auth required
        const response = await fetch(`/api/sessions?id=${sessionId}`);
        const data = await response.json();

        if (response.ok && data) {
          // Transform backend session format to frontend format
          const rawSession = Array.isArray(data) ? data[0] : data;

          const transformedSession: Session = {
            id: rawSession.id || rawSession._id || "",
            title:
              rawSession.title ||
              rawSession.name ||
              rawSession.class?.name ||
              "",
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
            workoutType:
              rawSession.workoutType || rawSession.class?.workoutType,
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
                const seatLayout = await seatLayoutResponse.json();
                if (seatLayout && seatLayout.isActive) {
                  const generatedSeats = generateSeatLayoutFromData(seatLayout);
                  setSeats(generatedSeats);
                } else {
                  // Use default layout if no active seat layout found
                  const defaultSeats = generateSeatLayoutFromData(null);
                  setSeats(defaultSeats);
                }
              } else {
                // Use default layout if fetch fails
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

          // Restore selected seats from sessionStorage if user was redirected from login
          const storedSeats = sessionStorage.getItem("selectedSeats");
          const storedSessionId = sessionStorage.getItem("sessionId");
          if (storedSeats && storedSessionId === sessionId) {
            try {
              const parsedSeats = JSON.parse(storedSeats);
              if (Array.isArray(parsedSeats) && parsedSeats.length > 0) {
                setSelectedSeats(parsedSeats);
                // Update seat status to selected
                setSeats((prev) =>
                  prev.map((seat) => {
                    if (parsedSeats.includes(seat.id)) {
                      return { ...seat, status: "selected" };
                    }
                    return seat;
                  })
                );
              }
            } catch (e) {
              console.error("Error parsing stored seats:", e);
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
      const time = new Date(`2000-01-01T${timeString}`);
      if (isNaN(time.getTime())) {
        return timeString;
      }
      return time.toLocaleTimeString("en-US", {
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
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  function handleSeatClick(seatId: string) {
    // Allow seat selection for all users, but show login prompt when booking
    setSeats((prev) =>
      prev.map((seat) => {
        if (seat.id === seatId) {
          if (seat.status === "selected") {
            setSelectedSeats((prevSelected) =>
              prevSelected.filter((id) => id !== seatId)
            );
            return { ...seat, status: "available" };
          } else if (seat.status === "available") {
            setSelectedSeats((prevSelected) => [...prevSelected, seatId]);
            return { ...seat, status: "selected" };
          }
        }
        return seat;
      })
    );
  }

  async function handleBooking() {
    // Check if user is logged in
    if (!user) {
      // Store selected seats in sessionStorage and redirect to login
      if (selectedSeats.length > 0) {
        sessionStorage.setItem("selectedSeats", JSON.stringify(selectedSeats));
        sessionStorage.setItem("sessionId", sessionId);
      }
      router.push("/?auth=login");
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
        alert(t("classes.booking.noMember") || "Member account not found.");
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
          seats: selectedSeats,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear stored seats
        sessionStorage.removeItem("selectedSeats");
        sessionStorage.removeItem("sessionId");
        alert(t("classes.booking.success") || "Booking successful!");
        router.push("/classes");
      } else {
        alert(data.error || t("classes.booking.error") || "Booking failed.");
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
      <div className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push("/classes")}
          className="mb-6 text-orange-500 hover:text-orange-600 font-medium flex items-center gap-2"
        >
          ← {t("classes.backToClasses") || "Back to Classes"}
        </button>

        {/* Session Info */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {sessionData.title}
          </h1>
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-semibold">
                {t("classes.session.with") || "With"}:
              </span>{" "}
              {getInstructorName(
                sessionData.instructor,
                t("classes.session.unknownInstructor") || "Unknown Instructor"
              )}
            </p>
            <p>
              <span className="font-semibold">
                {t("classes.session.date") || "Date"}:
              </span>{" "}
              {formatDate(sessionData.date)}
            </p>
            <p>
              <span className="font-semibold">
                {t("classes.session.time") || "Time"}:
              </span>{" "}
              {formatTime(sessionData.time)}
            </p>
            <p>
              <span className="font-semibold">
                {t("classes.session.duration") || "Duration"}:
              </span>{" "}
              {sessionData.duration} {t("classes.session.minutes") || "minutes"}
            </p>
            <p>
              <span className="font-semibold">
                {t("classes.session.location") || "Location"}:
              </span>{" "}
              {typeof sessionData.location === "string"
                ? sessionData.location
                : sessionData.location?.name ||
                  sessionData.location?.address ||
                  ""}
            </p>
            {sessionData.studio && (
              <p>
                <span className="font-semibold">
                  {t("classes.session.studio") || "Studio"}:
                </span>{" "}
                {sessionData.studio}
              </p>
            )}
          </div>
        </div>

        {/* Seat Layout */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t("classes.seatLayout.title") || "Select Your Seats"}
          </h2>

          {/* Legend */}
          <div className="flex gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded border-2 border-gray-300"></div>
              <span className="text-gray-700 dark:text-gray-300">
                {t("classes.seatLayout.available") || "Available"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded border-2 border-gray-300"></div>
              <span className="text-gray-700 dark:text-gray-300">
                {t("classes.seatLayout.selected") || "Selected"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-400 rounded border-2 border-gray-300"></div>
              <span className="text-gray-700 dark:text-gray-300">
                {t("classes.seatLayout.occupied") || "Occupied"}
              </span>
            </div>
          </div>

          {/* Seats Grid */}
          <div className="space-y-4">
            {Object.keys(seatsByRow)
              .sort()
              .map((row) => (
                <div key={row} className="flex items-center gap-2">
                  <div className="w-8 text-center font-semibold text-gray-700 dark:text-gray-300">
                    {row}
                  </div>
                  <div className="flex gap-2">
                    {seatsByRow[row]
                      .sort((a, b) => a.number - b.number)
                      .map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat.id)}
                          disabled={seat.status === "occupied"}
                          className={`w-10 h-10 rounded border-2 transition-all ${
                            seat.status === "available"
                              ? "bg-green-500 hover:bg-green-600 border-gray-300 cursor-pointer"
                              : seat.status === "selected"
                              ? "bg-orange-500 border-orange-600 cursor-pointer"
                              : "bg-gray-400 border-gray-500 cursor-not-allowed opacity-50"
                          }`}
                          title={seat.id}
                        >
                          <span className="text-xs text-white font-semibold">
                            {seat.number}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
          </div>

          {/* Selected Seats Summary */}
          {selectedSeats.length > 0 && (
            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">
                {t("classes.seatLayout.selectedSeats") || "Selected Seats"}:{" "}
                {selectedSeats.join(", ")}
              </p>
            </div>
          )}

          {/* Book Button */}
          {user ? (
            <button
              onClick={handleBooking}
              disabled={selectedSeats.length === 0 || booking}
              className={`mt-6 w-full px-6 py-3 font-semibold rounded-lg transition-colors ${
                selectedSeats.length === 0 || booking
                  ? "bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              }`}
            >
              {booking
                ? t("classes.session.booking") || "Booking..."
                : t("classes.session.bookNow") || "Book Now"}
            </button>
          ) : (
            <button
              onClick={() => router.push("/?auth=login")}
              className="mt-6 w-full px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              {t("classes.booking.loginRequired") || "Please log in to book"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


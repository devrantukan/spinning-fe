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

// Helper function to convert text to uppercase (handles Turkish characters correctly)
function toUpperCaseTurkish(text: string): string {
  if (!text) return text;

  // Normalize the text first: trim whitespace, collapse multiple spaces
  let normalized = text.trim().replace(/\s+/g, " ");

  // Convert to lowercase, handling Turkish characters properly
  // First, manually convert Turkish uppercase characters to their lowercase equivalents
  normalized = normalized
    .replace(/İ/g, "i")  // Turkish İ -> lowercase i (dotted)
    .replace(/I/g, "ı")  // Regular I -> dotless ı
    .toLowerCase();

  // Turkish uppercase mappings
  const turkishUpper: Record<string, string> = {
    ı: "I",  // dotless i -> regular I
    i: "İ",  // dotted i -> Turkish İ
    ş: "Ş",
    ğ: "Ğ",
    ü: "Ü",
    ö: "Ö",
    ç: "Ç",
  };

  let result = normalized
    .split("")
    .map((char) => {
      return turkishUpper[char] || char.toUpperCase();
    })
    .join("");

  // Special case: "ISIN" should use regular I, not Turkish İ
  // This handles words that should use regular I instead of Turkish İ
  result = result.replace(/İSİN\b/g, "ISIN");
  result = result.replace(/İSIN\b/g, "ISIN");

  return result;
}

// Helper function to normalize title (applies Turkish uppercase rules)
function normalizeTitle(title: string): string {
  if (!title) return title;
  return toUpperCaseTurkish(title);
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
  const normalizeSeatType = (type: string | undefined): "normal" | "podium" | "column" | "instructor" | "exclusive" => {
    if (!type) return "normal";
    const typeLower = type.toLowerCase();
    if (typeLower === "instructor" || typeLower === "podium" || typeLower === "column" || typeLower === "exclusive") {
      return typeLower as "normal" | "podium" | "column" | "instructor" | "exclusive";
    }
    return "normal";
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
          number: typeof seatNumber === "string" ? parseInt(seatNumber, 10) || col : seatNumber,
          column: col,
          status: seatData.status === "active" ? "available" : 
                  seatData.status === "inactive" ? "occupied" :
                  seatData.status === "occupied" ? "occupied" :
                  seatData.status || "available",
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
      const existingSeat = seats.find(s => 
        s.id === (seatData.id || `${normalizedRow}${seatData.seatNumber || seatData.number}`) ||
        (s.row === normalizedRow && (s.column || s.number) === column)
      );
      
      if (!existingSeat) {
        // Add seat that wasn't placed in the grid (might be outside grid bounds)
        const seatNumber = seatData.seatNumber || seatData.number || column;
        const seatId = seatData.id || `${normalizedRow}${seatNumber}`;
        seats.push({
          id: seatId,
          row: normalizedRow,
          number: typeof seatNumber === "string" ? parseInt(seatNumber, 10) || column : seatNumber,
          column: column,
          status: seatData.status === "active" ? "available" : 
                  seatData.status === "inactive" ? "occupied" :
                  seatData.status === "occupied" ? "occupied" :
                  seatData.status || "available",
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
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [seatLayoutData, setSeatLayoutData] = useState<SeatLayout | null>(null);

  const sessionId = params?.sessionId as string;
  
  // Debug: Log session ID
  useEffect(() => {
    if (sessionId) {
      console.log("Session ID from URL:", sessionId);
    }
  }, [sessionId]);

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
            maxCapacity: rawSession.maxCapacity,
            currentBookings: rawSession.currentBookings || rawSession._count?.bookings || 0,
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
                  if (!seatLayout.seats || !Array.isArray(seatLayout.seats) || seatLayout.seats.length === 0) {
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
                      console.error("Error fetching seats separately:", seatsError);
                    }
                  }
                  
                  // Log seat data for debugging
                  if (seatLayout.seats && Array.isArray(seatLayout.seats)) {
                    console.log("Seat layout seats from API:", seatLayout.seats);
                    console.log("Seat types found:", seatLayout.seats.map((s: any) => ({ 
                      id: s.id, 
                      row: s.row, 
                      column: s.column, 
                      type: s.type,
                      label: s.label 
                    })));
                  } else {
                    console.log("No seats found in seat layout, will generate grid");
                  }
                  
                  setSeatLayoutData(seatLayout);
                  let generatedSeats = generateSeatLayoutFromData(seatLayout);
                  
                  // Log generated seats for debugging
                  console.log("Generated seats count:", generatedSeats.length);
                  console.log("Seat types in generated seats:", 
                    generatedSeats.filter(s => s.type && s.type !== "normal").map(s => ({
                      id: s.id,
                      row: s.row,
                      column: s.column,
                      type: s.type,
                      label: s.label
                    }))
                  );
                  
                  // Fetch bookings for this session to get occupied seats
                  try {
                    const bookingsResponse = await fetch(`/api/bookings?sessionId=${rawSession.id || sessionId}`);
                    if (bookingsResponse.ok) {
                      const bookingsData = await bookingsResponse.json();
                      const bookings = Array.isArray(bookingsData) ? bookingsData : (bookingsData.bookings || []);
                      
                      if (bookings.length > 0) {
                        const bookedSeatIds = new Set<string>();
                        bookings.forEach((booking: any) => {
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
                            generatedSeats.forEach(seat => {
                              if (seat.row === booking.row && (seat.column || seat.number) === booking.column) {
                                bookedSeatIds.add(seat.id);
                              }
                            });
                          }
                        });
                        
                        // Mark booked seats as occupied
                        generatedSeats = generatedSeats.map(seat => {
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
                    if (rawSession.bookings && Array.isArray(rawSession.bookings)) {
                      const bookedSeatIds = new Set<string>();
                      rawSession.bookings.forEach((booking: any) => {
                        if (booking.seats && Array.isArray(booking.seats)) {
                          booking.seats.forEach((seatId: string) => {
                            bookedSeatIds.add(seatId);
                          });
                        }
                      });
                      
                      generatedSeats = generatedSeats.map(seat => {
                        if (bookedSeatIds.has(seat.id)) {
                          return { ...seat, status: "occupied" };
                        }
                        return seat;
                      });
                    } else if (rawSession.bookedSeats && Array.isArray(rawSession.bookedSeats)) {
                      const bookedSeatIds = new Set(rawSession.bookedSeats);
                      generatedSeats = generatedSeats.map(seat => {
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
          return date.toLocaleTimeString(language === "tr" ? "tr-TR" : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
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
      
      if (language === "tr") {
        // Turkish format: "25 Aralık 2026 Cumartesi"
        const day = date.getDate();
        const monthNames = [
          "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
          "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
        ];
        const weekdayNames = [
          "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"
        ];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const weekday = weekdayNames[date.getDay()];
        return `${day} ${month} ${year} ${weekday}`;
      } else {
        // English format: "Saturday, December 25, 2026"
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
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
          const time = dateTime.toLocaleTimeString(language === "tr" ? "tr-TR" : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
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

    setSeats((prev) => {
      const clickedSeat = prev.find((seat) => seat.id === seatId);
      
      // Only allow selection of normal and exclusive seats
      if (clickedSeat?.type !== "normal" && clickedSeat?.type !== "exclusive") {
        return prev; // Don't allow selection of instructor, podium, or column seats
      }
      
      // If clicking on an already selected seat, deselect it
      if (clickedSeat?.status === "selected") {
        setSelectedSeats([]);
        return prev.map((seat) =>
          seat.id === seatId ? { ...seat, status: "available" } : seat
        );
      }
      
      // If clicking on an available seat
      if (clickedSeat?.status === "available") {
        // Deselect any previously selected seat (only one seat allowed)
        const updatedSeats = prev.map((seat) => {
          if (seat.id === seatId) {
            // Select the clicked seat
            return { ...seat, status: "selected" };
          } else if (seat.status === "selected") {
            // Deselect any previously selected seat
            return { ...seat, status: "available" };
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
      if (selectedSeats.length > 0) {
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
        alert(t("classes.booking.noMember") || "Member account not found.");
        setBooking(false);
        return;
      }

      // Verify the selected seat is still available before booking
      const selectedSeat = seats.find(s => s.id === selectedSeats[0]);
      if (!selectedSeat) {
        alert(t("classes.booking.error") || "Selected seat not found.");
        setBooking(false);
        return;
      }
      
      if (selectedSeat.status !== "available" && selectedSeat.status !== "selected") {
        alert(t("classes.seatLayout.taken") || "This seat is no longer available.");
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
        sessionStorage.removeItem("selectedSeats");
        sessionStorage.removeItem("sessionId");
        alert(t("classes.booking.success") || "Booking successful!");
        router.push("/classes");
      } else {
        // Better error handling
        const errorMessage = data.error || data.message || t("classes.booking.error") || "Booking failed.";
        console.error("Booking error:", data);
        alert(errorMessage);
        
        // If seat is already booked, refresh the seat status
        if (errorMessage.toLowerCase().includes("already booked") || errorMessage.toLowerCase().includes("taken")) {
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
                  {toUpperCaseTurkish(instructorName)}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Session Details and Seat Selection */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8 lg:px-12 lg:py-12">
          {/* Session Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {normalizeTitle(sessionData.title)}
          </h1>

          {/* Instructor Name (visible on mobile) */}
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6 lg:hidden">
            {toUpperCaseTurkish(instructorName)}
          </p>

          {/* Session Details */}
          <div className="mb-8 space-y-3 text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium">{t("classes.session.workoutType") || "Workout Type"}:</span>
              <span>{sessionData.workoutType || t("classes.session.cycling") || "Cycling"}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">{t("classes.session.location") || "Location"}:</span>
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
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">
                {formatDateTime(sessionData.date, sessionData.time)} - {sessionData.duration} {t("classes.session.minutes") || "minutes"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium">
                {(() => {
                  // Use maxCapacity and currentBookings from session if available
                  if (sessionData.maxCapacity !== undefined) {
                    const available = (sessionData.maxCapacity || 0) - (sessionData.currentBookings || 0);
                    return `${available}`;
                  }
                  
                  // Fallback to seat layout capacity
                  if (seatLayoutData?.capacity) {
                    const occupiedCount = seats.filter(s => s.status === "occupied").length;
                    return `${seatLayoutData.capacity - occupiedCount}`;
                  }
                  
                  // Last resort: calculate from available seats (exclusive seats are bookable)
                  const availableSeats = seats.filter(
                    s => s.status === "available" && 
                    s.type !== "instructor" && 
                    s.type !== "podium" && 
                    s.type !== "column"
                  ).length;
                  return `${availableSeats}`;
                })()} {t("classes.session.spacesLeft") || "spaces left"}
              </span>
            </div>
        </div>

        {/* Seat Layout */}
          <div className="bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t("classes.seatLayout.clickToBook") || "Click a slot to book into the event"}
            </p>

          {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">
                {t("classes.seatLayout.available") || "Available"}
              </span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">
                  {t("classes.seatLayout.yourBooking") || "Your booking(s)"}
              </span>
            </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 dark:bg-red-600 rounded"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  {t("classes.seatLayout.taken") || "Taken"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-600 dark:bg-gray-800 rounded flex items-center justify-center">
                  <span className="text-xs text-white font-bold">P</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">
                  {t("classes.seatLayout.podium") || "Podium"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-600 dark:bg-gray-800 rounded flex items-center justify-center">
                  <span className="text-xs text-white font-bold">C</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">
                  {t("classes.seatLayout.column") || "Column"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-800 dark:bg-black rounded"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  {t("classes.seatLayout.instructor") || "Instructor"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  {t("classes.seatLayout.exclusive") || "Exclusive"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 dark:bg-gray-500 rounded-full opacity-40 border-2 border-gray-500 dark:border-gray-400"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  {t("classes.seatLayout.unavailable") || "Unavailable"}
                </span>
              </div>
            </div>

          {/* Seats Grid */}
            <div className="space-y-3 mb-6">
            {Object.keys(seatsByRow)
              .sort()
              .map((row) => (
                  <div key={row} className="flex items-center gap-3">
                    <div className="flex gap-2 flex-wrap">
                    {seatsByRow[row]
                        .sort((a, b) => (a.column || a.number) - (b.column || b.number))
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
                              (seat.type !== "normal" && seat.type !== "exclusive")
                            }
                            className={`w-10 h-10 transition-all flex items-center justify-center ${
                              seat.type === "podium" || seat.type === "column"
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
                                  ? "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 cursor-pointer border-2 border-transparent hover:border-gray-500 rounded-full"
                                  : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 cursor-pointer border-2 border-transparent hover:border-gray-500 opacity-75 rounded-full"
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
                                ? t("classes.seatLayout.unavailable") || "Unavailable"
                                : seat.status === "selected"
                                ? t("classes.seatLayout.selected") || "Selected"
                                : seat.type === "instructor"
                                ? t("classes.seatLayout.instructor") || "Instructor"
                                : seat.type === "podium"
                                ? t("classes.seatLayout.podium") || "Podium"
                                : seat.type === "column"
                                ? t("classes.seatLayout.column") || "Column"
                                : seat.type === "exclusive"
                                ? `${t("classes.seatLayout.exclusive") || "Exclusive"}${seat.creditCost ? ` - ${seat.creditCost} ${t("classes.session.credits") || "Credits"}` : ""}`
                                : seat.status === "available"
                                ? user
                                  ? t("classes.seatLayout.available") || "Available - Click to select"
                                  : t("classes.booking.loginRequired") || "Please log in to select seats"
                                : seat.id
                            }
                          >
                            {seat.type === "podium" || seat.type === "column" ? (
                              <span className="text-xs text-white font-bold">
                                {seat.label || (seat.type === "podium" ? "P" : "C")}
                              </span>
                            ) : (
                              <span className={`text-xs font-semibold ${
                                seat.type === "exclusive" || seat.status === "selected" || seat.status === "occupied"
                                  ? "text-white" 
                                  : seat.status === "available"
                                  ? "text-gray-700 dark:text-gray-300"
                                  : "text-white"
                              }`}>
                            {seat.number}
                          </span>
                            )}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
          </div>

          {/* Selected Seat Summary */}
          {selectedSeats.length > 0 && (
              <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white">
                {t("classes.seatLayout.selectedSeat") || "Selected Seat"}:{" "}
                {selectedSeats[0]}
              </p>
            </div>
          )}

          {/* Book Button */}
          {user ? (
            <button
              onClick={handleBooking}
              disabled={selectedSeats.length === 0 || booking}
                className={`w-full px-6 py-3 font-semibold rounded-lg transition-colors ${
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
              <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  {t("classes.booking.loginRequired") || "Login to see event details"}
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
          )}
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
    </div>
  );
}




